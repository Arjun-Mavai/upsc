'use server';

import { db } from '@/db';
import { tests, questions, contentBlogs, paymentExitReasons, guests } from '@/db/schema';
import { nanoid } from 'nanoid';
import { revalidatePath } from 'next/cache';
import { eq, sql, desc, and, count, or, isNull, ne } from 'drizzle-orm';
import { AdminDashboardResponse } from '@/types/admin';
import { GUEST_LEAD_SOURCE } from '@/lib/lead-source';
import { logger } from '@/lib/logger';
import { parseLenientJSON } from '@/lib/json-utils';
import { assertAdmin } from '@/lib/auth';

// Helper to fetch tests for the dropdown
export async function getExistingTests() {
  await assertAdmin();
  try {
    const result = await db
      .select({
        id: tests.id,
        title: tests.title,
        type: tests.type,
        totalQuestions: sql<number>`count(${questions.id})`.mapWith(Number),
      })
      .from(tests)
      .leftJoin(questions, eq(tests.id, questions.testId))
      .where(eq(tests.examType, 'upsc')) // 🔒 Isolation
      .groupBy(tests.id)
      .orderBy(tests.createdAt);

    return result;
  } catch (e) {
    logger.error('Error fetching tests:', e, { category: 'admin' });
    return [];
  }
}

export async function uploadTestFromJSON(prevState: any, formData: FormData) {
  await assertAdmin();
  try {
    const mode = formData.get('mode') as 'new' | 'existing'; // 'new' or 'existing'
    const existingTestId = formData.get('existingTestId') as string;

    const title = formData.get('title') as string;
    const type = formData.get('type') as 'FLT' | 'UNIT' | 'PYQ' | 'CSAT' | 'TOPIC' | 'MISC';
    const unitId = formData.get('unitId') as string;
    const topicId = formData.get('topicId') as string; // Changed from null/undefined
    const subjectTag = formData.get('subjectTag') as string; // MISC ke liye subject tag
    const jsonInput = formData.get('jsonData') as string;

    // Basic Validation
    if (!jsonInput) {
      return { success: false, message: 'Missing JSON Data' };
    }

    if (mode === 'new' && (!title || !type)) {
      return { success: false, message: 'Missing Title or Type for New Test' };
    }

    if (mode === 'new' && type === 'MISC' && !subjectTag) {
      return { success: false, message: 'Missing Subject Tag for Free Quiz (MISC)' };
    }

    if (mode === 'existing' && !existingTestId) {
      return { success: false, message: 'Select an existing test to add questions to.' };
    }

    let parsedQuestions;
    try {
      parsedQuestions = parseLenientJSON(jsonInput);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Invalid JSON format';
      return { success: false, message: `Invalid JSON: ${msg}` };
    }

    if (!Array.isArray(parsedQuestions)) {
      return { success: false, message: 'JSON must be an array of questions' };
    }

    let testId = existingTestId;
    let testTitle = title;

    // 1. Create Test IF Mode is 'new'
    if (mode === 'new') {
      testId = nanoid();
      const slug =
        title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '') +
        '-' +
        nanoid(4);

      await db.insert(tests).values({
        id: testId,
        title: title,
        slug: slug,
        type: type, // FLT, UNIT, MISC, etc.
        unitId: type === 'UNIT' || type === 'TOPIC' || type === 'MISC' ? unitId : null,
        topicId: type === 'TOPIC' ? topicId : null,
        description: `Imported test: ${title}`,
        totalMarks: 0, // Computed below
        totalQuestions: 0, // Computed below
        durationMinutes: 120,
        examType: 'upsc' as const, // 🔒 Strict isolation
        // MISC type = free quiz → isFreeAccess ON by default
        isFreeAccess: type === 'MISC' ? true : false,
        // Tags — subject tag bhi store karo (filter me kaam aayega)
        tags: subjectTag ? [type, '2026', subjectTag] : [type, '2026'],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } else {
      // Fetch title for success message
      const existing = await db
        .select({ title: tests.title })
        .from(tests)
        .where(eq(tests.id, testId ? testId : 'invalid'))
        .then((res) => res[0]);
      testTitle = existing?.title || 'Unknown Test';
    }

    // Determine starting order
    let startOrder = 0;
    if (mode === 'existing' && testId) {
      const maxOrderResult = await db
        .select({ maxOrder: sql<number>`MAX(${questions.order})` })
        .from(questions)
        .where(eq(questions.testId, testId));
      startOrder = maxOrderResult[0]?.maxOrder || 0;
    }

    const rawExplanationFormat = formData.get('explanationFormat');
    const explanationFormat: 'expert' | 'classic' =
      rawExplanationFormat === 'expert' || rawExplanationFormat === 'classic'
        ? rawExplanationFormat
        : 'classic';

    // 2. Format & Validate Questions
    const formattedQuestions = parsedQuestions.map((q: any, idx: number) => {
      // Validation
      if (!q.questionText || typeof q.questionText !== 'string') {
        throw new Error(
          `Question ${idx + 1} is missing or has invalid "questionText" (must be string)`
        );
      }
      const qText = q.questionText.trim();

      if (!q.options || (typeof q.options !== 'string' && !Array.isArray(q.options))) {
        throw new Error(`Question ${idx + 1} ("${qText.substring(0, 30)}...") is missing "options"`);
      }

      if (q.correctAnswer === undefined || q.correctAnswer === null || q.correctAnswer === '') {
        throw new Error(
          `Question ${idx + 1} ("${qText.substring(0, 30)}...") is missing "correctAnswer"`
        );
      }

      const isExpert = explanationFormat === 'expert';
      // Match uploadTopicTests: Hindi/En markdown in text columns, expert { stream, ... } only in extendedData
      const expertBlob: unknown = (() => {
        if (!isExpert) return null;
        if (q.extendedData != null) return q.extendedData;
        if (
          q.explanation != null &&
          typeof q.explanation === 'object' &&
          !Array.isArray(q.explanation)
        ) {
          return q.explanation;
        }
        return null;
      })();

      const explanationTextForDb = isExpert
        ? (q.explanation_hi ??
            (typeof q.explanation === 'string' ? q.explanation : null) ??
            null)
        : typeof q.explanation === 'string'
          ? q.explanation
          : (q.explanation_hi ?? null);

      const explanationEnForDb = q.explanationEn ?? q.explanation_en ?? null;

      return {
        id: nanoid(),
        testId: testId,
        questionText: qText,
        questionTextEn: q.questionTextEn || null,
        options: typeof q.options === 'string' ? q.options : JSON.stringify(q.options),
        correctAnswer: String(q.correctAnswer).trim(),
        explanation: explanationTextForDb,
        explanationEn: explanationEnForDb,
        extendedData: expertBlob,
        marks: q.marks || 2,
        negativeMarks: q.negativeMarks || 0,
        idealTime: q.idealTime || 60,
        order: startOrder + idx + 1,
        subject: q.subject || 'General',
        type: q.type || 'standard',
        matchPairs: q.matchPairs || null,
        examType: 'upsc' as const,
      };
    });

    // Upsert logic: For each question, check if it exists in this test.
    // Also handle intra-batch duplicates.
    const questionsToUpdate = [];
    const questionsToInsertFinal = [];
    let duplicatesCount = 0;

    const existingQsRows = await db
      .select({ id: questions.id, text: questions.questionText })
      .from(questions)
      .where(eq(questions.testId, testId || ''));

    const existingMap = new Map(existingQsRows.map((q) => [q.text?.trim().toLowerCase(), q.id]));
    const seenInBatch = new Set<string>();

    for (const qData of formattedQuestions) {
      const normalizedText = qData.questionText.trim().toLowerCase();

      // Check if we've already seen this in the CURRENT batch
      if (seenInBatch.has(normalizedText)) {
        duplicatesCount++;
        continue; // Skip batch duplicates
      }
      seenInBatch.add(normalizedText);

      const existingId = existingMap.get(normalizedText);
      if (existingId) {
        questionsToUpdate.push({ id: existingId, data: qData });
        duplicatesCount++;
      } else {
        questionsToInsertFinal.push(qData);
      }
    }

    // 3. Process Updates
    for (const update of questionsToUpdate) {
      const { id, data } = update;
      // Remove ID, testId, and order for update - preserve the existing row's position
      const { id: _, testId: __, order: ___, ...updateData } = data;
      await db.update(questions).set(updateData).where(eq(questions.id, id));
    }

    // 4. Bulk Insert New Questions
    if (questionsToInsertFinal.length > 0) {
      await db.insert(questions).values(questionsToInsertFinal);
    }

    // 5. Update Test Meta (Marks + Count + Timestamp)
    let finalQuestionCount = 0;
    if (testId) {
      // Recompute everything from DB to ensure consistency (especially totalMarks after updates)
      const allQs = await db
        .select({ marks: questions.marks })
        .from(questions)
        .where(eq(questions.testId, testId));

      finalQuestionCount = allQs.length;
      const totalMarks = allQs.reduce((sum, q) => sum + (q.marks || 0), 0);

      await db
        .update(tests)
        .set({
          updatedAt: new Date(),
          totalMarks: totalMarks,
          totalQuestions: finalQuestionCount,
        })
        .where(eq(tests.id, testId));
    } else if (mode === 'new') {
      finalQuestionCount = seenInBatch.size;
    }

    revalidatePath('/tests');
    const dupMsg =
      duplicatesCount > 0 ? ` (${duplicatesCount} duplicates updated/skipped)` : '';
    return {
      success: true,
      message: `Successfully ${mode === 'new' ? 'created' : 'updated'} "${testTitle}". Total Questions: ${finalQuestionCount}${dupMsg}`,
    };
  } catch (error) {
    logger.error('Upload Error:', error, { category: 'admin' });
    return {
      success: false,
      message: `Server Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// --- DASHBOARD STATS ---
// --- DASHBOARD STATS ---
export async function getAdminDashboardStats(): Promise<AdminDashboardResponse> {
  await assertAdmin();
  try {
    const testsData = await db
      .select({
        id: tests.id,
        type: tests.type,
        title: tests.title,
        unitId: tests.unitId,
        topicId: tests.topicId,
        totalQuestions: tests.totalQuestions,
        updatedAt: tests.updatedAt,
      })
      .from(tests)
      .where(eq(tests.examType, 'upsc'));

    const blogsData = await db
      .select({
        id: contentBlogs.id,
        title: contentBlogs.title,
        category: contentBlogs.category,
        contentType: contentBlogs.contentType,
        createdAt: contentBlogs.createdAt,
      })
      .from(contentBlogs)
      .where(eq(contentBlogs.examType, 'upsc'));

    let openPyq2026LeadCount = 0;
    try {
      const [openPyqCountRow] = await db
        .select({ c: count() })
        .from(guests)
        .where(
          and(
            eq(guests.examType, 'upsc'),
            eq(guests.leadSource, GUEST_LEAD_SOURCE.OPEN_PYQ_2026)
          )
        );
      openPyq2026LeadCount = openPyqCountRow?.c ?? 0;
    } catch (guestErr) {
      logger.error('Dashboard Stats Error (Guest Count):', guestErr, { category: 'admin' });
    }

    let recentGuests: any[] = [];
    const DASHBOARD_GUEST_LEAD_LIMIT = 1000;
    try {
      recentGuests = await db
        .select({
          id: guests.id,
          name: guests.name,
          email: guests.email,
          mobile: guests.mobile,
          createdAt: guests.createdAt,
          leadSource: guests.leadSource,
        })
        .from(guests)
        .where(
          and(
            eq(guests.examType, 'upsc'),
            or(isNull(guests.leadSource), ne(guests.leadSource, 'whatsapp_import'))
          )
        )
        .orderBy(desc(guests.createdAt))
        .limit(DASHBOARD_GUEST_LEAD_LIMIT);
    } catch (guestErr) {
      logger.error('Dashboard Stats Error (Recent Guests):', guestErr, { category: 'admin' });
    }

    let recentOpenPyqLeads: any[] = [];
    try {
      recentOpenPyqLeads = await db
        .select({
          id: guests.id,
          name: guests.name,
          email: guests.email,
          mobile: guests.mobile,
          createdAt: guests.createdAt,
          leadSource: guests.leadSource,
        })
        .from(guests)
        .where(
          and(
            eq(guests.examType, 'upsc'),
            eq(guests.leadSource, GUEST_LEAD_SOURCE.OPEN_PYQ_2026)
          )
        )
        .orderBy(desc(guests.createdAt))
        .limit(50);
    } catch (guestErr) {
      logger.error('Dashboard Stats Error (Recent Open PYQ Leads):', guestErr, { category: 'admin' });
    }

    const totalTests = testsData.length;
    const totalQuestions = testsData.reduce((acc, t) => acc + (t.totalQuestions || 0), 0);
    const totalBlogs = blogsData.length;

    const typeCount = {
      FLT: 0,
      UNIT: 0,
      TOPIC: 0,
      CSAT: 0,
      PYQ: 0,
      MISC: 0,
    };

    // Blog category count
    const blogCategoryCount: Record<string, number> = {};
    blogsData.forEach((b) => {
      blogCategoryCount[b.category] = (blogCategoryCount[b.category] || 0) + 1;
    });

    const recentUploads = testsData
      .sort((a, b) => (b.updatedAt?.getTime() || 0) - (a.updatedAt?.getTime() || 0))
      .slice(0, 15); // Increased from 5 to 15 to show more "latest" tests
    const recentBlogs = blogsData
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))
      .slice(0, 5);

    // Topic Coverage Map: Unit -> Set of TopicIds
    const topicCoverage: Record<string, Set<string>> = {};

    testsData.forEach((t) => {
      const normalizedType = t.type?.toUpperCase();
      if (normalizedType && typeCount.hasOwnProperty(normalizedType)) {
        // @ts-ignore
        typeCount[normalizedType]++;
      }
      if (normalizedType === 'TOPIC' && t.unitId && t.topicId) {
        if (!topicCoverage[t.unitId]) {
          topicCoverage[t.unitId] = new Set();
        }
        topicCoverage[t.unitId].add(t.topicId);
      }
    });

    // Convert Sets to Arrays for serialization
    const serializedCoverage: Record<string, string[]> = {};
    for (const [unit, topics] of Object.entries(topicCoverage)) {
      serializedCoverage[unit] = Array.from(topics);
    }

    return {
      success: true,
      stats: {
        totalTests,
        totalQuestions,
        totalBlogs,
        openPyq2026LeadCount,
        typeCount,
        blogCategoryCount,
      },
      recentUploads,
      recentBlogs,
      recentGuests, // Added recentGuests to return
      recentOpenPyqLeads,
      topicCoverage: serializedCoverage,
    };
  } catch (e) {
    logger.error('Dashboard Stats Error:', e, { category: 'admin' });
    return { success: false, error: 'Failed to fetch stats' };
  }
}
// --- PAYMENT EXIT STATS ---
export async function getPaymentExitStats() {
  await assertAdmin();
  try {
    const reasons = await db
      .select()
      .from(paymentExitReasons)
      .where(eq(paymentExitReasons.examType, 'upsc')) // 🔒 Isolation
      .orderBy(desc(paymentExitReasons.createdAt))
      .limit(50);

    // Group by reason
    const breakdown = reasons.reduce((acc: any, curr) => {
      acc[curr.reason] = (acc[curr.reason] || 0) + 1;
      return acc;
    }, {});

    return { success: true, reasons, breakdown };
  } catch (error) {
    logger.error('Failed to fetch payment exit stats:', error, { category: 'admin' });
    return { success: false, error: 'Failed to fetch stats' };
  }
}

// --- MANUAL PASSWORD LINK GENERATOR ---
export async function generateManualPasswordLink(userId: string) {
  await assertAdmin();
  try {
    const { mppscUsers, payments, verificationTokens } = await import('@/db/schema');
    const { v4: uuidv4 } = await import('uuid');
    const { addHours } = await import('date-fns');

    // 1. Verify user exists and is not deleted
    const [user] = await db
      .select()
      .from(mppscUsers)
      .where(and(eq(mppscUsers.id, userId), sql`${mppscUsers.deletedAt} IS NULL`));

    if (!user) {
      return { success: false, error: 'User not found or has been deleted' };
    }

    // 2. Guard: Only for users with a captured payment or non-free plan
    // This prevents unintentional Pro access for free users if the set-password flow defaults to Pro.
    const [latestPayment] = await db
      .select()
      .from(payments)
      .where(and(eq(payments.userId, userId), eq(payments.status, 'captured')))
      .orderBy(desc(payments.createdAt))
      .limit(1);

    if (!latestPayment && user.planTier === 'free') {
      return { 
        success: false, 
        error: 'Manual links are restricted to users with a captured payment or active paid plan.' 
      };
    }

    const token = uuidv4();
    const expires = addHours(new Date(), 24); // Manual links last longer (24h)

    await db.insert(verificationTokens).values({
      identifier: userId,
      token,
      expires,
    });

    const { appPath } = await import('@/lib/app-url');
    const url = `${appPath('auth/set-password')}?token=${token}`;

    logger.info(`Manual password link generated for user: ${userId} by admin`);
    return { success: true, url };
  } catch (error) {
    logger.error('Failed to generate manual link:', error);
    return { success: false, error: 'Failed to generate link' };
  }
}

// --- EMAIL DEBUGGER ---
export async function testResendEmail(targetEmail: string) {
  await assertAdmin();
  try {
    const { Resend } = await import('resend');
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      return { success: false, error: 'RESEND_API_KEY is missing in .env' };
    }

    const resend = new Resend(apiKey);
    const fromName = process.env.EMAIL_FROM_NAME || 'MPPSC ZEN';
    const fromAddress = process.env.RESEND_FROM_EMAIL || 'mppsc@zenscroll.app';
    const fromEmail = `${fromName} <${fromAddress}>`;

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [targetEmail],
      subject: '🛠️ Test Email - MPPSC ZEN Debugger',
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #10b981;">Resend is Working! ✅</h2>
          <p>If you are reading this, your Resend configuration is correct.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #666;">
            <strong>From:</strong> ${fromEmail}<br>
            <strong>Time:</strong> ${new Date().toLocaleString('en-IN')}
          </p>
        </div>
      `,
    });

    if (error) {
      logger.error('Resend Debug Test Failed:', error);
      return {
        success: false,
        error: error.message || 'Resend returned an error',
        details: error,
      };
    }

    return { success: true, data };
  } catch (error: any) {
    logger.error('Test email execution error:', error);
    return { success: false, error: error.message || 'Execution failed' };
  }
}

// --- TELEMETRY / EVENT CONFIGURATION SWITCH ---
export async function getTelemetryStatusAction() {
  await assertAdmin();
  try {
    const { getTelemetryEnabled } = await import('@/lib/system-settings');
    const enabled = await getTelemetryEnabled();
    return { success: true, enabled };
  } catch (error) {
    logger.error('Failed to get telemetry status:', error, { category: 'admin' });
    return { success: false, enabled: true };
  }
}

export async function toggleTelemetryAction(enabled: boolean) {
  await assertAdmin();
  try {
    const { setTelemetryEnabled } = await import('@/lib/system-settings');
    await setTelemetryEnabled(enabled);
    
    logger.info(`Telemetry status toggled by admin: ${enabled}`);
    return { success: true, enabled };
  } catch (error: any) {
    logger.error('Failed to toggle telemetry status:', error, { category: 'admin' });
    return { success: false, error: error.message || 'Failed to update setting' };
  }
}


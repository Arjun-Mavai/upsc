'use server';

import { db } from '@/db';
import { tests, questions, contentBlogs, paymentExitReasons, guests } from '@/db/schema';
import { nanoid } from 'nanoid';
import { revalidatePath } from 'next/cache';
import { eq, sql, desc } from 'drizzle-orm';
import { AdminDashboardResponse } from '@/types/admin';
import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/auth-admin';

// Helper to fetch tests for the dropdown
export async function getExistingTests() {
  await requireAdmin();
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
      .where(eq(tests.examType, 'upsc')) // UPSC-only tests
      .groupBy(tests.id)
      .orderBy(tests.createdAt);

    return result;
  } catch (e) {
    logger.error('Error fetching tests:', e);
    return [];
  }
}

export async function uploadTestFromJSON(prevState: any, formData: FormData) {
  await requireAdmin();
  try {
    const mode = formData.get('mode') as 'new' | 'existing'; // 'new' or 'existing'
    const existingTestId = formData.get('existingTestId') as string | null;

    const title = formData.get('title') as string;
    const type = formData.get('type') as 'FLT' | 'UNIT' | 'PYQ' | 'CSAT' | 'TOPIC' | 'MISC' | 'UPSC_PYQ' | 'UPSC_FLT' | 'UPSC_FREE_QUIZ';
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
      parsedQuestions = JSON.parse(jsonInput);
    } catch (e) {
      return { success: false, message: 'Invalid JSON format' };
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
        unitId: type === 'UNIT' || type === 'TOPIC' || type === 'MISC' || type === 'UPSC_FREE_QUIZ' ? unitId : null,
        topicId: type === 'TOPIC' ? topicId : null,
        description: `Imported test: ${title}`,
        totalMarks: parsedQuestions.length * 2, // Initial marks
        totalQuestions: parsedQuestions.length,
        durationMinutes: 120,
        // MISC/UPSC_FREE_QUIZ type = free quiz → isFreeAccess ON by default
        isFreeAccess: (type === 'MISC' || type === 'UPSC_FREE_QUIZ') ? true : false,
        // Tags — subject tag bhi store karo (filter me kaam aayega)
        tags: subjectTag ? [type, '2026', subjectTag] : [type, '2026'],
        createdAt: new Date(),
        updatedAt: new Date(),
        examType: 'upsc' as const, // UPSC-only repo with proper typing
      });
    } else {
      // Fetch title for success message
      const existing = await db
        .select({ title: tests.title })
        .from(tests)
        .where(eq(tests.id, testId!));
      testTitle = existing[0]?.title || 'Unknown Test';
    }

    // Determine starting order
    let startOrder = 0;
    if (mode === 'existing' && testId) {
      const maxOrderResult = await db
        .select({ maxOrder: sql<number>`MAX(${questions.order})` })
        .from(questions)
        .where(eq(questions.testId, testId!));
      startOrder = maxOrderResult[0]?.maxOrder || 0;
    }

    // 2. Format Questions
    // 2. Validate & Format Questions
    for (const q of parsedQuestions) {
      if (
        !q.questionText ||
        typeof q.questionText !== 'string' ||
        q.questionText.trim().length === 0
      ) {
        return {
          success: false,
          message:
            "Validation Failed: One or more questions are missing 'questionText'. Please check JSON keys.",
        };
      }
    }

    const overwrite = formData.get('overwrite') === 'true';

    const questionsToInsert = parsedQuestions.map((q: any, idx: number) => ({
      id: nanoid(),
      testId: testId,
      questionText: q.questionText,
      questionTextEn: q.questionTextEn || null,
      options: typeof q.options === 'string' ? q.options : JSON.stringify(q.options),
      correctAnswer: q.correctAnswer,
      explanation: typeof q.explanation === 'string' ? q.explanation : JSON.stringify(q.explanation),
      explanationEn: q.explanationEn ? (typeof q.explanationEn === 'string' ? q.explanationEn : JSON.stringify(q.explanationEn)) : null,
      marks: q.marks || 2,
      negativeMarks: q.negativeMarks || 0,
      idealTime: q.idealTime || 60,
      order: startOrder + idx + 1,
      subject: q.subject || 'General',
      type: q.type || 'standard',
      matchPairs: q.matchPairs ? (typeof q.matchPairs === 'string' ? q.matchPairs : JSON.stringify(q.matchPairs)) : null,
      extendedData: q.extendedData ? (typeof q.extendedData === 'string' ? q.extendedData : JSON.stringify(q.extendedData)) : null,
      examType: 'upsc' as const,
    }));

    // Filter or Update duplicates
    let updatedCount = 0;
    let duplicatesCount = 0;

    if (mode === 'existing') {
      const existingQs = await db
        .select({ id: questions.id, text: questions.questionText, textEn: questions.questionTextEn })
        .from(questions)
        .where(eq(questions.testId, testId || ''));
      
      // Map by Hindi text; fallback to English if Hindi matches multiple times or if we need higher precision
      const existingMap = new Map<string, { id: string; text: string | null; textEn: string | null }>();
      existingQs.forEach(q => {
        const key = q.text?.trim().toLowerCase();
        if (key) existingMap.set(key, q);
      });

      const finalQuestionsToInsert: (typeof questions.$inferInsert)[] = [];

      for (const newQ of questionsToInsert) {
        const key = newQ.questionText.trim().toLowerCase();
        const existing = existingMap.get(key);

        if (existing) {
          // Fallback check: if English text exists and is significantly different, maybe it's not a duplicate
          // But usually in this CMS, if Hindi matches, it's the same question.
          // We'll proceed with update if overwrite is on.
          if (overwrite) {
            // Update existing question
            await db.update(questions)
              .set({
                questionTextEn: newQ.questionTextEn,
                options: newQ.options,
                correctAnswer: newQ.correctAnswer,
                explanation: newQ.explanation,
                explanationEn: newQ.explanationEn,
                extendedData: newQ.extendedData,
                matchPairs: newQ.matchPairs,
                subject: newQ.subject,
                order: newQ.order, // Keep ordering fresh
              })
              .where(eq(questions.id, existing.id));
            updatedCount++;
          } else {
            duplicatesCount++;
          }
        } else {
          finalQuestionsToInsert.push(newQ);
        }
      }

      questionsToInsert.length = 0;
      questionsToInsert.push(...finalQuestionsToInsert);
    }

    // 3. Bulk Insert Questions
    let finalQuestionCount = 0;

    if (questionsToInsert.length > 0) {
      await db.insert(questions).values(questionsToInsert);

      // Update Test Meta (Marks + Count + Timestamp)
      const newMarksToAdd = questionsToInsert.reduce((sum, q) => sum + (q.marks || 0), 0);

      // We need current total questions to add to it, or just set it based on COUNT(*)
      // Setting based on COUNT(*) is safer for data consistency.
      if (testId) {
        const countResult = await db
          .select({ count: sql<number>`COUNT(*)` })
          .from(questions)
          .where(eq(questions.testId, testId));
        const totalQ = countResult[0]?.count || 0;
        finalQuestionCount = totalQ;

        await db
          .update(tests)
          .set({
            updatedAt: new Date(),
            totalMarks: sql`${tests.totalMarks} + ${newMarksToAdd}`,
            totalQuestions: totalQ,
          })
          .where(eq(tests.id, testId!));
      }
    } else if (mode === 'new') {
      // If new test but 0 questions inserted (unlikely unless empty JSON), update count
      finalQuestionCount = parsedQuestions.length;
      await db
        .update(tests)
        .set({ totalQuestions: finalQuestionCount })
        .where(eq(tests.id, testId || ''));
    }

    revalidatePath('/tests');
    const dupMsg = duplicatesCount > 0 ? ` (${duplicatesCount} duplicates skipped)` : '';
    return {
      success: true,
      message: `Successfully ${mode === 'new' ? 'created' : 'updated'} "${testTitle}". Total Questions: ${finalQuestionCount}${dupMsg}`,
    };
  } catch (error) {
    logger.error('Upload Error:', error);
    return {
      success: false,
      message: `Server Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// --- DASHBOARD STATS ---
// --- DASHBOARD STATS ---
export async function getAdminDashboardStats(): Promise<AdminDashboardResponse> {
  await requireAdmin();
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
      .where(eq(tests.examType, 'upsc')) // UPSC-only tests

    const blogsData = await db
      .select({
        id: contentBlogs.id,
        title: contentBlogs.title,
        category: contentBlogs.category,
        contentType: contentBlogs.contentType,
        createdAt: contentBlogs.createdAt,
      })
      .from(contentBlogs)
      .where(eq(contentBlogs.examType, 'upsc')); // UPSC-only blogs

    const recentGuests = await db
      .select({
        id: guests.id,
        name: guests.name,
        email: guests.email,
        mobile: guests.mobile,
        createdAt: guests.createdAt,
      })
      .from(guests)
      .where(eq(guests.examType, 'upsc')) // UPSC-only guests
      .orderBy(desc(guests.createdAt))
      .limit(100); // Increased limit to show more history per user request

    const totalTests = testsData.length;
    const totalQuestions = testsData.reduce((acc, t) => acc + (t.totalQuestions || 0), 0);
    const totalBlogs = blogsData.length;

    const typeCount: Record<string, number> = {
      FLT: 0,
      UNIT: 0,
      TOPIC: 0,
      CSAT: 0,
      PYQ: 0,
      MISC: 0,
      UPSC_PYQ: 0,
      UPSC_FLT: 0,
      UPSC_FREE_QUIZ: 0,
    };

    // Blog category count
    const blogCategoryCount: Record<string, number> = {};
    blogsData.forEach((b) => {
      blogCategoryCount[b.category] = (blogCategoryCount[b.category] || 0) + 1;
    });

    const recentUploads = testsData
      .sort((a, b) => (b.updatedAt?.getTime() || 0) - (a.updatedAt?.getTime() || 0))
      .slice(0, 5);
    const recentBlogs = blogsData
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))
      .slice(0, 5);

    // Topic Coverage Map: Unit -> Set of TopicIds
    const topicCoverage: Record<string, Set<string>> = {};

    testsData.forEach((t) => {
      const normalizedType = t.type?.toUpperCase();
      if (normalizedType && normalizedType in typeCount) {
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
        typeCount,
        blogCategoryCount,
      },
      recentUploads,
      recentBlogs,
      recentGuests, // Added recentGuests to return
      topicCoverage: serializedCoverage,
    };
  } catch (e) {
    logger.error('Dashboard Stats Error:', e);
    return { success: false, error: 'Failed to fetch stats' };
  }
}
// --- PAYMENT EXIT STATS ---
export async function getPaymentExitStats() {
  await requireAdmin();
  try {
    const reasons = await db
      .select()
      .from(paymentExitReasons)
      .where(eq(paymentExitReasons.examType, 'upsc'))
      .orderBy(desc(paymentExitReasons.createdAt))
      .limit(50);

    // Group by reason
    const breakdown = reasons.reduce((acc: any, curr) => {
      acc[curr.reason] = (acc[curr.reason] || 0) + 1;
      return acc;
    }, {});

    return { success: true, reasons, breakdown };
  } catch (error) {
    logger.error('Failed to fetch payment exit stats:', error);
    return { success: false, error: 'Failed to fetch stats' };
  }
}

'use server';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎛️ TEST ACCESS ACTIONS — Admin panel se test access flags toggle karo
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// Ye server actions hain bhai — admin panel ka remote control!
// Toggle karo DB flags → turant frontend pe reflect hoga
// Cache invalidation bhi automatic hai (revalidateTag)
//
// Flow:
// Admin UI → toggleTestAccess() → DB update → cache bust → fresh data serve
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { db } from '@/db';
import { tests, questions, syllabusTopics, testAttemptLimits, userAttempts, attemptAnswers, testLeaderboard } from '@/db/schema';
import { eq, inArray, desc } from 'drizzle-orm';
import { revalidateTag } from 'next/cache';
import { requireAdmin } from '@/lib/auth-admin';
import { logger } from '@/lib/logger';
import { cachedData, CACHE } from '@/lib/cache';

/**
 * getAllTestsForAdmin
 * ─────────────────────────────────────────────────────────
 * Bhai, admin ke liye sab tests fetch karo — access flags ke saath
 * No caching! Admin ko always fresh data chahiye
 */
export async function getAllTestsForAdmin() {
  await requireAdmin();

  const allTests = await db
    .select({
      id: tests.id,
      title: tests.title,
      titleEn: tests.titleEn,
      type: tests.type,
      unitId: tests.unitId,
      topicId: tests.topicId,
      slug: tests.slug,
      totalQuestions: tests.totalQuestions,
      isPro: tests.isPro,
      maxRetries: tests.maxRetries,
      isFreeAccess: tests.isFreeAccess,
      isLiteAccess: tests.isLiteAccess,
      isProAccess: tests.isProAccess,
      isHidden: tests.isHidden,
      displayOrder: tests.displayOrder,
      tags: tests.tags,
      createdAt: tests.createdAt,
    })
    .from(tests)
    .where(eq(tests.examType, 'upsc')) // UPSC-only tests for admin
    .orderBy(desc(tests.createdAt));

  // TOPIC tests ke liye syllabusTopics se proper name fetch karo
  const topicTestIds = allTests
    .filter((t) => t.type === 'TOPIC' && t.topicId)
    .map((t) => t.topicId!);

  let topicNameMap: Record<string, { title: string; titleEn: string | null }> = {};
  if (topicTestIds.length > 0) {
    const topics = await db
      .select({
        id: syllabusTopics.id,
        title: syllabusTopics.title,
        titleEn: syllabusTopics.titleEn,
      })
      .from(syllabusTopics)
      .where(inArray(syllabusTopics.id, topicTestIds));

    topicNameMap = topics.reduce(
      (acc, t) => {
        acc[t.id] = { title: t.title, titleEn: t.titleEn };
        return acc;
      },
      {} as Record<string, { title: string; titleEn: string | null }>
    );
  }

  return allTests.map((t) => ({
    ...t,
    tags: (t.tags as string[] | null), // JSON → typed array at boundary
    topicName: t.topicId ? (topicNameMap[t.topicId]?.title ?? null) : null,
    topicNameEn: t.topicId ? (topicNameMap[t.topicId]?.titleEn ?? null) : null,
  }));
}

/**
 * toggleTestAccess
 * ─────────────────────────────────────────────────────────
 * Single flag toggle karo — ek click me free/lite/pro access on/off
 *
 * Kya hota hai toggle ke baad?
 * 1. DB me flag update
 * 2. 'tests' cache tag bust → getCachedFLTTests/PYQ/CSAT sab re-fetch honge
 * 3. Next request pe fresh data milega — no stale access!
 */
export async function toggleTestAccess(
  testId: string,
  field: 'isFreeAccess' | 'isLiteAccess' | 'isProAccess',
  value: boolean
) {
  await requireAdmin();

  await db
    .update(tests)
    .set({ [field]: value })
    .where(eq(tests.id, testId));

  // Cache bust — sab test lists fresh ho jayenge
  revalidateTag('tests', { expire: 0 });
  revalidateTag('tests-list', { expire: 0 });
  revalidateTag('syllabus-topics', { expire: 0 });

  logger.info(`Test access updated: ${testId} → ${field}=${value}`);

  return { success: true };
}

/**
 * bulkUpdateTestAccess
 * ─────────────────────────────────────────────────────────
 * Ek type ke sab tests ka access ek saath set karo
 * Example: "Sab FLT tests ko Lite access de do"
 */
export async function bulkUpdateTestAccess(
  testType: 'FLT' | 'UNIT' | 'CSAT' | 'PYQ' | 'TOPIC' | 'MISC' | 'UPSC_PYQ' | 'UPSC_FLT',
  field: 'isFreeAccess' | 'isLiteAccess' | 'isProAccess',
  value: boolean
) {
  await requireAdmin();

  await db
    .update(tests)
    .set({ [field]: value })
    .where(eq(tests.type, testType));

  revalidateTag('tests', { expire: 0 });
  revalidateTag('tests-list', { expire: 0 });
  revalidateTag('syllabus-topics', { expire: 0 });

  logger.info(`Bulk access updated: ${testType} → ${field}=${value}`);

  return { success: true };
}

/**
 * toggleTestHidden — Test ko hide/unhide karo
 * Hidden tests user ko nahi dikhenge — admin ke liye visible rahenge
 */
export async function toggleTestHidden(testId: string, isHidden: boolean) {
  await requireAdmin();

  await db.update(tests).set({ isHidden }).where(eq(tests.id, testId));

  // yaha tests ka cache burst ho raha h

  revalidateTag('tests', { expire: 0 }); // ✅ 'tests' — FLT/PYQ/CSAT use karte h
  revalidateTag('tests-list', { expire: 0 }); // ✅ 'tests-list' — getCachedFLTTests use karta h
  revalidateTag('syllabus-topics', { expire: 0 }); // 🔥 FIX: TOPIC tests use this tag!

  logger.info(`Test hidden toggled: ${testId} → isHidden=${isHidden}`);
  return { success: true };
}

/**
 * updateTestTitle — Test ka title change karo (Bilingual)
 */
export async function updateTestTitle(testId: string, title: string, titleEn: string | null) {
  await requireAdmin();

  if (!title.trim()) return { success: false, error: 'Hindi Title cannot be empty' };

  await db
    .update(tests)
    .set({
      title: title.trim(),
      titleEn: titleEn ? titleEn.trim() : null,
      updatedAt: new Date(),
    })
    .where(eq(tests.id, testId));

  revalidateTag('tests', { expire: 0 });
  revalidateTag('tests-list', { expire: 0 });

  logger.info(`Test title updated: ${testId} → "${title}" / "${titleEn}"`);
  return { success: true };
}

/**
 * updateTestDisplayOrder — Test ka display order change karo
 */
export async function updateTestDisplayOrder(testId: string, displayOrder: number) {
  await requireAdmin();

  await db.update(tests).set({ displayOrder }).where(eq(tests.id, testId));

  revalidateTag('tests', { expire: 0 });
  revalidateTag('tests-list', { expire: 0 });

  logger.info(`Test displayOrder updated: ${testId} → ${displayOrder}`);
  return { success: true };
}

// ── Attempt Limits (Source of Truth) ─────────────────────────

/**
 * getCachedAttemptLimits — Cached fetch of attempt limits
 */
export const getCachedAttemptLimits = cachedData(
  async () => {
    const rows = await db.select().from(testAttemptLimits);
    return rows.reduce(
      (acc, r) => {
        acc[r.testType] = r.maxAttempts;
        return acc;
      },
      {} as Record<string, number | null>
    );
  },
  ['attempt-limits'],
  CACHE.ATTEMPT_LIMITS.GET_ALL.tags,
  CACHE.ATTEMPT_LIMITS.GET_ALL.revalidate
);

/**
 * getAttemptLimits — Admin ke liye fresh (no cache)
 */
export async function getAttemptLimits() {
  await requireAdmin();
  const rows = await db.select().from(testAttemptLimits);
  return rows.reduce(
    (acc, r) => {
      acc[r.testType] = r.maxAttempts;
      return acc;
    },
    {} as Record<string, number | null>
  );
}

/**
 * updateAttemptLimit — Ek test type ka max attempts set karo
 * null = unlimited
 */
export async function updateAttemptLimit(
  testType: 'FLT' | 'UNIT' | 'CSAT' | 'PYQ' | 'TOPIC' | 'MISC' | 'UPSC_PYQ' | 'UPSC_FLT',
  maxAttempts: number | null
) {
  await requireAdmin();

  await db
    .update(testAttemptLimits)
    .set({ maxAttempts })
    .where(eq(testAttemptLimits.testType, testType));

  revalidateTag('attempt-limits', { expire: 0 });
  revalidateTag('tests', { expire: 0 });
  revalidateTag('tests-list', { expire: 0 });

  logger.info(`Attempt limit updated: ${testType} → ${maxAttempts ?? 'unlimited'}`);
  return { success: true };
}

/**
 * bulkUpdateMaxRetries — Ek type ke sab tests ka maxRetries ek saath set karo
 * null = unlimited
 */
export async function bulkUpdateMaxRetries(
  testType: 'FLT' | 'UNIT' | 'CSAT' | 'PYQ' | 'TOPIC' | 'MISC' | 'UPSC_PYQ' | 'UPSC_FLT',
  maxRetries: number | null
) {
  await requireAdmin();

  await db.update(tests).set({ maxRetries }).where(eq(tests.type, testType));

  revalidateTag('tests', { expire: 0 });
  revalidateTag('tests-list', { expire: 0 });

  logger.info(`Bulk maxRetries updated: ${testType} → ${maxRetries ?? 'unlimited'}`);
  return { success: true };
}

/**
 * deleteTest — Test ko permanently delete karo (cascade se questions bhi ud jayenge)
 *
 * Deletion order (FK constraints handle karte h):
 * 1. attempt_answers → userAttempts pe cascade h
 * 2. user_attempts → tests pe cascade h
 * 3. questions → tests pe cascade h
 * 4. leaderboard entries manually delete (no FK)
 * 5. test row itself
 *
 * SQLite me ON DELETE CASCADE enabled h, so questions + userAttempts + attemptAnswers
 * automatically delete ho jayenge. Leaderboard manually karna padta h.
 */
export async function deleteTest(testId: string) {
  await requireAdmin();

  try {
    // Pehle check karo test exist karta h ya nahi
    const test = await db
      .select({ id: tests.id, title: tests.title, type: tests.type })
      .from(tests)
      .where(eq(tests.id, testId))
      .get();

    if (!test) {
      return { success: false, error: 'Test not found bhai' };
    }

    // Leaderboard entries manually delete (no FK constraint on testId)
    await db.delete(testLeaderboard).where(eq(testLeaderboard.testId, testId));

    // Test delete — CASCADE se questions, userAttempts, attemptAnswers sab ud jayenge
    await db.delete(tests).where(eq(tests.id, testId));

    // Cache bust — sab test lists fresh ho jayenge
    revalidateTag('tests', { expire: 0 });
    revalidateTag('tests-list', { expire: 0 });
    revalidateTag('syllabus-topics', { expire: 0 });

    logger.info(`Test deleted: ${testId} → "${test.title}" (${test.type})`);
    return { success: true };
  } catch (error: any) {
    logger.error('Delete Test Error:', error);
    return { success: false, error: error.message || 'Test delete fail ho gaya' };
  }
}

/**
 * getTestWithQuestions — Edit ke liye test + questions fetch karo
 * Questions ko JSON array me convert karke bhejta h — same format jaise upload karte ho
 */
export async function getTestWithQuestions(testId: string) {
  await requireAdmin();

  const test = await db
    .select({
      id: tests.id,
      title: tests.title,
      titleEn: tests.titleEn,
      type: tests.type,
      unitId: tests.unitId,
      topicId: tests.topicId,
      description: tests.description,
      tags: tests.tags,
    })
    .from(tests)
    .where(eq(tests.id, testId))
    .get();

  if (!test) return { success: false as const, error: 'Test not found' };

  const qs = await db
    .select()
    .from(questions)
    .where(eq(questions.testId, testId))
    .orderBy(questions.order);

  // Questions ko upload-compatible JSON format me convert karo
  const questionsJson = qs.map((q) => ({
    questionText: q.questionText,
    questionTextEn: q.questionTextEn || undefined,
    options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
    correctAnswer: q.correctAnswer,
    explanation: q.explanation || undefined,
    explanationEn: q.explanationEn || undefined,
    marks: q.marks,
    negativeMarks: q.negativeMarks,
    idealTime: q.idealTime,
    subject: q.subject || undefined,
    type: q.type || 'standard',
    matchPairs: q.matchPairs || undefined,
    order: q.order,
  }));

  return { success: true as const, test, questionsJson };
}

/**
 * updateTestContent — Test ke questions replace karo (full overwrite)
 * Purane sab questions delete → naye insert — simple aur safe
 */
export async function updateTestContent(
  testId: string,
  data: { questionsJson: string }
) {
  await requireAdmin();

  try {
    const test = await db
      .select({ id: tests.id, title: tests.title })
      .from(tests)
      .where(eq(tests.id, testId))
      .get();

    if (!test) return { success: false, error: 'Test not found' };

    let parsed;
    try {
      parsed = JSON.parse(data.questionsJson);
    } catch {
      return { success: false, error: 'Invalid JSON format bhai' };
    }

    if (!Array.isArray(parsed) || parsed.length === 0) {
      return { success: false, error: 'JSON array of questions chahiye (non-empty)' };
    }

    // Validate ki har question me questionText h
    for (const q of parsed) {
      if (!q.questionText || typeof q.questionText !== 'string' || !q.questionText.trim()) {
        return { success: false, error: "Ek question me 'questionText' missing h" };
      }
    }

    // Step 1: Purane questions delete karo
    await db.delete(questions).where(eq(questions.testId, testId));

    // Step 2: Naye questions insert karo
    const { nanoid } = await import('nanoid');
    const newQuestions = parsed.map((q: any, idx: number) => ({
      id: nanoid(),
      testId,
      questionText: q.questionText,
      questionTextEn: q.questionTextEn || null,
      options: JSON.stringify(q.options),
      correctAnswer: q.correctAnswer,
      explanation: q.explanation || null,
      explanationEn: q.explanationEn || null,
      marks: q.marks || 2,
      negativeMarks: q.negativeMarks || 0,
      idealTime: q.idealTime || 60,
      order: q.order || idx + 1,
      subject: q.subject || 'General',
      type: q.type || 'standard',
      matchPairs: q.matchPairs || null,
    }));

    await db.insert(questions).values(newQuestions);

    // Step 3: Test metadata update (marks + count)
    const totalMarks = newQuestions.reduce((sum: number, q: any) => sum + (q.marks || 0), 0);
    await db
      .update(tests)
      .set({
        totalQuestions: newQuestions.length,
        totalMarks,
        updatedAt: new Date(),
      })
      .where(eq(tests.id, testId));

    // Cache bust
    revalidateTag('tests', { expire: 0 });
    revalidateTag('tests-list', { expire: 0 });
    revalidateTag('syllabus-topics', { expire: 0 });

    logger.info(`Test content updated: ${testId} → ${newQuestions.length} questions`);
    return { success: true };
  } catch (error: any) {
    logger.error('Update Test Content Error:', error);
    return { success: false, error: error.message || 'Update fail ho gaya' };
  }
}

/**
 * toggleInstantMode — Test ke tags me 'no-instant-mode' add/remove karo
 *
 * Tags JSON array h tests table me (e.g. ["MISC", "2026", "History"])
 * 'no-instant-mode' tag present → instant mode disabled for that test
 * Tag absent → instant mode allowed (default behavior)
 *
 * No migration needed — tags column already exist karta h!
 */
export async function toggleInstantMode(testId: string, disable: boolean) {
  await requireAdmin();

  try {
    const test = await db
      .select({ tags: tests.tags })
      .from(tests)
      .where(eq(tests.id, testId))
      .get();

    if (!test) return { success: false, error: 'Test not found' };

    // Tags ko array me convert karo (null/invalid handle)
    let currentTags: string[] = [];
    if (Array.isArray(test.tags)) {
      currentTags = test.tags as string[];
    }

    if (disable) {
      // Tag add karo (agar pehle se nahi h)
      if (!currentTags.includes('no-instant-mode')) {
        currentTags.push('no-instant-mode');
      }
    } else {
      // Tag remove karo
      currentTags = currentTags.filter((t) => t !== 'no-instant-mode');
    }

    await db
      .update(tests)
      .set({ tags: currentTags, updatedAt: new Date() })
      .where(eq(tests.id, testId));

    revalidateTag('tests', { expire: 0 });
    revalidateTag('tests-list', { expire: 0 });

    logger.info(`Instant mode ${disable ? 'disabled' : 'enabled'}: ${testId}`);
    return { success: true };
  } catch (error: any) {
    logger.error('Toggle Instant Mode Error:', error);
    const errorMessage =
      error && typeof error.message === 'string' && error.message.trim()
        ? error.message
        : String(error || 'Unknown error while toggling instant mode');
    return { success: false, error: errorMessage };
  }
}

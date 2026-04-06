'use server';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🆓 FREE QUIZ ACTIONS — Lead generation ke liye free tests
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// Public actions — koi bhi access kar sakta h (no auth needed)
// MISC type ke tests jo isFreeAccess=true hain wahi dikhenge
// unstable_cache se cached — same pattern as FLT/PYQ/CSAT
// Tag 'tests' se admin upload/edit pe auto-invalidate hota h
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { db } from '@/db';
import { tests, questions } from '@/db/schema';
import { eq, and, desc, or, inArray } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';
import { logger } from '@/lib/logger';

/**
 * getCachedFreeQuizzes — unstable_cache se cached MISC/UPSC_FREE_QUIZ tests
 * 60s revalidate + 'tests' tag — admin se test add/edit hone pe bust hota h
 * Same pattern as getCachedFLTTests, getCachedPYQTests
 */
export const getCachedFreeQuizzes = unstable_cache(
  async () => {
    return await db
      .select({
        id: tests.id,
        title: tests.title,
        titleEn: tests.titleEn,
        slug: tests.slug,
        description: tests.description,
        totalQuestions: tests.totalQuestions,
        unitId: tests.unitId,
        tags: tests.tags,
        createdAt: tests.createdAt,
      })
      .from(tests)
      .where(
        and(
          inArray(tests.type, ['MISC', 'UPSC_FREE_QUIZ']), 
          eq(tests.isFreeAccess, true), 
          eq(tests.isHidden, false),
          eq(tests.examType, 'upsc') // UPSC-only tests
        )
      )
      .orderBy(desc(tests.createdAt));
  },
  ['free-tests-list'],
  { revalidate: 60, tags: ['tests'] }
);

/**
 * getFreeQuizWithQuestions — Ek specific free test + uske questions
 * Quiz play page pe use hoga — questions load karne ke liye
 * NOW CACHED for performance - revalidates every 5 minutes
 */
const fetchFreeQuizData = async (testId: string) => {
  const test = await db
    .select()
    .from(tests)
    .where(
      and(
        eq(tests.id, testId), 
        inArray(tests.type, ['MISC', 'UPSC_FREE_QUIZ']), 
        eq(tests.isFreeAccess, true), 
        eq(tests.isHidden, false),
        eq(tests.examType, 'upsc') // UPSC-only tests
      )
    )
    .get();

  if (!test) return null;

  const testQuestions = await db
    .select()
    .from(questions)
    .where(and(eq(questions.testId, testId), eq(questions.examType, 'upsc'))) // UPSC-only questions
    .orderBy(questions.order);

  return { ...test, questions: testQuestions };
};

export const getCachedFreeQuizWithQuestions = unstable_cache(
  fetchFreeQuizData,
  ['free-quiz-with-questions'],
  { revalidate: 300, tags: ['tests'] }
);

export async function getFreeQuizWithQuestions(testId: string) {
  try {
    return await getCachedFreeQuizWithQuestions(testId);
  } catch (error) {
    logger.error('getFreeQuizWithQuestions Error:', error);
    return null;
  }
}

'use server';

import { db } from '@/db';
import { tests, userAttempts, questions, attemptAnswers, syllabusTopics } from '@/db/schema';
import { eq, asc, desc, and, inArray, sql } from 'drizzle-orm';
import { unstable_cache, revalidateTag } from 'next/cache';
import { verifyAuth } from '@/lib/auth';
import { SCORING_CONFIG, mapCorrectAnswerToIndex, getExamScoring } from '@/lib/quiz-scoring';
import { logger } from '@/lib/logger';
import { insertUserToLeaderboard } from '@/actions/leaderboard-actions';
import { getExamContext } from '@/lib/exam-context';

// --- Generic Cached Fetchers ---

export const getCachedPYQTests = unstable_cache(
  async (examId?: string) => {
    const testType = examId === 'upsc' ? 'UPSC_PYQ' : 'PYQ';
    const pyqTests = await db
      .select()
      .from(tests)
      .where(and(eq(tests.type, testType), eq(tests.isHidden, false)))
      .orderBy(asc(tests.displayOrder), desc(tests.createdAt));

    return pyqTests.map((test) => ({
      ...test,
      year: test.title.match(/\d{4}/)?.[0] || new Date(test.createdAt!).getFullYear().toString(),
    }));
  },
  ['pyq-tests-list'],
  { revalidate: 60, tags: ['tests'] }
);

export const getCachedFLTTests = unstable_cache(
  async (examId?: string) => {
    const testType = examId === 'upsc' ? 'UPSC_FLT' : 'FLT';
    return await db
      .select()
      .from(tests)
      .where(and(eq(tests.type, testType), eq(tests.isHidden, false)))
      .orderBy(asc(tests.displayOrder));
  },
  ['flt-tests-list'],
  { revalidate: 60, tags: ['tests'] }
);

export const getCachedCSATTests = unstable_cache(
  async () => {
    return await db
      .select()
      .from(tests)
      .where(and(eq(tests.type, 'CSAT'), eq(tests.isHidden, false)))
      .orderBy(asc(tests.displayOrder), desc(tests.createdAt));
  },
  ['csat-tests-list'],
  { revalidate: 60, tags: ['tests'] }
);

// --- Dynamic User Data Fetchers ---

export async function getUserAttempts(testIds: string[], userId?: string) {
  let finalUserId = userId;

  if (!finalUserId) {
    const user = await verifyAuth();
    if (!user) return {};
    finalUserId = user.id;
  }

  if (testIds.length === 0) return {};

  const attempts = await db
    .select({
      testId: userAttempts.testId,
      count: sql<number>`count(*)`,
    })
    .from(userAttempts)
    .where(and(eq(userAttempts.userId, finalUserId), inArray(userAttempts.testId, testIds)))
    .limit(100)

    .groupBy(userAttempts.testId);

  // Return as a Record<string, number> for easy client-side mapping
  return attempts.reduce(
    (acc, curr) => {
      acc[curr.testId] = Number(curr.count);
      return acc;
    },
    {} as Record<string, number>
  );
}

/**
 * getUserAttemptsByType
 * Faster way to get all attempts for a specific type (FLT, PYQ, etc)
 */
export async function getUserAttemptsByType(
  type: string,
  userId: string,
  examId?: string
) {
  const isUPSC = examId === 'upsc';
  const targetType = isUPSC ? `UPSC_${type}` : type;

  const attempts = await db
    .select({
      testId: userAttempts.testId,
      count: sql<number>`count(*)`,
    })
    .from(userAttempts)
    .innerJoin(tests, eq(userAttempts.testId, tests.id))
    .where(and(eq(userAttempts.userId, userId), eq(tests.type, targetType as any)))
    .limit(1000)
    .groupBy(userAttempts.testId);

  return attempts.reduce(
    (acc, curr) => {
      acc[curr.testId] = Number(curr.count);
      return acc;
    },
    {} as Record<string, number>
  );
}

import { z } from 'zod';

const testIdSchema = z.string().uuid().or(z.string().min(1)); // Allow non-UUID IDs if legacy support needed, but prefer UUID
const unitIdSchema = z.string().min(1);

export async function getTestByUnitId(unitId: string) {
  const validatedUnitId = unitIdSchema.parse(unitId);

  const test = await db.query.tests.findFirst({
    where: and(
      eq(tests.unitId, validatedUnitId),
      // We look for 'UNIT' type tests specifically.
      // If multiple exist, we take the first one (usually there's only one "Unit Test" per unit).
      eq(tests.type, 'UNIT')
    ),
    with: {
      questions: {
        orderBy: asc(questions.order),
      },
    },
  });

  return test || null;
}

// --- Cached Test with Questions ---
// Heavy function called on every quiz start - MUST be cached

const fetchTestWithQuestionsData = async (testId: string) => {
  const validatedId = testIdSchema.parse(testId);

  // Fetch Test with questions in single query
  const test = await db.query.tests.findFirst({
    where: eq(tests.id, validatedId),
    with: {
      questions: {
        orderBy: asc(questions.order),
      },
    },
  });

  if (!test) return null;

  // Enriched Logic: If it's a Topic Test, fetch the topic title
  if (test.topicId) {
    const topic = await db.query.syllabusTopics.findFirst({
      where: eq(syllabusTopics.id, test.topicId),
      columns: {
        title: true,
        titleEn: true,
      },
    });

    if (topic) {
      const cleanTitle = topic.titleEn || topic.title;
      if (cleanTitle) {
        test.title = `${cleanTitle} Practice Test`;
      }
    }
  }

  return test;
};

// Cached version - revalidates every 5 minutes, invalidates on test update
export const getCachedTestWithQuestions = unstable_cache(
  fetchTestWithQuestionsData,
  ['test-with-questions'],
  { revalidate: 300, tags: ['tests'] }
);

export async function getTestWithQuestions(testId: string) {
  try {
    return await getCachedTestWithQuestions(testId);
  } catch (error) {
    logger.error('Invalid Test ID or DB Error:', error);
    return null;
  }
}

export async function submitTestAttempt(
  testId: string,
  userId: string,
  answers: Record<string, string>,
  durationSeconds: number,
  questionTimes: Record<string, number>
) {
  try {
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🔒 IDOR Prevention: Verify userId from JWT matches parameter
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Bhai, bina ye check ke koi Postman se kisi aur ka userId bhej ke
    // uski attempt count badha sakta tha! Ab JWT se userId verify hota hai.
    //
    // Attack scenario (before fix):
    //   POST /submitTestAttempt body: { userId: "victim-123", ... }
    //   → Attacker's request inserts attempt for victim's account!
    //
    // Fix: JWT se nikalo asli userId, match karo parameter se
    const session = await verifyAuth();
    if (!session) {
      return { error: 'Unauthorized — please login to submit test' };
    }
    if (session.id !== userId) {
      // 🚨 Someone tried to submit as a different user!
      logger.warn('IDOR attempt: userId mismatch in test submission', {
        category: 'system',
        metadata: {
          jwtUserId: session.id,
          paramUserId: userId,
          testId,
        },
      });
      return { error: 'Unauthorized — userId mismatch' };
    }

    // 🛡️ CRITICAL FIX: Prevent Double Submit (Race Condition Protection)
    // Bhai, agar user ne 30 second pehle hi submit kiya hai, to dobara nahi hone denge!
    // SQLite's datetime('now') uses UTC, which might mismatch DB if not careful.
    // JS Date.now() is reliable for relative comparison.
    const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);

    const recentAttempt = await db.query.userAttempts.findFirst({
      where: and(
        eq(userAttempts.userId, userId),
        eq(userAttempts.testId, testId),
        eq(userAttempts.isCompleted, true),
        sql`${userAttempts.endTime} > ${thirtySecondsAgo}`
      ),
    });

    if (recentAttempt) {
      logger.warn('Duplicate test submission attempt blocked', {
        category: 'system',
        metadata: { userId, testId, recentAttemptId: recentAttempt.id },
      });
      return { error: 'Test already submitted recently. Please wait.' };
    }

    // 1. Fetch Test and Correct Answers from DB (Secure)
    const test = await db.query.tests.findFirst({ where: eq(tests.id, testId) });
    if (!test) return { error: 'Test not found' };

    const exam = await getExamContext();
    const scoring = getExamScoring(exam, test.type);
// 1. Fetch Correct Answers from DB (Secure)
const testQuestions = await db
  .select({
    id: questions.id,
    correctAnswer: questions.correctAnswer,
    options: questions.options,
    marks: questions.marks,
    negativeMarks: questions.negativeMarks,
  })
  .from(questions)
  .where(eq(questions.testId, testId));

if (testQuestions.length === 0) return { error: 'Test not found' };

// 2. Calculate Score
let totalScore = 0;
let correctCount = 0;
let incorrectCount = 0;

const answersList: {
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
  timeTaken: number;
}[] = [];

testQuestions.forEach((q) => {
  const userAnswer = answers[q.id];
  if (userAnswer !== undefined) {
    // Use mapCorrectAnswerToIndex which converts A/B/C/D or 0/1/2/3 to index
    const isCorrect = Number(userAnswer) === mapCorrectAnswerToIndex(q.correctAnswer);

    if (isCorrect) {
          // Strict Scoring as per User Request ("Global Standard")
          // Use per-question marks if available, fallback to exam-specific scoring
          const marks = q.marks ?? scoring.marksPerQuestion;
          totalScore += marks;
          correctCount++;
        } else {
          // Strict Negative Marking
          // Use per-question negative marks if available, fallback to exam-specific scoring
          const deduction = q.negativeMarks ?? scoring.negativeMarking;
          totalScore -= deduction;
          incorrectCount++;
        }

        answersList.push({
          questionId: q.id,
          userAnswer: String(userAnswer),
          isCorrect,
          timeTaken: Math.round(questionTimes[q.id] || 0),
        });
      }
    });

    // 🛡️ Server-Side Timer Validation (Prevent Time Manipulation)
    // Bhai, client se jo time aaya hai wo sahi hai ya nahi check karo!
    const maxDuration = (test?.durationMinutes || 60) * 60; // Convert to seconds
    const validDuration = Math.min(Math.max(durationSeconds, 0), maxDuration);

    if (validDuration !== durationSeconds) {
      logger.warn('Invalid test duration detected', {
        category: 'system',
        metadata: {
          userId,
          testId,
          submittedDuration: durationSeconds,
          validatedDuration: validDuration,
        },
      });
    }

    // 3. Create Attempt Record
    const attemptId = crypto.randomUUID();

    // Transaction to ensure data consistency
    await db.transaction(async (tx) => {
      // Create Attempt
      await tx.insert(userAttempts).values({
        id: attemptId,
        userId,
        testId,
        startTime: new Date(Date.now() - validDuration * 1000), // Use validated duration
        endTime: new Date(),
        score: parseFloat(totalScore.toFixed(2)),
        isCompleted: true,
      });

      // Bulk Insert Answers (if supported by DB/Drizzle driver, otherwise loop)
      if (answersList.length > 0) {
        // Drizzle supports bulk insert
        // Need to map to table columns
        /*
                 export const attemptAnswers = sqliteTable('attempt_answers', {
                    id: text('id').primaryKey(),
                    attemptId: ...
                    questionId: ...
                    userAnswer: ...
                    isCorrect: ...
                    timeTakenSeconds: ...
                 */
        await tx.insert(attemptAnswers).values(
          answersList.map((a) => ({
            id: crypto.randomUUID(),
            attemptId,
            questionId: a.questionId,
            userAnswer: a.userAnswer,
            isCorrect: a.isCorrect,
            timeTakenSeconds: a.timeTaken,
          }))
        );
      }
    });

    // 4. Parallelize post-submission tasks (Leaderboard, Analytics, Revalidation)
    // Bhai, ye sab kaam parallel mein honge to user ko result 200-300ms jaldi dikhega
    const postSubmissionTasks = [];

    if (session && session.name) {
      const totalTestMarks = testQuestions.reduce(
        (sum, q) => sum + (q.marks ?? scoring.marksPerQuestion),
        0
      );

      postSubmissionTasks.push(
        insertUserToLeaderboard({
          testId,
          userId,
          displayName: session.name,
          score: parseFloat(totalScore.toFixed(2)),
          timeTaken: validDuration,
          totalMarks: totalTestMarks,
        })
      );
    }

    // Invalidate User Analytics Cache
    postSubmissionTasks.push(revalidateTag(`analytics-${userId}`, { expire: 0 }));

    // Run all tasks in parallel
    await Promise.allSettled(postSubmissionTasks);

    return { success: true, attemptId, score: parseFloat(totalScore.toFixed(2)) };
  } catch (error) {
    logger.error('Error submitting test:', error);
    return { error: 'Failed to submit test' };
  }
}

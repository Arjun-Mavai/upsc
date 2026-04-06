'use server';

import { db } from '@/db';
import { mppscUsers, userAttempts, tests, attemptAnswers, questions } from '@/db/schema';
import { eq, sql, desc, and, isNull, inArray } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth-admin';
import { SCORING_CONFIG } from '@/lib/quiz-scoring';

export interface UserWithStats {
  id: string;
  name: string | null;
  email: string;
  planTier: string | null;
  isSubscribed: boolean | null;
  createdAt: Date | null;
  accessExpiresAt: Date | null;
  totalAttempts: number;
  completedAttempts: number;
  avgScore: number | null;
  lastActiveAt: Date | null;
  // Category-wise breakdown
  fltCount: number;
  unitCount: number;
  csatCount: number;
  pyqCount: number;
  topicCount: number;
}

export interface TestAttemptDetail {
  id: string;
  userId: string;
  testId: string;
  testTitle: string;
  testType: string;
  score: number | null;
  totalQuestions: number;
  sourceQuestionsCount: number;
  sourceAnswersCount: number;
  correctAnswers: number;
  wrongAnswers: number;
  skippedAnswers: number;
  netScore: number;
  scorePercentage: number;
  isCompleted: boolean;
  startTime: Date;
  endTime: Date | null;
  dayOfWeek: string;
  maxMarks: number;
}

/**
 * getUserDashboardData — Sab users + unke test attempt stats
 */
export async function getUserDashboardData(): Promise<UserWithStats[]> {
  await requireAdmin();

  // Single optimized query: users + their attempt stats with category breakdown
  const rows = await db
    .select({
      id: mppscUsers.id,
      name: mppscUsers.name,
      email: mppscUsers.email,
      planTier: mppscUsers.planTier,
      isSubscribed: mppscUsers.isSubscribed,
      createdAt: mppscUsers.createdAt,
      accessExpiresAt: mppscUsers.accessExpiresAt,
      totalAttempts: sql<number>`count(${userAttempts.id})`,
      completedAttempts: sql<number>`sum(case when ${userAttempts.isCompleted} = 1 then 1 else 0 end)`,
      avgScore: sql<number>`avg(case when ${userAttempts.isCompleted} = 1 then ${userAttempts.score} else null end)`,
      lastActiveAt: sql<Date>`max(${userAttempts.endTime})`,
      fltCount: sql<number>`sum(case when ${tests.type} = 'FLT' then 1 else 0 end)`,
      unitCount: sql<number>`sum(case when ${tests.type} = 'UNIT' then 1 else 0 end)`,
      csatCount: sql<number>`sum(case when ${tests.type} = 'CSAT' then 1 else 0 end)`,
      pyqCount: sql<number>`sum(case when ${tests.type} = 'PYQ' then 1 else 0 end)`,
      topicCount: sql<number>`sum(case when ${tests.type} = 'TOPIC' then 1 else 0 end)`,
    })
    .from(mppscUsers)
    .leftJoin(userAttempts, eq(mppscUsers.id, userAttempts.userId))
    .leftJoin(tests, eq(userAttempts.testId, tests.id))
    .where(
      and(
        isNull(mppscUsers.deletedAt),
        // Exclude admin  
        sql`${mppscUsers.role} != 'admin'`,
        // UPSC-only users
        eq(mppscUsers.examType, 'upsc')
      )
    )
    .groupBy(mppscUsers.id)
    .orderBy(desc(sql`max(${userAttempts.endTime})`));

  return rows.map((r) => ({
    ...r,
    totalAttempts: Number(r.totalAttempts) || 0,
    completedAttempts: Number(r.completedAttempts) || 0,
    avgScore: r.avgScore != null ? Math.round(Number(r.avgScore) * 100) / 100 : null,
    lastActiveAt: r.lastActiveAt,
    accessExpiresAt: r.accessExpiresAt,
    fltCount: Number(r.fltCount) || 0,
    unitCount: Number(r.unitCount) || 0,
    csatCount: Number(r.csatCount) || 0,
    pyqCount: Number(r.pyqCount) || 0,
    topicCount: Number(r.topicCount) || 0,
  }));
}

/**
 * getUserTestHistory — Specific user ke test attempts with details
 * Fetches actual correct/wrong/skipped from attemptAnswers table
 */
export async function getUserTestHistory(userId: string): Promise<TestAttemptDetail[]> {
  await requireAdmin();

  // First get the attempts with test info
  const rows = await db
    .select({
      id: userAttempts.id,
      userId: userAttempts.userId,
      testId: userAttempts.testId,
      testTitle: tests.title,
      testType: tests.type,
      totalQuestions: tests.totalQuestions,
      score: userAttempts.score,
      isCompleted: userAttempts.isCompleted,
      startTime: userAttempts.startTime,
      endTime: userAttempts.endTime,
    })
    .from(userAttempts)
    .innerJoin(tests, eq(userAttempts.testId, tests.id))
    .where(
      and(
        eq(userAttempts.userId, userId),
        isNull(userAttempts.deletedAt)
      )
    )
    .orderBy(desc(userAttempts.startTime))
    .limit(50);

  if (rows.length === 0) return [];

  // Get attempt IDs
  const attemptIds = rows.map(r => r.id);
  const testIds = Array.from(new Set(rows.map(r => r.testId)));

  // Fetch raw answers for all attempts
  const answerStats = await db
    .select({
      attemptId: attemptAnswers.attemptId,
      questionId: attemptAnswers.questionId,
      userAnswer: attemptAnswers.userAnswer,
    })
    .from(attemptAnswers)
    .where(inArray(attemptAnswers.attemptId, attemptIds));

  // Source-of-truth question set per test (same basis as /analytics/history/[id])
  const questionRows = testIds.length
    ? await db
        .select({
          questionId: questions.id,
          testId: questions.testId,
          correctAnswer: questions.correctAnswer,
        })
        .from(questions)
        .where(inArray(questions.testId, testIds))
    : [];

  const answersByAttemptQuestion = new Map<string, string | null>();
  answerStats.forEach((a) => {
    answersByAttemptQuestion.set(`${a.attemptId}:${a.questionId}`, a.userAnswer ?? null);
  });

  const questionsByTest = new Map<string, Array<{ questionId: string; correctAnswer: string | null }>>();
  questionRows.forEach((q) => {
    const existing = questionsByTest.get(q.testId) || [];
    existing.push({ questionId: q.questionId, correctAnswer: q.correctAnswer });
    questionsByTest.set(q.testId, existing);
  });
  const answerCountByAttempt = new Map<string, number>();
  answerStats.forEach((a) => {
    answerCountByAttempt.set(a.attemptId, (answerCountByAttempt.get(a.attemptId) || 0) + 1);
  });

  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return rows.map((r) => {
    const testQuestions = questionsByTest.get(r.testId) || [];
    let correct = 0;
    let wrong = 0;
    let skipped = 0;

    testQuestions.forEach((q) => {
      const userAnswerRaw = answersByAttemptQuestion.get(`${r.id}:${q.questionId}`);
      if (userAnswerRaw === null || userAnswerRaw === undefined) {
        skipped += 1;
        return;
      }

      const userAnswerNum = Number.parseInt(String(userAnswerRaw), 10);
      const correctAnswerNum = Number.parseInt(String(q.correctAnswer), 10);

      if (!Number.isFinite(userAnswerNum) || !Number.isFinite(correctAnswerNum)) {
        skipped += 1;
        return;
      }

      if (userAnswerNum === correctAnswerNum) correct += 1;
      else wrong += 1;
    });

    const total = testQuestions.length > 0 ? testQuestions.length : (r.totalQuestions || 0);
    if (testQuestions.length === 0) {
      skipped = Math.max(0, total - correct - wrong);
    }

    const computedScore = Number(
      (
        correct * SCORING_CONFIG.MARKS_PER_QUESTION -
        wrong * SCORING_CONFIG.NEGATIVE_MARKING
      ).toFixed(2)
    );
    const finalScore = r.score != null ? Number(r.score) : computedScore;
    const maxMarks = total * SCORING_CONFIG.MARKS_PER_QUESTION;
    const scorePercentage = maxMarks > 0 ? Math.round((finalScore / maxMarks) * 100) : 0;
    const startDate = new Date(r.startTime);

    return {
      id: r.id,
      userId: r.userId,
      testId: r.testId,
      testTitle: r.testTitle || 'Unknown Test',
      testType: r.testType || 'MISC',
      totalQuestions: total,
      sourceQuestionsCount: testQuestions.length,
      sourceAnswersCount: answerCountByAttempt.get(r.id) || 0,
      correctAnswers: correct,
      wrongAnswers: wrong,
      skippedAnswers: skipped > 0 ? skipped : 0,
      netScore: finalScore,
      scorePercentage,
      score: r.score,
      isCompleted: Boolean(r.isCompleted),
      startTime: r.startTime,
      endTime: r.endTime,
      dayOfWeek: DAYS[startDate.getDay()],
      maxMarks: maxMarks,
    };
  });
}

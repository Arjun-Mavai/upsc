'use server';

import { db } from '@/db';
import { userAttempts, tests, questions, attemptAnswers, syllabusTopics } from '@/db/schema';
import { eq, inArray, and, isNotNull, isNull } from 'drizzle-orm';
import { verifyAuth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { cachedData } from '@/lib/cache';
import { SCORING_CONFIG } from '@/lib/quiz-scoring';
import { unstable_cache } from 'next/cache';

// 🎯 UPSC Expected Cutoff (based on historical data)
const EXPECTED_CUTOFF_PERCENTAGE = 80;

const getAttemptTotalMarks = (attempt: any): number => {
  const questionBasedMarks = (attempt.totalQuestions || 0) * 3;
  if (questionBasedMarks > 0) return questionBasedMarks;
  if ((attempt.totalMarks || 0) > 0) return attempt.totalMarks;
  return 60;
};

// Cache Analytics per user for 5 minutes to avoid DB spam on refresh
export const getUserAnalytics = async (userId: string, examId?: string) => {
  if (!userId) return null;

  const getCachedAnalytics = unstable_cache(
    async (uid: string, eid?: string) => {
      // ... The entire logic ...
      return await fetchAnalyticsInternal(uid, eid);
    },
    [`user-analytics-${userId}-${examId || 'all'}`],
    { revalidate: 300, tags: [`analytics-${userId}`] }
  );

  return await getCachedAnalytics(userId, examId);
};

// Action to explicitly revalidate analytics cache (for Client Components)
export async function revalidateAnalyticsAction() {
  // Analytics is now fetched fresh on each request.
  return;
}

/**
 * 🎯 Calculate Exam Expert Insights
 * These are advanced metrics that help students understand their exam readiness
 */
function calculateExamInsights(
  attempts: any[],
  subjectStats: Record<string, any>,
  overallAvg: number
) {
  // 1. Cutoff Comparison
  const difference = overallAvg - EXPECTED_CUTOFF_PERCENTAGE;
  const cutoffComparison = {
    userScore: overallAvg,
    expectedCutoff: EXPECTED_CUTOFF_PERCENTAGE,
    difference: Math.round(difference),
    status:
      difference >= 5
        ? 'above'
        : difference >= -5
          ? 'near'
          : ('below' as 'above' | 'below' | 'near'),
  };

  // 2. Trend Analysis (Compare last 5 tests vs previous 5)
  const sortedAttempts = [...attempts].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const recent5 = sortedAttempts.slice(0, 5);
  const previous5 = sortedAttempts.slice(5, 10);

  const calcAvg = (arr: any[]) => {
    if (arr.length === 0) return 0;
    const total = arr.reduce((sum, a) => {
      const maxMarks = getAttemptTotalMarks(a);
      // Fix: Clamp percentage to 0-100 range
      const pct = Math.min(100, Math.max(0, ((a.score || 0) / maxMarks) * 100));
      return sum + pct;
    }, 0);
    return Math.round(total / arr.length);
  };

  const recentAvg = calcAvg(recent5);
  const previousAvg = calcAvg(previous5);
  const changePercent =
    previousAvg > 0 ? Math.round(((recentAvg - previousAvg) / previousAvg) * 100) : 0;

  const trend = {
    direction:
      changePercent > 5
        ? 'improving'
        : changePercent < -5
          ? 'declining'
          : ('stable' as 'improving' | 'declining' | 'stable'),
    changePercent: Math.abs(changePercent),
    recentAvg,
    previousAvg,
  };

  // 3. Consistency Score (Low variance = consistent)
  const percentages = attempts.map((a) => {
    const maxMarks = getAttemptTotalMarks(a);
    // Clamp to 0-100
    return Math.min(100, Math.max(0, ((a.score || 0) / maxMarks) * 100));
  });

  const mean =
    percentages.length > 0 ? percentages.reduce((a, b) => a + b, 0) / percentages.length : 0;
  const variance =
    percentages.length > 0
      ? percentages.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / percentages.length
      : 0;
  const stdDev = Math.sqrt(variance);

  // Consistency score: 100 - (stdDev * 2), clamped 0-100
  const consistencyScore = Math.max(0, Math.min(100, Math.round(100 - stdDev * 2)));

  const consistency = {
    score: consistencyScore,
    variance: Math.round(variance),
    status:
      consistencyScore >= 70
        ? 'consistent'
        : consistencyScore >= 40
          ? 'moderate'
          : ('inconsistent' as 'consistent' | 'moderate' | 'inconsistent'),
  };

  // 4. Time Efficiency
  const timeData = attempts.filter((a) => a.startTime && a.endTime && a.durationMinutes);
  let avgTimeUsed = 75; // Default

  if (timeData.length > 0) {
    const timeRatios = timeData.map((a) => {
      const start = new Date(a.startTime).getTime();
      const end = new Date(a.endTime).getTime();
      const usedSeconds = Math.max(0, (end - start) / 1000); // Fix: Prevent negative time
      const allottedSeconds = (a.durationMinutes || 30) * 60;
      // Fix: Clamp between 0-200% (allow showing overtime but cap it)
      return Math.min(200, Math.max(0, (usedSeconds / allottedSeconds) * 100));
    });
    avgTimeUsed = Math.round(timeRatios.reduce((a, b) => a + b, 0) / timeRatios.length);
  }

  // Fix: Determine status BEFORE clamping for UI display
  const timeStatus =
    avgTimeUsed <= 70
      ? 'efficient'
      : avgTimeUsed <= 90
        ? 'normal'
        : ('slow' as 'efficient' | 'normal' | 'slow');

  const timeEfficiency = {
    avgTimeUsed: Math.min(100, avgTimeUsed), // Cap at 100% for display
    status: timeStatus,
    suggestion:
      timeStatus === 'efficient'
        ? 'Great speed! Consider spending more time on difficult questions.'
        : timeStatus === 'normal'
          ? 'Good time management. Maintain this pace.'
          : 'Try to improve speed with more practice tests.',
  };

  // 5. Study Streak - Fixed calculation
  const dates = attempts.map((a) => new Date(a.createdAt).toDateString());
  const uniqueDates = [...new Set(dates)].sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  let currentStreak = 0;
  let longestStreak = 0;
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  if (uniqueDates.length > 0) {
    // Start streak from 1 if there's any activity
    let tempStreak = 1;

    // Check if user was active today or yesterday to count current streak
    const isActiveRecently = uniqueDates[0] === today || uniqueDates[0] === yesterday;

    // Calculate streaks by comparing consecutive dates
    for (let i = 1; i < uniqueDates.length; i++) {
      const currentDate = new Date(uniqueDates[i - 1]);
      const prevDate = new Date(uniqueDates[i]);
      const diffDays = Math.round((currentDate.getTime() - prevDate.getTime()) / 86400000);

      if (diffDays === 1) {
        // Consecutive day
        tempStreak++;
      } else {
        // Streak broken
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }

    // Final comparison
    longestStreak = Math.max(longestStreak, tempStreak);

    // Current streak only counts if active recently
    currentStreak = isActiveRecently ? tempStreak : 0;
  }

  const studyStreak = {
    currentStreak,
    longestStreak,
    lastActiveDate: uniqueDates[0] || 'Never',
  };

  // 6. Priority Topics (weakest areas that need focus)
  const priorityTopics = Object.entries(subjectStats)
    .map(([id, data]: [string, any]) => ({
      name: data.name,
      nameEn: data.nameEn,
      percentage: data.totalMax > 0 ? Math.round((data.totalScore / data.totalMax) * 100) : 0,
      questionsAttempted: data.count,
      priority:
        data.totalMax > 0
          ? (data.totalScore / data.totalMax) * 100 < 40
            ? 'high'
            : (data.totalScore / data.totalMax) * 100 < 60
              ? 'medium'
              : 'low'
          : ('high' as 'high' | 'medium' | 'low'),
    }))
    .filter((t) => t.priority !== 'low')
    .sort((a, b) => a.percentage - b.percentage)
    .slice(0, 5);

  return {
    cutoffComparison,
    trend,
    consistency,
    timeEfficiency,
    studyStreak,
    priorityTopics,
  };
}

// Extracted internal function
async function fetchAnalyticsInternal(userId: string, examId?: string) {
  try {
    // Determine test type filter based on exam
    // MPPSC logic: Everything NOT starting with UPSC_
    // UPSC logic: Everything starting with UPSC_
    const isUPSC = examId === 'upsc';

    // 1. Fetch all completed attempts for the user
    let query = db
      .select({
        id: userAttempts.id,
        score: userAttempts.score,
        testId: userAttempts.testId,
        testTitle: tests.title,
        unitId: tests.unitId,
        topicId: tests.topicId, // Needed for server-side name resolution
        type: tests.type, // Added for categorization
        tags: tests.tags,
        totalMarks: tests.totalMarks,
        totalQuestions: tests.totalQuestions, // Added for dynamic verification
        createdAt: userAttempts.endTime,
        startTime: userAttempts.startTime,
        endTime: userAttempts.endTime,
        durationMinutes: tests.durationMinutes,
      })
      .from(userAttempts)
      .leftJoin(tests, eq(userAttempts.testId, tests.id))
      .where(
        and(
          eq(userAttempts.userId, userId),
          eq(userAttempts.isCompleted, true),
          isNotNull(userAttempts.endTime),
          isNull(userAttempts.deletedAt)
        )
      );

    // Apply exam filter if provided
    if (examId) {
      const { like, notLike, or, and } = await import('drizzle-orm');
      if (isUPSC) {
        // @ts-ignore - type safe enough for runtime
        query = query.where(and(eq(userAttempts.userId, userId), like(tests.type, 'UPSC_%')));
      } else {
        // @ts-ignore
        query = query.where(and(eq(userAttempts.userId, userId), notLike(tests.type, 'UPSC_%')));
      }
    }

    const attempts = await query;

    if (!attempts.length) {
      return {
        overallScore: 0,
        totalTests: 0,
        mastery: [],
        recentActivity: [],
        aiSuggestion: {
          en: 'Start your first test to get personalized insights!',
          hi: 'पर्सनलाइज्ड सुझाव पाने के लिए अपना पहला टेस्ट शुरू करें!',
        },
      };
    }

    const attemptIds = attempts.map((a) => a.id);

    // 1.5 Derive attempt score from answer-level data (source of truth for accuracy UI)
    const derivedScoreByAttempt = new Map<string, number>();
    if (attemptIds.length > 0) {
      const scoredRows = await db
        .select({
          attemptId: attemptAnswers.attemptId,
          isCorrect: attemptAnswers.isCorrect,
        })
        .from(attemptAnswers)
        .where(inArray(attemptAnswers.attemptId, attemptIds));

      scoredRows.forEach((row) => {
        const current = derivedScoreByAttempt.get(row.attemptId) ?? 0;
        if (row.isCorrect == null) {
          derivedScoreByAttempt.set(row.attemptId, current);
          return;
        }

        const delta = row.isCorrect
          ? SCORING_CONFIG.MARKS_PER_QUESTION
          : -SCORING_CONFIG.NEGATIVE_MARKING;
        derivedScoreByAttempt.set(row.attemptId, Number((current + delta).toFixed(2)));
      });
    }

    // Prefer derived score when answer rows exist (fixes stale/incorrect user_attempts.score)
    const attemptsWithScore = attempts.map((a) => ({
      ...a,
      score: derivedScoreByAttempt.has(a.id) ? derivedScoreByAttempt.get(a.id)! : a.score || 0,
    }));

    // 2. Calculate Overall Stats
    let totalPercentage = 0;
    let validAttemptsCount = 0;

    // 2.5: Resolve Topics EARLY (Moved up from below for Mastery Calculation)
    const topicMap = new Map<string, any>();
    try {
      const allTopics = await db.query.syllabusTopics.findMany(); // Direct DB query
      if (allTopics) {
        allTopics.forEach((t) => {
          topicMap.set(t.id, t);
        });
      }
    } catch (e) {
      logger.error('Failed to fetch syllabus topics for analytics:', e);
    }

    // 3. Granular Analysis by Subject (Question Level)

    const subjectStats: Record<
      string,
      { totalScore: number; totalMax: number; count: number; name: string; nameEn: string }
    > = {};

    if (attemptIds.length > 0) {
      // Limit to last 50 attempts for performance optimization
      const recentAttemptIds = attemptsWithScore.map((a) => a.id).slice(0, 50);

      // Optimized query: Use inArray instead of raw SQL IN for safety and better Drizzle support
      const answersData = await db
        .select({
          isCorrect: attemptAnswers.isCorrect,
          marks: questions.marks,
          subject: questions.subject,
          attemptId: attemptAnswers.attemptId, // Added for fallback subject resolution
        })
        .from(attemptAnswers)
        .leftJoin(questions, eq(attemptAnswers.questionId, questions.id))
        .where(inArray(attemptAnswers.attemptId, recentAttemptIds));

      answersData.forEach((ans) => {
        const marks = ans.marks || 0;
        // Only process if marks are valid numbers
        if (typeof marks === 'number') {
          let subject = ans.subject;
          let subjectEn = ans.subject; // Default to same as subject (Hindi/Default)

          // Fallback: If subject is missing (e.g. 'General'), try to infer from Test Topic
          if (!subject || subject === 'General') {
            const attempt = attemptsWithScore.find((a) => a.id === ans.attemptId);
            if (attempt) {
              if (attempt.topicId && topicMap.has(attempt.topicId)) {
                const topic = topicMap.get(attempt.topicId);
                // Check if it's a specific Unit/Topic test to use its name?
                // Generally, if it's a Topic Test, the whole test is about that topic.
                subject = topic.title || topic.titleEn || attempt.testTitle || 'General';
                subjectEn = topic.titleEn || topic.title || attempt.testTitle || 'General';
              } else {
                // Use test title as fallback if no topic
                // But test title might be "Full Length Test 1" -> Keep General?
                // If it's a "Topic Test", testTitle IS the subject mostly.
                // Let's use testTitle if it seems specific, or just fallback to 'General' for FLTs.
                // For now, if topicId is present, use it.
                subject = attempt.testTitle || 'General';
                subjectEn = attempt.testTitle || 'General';
              }
            }
          }

          subject = subject || 'General';
          subjectEn = subjectEn || subject;

          if (!subjectStats[subject]) {
            subjectStats[subject] = {
              totalScore: 0,
              totalMax: 0,
              count: 0,
              name: subject,
              nameEn: subjectEn,
            };
          }

          subjectStats[subject].totalMax += marks;
          if (ans.isCorrect) {
            subjectStats[subject].totalScore += marks;
          }
          subjectStats[subject].count++;
        }
      });
    }

    attemptsWithScore.forEach((attempt) => {
      // Logic Update: User requested "Exam Pattern" calculation.
      // Instead of trusting DB totalMarks, we calculate: Total Questions * 3
      // This ensures 100% accuracy in logic.

      const finalMaxMarks = getAttemptTotalMarks(attempt);

      if (finalMaxMarks > 0) {
        const percentage = Math.min(100, ((attempt.score || 0) / finalMaxMarks) * 100);
        totalPercentage += percentage;
        validAttemptsCount++;
      }
    });

    const overallAvg =
      validAttemptsCount > 0 ? Math.round(totalPercentage / validAttemptsCount) : 0;

    // 4. Format Mastery Data
    const mastery = Object.entries(subjectStats)
      .map(([id, data]) => {
        const percentage =
          data.totalMax > 0 ? Math.round((data.totalScore / data.totalMax) * 100) : 0;
        return {
          id,
          name: data.name,
          nameEn: data.nameEn,
          percentage,
          count: data.count,
          status:
            percentage >= 80
              ? 'Excellent'
              : percentage >= 60
                ? 'Good'
                : percentage >= 40
                  ? 'Average'
                  : 'Weak',
          color: percentage >= 80 ? 'emerald' : percentage >= 60 ? 'amber' : 'red',
        };
      })
      .sort((a, b) => a.percentage - b.percentage); // Sort ASCENDING: Weak areas (0%) at top, Strong (100%) at bottom

    // 5. Generate AI Suggestion
    const sortedMastery = [...mastery].sort((a, b) => a.percentage - b.percentage);
    const weakest = sortedMastery[0];
    const strongest = sortedMastery[sortedMastery.length - 1];

    let aiSuggestion = {
      en: '',
      hi: '',
    };

    if (!weakest) {
      aiSuggestion = {
        en: "Great start! Take more tests to build your mastery profile. We'll analyze your performance to give specific tips.",
        hi: 'शुरुआत शानदार है! अपनी तैयारी की प्रोफाइल बनाने के लिए और टेस्ट दें। हम आपके प्रदर्शन का विश्लेषण करके आपको खास सुझाव देंगे।',
      };
    } else if (weakest.percentage < 40) {
      aiSuggestion = {
        en: `Urgent: You need to focus on "${weakest.nameEn}". Your accuracy is currently at a critical level (${weakest.percentage}%). Re-read the revision cards for this unit before taking another test.`,
        hi: `महत्वपूर्ण: आपको "${weakest.name}" पर ध्यान देने की आवश्यकता है। आपकी सटीकता वर्तमान में गंभीर स्तर (${weakest.percentage}%) पर है। अगला टेस्ट देने से पहले इस यूनिट के रिवीजन कार्ड्स दोबारा पढ़ें।`,
      };
    } else if (weakest.percentage < 60) {
      aiSuggestion = {
        en: `Focus Area: Your performance in "${weakest.nameEn}" is below average. Try practicing topic-specific quizzes to bridge the gap. You're doing great in ${strongest?.nameEn || 'others'} though!`,
        hi: `फोकस क्षेत्र: "${weakest.name}" में आपका प्रदर्शन औसत से नीचे है। सुधार के लिए टॉपिक-विशिष्ट क्विज़ का अभ्यास करें। हालांकि आप ${strongest?.name || 'अन्य'} में अच्छा कर रहे हैं!`,
      };
    } else if (overallAvg < 80) {
      // Changed condition to Overall Average instead of Weakest
      aiSuggestion = {
        en: `Optimization: You're doing well, but "${weakest.nameEn}" could use some polish to reach excellence. Aim for 80%+ mastery across all topics.`,
        hi: `सुधार: आप अच्छा कर रहे हैं, लेकिन को उत्कृष्ट बनाने के लिए "${weakest.name}" में थोड़ा और सुधार किया जा सकता है। सभी विषयों में 80%+ महारत का लक्ष्य रखें।`,
      };
    } else {
      // Dynamic message based on actual score
      aiSuggestion = {
        en: `Expert Level: You've mastered all current topics with ${overallAvg}%+ accuracy! Keep the momentum going by taking Full Length Tests (FLTs) to simulate the real exam pressure.`,
        hi: `विशेषज्ञ स्तर: आपने ${overallAvg}%+ सटीकता के साथ सभी वर्तमान विषयों में महारत हासिल कर ली है! वास्तविक परीक्षा के दबाव का अनुभव करने के लिए फुल लेंथ टेस्ट (FLTs) देकर इस गति को बनाए रखें।`,
      };
    }

    // Deduplicate attempts - Keep only the LATEST attempt for each testId
    // User requested: "Recent history me sab test dikhe" but "jo latest attempt ho wahi rakhna h" (Keep only latest attempt of each unique test).
    const uniqueAttemptsMap = new Map();
    // Sort by date desc first so the first one we see is the latest
    attemptsWithScore.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));

    attemptsWithScore.forEach((a) => {
      if (!uniqueAttemptsMap.has(a.testId)) {
        uniqueAttemptsMap.set(a.testId, a);
      }
    });

    // Use server data to enrich history with proper Topic & Unit names
    // (Moved to top - Step 2.5)

    const recentActivity = Array.from(uniqueAttemptsMap.values()).map((activity: any) => {
      const unitId = activity.unitId || 'unknown';

      // 1. Generate Dynamic Unit Name (e.g. "Unit 1") matches quiz/topic/page.tsx logic
      let unitName = 'Miscellaneous';
      if (unitId !== 'unknown') {
        const unitIndex = parseInt(unitId.replace('unit_', '')) || 0;
        unitName = `Unit ${unitIndex}`;
      }

      // 2. Resolve Dynamic Topic Name from DB — send both languages
      let displayTitle = activity.testTitle;
      let displayTitleHi = activity.testTitle;
      if (activity.topicId && topicMap.has(activity.topicId)) {
        const topic = topicMap.get(activity.topicId);
        displayTitle = topic.titleEn || topic.title || activity.testTitle;
        displayTitleHi = topic.title || activity.testTitle;
      }

      // 3. Time Calculations
      let timeTakenFormatted = '0m';
      const totalDurationFormatted = `${activity.durationMinutes || 0}m`;

      if (activity.startTime && activity.endTime) {
        const start = new Date(activity.startTime).getTime();
        const end = new Date(activity.endTime).getTime();
        const diffSeconds = Math.max(0, Math.round((end - start) / 1000));

        const takenMinutes = Math.floor(diffSeconds / 60);
        const takenSeconds = diffSeconds % 60;

        if (takenMinutes > 0) {
          timeTakenFormatted = `${takenMinutes}m`;
        } else {
          timeTakenFormatted = `${takenSeconds}s`;
        }
      }

      return {
        ...activity,
        totalMarks: getAttemptTotalMarks(activity),
        unitName,
        testTitle: displayTitle,
        testTitleHi: displayTitleHi,
        // Ensure unitId is preserved for grouping
        unitId,
        timeTaken: timeTakenFormatted,
        totalDuration: totalDurationFormatted,
      };
    });

    // 🎯 Calculate Exam Expert Insights
    const examInsights = calculateExamInsights(attemptsWithScore, subjectStats, overallAvg);

    return {
      overallScore: overallAvg,
      totalTests: attemptsWithScore.length, // Total tests is total attempts (or unique? User said "jo latest h usi ko store karna h". Assuming total tests count is unique tests taken? Let's keep attempts.length for Total Count as "Tests Taken" usually means attempts. But Recent History needs unique.)
      // Actually, "Tests Taken" usually implies total attempts. But "Recent History" shows unique tests.
      // If user took Test A 5 times, History shows Test A (latest).
      mastery,
      recentActivity: recentActivity,
      aiSuggestion,
      examInsights, // 🎯 NEW: Exam Expert Insights
    };
  } catch (error) {
    logger.error('Analytics Error:', error);
    return null;
  }
}

export const getAttemptDetails = cachedData(
  async (attemptId: string) => {
    if (!attemptId) return null;

    try {
      // 1. Fetch Attempt Meta
      const attempt = await db
        .select({
          id: userAttempts.id,
          userId: userAttempts.userId, // Added for Leaderboard
          score: userAttempts.score,
          testId: userAttempts.testId,
          testTitle: tests.title,
          topicId: tests.topicId, // Added for title resolution
          totalMarks: tests.totalMarks,
          type: tests.type,
          endTime: userAttempts.endTime,
          startTime: userAttempts.startTime,
        })
        .from(userAttempts)
        .leftJoin(tests, eq(userAttempts.testId, tests.id))
        .where(eq(userAttempts.id, attemptId))
        .limit(1);

      if (!attempt[0]) return null;

      // Resolve Dynamic Topic Name
      try {
        if (attempt[0].topicId) {
          // Direct DB query to avoid calling action that uses cookies()
          const foundTopic = await db.query.syllabusTopics.findFirst({
            where: eq(syllabusTopics.id, attempt[0].topicId),
            columns: {
              title: true,
              titleEn: true,
            },
          });

          if (foundTopic) {
            // Prefer English title, fallback to Hindi/Default
            attempt[0].testTitle = foundTopic.titleEn || foundTopic.title || attempt[0].testTitle;
          }
        }
      } catch (e) {
        logger.error('Failed to resolve topic title', e);
        // Fallback to existing testTitle (no change needed)
      }

      // 2. Fetch Questions (ALL questions for the test)
      const allQuestions = await db
        .select({
          id: questions.id,
          questionText: questions.questionText,
          questionTextEn: questions.questionTextEn,
          options: questions.options,
          correctAnswer: questions.correctAnswer,
          explanation: questions.explanation,
          explanationEn: questions.explanationEn,
          idealTime: questions.idealTime,
          order: questions.order,
          marks: questions.marks, // Ensure marks are available
          negativeMarks: questions.negativeMarks, // Ensure negativeMarks are available
          type: questions.type,
          matchPairs: questions.matchPairs,
        })
        .from(questions)
        .where(eq(questions.testId, attempt[0].testId))
        .orderBy(questions.order);

      // 3. Fetch User Answers
      const userAnswers = await db
        .select()
        .from(attemptAnswers)
        .where(eq(attemptAnswers.attemptId, attemptId));

      // 4. Map answers to questions
      const answersMap = new Map(userAnswers.map((a) => [a.questionId, a]));

      const combinedData = allQuestions.map((q, order) => {
        const ua = answersMap.get(q.id);

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 🎯 DATA CONVERSION (Bhai, database se aaya wo convert kar rahe hain)
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

        // Database se userAnswer string mein aata hai: "0", "1", "2", "3" ya null
        // correctAnswer bhi string mein hai: "0", "1", "2", "3"
        // UI ke liye dono ko NUMBER mein convert karna hai!

        let userAnswerNum = null;
        if (ua && ua.userAnswer !== null && ua.userAnswer !== undefined) {
          // Convert string to number: "0" → 0, "1" → 1, etc.
          const parsed = parseInt(ua.userAnswer);
          if (!isNaN(parsed)) {
            userAnswerNum = parsed;
          }
        }

        // correctAnswer ko bhi number mein convert karo
        let correctAnswerNum = 0;
        if (q.correctAnswer !== null && q.correctAnswer !== undefined) {
          const parsed = parseInt(String(q.correctAnswer));
          if (!isNaN(parsed)) {
            correctAnswerNum = parsed;
          }
        }

        return {
          id: ua?.id || crypto.randomUUID(),
          questionId: q.id,
          userAnswer: userAnswerNum, // ✅ Now NUMBER or null
          isCorrect: ua ? ua.isCorrect : false,
          timeTaken: ua ? ua.timeTakenSeconds : 0,
          order: q.order || order + 1, // Question order for display
          questionText: q.questionText,
          questionTextEn: q.questionTextEn,
          // Safe parsing for JSON fields
          options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
          correctAnswer: correctAnswerNum, // ✅ Now NUMBER
          explanation: q.explanation,
          explanationEn: q.explanationEn,
          idealTime: q.idealTime,
          marks: q.marks,
          negativeMarks: q.negativeMarks,
          type: q.type,
          matchPairs: typeof q.matchPairs === 'string' ? JSON.parse(q.matchPairs) : q.matchPairs,
        };
      });

      return {
        meta: attempt[0],
        answers: combinedData,
      };
    } catch (error) {
      logger.error('Fetch Attempt Details Error:', error);
      return null;
    }
  },
  ['attempt-details'],
  ['attempts']
);

'use server';

import { db } from '@/db';
import { 
  tests, 
  userAttempts, 
  questions, 
  attemptAnswers, 
  pyqFactBank, 
  pyqQuestionTopics,
  pyqTopics,
  mppscUsers
} from '@/db/schema';
import { logger } from '@/lib/logger';
import { eq, and, inArray, desc } from 'drizzle-orm';
import { verifyAuth } from '@/lib/auth';
import { checkQualification } from '@/features/tests/utils/cutoff-logic';
import { normalizeSubject } from '@/features/tests/utils/pyq-subject';

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------

export interface SmartResultResponse {
  net_score: number;
  max_score: number;
  correct: number;
  wrong: number;
  skipped: number;
  accuracy: number;
  total_questions: number;
  
  qualification?: {
    status: 'Qualified' | 'Not Qualified' | 'N/A';
    cutoff: number;
    diff: number;
    category: string;
  };

  attempt_intelligence: {
    accuracy_vs_breakeven: number;
    wasted_points: number;
    could_have_scored: number;
    strategy_grade: 'A' | 'B' | 'C' | 'D';
  };

  subject_breakdown: {
    subject: string;
    correct: number;
    wrong: number;
    skipped: number;
    total: number;
    score: number;
    accuracy: number;
  }[];

  pyq_facts: any[]; // Enriched facts related to mistakes
  missed_questions: any[]; // Detailed breakdown of errors
  detailed_analysis: any[]; // Full list of questions with status
}

// ------------------------------------------------------------------
// Enriched Logic for Flashcards (Any Mode / Any User)
// ------------------------------------------------------------------

export async function getHighYieldFactsForQuestions(
  questionIds: string[],
  testId?: string
): Promise<any[]> {
  if ((!questionIds || questionIds.length === 0) && !testId) return [];

  try {
    const topicIds: string[] = [];

    // 1. If testId is provided, try to find the test's own topic mapping first
    if (testId) {
      const test = await db.query.tests.findFirst({
        where: eq(tests.id, testId),
        columns: { topicId: true, type: true }
      });

      if (test?.topicId) {
        const linkedPyqTopic = await db.query.pyqTopics.findFirst({
          where: eq(pyqTopics.id, test.topicId)
        });
        
        if (linkedPyqTopic) {
          topicIds.push(linkedPyqTopic.id);
        }
      }
    }

    // 2. Find topics linked to specific questions (via PYQ mappings)
    if (questionIds && questionIds.length > 0) {
      const questionTopics = await db
        .select({
          qId: pyqQuestionTopics.questionId,
          tId: pyqQuestionTopics.topicId
        })
        .from(pyqQuestionTopics)
        .where(inArray(pyqQuestionTopics.questionId, questionIds));

      const mappedTopicIds = questionTopics.map(qt => qt.tId);
      mappedTopicIds.forEach(id => {
        if (!topicIds.includes(id)) topicIds.push(id);
      });
    }

    // 3. Fallback: Check if we can find topics by normalized subject name for these questions
    if (topicIds.length === 0 && questionIds && questionIds.length > 0) {
      const questionData = await db
        .select({ subject: questions.subject })
        .from(questions)
        .where(inArray(questions.id, questionIds));
      
      const rawSubjects = [...new Set(questionData.map(q => q.subject).filter(Boolean))];
      const normalizedSubjects = [...new Set(rawSubjects.map(s => normalizeSubject(s)))];
      
      if (normalizedSubjects.length > 0) {
        const fallbackTopics = await db
          .select({ id: pyqTopics.id })
          .from(pyqTopics)
          .where(inArray(pyqTopics.subject, normalizedSubjects as string[]))
          .limit(10);
        
        fallbackTopics.forEach(t => {
          if (!topicIds.includes(t.id)) topicIds.push(t.id);
        });
      }
    }

    // 4. Fetch facts from the topics
    let facts = topicIds.length > 0 ? await db.query.pyqFactBank.findMany({
      where: and(
        inArray(pyqFactBank.topicId, topicIds)
      ),
      orderBy: [desc(pyqFactBank.importanceScore)],
      limit: 15
    }) : [];

    // 5. Final Resilience Fallback: If no facts found by topics, try by subject
    if (facts.length === 0) {
      const finalQuestionIds = questionIds && questionIds.length > 0 ? questionIds : 
                                (testId ? (await db.select({id: questions.id}).from(questions).where(eq(questions.testId, testId)).limit(10)).map(q => q.id) : []);

      if (finalQuestionIds.length > 0) {
        const questionData = await db
          .select({ subject: questions.subject })
          .from(questions)
          .where(inArray(questions.id, finalQuestionIds));
        
        const rawSubjects = [...new Set(questionData.map(q => q.subject).filter(Boolean))];
        const normalizedSubjects = [...new Set(rawSubjects.map(s => normalizeSubject(s)))];

        if (normalizedSubjects.length > 0) {
          facts = await db.query.pyqFactBank.findMany({
            where: and(
              inArray(pyqFactBank.subject, normalizedSubjects as string[])
            ),
            orderBy: [desc(pyqFactBank.importanceScore)],
            limit: 15
          });
        }
      }
    }

    return facts;
  } catch (error) {
    logger.error('Error fetching facts for questions:', error, { category: 'db' });
    return [];
  }
}

// ------------------------------------------------------------------
// Main Action
// ------------------------------------------------------------------

export async function calculateUPSCResult(
  testId: string, 
  attemptId?: string 
): Promise<SmartResultResponse | { error: string }> {
  try {
    const session = await verifyAuth();
    if (!session) return { error: 'Unauthorized' };
    const userId = session.id;

    let attempt;
    if (attemptId) {
      attempt = await db.query.userAttempts.findFirst({
        where: and(eq(userAttempts.id, attemptId), eq(userAttempts.userId, userId))
      });
    } else {
      attempt = await db.query.userAttempts.findFirst({
        where: and(eq(userAttempts.testId, testId), eq(userAttempts.userId, userId)),
        orderBy: [desc(userAttempts.createdAt)]
      });
    }

    if (!attempt) return { error: 'Attempt not found' };

    const [answers, testDetails, userDetails] = await Promise.all([
      db.select().from(attemptAnswers).where(eq(attemptAnswers.attemptId, attempt.id)),
      db.query.tests.findFirst({ where: eq(tests.id, testId) }),
      db.query.mppscUsers.findFirst({ 
        where: eq(mppscUsers.id, userId),
        columns: { category: true, gender: true } 
      })
    ]);

    if (!testDetails) return { error: 'Test not found' };

    // Fetch questions: For virtual tests, they are not linked by testId in DB record
    let testQuestions;
    if (testId.startsWith('practice-')) {
      const questionIds = answers.map(a => a.questionId);
      testQuestions = await db.select().from(questions).where(inArray(questions.id, questionIds));
    } else {
      testQuestions = await db.select().from(questions).where(eq(questions.testId, testId));
    }

    if (!testDetails) return { error: 'Test not found' };

    const scoring = testQuestions.map(q => {
      const ans = answers.find(a => a.questionId === q.id);
      
      let status: 'correct' | 'wrong' | 'skipped' = 'skipped';
      let delta = 0;
      let userAnswer = null;
      
      const marks = q.marks ?? 3; 
      const negative = q.negativeMarks ?? 1;

      if (ans) {
        userAnswer = ans.userAnswer;
        if (ans.userAnswer === q.correctAnswer) {
          status = 'correct';
          delta = marks;
        } else {
          status = 'wrong';
          delta = -negative;
        }
      }

      return {
        ...q,
        userAnswer,
        status,
        delta,
        negativeUsed: negative,
        subject: q.subject || 'Unknown'
      };
    });

    const net_score = scoring.reduce((sum, item) => sum + item.delta, 0);
    const correct = scoring.filter(i => i.status === 'correct').length;
    const wrong = scoring.filter(i => i.status === 'wrong').length;
    const skipped = scoring.filter(i => i.status === 'skipped').length;
    const total_questions = testQuestions.length;
    
    const max_score = scoring.reduce((sum, item) => sum + (item.marks ?? 3), 0);

    const accuracy = (correct + wrong) > 0 ? correct / (correct + wrong) : 0;

    const wasted_points = scoring
      .filter(i => i.status === 'wrong')
      .reduce((sum, item) => sum + item.negativeUsed, 0);
      
    const could_have_scored = net_score + wasted_points;
    const breakeven_accuracy = 0.25; 
    
    let strategy_grade: 'A' | 'B' | 'C' | 'D' = 'C';
    if (accuracy >= 0.85) strategy_grade = 'A';
    else if (accuracy >= 0.70) strategy_grade = 'B';
    else if (accuracy >= 0.50) strategy_grade = 'C';
    else strategy_grade = 'D';

    const subjects = [...new Set(scoring.map(s => s.subject))];
    const subject_breakdown = subjects.map(sub => {
      const items = scoring.filter(i => i.subject === sub);
      const sub_correct = items.filter(i => i.status === 'correct').length;
      const sub_wrong = items.filter(i => i.status === 'wrong').length;
      const sub_skipped = items.filter(i => i.status === 'skipped').length;
      
      const sub_score = items.reduce((sum, item) => sum + item.delta, 0);
      
      return {
        subject: sub,
        total: items.length,
        correct: sub_correct,
        wrong: sub_wrong,
        skipped: sub_skipped,
        score: sub_score,
        accuracy: (sub_correct + sub_wrong) > 0 ? sub_correct / (sub_correct + sub_wrong) : 0
      };
    });

    let qualification = undefined;
    if (testDetails.cutoffs && userDetails) {
       const userCategory = userDetails.category || 'UR';
       const userGender = userDetails.gender || 'M';
       
       const result = checkQualification(
         net_score,
         userCategory,
         userGender,
         testDetails.cutoffs
       );
       
       qualification = {
         status: result.qualified ? 'Qualified' : 'Not Qualified',
         cutoff: result.cutoff,
         diff: result.diff,
         category: result.categoryKey
       };
    }

    const wrongQuestionIds = scoring.filter(s => s.status === 'wrong').map(s => s.id);
    const facts = await getHighYieldFactsForQuestions(wrongQuestionIds, testId);

    return {
      net_score,
      max_score,
      correct,
      wrong,
      skipped,
      accuracy,
      total_questions,
      attempt_intelligence: {
        accuracy_vs_breakeven: accuracy - breakeven_accuracy,
        wasted_points,
        could_have_scored,
        strategy_grade
      },
      subject_breakdown,
      pyq_facts: facts,
      missed_questions: scoring.filter(s => s.status === 'wrong').map(q => ({
        ...q,
      })),
      detailed_analysis: scoring.map(q => ({
        ...q
      })),
      qualification: qualification as any
    };

  } catch (error) {
    logger.error('Error calculating result:', error, { category: 'api' });
    return { error: 'Calculation failed' };
  }
}

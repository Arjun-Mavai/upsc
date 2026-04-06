import { redirect } from 'next/navigation';
import { unstable_cache } from 'next/cache';
import { and, desc, eq, sql } from 'drizzle-orm';
import { verifyAuth } from '@/lib/auth';
import { getUserTier } from '@/lib/access-control';
import { db } from '@/db';
import { questions, tests } from '@/db/schema';
import RepeatedQuestionsAllClient from './RepeatedQuestionsAllClient';

const getRepeatedQuestionsWithDetails = unstable_cache(
  async () => {
    // Get all repeated questions with their full details including explanations
    const repeatedQuestions = await db
      .select({
        id: questions.id,
        text: questions.questionText,
        textEn: questions.questionTextEn,
        options: questions.options,
        correctAnswer: questions.correctAnswer,
        explanation: questions.explanation,
        explanationEn: questions.explanationEn,
        subject: questions.subject,
        testId: questions.testId,
        testTitle: tests.title,
        year: sql<number>`CAST(substr(${tests.title}, -4) AS INTEGER)`,
        qNo: questions.order,
      })
      .from(questions)
      .innerJoin(tests, eq(questions.testId, tests.id))
      .where(
        and(
          sql`${tests.title} LIKE '%UPSC%'`,
          sql`${tests.title} LIKE '%Civil Services%'`,
          sql`${tests.title} LIKE '%Prelims%'`,
          sql`${tests.title} LIKE '%Paper-1%'`,
          sql`substr(${tests.title}, -4) BETWEEN '2020' AND '2025'`
        )
      )
      .orderBy(desc(sql<number>`CAST(substr(${tests.title}, -4) AS INTEGER)`), questions.order);

    // Group by normalized question text to find repeats
    const questionGroups = new Map<string, typeof repeatedQuestions>();
    
    repeatedQuestions.forEach(q => {
      const normalized = q.text
        .toLowerCase()
        .replace(/[^\w\sहिंदी\u0900-\u097F]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      if (!questionGroups.has(normalized)) {
        questionGroups.set(normalized, []);
      }
      questionGroups.get(normalized)!.push(q);
    });

    // Filter to only repeated questions (2+ occurrences)
    const repeatedOnly = Array.from(questionGroups.values())
      .filter(group => group.length >= 2)
      .map(group => {
        const primary = group[0]; // Use the latest occurrence as primary
        return {
          ...primary,
          options: typeof primary.options === 'string' ? JSON.parse(primary.options) : primary.options,
          count: group.length,
          years: Array.from(new Set(group.map(q => q.year))).sort((a, b) => b - a),
          occurrences: group.map(q => ({
            year: q.year,
            qNo: q.qNo,
            testTitle: q.testTitle
          }))
        };
      })
      .sort((a, b) => b.count - a.count); // Sort by repeat count

    return repeatedOnly;
  },
  ['repeated-questions-all'],
  { revalidate: 3600, tags: ['pyq-questions', 'tests'] }
);

export default async function RepeatedQuestionsAllPage() {
  const user = await verifyAuth();
  if (!user) {
    redirect('/pricing');
  }
  
  const tier = getUserTier(user);
  if (tier === 'free') {
    redirect('/pricing');
  }

  const questions = await getRepeatedQuestionsWithDetails();

  return (
    <RepeatedQuestionsAllClient questions={questions} />
  );
}

'use server';

import { db } from '@/db';
import { questions, tests } from '@/db/schema';
import { and, eq, or, inArray } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';
import { normalizeSubject } from '@/features/tests/utils/pyq-subject';

// ------------------------------------------------------------------
// 📊 Aggregation Action
// Returns: { "History": 150, "Geography": 120, ... }
// ------------------------------------------------------------------
export async function getSubjectWisePYQStats(examId?: string): Promise<Record<string, number>> {
  const cacheKey = `subject-wise-pyq-stats-${examId || 'mppsc'}`;
  
  return unstable_cache(
    async () => {
      // Step 1: Get all relevant PYQ Test IDs
      // MPPSC uses type='PYQ', UPSC uses type='UPSC_PYQ'
      const testType = examId === 'upsc' ? 'UPSC_PYQ' : 'PYQ';
      
      const pyqTests = await db
        .select({ id: tests.id, title: tests.title })
        .from(tests)
        .where(and(eq(tests.type, testType), eq(tests.isHidden, false)));

      if (pyqTests.length === 0) return {};

      const pyqTestIds = pyqTests.map((t) => t.id);

      // Step 2: Get all questions for these tests
      const allQuestions = await db
        .select({
          id: questions.id,
          subject: questions.subject,
        })
        .from(questions)
        .where(and(inArray(questions.testId, pyqTestIds)));

      // Step 3: Aggregate
      const stats: Record<string, number> = {};

      for (const q of allQuestions) {
        const raw = q.subject?.trim() || 'General Studies';
        // ALWAYS normalize to fix duplicates like 'History' and 'HISTORY'
        const canonical = normalizeSubject(raw);
        stats[canonical] = (stats[canonical] || 0) + 1;
      }

      return stats;
    },
    [cacheKey, 'v14'],
    { revalidate: 3600, tags: ['pyq-stats'] }
  )();
}

// ------------------------------------------------------------------
// 🎮 Practice Mode Fetcher (CACHED)
// Returns: Question[] but with extra `year` field and `testTitle`
// ------------------------------------------------------------------
export interface MixedQuestion {
  id: string;
  questionText: string;
  questionTextEn: string | null;
  options: unknown;
  correctAnswer: string;
  explanation: string | null;
  explanationEn: string | null;
  marks: number;
  negativeMarks: number | null;
  idealTime: number | null;
  order: number;
  subject: string | null;
  type: 'standard' | 'matching' | null;
  matchPairs: unknown; // JSON
  // Extra fields for context
  testId: string;
  year: string;
  testTitle: string;
}

// Internal fetcher - does the heavy lifting
const fetchQuestionsBySubjectData = async (subject: string, examId?: string): Promise<MixedQuestion[]> => {
  // 1. Fetch all relevant PYQ Tests to map TestID -> Year
  const testType = examId === 'upsc' ? 'UPSC_PYQ' : 'PYQ';
  
  const pyqTests = await db
    .select({
      id: tests.id,
      title: tests.title,
      createdAt: tests.createdAt,
    })
    .from(tests)
    .where(and(eq(tests.type, testType), eq(tests.isHidden, false)));

  if (pyqTests.length === 0) return [];

  // Create a Map for quick lookup: TestID -> { Year, Title }
  const testMap = new Map<string, { year: string; title: string }>();
  pyqTests.forEach((t) => {
    const yearMatch = t.title.match(/\d{4}/);
    const year = yearMatch ? yearMatch[0] : new Date(t.createdAt!).getFullYear().toString();
    testMap.set(t.id, { year, title: t.title });
  });

  // 2. Fetch ALL questions from these tests
  const allQuestions = await db
    .select()
    .from(questions)
    .where(or(...pyqTests.map((t) => eq(questions.testId, t.id))));

  // 3. Filter & Map in JS
  const filteredQuestions = allQuestions
    .filter((q) => {
      const raw = q.subject?.trim() || 'General Studies';
      return normalizeSubject(raw) === subject;
    })
    .map((q) => {
      const testInfo = testMap.get(q.testId) || { year: 'Unknown', title: 'Unknown Test' };
      return {
        ...q,
        type: q.type ?? 'standard',
        year: testInfo.year,
        testTitle: testInfo.title,
      };
    });

  return filteredQuestions;
};

// Cached version - subject-specific, revalidates every hour
export const getCachedQuestionsBySubject = unstable_cache(
  fetchQuestionsBySubjectData,
  ['pyq-questions-by-subject'],
  { revalidate: 3600, tags: ['pyq-questions', 'tests'] }
);

export async function getQuestionsBySubject(subject: string, examId?: string): Promise<MixedQuestion[]> {
  const cachedQuestions = await getCachedQuestionsBySubject(subject, examId);
  
  // Fisher-Yates Shuffle (done at runtime, not cached, for variety)
  const shuffled = [...cachedQuestions];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

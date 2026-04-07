import {
  getUnitDistributionStats,
  getRepeatedQuestions,
  getMostRepeatedTopics,
  getSubjectDistributionStats,
  getOverallWeightageSubjectData,
  getUserAccess,
} from '@/actions/pyq-analytics';
import { getSubjectWisePYQStats } from '@/features/tests/actions/pyq-analytics';
import PYQIntelligenceClient from './PYQIntelligenceClient';
import { unstable_cache } from 'next/cache';
import { Suspense } from 'react';
import LoadingSkeleton from './loading';
import type { Metadata, ResolvingMetadata } from 'next';
import { getExamContext, generateExamMetadata } from '@/lib/exam-context';

export async function generateMetadata(): Promise<Metadata> {
  const exam = await getExamContext();
  const base = await generateExamMetadata();
  return {
    ...base,
    title: `Expert PYQ Intelligence | ${exam.title}`,
    description: `Deep analysis of ${exam.id.toUpperCase()} Previous Year Questions — unit distribution, repeated questions & topic trends.`,
  };
}

// Focus dynamic rendering because page determines access based on cookies (getUserAccess)
export const dynamic = 'force-dynamic';

// ── Cached analytics functions (unique stable keys) ─────────────────────────
// Note: getRepeatedQuestions is already wrapped with unstable_cache internally,
// but we use a page-level wrapper for an extra stable route-scoped layer.
const getCachedSubjectStats = unstable_cache(
  async (examId?: string) => getSubjectDistributionStats(examId),
  ['intelligence-subject-stats-v7'],
  { revalidate: 21600 }
);
const getCachedUnitStats = unstable_cache(
  async (limit?: number, examId?: string, isPro: boolean = false) =>
    getUnitDistributionStats(limit, examId, isPro),
  ['intelligence-unit-stats-v7'],
  { revalidate: 21600 }
);
const getCachedTopicStats = unstable_cache(
  async (examId?: string) => getMostRepeatedTopics(examId),
  ['intelligence-topics-v7'],
  { revalidate: 21600 }
);
const getCachedSubjectQuestionsData = unstable_cache(
  async (limit?: number, examId?: string, isPro: boolean = false) =>
    getOverallWeightageSubjectData(limit, examId, isPro),
  ['intelligence-subject-questions-v7'],
  { revalidate: 21600 }
);

async function IntelligenceDataFetcher({ examId }: { examId: string }) {
  const { isPro } = await getUserAccess();

  // 🚀 All 5 heavy queries run in parallel — Promise.all for max speed
  const [
    subjectStats,
    unitStats,
    repeatedQuestions,
    topicStats,
    simpleSubjectStats,
    subjectQuestionsData,
  ] = await Promise.all([
    getCachedSubjectStats(examId),
    getCachedUnitStats(undefined, examId, isPro),
    getRepeatedQuestions(examId), // Already has its own unstable_cache internally
    getCachedTopicStats(examId),
    getSubjectWisePYQStats(examId), // Already has its own unstable_cache internally
    getCachedSubjectQuestionsData(undefined, examId, isPro),
  ]);

  return (
    <PYQIntelligenceClient
      subjectStats={subjectStats}
      stats={unitStats}
      repeatedQuestions={repeatedQuestions}
      topicStats={topicStats}
      simpleSubjectStats={simpleSubjectStats}
      subjectQuestionsData={subjectQuestionsData}
      isPro={isPro}
    />
  );
}

export default async function PYQIntelligencePage() {
  const exam = await getExamContext();

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <IntelligenceDataFetcher examId={exam.id} />
    </Suspense>
  );
}

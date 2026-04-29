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
import Script from 'next/script';

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
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://upsc.zenscroll.app';

const pyqIntelligencePageSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'UPSC PYQ Intelligence',
  url: `${BASE_URL}/syllabus/quiz/pyq/intelligence`,
  description:
    'UPSC PYQ Intelligence page with subject trends, repeated topics, and a 4-point explanation system.',
  mainEntity: {
    '@type': 'ItemList',
    name: 'PYQ Intelligence Explanation Model',
    numberOfItems: 4,
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Conceptual Core' },
      { '@type': 'ListItem', position: 2, name: 'Core Pillar' },
      { '@type': 'ListItem', position: 3, name: 'Logic Path' },
      { '@type': 'ListItem', position: 4, name: 'Trap Watch' },
    ],
  },
};

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
      examId={examId}
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
    <>
      <Script
        id="schema-syllabus-pyq-intelligence-page"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pyqIntelligencePageSchema) }}
      />
      <Suspense fallback={<LoadingSkeleton />}>
        <IntelligenceDataFetcher examId={exam.id} />
      </Suspense>
    </>
  );
}

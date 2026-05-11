import {
  getUnitDistributionStats,
  getRepeatedQuestions,
  getSubjectDistributionStats,
  getOverallWeightageSubjectData,
  getUserAccess,
} from '@/actions/pyq-analytics';
import { getSubjectWisePYQStats } from '@/features/tests/actions/pyq-analytics';
import PYQIntelligenceClient from '@/app/syllabus/quiz/pyq/intelligence/PYQIntelligenceClient';
import { Suspense } from 'react';
import LoadingSkeleton from '@/app/syllabus/quiz/pyq/intelligence/loading';
import type { Metadata } from 'next';
import Script from 'next/script';
import { unstable_cache } from 'next/cache';

export const metadata: Metadata = {
  title: 'UPSC Civil Services Intelligence | Premium Analytics',
  description:
    'Deep analysis of UPSC Previous Year Questions — subject distribution, trend analysis, and expert insights.',
};

// UPSC Zen is strictly dedicated to the 'upsc' exam target
const EXAM_ID = 'upsc';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://upsc.zenscroll.app';

const pyqIntelligencePageSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'UPSC PYQ Intelligence',
  url: `${BASE_URL}/upsc/intelligence`,
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

const getCachedSubjectStats = unstable_cache(
  async (examId: string) => getSubjectDistributionStats(examId),
  ['intelligence-subject-stats-v8'],
  { revalidate: 21600 }
);

const getCachedUnitStats = unstable_cache(
  async (limit: number | undefined, examId: string, isPro: boolean) =>
    getUnitDistributionStats(limit, examId, isPro),
  ['intelligence-unit-stats-v8'],
  { revalidate: 21600 }
);

const getCachedSubjectQuestionsData = unstable_cache(
  async (limit: number | undefined, examId: string, isPro: boolean) =>
    getOverallWeightageSubjectData(limit, examId, isPro),
  ['intelligence-subject-questions-v8'],
  { revalidate: 21600 }
);

export default async function UPSCIntelligencePage() {
  return (
    <>
      <Script
        id="schema-upsc-intelligence-page"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pyqIntelligencePageSchema) }}
      />
      <div className="min-h-screen bg-[#020105]">
        <Suspense fallback={<LoadingSkeleton />}>
          <IntelligenceDataFetcher />
        </Suspense>
      </div>
    </>
  );
}

async function IntelligenceDataFetcher() {
  const userAccessPromise = getUserAccess();
  const subjectStatsPromise = getCachedSubjectStats(EXAM_ID);
  const repeatedQuestionsPromise = getRepeatedQuestions(EXAM_ID);
  const simpleSubjectStatsPromise = getSubjectWisePYQStats(EXAM_ID);
  const unitStatsPromise = userAccessPromise.then(({ isPro }) =>
    getCachedUnitStats(undefined, EXAM_ID, isPro)
  );
  const subjectQuestionsDataPromise = userAccessPromise.then(({ isPro }) =>
    getCachedSubjectQuestionsData(undefined, EXAM_ID, isPro)
  );

  const [
    { isPro },
    subjectStats,
    unitStats,
    repeatedQuestions,
    simpleSubjectStats,
    subjectQuestionsData,
  ] = await Promise.all([
    userAccessPromise,
    subjectStatsPromise,
    unitStatsPromise,
    repeatedQuestionsPromise,
    simpleSubjectStatsPromise,
    subjectQuestionsDataPromise,
  ]);

  return (
    <PYQIntelligenceClient
      examId={EXAM_ID}
      subjectStats={subjectStats}
      stats={unitStats}
      repeatedQuestions={repeatedQuestions}
      simpleSubjectStats={simpleSubjectStats}
      subjectQuestionsData={subjectQuestionsData}
      isPro={isPro}
    />
  );
}

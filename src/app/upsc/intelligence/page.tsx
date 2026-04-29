import {
  getUnitDistributionStats,
  getRepeatedQuestions,
  getMostRepeatedTopics,
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
  const { isPro } = await getUserAccess();

  const [
    subjectStats,
    unitStats,
    repeatedQuestions,
    topicStats,
    simpleSubjectStats,
    subjectQuestionsData,
  ] = await Promise.all([
    getSubjectDistributionStats(EXAM_ID),
    getUnitDistributionStats(undefined, EXAM_ID, isPro),
    getRepeatedQuestions(EXAM_ID),
    getMostRepeatedTopics(EXAM_ID),
    getSubjectWisePYQStats(EXAM_ID),
    getOverallWeightageSubjectData(undefined, EXAM_ID, isPro),
  ]);

  return (
    <PYQIntelligenceClient
      examId={EXAM_ID}
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

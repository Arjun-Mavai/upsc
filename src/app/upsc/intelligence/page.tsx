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

export const metadata: Metadata = {
  title: 'UPSC Civil Services Intelligence | Premium Analytics',
  description:
    'Deep analysis of UPSC Previous Year Questions — subject distribution, trend analysis, and expert insights.',
};

// UPSC Intelligence is strictly dedicated to the 'upsc' exam target
const EXAM_ID = 'upsc';

export default async function UPSCIntelligencePage() {
  return (
    <div className="min-h-screen bg-[#020105]">
      <Suspense fallback={<LoadingSkeleton />}>
        <IntelligenceDataFetcher />
      </Suspense>
    </div>
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
    />
  );
}

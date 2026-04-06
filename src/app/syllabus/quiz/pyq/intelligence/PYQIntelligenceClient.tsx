'use client';

import { useSettingsStore } from '@/store/useSettingsStore';
import { UnitDistributionStats, RepeatedQuestion, TopicStat, SubjectDistributionStats, OverallWeightageSubjectData } from '@/actions/pyq-analytics';
import { getCurrentExam } from '@/config/exams';
import {
  PYQHeader,
  PYQMenu,
  OverallWeightage,
  PaperAnalysis,
  // MostRepeatedTopics, // Temporarily hidden
} from './components';

interface PYQIntelligenceClientProps {
  examId?: string;
  subjectStats: SubjectDistributionStats[];
  stats: UnitDistributionStats[];
  repeatedQuestions: RepeatedQuestion[];
  topicStats: Record<string, TopicStat[]>;
  simpleSubjectStats: Record<string, number>; // Same as PYQ page
  subjectQuestionsData: OverallWeightageSubjectData[];
}

export default function PYQIntelligenceClient({
  examId,
  subjectStats,
  stats,
  repeatedQuestions,
  topicStats,
  simpleSubjectStats,
  subjectQuestionsData,
}: PYQIntelligenceClientProps) {
  const { language } = useSettingsStore();
  const isHindi = language === 'hi';
  const exam = getCurrentExam(examId);

  // Compute combined stats for MostRepeatedTopics - Temporarily disabled
  /*
  const combinedStats = stats.reduce((acc, curr) => {
    if (!acc[curr.unitId]) {
      acc[curr.unitId] = {
        unitTitle: curr.unitTitle,
      };
    }
    return acc;
  }, {} as Record<string, { unitTitle: string }>);
  */

  return (
    <div className="min-h-screen bg-slate-950 pb-20 text-white selection:bg-indigo-500/30">
      {/* Background Effects */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-emerald-500/10 blur-[100px]" />
        <div className="absolute right-[-10%] bottom-[-10%] h-[500px] w-[500px] rounded-full bg-teal-500/10 blur-[100px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px] opacity-20" />
      </div>

      {/* Header */}
      <PYQHeader
        title={isHindi ? exam.nameHi : exam.name}
        subtitle={isHindi ? exam.subtitleHi : exam.subtitle}
      />

      {/* Main Content */}
      <div className="relative mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        {/* PYQ Analysis Menu - Hidden per User Request */}
        {/* <PYQMenu examId={examId} isHindi={isHindi} currentPage="intelligence" /> */}

        {/* Overall Weightage (Subject-wise 2020-2025) */}
        <OverallWeightage
          examId={examId}
          simpleSubjectStats={simpleSubjectStats}
          subjectQuestionsData={subjectQuestionsData}
          isHindi={isHindi}
        />

        {/* Most Repeated Topics - Temporarily Hidden */}
        {/* <MostRepeatedTopics
          topicStats={topicStats}
          combinedStats={combinedStats}
          isHindi={isHindi}
        /> */}

        {/* Paper-wise Analysis (Year by Year) */}
        <PaperAnalysis
          examId={examId}
          stats={stats}
          repeatedQuestions={repeatedQuestions}
          isHindi={isHindi}
        />
      </div>
    </div>
  );
}

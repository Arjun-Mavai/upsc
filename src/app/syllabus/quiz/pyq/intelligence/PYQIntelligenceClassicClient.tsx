'use client';

import { useSettingsStore } from '@/store/useSettingsStore';
import {
  UnitDistributionStats,
  RepeatedQuestion,
  SubjectDistributionStats,
  OverallWeightageSubjectData,
} from '@/actions/pyq-analytics';
import { getCurrentExam } from '@/config/exams';
import {
  PYQHeader,
  OverallWeightage,
  PaperAnalysis,
} from './components';

interface PYQIntelligenceClientProps {
  examId?: string;
  subjectStats: SubjectDistributionStats[];
  stats: UnitDistributionStats[];
  repeatedQuestions: RepeatedQuestion[];
  simpleSubjectStats: Record<string, number>; // Same as PYQ page
  subjectQuestionsData: OverallWeightageSubjectData[];
  isPro?: boolean;
}

export default function PYQIntelligenceClassicClient({
  examId,
  stats,
  repeatedQuestions,
  simpleSubjectStats,
  subjectQuestionsData,
  isPro = false,
}: PYQIntelligenceClientProps) {
  const { language } = useSettingsStore();
  const isHindi = language === 'hi';
  const exam = getCurrentExam(examId);

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
        {/* Overall Weightage (Subject-wise 2020-2025) */}
        <OverallWeightage
          examId={examId}
          simpleSubjectStats={simpleSubjectStats}
          subjectQuestionsData={subjectQuestionsData}
          isHindi={isHindi}
          isPro={isPro}
        />

        {/* Paper-wise Analysis (Year by Year) */}
        <PaperAnalysis
          examId={examId}
          stats={stats}
          repeatedQuestions={repeatedQuestions}
          isHindi={isHindi}
          isPro={isPro}
        />
      </div>
    </div>
  );
}

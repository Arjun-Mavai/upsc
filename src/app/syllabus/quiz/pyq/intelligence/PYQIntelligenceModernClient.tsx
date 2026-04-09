'use client';

import { useSettingsStore } from '@/store/useSettingsStore';
import { UnitDistributionStats, RepeatedQuestion, TopicStat, SubjectDistributionStats, OverallWeightageSubjectData } from '@/actions/pyq-analytics';
import { getCurrentExam } from '@/config/exams';
import { ModernHeader } from './components/modern/ModernHeader';
import { ModernOverallWeightage } from './components/modern/ModernOverallWeightage';
import { ModernPaperAnalysis } from './components/modern/ModernPaperAnalysis';

interface PYQIntelligenceModernClientProps {
  examId?: string;
  subjectStats: SubjectDistributionStats[];
  stats: UnitDistributionStats[];
  repeatedQuestions: RepeatedQuestion[];
  topicStats: Record<string, TopicStat[]>;
  simpleSubjectStats: Record<string, number>;
  subjectQuestionsData: OverallWeightageSubjectData[];
  isPro?: boolean;
  onToggleMode: () => void;
}

export default function PYQIntelligenceModernClient({
  examId,
  subjectStats: _subjectStats,
  stats,
  repeatedQuestions,
  topicStats: _topicStats,
  simpleSubjectStats,
  subjectQuestionsData,
  isPro = false,
  onToggleMode,
}: PYQIntelligenceModernClientProps) {
  const { language } = useSettingsStore();
  const isHindi = language === 'hi';
  const exam = getCurrentExam(examId);

  return (
    <div className="min-h-screen bg-[#F5F5F7] pb-24 text-[#1D1D1F] selection:bg-[#000000] selection:text-white font-sans antialiased">
      {/* Header */}
      <ModernHeader
        title={isHindi ? exam.nameHi : exam.name}
        subtitle="Intelligence Dashboard" // Optional clean subtitle
        onToggleMode={onToggleMode}
      />

      {/* Main Content */}
      <div className="mx-auto max-w-5xl space-y-12 px-4 py-10 sm:px-6 lg:px-8">
        
        {/* Intro Section */}
        <div className="text-center sm:text-left pt-4 pb-2">
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-[#1D1D1F]">
            {isHindi ? 'विषयवार विश्लेषण' : 'Analytics & Insights'}
          </h1>
          <p className="mt-3 text-lg text-[#86868B] max-w-2xl font-medium tracking-tight">
            {isHindi 
              ? 'पिछले वर्षों के रुझान और महत्वपूर्ण विषयों का विस्तृत विवरण।'
              : 'Detailed breakdown of previous year trends and critical subjects.'}
          </p>
        </div>

        {/* Overall Weightage */}
        <ModernOverallWeightage
          examId={examId}
          simpleSubjectStats={simpleSubjectStats}
          subjectQuestionsData={subjectQuestionsData}
          isHindi={isHindi}
          isPro={isPro}
        />

        {/* Paper-wise Analysis */}
        <ModernPaperAnalysis
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

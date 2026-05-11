'use client';

import { useSettingsStore } from '@/store/useSettingsStore';
import {
  UnitDistributionStats,
  RepeatedQuestion,
  SubjectDistributionStats,
  OverallWeightageSubjectData,
} from '@/actions/pyq-analytics';
import { getCurrentExam } from '@/config/exams';
import { ModernHeader } from './components/modern/ModernHeader';
import { ModernOverallWeightage } from './components/modern/ModernOverallWeightage';
import { ModernPaperAnalysis } from './components/modern/ModernPaperAnalysis';
import { TransitionLink } from '@/components/ui/transition-link';
import { ChevronRight, Lock } from 'lucide-react';
import { SyllabusLockModal } from '@/features/syllabus/components/SyllabusLockModal';
import { useState, useEffect } from 'react';
import { GlobalLoader } from '@/components/ui/GlobalLoader';
import { useRouter, useSearchParams } from 'next/navigation';

interface PYQIntelligenceModernClientProps {
  examId?: string;
  subjectStats: SubjectDistributionStats[];
  stats: UnitDistributionStats[];
  repeatedQuestions: RepeatedQuestion[];
  simpleSubjectStats: Record<string, number>;
  subjectQuestionsData: OverallWeightageSubjectData[];
  isPro?: boolean;
  onToggleMode: () => void;
}

export default function PYQIntelligenceModernClient({
  examId,
  stats,
  repeatedQuestions,
  simpleSubjectStats,
  subjectQuestionsData,
  isPro = false,
  onToggleMode,
}: PYQIntelligenceModernClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language } = useSettingsStore();
  const isHindi = language === 'hi';
  const exam = getCurrentExam(examId);
  const [lockModalOpen, setLockModalOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const isUPSC = examId === 'upsc';
  const baseUrl = isUPSC ? '/upsc/intelligence' : '/syllabus/quiz/pyq/intelligence';
  const viewAllUrl = `${baseUrl}/questions?subject=All&source=subject`;

  // Prefetch for instant navigation and caching
  useEffect(() => {
    router.prefetch(viewAllUrl);
  }, [router, viewAllUrl]);

  // Capture entry source (if user came from home/nav/etc.)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const source = searchParams.get('source');
    if (!source) return;
    try {
      localStorage.setItem('upsc_intelligence_entry_source', source);
      localStorage.setItem('upsc_intelligence_entry_ts', String(Date.now()));
    } catch {
      // ignore storage failures
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-[#F5F5F7] pb-24 text-[#1D1D1F] selection:bg-[#000000] selection:text-white font-sans antialiased">
      {isNavigating && (
        <GlobalLoader 
          variant="overlay" 
          theme="light" 
          label={isHindi ? 'तैयार हो रहा है...' : 'Preparing analytics...'} 
        />
      )}
      <SyllabusLockModal open={lockModalOpen} onOpenChange={setLockModalOpen} />
      {/* Header */}
      <ModernHeader
        title={isHindi ? exam.nameHi : exam.name}
        subtitle="Intelligence Dashboard" // Optional clean subtitle
        onToggleMode={onToggleMode}
      />

      {/* Main Content */}
      <div className="mx-auto max-w-5xl space-y-8 px-1.5 py-6 sm:px-6 lg:px-8">
        
        {/* Intro Section */}
        <div className="text-center sm:text-left pt-0 pb-2">
          <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight text-[#1D1D1F]">
            {isHindi ? 'विषयवार विश्लेषण' : 'Analytics & Insights'}
          </h1>
          <p className="mt-2 text-base sm:text-lg text-[#86868B] max-w-2xl font-medium tracking-tight">
            {isHindi 
              ? 'पिछले वर्षों के रुझान और महत्वपूर्ण विषयों का विस्तृत विवरण।'
              : 'Detailed breakdown of previous year trends and critical subjects.'}
          </p>

          <div className="mt-6 flex justify-center sm:justify-start">
            {isPro ? (
              <TransitionLink
                href={viewAllUrl}
                onClick={() => setIsNavigating(true)}
                transitionTypes={['slide']}
                className="group flex h-14 w-full items-center justify-center rounded-full bg-[#1D1D1F] px-8 text-sm font-semibold tracking-wide text-white shadow-md transition-all hover:scale-[1.02] hover:bg-[#333336] active:scale-95 sm:w-auto sm:min-w-[320px]"
              >
                {isNavigating ? (
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                    <span>{isHindi ? 'लोड हो रहा है...' : 'Loading...'}</span>
                  </div>
                ) : (
                  <>
                    {isHindi ? 'सभी विषय के प्रश्न देखें' : 'View All Subject Questions'}
                    <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </TransitionLink>
            ) : (
              <button
                onClick={() => setLockModalOpen(true)}
                className="group flex h-14 w-full items-center justify-center rounded-full bg-[#1D1D1F] px-8 text-sm font-semibold tracking-wide text-white shadow-md transition-all hover:scale-[1.02] hover:bg-[#333336] active:scale-95 sm:w-auto sm:min-w-[320px]"
              >
                {isHindi ? 'सभी विषय के प्रश्न देखें' : 'View All Subject Questions'}
                <Lock className="ml-2 h-4 w-4 opacity-70" />
              </button>
            )}
          </div>
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

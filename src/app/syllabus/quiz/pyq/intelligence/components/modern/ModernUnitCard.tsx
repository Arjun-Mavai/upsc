'use client';

import { useState } from 'react';
import { ChevronDown, Eye, ExternalLink, Lock, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { UnitBadge } from '../shared/UnitBadge';
import { formatUnitTitle } from '../shared/constants';
import { QuestionData } from '../QuestionItem';
import { ModernQuestionList } from './ModernQuestionList';
import { TransitionLink } from '@/components/ui/transition-link';
import { getCurrentExam } from '@/config/exams';
import { useSettingsStore } from '@/store/useSettingsStore';
import { SyllabusLockModal } from '@/features/syllabus/components/SyllabusLockModal';
import { FREE_SUBJECTS } from '@/lib/pyq-constants';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ModernUnitCardProps {
  examId?: string;
  unitId: string;
  unitTitle: string;
  questionCount: number;
  totalQuestions: number;
  questions: QuestionData[];
  isHindi: boolean;
  getRepeatCount?: (questionId: string) => number;
  defaultExpanded?: boolean;
  variant?: 'paper' | 'combined';
  showPercentage?: boolean;
  groupQuestionsByYear?: boolean;
  year?: number;
  isFlat?: boolean;
  themeBg?: string;
  themeBorder?: string;
}

export function ModernUnitCard({
  examId,
  unitId,
  unitTitle,
  questionCount,
  totalQuestions,
  questions,
  isHindi,
  getRepeatCount,
  defaultExpanded = false,
  variant = 'combined',
  showPercentage = true,
  groupQuestionsByYear = false,
  year,
  isFlat = false,
  themeBg = 'bg-white',
  themeBorder = 'border-[#E5E5EA]',
}: ModernUnitCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [lockModalOpen, setLockModalOpen] = useState(false);
  const [freeIntroOpen, setFreeIntroOpen] = useState(false);
  const [pendingToggle, setPendingToggle] = useState(false);

  const { isSubscribed, user } = useSettingsStore();
  const isPro = isSubscribed || user?.role === 'admin';
  const isFreeUnit = FREE_SUBJECTS.includes(unitId);
  const isUnlocked = isPro || isFreeUnit;
  const isFreeSubjectNotPro = !isPro && isFreeUnit;

  const FREE_INTRO_KEY = 'upsc-intelligence';

  const percentage = totalQuestions > 0 ? Math.round((questionCount / totalQuestions) * 100) : 0;
  const exam = getCurrentExam(examId);
  const isSubjectMode = exam.layoutMode === 'SUBJECT_WISE';

  const isUPSC = examId === 'upsc';
  const intelligenceBase = isUPSC ? '/upsc/intelligence' : '/syllabus/quiz/pyq/intelligence';

  const viewAllUrl = isSubjectMode
    ? `${intelligenceBase}/questions?subject=${unitId}&source=${variant}${year ? `&year=${year}` : ''}`
    : `${intelligenceBase}/questions?unit=${unitId}&source=${variant}${year ? `&year=${year}` : ''}`;

  const toggleSection = () => {
    if (!isUnlocked) {
      setLockModalOpen(true);
      return;
    }
    // One-time intro modal for free unlock experience (UPSC Intelligence only)
    if (isFreeSubjectNotPro && typeof window !== 'undefined') {
      const seen = localStorage.getItem(FREE_INTRO_KEY) === 'seen';
      if (!seen) {
        setPendingToggle(true);
        setFreeIntroOpen(true);
        return;
      }
    }
    setIsExpanded(!isExpanded);
  };

  const handleActionClick = (e: React.MouseEvent) => {
    if (!isPro) {
      e.preventDefault();
      setLockModalOpen(true);
    }
  };

  return (
    <div className={cn(
      "relative overflow-hidden transition-all",
      isFlat 
        ? cn("bg-transparent border-b border-black/[0.03] last:border-0", themeBg) 
        : "rounded-2xl border border-[#E5E5EA] bg-white text-[#1D1D1F] hover:border-[#D1D1D6] hover:shadow-[0_2px_12px_rgba(0,0,0,0.03)]"
    )}>
      <SyllabusLockModal open={lockModalOpen} onOpenChange={setLockModalOpen} />

      {/* One-time Free Intro (only for free users opening free units) */}
      <Dialog open={freeIntroOpen} onOpenChange={setFreeIntroOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-black tracking-tight text-slate-900">
              {isHindi ? 'फ्री इंटेलिजेंस (Demo)' : 'Free Intelligence (Demo)'}
            </DialogTitle>
            <DialogDescription className="text-sm font-medium leading-relaxed text-slate-600">
              {isHindi
                ? 'आप अभी फ्री यूनिट खोल रहे हैं। यहाँ आपको स्टाइल और एनालिसिस का “डेमो” मिलेगा — बाकी विषय Pro में अनलॉक होते हैं।'
                : 'You’re opening a free unit. This is a quick demo of the Intelligence format — full subjects unlock with Pro.'}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-2 space-y-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-bold tracking-widest text-slate-500 uppercase">
                {isHindi ? 'टिप' : 'Tip'}
              </p>
              <p className="mt-1 text-sm font-medium text-slate-700">
                {isHindi
                  ? 'पहले 30 सेकंड में बस headings पढ़ो — फिर details।'
                  : 'Scan the headings first (30s), then read details.'}
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => {
                  setFreeIntroOpen(false);
                  setPendingToggle(false);
                }}
              >
                {isHindi ? 'अभी नहीं' : 'Not now'}
              </Button>
              <Button
                className="flex-1 rounded-xl bg-slate-900 text-white hover:bg-slate-800"
                onClick={() => {
                  try {
                    localStorage.setItem(FREE_INTRO_KEY, 'seen');
                  } catch {}
                  setFreeIntroOpen(false);
                  if (pendingToggle) setIsExpanded(true);
                  setPendingToggle(false);
                }}
              >
                {isHindi ? 'ओपन करें' : 'Open'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {isFreeSubjectNotPro && (
        <div className="absolute top-0 right-8 z-20">
          <div className="flex items-center gap-1 rounded-b bg-[#1D1D1F] px-2 py-1 text-[9px] font-bold tracking-widest text-white uppercase">
            <Sparkles className="h-3 w-3" />
            {isHindi ? 'फ्री' : 'FREE'}
          </div>
        </div>
      )}

      {/* Header */}
      <div 
        className={cn(
          "flex cursor-pointer items-center gap-4 transition-all",
          isFlat ? "p-3.5 sm:px-6 sm:py-4" : "p-4 sm:p-5",
          !isUnlocked && 'opacity-60 grayscale-[0.8]'
        )} 
        onClick={toggleSection}
      >
        <div className="relative">
          <UnitBadge unitId={unitId} size="lg" />
          {!isUnlocked && (
            <div className="absolute -bottom-1 -right-1 rounded-full bg-white p-1 shadow-sm border border-[#E5E5EA]">
              <Lock className="h-3 w-3 text-[#86868B]" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className={cn(
              "truncate tracking-tight",
              isFlat ? "text-[14px] font-bold text-[#1D1D1F]" : "text-[15px] font-semibold text-[#1D1D1F]"
            )}>
              {formatUnitTitle(unitId, isHindi)}
            </h4>
            <span className="inline-flex items-center justify-center rounded-full bg-[#F5F5F7] px-2 py-0.5 text-[10px] font-medium text-[#86868B]">
              {questionCount}
            </span>
          </div>
          
          {!isSubjectMode && (
            <p className="mt-0.5 truncate text-[13px] text-[#86868B] font-medium">
              {unitTitle}
            </p>
          )}

          {showPercentage && (
            <div className="mt-2.5 flex items-center gap-3">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#F5F5F7]">
                <div 
                  className="h-full bg-[#1D1D1F] rounded-full" 
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-[#86868B]">
                {percentage}%
              </span>
            </div>
          )}
        </div>

        <div className={cn(
          "shrink-0 flex items-center justify-center rounded-full transition-all duration-300",
          isFlat 
            ? cn("h-7 w-7", isExpanded ? "bg-[#1D1D1F] text-white" : "bg-black/[0.05]") 
            : "h-8 w-8 bg-[#F5F5F7] text-[#86868B]"
        )}>
          {isUnlocked ? (
            <ChevronDown className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-180")} />
          ) : (
            <Lock className="h-4 w-4" />
          )}
        </div>
      </div>

      {/* Content */}
      <AnimatePresence>
        {isExpanded && isUnlocked && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className={cn(
              "border-t border-black/[0.04]",
              isFlat ? "bg-white/50" : "bg-[#FAFAFB]"
            )}>
              {/* Toolbar */}
              <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-[#F5F5F7]/60">
                <span className="text-[11px] font-bold tracking-widest text-[#86868B] uppercase">
                  {isHindi ? 'प्रश्न' : 'Questions'} ({questions.length})
                </span>
                <div className="flex items-center gap-3">
                  <TransitionLink
                    href={viewAllUrl}
                    onClick={handleActionClick}
                    transitionTypes={['slide']}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#1D1D1F] px-3 py-1 text-[11px] font-bold text-white transition-transform hover:scale-105 active:scale-95"
                  >
                    <ExternalLink className="h-3 w-3" />
                    {isHindi ? 'सभी देखें' : 'View All'}
                  </TransitionLink>
                </div>
              </div>

              {/* Questions List */}
              <div className={cn("overflow-y-auto", isFlat ? "px-0 pb-2" : "px-4 sm:px-6 py-4", 'max-h-[60vh]')}>
                <ModernQuestionList
                  questions={questions}
                  isHindi={isHindi}
                  getRepeatCount={getRepeatCount}
                  showYears={true}
                  groupByYear={groupQuestionsByYear}
                  examId={examId}
                  isPro={isPro}
                  onLockedClick={() => setLockModalOpen(true)}
                  variant="flat"
                />

                {!isPro && questionCount > questions.length && (
                  <div className="mt-6 mb-2">
                    <button
                      onClick={() => setLockModalOpen(true)}
                      className="flex h-12 w-full items-center justify-center rounded-xl bg-[#1D1D1F] text-[13px] font-semibold text-white shadow-sm transition-all hover:scale-[1.01] active:scale-95"
                    >
                      <Lock className="mr-2 h-4 w-4" />
                      {isHindi
                        ? `${questionCount - questions.length} और प्रश्न अनलॉक करें`
                        : `Unlock ${questionCount - questions.length} More Questions`}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

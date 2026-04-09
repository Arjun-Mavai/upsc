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
}: ModernUnitCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [showAllQuestions, setShowAllQuestions] = useState(false);
  const [lockModalOpen, setLockModalOpen] = useState(false);

  const { isSubscribed, user } = useSettingsStore();
  const isPro = isSubscribed || user?.role === 'admin';
  const isFreeUnit = FREE_SUBJECTS.includes(unitId);
  const isUnlocked = isPro || isFreeUnit;
  const isFreeSubjectNotPro = !isPro && isFreeUnit;

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
        ? "bg-transparent border-b last:border-0" 
        : "rounded-2xl border border-[#E5E5EA] bg-white text-[#1D1D1F] hover:border-[#D1D1D6] hover:shadow-[0_2px_12px_rgba(0,0,0,0.03)]"
    )}>
      <SyllabusLockModal open={lockModalOpen} onOpenChange={setLockModalOpen} />

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
          isFlat ? "p-3 sm:p-5" : "p-4 sm:p-5",
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
            ? cn("h-7 w-7", isExpanded ? "bg-[#1D1D1F] text-white" : "bg-white/60") 
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
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="overflow-hidden"
          >
            <div className={cn(
              "border-t border-[#F5F5F7]/20",
              isFlat ? "" : "bg-[#FAFAFB]"
            )}>
              {/* Toolbar */}
              <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-[#F5F5F7]/60">
                <span className="text-[11px] font-bold tracking-widest text-[#86868B] uppercase">
                  {isHindi ? 'प्रश्न' : 'Questions'} ({questions.length})
                </span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAllQuestions(!showAllQuestions);
                    }}
                    className="flex items-center gap-1.5 text-[12px] font-semibold text-[#86868B] hover:text-[#1D1D1F] transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    {showAllQuestions
                      ? isHindi ? 'संक्षिप्त' : 'Collapse'
                      : isHindi ? 'विस्तार' : 'Expand'}
                  </button>
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
              <div className={cn("overflow-y-auto px-4 sm:px-6 py-4", showAllQuestions ? 'max-h-none' : 'max-h-[60vh]')}>
                <ModernQuestionList
                  questions={questions}
                  isHindi={isHindi}
                  getRepeatCount={getRepeatCount}
                  showYears={true}
                  groupByYear={groupQuestionsByYear}
                  showAllExpanded={showAllQuestions}
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

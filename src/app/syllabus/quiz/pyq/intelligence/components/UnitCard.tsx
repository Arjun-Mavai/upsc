'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Eye, ExternalLink, Lock, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { UnitBadge } from './shared/UnitBadge';
import { formatUnitTitle, getUnitColor } from './shared/constants';
import { QuestionList, QuestionData } from './QuestionItem';
import { TransitionLink } from '@/components/ui/transition-link';
import { getCurrentExam } from '@/config/exams';
import { useSettingsStore } from '@/store/useSettingsStore';
import { SyllabusLockModal } from '@/features/syllabus/components/SyllabusLockModal';
import { FREE_SUBJECTS } from '@/lib/pyq-constants';

interface UnitCardProps {
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
}

export function UnitCard({
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
}: UnitCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [showAllQuestions, setShowAllQuestions] = useState(false);
  const [lockModalOpen, setLockModalOpen] = useState(false);

  const { isSubscribed, user } = useSettingsStore();
  const isPro = isSubscribed || user?.role === 'admin';
  const isFreeUnit = FREE_SUBJECTS.includes(unitId);
  const isUnlocked = isPro || isFreeUnit;
  const isFreeSubjectNotPro = !isPro && isFreeUnit;

  const percentage = totalQuestions > 0 ? Math.round((questionCount / totalQuestions) * 100) : 0;
  const colorClass = getUnitColor(unitId);
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
    <div className="group relative transition-all duration-300">
      <div
        className={cn(
          'relative z-10 rounded-xl border transition-colors',
          isFreeSubjectNotPro
            ? 'border-amber-500/60 bg-amber-500/[0.02] shadow-[0_0_40px_rgba(245,158,11,0.15)]'
            : isUnlocked
              ? 'border-slate-800/50 bg-slate-800/30 hover:bg-slate-800/50'
              : 'border-slate-800/20 bg-slate-900/20 opacity-75 grayscale-[0.3]'
        )}
      >
        <SyllabusLockModal open={lockModalOpen} onOpenChange={setLockModalOpen} />

        {/* Free Access Ribbon for History */}
        {isFreeSubjectNotPro && (
          <div className="absolute top-0 right-10 z-20">
            <div className="relative">
              <div className="absolute inset-0 bg-amber-500 opacity-20 blur-md" />
              <div className="relative flex items-center gap-1.5 rounded-b-lg bg-amber-500 px-3 py-1 text-[8px] font-black tracking-[0.1em] text-black uppercase shadow-lg">
                <Sparkles className="h-2.5 w-2.5 fill-black" />
                {isHindi ? 'फ्री' : 'FREE'}
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex cursor-pointer items-center gap-4 p-4 sm:p-5" onClick={toggleSection}>
          <div className="relative">
            <UnitBadge unitId={unitId} size="lg" />
            {!isUnlocked && (
              <div className="absolute -top-1 -right-1 rounded-full bg-slate-950 p-1 shadow-lg ring-1 ring-white/10">
                <Lock className="h-2.5 w-2.5 text-amber-500" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h4 className="truncate text-sm font-bold text-white">
                {formatUnitTitle(unitId, isHindi)}
              </h4>
              <Badge
                variant="secondary"
                className="h-5 shrink-0 border border-slate-700 bg-slate-900 px-2 font-mono text-[10px] text-slate-400"
              >
                {questionCount}
              </Badge>
            </div>
            {!isSubjectMode && (
              <p className="mt-0.5 truncate text-xs text-slate-500">{unitTitle}</p>
            )}

            {showPercentage && (
              <div className="mt-2 flex items-center gap-2">
                <Progress
                  value={percentage}
                  className={cn('h-1.5 flex-1 bg-slate-800', `[&>div]:${colorClass}`)}
                />
                <span className="text-xs font-medium text-slate-400 tabular-nums">
                  {percentage}%
                </span>
              </div>
            )}
          </div>

          <div className="shrink-0">
            {isUnlocked ? (
              isExpanded ? (
                <ChevronUp className="h-5 w-5 text-emerald-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-slate-600" />
              )
            ) : (
              <Lock className="h-4 w-4 text-slate-600" />
            )}
          </div>
        </div>

        {/* Expanded content */}
        <AnimatePresence>
          {isExpanded && isUnlocked && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="border-t border-slate-800/50">
                <div className="flex items-center justify-between px-4 py-3 sm:px-5">
                  <span className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
                    {isHindi ? 'प्रश्न' : 'Questions'} ({questions.length})
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowAllQuestions(!showAllQuestions);
                      }}
                      className="h-7 gap-1.5 px-2 text-xs text-slate-400 hover:bg-white/10 hover:text-white"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      {showAllQuestions
                        ? isHindi
                          ? 'संक्षिप्त'
                          : 'Collapse'
                        : isHindi
                          ? 'विस्तार'
                          : 'Expand'}
                    </Button>
                    <TransitionLink
                      href={viewAllUrl}
                      onClick={handleActionClick}
                      transitionTypes={['slide']}
                      className="inline-flex h-7 items-center gap-1.5 rounded-md bg-emerald-500/10 px-3 text-xs font-bold text-emerald-400 transition-colors hover:bg-emerald-500/20 hover:text-emerald-300"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      {isHindi ? 'सभी देखें' : 'View All'}
                    </TransitionLink>
                  </div>
                </div>

                <div
                  className={cn(
                    'overflow-y-auto',
                    showAllQuestions ? 'max-h-none' : 'max-h-[80vh] sm:max-h-none'
                  )}
                >
                  <QuestionList
                    questions={questions}
                    isHindi={isHindi}
                    getRepeatCount={getRepeatCount}
                    showYears={true}
                    groupByYear={groupQuestionsByYear}
                    variant="card"
                    showAllExpanded={showAllQuestions}
                    examId={examId}
                    isPro={isPro}
                  />

                  {/* Lock Footer for non-pro if more questions exist */}
                  {!isPro && questionCount > questions.length && (
                    <div className="mx-4 mt-4 mb-6">
                      <Button
                        onClick={() => setLockModalOpen(true)}
                        className="h-12 w-full rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-xs font-black tracking-widest text-white uppercase shadow-xl shadow-amber-900/20"
                      >
                        <Lock className="mr-2 h-4 w-4" />
                        {isHindi
                          ? `${questionCount - questions.length} और प्रश्न अनलॉक करें`
                          : `Unlock ${questionCount - questions.length} More Questions`}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

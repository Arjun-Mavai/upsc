'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronDown, ChevronUp, Repeat, Sparkles, Brain, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { YearBadge } from './shared/UnitBadge';
import { useSettingsStore } from '@/store/useSettingsStore';
import { UPSCQuestionRenderer } from '@/features/tests/components/UPSCQuestionRenderer';
import { UPSCPremiumQuestionCard } from '@/components/ui/UPSCPremiumQuestionCard';
import { PremiumExplanation } from '@/features/tests/components/PremiumExplanation';
import { SUBJECT_VARIANTS, SUBJECTS } from '@/lib/pyq-ui-constants';
import { RenderTableQuestion } from '@/features/tests/utils/questionFormatter';
import { toast } from 'sonner';

export interface QuestionData {
  id: string;
  text: string;
  textEn?: string | null;
  year: number;
  qNo?: number;
  subject?: string;
  testTitle?: string;
  options?: any; // Can be string[] or DB JSON [{id, text, text_en}]
  optionsEn?: string[];
  correctAnswer?: number | string;
  extendedData?: any;
  explanation?: string | null;
  explanationEn?: string | null;
  type?: string;
  matchPairs?: any[];
}

interface QuestionItemProps {
  question: QuestionData;
  index: number;
  isHindi: boolean;
  repeatCount?: number;
  showYear?: boolean;
  variant?: 'compact' | 'full' | 'card';
  defaultExpanded?: boolean;
  examId?: string;
  isFreeAccess?: boolean;
}

export function QuestionItem({
  question,
  index,
  isHindi,
  repeatCount = 0,
  showYear = true,
  variant = 'compact',
  defaultExpanded = false,
  examId,
  isFreeAccess = false,
}: QuestionItemProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const { user } = useSettingsStore();
  const isAdmin = user?.role === 'admin';
  const displayText = isHindi ? question.text : question.textEn || question.text;
  const altText = isHindi ? question.textEn : question.text;

  // Helper to normalize options and correct answer
  const normalizedOptions = useMemo(() => {
    if (!question.options) return [];

    try {
      // If it's already an array, check if it's strings or objects
      if (Array.isArray(question.options)) {
        if (question.options.length === 0) return [];

        if (typeof question.options[0] === 'string') {
          return (question.options as string[]).map((opt, i) => ({
            id: String.fromCharCode(65 + i),
            text: opt,
            textEn: question.optionsEn?.[i] || opt,
          }));
        }

        // Handle DB JSON format: [{id, text, text_en}]
        return (question.options as any[]).map((opt) => ({
          id: opt.id || '',
          text: opt.text || '',
          textEn: opt.text_en || opt.text || opt.textEn || '',
        }));
      }

      // If it's a string, try parsing
      if (typeof question.options === 'string') {
        const opts = JSON.parse(question.options);
        if (Array.isArray(opts)) {
          return opts.map((opt) => ({
            id: opt.id || '',
            text: opt.text || '',
            textEn: opt.text_en || opt.text || opt.textEn || '',
          }));
        }
      }
    } catch (e) {
      console.error('Error normalizing options for question:', question.id, e);
    }
    return [];
  }, [question.options, question.optionsEn, question.id]);

  const correctIdx = useMemo(() => {
    if (question.correctAnswer === undefined || question.correctAnswer === null) return -1;
    if (typeof question.correctAnswer === 'number') return question.correctAnswer;

    // Match 'A', 'B', 'C', 'D' to 0, 1, 2, 3
    const ans = String(question.correctAnswer).toUpperCase();
    const charCode = ans.charCodeAt(0);
    if (ans.length === 1 && charCode >= 65 && charCode <= 68) return charCode - 65;

    // Fallback: try to find by ID or text in normalized options
    return normalizedOptions.findIndex((opt) => 
      String(opt.id).toUpperCase() === ans || 
      String(opt.text).trim().toLowerCase() === String(question.correctAnswer).trim().toLowerCase() ||
      String(opt.textEn).trim().toLowerCase() === String(question.correctAnswer).trim().toLowerCase()
    );
  }, [question.correctAnswer, normalizedOptions]);

  if (variant === 'card') {
    return (
      <div
        className={cn('group relative transition-all duration-300', isFreeAccess && 'scale-[1.01]')}
      >
        <Card
          className={cn(
            'relative z-10 overflow-hidden rounded-[2rem] border-white/[0.03] bg-slate-900/40 shadow-2xl backdrop-blur-sm transition-all duration-300',
            isExpanded ? 'bg-[#0b081a]/80 ring-1 ring-violet-500/20' : 'hover:bg-slate-900/60',
            isFreeAccess &&
              'border-amber-500/60 bg-amber-500/[0.02] shadow-[0_0_40px_rgba(245,158,11,0.15)] ring-2 ring-amber-500/30'
          )}
        >
          {/* Free Access Header Ribbon */}
          {isFreeAccess && (
            <div className="absolute top-0 right-4 sm:right-10">
              <div className="relative">
                <div className="absolute inset-0 bg-amber-500 opacity-20 blur-md" />
                <div className="relative flex items-center gap-1.5 rounded-b-xl bg-amber-500 px-3 py-1 sm:px-4 sm:py-1.5 text-[8px] sm:text-[9px] font-black tracking-[0.1em] sm:tracking-[0.2em] text-black uppercase shadow-lg">
                  <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3 fill-black" />
                  {isHindi ? 'फ्री एक्सेस' : 'FREE ACCESS'}
                </div>
              </div>
            </div>
          )}

          {/* Question Header Area */}
          <div
            className="flex cursor-pointer items-start gap-3 sm:gap-5 p-4 sm:p-7"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {/* Styled Numbering */}
            <div className="relative flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center">
              <div
                className={cn(
                  'absolute inset-0 rotate-45 rounded-lg sm:rounded-xl transition-colors',
                  isFreeAccess
                    ? 'bg-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)] group-hover:bg-amber-500/40'
                    : 'bg-amber-500/10 group-hover:bg-amber-500/20'
                )}
              />
              <span
                className={cn(
                  'relative text-xs sm:text-sm font-black',
                  isFreeAccess ? 'text-amber-400' : 'text-amber-500'
                )}
              >
                {index + 1}
              </span>
            </div>

            <div className="min-w-0 flex-1 pt-0.5 sm:pt-1">
              <div
                className={cn(
                  'text-[14px] leading-[1.5] sm:text-[15px] sm:leading-[1.6] font-medium tracking-tight text-slate-100 sm:text-[17px]',
                  !isExpanded && 'line-clamp-2'
                )}
                dangerouslySetInnerHTML={{
                  __html: isExpanded
                    ? displayText
                    : displayText.slice(0, 180) + (displayText.length > 180 ? '...' : ''),
                }}
              />

              <div className="mt-3 flex flex-wrap items-center gap-2 sm:gap-3">
                <YearBadge
                  year={question.year ?? 2020}
                  variant="amber"
                  className="border-amber-500/20 bg-amber-500/10 px-2 sm:px-2.5 py-0.5 sm:py-1 text-[9px] sm:text-[10px] font-black text-amber-500 uppercase"
                />
                {question.subject && (
                  <Badge
                    className={cn(
                      'border px-2 sm:px-3 py-0.5 sm:py-1 text-[9px] sm:text-[10px] font-black tracking-widest uppercase transition-all',
                      (() => {
                        const subMeta = SUBJECTS.find(
                          (s) => s.name === question.subject || s.nameHi === question.subject
                        );
                        const variantStyle = SUBJECT_VARIANTS[subMeta?.color || 'slate'];
                        return cn(variantStyle.bg, variantStyle.text, variantStyle.border);
                      })()
                    )}
                  >
                    {question.subject}
                  </Badge>
                )}

                {isAdmin && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(question.id);
                      toast.success('ID Copied: ' + question.id);
                    }}
                    className="rounded-md bg-amber-500/10 px-2 py-0.5 font-mono text-[9px] font-bold text-amber-500 ring-1 ring-amber-500/30 transition-all hover:bg-amber-500/20 active:scale-95"
                  >
                    ID: {question.id}
                  </button>
                )}

                {question.qNo && (
                  <span className="text-[9px] sm:text-[10px] font-black tracking-widest text-slate-500 uppercase text-nowrap">
                    SET-Q{question.qNo}
                  </span>
                )}
                {repeatCount > 1 && (
                  <Badge className="h-5 border-none bg-rose-500/20 px-1.5 text-[9px] sm:text-[10px] text-rose-400">
                    <Repeat className="mr-0.5 h-3 w-3" />
                    {isHindi ? `${repeatCount}x रिपीट` : `Repeated ${repeatCount}x`}
                  </Badge>
                )}
              </div>
            </div>

            <div className="mt-1 flex shrink-0 items-center">
              <div
                className={cn(
                  'flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-white/5 text-slate-500 transition-all',
                  isExpanded
                    ? 'rotate-180 bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                    : 'group-hover:text-slate-300',
                  isFreeAccess &&
                    !isExpanded &&
                    'animate-pulse bg-amber-500/10 text-amber-400 ring-2 ring-amber-500/40'
                )}
              >
                <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
            </div>
          </div>

          {/* Expanded Content Area */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                className="overflow-hidden"
              >
                <div className="space-y-6 border-t border-white/[0.05] bg-slate-950/40 p-5 sm:p-7">
                  {examId === 'upsc' || variant === 'card' ? (
                    <div className="space-y-6">
                      <UPSCQuestionRenderer 
                        question={question as any} 
                        isHindi={isHindi} 
                        showOptions={isFreeAccess} 
                      />
                      {isFreeAccess && (question.explanation || question.explanationEn) && (
                        <div className="pt-4 border-t border-white/5">
                          <PremiumExplanation 
                            explanation={question.explanation || ''} 
                            explanationEn={question.explanationEn} 
                            language={isHindi ? 'hi' : 'en'}
                            darkMode={true}
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      {/* 1. Table Content (if matching) */}
                      {question.type === 'matching' &&
                        question.matchPairs &&
                        question.matchPairs.length > 0 && (
                          <div className="rounded-2xl border border-white/5 bg-slate-900/50 p-4 shadow-inner mb-4">
                            <RenderTableQuestion
                              matchPairs={question.matchPairs}
                              language={isHindi ? 'hi' : 'en'}
                              darkMode={true}
                            />
                          </div>
                        )}

                      {/* 2. Translation Alternative Fallback */}
                      {altText && altText !== displayText && (
                        <div className="relative rounded-2xl border-l-[3px] border-amber-500/30 bg-amber-500/[0.03] p-4 text-[13px] leading-relaxed text-slate-400 italic mb-4">
                          <div className="mb-1 text-[9px] font-black tracking-tighter text-amber-400/60 uppercase opacity-50">
                            Translated Reference
                          </div>
                          <div dangerouslySetInnerHTML={{ __html: altText }} />
                        </div>
                      )}
                    </>
                  )}

                  {(() => {
                    const isUPSC = examId === 'upsc';
                    const baseUrl = isUPSC ? '/upsc/intelligence' : '/syllabus/quiz/pyq/intelligence';
                    const subjectName = isHindi 
                      ? SUBJECTS.find((s) => s.name === question.subject)?.nameHi || question.subject
                      : question.subject;

                    return (
                      <div className="pt-4">
                        <Link
                          href={`${baseUrl}/questions?subject=${encodeURIComponent(question.subject || 'All')}&source=subject`}
                          className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-500 transition-colors hover:text-amber-400"
                        >
                          {isHindi 
                            ? `${subjectName} के सभी प्रश्न देखें` 
                            : `See all ${subjectName} questions`}
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                    );
                  })()}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="group/question relative">
        <div
          className="flex cursor-pointer items-start gap-3 p-4 transition-all hover:bg-slate-800/40 sm:p-5"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-800 font-mono text-[10px] text-slate-500">
            {index + 1}
          </span>

          <div className="min-w-0 flex-1">
            {examId === 'upsc' ? (
              <UPSCQuestionRenderer question={question as any} isHindi={isHindi} />
            ) : question.extendedData ? (
              <UPSCPremiumQuestionCard
                extendedData={question.extendedData}
                isHindi={isHindi}
                isExpanded={isExpanded}
              />
            ) : (
              <p
                className={cn(
                  'text-sm leading-relaxed text-slate-300 transition-colors',
                  isExpanded ? 'text-white' : 'line-clamp-2'
                )}
              >
                {displayText}
              </p>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {question.subject && (
              <Badge
                variant="outline"
                className="hidden h-5 border-emerald-500/30 bg-emerald-500/10 px-1.5 text-[9px] font-black tracking-tight text-emerald-400 uppercase sm:inline-flex"
              >
                {question.subject}
              </Badge>
            )}
            {question.qNo && (
              <span className="font-mono text-[10px] text-slate-500">Q{question.qNo}</span>
            )}
            {showYear && <YearBadge year={question.year} variant="emerald" />}
            {repeatCount > 1 && (
              <Badge className="h-5 border-none bg-rose-500/20 px-1.5 text-[10px] text-rose-400">
                <Repeat className="mr-0.5 h-3 w-3" />
                {isHindi ? `${repeatCount}x रिपीट` : `Repeated ${repeatCount}x`}
              </Badge>
            )}
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-emerald-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-slate-600" />
            )}
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-3 border-t border-slate-800/50 bg-slate-900/50 px-4 py-4 sm:px-5">
                {/* Full question text or Extended Data is handled in the header itself for compact variant */}
                {!question.extendedData && (
                  <p className="text-sm leading-relaxed text-slate-200">{displayText}</p>
                )}

                {/* Alternate language */}
                {altText && altText !== displayText && !question.extendedData && (
                  <p className="text-xs leading-relaxed text-slate-500 italic">{altText}</p>
                )}

                {/* Options if available (Skip if UPSC renderer already handles them) */}
                {normalizedOptions.length > 0 && examId !== 'upsc' && (
                  <div className="mt-3 space-y-2">
                    {normalizedOptions.map((opt, i) => {
                      const isCorrect = correctIdx === i;
                      return (
                        <div
                          key={i}
                          className={cn(
                            'rounded-lg border px-3 py-2 text-sm',
                            isCorrect
                              ? 'border-green-500/30 bg-green-500/10 text-green-300'
                              : 'border-slate-700/50 bg-slate-800/30 text-slate-400'
                          )}
                        >
                          <span className="font-medium">{opt.id}.</span>{' '}
                          {isHindi ? opt.text : opt.textEn || opt.text}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* View full question link */}
                <Link
                  href={`/syllabus/quiz/pyq/question/${question.id}`}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300"
                >
                  {isHindi ? 'पूरा प्रश्न देखें' : 'View full question'}
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Full variant - used in detailed views
  return (
    <Link href={`/syllabus/quiz/pyq/question/${question.id}`} className="block">
      <div className="group/question relative cursor-pointer overflow-hidden bg-slate-950/20 p-5 transition-all hover:bg-slate-900/40 sm:p-6">
        <div className="flex items-start gap-4">
          {showYear && (
            <div className="mt-1 flex items-center gap-1.5">
              {question.qNo && (
                <span className="font-mono text-[10px] text-slate-500">Q{question.qNo}</span>
              )}
              {question.subject && (
                <Badge
                  variant="outline"
                  className="h-5 border-emerald-500/30 bg-emerald-500/10 px-1.5 text-[9px] font-black tracking-tight text-emerald-400 uppercase sm:inline-flex"
                >
                  {question.subject}
                </Badge>
              )}
              <YearBadge year={question.year} variant="emerald" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            {examId === 'upsc' ? (
              <div className="cursor-default">
                <UPSCQuestionRenderer question={question as any} isHindi={isHindi} />
              </div>
            ) : question.extendedData ? (
              <UPSCPremiumQuestionCard
                extendedData={question.extendedData}
                isHindi={isHindi}
                isExpanded={true}
              />
            ) : (
              <>
                <p className="text-sm leading-relaxed font-medium break-words whitespace-normal text-slate-300 transition-colors group-hover/question:text-white sm:text-base">
                  {displayText}
                </p>
                {altText && altText !== displayText && (
                  <p className="mt-2 text-xs leading-relaxed break-words whitespace-normal text-slate-500 italic sm:text-sm">
                    {altText}
                  </p>
                )}
              </>
            )}
          </div>
          {repeatCount > 1 && (
            <Badge className="shrink-0 border-none bg-rose-500/20 px-2 py-1 text-xs text-rose-400">
              <Repeat className="mr-1 h-3 w-3" />
              {repeatCount}x
            </Badge>
          )}
          <ArrowRight className="h-4 w-4 shrink-0 -translate-x-1 text-slate-800 opacity-0 transition-all group-hover/question:translate-x-0 group-hover/question:text-emerald-500 group-hover/question:opacity-100" />
        </div>
      </div>
    </Link>
  );
}

interface QuestionListProps {
  questions: QuestionData[];
  isHindi: boolean;
  getRepeatCount?: (questionId: string) => number;
  showYears?: boolean;
  groupByYear?: boolean;
  maxVisible?: number;
  variant?: 'compact' | 'full' | 'card';
  showAllExpanded?: boolean;
  examId?: string;
  isPro?: boolean;
}

const FREE_SUBJECT = 'History';
const FREE_LIMIT = 5;

export function QuestionList({
  questions,
  isHindi,
  getRepeatCount,
  showYears = true,
  groupByYear = false,
  maxVisible,
  variant = 'compact',
  showAllExpanded = false,
  examId,
  isPro = false,
}: QuestionListProps) {
  const [showAll, setShowAll] = useState(false);

  if (groupByYear) {
    // Group questions by year
    const byYear = questions.reduce(
      (acc, q) => {
        if (!acc[q.year]) acc[q.year] = [];
        acc[q.year].push(q);
        return acc;
      },
      {} as Record<number, QuestionData[]>
    );

    const sortedYears = Object.keys(byYear)
      .map(Number)
      .sort((a, b) => b - a);

    return (
      <div
        className={cn(
          'divide-y divide-slate-800/30',
          variant === 'card' && 'space-y-4 divide-none p-4'
        )}
      >
        {sortedYears.map((year) => (
          <div key={year} className={cn(variant === 'card' && 'space-y-3')}>
            <div
              className={cn(
                'sticky top-0 z-10 flex items-center gap-2 bg-slate-900/95 px-4 py-2 backdrop-blur-sm',
                variant === 'card' && 'relative top-auto z-0 bg-transparent px-0 py-1'
              )}
            >
              <YearBadge year={year} variant="emerald" />
              <span className="text-xs text-slate-500">
                ({byYear[year].length} {isHindi ? 'प्रश्न' : 'questions'})
              </span>
            </div>
            <div
              className={cn(
                'divide-y divide-slate-800/20',
                variant === 'card' && 'grid gap-3 divide-none'
              )}
            >
              {byYear[year].map((q, idx) => {
                const isHistory = q.subject === FREE_SUBJECT;
                const isFreeAccess = !isPro && (idx < FREE_LIMIT || isHistory);

                return (
                  <QuestionItem
                    key={q.id}
                    question={q}
                    index={idx}
                    isHindi={isHindi}
                    repeatCount={getRepeatCount?.(q.id) || 0}
                    showYear={false}
                    variant={variant}
                    defaultExpanded={showAllExpanded}
                    examId={examId}
                    isFreeAccess={isFreeAccess}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  }

  const visibleQuestions = maxVisible && !showAll ? questions.slice(0, maxVisible) : questions;
  const hasMore = maxVisible && questions.length > maxVisible;

  return (
    <div className={cn(variant === 'card' && 'grid gap-3 p-4')}>
      <div
        className={cn(
          'divide-y divide-slate-800/30',
          variant === 'card' && 'grid gap-3 divide-none'
        )}
      >
        {visibleQuestions.map((q, idx) => {
          const isHistory = q.subject === FREE_SUBJECT;
          const isFreeAccess = !isPro && (idx < FREE_LIMIT || isHistory);

          return (
            <QuestionItem
              key={q.id}
              question={q}
              index={idx}
              isHindi={isHindi}
              repeatCount={getRepeatCount?.(q.id) || 0}
              showYear={showYears}
              variant={variant}
              defaultExpanded={showAllExpanded}
              examId={examId}
              isFreeAccess={isFreeAccess}
            />
          );
        })}
      </div>

      {hasMore && !showAll && (
        <div
          className={cn(
            'border-t border-slate-800/30 p-4',
            variant === 'card' && 'border-none pt-2'
          )}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAll(true)}
            className="w-full text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
          >
            {isHindi
              ? `सभी ${questions.length} प्रश्न देखें`
              : `Show all ${questions.length} questions`}
            <ChevronDown className="ml-1 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

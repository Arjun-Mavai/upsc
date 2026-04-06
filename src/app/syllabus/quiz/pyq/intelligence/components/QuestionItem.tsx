'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronDown, ChevronUp, Repeat } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { YearBadge } from './shared/UnitBadge';
import { UPSCQuestionRenderer } from '@/features/tests/components/UPSCQuestionRenderer';
import { UPSCPremiumQuestionCard } from '@/components/ui/UPSCPremiumQuestionCard';

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
}: QuestionItemProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
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

    // Fallback: try to find by ID in normalized options
    return normalizedOptions.findIndex((opt) => opt.id === question.correctAnswer);
  }, [question.correctAnswer, normalizedOptions]);

  if (variant === 'card') {
    return (
      <div
        className={cn(
          'rounded-xl border border-white/[0.03] bg-black/20 p-4 transition-all hover:bg-black/30',
          isExpanded && 'bg-black/40 ring-1 ring-emerald-500/20'
        )}
      >
        <div
          className="flex cursor-pointer items-start gap-3"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {/* Question Number */}
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-[10px] font-black text-emerald-500">
            {index + 1}
          </div>

          {/* Question Content */}
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
                  'mb-2 text-xs leading-relaxed font-medium text-slate-300 transition-colors',
                  isExpanded ? 'text-white' : 'line-clamp-2'
                )}
              >
                {displayText}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[9px] font-black tracking-widest text-slate-500 uppercase">
              <span className="text-emerald-500/80">{question.year}</span>
              <span className="h-1 w-1 rounded-full bg-slate-800" />
              <span className="truncate">
                {question.testTitle || `Q${question.qNo || index + 1}`}
              </span>
              {question.subject && (
                <>
                  <span className="h-1 w-1 rounded-full bg-slate-800" />
                  <span className="truncate text-emerald-400/80">{question.subject}</span>
                </>
              )}
              {repeatCount > 1 && (
                <>
                  <span className="h-1 w-1 rounded-full bg-slate-800" />
                  <span className="text-rose-400">{repeatCount}x REPEAT</span>
                </>
              )}
              <div className="ml-auto flex items-center gap-1 text-slate-600">
                {isExpanded ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </div>
            </div>
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
              <div className="mt-4 space-y-4 border-t border-white/[0.05] pt-4">
                {/* Full question text */}
                {altText && altText !== displayText && (
                  <p className="text-[11px] leading-relaxed text-slate-500 italic">{altText}</p>
                )}

                {/* Options if available (Skip if UPSC renderer already showed them) */}
                {normalizedOptions.length > 0 && examId !== 'upsc' && (
                  <div className="space-y-2">
                    {normalizedOptions.map((opt, i) => {
                      const isCorrect = correctIdx === i;
                      return (
                        <div
                          key={i}
                          className={cn(
                            'rounded-lg border px-3 py-2 text-[11px]',
                            isCorrect
                              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                              : 'border-white/[0.03] bg-white/[0.02] text-slate-400'
                          )}
                        >
                          <span className="mr-2 font-black text-slate-500">{opt.id}</span>
                          {isHindi ? opt.text : opt.textEn || opt.text}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* View full question link */}
                {/* <div className="flex items-center justify-between">
                  <Link
                    href={`/syllabus/quiz/pyq/question/${question.id}`}
                    className="inline-flex items-center gap-1.5 text-[10px] font-black tracking-widest text-emerald-500 uppercase hover:text-emerald-400"
                  >
                    {isHindi ? 'पूरा प्रश्न' : 'View Full'}
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div> */}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
}

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
              {byYear[year].map((q, idx) => (
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
                />
              ))}
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
        {visibleQuestions.map((q, idx) => (
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
          />
        ))}
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

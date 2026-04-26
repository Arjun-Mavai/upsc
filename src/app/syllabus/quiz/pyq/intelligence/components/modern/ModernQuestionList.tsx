'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ModernQuestionItem, QuestionData } from './ModernQuestionItem';
import { YearBadge } from '../shared/UnitBadge';

const PASTEL_THEMES = [
  { bg: 'bg-[#F2F8FF]', border: 'border-[#D9EAFE]' }, // Blue
  { bg: 'bg-[#FFF6E9]', border: 'border-[#FFE4C4]' }, // Orange
  { bg: 'bg-[#F1FAEE]', border: 'border-[#D1EED1]' }, // Green
  { bg: 'bg-[#FEF1F2]', border: 'border-[#FDD1D4]' }, // Red
  { bg: 'bg-[#FFFBED]', border: 'border-[#FFF0B3]' }, // Yellow
  { bg: 'bg-[#F6F0FD]', border: 'border-[#E6D4F9]' }, // Purple
];

interface ModernQuestionListProps {
  questions: QuestionData[];
  isHindi: boolean;
  getRepeatCount?: (questionId: string) => number;
  showYears?: boolean;
  groupByYear?: boolean;
  maxVisible?: number;
  examId?: string;
  isPro?: boolean;
  onLockedClick?: () => void;
  variant?: 'card' | 'flat';
}

const FREE_LIMIT = 5;
const isFreeSubject = (subject: string | null | undefined) => {
  const s = (subject || '').trim();
  if (!s) return false;
  return /^(history|geography)\b/i.test(s);
};

export function ModernQuestionList({
  questions,
  isHindi,
  getRepeatCount,
  showYears = true,
  groupByYear = false,
  maxVisible,
  examId,
  isPro = false,
  onLockedClick,
  variant = 'card',
}: ModernQuestionListProps) {
  // Use a local state for incremental loading when there are many questions
  const INITIAL_BATCH = maxVisible || 15;
  const LOAD_MORE_BATCH = 20;
  const [visibleCount, setVisibleCount] = useState(INITIAL_BATCH);

  if (groupByYear) {
    // ... rest of groupByYear logic remains same but consider if it also needs limit
    // For now, groupByYear is usually used for papers which have ~100 questions, still a lot but better grouped
    const byYear = questions.reduce(
      (acc, q) => {
        const y = q.year;
        if (y == null) return acc;
        if (!acc[y]) acc[y] = [];
        acc[y].push(q);
        return acc;
      },
      {} as Record<number, QuestionData[]>
    );

    const sortedYears = Object.keys(byYear)
      .map(Number)
      .sort((a, b) => b - a);

    return (
      <div className="space-y-6">
        {sortedYears.map((year) => (
          <div key={year} className="space-y-4">
            <div className="flex items-center gap-3 py-1">
              <span className="text-sm font-black text-[#1D1D1F] px-4 rounded-full bg-[#E5E5EA]">
                {year}
              </span>
              <span className="text-xs font-semibold text-[#86868B] uppercase tracking-widest">
                {byYear[year].length} {isHindi ? 'प्रश्न' : 'questions'}
              </span>
            </div>
            
            <div className="grid gap-4">
              {byYear[year].map((q, idx) => {
                const freeBySubject = isFreeSubject(q.subject);
                const isFreeAccess = !isPro && (idx < FREE_LIMIT || freeBySubject);

                return (
                  <ModernQuestionItem
                    key={q.id}
                    question={q}
                    index={idx}
                    isHindi={isHindi}
                    repeatCount={getRepeatCount?.(q.id) || 0}
                    showYear={false}
                    examId={examId}
                    isFreeAccess={isFreeAccess}
                    onLockedClick={onLockedClick}
                    variant={variant}
                    isAlternating={idx % 2 !== 0}
                    themeBg={variant === 'flat' ? PASTEL_THEMES[idx % PASTEL_THEMES.length].bg : 'bg-transparent'}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  }

  const visibleQuestions = questions.slice(0, visibleCount);
  const hasMore = questions.length > visibleCount;

  return (
    <div className="grid gap-4">
      {visibleQuestions.map((q, idx) => {
        const freeBySubject = isFreeSubject(q.subject);
        const isFreeAccess = !isPro && (idx < FREE_LIMIT || freeBySubject);

        return (
          <ModernQuestionItem
            key={q.id}
            question={q}
            index={idx}
            isHindi={isHindi}
            repeatCount={getRepeatCount?.(q.id) || 0}
            showYear={showYears}
            examId={examId}
            isFreeAccess={isFreeAccess}
            onLockedClick={onLockedClick}
            variant={variant}
            isAlternating={idx % 2 !== 0}
            themeBg={variant === 'flat' ? PASTEL_THEMES[idx % PASTEL_THEMES.length].bg : 'bg-transparent'}
          />
        );
      })}

      {hasMore && (
        <div className="pt-2">
          <button
            onClick={() => setVisibleCount(prev => Math.min(prev + LOAD_MORE_BATCH, questions.length))}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1D1D1F] py-4 text-[13px] font-bold text-white transition-all hover:bg-[#333336] active:scale-[0.98] shadow-md"
          >
            {isHindi
              ? `${questions.length - visibleCount} और प्रश्न देखें`
              : `View ${questions.length - visibleCount} More Questions`}
            <ChevronDown className="h-4 w-4" />
          </button>
          
          {questions.length > 50 && (
             <button
              onClick={() => setVisibleCount(questions.length)}
              className="mt-3 flex w-full items-center justify-center py-2 text-[11px] font-bold text-[#86868B] uppercase tracking-widest hover:text-[#1D1D1F] transition-colors"
            >
              {isHindi ? 'सभी एक साथ देखें' : 'Show All at Once'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

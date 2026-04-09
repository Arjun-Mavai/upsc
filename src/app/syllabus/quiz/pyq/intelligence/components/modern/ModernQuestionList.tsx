'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ModernQuestionItem, QuestionData } from './ModernQuestionItem';
import { YearBadge } from '../shared/UnitBadge';

interface ModernQuestionListProps {
  questions: QuestionData[];
  isHindi: boolean;
  getRepeatCount?: (questionId: string) => number;
  showYears?: boolean;
  groupByYear?: boolean;
  maxVisible?: number;
  showAllExpanded?: boolean;
  examId?: string;
  isPro?: boolean;
  onLockedClick?: () => void;
}

const FREE_SUBJECT = 'History';
const FREE_LIMIT = 5;

export function ModernQuestionList({
  questions,
  isHindi,
  getRepeatCount,
  showYears = true,
  groupByYear = false,
  maxVisible,
  showAllExpanded = false,
  examId,
  isPro = false,
  onLockedClick,
}: ModernQuestionListProps) {
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
                const isHistory = q.subject === FREE_SUBJECT;
                const isFreeAccess = !isPro && (idx < FREE_LIMIT || isHistory);

                return (
                  <ModernQuestionItem
                    key={q.id}
                    question={q}
                    index={idx}
                    isHindi={isHindi}
                    repeatCount={getRepeatCount?.(q.id) || 0}
                    showYear={false}
                    defaultExpanded={showAllExpanded}
                    examId={examId}
                    isFreeAccess={isFreeAccess}
                    onLockedClick={onLockedClick}
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
    <div className="grid gap-4">
      {visibleQuestions.map((q, idx) => {
        const isHistory = q.subject === FREE_SUBJECT;
        const isFreeAccess = !isPro && (idx < FREE_LIMIT || isHistory);

        return (
          <ModernQuestionItem
            key={q.id}
            question={q}
            index={idx}
            isHindi={isHindi}
            repeatCount={getRepeatCount?.(q.id) || 0}
            showYear={showYears}
            defaultExpanded={showAllExpanded}
            examId={examId}
            isFreeAccess={isFreeAccess}
            onLockedClick={onLockedClick}
          />
        );
      })}

      {hasMore && !showAll && (
        <div className="pt-2">
          <button
            onClick={() => setShowAll(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#F5F5F7] py-3 text-[13px] font-semibold text-[#1D1D1F] transition-all hover:bg-[#E5E5EA]"
          >
            {isHindi
              ? `सभी ${questions.length} प्रश्न देखें`
              : `Show all ${questions.length} questions`}
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

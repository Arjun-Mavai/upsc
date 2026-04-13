'use client';

import React from 'react';
import { CheckCircle2, X, Flag, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Question } from '@/types/quiz';
import { getCorrectAnswerIndex } from '@/lib/quiz-scoring';
import { FormattedQuestionText, cleanMatchingQuestionText } from '../../utils/questionFormatter';

interface QuizQuestionProps {
  question: Question;
  questionIndex: number;
  totalQuestions: number;
  selectedAnswer: number | undefined;
  isAnswered: boolean;
  instantModeEnabled: boolean;
  isMarkedForReview: boolean;
  language: string;
  onOptionSelect: (idx: number) => void;
  onToggleReview: () => void;
  getParsedOptions: (options: any) => any[];
  translations: {
    question: string;
    markReview: string;
    unmark: string;
  };
  currentTimeSpent?: number;
}

export function QuizQuestion({
  question,
  questionIndex,
  totalQuestions,
  selectedAnswer,
  isAnswered,
  instantModeEnabled,
  isMarkedForReview,
  language,
  onOptionSelect,
  onToggleReview,
  getParsedOptions,
  translations: t,
  currentTimeSpent = 0,
}: QuizQuestionProps) {
  const showFeedback = instantModeEnabled && isAnswered;

  const rawOptions =
    language === 'hi' && (question as any).options_hi
      ? (question as any).options_hi
      : question.options;
  const parsedOptions = getParsedOptions(rawOptions);

  const rawQuestionText =
    language === 'en' && question.questionEn ? question.questionEn : question.question;
  const questionText = cleanMatchingQuestionText(rawQuestionText, question);

  return (
    <div className="mx-auto max-w-3xl space-y-4 sm:space-y-5">
      {/* Question Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm font-bold tracking-wider text-slate-400 uppercase sm:text-base">
            <span>{t.question} {questionIndex + 1}/{totalQuestions}</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black tracking-tight text-slate-500 shadow-sm transition-all">
              <Clock className="h-2.5 w-2.5 text-indigo-500" />
              {`${Math.floor(currentTimeSpent / 60)}:${(currentTimeSpent % 60).toString().padStart(2, '0')}`}
            </span>
          </div>
          {/* 🏷️ YEAR / SUBJECT TAG */}
          {question.subject && (
            <div className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-700 sm:text-sm">
              {question.subject}
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleReview}
          className={cn(
            'h-8 gap-1.5 px-2 text-xs font-medium transition-colors hover:bg-transparent sm:px-3 sm:text-sm',
            isMarkedForReview ? 'text-amber-600' : 'text-slate-400 hover:text-slate-600'
          )}
        >
          <Flag className={cn('h-3.5 w-3.5 sm:h-4 sm:w-4', isMarkedForReview && 'fill-current')} />
          <span className="hidden sm:inline">{isMarkedForReview ? t.unmark : t.markReview}</span>
        </Button>
      </div>

      {/* Question Text - Enhanced Smart Formatted */}
      <FormattedQuestionText
        text={questionText}
        className="text-lg leading-relaxed font-semibold text-slate-900 sm:text-xl md:text-2xl"
        question={question}
        isHindi={language === 'hi'}
        useEnhancedRenderer={true}
        theme="light"
      />

      {/* Matching Questions */}
      {question.type === 'matching' && question.matchPairs && (
        <div className="mt-4 mb-6 pl-1">
          <div className="grid max-w-2xl grid-cols-2 gap-x-8 gap-y-4">
            <div className="mb-2 border-b-2 border-slate-800 pb-1 font-bold text-slate-800">
              {language === 'hi' ? 'सूची-I' : 'List-I'}
            </div>
            <div className="mb-2 border-b-2 border-slate-800 pb-1 font-bold text-slate-800">
              {language === 'hi' ? 'सूची-II' : 'List-II'}
            </div>
            <div className="space-y-3">
              {question.matchPairs.map((pair, idx) => (
                <div key={`col1-${idx}`} className="flex items-start gap-2 text-base sm:text-lg">
                  <span className="min-w-[24px] font-semibold text-slate-900">{pair.id}</span>
                  <span className="text-slate-800">
                    {language === 'en' && pair.labelEn ? pair.labelEn : pair.label}
                  </span>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              {question.matchPairs.map((pair, idx) => (
                <div key={`col2-${idx}`} className="flex items-start gap-2 text-base sm:text-lg">
                  <span className="min-w-[24px] font-semibold text-slate-900">{pair.matchId}</span>
                  <span className="text-slate-800">
                    {language === 'en' && pair.matchEn ? pair.matchEn : pair.match}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Options */}
      {/* Options — har option pe click karne pe instant feedback milta h (agar instant mode ON h) */}
      <div className="space-y-3">
        {parsedOptions.map((opt: any, idx: number) => {
          const isSelected = selectedAnswer === idx;
          // Use the more robust getCorrectAnswerIndex which handles A/B/C/D, numeric, or text match
          const correctIdx = getCorrectAnswerIndex(question.correctAnswer, parsedOptions);
          const isCorrect = correctIdx === idx;

          let optionText = opt;
          if (typeof opt === 'object' && opt !== null) {
            optionText =
              language === 'hi'
                ? opt.text || opt.textEn || opt.text_en || JSON.stringify(opt)
                : opt.textEn || opt.text_en || opt.text || JSON.stringify(opt);
          }

          return (
            <div
              key={idx}
              onClick={() => onOptionSelect(idx)}
              className={cn(
                'group relative cursor-pointer overflow-hidden rounded-xl border-2 p-4 transition-all duration-200 active:scale-[0.98] sm:p-5',
                // Before answering — normal hover
                !isAnswered && 'hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm',
                !isAnswered && isSelected && 'border-slate-800 bg-slate-50 font-semibold shadow-sm',
                // Instant mode feedback — green for correct, red for wrong selection
                showFeedback &&
                  isCorrect &&
                  '!border-emerald-500 !bg-emerald-50 font-semibold shadow-md',
                showFeedback &&
                  isSelected &&
                  !isCorrect &&
                  '!border-red-400 !bg-red-50 font-semibold shadow-md',
                // Normal mode (no instant feedback) — just show selected
                isAnswered && !showFeedback && isSelected && 'border-slate-800 bg-slate-50',
                // Unselected options fade out after answering
                isAnswered &&
                  !isSelected &&
                  !(showFeedback && isCorrect) &&
                  'border-slate-200 opacity-40'
              )}
            >
              <div className="relative z-10 flex items-center justify-between">
                <span
                  className={cn(
                    'pr-4 text-base leading-relaxed sm:text-lg',
                    // Text color bhi strong karo feedback me — green/red clearly dikhe
                    showFeedback && isCorrect && 'font-bold text-emerald-800',
                    showFeedback && isSelected && !isCorrect && 'font-bold text-red-800',
                    !showFeedback && isSelected && 'font-semibold text-slate-900',
                    !showFeedback && !isSelected && 'text-slate-700'
                  )}
                >
                  {optionText}
                </span>

                <div className="shrink-0">
                  {showFeedback ? (
                    isCorrect ? (
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 shadow-sm">
                        <CheckCircle2 className="h-5 w-5 text-white" />
                      </div>
                    ) : isSelected ? (
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-red-500 shadow-sm">
                        <X className="h-5 w-5 text-white" />
                      </div>
                    ) : (
                      <div className="h-6 w-6 rounded-full border-2 border-slate-200" />
                    )
                  ) : (
                    <div
                      className={cn(
                        'h-6 w-6 rounded-full border-2 transition-colors',
                        isSelected
                          ? 'border-slate-900 bg-slate-900'
                          : 'border-slate-200 group-hover:border-slate-300'
                      )}
                    >
                      {isSelected && (
                        <div className="flex h-full w-full items-center justify-center">
                          <div className="h-2 w-2 rounded-full bg-white" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Correct answer ke right side me green stripe */}
              {showFeedback && isCorrect && (
                <div className="absolute top-0 right-0 bottom-0 w-1.5 bg-emerald-500" />
              )}
              {/* Wrong selected answer ke right side me red stripe */}
              {showFeedback && isSelected && !isCorrect && (
                <div className="absolute top-0 right-0 bottom-0 w-1.5 bg-red-500" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

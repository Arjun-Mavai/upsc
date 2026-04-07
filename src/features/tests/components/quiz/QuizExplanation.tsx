'use client';

import React from 'react';
import { Lightbulb } from 'lucide-react';
import { PremiumExplanation } from '../PremiumExplanation';
import { Question } from '@/types/quiz';

interface QuizExplanationProps {
  question: Question;
  language: string;
  translations: {
    explanation: string;
  };
}

export function QuizExplanation({ question, language, translations: t }: QuizExplanationProps) {
  return (
    <div className="mt-4 rounded-xl border border-slate-200/50 bg-gradient-to-br from-slate-50 to-purple-50 p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex items-center gap-2 border-b border-slate-200/50 pb-2">
        <Lightbulb className="h-4 w-4 text-slate-700 sm:h-5 sm:w-5" />
        <span className="text-sm font-bold tracking-wide text-slate-900 uppercase sm:text-base">
          {t.explanation}
        </span>
      </div>

      <div className="text-sm leading-relaxed text-slate-700 sm:text-base">
        <PremiumExplanation
          explanation={question.explanation || 'No explanation available.'}
          explanationEn={question.explanationEn}
          language={language as 'hi' | 'en'}
          darkMode={false}
        />
      </div>
    </div>
  );
}

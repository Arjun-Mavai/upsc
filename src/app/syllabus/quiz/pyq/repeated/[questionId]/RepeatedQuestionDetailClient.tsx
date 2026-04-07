'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useSettingsStore } from '@/store/useSettingsStore';
import { PremiumExplanation } from '@/features/tests/components/PremiumExplanation';
import { RepeatedQuestion } from '@/actions/pyq-analytics';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface RepeatedQuestionDetailClientProps {
  question: {
    id: string;
    text: string;
    textEn: string | null;
    options: any;
    correctAnswer: string;
    explanation: string | null;
    explanationEn: string | null;
    testId: string;
  };
  stats?: RepeatedQuestion;
}

export default function RepeatedQuestionDetailClient({
  question,
  stats,
}: RepeatedQuestionDetailClientProps) {
  const router = useRouter();
  const { language } = useSettingsStore();
  const isHindi = language === 'hi';

  const rawOptions =
    typeof question.options === 'string' ? JSON.parse(question.options) : question.options;

  // Normalize options to object format if they are strings
  const options = Array.isArray(rawOptions) 
    ? rawOptions.map((opt: any, idx: number) => {
        if (typeof opt === 'string') {
            return { id: opt, text: opt };
        }
        return opt;
    })
    : [];

  const isNumericIndex = (val: string) => /^\d+$/.test(val);

  // Helper to check if an option is the correct answer
  const isCorrectOption = (opt: any, idx: number) => {
      // Logic mirrored from QuizPlayPage & QuizQuestion (Instant Mode)
      // 1. Try to parse as numeric index (handles "1", "1.0", 1)
      const numericCorrect = Number(question.correctAnswer);
      if (!isNaN(numericCorrect) && numericCorrect === idx) {
          return true;
      }

      // 2. Fallback: Direct string match (for legacy text-based answers)
      // This handles cases where answer might be "A" or exact text match
      const ansString = question.correctAnswer?.toString().trim();
      if (ansString && (opt.id === ansString || opt.text === ansString)) {
          return true;
      }

      return false;
  };
  const uniqueYears = new Set<number>();
  const displayOccurrences =
    stats?.occurrences
      .filter((occ) => {
        if (uniqueYears.has(occ.year)) return false;
        uniqueYears.add(occ.year);
        return true;
      })
      .sort((a, b) => b.year - a.year) || [];

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="-ml-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-bold text-slate-900">
              {isHindi ? 'प्रश्न विश्लेषण' : 'Question Analysis'}
            </h1>
            {stats && (
              <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                Repeated {stats.count}x
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        {/* Question Card */}
        <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-sm">
          <CardContent className="p-6 sm:p-8">
            {/* Occurrences Badges */}
            {displayOccurrences.length > 0 && (
              <div className="mb-6 flex flex-wrap gap-2">
                {displayOccurrences.map((occ) => (
                  <Badge
                    key={occ.year}
                    variant="outline"
                    className="border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-xs font-bold text-slate-700"
                  >
                    {occ.year} <span className="ml-1.5 text-slate-400">Q.{occ.qNo}</span>
                  </Badge>
                ))}
              </div>
            )}

            {/* Question Text */}
            <div className="mb-8 space-y-4">
              <h2 className="text-lg leading-relaxed font-bold text-slate-900 sm:text-xl">
                {question.text}
              </h2>
              {question.textEn && (
                <p className="text-base leading-relaxed font-medium text-slate-500">
                  {question.textEn}
                </p>
              )}
            </div>

            {/* Options */}
            <div className="space-y-3">
              {options.map((opt: any, idx: number) => {
                const isCorrect = isCorrectOption(opt, idx);

                return (
                  <div
                    key={opt.id || idx}
                    className={cn(
                      "flex items-start gap-4 rounded-xl border p-4 transition-colors",
                      isCorrect 
                        ? "border-emerald-200 bg-emerald-50/50" 
                        : "border-slate-100 bg-white"
                    )}
                  >
                    <div className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold",
                      isCorrect 
                        ? "border-emerald-500 bg-emerald-500 text-white" 
                        : "border-slate-200 text-slate-400"
                    )}>
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <div className="space-y-1">
                      <p className={cn(
                        "text-sm font-medium",
                        isCorrect ? "text-emerald-900" : "text-slate-700"
                      )}>
                        {opt.text}
                      </p>
                      {opt.text_en && (
                        <p className={cn(
                          "text-xs",
                          isCorrect ? "text-emerald-700/80" : "text-slate-500"
                        )}>
                          {opt.text_en}
                        </p>
                      )}
                    </div>
                    {isCorrect && (
                      <CheckCircle2 className="ml-auto h-5 w-5 text-emerald-500" />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Premium Explanation */}
        <div className="space-y-4">
          <h3 className="flex items-center gap-2 text-sm font-black tracking-wider text-slate-400 uppercase">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
              💡
            </span>
            {isHindi ? 'विस्तृत व्याख्या' : 'Detailed Explanation'}
          </h3>

          <Card className="overflow-hidden rounded-2xl border-indigo-100 bg-white shadow-sm ring-1 ring-indigo-50">
            <div className="border-b border-indigo-50 bg-gradient-to-r from-indigo-50/50 to-white px-6 py-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold tracking-widest text-indigo-900/60 uppercase">
                  Premium Analysis
                </span>
                <Badge variant="secondary" className="bg-white text-indigo-600 shadow-sm">
                  PRO
                </Badge>
              </div>
            </div>
            <CardContent className="p-6 sm:p-8">
              <PremiumExplanation
                explanation={question.explanation || ''}
                explanationEn={question.explanationEn}
                language={isHindi ? 'hi' : 'en'}
                darkMode={false}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

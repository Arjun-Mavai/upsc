'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Check,
  ArrowLeft,
  Filter,
  Languages,
} from 'lucide-react';
import { getCorrectAnswerIndex } from '@/lib/quiz-scoring';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface AnalysisViewProps {
  result: any; // Type from getAttemptResult
}

export default function AnalysisView({ result }: AnalysisViewProps) {
  const [filter, setFilter] = useState<'all' | 'incorrect' | 'correct' | 'skipped'>('all');
  const [language, setLanguage] = useState<'hi' | 'en'>('hi');

  const { score, totalMarks, details } = result;
  const accuracy = Math.round((score / (totalMarks || 1)) * 100);

  const filteredQuestions = details.filter((q: any) => {
    if (filter === 'all') return true;
    if (filter === 'correct') return q.isCorrect;
    if (filter === 'incorrect') return !q.isCorrect && q.userAnswer;
    if (filter === 'skipped') return !q.userAnswer;
    return true;
  });

  const formatTime = (seconds: number) => {
    if (!seconds) return '-';
    return `${seconds}s`;
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans">
      {/* Context Header */}
      <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href="/tests">
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100">
                <ArrowLeft className="h-5 w-5 text-slate-600" />
              </Button>
            </Link>
            <div>
              <h1 className="leading-tight font-bold text-slate-900">Test Analysis</h1>
              <div className="text-xs font-medium text-slate-500">
                {new Date(result.startTime).toLocaleDateString()} • {details.length} Questions
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLanguage('hi')}
                className={cn(
                  'h-7 rounded-md px-3 text-xs font-bold',
                  language === 'hi' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'
                )}
              >
                हिंदी
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLanguage('en')}
                className={cn(
                  'h-7 rounded-md px-3 text-xs font-bold',
                  language === 'en' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'
                )}
              >
                ENG
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl space-y-8 px-4 py-8">
        {/* Score Summary */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card className="border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-1 text-xs font-bold tracking-widest text-slate-400 uppercase">
              Score
            </div>
            <div className="text-3xl font-black text-slate-900">
              {result.score}{' '}
              <span className="text-lg font-medium text-slate-400">/ {result.totalMarks}</span>
            </div>
          </Card>
          <Card className="border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-1 text-xs font-bold tracking-widest text-slate-400 uppercase">
              Accuracy
            </div>
            <div
              className={cn(
                'text-3xl font-black',
                accuracy >= 80
                  ? 'text-emerald-600'
                  : accuracy >= 60
                    ? 'text-amber-600'
                    : 'text-red-600'
              )}
            >
              {accuracy}%
            </div>
          </Card>
          <Card className="border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-1 text-xs font-bold tracking-widest text-slate-400 uppercase">
              Correct
            </div>
            <div className="text-3xl font-black text-emerald-600">
              {details.filter((d: any) => d.isCorrect).length}
            </div>
          </Card>
          <Card className="border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-1 text-xs font-bold tracking-widest text-slate-400 uppercase">
              Wrong
            </div>
            <div className="text-3xl font-black text-red-600">
              {details.filter((d: any) => !d.isCorrect && d.userAnswer).length}
            </div>
          </Card>
        </div>

        {/* Filters */}
        <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-2">
          {(['all', 'incorrect', 'correct', 'skipped'] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              onClick={() => setFilter(f)}
              className={cn(
                'rounded-full font-bold capitalize',
                filter === f
                  ? 'bg-slate-900 text-white'
                  : 'border-slate-200 bg-white text-slate-600'
              )}
            >
              {f}
            </Button>
          ))}
        </div>

        {/* Questions List */}
        <div className="space-y-6">
          {filteredQuestions.map((q: any, idx: number) => {
            const isCorrect = q.isCorrect;
            const isSkipped = !q.userAnswer;
            const isWrong = !isCorrect && !isSkipped;

            const timeTaken = q.timeTaken || 0;
            const idealTime = q.idealTime || 60;
            const isTimeEfficient = timeTaken <= idealTime;

            const questionText =
              language === 'en' && q.questionTextEn ? q.questionTextEn : q.questionText;
            const explanation =
              language === 'en' && q.explanationEn ? q.explanationEn : q.explanation;

            return (
              <div
                key={q.questionId}
                className={cn(
                  'group relative overflow-hidden rounded-3xl border-2 bg-white p-6 transition-all md:p-8',
                  isCorrect ? 'border-emerald-100' : isWrong ? 'border-red-100' : 'border-slate-100'
                )}
              >
                {/* Status Badge & Time */}
                <div className="mb-6 flex items-start justify-between">
                  <div className="flex gap-3">
                    <div
                      className={cn(
                        'flex h-8 items-center gap-2 rounded-lg px-3 text-xs font-black tracking-wider uppercase',
                        isCorrect
                          ? 'bg-emerald-100 text-emerald-700'
                          : isWrong
                            ? 'bg-red-100 text-red-700'
                            : 'bg-slate-100 text-slate-600'
                      )}
                    >
                      {isCorrect ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : isWrong ? (
                        <XCircle className="h-4 w-4" />
                      ) : (
                        <AlertCircle className="h-4 w-4" />
                      )}
                      {isCorrect ? 'Correct' : isWrong ? 'Incorrect' : 'Skipped'}
                    </div>
                    <div className="flex h-8 items-center gap-2 rounded-lg border border-indigo-100/50 bg-indigo-50 px-3 text-xs font-bold text-indigo-700">
                      <span className="text-indigo-400">Q.{q.order}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold',
                        isTimeEfficient
                          ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                          : 'border-amber-100 bg-amber-50 text-amber-700'
                      )}
                    >
                      <Clock className="h-3.5 w-3.5" />
                      {formatTime(timeTaken)}
                      <span className="font-normal text-slate-400">/ {formatTime(idealTime)}</span>
                    </div>
                  </div>
                </div>

                {/* Question */}
                <div className="mb-8">
                  <p className="font-display text-lg leading-relaxed font-bold text-slate-900 md:text-xl">
                    {questionText}
                  </p>
                </div>

                {/* Options */}
                <div className="mb-8 grid grid-cols-1 gap-3 md:grid-cols-2">
                  {/* Assuming options are stored as JSON strings if they are simple array, 
                                       or we need to parse if they are complex objects now. 
                                       The schema update said options: json array.
                                       We need to handle both legacy (string[]) and new (object[]) formats 
                                   */}
                  {Array.isArray(q.options) &&
                    q.options.map((opt: any, optIdx: number) => {
                      // Handle new schema object or old string
                      const optId = typeof opt === 'object' ? opt.id : ['A', 'B', 'C', 'D'][optIdx];
                      const optText =
                        typeof opt === 'object' ? (language === 'en' ? opt.textEn : opt.text) : opt;

                      const isSelected = q.userAnswer === optId; // Using IDs now
                      // If legacy string match
                      const isLegacyMatch = q.userAnswer === String(optIdx); // fallback logic if needed

                      // Determining Correctness
                      const isThisCorrect = getCorrectAnswerIndex(q.correctAnswer, q.options) === optIdx;

                      return (
                        <div
                          key={optIdx}
                          className={cn(
                            'flex items-center gap-4 rounded-xl border-2 p-4 transition-all',
                            isThisCorrect
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                              : isSelected
                                ? 'border-red-500 bg-red-50 text-red-900'
                                : 'border-slate-100 bg-white text-slate-600'
                          )}
                        >
                          <div
                            className={cn(
                              'flex h-8 w-8 items-center justify-center rounded-lg border text-sm font-black',
                              isThisCorrect
                                ? 'border-emerald-300 bg-emerald-200 text-emerald-800'
                                : isSelected
                                  ? 'border-red-300 bg-red-200 text-red-800'
                                  : 'border-slate-200 bg-slate-50 text-slate-400'
                            )}
                          >
                            {typeof opt === 'object' ? opt.id : ['A', 'B', 'C', 'D'][optIdx]}
                          </div>
                          <span className="text-sm font-bold">{optText}</span>
                          {isThisCorrect && (
                            <CheckCircle2 className="ml-auto h-5 w-5 text-emerald-600" />
                          )}
                          {isSelected && !isThisCorrect && (
                            <XCircle className="ml-auto h-5 w-5 text-red-600" />
                          )}
                        </div>
                      );
                    })}
                </div>

                {/* Explanation */}
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <div className="rounded-lg bg-indigo-100 p-1.5">
                      <Check className="h-4 w-4 text-indigo-600" />
                    </div>
                    <span className="text-xs font-black tracking-widest text-indigo-900 uppercase">
                      Explanation & Concept
                    </span>
                  </div>

                  <div className="space-y-4">
                    {explanation ? (
                      explanation.split('\n').map((line: string, i: number) => {
                        const trimmed = line.trim();
                        if (!trimmed) return null;

                        // 💡 Exam Fact (High Value)
                        if (trimmed.includes('💡') || trimmed.toLowerCase().includes('exam fact')) {
                          return (
                            <div
                              key={i}
                              className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-900"
                            >
                              <span className="text-lg">💡</span>
                              <span className="pt-0.5">
                                {trimmed.replace(/💡|Exam Fact:/gi, '').trim()}
                              </span>
                            </div>
                          );
                        }

                        // 🧠 Memory Tip (Mnemonic)
                        if (
                          trimmed.includes('🧠') ||
                          trimmed.toLowerCase().includes('memory tip')
                        ) {
                          return (
                            <div
                              key={i}
                              className="flex gap-3 rounded-xl border border-purple-200 bg-purple-50 p-3 text-sm font-medium text-purple-900"
                            >
                              <span className="text-lg">🧠</span>
                              <div className="flex flex-col">
                                <span className="mb-0.5 text-xs font-bold tracking-wider text-purple-400 uppercase">
                                  Memory Strategy
                                </span>
                                <span>{trimmed.replace(/🧠|Memory Tip:/gi, '').trim()}</span>
                              </div>
                            </div>
                          );
                        }

                        // 🚫 Scam Alert (Elimination)
                        if (
                          trimmed.includes('🚫') ||
                          trimmed.toLowerCase().includes('scam alert') ||
                          trimmed.toLowerCase().includes('elimination')
                        ) {
                          return (
                            <div
                              key={i}
                              className="flex gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-900"
                            >
                              <span className="text-lg">🚫</span>
                              <div className="flex flex-col">
                                <span className="mb-0.5 text-xs font-bold tracking-wider text-rose-400 uppercase">
                                  Don't Get Confused
                                </span>
                                <span>{trimmed.replace(/🚫|Scam Alert:/gi, '').trim()}</span>
                              </div>
                            </div>
                          );
                        }

                        // ✅ Correct Logic / Standard Text
                        return (
                          <p key={i} className="text-sm leading-relaxed text-slate-600">
                            {trimmed.replace(/✅|Correct Answer:|Detailed Analysis:/gi, '').trim()}
                          </p>
                        );
                      })
                    ) : (
                      <p className="text-slate-400 italic">No explanation provided.</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

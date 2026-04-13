'use client';

import React, { useState, useMemo } from 'react';
import { Menu, Flag, Clock, CheckCircle2, Circle, Bookmark, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Question } from '@/types/quiz';

interface QuizPaletteProps {
  questions: Question[];
  answers: Record<string, number>;
  markedForReview: string[];
  currentIndex: number;
  totalQuestions: number;
  onJump: (index: number) => void;
  onSubmit: () => void;
  timeLeft: number;
  language: string;
  translations: {
    questionPalette: string;
    attempted: string;
    answered: string;
    notAnswered: string;
    review: string;
    current: string;
    submitTest: string;
  };
}

// Helper to format seconds to MM:SS or HH:MM:SS
const formatTime = (seconds: number) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hrs > 0) {
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Palette grid shared between mobile drawer and desktop sidebar
function PaletteGrid({
  questions,
  answers,
  markedForReview,
  currentIndex,
  onJump,
  onSubmit,
  translations: t,
  totalQuestions,
  timeLeft,
  language,
}: QuizPaletteProps & { onClose?: () => void }) {
  // ⚡ COMPUTE STATS
  const stats = useMemo(() => {
    let answered = 0;
    let markedOnly = 0;
    let answeredAndMarked = 0;

    questions.forEach((q) => {
      const isAns = answers[q.id] !== undefined;
      const isMarked = markedForReview.includes(q.id);
      
      if (isMarked && isAns) answeredAndMarked++;
      else if (isMarked) markedOnly++;
      else if (isAns) answered++;
    });

    const notAnswered = totalQuestions - answered - answeredAndMarked - markedOnly;

    return { answered, markedOnly, answeredAndMarked, notAnswered };
  }, [questions, answers, markedForReview, totalQuestions]);

  const progressValue = (Object.keys(answers).length / totalQuestions) * 100;

  return (
    <div className="flex h-full w-full flex-col font-sans">
      {/* ⏱️ TIMER SECTION */}
      <div className="mb-6 rounded-2xl bg-slate-900 p-4 text-white shadow-lg shadow-slate-900/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-white/10 p-2">
              <Clock className="h-5 w-5 text-amber-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                {language === 'hi' ? 'समय शेष' : 'Time Left'}
              </span>
              <span className={cn(
                "font-mono text-2xl font-black tracking-tighter",
                timeLeft < 300 ? "text-rose-400 animate-pulse" : "text-white"
              )}>
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={onSubmit}
            className="h-9 rounded-xl bg-white/10 px-4 text-[11px] font-black text-white hover:bg-white/20 uppercase tracking-wider"
          >
            {language === 'hi' ? 'जमा करें' : 'Submit'}
          </Button>
        </div>
      </div>

      {/* 📈 PROGRESS SECTION */}
      <div className="mb-6 space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
            {language === 'hi' ? 'प्रगति' : 'Completion'}
          </span>
          <span className="text-xs font-black text-slate-900">
            {Math.round(progressValue)}%
          </span>
        </div>
        <Progress value={progressValue} className="h-2 bg-slate-100" />
      </div>

      {/* 🔢 QUESTIONS GRID */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden pr-2 custom-scrollbar">
        <div className="grid grid-cols-5 gap-2.5 pb-6">
          {questions.map((q, idx) => {
            const isAns = answers[q.id] !== undefined;
            const isMarked = markedForReview.includes(q.id);
            const isCurrent = idx === currentIndex;

            return (
              <button
                key={q.id}
                onClick={() => onJump(idx)}
                className={cn(
                  'relative group flex aspect-square h-10 w-10 items-center justify-center text-[11px] font-black transition-all duration-200 select-none shadow-sm',
                  // Base shapes
                  isCurrent ? 'rounded-lg ring-4 ring-slate-900/5 z-10' : 'rounded-md',
                  // Logic Colors
                  isCurrent
                    ? 'bg-slate-900 text-white translate-y-[-1px] shadow-md shadow-slate-900/30'
                    : isMarked && isAns
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                      : isMarked
                        ? 'bg-amber-400 text-white hover:bg-amber-500 rounded-tr-[40%]'
                        : isAns
                          ? 'bg-emerald-500 text-white hover:bg-emerald-600 rounded-full'
                          : 'bg-white border-2 border-slate-100 text-slate-400 hover:border-slate-300 hover:text-slate-600'
                )}
              >
                {idx + 1}
                {isMarked && !isCurrent && (
                  <div className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-100">
                    <Flag className={cn("h-1.5 w-1.5", isAns ? "text-indigo-600" : "text-amber-500")} fill="currentColor" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 📊 LEGEND & STATS */}
      <div className="mt-4 space-y-4 border-t border-slate-100 pt-6">
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
              <CheckCircle2 size={12} strokeWidth={3} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">Answered</span>
              <span className="text-sm font-black text-slate-900">{stats.answered}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex h-5 w-5 items-center justify-center rounded-lg bg-slate-300 text-white shadow-sm">
              <Circle size={10} fill="currentColor" className="text-slate-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">Not Answered</span>
              <span className="text-sm font-black text-slate-900">{stats.notAnswered}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex h-5 w-5 items-center justify-center rounded-tr-[50%] bg-amber-400 text-white shadow-sm">
              <Flag size={10} fill="currentColor" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">Marked</span>
              <span className="text-sm font-black text-slate-900">{stats.markedOnly}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white shadow-sm relative">
               <Flag size={8} fill="currentColor" className="absolute top-0 right-0 -mr-1 -mt-1" />
               <CheckCircle2 size={10} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">Ans & Marked</span>
              <span className="text-sm font-black text-slate-900">{stats.answeredAndMarked}</span>
            </div>
          </div>
        </div>

        <Button
          className="group h-14 w-full bg-slate-900 text-lg font-black tracking-tight text-white transition-all hover:bg-slate-800 hover:shadow-xl active:scale-[0.98]"
          onClick={onSubmit}
        >
          {t.submitTest}
          <ChevronRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
        </Button>
      </div>
    </div>
  );
}

// Mobile: Sheet/Drawer palette
export function QuizPaletteMobile(props: QuizPaletteProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleJump = (idx: number) => {
    props.onJump(idx);
    setIsOpen(false);
  };

  const answeredCount = Object.keys(props.answers).length;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="group relative flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-200 transition-all active:scale-95 hover:bg-slate-50"
        >
          <Menu className="h-5 w-5 text-slate-600" />
          <div className="absolute -top-1.5 -right-1.5 flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-slate-900 px-1 text-[10px] font-black text-white ring-2 ring-white">
            {answeredCount}
          </div>
        </button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="!z-[50] flex w-full flex-col border-l-0 bg-white p-0 sm:w-[400px]"
        overlayClassName="!z-[49]"
      >
        <SheetHeader className="border-b border-slate-50 px-6 py-4">
          <div className="flex items-center gap-3">
             <div className="rounded-xl bg-slate-900 p-2 text-white">
                <Bookmark size={20} />
             </div>
             <SheetTitle className="text-xl font-black text-slate-900">{props.translations.questionPalette}</SheetTitle>
          </div>
        </SheetHeader>
        <div className="flex-1 overflow-hidden p-6 pt-2">
          <PaletteGrid {...props} onJump={handleJump} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Desktop: Always-visible sidebar palette
export function QuizPaletteDesktop(props: QuizPaletteProps) {
  return (
    <aside className="hidden w-[320px] shrink-0 flex-col overflow-hidden border-l border-slate-100 bg-slate-50/30 p-6 lg:flex xl:w-[360px]">
      <PaletteGrid {...props} />
    </aside>
  );
}

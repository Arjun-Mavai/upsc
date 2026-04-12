'use client';

import React from 'react';
import { Clock, X, Zap, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface QuizHeaderProps {
  title?: string;
  mode: 'topic' | 'full' | 'pyq';
  timeLeft: number;
  instantModeEnabled: boolean;
  isSubmitted: boolean;
  language: string;
  /** Omitted when `isSubmitted` (toggle is hidden). */
  onInstantModeToggle?: () => void;
  onLanguageToggle: () => void;
  onExit: () => void;
  translations: {
    instantMode: string;
    fullTest: string;
    topicPractice: string;
  };
  paletteButton?: React.ReactNode;
}

export function QuizHeader({
  title,
  mode,
  timeLeft,
  instantModeEnabled,
  isSubmitted,
  language,
  onInstantModeToggle = () => {},
  onLanguageToggle,
  onExit,
  translations: t,
  paletteButton,
}: QuizHeaderProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <header className="z-20 flex h-14 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/95 px-3 shadow-sm backdrop-blur-lg sm:h-16 sm:px-4">
      {/* Left: Exit + Title */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onExit}
          className="-ml-2 text-slate-500 transition-colors hover:text-slate-900"
        >
          <X className="h-5 w-5 sm:h-6 sm:w-6" />
        </Button>

        <div className="hidden items-center gap-2 sm:flex">
          <div className="mx-2 h-6 w-px bg-slate-200" />
          <span className="font-display text-sm font-bold tracking-tight text-slate-900 sm:text-base">
            {title || (
              <>
                UPSC<span className="text-slate-700">26</span>
              </>
            )}
          </span>
          <Badge
            variant="outline"
            className="ml-2 hidden border-slate-200 text-xs font-medium text-slate-500 md:inline-flex"
          >
            {mode === 'full' ? t.fullTest : t.topicPractice}
          </Badge>
        </div>
      </div>

      {/* Right: Instant Mode + Timer + Palette */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Instant Mode Toggle */}
        {!isSubmitted && (
          <div
            className={cn(
              'flex cursor-pointer items-center gap-2 rounded-full border-2 px-3 py-1.5 transition-all select-none',
              instantModeEnabled
                ? 'border-amber-400 bg-amber-50 shadow-sm shadow-amber-100'
                : 'border-amber-400 bg-amber-50 hover:border-slate-400 hover:bg-slate-100'
            )}
            onClick={onInstantModeToggle}
            title="Toggle Instant Feedback"
          >
            <span
              className={cn(
                'flex items-center gap-1 text-xs font-bold uppercase',
                instantModeEnabled ? 'text-amber-700' : 'text-slate-400'
              )}
            >
              <Zap
                className={cn(
                  'h-3.5 w-3.5',
                  instantModeEnabled ? 'fill-amber-700' : 'fill-slate-300 text-slate-300'
                )}
              />
              <span className="hidden sm:inline">{t.instantMode}</span>
            </span>
            <div
              className={cn(
                'relative h-4 w-7 rounded-full bg-slate-300 shadow-inner transition-colors',
                instantModeEnabled && 'bg-amber-500'
              )}
            >
              <div
                className={cn(
                  'absolute top-0.5 h-3 w-3 rounded-full bg-white shadow-sm transition-all',
                  instantModeEnabled ? 'left-3.5' : 'left-0.5'
                )}
              />
            </div>
          </div>
        )}

        {/* Compact Language Switcher */}
        <button
          onClick={onLanguageToggle}
          className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 transition-all select-none hover:bg-slate-100"
          title={language === 'hi' ? 'Switch to English' : 'हिंदी में बदलें'}
        >
          <span
            className={cn(
              'rounded px-1 text-[10px] font-bold transition-colors',
              language === 'hi' ? 'bg-slate-800 text-white' : 'text-slate-400'
            )}
          >
            अ
          </span>
          <span
            className={cn(
              'rounded px-1 text-[10px] font-bold transition-colors',
              language === 'en' ? 'bg-slate-800 text-white' : 'text-slate-400'
            )}
          >
            A
          </span>
        </button>

        {/* Timer — color transitions based on time remaining */}
        <div
          className={cn(
            'flex min-w-[110px] items-center justify-center gap-2 rounded-xl px-3 py-1.5 font-mono text-lg font-black tracking-wide transition-all duration-500',
            timeLeft < 60
              ? 'animate-pulse border-2 border-red-200 bg-red-50 text-red-600 shadow-sm shadow-red-100'
              : timeLeft < 300
                ? 'border-2 border-amber-200 bg-amber-50 text-amber-700'
                : 'border border-slate-200 bg-slate-100 text-slate-900'
          )}
        >
          <Clock className={cn(
            'h-4 w-4 transition-colors',
            timeLeft < 60 ? 'text-red-400' : timeLeft < 300 ? 'text-amber-400' : 'text-slate-400'
          )} />
          {formatTime(timeLeft)}
        </div>

        {/* Focus Mode Indicator - subtle pink dot */}
        <div className="relative hidden items-center sm:flex" title="Focus Mode Active">
          <span className="h-2 w-2 animate-[pulse_3s_ease-in-out_infinite] rounded-full bg-pink-400 opacity-70" />
        </div>

        {/* Palette button slot (mobile only - desktop shows sidebar) */}
        <div className="lg:hidden">{paletteButton}</div>
      </div>
    </header>
  );
}

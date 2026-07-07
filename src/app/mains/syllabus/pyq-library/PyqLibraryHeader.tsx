'use client';

import Link from 'next/link';
import { ArrowLeft, BookMarked, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSettingsStore } from '@/store/useSettingsStore';

type ReadingTheme = 'deep' | 'paper';

interface PyqLibraryHeaderProps {
  readingTheme: ReadingTheme;
}

export function PyqLibraryHeader({
  readingTheme,
}: PyqLibraryHeaderProps) {
  const { language } = useSettingsStore();
  const hi = language === 'hi';
  const themeDeep = readingTheme === 'deep';

  return (
    <div className="mb-5 flex items-start gap-3">
      <BookMarked
        className={cn('mt-0.5 h-9 w-9 shrink-0', themeDeep ? 'text-emerald-400' : 'text-emerald-600')}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <h1
          className={cn(
            'min-w-0 text-balance text-xl font-black tracking-tight sm:text-[1.65rem] md:text-[2rem]',
            !themeDeep &&
              'bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 bg-clip-text text-transparent'
          )}
        >
          {hi
            ? 'UPSC मेंस PYQ लाइब्रेरी'
            : 'UPSC Mains PYQ Library'}
        </h1>
      </div>
    </div>
  );
}

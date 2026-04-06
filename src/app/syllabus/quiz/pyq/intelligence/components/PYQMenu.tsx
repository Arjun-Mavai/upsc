'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, BookOpen, Lightbulb, BarChart3, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExpandableCard } from './shared/ExpandableCard';
import { cn } from '@/lib/utils';

interface PYQMenuProps {
  examId?: string;
  isHindi: boolean;
  currentPage?: 'intelligence' | 'facts' | 'analysis' | 'repeated';
}

export function PYQMenu({ examId, isHindi, currentPage }: PYQMenuProps) {
  const router = useRouter();
  
  const isUPSC = examId === 'upsc';
  const intelligenceHref = isUPSC ? '/upsc/intelligence' : '/syllabus/quiz/pyq/intelligence';
  
  const menuItems = [
    {
      id: 'intelligence',
      href: intelligenceHref,
      icon: Sparkles,
      title: 'Premium Intelligence',
      titleHi: 'प्रीमियम इंटेलिजेंस',
      subtitle: 'Extracting Every Secret of PYQs',
      subtitleHi: 'PYQ के हर रहस्य का विश्लेषण',
      color: 'emerald',
    },
    {
      id: 'facts',
      href: '/syllabus/quiz/pyq/facts', // Keep same for now or update if needed
      icon: Lightbulb,
      title: 'Facts Library',
      titleHi: 'फैक्ट्स लाइब्रेरी',
      subtitle: 'High-yield Exam Facts',
      subtitleHi: 'परीक्षा फैक्ट्स',
      color: 'emerald',
    },
    {
      id: 'analysis',
      href: '/syllabus/quiz/pyq/analysis', // Keep same for now or update if needed
      icon: BarChart3,
      title: 'Topic Analysis',
      titleHi: 'विषय विश्लेषण',
      subtitle: 'Deep-dive by Subject',
      subtitleHi: 'विषयवार गहन विश्लेषण',
      color: 'cyan',
    },
  ];
  const header = (
    <div className="flex flex-col gap-1">
      <div className="mb-1 flex items-center gap-2 text-sm font-medium tracking-wider text-slate-400 uppercase">
        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
        {isHindi ? 'मेनू' : 'Menu'}
      </div>
      <h3 className="flex items-center gap-3 text-2xl font-black tracking-tight text-amber-500 sm:text-3xl">
        {isHindi ? 'प्रीमियम इंटेलिजेंस टूल्स' : 'Premium Intelligence Tools'}
      </h3>
    </div>
  );

  return (
    <ExpandableCard
      id="menu"
      defaultExpanded={true}
      header={header}
      gradientFrom="from-emerald-600/20"
      gradientTo="to-teal-500/10"
    >
      <CardContent className="p-4 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <Link
                key={item.id}
                href={item.href}
                prefetch={true}
                onMouseEnter={() => router.prefetch(item.href)}
                className={cn(
                  'block w-full cursor-pointer',
                  isActive && 'pointer-events-none'
                )}
              >
                <div
                  className={cn(
                    'rounded-2xl p-[1px] transition-all duration-300',
                    isActive
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                      : 'bg-white/5 hover:bg-white/10'
                  )}
                >
                  <div
                    className={cn(
                      'group relative flex h-auto w-full items-center gap-4 overflow-hidden rounded-[15px] px-5 py-4 transition-all duration-300',
                      isActive
                        ? 'bg-[#080510] hover:bg-[#0c081a]'
                        : 'bg-[#080510]/40 hover:bg-white/5'
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-all duration-500',
                        isActive
                          ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-black shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                          : 'bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500/20'
                      )}
                    >
                      <Icon className={cn('h-6 w-6', isActive && 'animate-pulse')} />
                    </div>

                    <div className="flex flex-col items-start text-left">
                      <span
                        className={cn(
                          'text-lg font-black tracking-tight transition-colors',
                          isActive
                            ? 'text-emerald-500'
                            : 'text-slate-200 group-hover:text-emerald-400'
                        )}
                      >
                        {isHindi ? item.titleHi : item.title}
                      </span>
                      <span
                        className={cn(
                          'text-[10px] font-bold tracking-[0.1em] uppercase',
                          isActive ? 'text-slate-400' : 'text-slate-500 group-hover:text-slate-400'
                        )}
                      >
                        {isHindi ? item.subtitleHi : item.subtitle}
                      </span>
                    </div>

                    {!isActive && (
                      <ChevronRight className="ml-auto h-5 w-5 text-slate-600 transition-transform group-hover:translate-x-1 group-hover:text-emerald-500" />
                    )}

                    {isActive && (
                      <div className="ml-auto hidden sm:block">
                        <div className="flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </ExpandableCard>
  );
}

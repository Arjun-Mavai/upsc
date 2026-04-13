'use client';

import React from 'react';
import { Clock, ChevronRight, History, TrendingUp, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useSettingsStore } from '@/store/useSettingsStore';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Row Styles — Premium Colorful Variants
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const ROW_STYLES = {
  amber: {
    bg: 'bg-amber-50/50',
    border: 'border-amber-100',
    hoverBorder: 'hover:border-amber-200',
    text: 'text-amber-700',
    iconBg: 'bg-amber-100',
  },
  emerald: {
    bg: 'bg-emerald-50/50',
    border: 'border-emerald-100',
    hoverBorder: 'hover:border-emerald-200',
    text: 'text-emerald-700',
    iconBg: 'bg-emerald-100',
  },
  pink: {
    bg: 'bg-pink-50/50',
    border: 'border-pink-100',
    hoverBorder: 'hover:border-pink-200',
    text: 'text-pink-700',
    iconBg: 'bg-pink-100',
  },
  blue: {
    bg: 'bg-blue-50/50',
    border: 'border-blue-100',
    hoverBorder: 'hover:border-blue-200',
    text: 'text-blue-700',
    iconBg: 'bg-blue-100',
  },
  indigo: {
    bg: 'bg-indigo-50/50',
    border: 'border-indigo-100',
    hoverBorder: 'hover:border-indigo-200',
    text: 'text-indigo-700',
    iconBg: 'bg-indigo-100',
  },
};

interface TestHistoryClientProps {
  analytics: any;
}

// Tab labels
function tabLabel(tab: string) {
  if (tab === 'ALL') return 'All';
  if (tab === 'UNIT') return 'Unit';
  if (tab === 'TOPIC') return 'Topic';
  return tab;
}

function typeLabel(type: string) {
  if (type === 'UNIT') return 'Unit';
  if (type === 'TOPIC') return 'Topic';
  if (type === 'CSAT') return 'CSAT';
  if (type === 'PYQ' || type === 'UPSC_PYQ') return 'PYQ';
  if (type === 'UPSC_FLT') return 'FLT';
  if (type === 'UPSC_FREE_QUIZ') return 'Free Quiz';
  return 'Test';
}

export function TestHistoryClient({ analytics }: TestHistoryClientProps) {
  const router = useRouter();
  const { language } = useSettingsStore();
  const hi = language === 'hi';
  const [activeTab, setActiveTab] = React.useState('ALL');

  if (!analytics) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white pt-14">
        <div className="space-y-4 px-6 text-center">
          <History className="mx-auto h-12 w-12 text-slate-300" />
          <h2 className="text-xl font-bold text-slate-900">Sign in to view history</h2>
          <Button onClick={() => router.push('/login')}>Go to Login</Button>
        </div>
      </div>
    );
  }

  const { overallScore, totalTests, recentActivity } = analytics;

  const filteredHistory = recentActivity.filter((item: any) => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'PYQ') return item.type === 'PYQ' || item.type === 'UPSC_PYQ';
    return item.type === activeTab;
  });

  // Group by unit for TOPIC tab
  const grouped: Record<string, any[]> = {};
  if (activeTab === 'TOPIC') {
    filteredHistory.forEach((item: any) => {
      const key = item.unitId || 'other';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(item);
    });
  }

  const groupedKeys = Object.keys(grouped).sort((a, b) => {
    const na = parseInt(a.replace('unit_', '')) || 999;
    const nb = parseInt(b.replace('unit_', '')) || 999;
    return na - nb;
  });

  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-20 font-sans">
      {/* Header — compact, sticky below navbar */}
      <div className="sticky top-14 z-30 border-b border-slate-100 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto max-w-2xl px-4 py-3">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h1 className="text-lg font-black tracking-tight text-slate-900">Test History</h1>
              <p className="text-xs font-medium text-slate-400">
                {totalTests} tests • {overallScore}% avg
              </p>
            </div>
            <Button
              size="sm"
              className="h-8 rounded-full bg-slate-900 px-4 text-xs font-bold text-white hover:bg-slate-800"
              onClick={() => router.push('/syllabus/quiz')}
            >
              <TrendingUp className="mr-1.5 h-3.5 w-3.5" /> New Test
            </Button>
          </div>

          {/* Filter tabs — pill style */}
          <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-0.5">
            {['ALL', 'PYQ'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'rounded-full px-3.5 py-1.5 text-xs font-bold whitespace-nowrap transition-all',
                  activeTab === tab
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                )}
              >
                {tabLabel(tab)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Test List */}
      <div className="mx-auto max-w-2xl px-4 pt-6">
        {filteredHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center space-y-3 px-6 py-20 text-slate-400">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
              <History className="h-7 w-7 text-slate-300" />
            </div>
            <p className="text-sm font-medium">No tests found in this category</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/syllabus/quiz')}
              className="rounded-full font-bold"
            >
              Take a Test
            </Button>
          </div>
        ) : activeTab === 'TOPIC' ? (
          /* Grouped by unit */
          <div className="space-y-8">
            {groupedKeys.map((unitKey) => {
              const items = grouped[unitKey];
              const unitName = items[0]?.unitName || unitKey;
              return (
                <div key={unitKey} className="space-y-3">
                  <div className="sticky top-[7.5rem] z-20 px-2 py-2">
                    <span className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                      {unitName}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {items.map((activity: any, idx: number) => (
                      <TestHistoryRow
                        key={idx}
                        index={idx}
                        activity={activity}
                        onClick={() => router.push(`/syllabus/analytics/history/${activity.id}`)}
                        hi={hi}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Flat list */
          <div className="space-y-3">
            {filteredHistory.map((activity: any, idx: number) => (
              <TestHistoryRow
                key={idx}
                index={idx}
                activity={activity}
                onClick={() => router.push(`/syllabus/analytics/history/${activity.id}`)}
                showType
                hi={hi}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Single test row — premium card style
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function TestHistoryRow({
  activity,
  onClick,
  showType,
  hi,
  index,
}: {
  activity: any;
  onClick: () => void;
  showType?: boolean;
  hi?: boolean;
  index: number;
}) {
  const accuracy = Math.round((activity.score / (activity.totalMarks || 1)) * 100);
  const colorKey = (['amber', 'emerald', 'pink', 'blue', 'indigo'] as const)[index % 5];
  const style = ROW_STYLES[colorKey];

  const title = hi
    ? activity.testTitleHi || activity.testTitle || 'Practice Test'
    : activity.testTitle || 'Practice Test';

  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative flex cursor-pointer items-center gap-4 rounded-2xl border p-4 transition-all hover:translate-y-[-2px] active:scale-[0.98]',
        style.bg,
        style.border,
        style.hoverBorder,
        'shadow-sm hover:shadow-md'
      )}
    >
      {/* Type Badge / Indicator */}
      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold transition-transform group-hover:scale-110', style.iconBg, style.text)}>
        {showType ? (
          <span className="text-[10px] font-black uppercase">{typeLabel(activity.type).charAt(0)}</span>
        ) : (
          <Trophy size={18} />
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1 space-y-1">
        <div className="truncate text-sm font-black tracking-tight text-slate-900">
          {title}
        </div>
        <div className="flex items-center gap-2.5 text-[10px] font-bold text-slate-400">
          {showType && (
            <span className="rounded bg-white/60 px-1.5 py-0.5 tracking-wider text-slate-500 uppercase">
              {typeLabel(activity.type)}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock size={10} className="text-slate-300" />
            {new Date(activity.createdAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            })}
          </span>
          {activity.timeTaken && <span className="text-slate-300">•</span>}
          {activity.timeTaken && (
            <span className="flex items-center gap-1 font-mono text-slate-400">
              ⏱️ {activity.timeTaken}
            </span>
          )}
        </div>
      </div>

      {/* Accuracy Badge */}
      <div className={cn('flex flex-col items-end gap-0.5')}>
        <div className={cn('flex h-8 w-10 items-center justify-center rounded-lg border text-[11px] font-black shadow-sm', style.iconBg, style.text, style.border)}>
          {accuracy}%
        </div>
        <span className="text-[9px] font-black tracking-widest text-slate-300 uppercase">Score</span>
      </div>

      <ChevronRight className={cn('h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1', style.text, 'opacity-40')} />
    </div>
  );
}

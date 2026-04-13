'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Target,
  Clock,
  ChevronRight,
  AlertCircle,
  History,
  Lightbulb,
  Flame,
  Zap,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Sparkles,
  Badge,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useSettingsStore } from '@/store/useSettingsStore';
import { SubjectMasteryWidget } from '@/features/analytics/components/SubjectMasteryWidget';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// --- Type Definitions (Strict Type Safety) ---
// AnalyticsActivity: Ek single test attempt ka data (id, score, totalMarks, unitName, etc).

export interface AnalyticsActivity {
  id: string;
  type: 'UNIT' | 'TOPIC' | 'CSAT' | 'PYQ' | (string & {}); // e.g., 'UNIT', 'TOPIC', 'CSAT', 'PYQ'
  createdAt: string | Date;
  testTitle: string;
  testTitleHi?: string;
  timeTaken?: string;
  totalDuration?: string;
  score: number;
  totalMarks?: number;
  unitId?: string;
  unitName?: string;
}
// AnalyticsMastery: Subject wise performance (percentage, status, color).

export interface AnalyticsMastery {
  id: string;
  name: string;
  nameEn?: string;
  percentage: number;
  count: number;
  status: string;
  color: string;
}

// 🎯 NEW: Enhanced Analytics Types for Exam Expert Dashboard
export interface ExamInsights {
  cutoffComparison: {
    userScore: number;
    expectedCutoff: number;
    difference: number;
    status: 'above' | 'below' | 'near';
  };
  trend: {
    direction: 'improving' | 'declining' | 'stable';
    changePercent: number;
    recentAvg: number;
    previousAvg: number;
  };
  consistency: {
    score: number; // 0-100
    variance: number;
    status: 'consistent' | 'moderate' | 'inconsistent';
  };
  studyStreak: {
    currentStreak: number;
    longestStreak: number;
    lastActiveDate: string;
  };
}

interface AnalyticsDashboardClientProps {
  analytics: {
    overallScore: number;
    totalTests: number;
    mastery: AnalyticsMastery[];
    recentActivity: AnalyticsActivity[];
    aiSuggestion?: {
      en: string;
      hi: string;
    };
    examInsights?: ExamInsights;
  };
  actionCard?: React.ReactNode;
}

const accuracyStyle = (acc: number) => {
  if (acc >= 80) return 'bg-emerald-50 text-emerald-700 border-emerald-100';
  if (acc >= 60) return 'bg-amber-50 text-amber-700 border-amber-100';
  return 'bg-rose-50 text-rose-700 border-rose-100';
};

const typeLabel = (type: string) => {
  switch (type) {
    case 'UNIT':
      return 'Unit Test';
    case 'TOPIC':
      return 'Topic Practice';
    case 'CSAT':
      return 'CSAT Paper';
    case 'PYQ':
    case 'UPSC_PYQ':
      return 'PYQ';
    case 'UPSC_FLT':
      return 'FLT';
    case 'UPSC_FREE_QUIZ':
      return 'Free Quiz';
    default:
      return type;
  }
};

function ActivityItem({
  activity,
  showType,
  onClick,
}: {
  activity: AnalyticsActivity;
  showType?: boolean;
  onClick: () => void;
}) {
  const { language } = useSettingsStore();
  const hi = language === 'hi';
  const computedTotalMarks =
    typeof activity.totalMarks === 'number' && activity.totalMarks > 0
      ? activity.totalMarks
      : undefined;
  const fallbackTotalMarks =
    typeof (activity as any).totalQuestions === 'number' && (activity as any).totalQuestions > 0
      ? (activity as any).totalQuestions * 3
      : 60;
  const denominator = computedTotalMarks ?? fallbackTotalMarks;
  const rawAccuracy = ((activity.score || 0) / denominator) * 100;
  const accuracy = Math.max(0, Math.min(100, Math.round(rawAccuracy)));

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="group flex cursor-pointer items-center justify-between border-b border-slate-100 px-6 py-5 transition-all last:border-0 hover:bg-slate-50"
    >
      <div className="flex min-w-0 items-center gap-4">
        {/* <div
          className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border text-sm font-black shadow-sm transition-transform group-hover:scale-105 group-hover:rotate-3',
            accuracyStyle(accuracy)
          )}
        >
          {accuracy}%
        </div> */}

        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            {showType && (
              <span className="rounded-lg border border-indigo-100 bg-indigo-50 px-2.5 py-0.5 text-[10px] font-black tracking-widest text-indigo-600 uppercase shadow-sm">
                {typeLabel(activity.type)}
              </span>
            )}
            <span className="flex items-center gap-1 text-[11px] font-bold tracking-tighter text-slate-400 uppercase">
              <Clock size={10} strokeWidth={3} />
              {new Date(activity.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>

          <div className="truncate pr-2 text-sm font-black text-slate-900 transition-colors group-hover:text-emerald-600 sm:text-base">
            {hi
              ? activity.testTitleHi || activity.testTitle
              : activity.testTitle || 'Practice Test'}
          </div>
        </div>
      </div>
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition-all duration-300 group-hover:bg-emerald-500 group-hover:text-white group-hover:shadow-lg">
        <ChevronRight className="h-5 w-5" />
      </div>
    </motion.div>
  );
}

export default function AnalyticsDashboardClient({
  analytics,
  actionCard,
}: AnalyticsDashboardClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState('ALL');
  const { language } = useSettingsStore();
  const hi = language === 'hi';

  if (!analytics) return null;

  const { overallScore, totalTests, mastery, recentActivity, aiSuggestion, examInsights } =
    analytics;

  const overviewStats = [
    {
      label: hi ? 'औसत स्कोर' : 'Avg. Score',
      value: `${overallScore}%`,
      icon: <Target className="h-5 w-5 text-emerald-600" />,
      trend: hi ? 'परफॉरमेंस' : 'Overall Performance',
      accent: 'bg-emerald-50/50 border-emerald-100/50 text-emerald-700',
      iconBg: 'bg-emerald-100',
    },
    {
      label: hi ? 'स्टडी स्ट्रीक' : 'Study Streak',
      value: `${examInsights?.studyStreak?.currentStreak || 0} 🔥`,
      icon: <Flame className="h-5 w-5 text-orange-600" />,
      trend: hi ? 'लगातार तैयारी' : 'Daily Consistency',
      accent: 'bg-orange-50/50 border-orange-100/50 text-orange-700',
      iconBg: 'bg-orange-100',
    },
    {
      label: hi ? 'कंसिस्टेंसी' : 'Consistency',
      value: `${examInsights?.consistency?.score || 0}%`,
      icon: <Zap className="h-5 w-5 text-amber-600" />,
      trend: hi ? 'स्कोर स्थिरता' : 'Score Stability',
      accent: 'bg-amber-50/50 border-amber-100/50 text-amber-700',
      iconBg: 'bg-amber-100',
    },
    {
      label: hi ? 'कुल टेस्ट' : 'Total Tests',
      value: totalTests.toString(),
      icon: <Award className="h-5 w-5 text-indigo-600" />,
      trend: hi ? 'कुल प्रयास' : 'Total Attempts',
      accent: 'bg-indigo-50/50 border-indigo-100/50 text-indigo-700',
      iconBg: 'bg-indigo-100',
    },
  ];

  const filteredHistory = recentActivity.filter((item) => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'PYQ') return item.type === 'PYQ' || item.type === 'UPSC_PYQ';
    return item.type === activeTab;
  });

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };
  const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

  return (
    <div className="space-y-10">
      {/* 📊 Overview Stats Grid */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 gap-4 md:grid-cols-4"
      >
        {overviewStats.map((stat, idx) => (
          <motion.div
            key={idx}
            variants={item}
            whileHover={{ y: -5 }}
            whileTap={{ scale: 0.98 }}
            className="cursor-pointer"
            onClick={() => {
              if (stat.label.includes('Tests') || stat.label.includes('टैस्ट')) {
                router.push('/syllabus/test-history');
              }
            }}
          >
            <Card
              className={cn(
                'overflow-hidden border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md active:shadow-inner',
                stat.accent
              )}
            >
              <CardContent className="p-5">
                <div
                  className={cn(
                    'mb-3 flex h-10 w-10 items-center justify-center rounded-xl transition-transform hover:scale-110',
                    stat.iconBg
                  )}
                >
                  {stat.icon}
                </div>
                <p className="text-[10px] font-black tracking-widest text-slate-500 uppercase opacity-70">
                  {stat.label}
                </p>
                <div className="flex items-center justify-between">
                  <h3 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
                    {stat.value}
                  </h3>
                  {(stat.label.includes('Tests') || stat.label.includes('टैस्ट')) && (
                    <ChevronRight size={16} className="text-slate-400 group-hover:text-indigo-600" />
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* 🚀 Advanced Insights Section */}
      <div className="grid gap-6 sm:grid-cols-2">
        {/* Cut-off Analysis */}
        {examInsights?.cutoffComparison && (
          <Card className="overflow-hidden border border-slate-200 bg-white shadow-sm">
            <CardHeader className="bg-slate-50/50 pb-4">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-emerald-500" />
                <CardTitle className="text-[10px] font-black tracking-widest text-slate-500 uppercase">
                  {hi ? 'कट-ऑफ विश्लेषण' : 'Cut-off Analysis'}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex items-end gap-3">
                <span className="text-4xl font-black text-slate-900">
                  {examInsights.cutoffComparison.userScore}%
                </span>
                <div
                  className={cn(
                    'mb-1 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black tracking-tighter uppercase',
                    examInsights.cutoffComparison.status === 'above'
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-rose-50 text-rose-600'
                  )}
                >
                  {examInsights.cutoffComparison.status === 'above' ? (
                    <ArrowUpRight size={10} />
                  ) : (
                    <ArrowDownRight size={10} />
                  )}
                  {Math.abs(examInsights.cutoffComparison.difference)}%
                </div>
              </div>
              <p className="mt-2 text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                {hi
                  ? `लक्ष्य कट-ऑफ: ${examInsights.cutoffComparison.expectedCutoff}%`
                  : `Target Cut-off: ${examInsights.cutoffComparison.expectedCutoff}%`}
              </p>
              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={cn(
                    'h-full rounded-full',
                    examInsights.cutoffComparison.status === 'above'
                      ? 'bg-emerald-500'
                      : 'bg-amber-500'
                  )}
                  style={{ width: `${Math.min(examInsights.cutoffComparison.userScore, 100)}%` }}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Consistency Score */}
        {examInsights?.consistency && (
          <Card className="overflow-hidden border border-slate-200 bg-white shadow-sm">
            <CardHeader className="bg-slate-50/50 pb-4">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" />
                <CardTitle className="text-[10px] font-black tracking-widest text-slate-500 uppercase">
                  {hi ? 'तैयारी की निरंतरता' : 'Prep Consistency'}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-2xl font-black text-amber-600 shadow-inner ring-1 ring-amber-100">
                  {examInsights.consistency.score}%
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-black text-slate-900">
                    {examInsights.consistency.status === 'consistent'
                      ? hi
                        ? 'शानदार निरंतरता! 🎯'
                        : 'Highly Consistent! 🎯'
                      : hi
                        ? 'स्कोर में उतार-चढ़ाव 📈'
                        : 'Score Fluctuations 📈'}
                  </p>
                  <p className="text-[10px] leading-relaxed font-bold text-slate-500">
                    {hi
                      ? 'आपके स्कोर में स्थिरता दिख रही है, जो अच्छे संकेत हैं।'
                      : 'Your scores are stable, which is a great sign for the exam.'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 🤖 AI Recommendation & Quick Action Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {aiSuggestion && (
          <Card className="overflow-hidden border border-[#ede9fe] bg-[#f5f3ff] text-[#6d28d9] shadow-sm transition-all hover:shadow-md">
            <div className="flex h-full flex-col">
              <div className="relative flex w-full items-center justify-center bg-indigo-100/50 p-6">
                <div className="relative">
                  <div className="absolute -inset-4 animate-pulse rounded-full bg-indigo-500/10 blur-xl" />
                  <Lightbulb size={40} className="relative text-indigo-600" />
                </div>
              </div>
              <div className="flex-1 p-6">
                <div className="mb-3 flex items-center gap-2">
                  <span className="rounded-full bg-indigo-200/50 px-3 py-1 text-[9px] font-black tracking-widest text-indigo-700 uppercase ring-1 ring-indigo-300/30">
                    Smart Study Engine
                  </span>
                </div>
                <h3 className="mb-2 text-xl font-black tracking-tight text-slate-900">
                  {hi ? 'आपके लिए स्टडी प्लान' : 'Personalized Study Plan'}
                </h3>
                <p className="text-xs leading-relaxed font-bold text-slate-600 italic">
                  &quot;{hi ? aiSuggestion?.hi : aiSuggestion?.en}&quot;
                </p>
              </div>
            </div>
          </Card>
        )}

        {actionCard && <div className="h-full">{actionCard}</div>}
      </div>

      {/* 📊 Subject Mastery View - Mobile Only (Bhai ke liye layout!) */}
      <SubjectMasteryWidget mastery={mastery} className="mb-10 lg:hidden" />

      {/* 📜 Recent Activity History */}
      <Card className="overflow-hidden border border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-indigo-500" />
                <CardTitle className="text-lg font-black tracking-tight text-slate-900">
                  {hi ? 'हालिया प्रयास' : 'Recent Attempts'}
                </CardTitle>
              </div>

              {/* 🔗 VIEW ALL BUTTON — Bhai ke liye shortcut! */}
              <button
                onClick={() => router.push('/syllabus/test-history')}
                className="group flex items-center gap-1 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-[10px] font-black tracking-widest text-indigo-700 uppercase transition-all hover:bg-indigo-600 hover:text-white"
              >
                {hi ? 'सभी देखें' : 'View All'}
                <ChevronRight size={12} className="transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>

            <div className="no-scrollbar flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1">
              {['ALL', 'PYQ'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-[10px] font-black tracking-widest uppercase transition-all',
                    activeTab === tab
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[400px]">
            <div className="divide-y divide-slate-100">
              {filteredHistory.length > 0 ? (
                filteredHistory.map((activity) => (
                  <ActivityItem
                    key={activity.id}
                    activity={activity}
                    showType={activeTab === 'ALL'}
                    onClick={() => router.push(`/syllabus/analytics/history/${activity.id}`)}
                  />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                  <History className="mb-4 h-12 w-12 opacity-20" />
                  <p className="text-sm font-black tracking-widest uppercase">
                    {hi ? 'कोई रिकॉर्ड नहीं मिला' : 'No activity found'}
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

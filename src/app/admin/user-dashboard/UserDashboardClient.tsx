'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Search,
  Users,
  Activity,
  Trophy,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  FileText,
  CheckCircle2,
  XCircle,
  Loader2,
  Medal,
  Calendar,
  Target,
  Crown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import type { UserWithStats, TestAttemptDetail } from './actions';
import { getUserTestHistory } from './actions';

const TIER_COLORS: Record<string, string> = {
  pro: 'bg-amber-100 text-amber-700',
  lite: 'bg-blue-100 text-blue-700',
  free: 'bg-slate-100 text-slate-600',
};

const TEST_TYPE_COLORS: Record<string, string> = {
  FLT: 'bg-violet-100 text-violet-700',
  UNIT: 'bg-blue-100 text-blue-700',
  CSAT: 'bg-amber-100 text-amber-700',
  PYQ: 'bg-emerald-100 text-emerald-700',
  TOPIC: 'bg-rose-100 text-rose-700',
  MISC: 'bg-slate-100 text-slate-600',
};

interface Props {
  users: UserWithStats[];
}

export default function UserDashboardClient({ users }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'attempts' | 'score'>('recent');
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [testHistory, setTestHistory] = useState<Record<string, TestAttemptDetail[]>>({});
  const [loadingHistory, setLoadingHistory] = useState<string | null>(null);
  const PAGE_SIZE = 30;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Stats
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.totalAttempts > 0).length;
  const totalAttempts = users.reduce((s, u) => s + u.totalAttempts, 0);

  // Top 10 performers (by avg score, min 3 attempts)
  const topPerformers = [...users]
    .filter((u) => u.totalAttempts >= 3 && u.avgScore != null && u.avgScore > 0)
    .sort((a, b) => (b.avgScore ?? 0) - (a.avgScore ?? 0))
    .slice(0, 10);

  // Filter + Sort
  const filtered = users
    .filter((u) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return u.name?.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (sortBy === 'attempts') return b.totalAttempts - a.totalAttempts;
      if (sortBy === 'score') return (b.avgScore ?? -1) - (a.avgScore ?? -1);
      // recent — by lastActiveAt, nulls last
      const aTime = a.lastActiveAt ? new Date(a.lastActiveAt).getTime() : 0;
      const bTime = b.lastActiveAt ? new Date(b.lastActiveAt).getTime() : 0;
      return bTime - aTime;
    });

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  // Load test history when user is expanded
  const handleExpand = async (userId: string) => {
    if (expandedUser === userId) {
      setExpandedUser(null);
      return;
    }

    setExpandedUser(userId);

    // Load history if not already loaded
    if (!testHistory[userId]) {
      setLoadingHistory(userId);
      try {
        const history = await getUserTestHistory(userId);
        setTestHistory((prev) => ({ ...prev, [userId]: history }));
      } catch (error) {
        console.error('Failed to load test history', error);
      } finally {
        setLoadingHistory(null);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-slate-900 selection:text-white">
      <div className="mx-auto max-w-7xl space-y-8 p-6 md:p-8 lg:p-12">
        {/* Header Section */}
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => router.push('/admin/dashboard')}
                className="rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:bg-slate-50"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="flex items-center gap-3 text-2xl font-black tracking-tight text-slate-900 md:text-3xl lg:text-4xl">
                <Users className="h-6 w-6 text-slate-700 md:h-8 md:w-8" />
                Student Dashboard
              </h1>
              <div className="mt-1 flex items-center gap-2 text-xs font-bold text-slate-500 md:text-sm">
                <span className="flex items-center gap-1">
                  <Activity className="h-3 w-3 text-emerald-500" /> Live Monitoring
                </span>
                <span>•</span>
                <span>UPSC ZEN Platform Admin</span>
              </div>
            </div>
          </div>
        </div>

        {/* Global Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:gap-6">
          <SummaryCard
            icon={<Users className="h-5 w-5" />}
            label="Total Students"
            value={totalUsers}
            color="blue"
          />
          <SummaryCard
            icon={<Activity className="h-5 w-5" />}
            label="Highly Active"
            value={activeUsers}
            color="emerald"
          />
          <SummaryCard
            icon={<Trophy className="h-5 w-5" />}
            label="Total Attempts"
            value={totalAttempts}
            color="violet"
          />
        </div>

        {/* Top Performers Section */}
        {topPerformers.length > 0 && (
          <Card className="border-amber-200 bg-gradient-to-br from-amber-50/50 to-white">
            <CardContent className="p-4">
              <div className="mb-3 flex items-center gap-2">
                <Crown className="h-4 w-4 text-amber-600" />
                <h2 className="text-sm font-black uppercase tracking-wide text-amber-800">
                  Top Performers
                </h2>
                <span className="text-[10px] text-amber-600">(min 3 tests)</span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                {topPerformers.map((user, idx) => (
                  <div
                    key={user.id}
                    className={cn(
                      'flex items-center gap-2 rounded-xl border p-2.5 transition-all hover:shadow-sm',
                      idx === 0
                        ? 'border-amber-300 bg-amber-100/50'
                        : idx === 1
                          ? 'border-slate-300 bg-slate-100/50'
                          : idx === 2
                            ? 'border-orange-200 bg-orange-50/50'
                            : 'border-slate-100 bg-white'
                    )}
                  >
                    {/* Rank */}
                    <div
                      className={cn(
                        'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black',
                        idx === 0
                          ? 'bg-amber-500 text-white'
                          : idx === 1
                            ? 'bg-slate-400 text-white'
                            : idx === 2
                              ? 'bg-orange-400 text-white'
                              : 'bg-slate-200 text-slate-600'
                      )}
                    >
                      {idx + 1}
                    </div>
                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-slate-800">
                        {user.name || user.email.split('@')[0]}
                      </p>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-emerald-600">
                          {user.avgScore?.toFixed(0)}%
                        </span>
                        <span className="text-[10px] text-slate-400">
                          • {user.totalAttempts} tests
                        </span>
                      </div>
                    </div>
                    {idx < 3 && <Medal className="h-4 w-4 text-amber-500" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Bar: Search & Filtering */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search by name or email..."
              className="h-12 rounded-2xl border-slate-200 pl-11 shadow-sm transition-all focus:border-slate-900 focus:ring-slate-950/5 lg:text-base"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setVisibleCount(PAGE_SIZE);
              }}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {(['recent', 'attempts', 'score'] as const).map((s) => (
              <Button
                key={s}
                size="sm"
                variant={sortBy === s ? 'default' : 'outline'}
                onClick={() => setSortBy(s)}
                className={cn(
                  'h-10 rounded-xl px-4 text-xs font-black uppercase tracking-widest transition-all',
                  sortBy === s ? 'bg-slate-900 text-white shadow-lg' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                )}
              >
                {s === 'recent' ? '🕐 Recent' : s === 'attempts' ? '🔢 Tests' : '🏆 Score'}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
           <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
             Student Directory ({filtered.length})
           </p>
        </div>

        {/* Dynamic User List */}
        <div className="grid gap-4">
          {visible.map((user) => {
            const isExpanded = expandedUser === user.id;
            const userHistory = testHistory[user.id] || [];
            const isLoading = loadingHistory === user.id;

            return (
              <Card 
                key={user.id} 
                className={cn(
                  "overflow-hidden border-slate-200 transition-all duration-300",
                  isExpanded ? "ring-2 ring-slate-900/5 shadow-xl" : "hover:border-slate-300 hover:shadow-md"
                )}
              >
                <CardContent className="p-0">
                  {/* Main Header Row */}
                  <div
                    className={cn(
                      "flex cursor-pointer items-center gap-4 p-4 transition-colors",
                      isExpanded ? "bg-slate-50/80" : "hover:bg-slate-50/30"
                    )}
                    onClick={() => handleExpand(user.id)}
                  >
                    {/* User Profile Identicon */}
                    <div className="relative">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 text-lg font-black text-slate-600 shadow-sm border border-slate-200">
                        {(user.name?.[0] || user.email[0]).toUpperCase()}
                      </div>
                      <div className={cn(
                        "absolute -bottom-1 -right-1 h-4 w-4 rounded-lg border-2 border-white shadow-sm",
                        user.lastActiveAt && new Date(user.lastActiveAt).getTime() > Date.now() - 3600000 
                          ? "bg-emerald-500" 
                          : "bg-slate-300"
                      )} />
                    </div>

                    {/* Basic Identity */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-base font-black tracking-tight text-slate-900">
                          {user.name || 'Anonymous UPSC Aspirant'}
                        </h3>
                        {user.planTier === 'pro' && (
                          <Badge className="bg-amber-100 text-[9px] font-black uppercase tracking-widest text-amber-700 hover:bg-amber-100 border border-amber-200">
                            PRO
                          </Badge>
                        )}
                      </div>
                      <p className="truncate text-xs font-bold text-slate-400">{user.email}</p>
                    </div>

                    {/* High Density Performance Metrics (Desktop) */}
                    <div className="hidden shrink-0 items-center gap-6 md:flex">
                       <div className="text-center">
                         <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Attempts</div>
                         <div className="flex items-center justify-center gap-1.5 font-black text-slate-900">
                            <Target className="h-3.5 w-3.5 text-indigo-500" />
                            {user.totalAttempts}
                         </div>
                       </div>

                       {user.avgScore != null && user.avgScore > 0 && (
                         <div className="text-center">
                           <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Avg Score</div>
                           <div className={cn(
                             "inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-black ring-1 ring-inset",
                             user.avgScore >= 70 ? "bg-emerald-50 text-emerald-700 ring-emerald-500/20" :
                             user.avgScore >= 50 ? "bg-amber-50 text-amber-700 ring-amber-500/20" :
                             "bg-rose-50 text-rose-700 ring-rose-500/20"
                           )}>
                             {user.avgScore.toFixed(0)}%
                           </div>
                         </div>
                       )}

                       {user.lastActiveAt && (
                         <div className="text-right min-w-[80px]">
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Last Active</div>
                            <div className="text-xs font-bold text-slate-700">
                               {formatSmartDate(new Date(user.lastActiveAt))}
                            </div>
                         </div>
                       )}
                    </div>

                    <div className="flex shrink-0 items-center justify-center h-10 w-10 rounded-xl bg-slate-100/50 text-slate-400 transition-colors group-hover:bg-slate-100 group-hover:text-slate-900">
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="mt-4 space-y-4 border-t border-slate-100 pt-4">
                      {/* Category Stats */}
                      <div className="grid grid-cols-5 gap-2">
                        <CategoryStat label="FLT" count={user.fltCount} emoji="📝" color="violet" />
                        <CategoryStat label="Unit" count={user.unitCount} emoji="📚" color="blue" />
                        <CategoryStat label="CSAT" count={user.csatCount} emoji="🧠" color="amber" />
                        <CategoryStat label="PYQ" count={user.pyqCount} emoji="📜" color="emerald" />
                        <CategoryStat label="Topic" count={user.topicCount} emoji="🎯" color="rose" />
                      </div>

                      {/* Quick Info */}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
                        <span>
                          <strong className="text-slate-700">
                            {user.completedAttempts}/{user.totalAttempts}
                          </strong>{' '}
                          completed
                        </span>
                        <span>
                          Joined{' '}
                          <strong className="text-slate-700">
                            {user.createdAt && isValidDate(new Date(user.createdAt))
                              ? new Date(user.createdAt).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : 'N/A'}
                          </strong>
                        </span>
                        {user.accessExpiresAt && isValidDate(new Date(user.accessExpiresAt)) && (
                          <span>
                            Expires{' '}
                            <strong className={cn(
                              new Date(user.accessExpiresAt) < new Date() ? 'text-rose-600' : 'text-emerald-600'
                            )}>
                              {new Date(user.accessExpiresAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </strong>
                          </span>
                        )}
                        {user.lastActiveAt && isValidDate(new Date(user.lastActiveAt)) && (
                          <span>
                            Active{' '}
                            <strong className="text-slate-700">
                              {formatSmartDate(new Date(user.lastActiveAt))}
                            </strong>
                          </span>
                        )}
                      </div>

                      {/* Test History Section */}
                      <div className="rounded-xl border border-slate-200 bg-slate-50/50">
                        <div className="flex items-center justify-between rounded-t-xl border-b border-slate-200 bg-white px-3 py-2.5 md:px-4">
                          <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-700">
                            <FileText className="h-3.5 w-3.5 text-indigo-600" />
                            Test History
                          </h4>
                          <span className="text-[10px] text-slate-500">
                            {userHistory.length} tests
                          </span>
                        </div>

                        <div className="max-h-[320px] overflow-y-auto p-2 md:p-3">
                          {isLoading ? (
                            <div className="flex items-center justify-center py-8 text-slate-400">
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              Loading...
                            </div>
                          ) : userHistory.length === 0 ? (
                            <div className="py-8 text-center text-sm text-slate-400">
                              No tests attempted yet
                            </div>
                          ) : (
                            <div className="space-y-2 md:space-y-1.5">
                              {userHistory.map((test) => (
                                <TestHistoryRow key={test.id} test={test} />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {hasMore && (
          <div className="pt-2 text-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
            >
              Load More ({filtered.length - visibleCount} remaining)
            </Button>
          </div>
        )}

        {filtered.length === 0 && (
          <div className="py-16 text-center text-slate-400">No students found.</div>
        )}
      </div>
    </div>
  );
}

function TestHistoryRow({ test }: { test: TestAttemptDetail }) {
  const startDate = new Date(test.startTime);

  return (
    <div className="rounded-lg border border-slate-100 bg-white p-3 transition-colors hover:border-slate-200 sm:p-3">
      {/* Mobile Layout - Stacked */}
      <div className="flex flex-col gap-2 sm:hidden">
        {/* Test Title & Status */}
        <div className="flex items-start gap-2">
          <div className="shrink-0 mt-0.5">
            {test.isCompleted ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            ) : (
              <XCircle className="h-4 w-4 text-slate-300" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-slate-800 text-sm leading-tight mb-1" title={test.testTitle}>
              {test.testTitle}
            </p>
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge className={cn('h-4 text-[9px]', TEST_TYPE_COLORS[test.testType])}>
                {test.testType}
              </Badge>
              <span className="text-[10px] text-slate-400">
                {test.totalQuestions} Questions
              </span>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-0.5 rounded bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">
              ✓ {test.correctAnswers}
            </span>
            <span className="flex items-center gap-0.5 rounded bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-700">
              ✗ {test.wrongAnswers}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className={cn(
              'px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1',
              test.netScore > 0
                ? 'bg-emerald-50 text-emerald-700'
                : test.netScore < 0
                ? 'bg-rose-50 text-rose-700' 
                : 'bg-slate-100 text-slate-600'
            )}
            title={`Score calculation: (${test.correctAnswers} × 3) - (${test.wrongAnswers} × 1) = ${test.netScore} marks`}
            >
              <span className="text-[9px] opacity-60">Score:</span>
              <span>{test.netScore > 0 ? '+' : ''}{test.netScore}</span>
              <span className="opacity-60">/{test.maxMarks}</span>
            </div>
            <span className="text-[10px] text-slate-400">
              {test.dayOfWeek}
            </span>
          </div>
        </div>
      </div>

      {/* Desktop Layout - Horizontal */}
      <div className="hidden sm:flex items-center gap-3">
        {/* Status */}
        <div className="shrink-0">
          {test.isCompleted ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          ) : (
            <XCircle className="h-4 w-4 text-slate-300" />
          )}
        </div>

        {/* Test Info */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-slate-800 mb-1" title={test.testTitle}>
            {test.testTitle}
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge className={cn('h-4 text-[9px]', TEST_TYPE_COLORS[test.testType])}>
              {test.testType}
            </Badge>
            <span
              className="text-[10px] text-slate-400"
              title={`testId: ${test.testId} • attemptId: ${test.id} • userId: ${test.userId}`}
            >
              {test.totalQuestions} Qs
            </span>
            {test.isCompleted && test.endTime && (
              <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-500">
                ⏱️ {Math.floor((new Date(test.endTime).getTime() - new Date(test.startTime).getTime()) / 60000)}m{' '}
                {Math.floor(((new Date(test.endTime).getTime() - new Date(test.startTime).getTime()) % 60000) / 1000)}s
              </span>
            )}
          </div>
        </div>

        {/* Correct/Wrong/Skipped */}
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="flex items-center gap-0.5 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
            ✓{test.correctAnswers}
          </span>
          <span className="flex items-center gap-0.5 rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">
            ✗{test.wrongAnswers}
          </span>
          <span className="flex items-center gap-0.5 rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-500">
            ⊘{test.skippedAnswers}
          </span>
        </div>

        {/* Net Score */}
        <div className="shrink-0">
          <div
            className={cn(
              'flex flex-col items-end rounded-lg px-2 py-1.5 text-[11px] font-black shadow-sm border',
              test.netScore > 0
                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                : test.netScore < 0
                ? 'bg-rose-50 text-rose-700 border-rose-100'
                : 'bg-slate-100 text-slate-600 border-slate-200'
            )}
            title={`Score breakdown: Correct: ${test.correctAnswers} × 3 marks = +${test.correctAnswers * 3} | Wrong: ${test.wrongAnswers} × 1 mark = -${test.wrongAnswers} | Final: ${test.netScore}/${test.maxMarks}`}
          >
            <div className="flex items-center gap-1">
              <span className="text-slate-400 opacity-60">Score:</span>
              <span>{test.netScore > 0 ? '+' : ''}{test.netScore}</span>
              <span className="text-slate-400 opacity-60">/ {test.maxMarks}</span>
            </div>
            <span className="text-[9px] opacity-80">{test.scorePercentage}% Accuracy</span>
          </div>
        </div>

        {/* Date & Day */}
        <div className="shrink-0 text-right">
          <div className="flex items-center justify-end gap-1 text-[10px] font-bold text-slate-600">
            {test.dayOfWeek}
          </div>
          <div className="text-[9px] text-slate-400">
            {startDate.toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    violet: 'bg-violet-50 text-violet-600 border-violet-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
  };
  return (
    <Card className={cn('border shadow-sm transition-all hover:shadow-md', colors[color])}>
      <CardContent className="flex items-center gap-3 p-4 md:gap-4 md:p-6">
        <div className={cn('flex h-12 w-12 items-center justify-center rounded-2xl border bg-white shadow-sm', colors[color])}>
          {icon}
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-500 opacity-70">
            {label}
          </p>
          <p className="text-2xl font-black tracking-tight text-slate-900 md:text-3xl">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function CategoryStat({
  label,
  count,
  emoji,
  color,
}: {
  label: string;
  count: number;
  emoji: string;
  color: string;
}) {
  const colors: Record<string, string> = {
    violet: 'bg-violet-50/50 border-violet-100/50 text-violet-600',
    blue: 'bg-blue-50/50 border-blue-100/50 text-blue-600',
    amber: 'bg-amber-50/50 border-amber-100/50 text-amber-600',
    emerald: 'bg-emerald-50/50 border-emerald-100/50 text-emerald-600',
    rose: 'bg-rose-50/50 border-rose-100/50 text-rose-600',
  };
  return (
    <div className={cn('rounded-2xl border p-3 text-center transition-all hover:bg-white hover:shadow-sm', colors[color])}>
      <div className="mb-1 text-sm">{emoji}</div>
      <div className="text-xl font-black text-slate-900">{count}</div>
      <div className="text-[9px] font-black uppercase tracking-widest text-slate-500">{label}</div>
    </div>
  );
}

/**
 * Smart date formatter - shows meaningful relative/absolute dates
 */
function formatSmartDate(date: Date): string {
  if (!isValidDate(date)) return 'N/A';
  
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Today/Yesterday
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';

  // Within last 7 days - show day name
  if (diffDays < 7) {
    return date.toLocaleDateString('en-IN', { weekday: 'short' });
  }

  // Within last 30 days - show "X days ago"
  if (diffDays < 30) {
    return `${diffDays}d ago`;
  }

  // Within same year - show date without year
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  }

  // Older - show full date
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: '2-digit',
  });
}

/**
 * Check if date is valid (not 1970, not NaN)
 */
function isValidDate(date: Date): boolean {
  return date instanceof Date && !isNaN(date.getTime()) && date.getFullYear() > 1980;
}

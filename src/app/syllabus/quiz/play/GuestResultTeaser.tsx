'use client';

import { motion } from 'framer-motion';
import { Crown, BarChart3, Clock, Zap, ChevronRight, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { calculateGuestRanking } from '@/lib/utils/quiz-ranking';

interface GuestResultTeaserProps {
  score: number;
  totalQuestions: number;
  timeTaken: number;
  guestName?: string;
  onHome: () => void;
  testId?: string;
}

export function GuestResultTeaser({
  score,
  totalQuestions,
  guestName,
  onHome,
}: GuestResultTeaserProps) {
  const router = useRouter();

  // Use centralized ranking utility (deterministic - same score = same rank)
  const { beaten, percentage, rank } = calculateGuestRanking(score, totalQuestions);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 p-4 font-sans">
      {/* Background Ambience */}
      <div className="pointer-events-none absolute top-0 left-0 h-[500px] w-full bg-gradient-to-b from-slate-900/20 to-transparent" />
      <div className="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="pointer-events-none absolute top-60 -left-20 h-72 w-72 rounded-full bg-purple-500/10 blur-3xl" />

      <div className="relative z-10 w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80 shadow-2xl ring-1 ring-white/10 backdrop-blur-xl"
        >
          {/* Header Section */}
          <div className="relative space-y-2 border-b border-slate-800 p-8 text-center">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-bold tracking-wider text-emerald-400 uppercase">
              <Crown className="h-3 w-3" /> {guestName ? `Great Job, ${guestName}!` : 'Great Job!'}
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white">
              You beat <span className="text-emerald-400">{beaten}</span> students
            </h1>
            <p className="text-sm text-slate-400">based on projected performance in this test.</p>
          </div>

          {/* Main Stats Card */}
          <div className="space-y-6 p-6">
            {/* Score Circle & Rank */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-700/50 bg-slate-800/50 p-4">
                <div className="relative flex h-20 w-20 items-center justify-center">
                  <svg className="h-full w-full -rotate-90 transform">
                    <circle
                      cx="40"
                      cy="40"
                      r="36"
                      className="stroke-slate-700"
                      strokeWidth="6"
                      fill="transparent"
                    />
                    <circle
                      cx="40"
                      cy="40"
                      r="36"
                      className="stroke-emerald-500"
                      strokeWidth="6"
                      fill="transparent"
                      strokeDasharray={226}
                      strokeDashoffset={226 - (226 * percentage) / 100}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute text-xl font-bold text-emerald-400">{percentage}%</span>
                </div>
                <span className="mt-2 text-xs font-medium text-slate-400">Score</span>
              </div>

              <div
                onClick={() => router.push('/pricing')}
                className="group relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-800/50 p-4 transition-all hover:border-emerald-500/50 hover:bg-slate-800"
              >
                {/* Blurred Effect */}
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-1 bg-slate-900/10 backdrop-blur-[2px] transition-all group-hover:bg-transparent group-hover:backdrop-blur-none">
                  <Lock className="h-6 w-6 text-slate-400 group-hover:text-emerald-400" />
                  <span className="text-[10px] font-bold tracking-wider text-slate-300 uppercase">
                    Unlock
                  </span>
                </div>

                <span className="text-3xl font-bold text-white blur-sm group-hover:blur-none">
                  #{rank}
                </span>
                <span className="mt-2 text-xs font-medium text-slate-400">Global Rank</span>
              </div>
            </div>

            {/* Locked Insights List slice */}
            <div className="space-y-3">
              <h3 className="pl-1 text-sm font-bold tracking-widest text-slate-300 uppercase">
                Locked Insights
              </h3>

              {[
                {
                  icon: BarChart3,
                  label: 'Subject-wise Weakness Analysis',
                  color: 'text-slate-400',
                  bg: 'bg-slate-500/10',
                },
                {
                  icon: Clock,
                  label: 'Time Management Report',
                  color: 'text-amber-400',
                  bg: 'bg-amber-500/10',
                },
                {
                  icon: Zap,
                  label: 'Leaderboard & Percentile',
                  color: 'text-purple-400',
                  bg: 'bg-purple-500/10',
                },
              ].map((item, i) => (
                <div
                  key={i}
                  onClick={() => router.push('/pricing')}
                  className="group/item flex cursor-pointer items-center justify-between rounded-xl border border-slate-800/50 bg-slate-800/30 p-3 transition-all hover:border-slate-700 hover:bg-slate-800/50"
                >
                  <div className="flex items-center gap-3 opacity-60 transition-opacity group-hover/item:opacity-100">
                    <div className={`rounded-lg p-2 ${item.bg} ${item.color}`}>
                      <item.icon className="h-4 w-4" />
                    </div>
                    <div className="space-y-1">
                      <div className="h-2 w-32 rounded bg-slate-700 blur-[2px] transition-all group-hover/item:blur-none" />
                      <div className="h-2 w-20 rounded bg-slate-700 blur-[2px] transition-all group-hover/item:blur-none" />
                    </div>
                  </div>
                  <div className="rounded-full bg-slate-800 p-2 text-slate-500 transition-colors group-hover/item:text-emerald-400">
                    <Lock className="h-3 w-3" />
                  </div>
                </div>
              ))}
            </div>

            {/* Warning Box */}
            <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-3">
              <div className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
              <p className="text-xs leading-relaxed text-red-200/80">
                <strong className="text-red-400">Warning:</strong> This result is not saved. Create
                an account to save your progress, view detailed solutions, and track your
                improvement.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="space-y-3 pt-2">
              <Button
                onClick={() => router.push('/pricing')}
                className="group relative h-14 w-full overflow-hidden rounded-xl bg-gradient-to-r from-slate-800 to-slate-900 text-lg font-bold text-white shadow-lg shadow-slate-500/25 hover:from-slate-700 hover:to-slate-700"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Unlock Full Analysis{' '}
                  <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </span>
                <div className="absolute inset-0 translate-y-full bg-white/20 transition-transform duration-300 group-hover:translate-y-0" />
              </Button>

              <Button
                variant="ghost"
                onClick={onHome}
                className="w-full text-slate-500 hover:bg-white/5 hover:text-slate-300"
              >
                Return to Home
              </Button>
            </div>
          </div>
        </motion.div>

        <p className="mt-6 text-center text-xs text-slate-600">
          Join a growing community of UPSC 2026 aspirants.
        </p>
      </div>
    </div>
  );
}

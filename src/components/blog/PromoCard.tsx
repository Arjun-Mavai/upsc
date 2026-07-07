'use client';

import Link from 'next/link';
import { BookOpen, Crown, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { mppscUsers } from '@/db/schema';

type User = typeof mppscUsers.$inferSelect;

interface PromoCardProps {
  user: User | null;
  variant?: 'vertical' | 'horizontal';
  className?: string;
}

export function PromoCard({ user, variant = 'vertical', className }: PromoCardProps) {
  const isPro = user?.planTier === 'pro';
  const isLite = user?.planTier === 'lite';
  const isFree = !isPro && !isLite;

  // ------------------------------------------------------------------
  // 📱 HORIZONTAL VARIANT (Mobile)
  // ------------------------------------------------------------------
  if (variant === 'horizontal') {
    return (
      <div
        className={cn(
          'relative overflow-hidden rounded-2xl bg-slate-900 p-5 text-white shadow-xl shadow-indigo-500/10',
          className
        )}
      >
        {/* Background Glows (Subtle) */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 h-24 w-24 rounded-full bg-indigo-500/20 blur-2xl" />
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 h-24 w-24 rounded-full bg-pink-500/20 blur-2xl" />

        <div className="relative z-10 flex items-center justify-between gap-4">
          {/* Left: Text Info */}
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-display text-lg font-black tracking-tight text-white">
                Ace UPSC 
              </h3>
              {isPro && (
                <span className="flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold tracking-wider text-amber-300 uppercase">
                  PRO
                </span>
              )}
              {isLite && (
                <span className="flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold tracking-wider text-emerald-300 uppercase">
                  LITE
                </span>
              )}
            </div>
            <p className="line-clamp-1 text-xs font-medium text-slate-400">
              {isPro
                ? 'Full access enabled.'
                : isLite
                  ? 'Upgrade for full mocks.'
                  : '2026 High-Yield PYQs.'}
            </p>
          </div>

          {/* Right: CTA Button */}
          <div className="relative shrink-0 overflow-hidden rounded-xl p-[1px] shadow-lg shadow-indigo-500/20 transition-transform active:scale-95">
            <div className="animate-spin-slow absolute inset-0 bg-[conic-gradient(from_0deg,#d946ef,#f43f5e,#fbbf24,#8b5cf6,#3b82f6,#d946ef)]" />
            <Link
              href={user ? '/syllabus/quiz/pyq' : '/pricing'}
              className="relative flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white transition-all hover:bg-slate-900/90"
            >
              <Sparkles size={12} className={user ? 'text-emerald-400' : 'text-yellow-400'} />
              {user ? 'Practice' : 'Upgrade'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // 🖥️ VERTICAL VARIANT (Desktop Sidebar) - Original Design
  // ------------------------------------------------------------------
  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl bg-slate-900 p-6 text-white shadow-2xl shadow-indigo-500/10',
        className
      )}
    >
      {/* Background Glow */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 h-40 w-40 rounded-full bg-indigo-500/20 blur-3xl transition-all duration-700 group-hover:bg-indigo-500/30" />
      <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-40 w-40 rounded-full bg-pink-500/20 blur-3xl transition-all duration-700 group-hover:bg-pink-500/30" />

      <div className="relative z-10 mb-6 flex items-center justify-between">
        <div className="rounded-xl bg-white/10 p-3 backdrop-blur-md">
          <BookOpen size={24} className="text-white" />
        </div>
        {/* Pro Badge */}
        {isPro && (
          <span className="flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[10px] font-bold tracking-wider text-amber-300 uppercase">
            <Crown size={10} className="fill-amber-300" /> Pro Active
          </span>
        )}
        {/* Lite Badge */}
        {isLite && (
          <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold tracking-wider text-emerald-300 uppercase">
            <Crown size={10} className="fill-emerald-300" /> Lite Active
          </span>
        )}
      </div>

      <h3 className="font-display relative z-10 mb-2 text-xl font-bold tracking-tight">
        Ace UPSC 
      </h3>

      {isPro ? (
        <>
          <p className="relative z-10 mb-6 text-sm leading-relaxed text-slate-300">
            Premium access active! Master your preparation with expert logic explanations & exclusive PYQ intelligence.
          </p>
          {/* Premium Button */}
          <div className="relative overflow-hidden rounded-xl p-[1.5px]">
            <div className="animate-spin-slow absolute inset-0 bg-[conic-gradient(from_0deg,#10b981,#34d399,#059669,#10b981)]" />
            <Link
              href="/syllabus/quiz/pyq"
              className="relative flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3.5 text-sm font-bold text-white transition-all hover:bg-slate-800"
            >
              <Sparkles size={16} className="text-emerald-400" />
              Start Practicing
            </Link>
          </div>
        </>
      ) : isLite ? (
        <>
          <p className="relative z-10 mb-6 text-sm leading-relaxed text-slate-300">
            Lite Plan Active. Upgrade to <span className="font-bold text-white">Pro</span> for
            unlimited Expert logic & PYQ Analytics.
          </p>
          {/* Premium Button */}
          <div className="relative overflow-hidden rounded-xl p-[1.5px] shadow-lg shadow-purple-500/20 transition-all hover:scale-[1.02] hover:shadow-purple-500/40">
            <div className="animate-spin-slow absolute inset-0 bg-[conic-gradient(from_0deg,#d946ef,#f43f5e,#fbbf24,#8b5cf6,#3b82f6,#d946ef)]" />
            <Link
              href="/syllabus/quiz/pyq"
              className="relative flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3.5 text-sm font-bold text-white transition-all hover:bg-slate-900/90"
            >
              <Sparkles size={16} className="text-emerald-400" />
              Start Practice
            </Link>
          </div>
        </>
      ) : (
        <>
          <p className="relative z-10 mb-6 text-sm leading-relaxed text-slate-300">
            Unlock premium mock tests, detailed analytics, and exclusive content.
          </p>
          {/* Premium Button */}
          <div className="relative overflow-hidden rounded-xl p-[1.5px] shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02] hover:shadow-indigo-500/40">
            <div className="animate-spin-slow absolute inset-0 bg-[conic-gradient(from_0deg,#d946ef,#f43f5e,#fbbf24,#8b5cf6,#3b82f6,#d946ef)]" />
            <Link
              href={user ? '/syllabus/quiz/pyq' : '/pricing'}
              className="relative flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3.5 text-sm font-bold text-white transition-all hover:bg-slate-900/90"
            >
              <Sparkles size={16} className={user ? 'text-emerald-400' : 'fill-white/20 text-yellow-400'} />
              {user ? 'Start Practice' : 'Get Premium Access'}
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

'use client';

import { useState, useTransition } from 'react';
import { Sparkles, Zap, ChevronRight, ArrowLeft, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { trackFbCustomEvent } from '@/lib/analytics/facebook-pixel';

export function HeroSection() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { language, user: globalUser } = useSettingsStore();

  return (
    <section className="relative flex min-h-[80vh] flex-col justify-center overflow-hidden border-b border-amber-200/50 bg-[#fffdfa] px-4 pt-24 pb-12 md:min-h-screen md:px-6 md:pt-48 md:pb-32">
      {/* 🎭 PREMIUM BACKGROUND LAYERS */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] bg-center opacity-[0.08]"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-100/40 via-transparent to-transparent blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl space-y-8 text-center md:space-y-14">
        {/* Top Badge */}
        <div
          className={cn(
            'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-black shadow-xl backdrop-blur-md transition-all md:px-6 md:py-2.5 md:text-sm',
            (globalUser as any)?.is_pro
              ? 'border-amber-200 bg-amber-50/80 text-amber-700 shadow-amber-200/20'
              : 'border-amber-200 bg-white/90 text-amber-700 shadow-amber-500/10'
          )}
        >
          {(globalUser as any)?.is_pro ? (
            <>
              <Sparkles className="h-3.5 w-3.5 fill-amber-500 text-amber-600 md:h-4.5 md:w-4.5" />
              {language === 'hi' ? 'प्रीमियम मेंबर' : 'Special Premium Access Active'}
            </>
          ) : (
            <>
              <Zap className="h-3.5 w-3.5 fill-amber-600 text-amber-600 md:h-4.5 md:w-4.5" />
              {language === 'hi' ? 'महारत हासिल करें' : 'Master the UPSC Exam Pattern'}
            </>
          )}
        </div>

        <div className="space-y-4 md:space-y-8">
          <div className="font-display flex flex-col justify-center text-4xl leading-[1.1] font-black tracking-tight text-slate-900 drop-shadow-sm sm:text-5xl md:text-9xl md:leading-[1.1]">
            <span className="mb-1 md:mb-4 text-slate-800">{language === 'hi' ? 'आपकी UPSC' : 'Your UPSC'}</span>
            <span className="animate-gradient-x bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 bg-[length:200%_auto] bg-clip-text pb-2 text-transparent md:pb-4">
              {language === 'hi' ? 'टेस्ट सीरीज़।' : 'Test Series.'}
            </span>
          </div>

          <p className="mx-auto max-w-4xl px-2 text-lg leading-relaxed font-bold text-slate-700 md:text-3xl">
            {language === 'hi'
              ? 'UPSC के नए पैटर्न पर विजय पाएं! PYQs + विशेषज्ञ व्याख्या + विषय विश्लेषण। आज ही अपनी तैयारी को लेवल-अप करें।'
              : 'Master 6 Years of Organized PYQs (2020-2025) with Expert Wisdom, Verdict & Logic Path. Level up your prep today.'}
          </p>
        </div>

        <div className="mx-auto flex w-full max-w-[420px] flex-col items-center justify-center gap-6 px-4">
          {/* GOOGLE-STYLE HERO BUTTON (ID: 74) */}
          {!globalUser ? (
            <button
              onClick={() => {
                trackFbCustomEvent('hero_free_test_clicked', {
                  location: 'home_page_hero_section',
                  user_status: 'guest',
                });
                startTransition(() => {
                  router.push('/free-quiz');
                });
              }}
              onMouseEnter={() => router.prefetch('/free-quiz')}
              className="group relative w-full focus:outline-none"
            >
              <div className="relative flex h-14 w-full transform items-center justify-center overflow-hidden rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.2)] transition-all duration-500 group-hover:-translate-y-1 group-hover:scale-[1.03] group-hover:shadow-[0_40px_80px_rgba(245,158,11,0.2)] group-active:scale-[0.96] md:h-24">
                {/* 🌈 PREMIUM MOVING GRADIENT (ID: 75) */}
                <div className="animate-gradient-x absolute inset-0 bg-gradient-to-r from-slate-950 via-amber-950 to-slate-950 bg-[length:200%_auto]" />

                <div className="relative z-10 flex h-full w-full items-center justify-center gap-3 px-6 md:gap-6 md:px-14">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-1.5 backdrop-blur-md transition-colors group-hover:bg-amber-500/20 md:rounded-2xl md:p-3">
                    {isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin text-amber-400 md:h-8 md:w-8" />
                    ) : (
                      <Zap className="h-4 w-4 fill-amber-400 text-amber-400 md:h-8 md:w-8" />
                    )}
                  </div>

                  <span className="text-xs font-black tracking-widest whitespace-nowrap text-white uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] sm:text-sm md:text-xl md:tracking-[0.15em] lg:text-2xl">
                    {language === 'hi' ? 'फ्री मॉक टेस्ट शुरू करें' : 'Start Free Mock Test'}
                  </span>

                  <ChevronRight
                    className="h-4 w-4 text-amber-400 transition-transform duration-500 group-hover:translate-x-2 md:h-8 md:w-8"
                    strokeWidth={4}
                  />
                </div>

                {/* Inner Highlight */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/10 to-transparent" />
              </div>
            </button>
          ) : (
            <Link href="/dashboard" className="group relative w-full">
              <div className="relative flex h-14 w-full transform items-center justify-center overflow-hidden rounded-full shadow-[0_20px_40px_rgba(0,0,0,0.1)] transition-all duration-500 group-hover:-translate-y-0.5 group-hover:scale-[1.02] group-hover:shadow-[0_30px_60px_rgba(245,158,11,0.2)] group-active:scale-[0.96] md:h-24">
                <div className="animate-gradient-x absolute inset-0 bg-gradient-to-r from-slate-950 via-amber-950 to-slate-950 bg-[length:200%_auto]" />

                <div className="relative z-10 flex h-full w-full items-center justify-center gap-3 px-6 md:gap-6 md:px-14">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-1.5 backdrop-blur-md transition-colors group-hover:bg-amber-500/20 md:rounded-2xl md:p-3">
                    <Sparkles className="h-4 w-4 fill-amber-400 text-amber-400 md:h-8 md:w-8" />
                  </div>
                  <span className="truncate text-base font-black tracking-[0.1em] text-white uppercase md:text-2xl md:tracking-[0.2em]">
                    {language === 'hi' ? 'डैशबोर्ड' : 'Dashboard'}
                  </span>
                  <ArrowLeft
                    className="h-4 w-4 rotate-180 text-amber-400 transition-transform duration-500 group-hover:translate-x-1.5 md:h-8 md:w-8"
                    strokeWidth={3}
                  />
                </div>

                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/5 to-transparent" />
              </div>
            </Link>
          )}
        </div>
      </div>

      {/* Subtle Bottom Glow */}
      <div className="absolute bottom-0 left-1/2 h-[1px] w-full -translate-x-1/2 bg-gradient-to-r from-transparent via-amber-500/30 to-transparent"></div>
    </section>
  );
}

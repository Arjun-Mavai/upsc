'use client';

import { useMemo, useState } from 'react';
import { CheckCircle2, Lock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { getPricingData } from '@/actions/pricing-actions';
import { DEFAULT_UPSC_PRODUCT_COPY } from '@/config/upsc-product-copy';
import { SyllabusLockMainsModal } from '@/features/mains/components/SyllabusLockMainsModal';
import { useSettingsStore } from '@/store/useSettingsStore';
import Link from 'next/link';

export function MainsSyllabusLockedGate() {
  const { language } = useSettingsStore();
  const hi = language === 'hi';
  const [modalOpen, setModalOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['pricing', 'upsc'],
    queryFn: async () => await getPricingData('upsc'),
    staleTime: 5 * 60 * 1000,
  });

  const upscCopy = DEFAULT_UPSC_PRODUCT_COPY;

  const tickLines = useMemo(() => {
    const base = hi ? upscCopy.mains.bulletsHi : upscCopy.mains.bulletsEn;
    const navPoint = hi 
      ? '⚡ अल्ट्रा-फास्ट 1-क्लिक सिलेबस नेविगेटर (रोज़ 30 मिनट बचाएं)' 
      : '⚡ Ultra-Fast 1-Click Syllabus Navigator (Save 30 mins daily)';
    return [navPoint, ...base.slice(0, 4)];
  }, [hi]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-16 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/40 via-slate-950 to-slate-950" />
      <div className="pointer-events-none absolute top-20 right-0 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-64 w-64 rounded-full bg-teal-500/5 blur-3xl" />

      <div className="relative z-10 w-full max-w-lg text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/35 bg-gradient-to-r from-emerald-500/15 to-teal-500/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-emerald-300 shadow-[0_0_24px_rgba(16,185,129,0.15)]">
          <Lock className="h-3.5 w-3.5" aria-hidden />
          {hi ? 'मेंस ज्ञानकोश लॉक' : 'Mains Gyan Kosh locked'}
        </div>

        <h1 className="font-display mb-4 text-3xl font-black leading-tight tracking-tight md:text-4xl md:leading-[1.1]">
          {hi ? (
            <>
              UPSC मेंस ज्ञानकोश <span className="text-emerald-400">अनलॉक</span> करें
            </>
          ) : (
            <>
              Unlock <span className="text-emerald-400">UPSC Mains</span> Gyan Kosh
            </>
          )}
        </h1>
        <p className="mb-10 text-sm leading-relaxed text-slate-400 md:text-base">
          {hi
            ? 'विषय-वार ट्री, सिलेबस की गहरी समझ व विश्लेषण और आधिकारिक PYQ मॉडल उत्तर — एक ही जगह। नीचे देखें क्या मिलता है, फिर प्लान चुनें।'
            : 'Topic-wise tree, deep syllabus analysis, and official PYQ model answers — in one place. See what’s inside, then pick a plan.'}
        </p>

        <div className="mb-10 overflow-hidden rounded-3xl border border-emerald-500/20 bg-slate-900/70 text-left shadow-2xl shadow-emerald-950/40 backdrop-blur-md ring-1 ring-white/5">
          <div className="border-b border-emerald-500/15 bg-emerald-950/40 px-6 py-4">
            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-400">
              <Sparkles className="h-4 w-4 shrink-0" aria-hidden />
              {hi ? 'मेंस ज्ञानकोश में क्या है' : "What's in Mains Gyan Kosh"}
            </p>
          </div>
          <div className="px-6 py-6">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-4 animate-pulse rounded bg-slate-700/80" />
                ))}
              </div>
            ) : (
              <ul className="space-y-4">
                {tickLines.map((line) => (
                  <li key={line} className="flex gap-3 text-sm font-medium leading-snug text-slate-200">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" aria-hidden />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            type="button"
            className="h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 px-8 font-bold text-white shadow-lg shadow-emerald-900/40 hover:from-emerald-400 hover:to-emerald-600"
            onClick={() => setModalOpen(true)}
          >
            {hi ? 'प्लान व कीमत देखें' : 'View plan & pricing'}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-12 rounded-xl border-slate-600/80 bg-slate-900/50 font-bold text-slate-200 backdrop-blur-sm hover:bg-slate-800/80 hover:text-white"
            asChild
          >
            <Link href="/pricing?need=mains">{hi ? 'पूरी प्राइसिंग पेज' : 'Full pricing page'}</Link>
          </Button>
        </div>
      </div>

      <SyllabusLockMainsModal open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
}

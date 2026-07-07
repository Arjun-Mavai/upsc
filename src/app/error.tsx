'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { logger } from '@/lib/logger';
import { RotateCcw, Home, CloudLightning, BookOpen, PenTool, LifeBuoy } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface AppErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
  unstable_retry?: () => void;
}

const NEW_CA_TEXT_STYLE = {
  color: '#0fffff',
  WebkitTextStroke: '0.5px #082f49',
  textShadow: '0px 1px 0px #0369a1, 0px 2px 0px #075985, 0px 3px 0px #082f49, 0px 4px 6px rgba(0,0,0,0.8)'
};

export default function Error({ error, reset, unstable_retry }: AppErrorProps) {
  useEffect(() => {
    logger.error('App Error:', error);
  }, [error]);

  const handleRetry = () => {
    if (unstable_retry) {
      unstable_retry();
    } else {
      reset();
    }
  };

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#F5F5F7] p-4 font-sans selection:bg-slate-200 sm:p-6 overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-[28rem] rounded-[2rem] border border-white/50 bg-white/80 p-6 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl sm:p-10"
      >
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 shadow-sm sm:h-20 sm:w-20 sm:rounded-[1.5rem]">
          <CloudLightning className="h-8 w-8 text-slate-700 animate-[pulse_2s_ease-in-out_infinite] sm:h-10 sm:w-10" />
        </div>

        <h1 className="mb-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
          Minor Glitch
        </h1>
        
        <p className="mb-6 text-sm font-semibold text-slate-600 sm:text-base">
          Please try again to continue.
        </p>

        {/* Motivational Quote - Bilingual & Brand Consistency */}
        <div className="mx-auto mb-10 max-w-sm rounded-2xl border border-slate-100 bg-slate-50/80 p-5 italic text-slate-600 shadow-inner">
          <p className="text-[15px] font-bold leading-relaxed mb-2 text-slate-700">
            "A smooth sea never made a skilled sailor. Keep pushing forward!"
          </p>
          <p className="text-[13.5px] font-bold text-slate-500 leading-relaxed font-[family-name:var(--font-pyq-dev)]">
            (शांत समुद्र कभी कुशल नाविक नहीं बनाता। अपनी तैयारी को बिना रुके आगे बढ़ाएं!)
          </p>
        </div>

        {/* Buttons with Pointer Arrow attached to Refresh */}
        <div className="flex flex-col gap-3 sm:flex-row relative">
          
          <div className="relative w-full flex-1">
            {/* The Curvy Arrow Pointer */}
            <motion.div
              initial={{ opacity: 0, x: 15, y: 10, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
              transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
              className="absolute right-[-20px] top-[-60px] w-[100px] h-[70px] pointer-events-none select-none z-30"
            >
              <div 
                className="absolute left-[5px] top-[-10px] whitespace-nowrap text-[12px] font-black uppercase tracking-widest -rotate-6 z-10"
                style={NEW_CA_TEXT_STYLE}
              >
                CLICK HERE ✨
              </div>
              <svg width="60" height="60" viewBox="0 0 60 60" fill="none" className="filter drop-shadow-[0_3px_5px_rgba(236,72,153,0.5)] w-[50px] absolute left-0 top-0">
                <path d="M50 50C40 30 25 15 8 15" stroke="#ec4899" strokeWidth="5" strokeLinecap="round" />
                <path d="M 5,15 L 20,6 L 16,24 Z" fill="#ec4899" stroke="#ec4899" strokeWidth="2" strokeLinejoin="round" />
              </svg>
              <div className="absolute left-[40px] top-[24px] text-[32px] filter drop-shadow-md">
                🚶‍♂️
              </div>
            </motion.div>

            <Button
              onClick={handleRetry}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 text-sm font-black tracking-wide text-white transition-all hover:bg-black hover:shadow-[0_8px_25px_rgba(0,0,0,0.15)] active:scale-[0.98]"
            >
              <RotateCcw className="h-4 w-4" />
              Try again
            </Button>
          </div>

          <Button
            variant="outline"
            asChild
            className="flex h-12 w-full flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200/80 bg-white text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900 active:scale-[0.98]"
          >
            <Link href="/">
              <Home className="h-4 w-4 text-slate-500" />
              Go Home
            </Link>
          </Button>
        </div>

        {/* Divider */}
        <div className="my-8 flex items-center gap-4">
          <div className="h-px flex-1 bg-slate-100" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">
            Helpful Links
          </span>
          <div className="h-px flex-1 bg-slate-100" />
        </div>
        
        {/* Self-Service Options */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Link
            href="/mains"
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-600 transition-colors hover:border-slate-200 hover:bg-slate-100 hover:text-slate-900"
          >
            <PenTool className="h-3.5 w-3.5 text-slate-400" />
            Mains Gyankosh
          </Link>
          <Link
            href="/contact"
            className="col-span-1 flex items-center justify-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-600 transition-colors hover:border-slate-200 hover:bg-slate-100 hover:text-slate-900 sm:col-span-2"
          >
            <LifeBuoy className="h-3.5 w-3.5 text-slate-400" />
            Raise Support Ticket
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { ArrowLeft, Home, Sparkles, Compass } from 'lucide-react';

export function NotFoundClient() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#fffcf7] via-[#fffdfa] to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 px-6 py-12 text-center overflow-hidden">
      
      {/* Decorative Grid Pattern & Soft Glows */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#fbf7f0_1px,transparent_1px),linear-gradient(to_bottom,#fbf7f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,black,transparent)] bg-[size:4rem_4rem] pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 h-[300px] w-[300px] rounded-full bg-amber-400/5 blur-[80px] dark:bg-amber-500/5 pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 h-[300px] w-[300px] rounded-full bg-emerald-400/5 blur-[80px] dark:bg-emerald-500/5 pointer-events-none" />

      {/* Card Wrapper */}
      <div className="relative z-10 w-full max-w-lg rounded-3xl border border-slate-100 bg-white/70 backdrop-blur-xl p-8 sm:p-10 dark:border-slate-800/80 dark:bg-slate-900/70 shadow-[0_20px_50px_rgba(230,180,80,0.04)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] animate-in fade-in slide-in-from-bottom-6 duration-700">
        
        {/* Floating Compass Illustration Badge */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-50 to-amber-100/50 dark:from-slate-850 dark:to-amber-950/20 border border-amber-200/50 dark:border-amber-500/20 shadow-md animate-float">
          <Compass className="h-10 w-10 text-amber-600 dark:text-amber-500" />
        </div>

        {/* Large Gradient 404 text */}
        <h1 className="mb-2 bg-gradient-to-b from-amber-400 to-orange-500 bg-clip-text text-8xl font-black leading-none tracking-tighter text-transparent select-none sm:text-9xl drop-shadow-sm">
          404
        </h1>

        {/* Title */}
        <h2 className="mb-3 text-2xl font-black tracking-tight text-slate-900 dark:text-slate-50 sm:text-3xl">
          रास्ता भटक गए क्या? 🧭
        </h2>
        
        {/* Subtitle / Description */}
        <p className="mx-auto mb-8 max-w-sm text-sm font-semibold leading-relaxed text-slate-500 dark:text-slate-400">
          The page you are looking for doesn't exist or has been moved. Let's get you back on track for your UPSC prep!
        </p>

        {/* Buttons Grid */}
        <div className="mb-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 py-3.5 text-sm font-black text-white shadow-lg shadow-slate-950/10 transition-all hover:bg-slate-800 active:scale-95 sm:w-auto dark:bg-slate-50 dark:text-slate-950 dark:hover:bg-slate-200"
          >
            <Home className="h-4 w-4" />
            Return Home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 active:scale-95 sm:w-auto dark:border-slate-850 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </button>
        </div>

        {/* Extra Helpful Note */}
        <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          <span>Keep up the focus, future officer! 🏛️</span>
        </div>
      </div>
      
    </div>
  );
}

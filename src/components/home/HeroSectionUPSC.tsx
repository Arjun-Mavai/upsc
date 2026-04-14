'use client';

import { useTransition } from 'react';
import { Sparkles, ArrowRight, Loader2, BrainCircuit } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, Variants } from 'framer-motion';

export function HeroSectionUPSC() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const textVariants: Variants = {
    hidden: { opacity: 0, y: 40 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 0.8, 
        ease: [0.2, 0.65, 0.3, 0.9] 
      } 
    },
  };

  return (
    <section className="relative flex min-h-[85vh] flex-col items-center justify-center overflow-hidden bg-[#0a0a0a] px-4 pt-20 pb-12 md:min-h-screen md:px-6">
      {/* 🌌 DARK AMBER BACKGROUND EFFECTS */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] bg-center opacity-[0.03] invert"></div>
        
        {/* Deep amber glow from center-top */}
        <div className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle_at_center,rgba(217,119,6,0.15),transparent_60%)] blur-[100px]" />
        <div className="absolute bottom-0 right-[-20%] w-[600px] h-[600px] bg-[radial-gradient(circle_at_center,rgba(217,119,6,0.08),transparent_60%)] blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl space-y-4 text-center md:space-y-12">
        
        {/* 🚀 BADGE */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mx-auto flex w-fit"
        >
          <div className="inline-flex items-center gap-2.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-xs font-bold text-amber-300 backdrop-blur-md shadow-[0_0_20px_rgba(217,119,6,0.1)] md:px-5 md:py-2.5 md:text-sm">
            <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse shadow-[0_0_10px_rgba(217,119,6,0.8)]"></span>
            Decoding 2020-2025 PYQs
          </div>
        </motion.div>

        {/* 📝 MASSIVE TYPOGRAPHY */}
        <div className="flex flex-col items-center justify-center space-y-2 md:space-y-3">
          <motion.h1 
            className="flex flex-col text-center font-black tracking-tighter"
            initial="hidden"
            animate="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.15 } }
            }}
          >
            <motion.span variants={textVariants} className="text-5xl text-slate-100 sm:text-7xl md:text-[6rem] lg:text-[8.5rem] leading-[0.85] drop-shadow-lg">
              THINK LIKE
            </motion.span>
            <motion.span variants={textVariants} className="mt-1 text-5xl sm:text-7xl md:text-[6rem] lg:text-[8.5rem] leading-[0.85]">
              <span className="text-slate-100 drop-shadow-lg">THE </span>
              <span className="bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(217,119,6,0.3)]">
                EXAMINER.
              </span>
            </motion.span>
          </motion.h1>
          
          <motion.p 
            variants={textVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.4 }}
            className="mx-auto mt-2 max-w-3xl px-2 text-base font-medium text-slate-400 sm:text-lg md:text-2xl leading-relaxed md:mt-6"
          >
            Beyond just answers. Master the <strong className="text-amber-200">Logic Path</strong>, decode <strong className="text-amber-200">Trap Watch</strong>, and understand the <strong className="text-amber-200">Verdict</strong> of every UPSC Prelims question.
          </motion.p>
        </div>

        {/* 🎯 ACTION BUTTONS */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mx-auto flex w-full max-w-md flex-col items-center justify-center gap-6 px-4 pt-2 md:pt-6 pb-20 md:pb-0"
        >
          <button
            onClick={() => {
              startTransition(() => {
                router.push('/upsc/intelligence');
              });
            }}
            onMouseEnter={() => router.prefetch('/upsc/intelligence')}
            className="group relative w-full focus:outline-none"
          >
            {/* Outer Glow */}
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-amber-600 to-amber-400 opacity-25 blur-lg transition duration-500 group-hover:opacity-60 group-hover:duration-200"></div>
            
            <div className="relative flex h-14 w-full items-center justify-center overflow-hidden rounded-full bg-[#050505] border border-amber-500/30 transition-all duration-300 group-hover:border-amber-400/80 group-hover:scale-[1.02] group-active:scale-[0.98] md:h-16">
              {/* Premium Inner Shine */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full transition-transform duration-1000 group-hover:translate-x-full" />
              
              <div className="relative z-10 flex w-full items-center justify-between px-6 md:px-8">
                <div className="flex items-center gap-3">
                  {isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin text-amber-400" />
                  ) : (
                    <BrainCircuit className="h-5 w-5 text-amber-400 transition-colors group-hover:text-amber-300" />
                  )}
                  <span className="text-sm font-black tracking-widest uppercase text-slate-100 md:text-base">
                    Enter Intelligence
                  </span>
                </div>
                <ArrowRight className="h-5 w-5 text-amber-400 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-amber-300" />
              </div>
            </div>
          </button>
        </motion.div>
      </div>
      
      {/* 🏅 STATS OR TRUST BADGES */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 hidden w-full max-w-4xl justify-between px-8 lg:flex opacity-70"
      >
        <div className="flex flex-col items-center gap-1">
          <span className="text-4xl font-black text-slate-100 tracking-tighter">600<span className="text-amber-500">+</span></span>
          <span className="text-xs font-bold tracking-[0.2em] text-slate-500 uppercase">Decoded PYQs</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-4xl font-black text-slate-100 tracking-tighter">6 <span className="text-amber-500">Years</span></span>
          <span className="text-xs font-bold tracking-[0.2em] text-slate-500 uppercase">Trend Analysis</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-4xl font-black text-slate-100 tracking-tighter">100<span className="text-amber-500">%</span></span>
          <span className="text-xs font-bold tracking-[0.2em] text-slate-500 uppercase">Logic Focus</span>
        </div>
      </motion.div>
    </section>
  );
}

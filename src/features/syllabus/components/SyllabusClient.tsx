'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, ArrowRight, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSettingsStore } from '@/store/useSettingsStore';
import { SyllabusLockModal } from '@/features/syllabus/components/SyllabusLockModal';
import { SyllabusTopicCard } from '@/components/SyllabusTopicCard';
import { SyllabusData } from '@/types/syllabus';
import { Fragment } from 'react';

interface SyllabusClientProps {
  syllabusData: SyllabusData;
}

export function SyllabusClient({ syllabusData }: SyllabusClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [unlockModalOpen, setUnlockModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [navigatingId, setNavigatingId] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const { user, isSubscribed, setUser, language, setLanguage } = useSettingsStore();

  // Hydration fix for Persist middleware
  useEffect(() => {
    setIsMounted(true);
    const urlLang = searchParams.get('lang');
    if (urlLang === 'en' || urlLang === 'hi') {
      if (urlLang !== language) setLanguage(urlLang);
    }
  }, []);

  // Keyboard shortcut for Command Palette
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  if (!isMounted) return null; // Prevent hydration mismatch

  return (
    <Fragment>
      <div className="relative min-h-screen overflow-hidden bg-[#fafbfc] pb-20 font-sans selection:bg-slate-900 selection:text-white">
        {/* 🎭 PREMIUM BACKGROUND BLURS */}
        <div className="pointer-events-none absolute top-0 left-0 h-[600px] w-full bg-gradient-to-b from-slate-100/50 to-transparent" />
        <div className="pointer-events-none absolute top-[-100px] right-[-100px] h-[600px] w-[600px] rounded-full bg-indigo-50/40 blur-[120px]" />
        <div className="pointer-events-none absolute top-[20%] left-[-150px] h-[500px] w-[500px] rounded-full bg-emerald-50/30 blur-[100px]" />

        {/* --- Main Content --- */}
        <div className="relative z-10 mx-auto max-w-7xl space-y-16 px-6 pt-32 md:pt-48">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="flex flex-col items-center space-y-8 text-center"
        >
          <div className="inline-flex items-center gap-2.5 rounded-full border border-slate-200 bg-white px-5 py-2 text-[10px] font-black tracking-widest text-slate-500 uppercase shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>
            {syllabusData.exam_name}
          </div>

          <div className="max-w-4xl space-y-4">
            <h1 className="text-5xl leading-[0.95] font-black tracking-tighter text-slate-900 md:text-8xl md:leading-[0.9]">
              {language === 'hi' ? 'तैयारी का ' : 'Master your'} <br className="hidden md:block" />
              <span className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 bg-clip-text text-transparent">
                {language === 'hi' ? 'नया दौर।' : 'Syllabus.'}
              </span>
            </h1>
            <p className="mx-auto max-w-xl text-lg leading-relaxed font-medium text-slate-500 md:text-xl">
              {language === 'hi'
                ? 'एमपीपीएससी प्रीलिम्स 2026 के लिए आधुनिक रणनीति। 100+ टॉपिक्स, नेमोनिक्स और टेस्ट सीरीज।'
                : 'The most comprehensive roadmap for UPSC 2026. 6 years of PYQs, AI explanations, and subject analysis.'}
            </p>
          </div>

          {/* 🔽 SCROLL INDICATOR */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 1 }}
            className="flex flex-col items-center gap-2 pt-4"
          >
            <div 
              onClick={() => {
                const target = document.getElementById('units-grid');
                target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className="group flex flex-col items-center gap-2 cursor-pointer"
            >
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-slate-600 transition-colors">
                {language === 'hi' ? '10 यूनिट्स के लिए नीचे स्क्रॉल करें' : 'Scroll for all 10 units'}
              </div>
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm group-hover:border-slate-300 group-hover:shadow-md transition-all"
              >
                <ChevronDown className="h-5 w-5 text-slate-500 group-hover:text-slate-900" />
              </motion.div>
            </div>
          </motion.div>
        </motion.div>

        {/* Units Grid/List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          {/* ✦ PYQ Intelligence Section */}
          <div className="mx-auto max-w-4xl">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">📊</span>
                <div>
                  <h2 className="text-lg font-black text-slate-900">
                    {language === 'hi' ? 'PYQ इंटेलिजेंस' : 'PYQ Intelligence'}
                  </h2>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    {language === 'hi' ? '2020-2025 · UPSC Prelims ट्रेंड्स' : '2020-2025 · UPSC Prelims Trends'}
                  </p>
                </div>
              </div>
              <div
                onClick={() => {
                  setNavigatingId('pyq-view-all');
                  router.push('/syllabus/quiz/pyq/analysis');
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-black text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
              >
                {language === 'hi' ? 'सब देखें' : 'View All'}
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">

              {/* Card 1: Year-wise Trend */}
              <div 
                onClick={() => {
                  setNavigatingId('pyq-matrix');
                  router.push('/syllabus/quiz/pyq/analysis');
                }} 
                className="group block cursor-pointer"
              >
                <div className={cn(
                  "relative h-full rounded-[1.5rem] border border-blue-100 bg-blue-50 p-6 transition-all hover:shadow-lg hover:shadow-blue-200/40 hover:-translate-y-0.5 max-w-2xl mx-auto w-full",
                  navigatingId === 'pyq-matrix' && "opacity-80 grayscale-[0.5] pointer-events-none"
                )}>
                  {navigatingId === 'pyq-matrix' && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/20 backdrop-blur-[1px] rounded-[1.5rem]">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
                    </div>
                  )}
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">📅</span>
                      <div>
                        <h3 className="text-base font-black text-slate-800">
                          {language === 'hi' ? 'Year-wise Matrix' : 'Year-wise Matrix'}
                        </h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {language === 'hi' ? 'ट्रेंड एनालिसिस' : 'Trend Analysis'}
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-blue-600">
                      {language === 'hi' ? 'ट्रेंड' : 'Trend'}
                    </span>
                  </div>
                  
                  {/* Mini bar chart - slightly larger for 1-column layout */}
                  <div className="mt-4 space-y-2.5">
                    {[
                      { year: '2025', pct: 90, color: 'bg-blue-500' },
                      { year: '2024', pct: 72, color: 'bg-blue-400' },
                      { year: '2023', pct: 58, color: 'bg-blue-300' },
                    ].map((row) => (
                      <div key={row.year} className="flex items-center gap-3">
                        <span className="w-10 text-[11px] font-black text-slate-500">{row.year}</span>
                        <div className="flex-1 h-3 rounded-full bg-blue-100 overflow-hidden">
                          <div className={`h-full rounded-full ${row.color} transition-all`} style={{ width: `${row.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-5 text-xs font-black text-blue-600 group-hover:underline flex items-center gap-1">
                    {language === 'hi' ? 'पूरा मैट्रिक्स देखें' : 'Explore Full Matrix'}
                    <ArrowRight className="h-3 w-3" />
                  </p>
                </div>
              </div>

            </div>
          </div>
        </motion.div>

        {/* Units Grid/List */}
        <div id="units-grid" className="scroll-mt-32">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 gap-8 pb-32 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(syllabusData.units).map(([key, unit], index) => {
                const title =
                  language === 'en' && unit.title_en
                    ? unit.title_en
                    : unit.unit_title || unit.title;
                const topics = language === 'en' && unit.topics_en ? unit.topics_en : unit.topics;
                const isLocked = key !== 'unit_1' && !isSubscribed;

                return (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 + 0.4 }}
                  >
                    <SyllabusTopicCard
                      id={key}
                      title={title ?? ''}
                      subtitle={`${topics?.length || 0} ${language === 'hi' ? 'टॉपिक्स' : 'Topics'}`}
                      impactEmoji="📚"
                      colorVariant={(['blue', 'pink', 'emerald', 'amber'] as const)[index % 4]}
                      variant="unit"
                      isLocked={isLocked}
                      isLoading={navigatingId === key}
                      onClick={() => {
                        if (isLocked) {
                          setUnlockModalOpen(true);
                        } else {
                          setNavigatingId(key);
                          router.push(`/syllabus/${key}`);
                        }
                      }}
                      labels={{
                        search: language === 'hi' ? 'सर्च' : 'Search',
                        topic: language === 'hi' ? 'विषय' : 'Topic',
                        unit: language === 'hi' ? 'यूनिट' : 'Unit',
                      }}
                    />
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="mx-auto max-w-4xl space-y-4 pb-20">
              {Object.entries(syllabusData.units).map(([key, unit], index) => {
                const title =
                  language === 'en' && unit.title_en
                    ? unit.title_en
                    : unit.unit_title || unit.title;
                const topicsCount = (
                  language === 'en' && unit.topics_en ? unit.topics_en : unit.topics
                ).length;
                const isLocked = key !== 'unit_1' && !isSubscribed;

                return (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                  >
                    <div
                      onClick={() => {
                        if (isLocked) {
                          setUnlockModalOpen(true);
                        } else {
                          setNavigatingId(key);
                          router.push(`/syllabus/${key}`);
                        }
                      }}
                      className="cursor-pointer relative"
                    >
                      {navigatingId === key && (
                        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/20 backdrop-blur-[1px] rounded-2xl">
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-900 border-t-transparent"></div>
                        </div>
                      )}
                      <div
                        className={cn(
                          'group relative flex items-center gap-6 overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:border-slate-300 hover:shadow-md',
                          isLocked && 'grayscale-[0.8]'
                        )}
                      >
                        <div
                          className={cn(
                            'font-display z-10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg border text-xl font-bold transition-colors',
                            isLocked
                              ? 'border-slate-200 bg-slate-100 text-slate-400'
                              : 'border-slate-200 bg-white text-slate-900 group-hover:border-slate-900 group-hover:bg-slate-900 group-hover:text-white'
                          )}
                        >
                          {isLocked ? <Lock size={18} /> : index + 1}
                        </div>

                        <div className="z-10 min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3
                              className={cn(
                                'truncate text-lg font-bold transition-colors',
                                isLocked
                                  ? 'text-slate-500'
                                  : 'text-slate-900 group-hover:text-slate-700'
                              )}
                            >
                              {title}
                            </h3>
                            {!isLocked && key === 'unit_1' && (
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                                FREE
                              </span>
                            )}
                            {isLocked && (
                              <span 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setUnlockModalOpen(true);
                                }}
                                className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 hover:bg-slate-200 cursor-pointer transition-all"
                              >
                                <Lock size={10} /> PREMIUM
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-medium text-slate-500">
                            {topicsCount} {language === 'hi' ? 'विषय' : 'Topics'}
                          </p>
                        </div>

                        <div
                          className={cn(
                            'z-10 transition-all',
                            isLocked
                              ? 'text-slate-300'
                              : 'text-slate-300 group-hover:translate-x-1 group-hover:text-slate-600'
                          )}
                        >
                          <ArrowRight className="h-5 w-5" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        <SyllabusLockModal open={unlockModalOpen} onOpenChange={setUnlockModalOpen} />
      </div>
      </div>
    </Fragment>
  );
}

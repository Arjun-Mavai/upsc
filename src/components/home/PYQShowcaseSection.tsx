'use client';

import React, { useState, useEffect, memo } from 'react';
import { LazyMotion, domAnimation, m, AnimatePresence } from 'framer-motion';
import { 
  History, 
  ArrowRight, 
  CheckCircle2,
  Lightbulb,
  Brain,
  AlertTriangle,
  Zap,
  TrendingUp,
  BookOpen,
  Scale,
  ChevronDown,
  X,
  Sparkles
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSettingsStore } from '@/store/useSettingsStore';
import { cn } from '@/lib/utils';
import Link from 'next/link';

// ── UPSC PYQ DATA ───────────────────────────────────────────

const PREVIEW_QUESTIONS = [
  { id: 1, year: '2024', subject: 'POLITY', set: 'GS-1', text: 'Which of the following is/are the indicator/indicators used by UNDP for constructing Human Development Index?' },
  { id: 2, year: '2023', subject: 'ECONOMY', set: 'GS-1', text: 'Consider the following statements about the PM-KISAN scheme.' },
  { id: 3, year: '2022', subject: 'ENVIRONMENT', set: 'GS-1', text: 'Which of the following has/have been accorded "Geographical Indication" status?' },
  { id: 4, year: '2021', subject: 'HISTORY', set: 'GS-1', text: 'With reference to the history of India, "ichavati", "## ##", and "avarodha" refer to?' }
];

const WEIGHTAGE_BARS = [
  { nameEn: 'Polity & Governance', nameHi: 'राजव्यवस्था एवं शासन', pct: 22, color: 'from-indigo-400 to-blue-500' },
  { nameEn: 'Economy', nameHi: 'अर्थव्यवस्था', pct: 20, color: 'from-emerald-400 to-teal-500' },
  { nameEn: 'Environment & Ecology', nameHi: 'पर्यावरण एवं पारिस्थितिकी', pct: 18, color: 'from-green-400 to-emerald-500' },
  { nameEn: 'History & Culture', nameHi: 'इतिहास एवं संस्कृति', pct: 15, color: 'from-amber-400 to-orange-500' },
];

const SUBJECT_LIST_DETAILED = [
  { name: 'Polity', count: 132, pct: 22, icon: Scale, color: 'text-indigo-500', bg: 'bg-indigo-500/10 border-indigo-500/20' },
  { name: 'Economy', count: 120, pct: 20, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  { name: 'Environment', count: 108, pct: 18, icon: BookOpen, color: 'text-green-500', bg: 'bg-green-500/10 border-green-500/20' },
];

const EXPLANATION_BLOCKS = [
  { id: 'core', icon: CheckCircle2, labelEn: 'Core Logic', labelHi: 'तर्क एवं विश्लेषण', color: 'emerald', contentEn: 'HDI uses 3 dimensions: Health (life expectancy), Education (schooling years), and Standard of living (GNI per capita).', contentHi: 'HDI 3 आयामों का उपयोग करता है: स्वास्थ्य (जीवन प्रत्याशा), शिक्षा (स्कूली वर्ष), और जीवन स्तर (GNI प्रति व्यक्ति)।' },
  { id: 'exam', icon: Lightbulb, labelEn: 'Exam Fact', labelHi: 'परीक्षा तथ्य', color: 'amber', contentEn: 'India ranked 132 out of 191 countries in HDI 2023 report. Norway topped the list.', contentHi: 'HDI 2023 रिपोर्ट में भारत 191 देशों में 132वें स्थान पर रहा। नॉर्वे शीर्ष पर रहा।' },
  { id: 'memory', icon: Brain, labelEn: 'Memory Tip', labelHi: 'मेमोरी टिप', color: 'blue', contentEn: '"HES" = Health, Education, Standard of living - the 3 pillars of HDI.', contentHi: '"HES" = स्वास्थ्य, शिक्षा, जीवन स्तर - HDI के 3 स्तंभ।' },
  { id: 'scam', icon: AlertTriangle, labelEn: 'Scam Alert', labelHi: 'स्कैम अलर्ट', color: 'rose', contentEn: 'GDP is NOT a direct HDI component. GNI per capita is used, not GDP.', contentHi: 'GDP सीधे HDI का घटक नहीं है। GDP नहीं, GNI प्रति व्यक्ति का उपयोग किया जाता है।' }
];

// Memoized Sub-components for "Light Speed" performance
const QuestionItem = memo(({ q }: { q: typeof PREVIEW_QUESTIONS[0] }) => (
  <div className="relative rounded-xl sm:rounded-2xl bg-white/5 border border-white/5 p-3 sm:p-5 space-y-3 sm:space-y-4 group/q hover:bg-white/[0.08] transition-all overflow-hidden will-change-transform">
    <div className="flex items-start gap-3 sm:gap-4">
      <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 border border-white/5 text-indigo-500 text-[9px] sm:text-[10px] font-black">
        {q.id}
      </div>
      <p className="text-[12px] sm:text-sm font-bold leading-relaxed text-slate-100 opacity-90 pt-0.5 sm:pt-1">
        {q.text}
      </p>
    </div>
    <div className="flex flex-wrap gap-1.5 sm:gap-2 pl-10 sm:pl-12">
      <Badge className="bg-indigo-500/10 text-indigo-500 border-none px-2 py-0.5 text-[7px] sm:text-[8px] font-black">{q.year}</Badge>
      <Badge className="bg-emerald-500/10 text-emerald-500 border-none px-2 py-0.5 text-[7px] sm:text-[8px] font-black whitespace-nowrap">{q.subject}</Badge>
      <Badge className="bg-white/5 text-slate-500 border-none px-2 py-0.5 text-[7px] sm:text-[8px] font-black">{q.set}</Badge>
    </div>
  </div>
));
QuestionItem.displayName = 'QuestionItem';

const SubjectItem = memo(({ sub }: { sub: typeof SUBJECT_LIST_DETAILED[0] }) => {
  const Icon = sub.icon;
  return (
    <div className="flex items-center justify-between rounded-2xl sm:rounded-3xl border border-white/5 bg-white/[0.03] p-3 sm:p-5 hover:bg-white/5 transition-all will-change-transform">
      <div className="flex items-center gap-3 sm:gap-4">
        <div className={cn("h-9 w-9 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl border flex items-center justify-center", sub.bg)}>
          <Icon size={16} className={cn("sm:scale-110", sub.color)} />
        </div>
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-[13px] sm:text-sm font-black text-white">{sub.name}</span>
            <span className="text-[9px] sm:text-[10px] font-black text-emerald-500">{sub.count}</span>
          </div>
          <p className="text-[8px] sm:text-[9px] font-bold text-slate-500 uppercase tracking-widest">{sub.pct}% weightage</p>
        </div>
      </div>
      <div className="flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-600">
        <ChevronDown size={12} className="sm:w-[14px] sm:h-[14px]" />
      </div>
    </div>
  );
});
SubjectItem.displayName = 'SubjectItem';

export function PYQShowcaseSection() {
  const { language } = useSettingsStore();
  const isHindi = language === 'hi';
  const [activeCard, setActiveCard] = useState(0); 
  const [isHovered, setIsHovered] = useState(false);

  const TABS = [
    { labelEn: 'Year-wise', labelHi: 'वर्ष', id: 0 },
    { labelEn: 'Overall', labelHi: 'वेटेज', id: 1, badge: 'New' },
    { labelEn: 'Subjects', labelHi: 'विषय', id: 2 },
    { labelEn: 'Instant', labelHi: 'इंस्टेंट', id: 3 },
    { labelEn: 'Logic', labelHi: 'प्रीमियम', id: 4 },
  ];

  useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(() => {
      setActiveCard((prev) => (prev + 1) % TABS.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [isHovered, TABS.length]);

  const handleManualSwitch = (index: number) => {
    setActiveCard(index);
  };

  return (
    <LazyMotion features={domAnimation}>
      <section id="analysis" className="relative overflow-hidden py-16 sm:py-32 contain-layout">
        {/* Background glow effects - hardware accelerated */}
        <div className="pointer-events-none absolute top-1/2 left-[-10%] h-[300px] w-[300px] sm:h-[500px] sm:w-[500px] -translate-y-1/2 rounded-full bg-emerald-500/5 blur-[80px] sm:blur-[120px] will-change-transform" />
        <div className="pointer-events-none absolute right-[-5%] bottom-0 h-[250px] w-[250px] sm:h-[400px] sm:w-[400px] rounded-full bg-pink-500/5 blur-[70px] sm:blur-[100px] will-change-transform" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-24">
            
            {/* LEFT COLUMN: Strategic Copy */}
            <div className="relative z-10 space-y-6 sm:space-y-10 text-center lg:text-left">
              <m.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 rounded-full border border-pink-200 bg-pink-50 px-3 py-1.5 sm:px-4 sm:py-2 text-[9px] sm:text-[10px] font-black tracking-[0.2em] text-pink-700 uppercase"
              >
                <Zap className="h-3 w-3 fill-pink-500" />
                {isHindi ? 'प्रीमियम PYQ इंटेलिजेंस' : 'Premium PYQ Intelligence'}
              </m.div>

              <m.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="py-1 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl md:text-5xl lg:text-6xl"
              >
                {isHindi ? (
                  <div className="flex flex-col leading-[1.2] sm:leading-[1.25] pb-2 sm:pb-4">
                    <span>UPSC के हर प्रश्न में</span>
                    <span className="bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent italic px-1">छुपी हुई रणनीति</span>
                  </div>
                ) : (
                  <div className="flex flex-col leading-[1.1] pb-2 sm:pb-4">
                    <span>UPSC <span className="bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent italic">Strategic</span></span>
                    <span>Intelligence</span>
                  </div>
                )}
              </m.h2>

              <m.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="mx-auto max-w-xl text-base sm:text-lg font-medium leading-relaxed text-slate-600 lg:mx-0"
              >
                {isHindi 
                  ? 'पिछले 6 वर्षों का UPSC PYQ डिकोडेड डेटा। अब सिर्फ पढ़ें नहीं, प्रश्नों के पीछे की रणनीति समझे और UPSC को क्रैक करें।'
                  : 'Decoded UPSC PYQ data for the last 6 years. Don\'t just read, decode the strategy behind every question and crack UPSC.'}
              </m.p>

              {/* TAB SELECTORS */}
              <m.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="flex items-center justify-center lg:justify-start"
              >
                <div className="relative w-full overflow-hidden">
                  <div className="flex gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pb-2 max-w-full">
                    {TABS.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => handleManualSwitch(tab.id)}
                        className={cn(
                          "group relative flex shrink-0 items-center gap-1 sm:gap-1.5 rounded-lg sm:rounded-xl px-3 py-2 sm:px-4 sm:py-2.5 text-[9px] sm:text-[10px] font-black tracking-widest uppercase transition-all active:scale-95",
                          activeCard === tab.id 
                            ? "bg-slate-900 text-white shadow-xl" 
                            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                        )}
                      >
                        <span className="relative z-10">{isHindi ? tab.labelHi : tab.labelEn}</span>
                        {tab.badge && (
                          <span className="relative z-10 rounded bg-emerald-500 px-1 py-0.5 text-[7px] font-black leading-none text-white ml-0.5">
                            {tab.badge}
                          </span>
                        )}
                        {activeCard === tab.id && (
                          <m.div 
                            layoutId="nav-bg"
                            className="absolute inset-0 bg-slate-900 rounded-lg sm:rounded-xl" 
                            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                          />
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-white/90 to-transparent lg:hidden" />
                </div>
              </m.div>

              {/* CTA BUTTON - Desktop Only (Hidden on mobile) */}
              <m.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="hidden lg:block pt-4"
              >
                <Link 
                  href="/pricing"
                  className="group relative inline-flex items-center gap-4 rounded-3xl bg-[#0F172A] px-10 py-5 text-[11px] font-black tracking-[0.2em] text-white uppercase transition-all hover:scale-105 active:scale-95 shadow-[0_20px_50px_rgba(15,23,42,0.3)] overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-rose-500 opacity-0 transition-opacity group-hover:opacity-100" />
                  <span className="relative z-10">{isHindi ? 'प्रीमियम इंटेलिजेंस अनलॉक करें' : 'Unlock Full Intelligence'}</span>
                  <Sparkles className="relative z-10 h-4 w-4 text-emerald-400 group-hover:animate-pulse" />
                  <ArrowRight className="relative z-10 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </m.div>
            </div>

            {/* RIGHT COLUMN: Visual Showcase Cards */}
            <div 
              className="group relative flex flex-col items-center lg:items-end"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              {/* Ambient Background Blur */}
              <div className="absolute -inset-4 sm:-inset-10 rounded-[3rem] sm:rounded-[4rem] bg-gradient-to-br from-pink-600/10 via-emerald-500/10 to-rose-600/10 opacity-40 blur-[40px] sm:blur-[80px] group-hover:opacity-60 transition-opacity duration-1000" />

              <div className="relative aspect-[4/5.5] sm:aspect-[3.5/5.4] w-full max-w-[340px] sm:max-w-md">
                <Card className="relative h-full w-full overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] border-slate-800 bg-[#06080F] p-0 text-white shadow-2xl ring-1 ring-white/5">
                  {/* Visual Header */}
                  <div className="relative border-b border-white/[0.05] bg-white/[0.02] p-4 sm:p-7 space-y-3 sm:space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                          <span className="text-[8px] sm:text-[9px] font-black tracking-[0.25em] text-[#5E6278] uppercase">UPSC PRELIMS · INSIGHT</span>
                      </div>
                      <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-emerald-500 text-black shadow-lg shadow-emerald-500/30">
                          <TrendingUp size={14} className="sm:w-4 sm:h-4" />
                      </div>
                    </div>
                    
                    <AnimatePresence mode="wait">
                        <m.h3 
                          key={activeCard}
                          initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                          className={cn(
                            "text-xl sm:text-3xl font-black tracking-tighter bg-clip-text text-transparent",
                            activeCard === 1 ? "bg-gradient-to-r from-amber-400 to-orange-500" :
                            activeCard === 0 ? "bg-gradient-to-r from-emerald-400 to-teal-500" :
                            "bg-gradient-to-r from-pink-400 to-rose-500"
                          )}
                        >
                          {activeCard === 0 ? (isHindi ? 'पेपर एनालिसिस' : 'Paper Analysis') : 
                          activeCard === 1 ? (isHindi ? 'वेटेज' : 'Overall Weightage') :
                          activeCard === 2 ? (isHindi ? 'विषय' : 'Subject Matrix') :
                          activeCard === 3 ? (isHindi ? 'इंस्टेंट मोड' : 'Instant Mode') : (isHindi ? 'प्रीमियम लॉजिक' : 'Premium Logic')}
                        </m.h3>
                    </AnimatePresence>
                  </div>

                  {/* CONTENT AREA */}
                  <div className="h-[calc(100%-120px)] sm:h-[calc(100%-140px)] overflow-y-auto p-4 sm:p-7 no-scrollbar">
                    <AnimatePresence mode="wait">
                      
                      {/* SLIDE 0: RICH QUESTION LIST */}
                      {activeCard === 0 && (
                        <m.div key="c0" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-4">
                          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                              {['ALL', '2025', '2024', '2023', '2022', '2021', '2020'].map((y, i) => (
                                <Badge key={y} className={cn("px-3 py-1 sm:px-4 sm:py-1.5 text-[9px] sm:text-[10px] font-black rounded-lg shrink-0 border-none transition-all", i === 0 ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20" : "bg-white/5 text-slate-500 hover:bg-white/10")}>
                                    {y}
                                </Badge>
                              ))}
                          </div>

                          <div className="space-y-3">
                              {PREVIEW_QUESTIONS.map((q) => <QuestionItem key={q.id} q={q} />)}
                          </div>
                        </m.div>
                      )}

                      {/* CARD 1: OVERALL WEIGHTAGE (BARS) */}
                      {activeCard === 1 && (
                        <m.div key="c1" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-5 sm:space-y-6">
                          {WEIGHTAGE_BARS.map((sub) => (
                              <div key={sub.nameEn} className="space-y-2.5 sm:space-y-3">
                                <div className="flex justify-between items-end">
                                  <span className="text-[11px] sm:text-xs font-black text-slate-200">{isHindi ? sub.nameHi : sub.nameEn}</span>
                                  <span className="text-[9px] sm:text-[10px] font-black text-indigo-500">{sub.pct}%</span>
                                </div>
                                <div className="h-2.5 sm:h-3 w-full rounded-full bg-white/5 overflow-hidden ring-1 ring-white/5">
                                  <m.div 
                                      initial={{ width: 0 }} animate={{ width: `${sub.pct * 2.5}%` }} transition={{ duration: 1, ease: 'easeOut' }}
                                      className={cn("h-full rounded-full bg-gradient-to-r", sub.color)}
                                  />
                                </div>
                              </div>
                          ))}
                          <div className="pt-4 border-t border-white/5">
                              <Badge className="bg-indigo-500/10 text-indigo-500 border-none px-3 py-1 font-black text-[8px] sm:text-[9px] uppercase tracking-widest">
                                Total 600+ UPSC PYQ Analyzed
                              </Badge>
                          </div>
                        </m.div>
                      )}

                      {/* CARD 2: SUBJECT ANALYSIS (CARDS) */}
                      {activeCard === 2 && (
                        <m.div key="c2" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-3 sm:space-y-4">
                          {SUBJECT_LIST_DETAILED.map((sub) => <SubjectItem key={sub.name} sub={sub} />)}
                        </m.div>
                      )}

                      {/* CARD 3: INSTANT MODE */}
                      {activeCard === 3 && (
                        <m.div key="c3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-4 sm:space-y-6">
                          <div className="rounded-[1.5rem] sm:rounded-[2rem] bg-white p-4 sm:p-7 text-slate-900 shadow-xl space-y-4 sm:space-y-6 min-h-[300px] sm:min-h-[360px]">
                              <div className="flex items-start justify-between">
                                <div className="space-y-0.5">
                                    <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">UPSC PRELIMS</p>
                                    <h4 className="text-[14px] sm:text-base font-black tracking-tight">General Studies Test</h4>
                                </div>
                                <Badge className="bg-indigo-100 text-indigo-700 border-none font-black text-[8px] sm:text-[9px] px-2 py-1 sm:px-3 sm:py-1.5 flex items-center gap-1 rounded-full">
                                    <Zap size={10} className="fill-indigo-700" /> Instant
                                </Badge>
                              </div>

                              <p className="text-[12px] sm:text-sm font-bold leading-relaxed text-slate-800 pt-1 sm:pt-2">
                                Which of the following is/are the indicator/indicators used by <span className="text-indigo-600">UNDP</span> for constructing Human Development Index?
                              </p>

                              <div className="space-y-2.5 sm:space-y-3">
                                <div className="flex items-center justify-between rounded-lg sm:rounded-xl border border-rose-100 bg-rose-50/50 p-3 sm:p-4 text-slate-400">
                                    <span className="text-[11px] sm:text-xs font-semibold">Only Health and Education</span>
                                    <X size={14} className="text-rose-500 sm:w-4 sm:h-4" />
                                </div>
                                <m.div 
                                  initial={{ scale: 0.98 }} animate={{ scale: 1 }}
                                  className="flex items-center justify-between rounded-lg sm:rounded-xl border-2 border-emerald-500 bg-emerald-50 p-3 sm:p-4 text-slate-900 shadow-lg shadow-emerald-500/10"
                                >
                                    <span className="text-[12px] sm:text-sm font-black">Health, Education & Standard of Living</span>
                                    <CheckCircle2 size={16} className="text-emerald-600 sm:w-[18px] sm:h-[18px]" />
                                </m.div>
                              </div>

                              <div className="rounded-lg sm:rounded-xl bg-slate-50 border border-slate-100 p-3 sm:p-4 space-y-1.5 sm:space-y-2">
                                <Badge className="bg-slate-800 text-white border-none text-[7px] sm:text-[8px] font-black px-1.5 py-0.5 rounded">EXPLANATION</Badge>
                                <p className="text-[9px] sm:text-[10px] font-medium leading-relaxed text-slate-600">
                                    The <strong>HDI</strong> uses three dimensions: Health (life expectancy), Education (mean years of schooling), and Standard of Living (GNI per capita).
                                </p>
                              </div>
                          </div>
                        </m.div>
                      )}

                      {/* CARD 4: PREMIUM EXTRACTION */}
                      {activeCard === 4 && (
                        <m.div key="c4" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-2.5 sm:space-y-3">
                          <div className="flex items-center justify-between pb-2 border-b border-white/5 mb-2">
                            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-[#5E6278]">Final Extraction 🧠</span>
                            <Badge variant="outline" className="border-pink-500/20 text-pink-500 text-[7px] sm:text-[8px] font-black px-2 py-0.5 sm:px-3 sm:py-1">PREMIUM</Badge>
                          </div>
                          {EXPLANATION_BLOCKS.map((block) => (
                              <div key={block.id} className={cn("rounded-xl sm:rounded-2xl border-l-[3px] border p-3 sm:p-4 space-y-1 bg-[#1C1C28]/50 ring-1 ring-white/5", {
                                'border-emerald-500/50 bg-emerald-500/5': block.color === 'emerald',
                                'border-amber-500/50 bg-amber-500/5': block.color === 'amber',
                                'border-blue-500/50 bg-blue-500/5': block.color === 'blue',
                                'border-rose-500/50 bg-rose-500/5': block.color === 'rose',
                              })}>
                                <div className="flex items-center gap-2">
                                    <block.icon size={10} className={cn("sm:w-3 sm:h-3", {
                                      'text-emerald-400': block.color === 'emerald', 'text-amber-400': block.color === 'amber',
                                      'text-blue-400': block.color === 'blue', 'text-rose-400': block.color === 'rose',
                                    })} />
                                    <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-slate-400">{isHindi ? block.labelHi : block.labelEn}</span>
                                </div>
                                <p className="text-[9px] sm:text-[10px] font-bold leading-relaxed text-slate-200">
                                    {isHindi ? block.contentHi : block.contentEn}
                                </p>
                              </div>
                          ))}
                        </m.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="absolute bottom-5 sm:bottom-6 left-1/2 flex -translate-x-1/2 gap-1.5 sm:gap-2">
                    {TABS.map((_, i) => (
                        <button key={i} onClick={() => handleManualSwitch(i)} aria-label={`Slide ${i + 1}`} className={cn("h-1 transition-all duration-300 rounded-full", activeCard === i ? "w-6 sm:w-8 bg-pink-600" : "w-1 sm:w-1.5 bg-white/10")} />
                    ))}
                  </div>
                </Card>
              </div>

              {/* MOBILE CTA BUTTON */}
              <m.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="mt-8 flex justify-center lg:hidden w-full px-4"
              >
                <Link 
                  href="/pricing"
                  className="group relative inline-flex w-full items-center justify-center gap-4 rounded-2xl sm:rounded-3xl bg-[#0F172A] px-6 py-4 sm:px-10 sm:py-5 text-[10px] sm:text-[11px] font-black tracking-[0.2em] text-white uppercase transition-all hover:scale-105 active:scale-95 shadow-[0_20px_50px_rgba(15,23,42,0.3)] overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-rose-500" />
                  <span className="relative z-10">{isHindi ? 'प्रीमियम अनलॉक करें' : 'Unlock Premium'}</span>
                  <Sparkles className="relative z-10 h-3.5 w-3.5 text-emerald-400" />
                  <ArrowRight className="relative z-10 h-3.5 w-3.5" />
                </Link>
              </m.div>
            </div>
          </div>
        </div>
      </section>
    </LazyMotion>
  );
}

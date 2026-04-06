'use client';

import { useMemo, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  BookOpenText,
  Brain,
  Lightbulb,
  BarChart3,
  Target,
  ArrowLeft,
  Filter,
  Layers,
  Calendar,
  Sparkles,
  Zap,
  Bookmark,
  Share2,
  ChevronRight,
  ShieldAlert,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type {
  PyqFactItem,
  PyqInsightsCoverageSummary,
  PyqInsightSubjectItem,
  PyqInsightTopicItem,
} from '@/features/tests/actions/pyq-insights';
import { useSettingsStore } from '@/store/useSettingsStore';
import { cn } from '@/lib/utils';

const VARIANTS = {
  blue: {
    bg: 'bg-indigo-500/5',
    text: 'text-indigo-400',
    icon: 'text-indigo-400',
    border: 'border-indigo-500/20',
    shadow: 'shadow-indigo-500/5',
    dot: 'bg-indigo-500',
    highlight: 'bg-indigo-500/10',
  },
  pink: {
    bg: 'bg-rose-500/5',
    text: 'text-rose-400',
    icon: 'text-rose-400',
    border: 'border-rose-500/20',
    shadow: 'shadow-rose-500/5',
    dot: 'bg-rose-500',
    highlight: 'bg-rose-500/10',
  },
  emerald: {
    bg: 'bg-emerald-500/5',
    text: 'text-emerald-400',
    icon: 'text-emerald-400',
    border: 'border-emerald-500/20',
    shadow: 'shadow-emerald-500/5',
    dot: 'bg-emerald-500',
    highlight: 'bg-emerald-500/10',
  },
  amber: {
    bg: 'bg-amber-500/5',
    text: 'text-amber-400',
    icon: 'text-amber-400',
    border: 'border-amber-500/20',
    shadow: 'shadow-amber-500/5',
    dot: 'bg-amber-500',
    highlight: 'bg-amber-500/10',
  },
};

interface PYQFactsClientProps {
  subjects: PyqInsightSubjectItem[];
  topics: PyqInsightTopicItem[];
  viewMode: 'subject' | 'year';
  selectedYear?: number;
  selectedSubject: string;
  selectedTopic?: string;
  limit: number;
  facts: PyqFactItem[];
  coverage: PyqInsightsCoverageSummary;
  yearOptions: number[];
}

const LIMIT_OPTIONS = [30, 50, 100, 200];

const formatTestTitle = (title: string, isHindi: boolean) => {
  if (!title) return '';
  const yearMatch = title.match(/(19|20)\d{2}/);
  let year = yearMatch ? yearMatch[0] : '';
  
  // Strict capping for PYQ display - nothing beyond 2025
  if (year && Number(year) > 2025) {
    year = '2025';
  }

  const titleLower = title.toLowerCase();

  if (
    titleLower.includes('प्रारंभिक') ||
    titleLower.includes('prelims') ||
    titleLower.includes('pre')
  ) {
    return isHindi ? `UPSC Pre ${year}` : `UPSC Pre ${year}`;
  }
  if (titleLower.includes('मुख्य') || titleLower.includes('mains')) {
    return isHindi ? `UPSC Mains ${year}` : `UPSC Mains ${year}`;
  }
  return title; // fallback
};

export default function PYQFactsClient({
  subjects,
  topics,
  viewMode,
  selectedYear,
  selectedSubject,
  selectedTopic,
  limit,
  facts,
  coverage,
  yearOptions,
}: PYQFactsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { language } = useSettingsStore();
  const isHindi = language === 'hi';
  const [isPending, startTransition] = useTransition();
  const [showFilters, setShowFilters] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [readFacts, setReadFacts] = useState<Set<string>>(new Set());

  const readCount = readFacts.size;

  const toggleFactRead = (id: string) => {
    setReadFacts(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Auto-track progress as user scrolls (simplified simulation for now)
  const activeTopic = useMemo(() => {
    if (selectedTopic && selectedTopic !== 'all') {
      return topics.find((t) => t.topicSlug === selectedTopic);
    }
    return undefined;
  }, [selectedTopic, topics]);

  const deepLearning = activeTopic?.aiContent;

  const searchParams = useSearchParams();
  const applyFilters = (subject: string, topic?: string, year?: number, nextLimit = limit) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('page');
      if (subject) params.set('subject', subject);
      if (topic && topic !== 'all') params.set('topic', topic);
      else params.delete('topic');
      if (year !== undefined && year !== 0) params.set('year', String(year));
      else params.delete('year');
      params.set('limit', String(nextLimit));
      router.replace(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <div className="relative min-h-screen bg-[#fafafa] pb-32 text-slate-900 selection:bg-rose-100">
      {/* Light Multi-Gradient Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] h-[60%] w-[60%] rounded-full bg-indigo-50/60 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[60%] w-[60%] rounded-full bg-emerald-50/60 blur-[120px]" />
        <div className="absolute top-[20%] right-[-5%] h-[50%] w-[50%] rounded-full bg-rose-50/60 blur-[120px]" />
        <div className="absolute bottom-[20%] left-[-5%] h-[50%] w-[50%] rounded-full bg-amber-50/40 blur-[120px]" />
      </div>

      {/* Floating Progress Tracker (Retention Hook) */}
      <motion.div 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full border border-slate-200/60 bg-white/80 px-6 py-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <BookOpenText size={14} />
        </div>
        <span className="text-[10px] font-bold tracking-widest text-slate-600 uppercase whitespace-nowrap">
          {isHindi ? `पढ़े गए: ${readCount}/${facts.length}` : `Progress: ${readCount}/${facts.length}`}
        </span>
        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100 sm:w-24">
          <motion.div 
            className="h-full bg-emerald-500"
            initial={{ width: 0 }}
            animate={{ width: `${(readCount / Math.max(facts.length, 1)) * 100}%` }}
          />
        </div>
      </motion.div>

      <div className={cn(
        "relative z-10 mx-auto max-w-6xl px-4 pt-20 transition-all duration-500",
        isPending && "blur-[1px] opacity-70 pointer-events-none"
      )}>
        {/* Elite Mobile-First Header */}
        <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            <button
              onClick={() => router.push('/syllabus/quiz/pyq/intelligence')}
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 transition-all hover:bg-slate-50 hover:scale-105 active:scale-95"
            >
              <ArrowLeft className="h-5 w-5 text-slate-500" />
            </button>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Sparkles size={12} className="text-rose-500" />
                <span className="text-[10px] font-bold tracking-[0.2em] text-rose-500 uppercase">Expert Vault</span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                {isHindi ? 'फैक्ट लाइब्रेरी' : 'Facts Library'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowStats(!showStats)}
              className={cn(
                "h-12 w-12 rounded-2xl border-slate-200 bg-white p-0 text-slate-600 transition-all hover:bg-slate-50 shadow-sm",
                showStats && "bg-amber-50 text-amber-600 border-amber-200"
              )}
            >
              <Target className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "h-12 flex-1 rounded-2xl border-slate-200 bg-white px-6 text-[11px] font-bold tracking-widest text-slate-600 uppercase transition-all sm:flex-none shadow-sm",
                showFilters && "bg-rose-50 text-rose-600 border-rose-200"
              )}
            >
              <Filter className="mr-2 h-4 w-4" />
              {isHindi ? 'फिल्टर' : 'Filters'}
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/syllabus/quiz/pyq/analysis')}
              className="h-12 hidden sm:flex rounded-2xl border-slate-200 bg-white px-6 text-[11px] font-bold tracking-widest text-slate-600 uppercase transition-all hover:bg-slate-50 shadow-sm"
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              {isHindi ? 'एनालिसिस' : 'Analysis'}
            </Button>
          </div>
        </div>

        {/* Coverage Intelligence Card - Collapsible */}
        <AnimatePresence>
          {showStats && (
            <motion.div
              initial={{ height: 0, opacity: 0, marginBottom: 0 }}
              animate={{ height: 'auto', opacity: 1, marginBottom: 48 }}
              exit={{ height: 0, opacity: 0, marginBottom: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {[
                  { label: 'Dataset', val: `${coverage.fromYear}-${coverage.toYear}`, icon: Calendar, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                  { label: 'Total PYQ', val: coverage.pyqQuestionCount, icon: Layers, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                  { label: 'Confidence', val: `${coverage.mappingCoveragePercent}%`, icon: Target, color: 'text-amber-600', bg: 'bg-amber-50' },
                  { label: 'Intelligence', val: topics.length, icon: Brain, color: 'text-rose-600', bg: 'bg-rose-50' },
                ].map((stat, i) => (
                  <div key={i} className="flex flex-col gap-1 rounded-[1.5rem] border border-slate-100 bg-white p-5 shadow-sm">
                    <div className={cn("flex h-8 w-8 items-center justify-center rounded-xl mb-1", stat.bg)}>
                      <stat.icon className={cn("h-4 w-4", stat.color)} />
                    </div>
                    <span className="text-[9px] font-bold tracking-widest text-slate-400 uppercase">{stat.label}</span>
                    <span className="text-sm font-extrabold text-slate-900">{stat.val}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reverted Animated Filters Tray */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-10 overflow-hidden"
            >
              <div className="grid grid-cols-1 gap-4 rounded-[2.5rem] border border-slate-200 bg-white/80 p-6 backdrop-blur-xl sm:grid-cols-3 shadow-lg">
                <div className="space-y-2">
                  <span className="ml-1 text-[9px] font-bold tracking-[0.2em] text-slate-400 uppercase">Subject</span>
                  <Select value={selectedSubject} onValueChange={(val) => applyFilters(val, undefined, selectedYear)}>
                    <SelectTrigger className="h-12 rounded-2xl border-slate-100 bg-slate-50 font-bold text-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper" sideOffset={5} className="w-[320px] max-w-[90vw] rounded-2xl border-slate-200 bg-white text-slate-700 max-h-[280px] overflow-auto no-scrollbar shadow-2xl z-[100]">
                      {subjects.map((s) => (
                        <SelectItem key={s.subject} value={s.subject} className="rounded-xl focus:bg-rose-50 focus:text-rose-600 py-3">
                          {s.subject} ({s.factCount})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <span className="ml-1 text-[9px] font-bold tracking-[0.2em] text-slate-400 uppercase">Topic</span>
                  <Select value={selectedTopic || 'all'} onValueChange={(val) => applyFilters(selectedSubject, val === 'all' ? undefined : val, selectedYear)}>
                    <SelectTrigger className="h-12 rounded-2xl border-slate-100 bg-slate-50 font-bold text-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper" sideOffset={5} className="w-[320px] max-w-[90vw] rounded-2xl border-slate-200 bg-white text-slate-700 max-h-[280px] overflow-auto no-scrollbar shadow-2xl z-[100]">
                      <SelectItem value="all" className="rounded-xl py-3">All Topics</SelectItem>
                      {topics.map((t) => (
                        <SelectItem key={t.topicSlug} value={t.topicSlug} className="rounded-xl focus:bg-rose-50 focus:text-rose-600 py-3">
                          {isHindi ? t.topicTitle : t.topicTitleEn || t.topicTitle}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <span className="ml-1 text-[9px] font-bold tracking-[0.2em] text-slate-400 uppercase">Year</span>
                  <Select value={selectedYear ? String(selectedYear) : 'all'} onValueChange={(val) => applyFilters(selectedSubject, selectedTopic, val === 'all' ? 0 : Number(val))}>
                    <SelectTrigger className="h-12 rounded-2xl border-slate-100 bg-slate-50 font-bold text-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper" sideOffset={5} className="w-[320px] max-w-[90vw] rounded-2xl border-slate-200 bg-white text-slate-700 max-h-[280px] overflow-auto no-scrollbar shadow-2xl z-[100]">
                      <SelectItem value="all" className="rounded-xl py-3">All Years</SelectItem>
                      {yearOptions.map((y) => (
                        <SelectItem key={y} value={String(y)} className="rounded-xl focus:bg-rose-50 focus:text-rose-600">
                          {y} Exam
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Deep Learning Insights - Google Clean Look */}
        {deepLearning && (
          <div className="animate-in fade-in slide-in-from-bottom-4 mb-16 space-y-8 duration-700">
            <div className="flex items-center gap-4 px-2">
              <Sparkles size={14} className="text-indigo-500" />
              <h3 className="text-[10px] font-bold tracking-[0.3em] text-slate-400 uppercase">Topic Insight</h3>
              <div className="h-px flex-1 bg-slate-100" />
            </div>

            <div className="grid gap-6 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <div className="relative overflow-hidden rounded-[2.5rem] bg-indigo-50 border border-indigo-100 px-10 py-12 transition-all hover:bg-indigo-100/50 sm:px-16 sm:py-14 lg:px-20 lg:py-16">
                  <h4 className="mb-6 flex items-center gap-2 text-[10px] font-bold tracking-widest text-indigo-600 uppercase">
                    <Target className="h-3.5 w-3.5" /> Concept Summary
                  </h4>
                  <div className="space-y-5 text-[17px] leading-[1.7] font-semibold text-slate-800 sm:text-[19px]">
                    {(isHindi ? deepLearning.concept_capsule : deepLearning.concept_capsule_en || deepLearning.concept_capsule)
                      ?.split(/\n+/)
                      .filter(p => p.trim().length > 5)
                      .map((point, i) => (
                        <div key={i} className="flex items-start gap-4">
                          <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.5)]" />
                          <p className="[text-wrap:pretty]">{point.trim()}</p>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6 lg:col-span-5">
                <div className="rounded-[2.5rem] bg-emerald-50 p-7">
                  <h4 className="mb-5 flex items-center gap-2 text-[10px] font-bold tracking-widest text-emerald-600 uppercase">
                    <Zap className="h-3.5 w-3.5 fill-emerald-600" /> Core Questions
                  </h4>
                  <div className="space-y-3">
                    {(isHindi ? deepLearning.practice_prompts : deepLearning.practice_prompts_en || deepLearning.practice_prompts)?.map((prompt, i) => (
                      <div key={i} className="rounded-2xl bg-white/60 p-4 text-[13px] font-bold text-slate-700 leading-relaxed shadow-sm transition-all hover:bg-white">
                        <span className="mr-2 text-emerald-500">Q.</span>
                        {prompt}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Facts Feed - Neural Bento Grid */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-1">
          {facts.map((fact, idx) => {
            const years = Array.from(new Set(fact.enrichedRefs?.map(r => r.year) || fact.pyqRefs?.map(r => r.year) || [])).sort((a, b) => (b ?? 0) - (a ?? 0));
            const cardColors = [
              'bg-[#f0fdfa] border-[#ccfbf1] text-[#0f766e]', // Soft Teal (Replaced Blue)
              'bg-[#fdf2f8] border-[#fce7f3] text-[#be185d]', // Soft Pink
              'bg-[#ecfdf5] border-[#d1fae5] text-[#047857]', // Soft Emerald
              'bg-[#fffbeb] border-[#fef3c7] text-[#b45309]', // Soft Amber
              'bg-[#f5f3ff] border-[#ede9fe] text-[#6d28d9]', // Soft Purple
            ];
            const colorIndex = idx % cardColors.length;
            const bgClass = cardColors[colorIndex].split(' ')[0];
            const borderClass = cardColors[colorIndex].split(' ')[1];
            
            return (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-50px" }}
                key={fact.id}
                className={cn(
                  "group relative overflow-hidden rounded-[2.5rem] px-10 py-12 border transition-all hover:shadow-2xl sm:px-16 sm:py-14 lg:px-20 lg:py-16",
                  bgClass,
                  borderClass
                )}
              >
                <div className="relative z-10 space-y-8">
                  {/* Metadata Hierarchy */}
                  <div className="flex wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="rounded-full bg-white/95 px-4 py-2 text-[9px] font-bold tracking-[0.2em] uppercase shadow-sm">
                        {isHindi ? fact.topicTitle : fact.topicTitleEn || fact.topicTitle}
                      </div>
                      {years.map(y => (
                        <div key={y} className="flex items-center gap-1.5 rounded-full bg-white/70 px-4 py-2 text-[9px] font-bold shadow-sm opacity-90">
                          <Calendar size={10} className="opacity-40" />
                          {y} Exam
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Core Fact Content - Optimized Rhythm */}
                  <div className="space-y-6">
                    <h3 className="text-[10px] font-bold tracking-[0.6em] opacity-25 uppercase text-slate-600">Fact Insight</h3>
                    <p className="text-[20px] leading-[1.65] font-extrabold tracking-[-0.01em] text-slate-800 sm:text-[26px] lg:text-[30px] [text-wrap:pretty]">
                      {isHindi ? fact.factText : fact.factTextEn || fact.factText}
                    </p>
                  </div>

                  {/* Memory & Trap Panels - Rhythmic Balance */}
                  <div className="grid gap-6 pt-4 sm:grid-cols-2">
                    {fact.memoryTip && (
                      <div className="rounded-[2.25rem] bg-white/50 p-7 shadow-sm transition-all hover:bg-white/80">
                        <h5 className="mb-4 flex items-center gap-2 text-[10px] font-black tracking-[0.2em] uppercase opacity-40">
                          <Lightbulb className="h-4 w-4" /> Learning Key
                        </h5>
                        <p className="text-[15px] leading-[1.6] font-semibold text-slate-600 tracking-tight">
                          {isHindi ? fact.memoryTip : fact.memoryTipEn || fact.memoryTip}
                        </p>
                      </div>
                    )}
                    {fact.scamAlert && (
                      <div className="rounded-[2.25rem] bg-rose-50/70 p-7 shadow-sm transition-all hover:bg-rose-50/90">
                        <h5 className="mb-4 flex items-center gap-2 text-[10px] font-black tracking-[0.2em] text-rose-600 uppercase">
                          <ShieldAlert className="h-4 w-4" /> Exam Trap
                        </h5>
                        <p className="text-[15px] leading-[1.6] font-semibold text-rose-900 tracking-tight">
                          {isHindi ? fact.scamAlert : fact.scamAlertEn || fact.scamAlert}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Enhanced Mastered Interaction */}
                  <div className="flex items-center justify-between border-t border-slate-200/50 pt-10">
                     <div className="flex items-center gap-3">
                        <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]" />
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Mastery Focus</span>
                     </div>
                    <button 
                      onClick={() => toggleFactRead(fact.id)}
                      className={cn(
                        "group flex items-center gap-3 rounded-2xl px-8 py-4 text-[12px] font-black tracking-widest uppercase transition-all shadow-md",
                        readFacts.has(fact.id)
                          ? "bg-emerald-500 text-white shadow-emerald-100"
                          : "bg-white text-slate-900 hover:bg-slate-900 hover:text-white"
                      )}
                    >
                      {readFacts.has(fact.id) ? (
                        <>Mastered <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><Check className="h-4 w-4" /></motion.div></>
                      ) : (
                        <>Got it <motion.div animate={{ x: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 2 }}><ChevronRight className="h-4 w-4" /></motion.div></>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

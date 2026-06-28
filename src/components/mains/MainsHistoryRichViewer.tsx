'use client';

import { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MainsMarkdownBody } from '@/components/mains/MainsMarkdownBody';
import { PyqAnswerProse, PyqMarksBandChip } from '@/components/mains/PyqAnswerProse';
import { useMainsReaderProseTheme } from '@/components/mains/useMainsReaderTheme';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { coerceMarkdownBulletsLoose } from '@/lib/mains-readable-coerce';
import { MAINS_HISTORY_RICH_VERSION, pickInterlinkingMarkdown, pickVariantStem, extractModelAnswers } from '@/lib/mains-history-rich-normalize';
import { CheckCircle, BookOpen, Filter, Network, Brain, Palette, AlertTriangle, Sparkles, FileText, ChevronDown, Zap, Compass, Trophy, LineChart, SlidersHorizontal, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { MainsMobileSyllabusDrawer } from '@/components/mains/MainsMobileSyllabusDrawer';
import { MainsKeyTermsFlash } from '@/components/mains/MainsKeyTermsFlash';
import { QuickFeedback } from '@/features/tests/components/QuickFeedback';

function parseBoldInline(text: string) {
  const parts = text.split(/(\*\*.+?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={i} className="font-extrabold text-amber-700 dark:text-amber-400">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part.replace(/\*+/g, '')}</span>;
  });
}

function bulletizeOnComma(raw: string): string {
  if (!raw) return '';
  return raw.split(/,\s*/g).filter(Boolean).join('\n');
}

function bulletizeMemoryHook(raw: string): string {
  if (!raw.trim()) return '';
  if (/^[-*+]\s+/m.test(raw)) return raw;

  const parts = raw.split(/[;|]/g).map(p => p.trim()).filter(Boolean);
  if (parts.length > 1) {
    return parts.map(p => `- ${p}`).join('\n');
  }

  const commaParts = raw.split(/,\s+/g).map(p => p.trim()).filter(Boolean);
  if (commaParts.length > 2 || (commaParts.length > 1 && /^[A-Z0-9\u0900-\u097F]\s*[-–—]/i.test(raw))) {
    return commaParts.map(p => `- ${p}`).join('\n');
  }

  const sentenceParts = raw.split(/(?<=\w[a-z\u0900-\u097F]{2,})\.\s+/g).map(p => p.trim()).filter(Boolean);
  if (sentenceParts.length > 1) {
    return sentenceParts.map(p => `- ${p}`).join('\n');
  }

  return raw;
}

type ModelBand = '2m' | '7m' | '10m' | '11m' | 'case18';

function marksForBand(b: ModelBand): number {
  if (b === '2m') return 2;
  if (b === '7m') return 7;
  if (b === '10m') return 10;
  if (b === '11m') return 11;
  return 18;
}

const BAND_META: Record<
  ModelBand,
  { hi: string; en: string; emoji: string }
> = {
  '2m': { hi: '२ अंक', en: '2 marks', emoji: '⚡' },
  '7m': { hi: '७ अंक', en: '7 marks', emoji: '🎯' },
  '10m': { hi: '१० अंक', en: '10 marks', emoji: '📌' },
  '11m': { hi: '११ अंक', en: '11 marks', emoji: '📌' },
  case18: { hi: 'केस १८', en: 'Case 18', emoji: '⚖️' },
};

function pick(payload: Record<string, unknown>, key: string, hi: boolean): string {
  const s = hi ? '_hi' : '_en';
  const val = String(payload[`${key}${s}`] ?? '').trim();
  if (!hi && !val) {
    return String(payload[`${key}_hi`] ?? '').trim();
  }
  return val;
}

function readDynamicDims(payload: Record<string, unknown>, hi: boolean) {
  const s = hi ? '_hi' : '_en';
  let raw = payload[`dynamic_dimensions${s}`];
  if (!hi && (!Array.isArray(raw) || raw.length === 0)) {
    raw = payload[`dynamic_dimensions_hi`];
  }
  if (!Array.isArray(raw)) return [];
  return raw.filter((x) => x && typeof x === 'object') as Record<string, unknown>[];
}

function models(payload: Record<string, unknown>, lang: 'hi' | 'en') {
  return extractModelAnswers(payload, lang);
}

function MainsSyllabusGraspRenderer({ text, hi }: { text: string; hi: boolean }) {
  const rawLines = text.split(/\n|,\s*-\s*/).map(l => l.trim()).filter(l => Boolean(l) && l !== '-' && l !== '*' && l !== '•');

  const editorialProse = cn(
    "text-[15.5px] sm:text-[17px] leading-[1.85] sm:leading-[1.9] tracking-[0.015em] font-medium text-slate-100",
    hi ? "font-[family-name:var(--font-pyq-dev)]" : "font-[family-name:var(--font-pyq-serif)]"
  );

  return (
    <div className="space-y-4 text-left w-full mt-2">
      {rawLines.map((line, idx) => {
        let clean = line.replace(/^(?:#+|\-|\*+|\•)\s*/, '').replace(/\*+/g, '').trim();
        if (!clean) return null;

        // Find separator (? or :)
        const qIdx = clean.indexOf('?');
        const cIdx = clean.indexOf(':');
        
        let splitIdx = -1;
        if (qIdx !== -1 && qIdx < 55) {
          splitIdx = qIdx;
        } else if (cIdx !== -1 && cIdx < 55) {
          splitIdx = cIdx;
        }

        let prefix = '';
        let rest = clean;

        if (splitIdx !== -1) {
          prefix = clean.substring(0, splitIdx + 1).trim();
          rest = clean.substring(splitIdx + 1).trim();
        } else if (clean.length < 55 || /^\(\d+\)/.test(clean)) {
          // If no separator but short, OR it's a numbered list item, make it a standalone heading (badge)
          prefix = clean;
          rest = '';
        } else {
          prefix = '';
          rest = clean;
        }

        const headingPatterns = [
          'what is this topic',
          'what is it',
          'why is it in the syllabus',
          'why it\'s here',
          'syllabus decoding & exam prediction',
          'syllabus decoding and exam prediction',
          'syllabus decoding',
          'quick lens',
          'यह टॉपिक क्या है',
          'सिलेबस में क्यों है',
          'संक्षिप्त खुलासा',
          'सिलेबस डिकोडिंग (संभावित प्रश्न)',
          'सिलेबस डिकोडिंग'
        ];

        // Check if prefix contains any pattern
        const isHeading = prefix && headingPatterns.some(p => prefix.toLowerCase().includes(p));

        if (isHeading) {
          const headerText = prefix || clean;
          return (
            <div key={idx} className="mt-6 mb-3">
              <h3 className={cn(
                "inline-flex items-center rounded-lg px-4 py-1.5 text-sm sm:text-base uppercase tracking-wider font-extrabold shadow-md shadow-black/40 ring-1 ring-white/10",
                "bg-gradient-to-r from-amber-500/30 to-amber-500/10 text-amber-300 border-b-[3px] border-r border-amber-500/60 font-[family-name:var(--font-pyq-dev)]"
              )}>
                {headerText}
              </h3>
              {rest && (
                <div className="flex items-start gap-2.5 mt-2.5 text-slate-100">
                  <span className="mt-2 size-2 shrink-0 rounded-full bg-amber-500" />
                  <p className={cn(editorialProse, "flex-1 min-w-0")}>
                    {rest}
                  </p>
                </div>
              )}
            </div>
          );
        }

        const cardSkin = [
          'border-amber-500/25 bg-amber-950/15 shadow-sm hover:border-amber-500/40',
          'border-emerald-500/25 bg-emerald-950/15 shadow-sm hover:border-emerald-500/40',
          'border-sky-500/25 bg-sky-950/15 shadow-sm hover:border-sky-500/40',
          'border-purple-500/25 bg-purple-950/15 shadow-sm hover:border-purple-500/40',
        ][idx % 4];

        const badgeSkin = [
          'bg-gradient-to-r from-amber-500/30 to-amber-500/10 text-amber-300 border-b-[3px] border-r border-amber-500/60 shadow-md shadow-black/40 ring-1 ring-white/10',
          'bg-gradient-to-r from-emerald-500/30 to-emerald-500/10 text-emerald-300 border-b-[3px] border-r border-emerald-500/60 shadow-md shadow-black/40 ring-1 ring-white/10',
          'bg-gradient-to-r from-sky-500/30 to-sky-500/10 text-sky-300 border-b-[3px] border-r border-sky-500/60 shadow-md shadow-black/40 ring-1 ring-white/10',
          'bg-gradient-to-r from-purple-500/30 to-purple-500/10 text-purple-300 border-b-[3px] border-r border-purple-500/60 shadow-md shadow-black/40 ring-1 ring-white/10',
        ][idx % 4];

        const dotSkin = [
          'bg-amber-500',
          'bg-emerald-500',
          'bg-sky-500',
          'bg-purple-500',
        ][idx % 4];

        return (
          <div key={idx} className={cn("px-3 py-3.5 sm:px-4 sm:py-4 rounded-xl border transition-all duration-300 overflow-hidden", cardSkin)}>
            {prefix ? (
              <div className="mb-2.5">
                <span className={cn("inline-flex items-center rounded-lg px-3 py-1 text-xs uppercase tracking-wider font-extrabold shadow-sm font-[family-name:var(--font-pyq-dev)]", badgeSkin)}>
                  {prefix}
                </span>
              </div>
            ) : null}
            {rest && (
              <div className="flex items-start gap-2.5">
                {!/^\(\d+\)/.test(rest.trim()) && (
                  <span className={cn("mt-2 inline-block size-2 shrink-0 rounded-full", dotSkin)} />
                )}
                <p className={cn(editorialProse, "flex-1 min-w-0")}>
                  {rest}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function MainsHistoryRichViewer({
  topic,
  payload,
  uiLang,
  standalonePage = false,
}: {
  topic: { id: string; titleHi: string; titleEn: string; unitId: string; paperId?: string; paperNumber?: number };
  payload: Record<string, unknown>;
  uiLang: 'hi' | 'en';
  standalonePage?: boolean;
}) {
  const hi = uiLang === 'hi';
  const proseTheme = useMainsReaderProseTheme();
  const [modelLang, setModelLang] = useState<'hi' | 'en'>(uiLang === 'hi' ? 'hi' : 'en');
  const [topicMetaOpen, setTopicMetaOpen] = useState(false);

  const title = hi ? topic.titleHi : topic.titleEn;

  useEffect(() => {
    setModelLang(uiLang === 'hi' ? 'hi' : 'en');
  }, [uiLang]);

  const pyqMd = useMemo(() => {
    const raw = pick(payload, 'pyq_trend_analysis', hi).trim();
    if (!raw) return '';
    
    // Split by newlines or specific separators like ,- or .- commonly found in the data
    const lines = raw.split(/\n|,\s*-\s*|\.\s*-\s*|;\s*-\s*/).map(l => l.trim()).filter(Boolean);
    
    // Format as bullet points if not already
    const bulleted = lines.map(l => {
      if (/^[-*•]/.test(l)) return l;
      return `- ${l}`;
    }).join('\n');

    const coerced = coerceMarkdownBulletsLoose(bulleted);
    if (!/^#{1,3}\s/m.test(coerced)) {
      return `## ${hi ? 'ट्रेंड · मांग · कोण' : 'Trend · demand · angle'}\n${coerced}`;
    }
    return coerced;
  }, [payload, hi]);

  const syllabusMd = useMemo(() => {
    const graspRaw = pick(payload, 'syllabus_grasp', hi);
    const grasp = graspRaw ? graspRaw.replace(/([^\n])\s+(?=(?:\(\d+\)|\d+\.)\s)/g, '$1\n\n') : '';
    const cognitive = pick(payload, 'cognitive_intro', hi);
    if (!grasp && !cognitive) return '';
    if (grasp && cognitive) {
      return `${coerceMarkdownBulletsLoose(grasp)}\n\n### ${hi ? 'संक्षिप्त खुलासा' : 'Quick lens'}\n${coerceMarkdownBulletsLoose(cognitive)}`;
    }
    if (grasp) return `${coerceMarkdownBulletsLoose(grasp)}`;
    return `${coerceMarkdownBulletsLoose(cognitive)}`;
  }, [payload, hi]);

  const dimensionBlocks = useMemo(() => readDynamicDims(payload, hi), [payload, hi]);
  const ma = useMemo(() => models(payload, modelLang), [payload, modelLang]);

  const ver = String(payload.schema_version ?? '');

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-gradient-to-b from-slate-50 via-white to-amber-50/30 dark:from-slate-950 dark:via-slate-950 dark:to-amber-950/20 overflow-hidden">
      <header className={cn(
        'shrink-0 border-b border-slate-200/80 dark:border-slate-800',
        standalonePage
          ? 'fixed top-14 left-0 right-0 z-40 flex flex-col w-full bg-white/90 backdrop-blur-md shadow-sm dark:bg-slate-950/90'
          : 'bg-white/95 backdrop-blur dark:bg-slate-950/95'
      )}>
        <div className={cn('flex items-center justify-between gap-2 px-3 py-2 sm:px-4 w-full min-h-14', standalonePage ? 'px-3' : '')}>
          <div className="flex items-center gap-2 min-w-0 pr-1">
            {topic.paperId && (
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl shrink-0" asChild>
                <Link href={`/mains/syllabus/${topic.paperId}`}>
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
            )}
            <button
              type="button"
              onClick={() => setTopicMetaOpen((x) => !x)}
              className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 shadow-sm transition-colors',
                topicMetaOpen
                  ? 'border-amber-500 bg-amber-500 text-white dark:bg-amber-600 dark:border-amber-600'
                  : 'border-amber-200 bg-amber-50 text-amber-800 hover:border-amber-300 hover:bg-amber-100 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:border-amber-500/50'
              )}
              aria-expanded={topicMetaOpen}
              aria-label={hi ? 'शीर्षक व विवरण' : 'Title & overview'}
            >
              <SlidersHorizontal className="h-4 w-4" aria-hidden />
            </button>
            <div className="min-w-0 pr-1">
              {topic.paperNumber && (
                <p className="truncate text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 leading-tight">
                  🎯 Paper {topic.paperNumber}
                </p>
              )}
              <h1 className="truncate text-xs font-bold leading-tight text-slate-900 dark:text-slate-100 sm:text-sm">
                {title}
              </h1>
            </div>
          </div>
          <div className="flex items-center shrink-0 gap-2">
            {topic.paperNumber && (
              <MainsMobileSyllabusDrawer paperNumber={topic.paperNumber} language="hi" />
            )}
          </div>
        </div>
        <AnimatePresence initial={false}>
          {topicMetaOpen ? (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="overflow-hidden border-t border-slate-100 dark:border-slate-800"
            >
              <div className="space-y-2 px-3 py-3 sm:px-4">
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-amber-600 font-black text-white">📜 Mains · Expert</Badge>
                  {/* {ver === MAINS_HISTORY_RICH_VERSION ? (
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {ver}
                    </Badge>
                  ) : null} */}
                </div>
                <p className="text-balance text-lg font-black leading-snug text-slate-900 dark:text-white sm:text-xl">
                  {title}
                </p>
                {/* <p className="max-w-2xl text-[13px] leading-relaxed text-slate-600 dark:text-slate-400">
                  {hi
                    ? 'शुरू से सिलेबस समझ, फिर ट्रेंड, फिर नीचे मॉडल उत्तर।  मॉडल लाइट पृष्ठभूमि पर पढ़ने के लिए। प्रश्न जब JSON में stem हो।'
                    : 'Flow: syllabus grasp, then trends, then model answers below. Models stay on a light sheet for readability. Question stems when JSON includes stem.'}
                </p> */}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </header>

      <div className={cn("custom-scrollbar flex-1 overflow-y-auto px-2 sm:px-8 sm:pb-8", standalonePage ? "pt-20 pb-12 sm:pt-20" : "py-4 sm:py-8")}>
        <div className="mx-auto max-w-4xl space-y-10 pb-36">
          {/* Syllabus grasp first */}
          {syllabusMd ? (
            <details
              open
              className="group rounded-2xl border-2 border-amber-400/80 bg-slate-900 p-3 sm:p-4 shadow-xl ring-2 ring-amber-400/20 transition-all dark:border-amber-500/50 dark:bg-[#0b1329] hover:border-amber-400 hover:ring-amber-400/40"
            >
              <summary className="mb-4 flex cursor-pointer select-none items-center justify-between border-b border-amber-400/30 pb-3 outline-none marker:content-none">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-black tracking-tight text-amber-300 dark:text-amber-400 sm:text-2xl">
                    📘 {hi ? 'सिलेबस डिकोडिंग व रणनीति' : 'Syllabus Decoding & Strategy'}
                    <span className="ml-2 hidden text-sm font-semibold tracking-wide text-amber-400/80 sm:inline-block">
                      — {hi ? 'यह टॉपिक क्या-क्या कहता है' : 'what this topic is asking'}
                    </span>
                  </h2>
                </div>
                <ChevronDown className="h-6 w-6 shrink-0 text-amber-400 transition-transform group-open:rotate-180" />
              </summary>
              <motion.div layout className="text-slate-100">
                <MainsSyllabusGraspRenderer text={syllabusMd} hi={hi} />
              </motion.div>
            </details>
          ) : null}

          {/* Model answers */}
          <details
            className="group rounded-2xl border-2 border-emerald-200/80 bg-emerald-50/40 pt-3 pb-0 px-0 sm:pt-4 sm:pb-0 sm:px-0 shadow-sm dark:border-emerald-500/20 dark:bg-[#0c1c14] transition-all hover:border-emerald-400/50 overflow-hidden"
            aria-label={hi ? 'मॉडल उत्तर' : 'Model answers'}
          >
            <summary className="mb-3 flex cursor-pointer select-none items-center justify-between outline-none marker:content-none pb-3 border-b border-emerald-200/50 dark:border-emerald-500/20 px-3 sm:px-4">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-black tracking-tight text-emerald-950 dark:text-emerald-100">
                  ✍️ {hi ? 'मॉडल उत्तर अभ्यास' : 'Model Answer Suite'}
                </h2>
                <div className="flex gap-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-1 shadow-inner ml-4">
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setModelLang('hi'); }}
                    className={cn(
                      'rounded-lg px-3 py-1.5 text-xs font-black sm:px-4 sm:text-sm transition-colors',
                      modelLang === 'hi'
                        ? 'bg-emerald-600 text-white shadow'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                    )}
                  >
                    हिंदी
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setModelLang('en'); }}
                    className={cn(
                      'rounded-lg px-3 py-1.5 text-xs font-black sm:px-4 sm:text-sm transition-colors',
                      modelLang === 'en'
                        ? 'bg-emerald-600 text-white shadow'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                    )}
                  >
                    English
                  </button>
                </div>
              </div>
              <ChevronDown className="h-6 w-6 shrink-0 transition-transform group-open:rotate-180 text-emerald-400" />
            </summary>

            <AnimatePresence mode="wait">
              <motion.div
                key={modelLang}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3 mt-1.5 px-2 pb-3 sm:px-3 sm:pb-4 min-w-0 overflow-hidden break-words"
              >
                {(() => {
                  const allVariants: Array<{ variant: typeof ma[ModelBand][number]; band: ModelBand }> = [];
                  (['2m', '7m', '10m', '11m', 'case18'] as ModelBand[]).forEach((band) => {
                    const variants = ma[band] || [];
                    variants.forEach((v) => {
                      allVariants.push({ variant: v, band });
                    });
                  });

                  if (allVariants.length === 0) {
                    return (
                      <div className="py-8 text-center rounded-2xl border border-dashed border-slate-200 bg-white/50 p-6 shadow-xs dark:border-slate-800 dark:bg-slate-950/40">
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-amber-800 shadow-sm dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
                          🚀 {modelLang === 'hi' ? 'जल्द आ रहा है (Coming Soon)' : 'Coming Soon'}
                        </span>
                        <p className="mt-2 text-sm font-bold leading-relaxed text-slate-600 dark:text-slate-400">
                          {modelLang === 'hi'
                            ? 'एक्सपर्ट कंटेंट व मॉडल उत्तर तैयार किए जा रहे हैं। जल्द ही उपलब्ध होंगे।'
                            : 'Expert content & model answers are currently under preparation.'}
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="grid gap-3 min-w-0 overflow-hidden">
                      {allVariants.map(({ variant: v, band }, idx) => (
                        <article
                          key={idx}
                          className={cn(
                            "rounded-lg sm:rounded-xl border p-2 sm:p-2.5 shadow-sm ring-1 ring-black/[0.03] min-w-0 overflow-hidden break-words",
                            [
                              'border-pink-200/80 bg-pink-50/60 text-slate-900 dark:border-pink-500/20 dark:bg-pink-950/15 dark:text-slate-100',
                              'border-emerald-200/80 bg-emerald-50/60 text-slate-900 dark:border-emerald-500/20 dark:bg-emerald-950/15 dark:text-slate-100',
                              'border-amber-200/80 bg-amber-50/60 text-slate-900 dark:border-emerald-500/20 dark:bg-amber-950/15 dark:text-slate-100',
                              'border-sky-200/80 bg-sky-50/60 text-slate-900 dark:border-emerald-500/20 dark:bg-sky-950/15 dark:text-slate-100',
                            ][idx % 4]
                          )}
                        >
                          <div className="flex flex-wrap items-center gap-1.5 mb-2">
                            <div className={cn(
                              'inline-flex items-center gap-1 rounded-lg border-b-[3px] border-r border-black/15 dark:border-white/20 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider shadow-md shadow-black/10 dark:shadow-black/40 ring-1 ring-white/60 dark:ring-white/10',
                              [
                                'bg-gradient-to-r from-pink-100 to-pink-50 text-pink-950 dark:from-pink-950/80 dark:to-pink-950/40 dark:text-pink-200',
                                'bg-gradient-to-r from-emerald-100 to-emerald-50 text-emerald-950 dark:from-emerald-950/80 dark:to-emerald-950/40 dark:text-emerald-200',
                                'bg-gradient-to-r from-amber-100 to-amber-50 text-amber-950 dark:from-amber-950/80 dark:to-amber-950/40 dark:text-amber-200',
                                'bg-gradient-to-r from-sky-100 to-sky-50 text-sky-950 dark:from-sky-950/80 dark:to-sky-950/40 dark:text-sky-200',
                              ][idx % 4]
                            )}>
                              {modelLang === 'hi' ? `विकल्प ${idx + 1}` : `Variant ${idx + 1}`}
                            </div>
                            <PyqMarksBandChip marks={marksForBand(band)} lang={modelLang} theme="paper" />
                          </div>
                          {v.stem ? (
                            <div className="mb-2.5 rounded-md border border-slate-200 bg-slate-50/85 px-2.5 py-1.5 text-slate-900 dark:border-slate-800/60 dark:bg-slate-900/40 dark:text-slate-100">
                              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                                {modelLang === 'hi' ? '❓ प्रश्न' : '❓ Question'}
                              </p>
                              <p className={cn(
                                'mt-1 text-[14px] font-semibold leading-relaxed sm:text-[15px]',
                                modelLang === 'hi' ? 'font-[family-name:var(--font-pyq-dev)]' : 'font-[family-name:var(--font-pyq-serif)]'
                              )}>
                                {v.stem}
                              </p>
                            </div>
                          ) : null}
                          <PyqAnswerProse
                            text={coerceMarkdownBulletsLoose(v.text)}
                            lang={modelLang === 'hi' ? 'hi' : 'en'}
                            theme="paper"
                            sectionTint={(idx % 2) as 0 | 1}
                            marks={marksForBand(band)}
                            density="compact"
                            paletteRotationStart={idx % 4}
                            mainsBoxLayout={true}
                            prominentHeadings={marksForBand(band) >= 7}
                            readerAccent
                          />
                        </article>
                      ))}
                    </div>
                  );
                })()}
              </motion.div>
            </AnimatePresence>
          </details>

          {/* PYQ / examiner demand */}
          <details className="group rounded-2xl border-2 border-pink-200/80 bg-pink-50/40 p-3 sm:p-4 shadow-sm dark:border-pink-500/20 dark:bg-[#1a0e1c] transition-all hover:border-pink-400/60 overflow-hidden">
            <summary className="mb-3 flex cursor-pointer select-none items-center justify-between outline-none marker:content-none pb-3 border-b border-pink-200/50 dark:border-pink-500/20">
              <h2 className="text-lg font-black sm:text-xl text-pink-900 dark:text-pink-200">📈 {hi ? 'PYQ ट्रेंड व मांग डिकोडर' : 'PYQ Trend & Demand Decoder'}</h2>
              <ChevronDown className="h-5 w-5 shrink-0 text-pink-400 transition-transform group-open:rotate-180" />
            </summary>
            {pyqMd ? (
              <div className="text-slate-800 dark:text-slate-100">
                <MainsMarkdownBody
                  markdown={pyqMd}
                  isHindi={hi}
                  flashLineBullets={true}
                  itemClassName="border-pink-200 bg-white/70 dark:border-pink-900/40 dark:bg-pink-950/20"
                  bulletClassName="bg-pink-500 shadow-[0_0_12px_rgba(236,72,153,0.4)] ring-pink-500/15"
                />
              </div>
            ) : (
              <p className="text-base text-pink-800/90 dark:text-pink-200/90">{hi ? '(खाली)' : '(empty)'}</p>
            )}
          </details>

          {/* Analogy + Source */}
          <details className="group rounded-2xl border-2 border-sky-200/80 bg-sky-50/40 pt-3 pb-0 px-0 sm:pt-4 sm:pb-0 sm:px-0 shadow-sm dark:border-sky-500/20 dark:bg-[#0c1626] transition-all hover:border-sky-400/60 overflow-hidden">
            <summary className="mb-3 flex cursor-pointer select-none items-center justify-between outline-none marker:content-none pb-3 border-b border-sky-200/50 dark:border-sky-500/20 px-3 sm:px-4">
              <h2 className="text-lg font-black sm:text-xl text-sky-900 dark:text-sky-200">🔍 {hi ? 'व्यावहारिक उदाहरण एवं प्रामाणिक संदर्भ' : 'Conceptual Analogies & Scholarly Sources'}</h2>
              <ChevronDown className="h-6 w-6 shrink-0 text-sky-400 transition-transform group-open:rotate-180" />
            </summary>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 px-2 pb-3 sm:px-3 sm:pb-4">
              <div className="rounded-lg sm:rounded-xl border border-sky-200 bg-sky-50/70 p-2 sm:p-2.5 dark:border-sky-900/50 dark:bg-sky-950/30">
                <p className="mb-2 text-xs font-black uppercase tracking-widest text-sky-900 dark:text-sky-300">
                  🏪 {hi ? 'व्यावहारिक सादृश्य एवं वास्तविक उदाहरण' : 'Real-World Analogy & Practical Context'}
                </p>
                <MainsMarkdownBody
                  markdown={coerceMarkdownBulletsLoose(pick(payload, 'desi_analogy', hi))}
                  isHindi={hi}
                  itemClassName="border-sky-200 bg-white/70 dark:border-sky-900/40 dark:bg-sky-950/20"
                  bulletClassName="bg-sky-500 shadow-[0_0_12px_rgba(14,165,233,0.4)] ring-sky-500/15"
                />
              </div>
              <div className="rounded-lg sm:rounded-xl border border-amber-300 bg-amber-50 p-2 sm:p-2.5 dark:border-amber-800 dark:bg-amber-950/40">
                <p className="mb-2 text-xs font-black uppercase tracking-widest text-amber-950 dark:text-amber-200">
                  📜 {hi ? 'प्रामाणिक संदर्भ एवं स्थापित स्रोत' : 'Scholarly Sources & Academic Citations'}
                </p>
                <MainsMarkdownBody
                  markdown={coerceMarkdownBulletsLoose(pick(payload, 'authentic_source_citation', hi))}
                  isHindi={hi}
                  itemClassName="border-amber-200 bg-white/70 dark:border-amber-900/40 dark:bg-amber-950/20"
                  bulletClassName="bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.4)] ring-amber-500/15"
                />
              </div>
            </div>
          </details>

          {/* Dynamic dimensions */}
          <details className="group rounded-2xl border-2 border-amber-200/80 bg-amber-50/40 p-3 sm:p-4 shadow-sm dark:border-amber-500/20 dark:bg-[#1f1710] transition-all hover:border-amber-400/60">
            <summary className="mb-3 flex cursor-pointer select-none items-center justify-between outline-none marker:content-none pb-3 border-b border-amber-200/50 dark:border-amber-500/20">
              <h2 className="text-lg font-black sm:text-xl text-amber-950 dark:text-amber-200">🧭 {hi ? '360° डायनैमिक आयाम' : '360° Dynamic Dimensions'}</h2>
              <ChevronDown className="h-6 w-6 shrink-0 text-amber-400 transition-transform group-open:rotate-180" />
            </summary>
            <div className="grid grid-cols-1 gap-3">
              {dimensionBlocks.length === 0 ? (
                <p className="text-sm text-slate-500">{hi ? 'कोई आयाम नहीं' : 'No dimensions'}</p>
              ) : (
                dimensionBlocks.map((d, idx) => {
                  const name = String(d.dimension_name ?? '').trim();
                  const bullets = Array.isArray(d.bullets) ? d.bullets.filter((b): b is string => typeof b === 'string') : [];
                  return (
                    <div
                      key={idx}
                      className="overflow-hidden rounded-xl sm:rounded-2xl border-2 border-amber-200/60 bg-white/60 shadow-sm dark:border-amber-900/40 dark:bg-[#1a120a]"
                    >
                      <div className={cn(
                        "px-3.5 py-2.5 text-base font-black rounded-r-xl shadow-md shadow-black/5 ring-1 ring-white/60 dark:ring-white/10 border-b-[3px] border-r border-black/10 dark:border-black/50",
                        [
                          'border-l-[5px] border-amber-500 bg-gradient-to-r from-amber-100/80 via-amber-50/40 to-amber-100/60 text-amber-950 dark:border-amber-400 dark:from-[#251a0e] dark:via-[#1a120a] dark:to-[#251a0e] dark:text-amber-100',
                          'border-l-[5px] border-emerald-500 bg-gradient-to-r from-emerald-100/80 via-emerald-50/40 to-emerald-100/60 text-emerald-950 dark:border-emerald-400 dark:from-[#0c1c14] dark:via-[#08130e] dark:to-[#0c1c14] dark:text-emerald-100',
                          'border-l-[5px] border-sky-500 bg-gradient-to-r from-sky-100/80 via-sky-50/40 to-sky-100/60 text-sky-950 dark:border-sky-400 dark:from-[#0c1626] dark:via-[#080e1a] dark:to-[#0c1626] dark:text-sky-100',
                          'border-l-[5px] border-pink-500 bg-gradient-to-r from-pink-100/80 via-pink-50/40 to-pink-100/60 text-pink-950 dark:border-pink-400 dark:from-[#1a0e1c] dark:via-[#110913] dark:to-[#1a0e1c] dark:text-pink-100',
                        ][idx % 4]
                      )}>
                        {name}
                      </div>
                      <ul className="space-y-3 p-2.5 sm:p-3">
                        {bullets.map((b, i) => {
                          const colonIdx = b.indexOf(':');
                          let prefix = '';
                          let rest = b;
                          if (colonIdx !== -1 && colonIdx < 55) {
                            prefix = b.substring(0, colonIdx).trim().replace(/\*+/g, '');
                            rest = b.substring(colonIdx + 1).trim();
                          }
                          const badgeSkin = [
                            'bg-gradient-to-r from-amber-500/30 to-amber-500/10 text-amber-950 dark:text-amber-300 border-b-[3px] border-r border-amber-500/60 shadow-md shadow-black/10 dark:shadow-black/40 ring-1 ring-white/60 dark:ring-white/10',
                            'bg-gradient-to-r from-emerald-500/30 to-emerald-500/10 text-emerald-950 dark:text-emerald-300 border-b-[3px] border-r border-emerald-500/60 shadow-md shadow-black/10 dark:shadow-black/40 ring-1 ring-white/60 dark:ring-white/10',
                            'bg-gradient-to-r from-sky-500/30 to-sky-500/10 text-sky-950 dark:text-sky-300 border-b-[3px] border-r border-sky-500/60 shadow-md shadow-black/10 dark:shadow-black/40 ring-1 ring-white/60 dark:ring-white/10',
                            'bg-gradient-to-r from-purple-500/30 to-purple-500/10 text-purple-950 dark:text-purple-300 border-b-[3px] border-r border-purple-500/60 shadow-md shadow-black/10 dark:shadow-black/40 ring-1 ring-white/60 dark:ring-white/10',
                          ][i % 4];

                          return (
                            <li
                              key={i}
                              className="rounded-xl border border-amber-200/60 bg-white/80 p-3 shadow-sm dark:border-amber-900/30 dark:bg-amber-950/20 space-y-2 overflow-hidden transition-all hover:border-amber-400"
                            >
                              {prefix ? (
                                <div>
                                  <span className={cn("inline-flex items-center rounded-lg px-3 py-1 text-xs uppercase tracking-wider font-extrabold shadow-sm font-[family-name:var(--font-pyq-dev)]", badgeSkin)}>
                                    {prefix}
                                  </span>
                                </div>
                              ) : null}
                              <div className="flex items-start gap-2.5 text-[15px] sm:text-[16.5px] leading-relaxed text-slate-800 dark:text-slate-100">
                                <span className="mt-2 size-2 shrink-0 rounded-full bg-amber-500 ring-4 ring-amber-500/15" />
                                <span className={hi ? 'font-[family-name:var(--font-pyq-dev)]' : 'font-[family-name:var(--font-pyq-serif)]'}>
                                  {parseBoldInline(rest)}
                                </span>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })
              )}
            </div>
          </details>

          {/* Interlinking + hooks */}
          <details className="group rounded-2xl border-2 border-emerald-200/80 bg-emerald-50/40 pt-3 pb-0 px-0 sm:pt-4 sm:pb-0 sm:px-0 shadow-sm dark:border-emerald-500/20 dark:bg-[#0c1c14] transition-all hover:border-emerald-400/60 overflow-hidden">
            <summary className="mb-3 flex cursor-pointer select-none items-center justify-between outline-none marker:content-none pb-3 border-b border-emerald-200/50 dark:border-emerald-500/20 px-3 sm:px-4">
              <h2 className="text-lg font-black sm:text-xl text-emerald-950 dark:text-emerald-200">🔗 {hi ? 'अंतर-विषय जुड़ाव व मेमोरी हुक्स' : 'Inter-Paper Linkages & Memory Hooks'}</h2>
              <ChevronDown className="h-6 w-6 shrink-0 text-emerald-400 transition-transform group-open:rotate-180" />
            </summary>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 px-2 pb-3 sm:px-3 sm:pb-4">
              <div className="rounded-lg sm:rounded-xl border border-indigo-200 bg-indigo-50/80 p-2 sm:p-2.5 dark:border-indigo-900/50 dark:bg-indigo-950/30">
                <h3 className="mb-3 flex items-center gap-2 text-base font-black text-indigo-950 dark:text-indigo-100 border-l-[5px] border-indigo-500 bg-gradient-to-r from-indigo-100/70 via-indigo-50/30 to-indigo-100/50 dark:from-indigo-950/60 dark:via-indigo-950/30 dark:to-indigo-950/50 px-3.5 py-2.5 rounded-r-xl shadow-md shadow-black/5 ring-1 ring-white/60 dark:ring-white/10 border-b-[3px] border-r border-black/10 dark:border-black/50">
                  <Network className="h-4 w-4 shrink-0" /> {hi ? '🔗 अंतर-पेपर जुड़ाव' : '🔗 Interlinking'}
                </h3>
                <MainsMarkdownBody
                  markdown={coerceMarkdownBulletsLoose(pickInterlinkingMarkdown(payload, hi ? 'hi' : 'en'))}
                  isHindi={hi}
                  itemClassName="border-indigo-100 bg-white/70 dark:border-indigo-900/40 dark:bg-indigo-950/20"
                  bulletClassName="bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.4)] ring-indigo-500/15"
                />
              </div>
              <div className="rounded-lg sm:rounded-xl border border-fuchsia-200 bg-fuchsia-50/70 p-2 sm:p-2.5 dark:border-fuchsia-900/50 dark:bg-fuchsia-950/25">
                <h3 className="mb-3 flex items-center gap-2 text-base font-black text-fuchsia-950 dark:text-fuchsia-100 border-l-[5px] border-fuchsia-500 bg-gradient-to-r from-fuchsia-100/70 via-fuchsia-50/30 to-fuchsia-100/50 dark:from-fuchsia-950/60 dark:via-fuchsia-950/30 dark:to-fuchsia-950/50 px-3.5 py-2.5 rounded-r-xl shadow-md shadow-black/5 ring-1 ring-white/60 dark:ring-white/10 border-b-[3px] border-r border-black/10 dark:border-black/50">
                  <Brain className="h-4 w-4 shrink-0" /> {hi ? '🧠 मेमोरी हुक' : '🧠 Memory hook'}
                </h3>
                <MainsMarkdownBody
                  markdown={coerceMarkdownBulletsLoose(bulletizeMemoryHook(pick(payload, 'psychological_memory_hook', hi)))}
                  isHindi={hi}
                  itemClassName="border-fuchsia-100 bg-white/70 dark:border-fuchsia-900/40 dark:bg-fuchsia-950/20"
                  bulletClassName="bg-fuchsia-500 shadow-[0_0_12px_rgba(217,70,239,0.4)] ring-fuchsia-500/15"
                />
              </div>
              <div className="rounded-lg sm:rounded-xl border border-cyan-200 bg-cyan-50/70 p-2 sm:p-2.5 dark:border-cyan-900/50 dark:bg-cyan-950/25">
                <h3 className="mb-3 flex items-center gap-2 text-base font-black text-cyan-950 dark:text-cyan-100 border-l-[5px] border-cyan-500 bg-gradient-to-r from-cyan-100/70 via-cyan-50/30 to-cyan-100/50 dark:from-cyan-950/60 dark:via-cyan-950/30 dark:to-cyan-950/50 px-3.5 py-2.5 rounded-r-xl shadow-md shadow-black/5 ring-1 ring-white/60 dark:ring-white/10 border-b-[3px] border-r border-black/10 dark:border-black/50">
                  <Palette className="h-4 w-4 shrink-0" /> {hi ? '📐 डायग्राम / नक्शा' : '📐 Diagram / map cue'}
                </h3>
                <MainsMarkdownBody
                  markdown={coerceMarkdownBulletsLoose(pick(payload, 'visual_infographic_cue', hi))}
                  isHindi={hi}
                  itemClassName="border-cyan-100 bg-white/70 dark:border-cyan-900/40 dark:bg-cyan-950/20"
                  bulletClassName="bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.4)] ring-cyan-500/15"
                />
              </div>
              <div className="rounded-lg sm:rounded-xl border border-red-200 bg-red-50/80 p-2 sm:p-2.5 dark:border-red-900/50 dark:bg-red-950/30">
                <h3 className="mb-3 flex items-center gap-2 text-base font-black text-red-900 dark:text-red-100 border-l-[5px] border-red-500 bg-gradient-to-r from-red-100/70 via-red-50/30 to-red-100/50 dark:from-red-950/60 dark:via-red-950/30 dark:to-red-950/50 px-3.5 py-2.5 rounded-r-xl shadow-md shadow-black/5 ring-1 ring-white/60 dark:ring-white/10 border-b-[3px] border-r border-black/10 dark:border-black/50">
                  <AlertTriangle className="h-4 w-4 shrink-0" /> {hi ? '⚠️ एग्जामिनर ट्रैप' : '⚠️ Examiner trap'}
                </h3>
                <MainsMarkdownBody
                  markdown={coerceMarkdownBulletsLoose(pick(payload, 'examiner_trap', hi))}
                  isHindi={hi}
                  itemClassName="border-red-100 bg-white/70 dark:border-red-900/40 dark:bg-red-950/20"
                  bulletClassName="bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.4)] ring-red-500/15"
                />
              </div>
            </div>
          </details>

          {/* Topper X-Factor Strategy */}
          <details className="group rounded-2xl border-2 border-pink-200/80 bg-pink-50/40 p-3 sm:p-4 transition-all dark:border-pink-500/20 dark:bg-[#1a0e1c] hover:border-pink-400/60">
            <summary className="mb-3 flex cursor-pointer select-none items-center justify-between outline-none marker:content-none pb-3 border-b border-pink-200/50 dark:border-pink-500/20">
              <h2 className="text-lg font-black sm:text-xl text-pink-900 dark:text-pink-100">🏆 {hi ? 'टॉपर एक्स-फैक्टर रणनीति' : 'Topper X-Factor Strategy'}</h2>
              <ChevronDown className="h-5 w-5 shrink-0 text-pink-400 transition-transform group-open:rotate-180" />
            </summary>
            <MainsMarkdownBody
              markdown={coerceMarkdownBulletsLoose(bulletizeOnComma(pick(payload, 'topper_x_factor', hi)))}
              isHindi={hi}
              itemClassName="border-pink-200 bg-white/70 dark:border-pink-900/40 dark:bg-[#251a0e]"
              bulletClassName="bg-pink-500 shadow-[0_0_12px_rgba(236,72,153,0.4)] ring-pink-500/15"
            />
          </details>

          {/* Key terms */}
          <details className="group rounded-2xl border-2 border-sky-200/80 bg-sky-50/40 p-3 sm:p-4 transition-all dark:border-sky-500/20 dark:bg-[#0c1626] shadow-sm hover:border-sky-400/60">
            <summary className="mb-3 flex cursor-pointer select-none items-center justify-between outline-none marker:content-none pb-3 border-b border-sky-200/50 dark:border-sky-500/20 px-3 sm:px-4">
              <h2 className="text-xl font-black text-sky-950 dark:text-sky-200">{hi ? 'की-टर्म्स डिकोडर (Flash)' : 'Key Terms Decoder (Flash)'}</h2>
              <ChevronDown className="h-5 w-5 shrink-0 text-sky-400 transition-transform group-open:rotate-180" />
            </summary>
            <MainsKeyTermsFlash
              structured={
                hi 
                  ? payload.key_terms_cards_hi 
                  : (payload.key_terms_cards_en || payload.key_terms_cards_hi)
              }
              fallbackText={pick(payload, 'key_terms', hi)}
              isHindi={hi}
            />
          </details>

          <div className="mx-auto max-w-4xl px-4 py-16 text-center border-t border-slate-200/50 dark:border-slate-800/50 mt-12">
            <div className="mb-8 space-y-3">
              <p className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-[0.2em]">
                {hi ? 'आपका फीडबैक' : 'Your Feedback'}
              </p>
              <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 sm:text-2xl">
                {hi ? 'यह कंटेंट आपके लिए कितना मददगार रहा?' : 'How helpful was this content for you?'}
              </h3>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {hi ? 'आपके सुझाव हमें बेहतर बनाने में मदद करेंगे।' : 'Your feedback will help us improve our expert content.'}
              </p>
            </div>
            <QuickFeedback 
              questionId={topic.id}
              questionText={hi ? topic.titleHi : topic.titleEn}
              source="mains_syllabus_topic"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

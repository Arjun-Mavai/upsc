'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Target, FileText, Sparkles, Lightbulb, CheckCircle, Filter, SlidersHorizontal, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { MainsMobileSyllabusDrawer } from '@/components/mains/MainsMobileSyllabusDrawer';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MainsMarkdownBody } from '@/components/mains/MainsMarkdownBody';
import { PyqAnswerProse } from '@/components/mains/PyqAnswerProse';
import { MainsKeyTermsFlash } from '@/components/mains/MainsKeyTermsFlash';
import { useMainsReaderProseTheme } from '@/components/mains/useMainsReaderTheme';
import { coerceMarkdownBulletsLoose } from '@/lib/mains-readable-coerce';
import { QuickFeedback } from '@/features/tests/components/QuickFeedback';

/**
 * Mains topic content — readable “coaching module” layout (markdown in DB).
 */

interface ContentProps {
  topic: {
    id: string;
    titleHi: string;
    titleEn: string;
    unitId: string;
    paperId?: string;
    paperNumber?: number;
  };
  content: {
    conceptHi: string;
    conceptEn: string;
    expertStrategyHi: string;
    expertStrategyEn: string;
    modelAnswers: Record<string, { text: string; stem?: string | null }[]>;
    keyTermsHi?: string | null;
    keyTermsEn?: string | null;
  };
  language: 'hi' | 'en';
  onMarkDone: () => void;
  isDone: boolean;
  standalonePage?: boolean;
}

function marksForBand(mark: '10m' | '15m' | '20m' | 'case18'): number {
  if (mark === '10m') return 10;
  if (mark === '15m') return 15;
  if (mark === '20m') return 20;
  return 18;
}

export function MainsContentViewer({ topic, content, language, onMarkDone, isDone, standalonePage = false }: ContentProps) {
  const [activeTab, setActiveTab] = useState<'concept' | 'marking' | 'models' | 'tips'>('concept');
  const [topicMetaOpen, setTopicMetaOpen] = useState(false);
  const hi = language === 'hi';
  const proseTheme = useMainsReaderProseTheme();
  const title = hi ? topic.titleHi : topic.titleEn;

  const tabs = [
    { id: 'concept' as const, label: hi ? '📖 अवधारणा' : '📖 Concept', icon: BookOpen },
    { id: 'marking' as const, label: hi ? '🎯 लेखन रणनीति' : '🎯 Strategy', icon: Target },
    { id: 'models' as const, label: hi ? '📝 मॉडल उत्तर' : '📝 Models', icon: FileText },
    { id: 'tips' as const, label: hi ? '✨ तेज़ रिवीज़न' : '✨ Quick recap', icon: Sparkles },
  ];

  const markMeta: Record<string, { badge: string; emoji: string; hi: string; en: string }> = {
    '10m': { badge: '10M', emoji: '📌', hi: '१० अंक · दीर्घ उत्तर', en: '10 marks · long answer' },
    '15m': { badge: '15M', emoji: '🔥', hi: '१५ अंक · विस्तृत उत्तर', en: '15 marks · detailed answer' },
    '20m': { badge: '20M', emoji: '💎', hi: '२० अंक · गहन विश्लेषण', en: '20 marks · deep analysis' },
    case18: { badge: '18M', emoji: '⚖️', hi: 'केस स्टडी', en: 'Case study' },
  };

  const conceptBlock = hi ? content.conceptHi : content.conceptEn;
  const strategyBlock = hi ? content.expertStrategyHi : content.expertStrategyEn;
  const termsBlock = hi ? content.keyTermsHi : content.keyTermsEn;

  const renderModelAnswers = () => {
    const answers = content.modelAnswers;
    return (
      <div className="space-y-10">
        {(['10m', '15m', '20m', 'case18'] as const).map((mark) => {
          const variants = answers[mark] || [];
          if (variants.length === 0) return null;
          const meta = markMeta[mark];

          return (
            <section key={mark} className="space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-2xl">{meta.emoji}</span>
                <Badge className="rounded-lg bg-emerald-600 px-3 py-1 text-sm font-black tracking-widest text-white shadow-sm">
                  {meta.badge}
                </Badge>
                <h4 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  {hi ? meta.hi : meta.en}
                </h4>
              </div>

              {variants.some((vv) => !(vv.stem && String(vv.stem).trim())) ? (
                <p className="rounded-lg border border-dashed border-amber-300/70 bg-amber-50/60 px-3 py-2 text-[11px] text-amber-900/90 dark:border-amber-800/55 dark:bg-amber-950/25 dark:text-amber-100/85">
                  {hi
                    ? 'कुछ विकल्पों में प्रश्न (stem) नहीं — आगामी JSON एक्सपोर्ट में जोड़ें।'
                    : 'Some rows lack question `stem` — add it when you re-export from AI JSON.'}
                </p>
              ) : null}

              <div className="grid grid-cols-1 gap-6">
                {variants.map((v: { text: string; stem?: string | null }, i: number) => (
                  <article
                    key={i}
                    className={cn(
                      'rounded-xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-950'
                    )}
                  >
                    <div className="border-b border-slate-200 bg-transparent px-5 py-3 dark:border-slate-700">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400">
                        {hi ? `उत्तर विकल्प ${i + 1}` : `Answer variant ${i + 1}`}{' '}
                        <span className="font-semibold normal-case tracking-normal text-slate-500 dark:text-slate-500">
                          — {hi ? 'परीक्षा-टोन' : 'exam-ready tone'}
                        </span>
                      </p>
                    </div>
                    <div className="px-4 py-4 sm:px-6 sm:py-5">
                      {v.stem && String(v.stem).trim() ? (
                        <div
                          className={cn(
                            'mb-4 rounded-lg border border-slate-300 bg-white px-4 py-3 dark:border-slate-600 dark:bg-slate-950'
                          )}
                        >
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 dark:text-slate-400">
                            {hi ? '❓ प्रश्न' : '❓ Question'}
                          </p>
                          <p
                            className={cn(
                              'mt-2 text-[15px] font-semibold leading-relaxed text-slate-900 sm:text-[16px] dark:text-slate-100',
                              hi ? 'font-[family-name:var(--font-pyq-dev)]' : 'font-[family-name:var(--font-pyq-serif)]'
                            )}
                          >
                            {String(v.stem).trim()}
                          </p>
                        </div>
                      ) : null}
                      <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                        {hi
                          ? 'पॉइंट-लाइन्स · साफ पठन'
                          : 'Point-lines · readable layout'}
                      </p>
                      <PyqAnswerProse
                        text={coerceMarkdownBulletsLoose(v.text)}
                        lang={hi ? 'hi' : 'en'}
                        theme={proseTheme}
                        sectionTint={(i % 2) as 0 | 1}
                        marks={marksForBand(mark)}
                        density="comfortable"
                        paletteRotationStart={i % 4}
                        mainsBoxLayout
                        prominentHeadings={marksForBand(mark) >= 7}
                      />
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    );
  };

  const tabListFull = (
    <div role="tablist" className="flex gap-2 overflow-x-auto pb-1 pt-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={activeTab === tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={cn(
            'relative flex min-h-[44px] shrink-0 items-center gap-2 rounded-2xl px-4 py-2 text-sm font-bold transition-all sm:min-h-[48px] sm:px-5 sm:py-2.5',
            activeTab === tab.id
              ? 'bg-slate-900 text-white shadow-lg ring-2 ring-emerald-500/35 dark:bg-white dark:text-slate-900'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
          )}
        >
          <tab.icon className={cn('h-4 w-4', activeTab === tab.id ? 'text-emerald-400 dark:text-emerald-600' : '')} />
          <span className="whitespace-nowrap">{tab.label}</span>
          {tab.id === 'marking' && (
            <div className="absolute left-[102%] top-1/2 -translate-y-1/2 flex items-center pointer-events-none select-none z-30 text-2xl filter drop-shadow-md">
              👈
            </div>
          )}
        </button>
      ))}
    </div>
  );

  const tabListCompact = (
    <div
      role="tablist"
      className="flex gap-1 overflow-x-auto border-t border-slate-100 pb-2 pt-2 dark:border-slate-800"
      aria-label={hi ? 'सेक्शन टैब' : 'Section tabs'}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={activeTab === tab.id}
          title={tab.label}
          onClick={() => setActiveTab(tab.id)}
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-slate-600 transition-colors dark:text-slate-300',
            activeTab === tab.id
              ? 'border-emerald-500/50 bg-emerald-50 font-bold text-emerald-900 shadow-sm dark:bg-emerald-950/50 dark:text-emerald-100'
              : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800'
          )}
        >
          <tab.icon className="h-4 w-4 shrink-0" aria-hidden />
          <span className="sr-only">{tab.label}</span>
        </button>
      ))}
    </div>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-gradient-to-b from-slate-50 to-white text-slate-900 dark:from-slate-950 dark:to-slate-950 dark:text-slate-100 overflow-hidden">
      <header className={cn(
        'shrink-0 border-b border-slate-200/80 dark:border-slate-800',
        standalonePage
          ? 'fixed top-14 left-0 right-0 z-40 flex flex-col w-full bg-white/90 backdrop-blur-md shadow-sm dark:bg-slate-950/90'
          : 'bg-white/95 backdrop-blur-md dark:bg-slate-950/95'
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
                  ? 'border-violet-500 bg-violet-50 text-violet-800 dark:bg-violet-950/70 dark:text-violet-200'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-500'
              )}
              aria-expanded={topicMetaOpen}
              aria-label={hi ? 'शीर्षक, विवरण व टैब' : 'Title, intro & tabs'}
            >
              <SlidersHorizontal className="h-4 w-4" aria-hidden />
            </button>
            <div className="min-w-0 pr-1">
              {topic.paperNumber && (
                <p className="truncate text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 leading-tight">
                  🎯 Paper {topic.paperNumber}
                </p>
              )}
              <h1 className="truncate text-xs font-bold leading-tight text-slate-900 dark:text-slate-100 sm:text-sm">
                {title}
              </h1>
            </div>
          </div>

          <div className="flex items-center shrink-0 gap-2">
            <Button
              size="sm"
              variant={isDone ? 'default' : 'outline'}
              className={cn(
                'h-9 shrink-0 rounded-full px-3 text-[11px] font-black shadow-sm sm:px-4',
                isDone ? 'border-0 bg-emerald-600 hover:bg-emerald-700' : 'border-slate-300 dark:border-slate-600'
              )}
              onClick={onMarkDone}
            >
              {isDone ? <CheckCircle className="mr-1 h-4 w-4" /> : null}
              <span className="max-[380px]:sr-only">
                {isDone ? (hi ? 'पढ़ लिया ✓' : 'Done ✓') : hi ? 'मार्क' : 'Read'}
              </span>
              <span className="min-[381px]:hidden">{isDone ? '✓' : '••'}</span>
            </Button>
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
              <div className="space-y-3 px-3 pb-3 pt-2 sm:px-4">
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant="outline"
                    className="border-emerald-400/50 bg-emerald-50 font-bold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200"
                  >
                    ✨ UPSC Mains
                  </Badge>
                  <Badge variant="outline" className="font-semibold text-slate-600 dark:text-slate-300">
                    {hi ? 'भाषा: हिंदी' : 'Language: English'}
                  </Badge>
                </div>
                <h2 className="text-balance text-lg font-black tracking-tight text-slate-900 dark:text-white sm:text-xl md:text-2xl md:leading-snug">
                  {title}
                </h2>
                <p className="max-w-2xl text-[13px] leading-relaxed text-slate-600 dark:text-slate-400">
                  {hi
                    ? 'नीचे टैब से पढ़ें: पहले कॉन्सेप्ट, फिर लेखन की रणनीति, फिर परीक्षा जैसे मॉडल उत्तर। पॉइंट-वार मेमोरी के लिए ✨ तेज़ रिवीज़न देखें।'
                    : 'Use the tabs: Concept → how to write → model answers. ✨ Quick recap holds memory hooks and crisp terms.'}
                </p>
                {tabListFull}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {!topicMetaOpen ? <div className="px-3 sm:px-4">{tabListCompact}</div> : null}
      </header>

      <div className={cn("custom-scrollbar flex-1 overflow-y-auto px-6 sm:px-8 sm:pb-8", standalonePage ? "pt-28 pb-12 sm:pt-28" : "py-8")}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="mx-auto max-w-4xl"
          >
            {activeTab === 'concept' && (
              <div className="space-y-6">
                <MainsMarkdownBody markdown={conceptBlock} isHindi={hi} />
                <div className="flex gap-4 rounded-2xl border border-emerald-200/80 bg-emerald-50/80 p-5 dark:border-emerald-900/50 dark:bg-emerald-950/30">
                  <Lightbulb className="mt-0.5 h-7 w-7 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <p className="font-black text-emerald-900 dark:text-emerald-300">
                      {hi ? '💡 पढ़ते वक़्त' : '💡 While reading'}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-emerald-950/90 dark:text-emerald-100/90">
                      {hi
                        ? 'हर "##" शीर्षक = याद करने का एक ढांचा। गोलियों को वापस बोलकर देखो — अगर मुंह पर आ जाए तो सही।'
                        : 'Each "##" is a memory frame. Say bullets out loud — if it rolls off the tongue, it will in the exam.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'marking' && (
              <div className="space-y-4">
                <MainsMarkdownBody 
                  markdown={strategyBlock || (hi ? '*रणनीति जोड़ी जाएगी।*' : '*Strategy will appear here.*')} 
                  isHindi={hi}
                  itemClassName="border-violet-200 bg-gradient-to-r from-violet-50/40 to-white dark:border-violet-900/40 dark:bg-violet-950/20 px-2 py-2.5 sm:px-2.5 sm:py-3"
                  bulletClassName="bg-violet-600 shadow-[0_0_12px_rgba(124,58,237,0.5)] ring-4 ring-violet-500/20"
                />
              </div>
            )}

            {activeTab === 'models' && renderModelAnswers()}

            {activeTab === 'tips' && (
              <div className="space-y-8">
                <div className="rounded-2xl border-2 border-violet-200 bg-violet-50/80 p-6 dark:border-violet-900/60 dark:bg-violet-950/30">
                  <h3 className="text-lg font-black text-violet-900 dark:text-violet-200">
                    {hi ? '🔑 की-टर्म्स / फ्लैश तैयारी' : '🔑 Key terms / flash prep'}
                  </h3>
                  {termsBlock?.trim() ? (
                    <div className="mt-4">
                      <MainsKeyTermsFlash structured={undefined} fallbackText={termsBlock} isHindi={hi} />
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-violet-950/80 dark:text-violet-200/80">
                      {hi
                        ? 'यहाँ एक्सपर्ट JSON में `key_terms_hi` / `key_terms_en` भरने पर ऑटो दिखेगा।'
                        : 'Fill `key_terms_hi` / `key_terms_en` in the admin JSON to populate this box.'}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-6 dark:border-amber-900/50 dark:bg-amber-950/20">
                    <p className="text-2xl mb-2">🧠</p>
                    <h4 className="font-black text-amber-950 dark:text-amber-100">
                      {hi ? 'मेमोरी हुक' : 'Memory hooks'}
                    </h4>
                    <p className="mt-2 text-sm leading-relaxed text-amber-950/85 dark:text-amber-50/90">
                      {hi
                        ? 'कॉन्सेप्ट टैब में "## याद रखने की ट्रिक" सेक्शन ध्यान से। वहीं से एक लाइन का "रीकॉल" बनाओ।'
                        : 'Check the “Memory hooks” heading in Concept. Turn it into a one-line recall ritual.'}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-sky-200 bg-sky-50/60 p-6 dark:border-sky-900/50 dark:bg-sky-950/20">
                    <p className="text-2xl mb-2">🔗</p>
                    <h4 className="font-black text-sky-950 dark:text-sky-100">{hi ? 'जुड़ाव' : 'Interlinks'}</h4>
                    <p className="mt-2 text-sm leading-relaxed text-sky-950/85 dark:text-sky-50/90">
                      {hi
                        ? 'रणनीति में जो टेबल / नक्शा / कारण→प्रभाव हैं, उन्हें दूसरे पेपर के शब्दों से जोड़कर एक बार खुद से बोलो।'
                        : 'Reuse the strategy tables/maps as bridges — say aloud how this topic hugs other papers.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-16 text-center border-t border-slate-100 dark:border-slate-800/50 mt-8">
        <div className="mb-8 space-y-3">
          <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em]">
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
  );
}

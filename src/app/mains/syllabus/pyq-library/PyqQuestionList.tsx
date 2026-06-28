'use client';

import { memo, useMemo, useState, useCallback } from 'react';
import { Lock, Layers, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useSettingsStore } from '@/store/useSettingsStore';
import { PyqAnswerProse } from '@/components/mains/PyqAnswerProse';
import { Button } from '@/components/ui/button';
import {
  MAIN_SYLLABUS_CARD_HUES,
  mainsSyllabusTileSkin,
  mainsSyllabusVariantBadge,
} from '@/components/mains/mainsSyllabusTileSkin';
import { PyqExpertInsightsRenderer } from '@/components/mains/PyqExpertInsightsRenderer';
import { QuickFeedback } from '@/features/tests/components/QuickFeedback';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  isMainsPyqDemoPaper,
  pickMainsPyqFreeDemoQuestionIds,
} from '@/lib/mains-vault-demo';

export type QRow = {
  id: string;
  part: string;
  unitNumber: number;
  unitTitleHi?: string | null;
  unitTitleEn?: string | null;
  marks: number;
  questionNumber: string;
  questionHi: string;
  questionEn: string | null;
  expertInsightsHi: string | null;
  expertInsightsEn: string | null;
  currentAffairsData?: any | null;
  variants: {
    slot: number;
    styleLabel: string | null;
    styleLabelHi: string | null;
    answerHi: string;
    answerEn: string | null;
  }[];
};

type ReadingTheme = 'deep' | 'paper';

interface PyqQuestionListProps {
  questions: QRow[];
  paperNumber: number;
  examYear: number;
  paperQuestionCount?: number;
  partFilter: string;
  onPartFilterChange: (part: string) => void;
  readingTheme: ReadingTheme;
  vaultUnlocked: boolean;
  allowDemoAccess: boolean;
  onVaultModalOpen: () => void;
  showGlobalFilters: boolean;
}

const NEW_CA_TEXT_STYLE = {
  color: '#0fffff',
  WebkitTextStroke: '0.5px #082f49',
  textShadow: '0px 1px 0px #0369a1, 0px 2px 0px #075985, 0px 3px 0px #082f49, 0px 4px 6px rgba(0,0,0,0.8)'
};

export const PyqQuestionList = memo(function PyqQuestionList({
  questions,
  paperNumber,
  examYear,
  paperQuestionCount = 0,
  partFilter,
  onPartFilterChange,
  readingTheme,
  vaultUnlocked,
  allowDemoAccess,
  onVaultModalOpen,
  showGlobalFilters,
}: PyqQuestionListProps) {
  const { language } = useSettingsStore();
  const hi = language === 'hi';
  const effectiveHi = paperNumber === 5 || paperNumber === 6 || hi;
  const themeDeep = readingTheme === 'deep';

  const [openIds, setOpenIds] = useState<Record<string, boolean>>({});
  const [insightsOpenIds, setInsightsOpenIds] = useState<Record<string, boolean>>({});
  const [marksFilter, setMarksFilter] = useState<number | 'ALL'>('ALL');

  // ⚡ Stable callbacks prevent cascading re-renders
  const handleQOpen = useCallback((qId: string, val: boolean) => {
    setOpenIds(prev => prev[qId] === val ? prev : { ...prev, [qId]: val });
  }, []);

  const handleInsightOpen = useCallback((qId: string, val: boolean) => {
    setInsightsOpenIds(prev => prev[qId] === val ? prev : { ...prev, [qId]: val });
  }, []);

  const handlePartFilterChange = useCallback((p: string) => {
    onPartFilterChange(p);
  }, [onPartFilterChange]);

  const parts = useMemo(() => {
    const s = new Set(questions.map((q) => String(q.part).toUpperCase()));
    return ['ALL', ...Array.from(s).sort()];
  }, [questions]);

  const availableMarks = useMemo(() => {
    const s = new Set(questions.map((q) => q.marks));
    return Array.from(s).sort((a, b) => a - b);
  }, [questions]);

  const filtered = useMemo(() => {
    let list = questions;
    if (partFilter !== 'ALL') {
      list = list.filter((q) => String(q.part).toUpperCase() === partFilter);
    }
    if (marksFilter !== 'ALL') {
      list = list.filter((q) => q.marks === marksFilter);
    }
    return list;
  }, [questions, partFilter, marksFilter]);

  const isDemoPaper = isMainsPyqDemoPaper(examYear, paperNumber);

  const guestFreeIds = useMemo(() => {
    if (vaultUnlocked || !allowDemoAccess || !isDemoPaper) return new Set<string>();
    return pickMainsPyqFreeDemoQuestionIds(questions);
  }, [vaultUnlocked, allowDemoAccess, isDemoPaper, questions]);

  const visibleQuestions = useMemo(() => {
    if (vaultUnlocked) return filtered;
    if (!allowDemoAccess || !isDemoPaper) return [];
    return filtered.filter((q) => guestFreeIds.has(q.id));
  }, [vaultUnlocked, filtered, guestFreeIds, allowDemoAccess, isDemoPaper]);

  const lockedCount = useMemo(() => {
    if (vaultUnlocked) return 0;
    if (!isDemoPaper) return paperQuestionCount;
    return filtered.filter((q) => !guestFreeIds.has(q.id)).length;
  }, [vaultUnlocked, isDemoPaper, filtered, guestFreeIds, paperQuestionCount]);

  const showVaultBanner = !vaultUnlocked && lockedCount > 0;



  return (
    <>
      <AnimatePresence>
        {showGlobalFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mb-6 flex flex-wrap items-center gap-3 pt-2">
              {/* Section Filter (Only show if there are multiple parts) */}
              {parts.length > 2 && (
                <>
                  <div className="flex flex-wrap gap-2 items-center">
                    <div className="flex flex-wrap gap-2">
                      {parts.map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => handlePartFilterChange(p)}
                          className={cn(
                            'rounded-full px-4 py-1.5 text-[11px] font-black uppercase tracking-wide transition-all active:scale-95 shadow-sm',
                            partFilter === p
                              ? themeDeep
                                ? 'bg-emerald-600 text-white border border-emerald-500'
                                : 'bg-pink-600 text-white shadow-md'
                              : themeDeep
                                ? 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700'
                                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          )}
                        >
                          {p === 'ALL' ? (hi ? 'सभी सेक्शन' : 'All Sections') : hi ? `सेक्शन ${p}` : `Section ${p}`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Separator */}
                  <div className="hidden sm:block h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1" />
                </>
              )}

              {/* Marks Filter */}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setMarksFilter('ALL')}
                  className={cn(
                    'rounded-full px-4 py-1.5 text-[11px] font-black uppercase tracking-wide transition-all active:scale-95 shadow-sm',
                    marksFilter === 'ALL'
                      ? themeDeep
                        ? 'bg-amber-600 text-white border border-amber-500'
                        : 'bg-amber-600 text-white shadow-md'
                      : themeDeep
                        ? 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700'
                        : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  )}
                >
                  {hi ? 'सभी अंक' : 'All Marks'}
                </button>
                {availableMarks.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMarksFilter(m)}
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-black transition-all active:scale-95 shadow-sm border',
                      marksFilter === m
                        ? themeDeep
                          ? 'bg-sky-600 text-white border-sky-500'
                          : 'bg-sky-600 text-white shadow-md border-sky-700'
                        : themeDeep
                          ? 'bg-slate-800 text-slate-400 hover:bg-slate-700 border-slate-700'
                          : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
                    )}
                  >
                    {m}m
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ul className={cn('space-y-3', showVaultBanner ? 'pb-3' : 'pb-6')}>
        {visibleQuestions.map((q, qi) => (
          <PyqQuestionRow
            key={q.id}
            q={q}
            qi={qi}
            effectiveHi={effectiveHi}
            themeDeep={themeDeep}
            open={!!openIds[q.id]}
            setOpen={(val) => handleQOpen(q.id, val)}
            readingTheme={readingTheme}
            insightsOpen={!!insightsOpenIds[q.id]}
            setInsightsOpen={(val) => handleInsightOpen(q.id, val)}
            examYear={examYear}
          />
        ))}
      </ul>

      {showVaultBanner ? (
        <PyqVaultUnlockBanner
          hi={hi}
          themeDeep={themeDeep}
          lockedCount={lockedCount}
          onVaultModalOpen={onVaultModalOpen}
        />
      ) : null}
    </>
  );
});

PyqQuestionList.displayName = 'PyqQuestionList';

function PyqVaultUnlockBanner({
  hi,
  themeDeep,
  lockedCount,
  onVaultModalOpen,
}: {
  hi: boolean;
  themeDeep: boolean;
  lockedCount: number;
  onVaultModalOpen: () => void;
}) {
  return (
    <div
      className={cn(
        'mb-8 overflow-hidden rounded-[2rem] border p-6 text-center sm:p-7',
        themeDeep
          ? 'border-amber-500/30 bg-gradient-to-b from-amber-500/10 to-slate-900'
          : 'border-amber-300 bg-gradient-to-b from-amber-50 to-white'
      )}
    >
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'mx-auto mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em]',
          themeDeep ? 'border-amber-400/40 text-amber-300' : 'border-amber-300 text-amber-700'
        )}
      >
        <Lock className="h-3.5 w-3.5" aria-hidden />
        {hi ? 'मेंस लाइब्रेरी' : 'Mains Library'}
      </motion.div>
      <p className={cn('mx-auto max-w-xl text-sm leading-relaxed', themeDeep ? 'text-slate-300' : 'text-slate-700')}>
        {hi
          ? 'मेंस प्लान के साथ सिलेबस के गहन कॉन्सेप्ट्स, प्रमाणिक द्विभाषी (Bilingual) मॉडल उत्तर और रणनीतिक एक्सपर्ट टिप्स अनलॉक करें।'
          : 'Deep syllabus concepts, authentic bilingual model answers, and strategic insights unlock with the Mains plan.'}
      </p>
      <Button
        type="button"
        onClick={onVaultModalOpen}
        className="mt-5 h-11 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-orange-500 px-7 font-black text-white shadow-lg shadow-amber-500/25 hover:opacity-95"
      >
        {hi ? 'लाइब्रेरी अनलॉक करें · मूल्य' : 'Unlock Library · pricing'}
      </Button>
      <p className={cn('mt-3 text-xs', themeDeep ? 'text-slate-400' : 'text-slate-500')}>
        {lockedCount} {hi ? 'प्रश्न अभी लॉक हैं' : 'questions locked'}
      </p>
    </div>
  );
}

/**
 * 🎯 Individual Question Row with Premium UX
 */
const PyqQuestionRow = memo(({
  q,
  qi,
  effectiveHi,
  themeDeep,
  open,
  setOpen,
  readingTheme,
  insightsOpen,
  setInsightsOpen,
  examYear,
}: {
  q: QRow;
  qi: number;
  effectiveHi: boolean;
  themeDeep: boolean;
  open: boolean;
  setOpen: (val: boolean) => void;
  readingTheme: ReadingTheme;
  insightsOpen: boolean;
  setInsightsOpen: (val: boolean) => void;
  examYear: number;
}) => {
  
  const hue = MAIN_SYLLABUS_CARD_HUES[qi % 4];
  const tileSkin = mainsSyllabusTileSkin(hue, themeDeep);

  function stemFor(q: QRow) {
    return effectiveHi ? q.questionHi : (q.questionEn ?? q.questionHi);
  }

  function insightsFor(q: QRow) {
    if (effectiveHi) return (q.expertInsightsHi ?? '').trim();
    return (q.expertInsightsEn ?? q.expertInsightsHi ?? '').trim();
  }

  function answerFor(v: QRow['variants'][0]) {
    return effectiveHi ? v.answerHi : (v.answerEn ?? v.answerHi);
  }

  function styleLabelFor(v: QRow['variants'][0]) {
    if (effectiveHi) {
      const s = (v.styleLabelHi ?? '').trim();
      if (s) return s;
      return (v.styleLabel ?? '').trim() || null;
    }
    const s = (v.styleLabel ?? '').trim();
    if (s) return s;
    return (v.styleLabelHi ?? '').trim() || null;
  }

  const insightsText = insightsFor(q);
  const hasInsights = insightsText.length > 0 || (q.currentAffairsData && Object.keys(q.currentAffairsData).length > 0);

  return (
    <li
      className={cn(
        'overflow-hidden rounded-[2.25rem] sm:rounded-[2.5rem] border border-transparent',
        tileSkin.frame,
        open && 'shadow-xl shadow-slate-200/50 dark:shadow-black/50 border-emerald-500/20'
      )}
      style={{ overflowAnchor: 'none' }}
    >
      <div
        role="button"
        onClick={() => {
          const scrollY = window.scrollY;
          setOpen(!open);
          requestAnimationFrame(() => {
            window.scrollTo(window.scrollX, scrollY);
          });
        }}
        className={cn(
          'flex w-full items-start gap-2 px-3 py-3 text-left sm:gap-2.5 sm:px-4 sm:py-4 active:scale-100 cursor-pointer',
          open && 'bg-slate-50/50 dark:bg-slate-900/50'
        )}
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        <div className="flex shrink-0 flex-col items-center gap-1">
          <span className={cn('rounded-lg px-2 py-0.5 text-[10px] font-black', tileSkin.markBadge)}>
            {q.marks}m
          </span>

        </div>
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              'text-[10px] font-black uppercase tracking-wider opacity-60',
              themeDeep ? 'text-slate-400' : 'text-slate-700'
            )}
          >
            {effectiveHi
              ? `${examYear > 0 ? `UPSC PYQ ${examYear} · ` : ''}खंड ${q.part} · इकाई ${q.unitNumber} · प्रश्न ${q.questionNumber}`
              : `${examYear > 0 ? `UPSC PYQ ${examYear} · ` : ''}Part ${q.part} · U${q.unitNumber} · ${q.questionNumber}`}
          </p>
          <p
            className={cn(
              'mt-1 text-[15px] font-bold leading-relaxed md:text-base whitespace-pre-line',
              effectiveHi ? 'font-[family-name:var(--font-pyq-dev)]' : 'font-[family-name:var(--font-pyq-serif)]',
              themeDeep ? 'text-slate-100' : 'text-slate-900'
            )}
          >
            {stemFor(q)}
          </p>
        </div>
      </div>

        {open && (
          <div>
              <div
              className={cn(
                'border-t px-2 py-4 sm:px-4',
                themeDeep ? 'border-white/10 bg-black/10' : 'border-black/[0.07] bg-slate-50/30'
              )}
            >
              {q.variants.length === 0 ? (
                <div className="py-8 text-center">
                  <span className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wide shadow-sm",
                    themeDeep
                      ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                      : 'border-amber-300 bg-amber-50 text-amber-800'
                  )}>
                    🚀 {effectiveHi ? 'जल्द आ रहा है' : 'Coming Soon'}
                  </span>
                  <p
                    className={cn(
                      'mt-2 text-sm font-bold leading-relaxed',
                      themeDeep ? 'text-slate-400' : 'text-slate-600'
                    )}
                  >
                    {effectiveHi
                      ? 'एक्सपर्ट कंटेंट व मॉडल उत्तर तैयार किए जा रहे हैं।'
                      : 'Expert content & model answers are being prepared.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-0">
                  {q.variants
                    .sort((a, b) => a.slot - b.slot)
                    .map((v, vIdx) => {
                      const slotKey = v.slot === 2 ? 2 : 1;
                      const badgeClass = mainsSyllabusVariantBadge(hue, slotKey, themeDeep);
                      const styleSubtitle = styleLabelFor(v);

                      return (
                        <div
                          key={`${v.slot}-${vIdx}`}
                          className={cn(
                            'min-w-0',
                            vIdx > 0 &&
                              (themeDeep
                                ? 'relative mt-16 border-t border-white/20 pt-12 before:pointer-events-none before:absolute before:-top-8 before:left-0 before:right-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/25 before:to-transparent'
                                : 'relative mt-16 border-t-2 border-black/[0.07] border-dashed pt-12 before:pointer-events-none before:absolute before:-top-8 before:left-0 before:right-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-slate-300/80 before:to-transparent')
                          )}
                        >
                          <div className="mb-4 flex flex-wrap items-center gap-2">
                            <span className={cn('inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-black uppercase shadow-sm', badgeClass)}>
                              <Layers className="h-3.5 w-3.5 shrink-0" />
                              {v.slot === 1 
                                ? (effectiveHi ? 'आदर्श उत्तर (Variant 1)' : 'Model Answer (Variant 1)') 
                                : (effectiveHi ? `वैकल्पिक दृष्टिकोण (Variant ${v.slot})` : `Alternative Approach (Variant ${v.slot})`)}
                            </span>
                            {styleSubtitle ? (
                              <span
                                className={cn(
                                  'text-[11px] font-bold tracking-tight opacity-70',
                                  themeDeep ? 'text-slate-300' : 'text-slate-700',
                                  effectiveHi && 'font-[family-name:var(--font-pyq-dev)]'
                                )}
                              >
                                {styleSubtitle}
                              </span>
                            ) : null}
                          </div>

                          <div className="mb-4">
                            <PyqAnswerProse
                              text={answerFor(v)}
                              lang={v.answerEn && !effectiveHi ? 'en' : 'hi'}
                              theme={readingTheme}
                            />
                          </div>
                        </div>
                      );
                    })}

                  {hasInsights ? (
                    <div className="mt-10 mb-2 text-left">
                      <div className="flex justify-center mb-6">
                        <div className="relative inline-block">
                          <div
                            role="button"
                            onClick={() => {
                              const scrollY = window.scrollY;
                              setInsightsOpen(!insightsOpen);
                              requestAnimationFrame(() => {
                                window.scrollTo(window.scrollX, scrollY);
                              });
                            }}
                            className={cn(
                              'inline-flex items-center gap-2 rounded-2xl border px-8 py-3 text-[13px] font-black uppercase tracking-wider shadow-xl active:scale-100 cursor-pointer',
                              insightsOpen
                                ? 'bg-slate-950 border-amber-500 text-amber-300 shadow-amber-500/30 ring-2 ring-amber-500/20'
                                : 'bg-slate-900 border-slate-800 border-amber-500/50 text-amber-400 shadow-black/60'
                            )}
                            style={{ WebkitTapHighlightColor: 'transparent' }}
                          >
                            <Trophy className="h-4.5 w-4.5 shrink-0 text-amber-500" />
                            {effectiveHi ? 'एक्सपर्ट टिप्स' : 'Expert Tips'}
                          </div>
                          {!insightsOpen && !!q.currentAffairsData && (
                            <motion.div
                              initial={{ opacity: 0, x: 15, y: 10, scale: 0.8 }}
                              animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                              transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
                              className="absolute left-[98%] top-[10px] w-[100px] h-[70px] pointer-events-none select-none z-30 ml-2"
                            >
                               {/* 💡 3D Pure CSS Text (No BG) */}
                              <div 
                                className="absolute left-[5px] sm:left-[15px] top-[-22px] sm:top-[-28px] whitespace-nowrap text-[12px] sm:text-[14px] font-black uppercase tracking-widest -rotate-6 z-10"
                                style={NEW_CA_TEXT_STYLE}
                              >
                                {effectiveHi ? 'यहाँ क्लिक करें ✨' : 'CLICK HERE ✨'}
                              </div>

                              {/* 🎨 Curvy Pink Onboarding Arrow sweeping UP from below with filled arrow head */}
                              <svg width="60" height="60" viewBox="0 0 60 60" fill="none" className="filter drop-shadow-[0_3px_5px_rgba(236,72,153,0.5)] w-[50px] sm:w-[60px] absolute left-0 top-0">
                                <path
                                  d="M50 50C40 30 25 15 8 15"
                                  stroke="#ec4899"
                                  strokeWidth="5"
                                  strokeLinecap="round"
                                />
                                <path
                                  d="M 5,15 L 20,6 L 16,24 Z"
                                  fill="#ec4899"
                                  stroke="#ec4899"
                                  strokeWidth="2"
                                  strokeLinejoin="round"
                                />
                              </svg>

                              {/* 🚶‍♂️ Walking Man - Placed at the very bottom tail of the arrow */}
                              <div className="absolute left-[45px] sm:left-[55px] top-[30px] sm:top-[35px] text-[32px] sm:text-[36px] filter drop-shadow-md">
                                🚶‍♂️
                              </div>
                            </motion.div>
                          )}                        </div>
                      </div>
                      
                        {insightsOpen && (
                          <div className="w-full">
                                <PyqExpertInsightsRenderer
                                  insightsText={insightsText}
                                  currentAffairsData={q.currentAffairsData}
                                  themeDeep={themeDeep}
                                  hi={effectiveHi}
                                />
                          </div>
                        )}
                    </div>
                  ) : null}

                  <div className="mt-12 border-t border-slate-200 dark:border-slate-800 pt-6">
                    <QuickFeedback 
                      questionId={q.id}
                      questionText={stemFor(q)}
                      source="mains_pyq"
                      className="mt-0"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
    </li>
  );
});

PyqQuestionRow.displayName = 'PyqQuestionRow';

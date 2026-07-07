'use client';

import { useState, useCallback } from 'react';
import { getMainsTopicForPage } from '@/actions/mains-actions';
import { MainsTopicContentClient } from '@/components/mains/MainsTopicContentClient';
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ChevronDown, ExternalLink, Layers, Lock, GraduationCap, ArrowLeft, ArrowRight, BookOpen, Sparkles } from 'lucide-react';
import { useSettingsStore } from '@/store/useSettingsStore';
import { MainsMobileSyllabusDrawer } from '@/components/mains/MainsMobileSyllabusDrawer';
import type { MobileUnit } from '@/components/mains/MainsSyllabusPaperMobileGate';
import { mainsUnitShortBadge, mainsUnitSubtitle } from '@/lib/mains-syllabus-unit-label';
import { MAIN_SYLLABUS_CARD_HUES, mainsSyllabusTileSkin } from '@/components/mains/mainsSyllabusTileSkin';
import { QuickFeedback } from '@/features/tests/components/QuickFeedback';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';

const SyllabusLockMainsModal = dynamic(
  () => import('@/features/mains/components/SyllabusLockMainsModal').then((mod) => mod.SyllabusLockMainsModal),
  { ssr: false }
);

type TopicRow = MobileUnit['topics'][number];

export function MainsMobilePaperExplorer({
  paperId,
  paperNumber,
  titleEn,
  units,
  vaultUnlocked,
  allowGuestPreview,
}: {
  paperId: string;
  paperNumber: number;
  titleEn: string;
  units: MobileUnit[];
  vaultUnlocked: boolean;
  allowGuestPreview: boolean;
}) {
  const { language } = useSettingsStore();
  const hi = language === 'hi';
  const [openTopicId, setOpenTopicId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [vaultModalOpen, setVaultModalOpen] = useState(false);
  const [cache, setCache] = useState<
    Record<
      string,
      {
        topic: {
          id: string;
          titleHi: string;
          titleEn: string;
          unitId: string;
        };
        content: Parameters<typeof MainsTopicContentClient>[0]['content'];
      }
    >
  >({});

  const toggleTopic = useCallback(
    async (topic: TopicRow, unitId: string) => {
      if (openTopicId === topic.id) {
        setOpenTopicId(null);
        return;
      }
      setOpenTopicId(topic.id);
      if (cache[topic.id]) return;
      setLoadingId(topic.id);
      try {
        const res = await getMainsTopicForPage(topic.id, paperId);
        if (res.success && res.data) {
          const row = res.data;
          const c = row.content;
          setCache((prev) => ({
            ...prev,
            [topic.id]: {
              topic: {
                id: row.id,
                titleHi: row.titleHi,
                titleEn: row.titleEn,
                unitId,
                paperId,
                paperNumber,
              },
              content: c
                ? {
                    conceptHi: c.conceptHi,
                    conceptEn: c.conceptEn,
                    expertStrategyHi: c.expertStrategyHi ?? '',
                    expertStrategyEn: c.expertStrategyEn ?? '',
                    modelAnswers: c.modelAnswers as Record<string, { text: string }[]>,
                    keyTermsHi: c.keyTermsHi ?? null,
                    keyTermsEn: c.keyTermsEn ?? null,
                    richPayload: (c as { richPayload?: Record<string, unknown> | null }).richPayload ?? null,
                  }
                : null,
            },
          }));
        }
      } finally {
        setLoadingId(null);
      }
    },
    [paperId, openTopicId]
  );

  const defaultOpenUnits: string[] = [];

  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-[#fafbfc] text-slate-900 overflow-hidden">
      {/* Decorative premium colored blobs in background */}
      <div className="pointer-events-none absolute rounded-full blur-[100px] opacity-40 top-[-80px] right-[-120px] h-[420px] w-[420px] bg-pink-100" />
      <div className="pointer-events-none absolute rounded-full blur-[100px] opacity-40 top-[30%] left-[-100px] h-[380px] w-[380px] bg-emerald-100" />
      <div className="pointer-events-none absolute rounded-full blur-[100px] opacity-40 bottom-[10%] right-[10%] h-[320px] w-[320px] bg-amber-100" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-50/80 to-transparent" />

      {/* Header Container (Compact h-14 matching topic reading page) */}
      <div 
        className="fixed top-14 left-0 right-0 z-40 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-slate-200/80 bg-white/90 px-3 backdrop-blur-md shadow-sm dark:border-slate-800/80 dark:bg-slate-950/90 overflow-y-auto overscroll-none touch-none"
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 min-w-0 text-left pr-1">
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl shrink-0" asChild>
            <Link href="/mains">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="min-w-0 text-left pr-1">
            <p className="truncate text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 leading-tight">
              🎯 {hi ? `पेपर ${paperNumber}` : `Paper ${paperNumber}`}
            </p>
            <p className="truncate text-xs font-black text-slate-900 dark:text-slate-100 mt-0.5 leading-snug">
              {titleEn}
            </p>
          </div>
        </div>
        <div className="flex items-center shrink-0">
          <MainsMobileSyllabusDrawer paperNumber={paperNumber} language="hi" />
        </div>
      </div>

      {/* Main content list */}
      <div className="relative z-10 min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-28 pt-32">
        <Accordion type="multiple" defaultValue={defaultOpenUnits} className="space-y-3">
          {units.map((unit, unitIdx) => {
            const hue = MAIN_SYLLABUS_CARD_HUES[unitIdx % 4];
            const tileSkin = mainsSyllabusTileSkin(hue, false); // false = light mode styles
            // Only Paper 1, Unit 1 is free to expand for guests
            const isFreeUnit = paperNumber === 1 && unitIdx === 0;
            const unitLocked = !vaultUnlocked && !isFreeUnit;

            return (
              <AccordionItem
                key={unit.id}
                value={`unit-${unit.id}`}
                className={cn(
                  'rounded-2xl border transition-all duration-300 shadow-sm',
                  unitIdx === 0 ? 'overflow-visible' : 'overflow-hidden',
                  tileSkin.frame
                )}
              >
                {unitLocked ? (
                  <div 
                    onClick={() => setVaultModalOpen(true)}
                    className="cursor-pointer px-4.5 py-4 transition-all duration-200 hover:bg-slate-100/10"
                  >
                    <div className="flex items-start gap-3 rounded-xl bg-slate-100/50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800 backdrop-blur-sm px-3 py-3 shadow-inner">
                      <span
                        className="flex h-9 min-w-[2.5rem] shrink-0 items-center justify-center rounded-xl px-1 text-[10px] font-black leading-tight bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 mt-0.5"
                        title={mainsUnitSubtitle(paperNumber, unit.part, unit.unitNumber, hi ? 'hi' : 'en')}
                      >
                        {mainsUnitShortBadge(unit.part, unit.unitNumber)}
                      </span>
                      <div className="min-w-0 flex-1 text-left flex flex-col gap-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                            {mainsUnitSubtitle(paperNumber, unit.part, unit.unitNumber, hi ? 'hi' : 'en')}
                          </p>
                          <Button
                            type="button"
                            size="xs"
                            className={cn(
                              "relative h-7 overflow-hidden gap-1.5 px-3 rounded-full text-[10px] font-black transition-all active:scale-95 shrink-0",
                              "bg-gradient-to-br from-[#FFD700] via-[#FDB931] to-[#D4AF37]",
                              "text-slate-950 border border-amber-400/40 shadow-[0_2px_10px_rgba(212,175,55,0.3)]",
                              "hover:brightness-110 hover:shadow-[0_4px_15px_rgba(212,175,55,0.5)]"
                            )}
                            onClick={(e) => {
                              e.stopPropagation();
                              setVaultModalOpen(true);
                            }}
                          >
                            {/* 💡 Shimmer/Glimmer Light Effect */}
                            <motion.div
                              animate={{ x: ['-100%', '200%'] }}
                              transition={{ repeat: Infinity, duration: 2.2, ease: "linear" }}
                              className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/45 to-transparent w-1/2 -skew-x-20"
                            />
                            <Lock className="relative z-10 h-3 w-3 text-slate-950 fill-slate-900/10" />
                            <span className="relative z-10">{hi ? 'प्रीमियम अनलॉक' : 'Premium'}</span>
                          </Button>
                        </div>
                        <p className="text-sm font-bold text-slate-400 dark:text-slate-500 leading-snug whitespace-normal break-words">{hi ? unit.titleHi : unit.titleEn}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <AccordionTrigger className="px-4.5 py-4 text-left hover:no-underline [&[data-state=open]]:bg-white/40">
                      <div className="flex items-start gap-3 w-full pr-2">
                        <span
                          className={cn(
                            'flex h-9 min-w-[2.5rem] shrink-0 items-center justify-center rounded-xl px-1 text-[10px] font-black leading-tight mt-0.5',
                            tileSkin.markBadge
                          )}
                          title={mainsUnitSubtitle(paperNumber, unit.part, unit.unitNumber, hi ? 'hi' : 'en')}
                        >
                          {mainsUnitShortBadge(unit.part, unit.unitNumber)}
                        </span>
                        
                        <div className="min-w-0 flex-1 text-left flex flex-col gap-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                              {mainsUnitSubtitle(paperNumber, unit.part, unit.unitNumber, hi ? 'hi' : 'en')}
                            </p>
                            
                            <div className="relative inline-flex items-center gap-1.5 z-20 shrink-0">
                              {unitIdx === 0 && (
                                <motion.div 
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.6 }}
                                  className="absolute right-[30px] top-[-68px] flex flex-col items-start pointer-events-none select-none z-30"
                                >
                                  {/* 🤚 Hand - Points right-downwards at the arrow tail */}
                                  <div className="text-3xl filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.15)] rotate-[35deg] mb-[-12px] ml-[-26px]">
                                    👉
                                  </div>
                                  
                                  {/* 🎨 Curvy Sharp Arrow - Positioned to receive the finger's point */}
                                  <svg width="36" height="46" viewBox="0 0 36 46" fill="none" xmlns="http://www.w3.org/2000/svg" className="filter drop-shadow-[0_2px_5px_rgba(236,72,153,0.4)]">
                                    <path 
                                      d="M10 2C15 12 30 20 22 42" 
                                      stroke="#ec4899" 
                                      strokeWidth="3.5" 
                                      strokeLinecap="round" 
                                    />
                                    <path 
                                      d="M13 35L22 43L31 35" 
                                      stroke="#ec4899" 
                                      strokeWidth="3.5" 
                                      strokeLinecap="round" 
                                      strokeLinejoin="round" 
                                    />
                                  </svg>
                                </motion.div>
                              )}
                              {/* Pill Size Open Button */}
                              <Button
                                size="xs"
                                className="h-6 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black px-2.5 rounded-full text-[10px] transition-all duration-200 active:scale-95 shadow-sm group"
                                onClick={(e) => {
                                  e.stopPropagation(); // Stop Accordion expand trigger
                                }}
                                asChild
                              >
                                <Link href={`/mains/syllabus/${paperId}/${unit.topics[0]?.id}`}>
                                  <BookOpen className="h-3 w-3 text-white shrink-0" />
                                  <span>{hi ? 'खोलें' : 'Open'}</span>
                                  <ArrowRight className="h-3 w-3 text-white shrink-0 transition-transform group-hover:translate-x-0.5" />
                                </Link>
                              </Button>
                            </div>
                          </div>
                          
                          <p className="text-sm font-bold text-slate-900 leading-snug whitespace-normal break-words">
                            {hi ? unit.titleHi : unit.titleEn}
                          </p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="border-t border-slate-200/50 bg-white/40 px-2 pb-3 pt-1">
                      <div className="space-y-1.5">
                        {unit.topics.map((topic, topicIdx) => {
                          const open = openTopicId === topic.id;
                          const packed = cache[topic.id];
                          const loading = loadingId === topic.id;
                          const isPublished = topic.status === 'published';

                          // Rock solid rule: Only Paper 1, Unit 1, Topic 1 is open for guests
                          const isFreeTopic = paperNumber === 1 && unitIdx === 0 && topicIdx === 0;
                          const topicLocked = !vaultUnlocked && !isFreeTopic;

                          const handleTopicToggle = () => {
                            if (!isPublished) {
                              toast.info(hi ? 'यह टॉपिक जल्द ही उपलब्ध होगा!' : 'This topic will be available soon!', {
                                description: hi ? 'हम इस पर एक्सपर्ट कंटेंट तैयार कर रहे हैं।' : 'We are preparing expert content for this section.'
                              });
                              return;
                            }
                            if (topicLocked) {
                              setVaultModalOpen(true);
                              return;
                            }
                            toggleTopic(topic, unit.id);
                          };

                          return (
                            <div key={topic.id} className="rounded-xl border border-transparent">
                              <button
                                type="button"
                                onClick={handleTopicToggle}
                                className={cn(
                                  'flex w-full items-center justify-between gap-2 rounded-xl px-3 py-3 text-left transition-all border shadow-sm',
                                  !isPublished && "opacity-40 grayscale cursor-not-allowed",
                                  open
                                    ? 'bg-emerald-50/75 border-emerald-200/80 text-emerald-950'
                                    : 'bg-white/80 hover:bg-white border-slate-200/50 hover:border-slate-300'
                                )}
                              >
                                <div className="min-w-0 flex-1 flex flex-col gap-0.5">
                                  <span className={cn(
                                    'text-sm font-bold leading-snug',
                                    open ? 'text-emerald-950' : 'text-slate-800'
                                  )}>
                                    {hi ? topic.titleHi : topic.titleEn}
                                  </span>
                                  {!isPublished && (
                                    <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tighter">
                                      {hi ? 'जल्द आ रहा है' : 'Coming Soon'}
                                    </span>
                                  )}
                                </div>
                                <ChevronDown
                                  className={cn(
                                    'h-4 w-4 shrink-0 transition-transform',
                                    open ? 'rotate-180 text-emerald-600' : 'text-slate-400'
                                  )}
                                />
                              </button>

                              {open && (
                                <div className="mt-2 overflow-hidden rounded-xl border border-slate-200/80 bg-slate-50 shadow-inner">
                                  {loading ? (
                                    <div className="flex items-center gap-2 px-4 py-8 text-sm text-slate-500">
                                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                                      {hi ? 'लोड हो रहा है…' : 'Loading…'}
                                    </div>
                                  ) : packed ? (
                                    <div className="max-h-[min(70vh,520px)] overflow-y-auto">
                                      <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2">
                                        <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                                          {hi ? 'पूरा पेज' : 'Full page'}
                                        </span>
                                        <Button
                                          size="sm"
                                          className="h-8 gap-1 text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white border-none shadow-sm transition-all rounded-lg active:scale-95"
                                          asChild
                                        >
                                          <Link href={`/mains/syllabus/${paperId}/${topic.id}`}>
                                            <ExternalLink className="h-3.5 w-3.5 text-white" />
                                            {hi ? 'खोलें' : 'Open'}
                                          </Link>
                                        </Button>
                                      </div>
                                      <MainsTopicContentClient
                                        topic={packed.topic}
                                        content={packed.content}
                                        vaultLocked={!vaultUnlocked && !isFreeTopic && !!packed.content}
                                      />
                                    </div>
                                  ) : (
                                    <div className="px-4 py-6 text-center text-sm text-slate-500">
                                      {hi ? 'सामग्री लोड नहीं हो सकी' : 'Could not load content'}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </>
                )}
              </AccordionItem>
            );
          })}
        </Accordion>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500 font-semibold">
          <Layers className="h-4 w-4 text-slate-400" />
          {units.reduce((n, u) => n + u.topics.length, 0)} {hi ? 'टॉपिक' : 'topics'}
        </div>


      </div>
      <SyllabusLockMainsModal open={vaultModalOpen} onOpenChange={setVaultModalOpen} />
    </div>
  );
}

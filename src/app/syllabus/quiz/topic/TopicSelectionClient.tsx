'use client';

import React, { useState, useEffect } from 'react';

import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { useSettingsStore } from '@/store/useSettingsStore';
import { toast } from 'sonner';
import { SyllabusLockModal } from '@/features/syllabus/components/SyllabusLockModal';
import { Fragment } from 'react';

import { getUserTier } from '@/lib/access-control';
import { trackFbCustomEvent } from '@/lib/analytics/facebook-pixel';

import { QuizSubNav } from '@/features/syllabus/components/QuizSubNav';
import { QuizListItem } from '@/components/QuizListItem';

interface Topic {
  id: string; // UUID from DB
  unitId: string;
  order: number;
  title: string;
  titleEn: string | null;
  description: string | null; // Back text
  descriptionEn: string | null;
  testId?: string;
  isFree: boolean;
  isFreeAccess: boolean;
  isLiteAccess?: boolean; // Added for Lite support
  attemptsLeft: number | null;
  maxRetries: number | null;
}

interface Unit {
  id: string; // unit_1
  index: number;
  title: string; // Fallback or fetched
  topics: Topic[];
}

interface TopicSelectionClientProps {
  initialDbData: Record<string, Topic[]>;
}

import { GlobalLoader } from '@/components/ui/GlobalLoader';

export default function TopicSelectionClient({ initialDbData }: TopicSelectionClientProps) {
  const router = useRouter();
  const { language, user } = useSettingsStore();
  const pathname = usePathname();

  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [paywallOpen, setPaywallOpen] = useState(false);

  const [dbData, setDbData] = useState<Record<string, Topic[]> | null>(initialDbData);
  const [loading, setLoading] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  const hi = language === 'hi';

  // ⚡ LIGHT SPEED PREFETCH: Topics inside the selected unit
  useEffect(() => {
    if (selectedUnitId && dbData?.[selectedUnitId]) {
      dbData[selectedUnitId].slice(0, 6).forEach((t) => {
        if (t.testId) {
          router.prefetch(`/syllabus/quiz/play?unitId=${selectedUnitId}&testId=${t.testId}`);
        }
      });
    }
  }, [selectedUnitId, dbData, router]);

  // No more client-side fetch on mount — data comes from server!

  // Transform DB Data to UI Units
  const units: Unit[] = dbData
    ? Object.entries(dbData)
        .map(([unitId, topicsData]) => {
          const unitIndex = parseInt(unitId.replace('unit_', '')) || 0;
          return {
            id: unitId,
            index: unitIndex,
            title: hi ? `यूनिट ${unitIndex}` : `Unit ${unitIndex}`,
            topics: topicsData
              .sort((a: any, b: any) => a.order - b.order)
              .map((t: any) => ({
                id: t.id,
                unitId: t.unitId,
                order: t.order,
                title: hi ? t.title : t.titleEn || t.title,
                titleEn: t.titleEn,
                description: hi ? t.description : t.descriptionEn || t.description,
                descriptionEn: t.descriptionEn,
                testId: t.testId,
                isFree: t.isFree,
                isFreeAccess: t.isFreeAccess,
                isLiteAccess: t.isLiteAccess, // Map it!
                attemptsLeft: t.attemptsLeft,
                maxRetries: t.maxRetries,
              })),
          };
        })
        .sort((a, b) => a.index - b.index)
    : [];

  const handleTopicClick = (unitId: string, topic: Topic) => {
    const isAdmin = (user as any)?.role === 'admin';

    // STRICT BACKEND ACCESS:
    // We no longer use "limit" or "order" to lock tests.
    // If the backend says it's free (isFreeAccess), it's free.
    // If it's not free, user must be Pro/Lite (handled by backend or future generic check).
    // For now, if it is NOT free access and user is NOT admin/pro, it might be locked.
    // But the user specifically asked to remove local logic.
    // so we rely on `topic.isFreeAccess` and maybe a simple check if they have subscription.

    // Actually, the previous logic was determining `isLocked` based on `order`.
    // Now `isLocked` should ideally come from backend or be simple:
    // Closed if: !isFreeAccess && !hasSubscription

    const effectiveTier = getUserTier(user);

    // 🔒 GRANULAR ACCESS CONTROL
    // Rule 1: Admin & Pro bypass all checks
    // Rule 2: Lite checks isLiteAccess OR isFreeAccess
    // Rule 3: Free checks isFreeAccess
    const hasAccess =
      isAdmin ||
      effectiveTier === 'pro' ||
      (effectiveTier === 'lite' && (topic.isLiteAccess || topic.isFreeAccess)) ||
      topic.isFreeAccess;

    const isUnlocked = hasAccess;

    if (!isUnlocked) {
      setPaywallOpen(true);
      return;
    }

    if (topic.testId) {
      setIsStarting(true);
      trackFbCustomEvent('test_started', {
        test_type: 'topic',
        test_name: topic.titleEn || topic.title,
        unit_id: unitId,
        test_id: topic.testId,
      });
      router.push(`/syllabus/quiz/play?unitId=${unitId}&testId=${topic.testId}`);
    } else {
      toast.error('Test coming soon!');
    }
  };

  const currentUnit = selectedUnitId ? units.find((u) => u.id === selectedUnitId) : null;
  const filteredTopics = currentUnit
    ? currentUnit.topics.filter((t) => t.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 pt-20">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-slate-800"></div>
      </div>
    );
  }

  return (
    <Fragment>
      <div className="relative min-h-screen overflow-hidden bg-[#fafbfc] pb-20 font-sans">
        {/* 🎭 PREMIUM BACKGROUND BLURS */}
        <div className="pointer-events-none absolute top-0 left-0 h-[500px] w-full bg-gradient-to-b from-slate-100/30 to-transparent" />
        <div className="pointer-events-none absolute top-[-100px] right-[-100px] h-[500px] w-[500px] rounded-full bg-indigo-50/40 blur-[100px]" />
        <div className="pointer-events-none absolute bottom-[20%] left-[-150px] h-[400px] w-[400px] rounded-full bg-emerald-50/30 blur-[100px]" />

        <div className="relative z-10 mx-auto max-w-5xl px-6 pt-10 md:pt-8">
        {/* Header Row */}
        <div className="mb-8 flex items-center justify-between">
          {selectedUnitId && (
            <Button
              key="back-to-units"
              variant="ghost"
              onClick={() => setSelectedUnitId(null)}
              className="group -ml-3 p-0 text-slate-500 hover:bg-transparent hover:text-slate-900"
            >
              <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm transition-all group-hover:shadow-md">
                <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
              </div>
            </Button>
          )}
        </div>

        {/* 🧭 CONSOLIDATED SUB-NAV - Moved to Layout */}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 space-y-2 text-center"
        >
          <h1 className="text-4xl leading-none font-black tracking-tight text-slate-900 md:text-5xl">
            {selectedUnitId && currentUnit ? currentUnit.title : hi ? 'टॉपिक टेस्ट' : 'Topic Tests'}
          </h1>
          <p className="mx-auto max-w-xl font-medium text-slate-500">
            {selectedUnitId
              ? hi
                ? 'क्विक टेस्ट के लिए टॉपिक चुनें'
                : 'Select a topic for a quick 10-question check.'
              : hi
                ? 'शुरुआत करने के लिए एक यूनिट चुनें'
                : 'Choose a unit to explore specific topics and tests.'}
          </p>
        </motion.div>

        {/* Search only visible inside a unit */}
        {selectedUnitId && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative mx-auto mb-8 w-full max-w-md"
          >
            <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder={hi ? 'टॉपिक खोजें...' : 'Search topics...'}
              className="h-12 rounded-2xl border-slate-200 bg-white/70 pl-12 text-xs font-black tracking-widest uppercase shadow-sm backdrop-blur-md focus:border-slate-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </motion.div>
        )}

        {/* Content Area */}
        <div className="space-y-4 pb-20">
          <AnimatePresence mode="wait">
            {!selectedUnitId ? (
              /* VIEW 1: UNIT LIST */
              <motion.div
                key="unit-list"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {units.length > 0 ? (
                  units.map((unit, idx) => (
                    <QuizListItem
                      key={unit.id}
                      index={idx}
                      title={unit.title}
                      questions={unit.topics.length}
                      language={language}
                      colorVariant={
                        (['amber', 'emerald', 'pink', 'blue', 'indigo'] as const)[idx % 5]
                      }
                      onClick={() => setSelectedUnitId(unit.id)}
                    />
                  ))
                ) : (
                  <div className="rounded-[2.5rem] border border-dashed border-slate-100 bg-white py-20 text-center shadow-sm">
                    <h3 className="mb-2 text-lg font-black text-slate-900">
                      {hi ? 'आपकी जानकारी उपलब्ध नहीं है' : 'No units available'}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {hi ? 'कृपया बाद में प्रयास करें' : 'Please check back later.'}
                    </p>
                  </div>
                )}
              </motion.div>
            ) : (
              /* VIEW 2: TOPIC LIST */
              <motion.div
                key="topic-list"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                {filteredTopics.length > 0 ? (
                  filteredTopics.map((topic, index) => {
                    // 🔒 GRANULAR ACCESS CONTROL
                    // Rule 1: Admin & Pro bypass all checks
                    // Rule 2: Lite checks isLiteAccess OR isFreeAccess
                    // Rule 3: Free checks isFreeAccess
                    const isAdmin = (user as any)?.role === 'admin';
                    const effectiveTier = getUserTier(user as any);

                    const hasAccess =
                      isAdmin ||
                      effectiveTier === 'pro' ||
                      (effectiveTier === 'lite' && (topic.isLiteAccess || topic.isFreeAccess)) ||
                      topic.isFreeAccess;

                    const isLocked = !hasAccess;

                    return (
                      <QuizListItem
                        key={topic.id}
                        index={index}
                        title={topic.title}
                        questions={10} // Standard topic test
                        itemLabel={hi ? 'प्रश्न' : 'Questions'}
                        isLocked={isLocked}
                        isFree={topic.isFree}
                        attemptsLeft={topic.attemptsLeft}
                        maxAttempts={topic.maxRetries}
                        language={language}
                        colorVariant={
                          (['amber', 'emerald', 'pink', 'blue', 'indigo'] as const)[index % 5]
                        }
                        isLoading={loadingId === topic.id}
                        onClick={() => {
                          if (!isLocked) setLoadingId(topic.id);
                          handleTopicClick(selectedUnitId, topic);
                        }}
                        onMouseEnter={() => {
                          if (!isLocked && topic.testId) {
                            router.prefetch(
                              `/syllabus/quiz/play?unitId=${selectedUnitId}&testId=${topic.testId}`
                            );
                          }
                        }}
                        onTouchStart={() => {
                          if (!isLocked && topic.testId) {
                            router.prefetch(
                              `/syllabus/quiz/play?unitId=${selectedUnitId}&testId=${topic.testId}`
                            );
                          }
                        }}
                      />
                    );
                  })
                ) : (
                  <div className="rounded-[2.5rem] border border-dashed border-slate-100 bg-white py-20 text-center shadow-sm">
                    <h3 className="mb-2 text-lg font-black text-slate-900">
                      {hi ? 'कोई टॉपिक नहीं मिला' : 'No topics found'}
                    </h3>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <SyllabusLockModal open={paywallOpen} onOpenChange={setPaywallOpen} />

      {/* Global Loader Overlay */}
      {isStarting && (
        <GlobalLoader
          variant="overlay"
          label={hi ? 'आपका टेस्ट तैयार हो रहा है...' : 'Preparing your test...'}
        />
      )}
    </div>
  </Fragment>
  );
}

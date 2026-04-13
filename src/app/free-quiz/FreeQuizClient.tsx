'use client';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🆓 FREE QUIZ CLIENT — Test listing + subject/unit filter
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// QuizListItem reuse — same look as PYQ page
// Filter modal — subject + unit wise filter (compact)
// Hindi/English bilingual — useSettingsStore se language
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Sparkles, Filter, X, BookOpen, Clock, ChevronRight } from 'lucide-react';
import { useSettingsStore } from '@/store/useSettingsStore';
import { QuizListItem } from '@/components/QuizListItem';
import { ConnectSocials } from '@/components/ConnectSocials';
import { QUIZ_CONSTANTS } from '@/config/quiz';
import { UPSC_UNITS } from './constants';

// Subjects list — filter me use hoga
const SUBJECTS = [
  { value: 'History', label: 'History', labelHi: 'इतिहास' },
  { value: 'Art & Culture', label: 'Art & Culture', labelHi: 'कला एवं संस्कृति' },
  { value: 'Geography', label: 'Geography', labelHi: 'भूगोल' },
  { value: 'Environment', label: 'Environment', labelHi: 'पर्यावरण' },
  { value: 'Polity', label: 'Polity', labelHi: 'राजव्यवस्था' },
  { value: 'Economy', label: 'Economy', labelHi: 'अर्थव्यवस्था' },
  { value: 'Science', label: 'Science & Tech', labelHi: 'विज्ञान एवं प्रौद्योगिकी' },
  { value: 'Current Affairs', label: 'Current Affairs', labelHi: 'समसामयिकी' },
  { value: 'International Relations', label: 'International Relations', labelHi: 'अंतर्राष्ट्रीय संबंध' },
  { value: 'Ethics', label: 'Ethics', labelHi: 'नीतिशास्त्र' },
];

interface FreeQuiz {
  id: string;
  title: string;
  titleEn: string | null;
  slug: string;
  description: string | null;
  totalQuestions: number | null;
  unitId: string | null;
  tags: unknown;
  createdAt: Date | string | null;
}

export default function FreeQuizClient({ quizzes }: { quizzes: FreeQuiz[] }) {
  const router = useRouter();
  const { language } = useSettingsStore();
  const hi = language === 'hi';

  // Filter state — subject aur unit wise
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
  const [loadingTestId, setLoadingTestId] = useState<string | null>(null);

  // Tags se subject nikalo — har test ke tags me subject hoga
  const getTestSubject = (quiz: FreeQuiz): string | null => {
    const tags = quiz.tags as string[] | null;
    if (!tags || !Array.isArray(tags)) return null;
    // Tags me se subject match karo
    const match = SUBJECTS.find((s) => tags.includes(s.value));
    return match?.value || tags[0] || null;
  };

  // Filter logic — subject + unit se match karo
  const filteredQuizzes = useMemo(() => {
    let result = quizzes;
    if (selectedSubject) {
      result = result.filter((q) => getTestSubject(q) === selectedSubject);
    }
    if (selectedUnit) {
      result = result.filter((q) => q.unitId === selectedUnit);
    }
    return result;
  }, [quizzes, selectedSubject, selectedUnit]);

  // Active filter count — badge me dikhega
  const activeFilters = (selectedSubject ? 1 : 0) + (selectedUnit ? 1 : 0);

  // Clear all filters ek click me
  const clearFilters = () => {
    setSelectedSubject(null);
    setSelectedUnit(null);
  };

  // Test click → play page pe le jao
  const handleQuizClick = (quiz: FreeQuiz) => {
    setLoadingTestId(quiz.id);
    router.push(`/free-quiz/play?testId=${quiz.id}`);
  };

  // Prefetch quiz data
  useEffect(() => {
    filteredQuizzes.slice(0, 10).forEach((quiz) => {
      router.prefetch(`/free-quiz/play?testId=${quiz.id}`);
    });
  }, [filteredQuizzes, router]);

  // Unit ka display name — "Unit 1" ya "यूनिट 1"
  const getUnitLabel = (unitId: string | null): string => {
    if (!unitId) return '';
    const unit = UPSC_UNITS.find((u) => u.id === unitId);
    if (!unit) return unitId.replace('unit_', 'U');
    return hi ? unit.subjectHi : unit.subject;
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-slate-50">
      {/* ── Header — sticky, same style as PYQ page ───────────── */}
      <div className="sticky top-14 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-3xl px-4 pt-4 pb-4 sm:px-6">
          <div className="flex flex-col gap-3">
            {/* Title row */}
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <div className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 sm:h-10 sm:w-10">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h1 className="text-lg font-black tracking-tight text-slate-900 sm:text-xl">
                    {hi ? 'UPSC 2026 — फ्री डेली क्विज़' : 'UPSC 2026 — Free Daily Quiz'}
                  </h1>
                  <p className="text-xs text-slate-500">
                    {hi
                      ? 'हर रोज़ नए प्रश्न, बिल्कुल मुफ़्त'
                      : 'Fresh questions daily, absolutely free'}
                  </p>
                </div>
              </div>

              {/* ── Connect with Us — Premium Social Box ──────────────── */}
              <ConnectSocials />
            </div>

            {/* ── Filter Button + Active Filters ──────────────── */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilterOpen(true)}
                className="gap-2 rounded-full border-slate-200 px-4 text-xs font-bold transition-transform active:scale-95"
              >
                <Filter className="h-3.5 w-3.5" />
                {hi ? 'फ़िल्तर' : 'Filter'}
                {activeFilters > 0 && (
                  <Badge className="ml-1 h-5 w-5 rounded-full bg-indigo-600 p-0 text-[10px] text-white">
                    {activeFilters}
                  </Badge>
                )}
              </Button>
              {selectedSubject && (
                <Badge
                  variant="outline"
                  className="gap-1 rounded-full border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs text-indigo-700"
                >
                  {hi
                    ? SUBJECTS.find((s) => s.value === selectedSubject)?.labelHi
                    : selectedSubject}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedSubject(null)} />
                </Badge>
              )}
              {selectedUnit && (
                <Badge
                  variant="outline"
                  className="gap-1 rounded-full border-amber-200 bg-amber-50 px-2.5 py-1 text-xs text-amber-700"
                >
                  Unit {selectedUnit.replace('unit_', '')}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedUnit(null)} />
                </Badge>
              )}
              {activeFilters > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-xs font-medium text-slate-400 transition-transform hover:text-red-500 active:scale-90"
                >
                  {hi ? 'सब हटाओ' : 'Clear'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Quiz List ────────────────────────────────────────── */}
      <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 pb-8 sm:px-6">
        <div className="mb-4 flex items-center justify-between text-xs text-slate-500">
          <span className="font-bold">
            {filteredQuizzes.length} {hi ? 'टेस्ट उपलब्ध' : 'Tests Available'}
          </span>
        </div>

        <div className="space-y-4">
          {filteredQuizzes.length === 0 ? (
            <div className="py-20 text-center">
              <BookOpen className="mx-auto mb-4 h-12 w-12 text-slate-300" />
              <p className="font-medium text-slate-400">
                {hi ? 'कोई टेस्ट नहीं मिला' : 'No tests found'}
              </p>
              {activeFilters > 0 && (
                <button
                  onClick={clearFilters}
                  className="mt-2 text-sm text-indigo-500 hover:underline"
                >
                  {hi ? 'फ़िल्टर हटाओ' : 'Clear filters'}
                </button>
              )}
            </div>
          ) : (
            filteredQuizzes.map((quiz, idx) => {
              const subject = getTestSubject(quiz);
              const unitLabel = getUnitLabel(quiz.unitId);

              return (
                <div key={quiz.id} className="relative">
                  <QuizListItem
                    index={idx}
                    title={hi ? quiz.title : quiz.titleEn || quiz.title}
                    questions={quiz.totalQuestions || undefined}
                    itemLabel={hi ? 'प्रश्न' : 'Questions'}
                    marks={(quiz.totalQuestions || 0) * QUIZ_CONSTANTS.MARKS_PER_QUESTION}
                    duration={Math.ceil(
                      (quiz.totalQuestions || 0) * QUIZ_CONSTANTS.TIME_PER_QUESTION_MINUTES
                    )}
                    isLocked={false}
                    isFree={true}
                    language={language}
                    colorVariant={
                      (['emerald', 'blue', 'amber', 'pink', 'indigo'] as const)[idx % 5]
                    }
                    isLoading={loadingTestId === quiz.id}
                    onClick={() => handleQuizClick(quiz)}
                    onMouseEnter={() => router.prefetch(`/free-quiz/play?testId=${quiz.id}`)}
                  />
                  <div className="mt-1.5 flex items-center gap-2 pl-16 sm:pl-20">
                    {subject && (
                      <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold text-slate-600">
                        📚{' '}
                        {hi
                          ? SUBJECTS.find((s) => s.value === subject)?.labelHi || subject
                          : subject}
                      </span>
                    )}
                    {quiz.unitId && (
                      <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold text-slate-600">
                        🏛️ Unit {quiz.unitId.replace('unit_', '')}
                        {unitLabel ? ` · ${unitLabel}` : ''}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Filter Modal — Subject + Unit select ─────────────── */}
      <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
        <DialogContent className="max-w-sm sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-black">
              <Filter className="h-4 w-4 text-indigo-600" />
              {hi ? 'टेस्ट फ़िल्टर करो' : 'Filter Tests'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            <div>
              <p className="mb-2 text-xs font-bold tracking-wider text-slate-500 uppercase">
                {hi ? 'विषय चुनो' : 'Select Subject'}
              </p>
              <div className="flex flex-wrap gap-2">
                {SUBJECTS.map((sub) => (
                  <button
                    key={sub.value}
                    onClick={() =>
                      setSelectedSubject(selectedSubject === sub.value ? null : sub.value)
                    }
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-xs font-bold transition-all active:scale-95',
                      selectedSubject === sub.value
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    )}
                  >
                    {hi ? sub.labelHi : sub.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-bold tracking-wider text-slate-500 uppercase">
                {hi ? 'यूनिट चुनो' : 'Select Unit'}
              </p>
              <div className="flex flex-wrap gap-2">
                {UPSC_UNITS.map((unit) => (
                  <button
                    key={unit.id}
                    onClick={() => setSelectedUnit(selectedUnit === unit.id ? null : unit.id)}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-xs font-bold transition-all active:scale-95',
                      selectedUnit === unit.id
                        ? 'border-amber-500 bg-amber-50 text-amber-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    )}
                  >
                    U{unit.id.replace('unit_', '')}
                    <span className="ml-1 hidden text-[10px] font-normal opacity-70 sm:inline">
                      {hi ? unit.subjectHi : unit.subject}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 rounded-full text-xs font-bold active:scale-95"
                onClick={clearFilters}
              >
                {hi ? 'सब हटाओ' : 'Clear All'}
              </Button>
              <Button
                size="sm"
                className="flex-1 rounded-full bg-indigo-600 text-xs font-bold hover:bg-indigo-700 active:scale-95"
                onClick={() => setFilterOpen(false)}
              >
                {hi ? 'लागू करो' : 'Apply'}
                <ChevronRight className="ml-1 h-3 w-3" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

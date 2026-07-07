'use client';

import { useState, useMemo } from 'react';
import { ShieldCheck, AlertTriangle, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { QRow } from './PyqQuestionList';

function getExpectedDistribution(paperNum: number, year: number, part: 'A' | 'B' | 'UNIFIED'): { marks: number; expected: number }[] {
  // UPSC Paper 4, 5, 6 -> GS1, GS2, GS3
  if (paperNum === 4 || paperNum === 5 || paperNum === 6) {
    return [
      { marks: 10, expected: 10 },
      { marks: 15, expected: 10 },
    ];
  } 
  // UPSC Paper 7 -> GS4 (Ethics)
  else if (paperNum === 7) {
    if (part === 'A') {
      return [
        { marks: 10, expected: 13 },
      ];
    } else if (part === 'B') {
      return [
        { marks: 20, expected: 6 }, // Case studies
      ];
    }
    return [
      { marks: 10, expected: 13 },
      { marks: 20, expected: 6 },
    ];
  } 
  // UPSC Paper 3 -> Essay
  else if (paperNum === 3) {
    return [
      { marks: 125, expected: 2 },
    ];
  }
  // UPSC Paper 8, 9 -> Optional 1, 2
  else if (paperNum === 8 || paperNum === 9) {
    return [
      // Variable marking, so we just provide common ones
      { marks: 10, expected: 5 },
      { marks: 15, expected: 5 },
      { marks: 20, expected: 5 },
    ];
  }
  // Paper 1, 2 -> Qualifying (300m)
  return [];
}

export default function AdminInsightsPanel({
  questions,
  selectedPaper,
  themeDeep,
  onHide,
}: {
  questions: QRow[];
  selectedPaper?: { paperNumber?: number; examYear?: number } | null;
  themeDeep: boolean;
  onHide: () => void;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const stats = useMemo(() => {
    if (!questions || questions.length === 0) return null;

    const distribution: Record<number, number> = {};
    const distributionA: Record<number, number> = {};
    const distributionB: Record<number, number> = {};
    const totalQuestionsCount = questions.length;
    let totalQuestionsA = 0;
    let totalQuestionsB = 0;
    let computedTotalMarks = 0;
    let computedTotalMarksA = 0;
    let computedTotalMarksB = 0;
    const unitCounts: Record<string, number> = {};

    for (const q of questions) {
      const marks = Number(q.marks) || 0;
      distribution[marks] = (distribution[marks] || 0) + 1;
      computedTotalMarks += marks;

      const part = (q.part || 'A').toUpperCase().trim();
      if (part === 'A') {
        distributionA[marks] = (distributionA[marks] || 0) + 1;
        totalQuestionsA++;
        computedTotalMarksA += marks;
      } else if (part === 'B') {
        distributionB[marks] = (distributionB[marks] || 0) + 1;
        totalQuestionsB++;
        computedTotalMarksB += marks;
      } else {
        distributionA[marks] = (distributionA[marks] || 0) + 1;
        totalQuestionsA++;
        computedTotalMarksA += marks;
      }

      const unit = q.unitNumber || 1;
      const key = `Part ${part} - Unit ${unit}`;
      unitCounts[key] = (unitCounts[key] || 0) + 1;
    }

    const paperNum = selectedPaper?.paperNumber ?? 1;
    const year = selectedPaper?.examYear ?? 2020;

    let expectedTotalMarks = 250;
    let expectedTotalQuestions = 20;
    let patternName = 'Unknown Pattern';
    let expectedDetails = '';

    if (paperNum === 4 || paperNum === 5 || paperNum === 6) {
      expectedTotalMarks = 250;
      expectedTotalQuestions = 20;
      patternName = `GS Pattern (250m)`;
      expectedDetails = `20 Questions (10x10m + 10x15m)`;
    } else if (paperNum === 7) {
      expectedTotalMarks = 250;
      expectedTotalQuestions = 19;
      patternName = `Ethics Pattern (250m)`;
      expectedDetails = `Section A (13x10m) + Section B (6x20m Case Studies)`;
    } else if (paperNum === 3) {
      expectedTotalMarks = 250;
      expectedTotalQuestions = 2;
      patternName = `Essay Pattern (250m)`;
      expectedDetails = `2 Essays (125m each)`;
    } else if (paperNum === 8 || paperNum === 9) {
      expectedTotalMarks = 250;
      expectedTotalQuestions = 8;
      patternName = `Optional Pattern (250m)`;
      expectedDetails = `Typically 8 Questions in 2 Sections`;
    } else if (paperNum === 1 || paperNum === 2) {
      expectedTotalMarks = 300;
      expectedTotalQuestions = 15; // Varies widely
      patternName = `Qualifying Pattern (300m)`;
      expectedDetails = `Comprehension, Précis, Vocabulary, Translation, etc.`;
    }

    const warnings: string[] = [];
    if (computedTotalMarks > 0 && computedTotalMarks !== expectedTotalMarks) {
      warnings.push(`Total marks: found ${computedTotalMarks}, expected ${expectedTotalMarks}.`);
    }

    if (paperNum >= 4 && paperNum <= 6) {
      if (totalQuestionsCount > 0 && totalQuestionsCount !== 20) {
        warnings.push(`Found ${totalQuestionsCount} questions (expected 20 questions).`);
      }
    } else if (paperNum === 7) {
      if (totalQuestionsCount > 0 && totalQuestionsCount !== 19) {
        warnings.push(`Found ${totalQuestionsCount} questions (expected 19 questions).`);
      }
    } else if (paperNum === 3) {
      if (totalQuestionsCount > 0 && totalQuestionsCount !== 2) {
        warnings.push(`Found ${totalQuestionsCount} questions (expected 2 essays).`);
      }
    }

    return {
      distribution,
      distributionA,
      distributionB,
      totalQuestionsCount,
      totalQuestionsA,
      totalQuestionsB,
      computedTotalMarks,
      computedTotalMarksA,
      computedTotalMarksB,
      expectedTotalMarks,
      expectedTotalQuestions,
      patternName,
      expectedDetails,
      warnings,
      unitCounts,
    };
  }, [questions, selectedPaper]);

  if (!stats) return null;

  const hasWarnings = stats.warnings.length > 0;
  const hasPartB = Object.keys(stats.distributionB).length > 0 || stats.totalQuestionsB > 0;

  const paperNum = selectedPaper?.paperNumber ?? 1;
  const year = selectedPaper?.examYear ?? 2020;

  const expectedQuestionsA = paperNum <= 3 ? 30 : (paperNum === 4 && year >= 2024 ? 28 : null);
  const expectedMarksA = paperNum <= 3 ? 150 : (paperNum === 4 && year >= 2024 ? 150 : null);
  
  const expectedQuestionsB = paperNum <= 3 ? 30 : (paperNum === 4 && year >= 2024 ? 21 : null);
  const expectedMarksB = paperNum <= 3 ? 150 : (paperNum === 4 && year >= 2024 ? 150 : null);

  const expectedListA = getExpectedDistribution(paperNum, year, 'A');
  const expectedListB = getExpectedDistribution(paperNum, year, 'B');
  const expectedListUnified = getExpectedDistribution(paperNum, year, 'UNIFIED');

  const getMergedDistribution = (
    expectedList: { marks: number; expected: number }[],
    foundDistribution: Record<number, number>
  ) => {
    const mergedMap = new Map<number, { expected: number; found: number }>();
    
    // Add all expected first
    for (const item of expectedList) {
      mergedMap.set(item.marks, { expected: item.expected, found: 0 });
    }
    
    // Add or update with found
    for (const [mStr, count] of Object.entries(foundDistribution)) {
      const marks = Number(mStr);
      const existing = mergedMap.get(marks);
      if (existing) {
        existing.found = count;
      } else {
        mergedMap.set(marks, { expected: 0, found: count });
      }
    }
    
    // Convert to sorted array
    return Array.from(mergedMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([marks, val]) => ({
        marks,
        expected: val.expected,
        found: val.found,
      }));
  };

  const mergedA = getMergedDistribution(expectedListA, stats.distributionA);
  const mergedB = getMergedDistribution(expectedListB, stats.distributionB);
  const mergedUnified = getMergedDistribution(expectedListUnified, stats.distribution);

  if (isCollapsed) {
    return (
      <div
        className={cn(
          'mb-6 rounded-2xl border px-4 py-2.5 shadow-sm backdrop-blur-md flex items-center justify-between gap-4 transition-all duration-300',
          themeDeep
            ? 'border-sky-500/10 bg-slate-900/30 text-sky-300'
            : 'border-sky-100 bg-sky-50/10 text-sky-900 shadow-sm'
        )}
      >
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold leading-none">
          <span className="flex h-2.5 w-2.5 rounded-full bg-sky-500 animate-pulse shrink-0" />
          <span className="font-black uppercase tracking-wider text-[10px] text-sky-600 dark:text-sky-400">🔒 Insights</span>
          <span className="opacity-30">|</span>
          <span className="tabular-nums font-black text-slate-700 dark:text-slate-200">
            {stats.totalQuestionsCount} Qs · {stats.computedTotalMarks}m · {stats.patternName}
          </span>
          {hasWarnings && (
            <span className="ml-1 rounded-full bg-amber-500/15 border border-amber-500/25 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-500">
              ⚠️ Mismatch
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsCollapsed(false)}
            className={cn(
              'text-[10px] font-black uppercase tracking-wider rounded-lg px-2.5 py-1 transition-all active:scale-95 border',
              themeDeep
                ? 'border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-900'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            )}
          >
            Expand
          </button>
          <button
            type="button"
            onClick={onHide}
            className={cn(
              'text-[10px] font-black uppercase tracking-wider rounded-lg px-2.5 py-1 transition-all active:scale-95 border',
              themeDeep
                ? 'border-red-950/30 bg-red-950/20 text-red-400 hover:bg-red-900/30'
                : 'border-red-100 bg-red-50 text-red-600 hover:bg-red-100/50'
            )}
          >
            Hide
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'mb-6 rounded-3xl border p-5 shadow-lg backdrop-blur-md transition-all duration-300 relative',
        themeDeep
          ? 'border-sky-500/20 bg-slate-900/40 text-slate-100 shadow-black/40'
          : 'border-sky-100 bg-sky-50/20 text-slate-800 shadow-sky-100/40'
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-dashed pb-3.5 mb-4">
        <div className="flex items-center gap-2">
          <div className={cn('p-1.5 rounded-lg', themeDeep ? 'bg-sky-950 text-sky-400' : 'bg-sky-100 text-sky-600')}>
            <ShieldCheck className="h-4.5 w-4.5" />
          </div>
          <div>
            <h4 className="text-sm font-black tracking-tight uppercase text-sky-950 dark:text-sky-300">🔒 Admin Insights & Verification</h4>
            <p className="text-[10px] font-semibold text-slate-500">Real-time DB counts, marks structure, and syllabus symmetry</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {hasWarnings ? (
            <div className={cn('flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wider', themeDeep ? 'bg-amber-950/70 border border-amber-500/30 text-amber-300 animate-pulse' : 'bg-amber-50 border border-amber-200 text-amber-800')}>
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Pattern Mismatch ({stats.warnings.length})</span>
            </div>
          ) : (
            <div className={cn('flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wider', themeDeep ? 'bg-emerald-950/70 border border-emerald-500/30 text-emerald-300' : 'bg-emerald-50 border border-emerald-200 text-emerald-800')}>
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Perfect Pattern Match</span>
            </div>
          )}
          
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsCollapsed(true)}
              className={cn(
                'text-[10px] font-black uppercase tracking-wider rounded-lg px-2.5 py-1 transition-all active:scale-95 border',
                themeDeep
                  ? 'border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-900'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              )}
            >
              Minimize
            </button>
            <button
              type="button"
              onClick={onHide}
              className={cn(
                'text-[10px] font-black uppercase tracking-wider rounded-lg px-2.5 py-1 transition-all active:scale-95 border',
                themeDeep
                  ? 'border-red-950/30 bg-red-950/20 text-red-400 hover:bg-red-900/30'
                  : 'border-red-100 bg-red-50 text-red-600 hover:bg-red-100/50'
              )}
            >
              Hide
            </button>
          </div>
        </div>
      </div>

      {/* Main Stat Cards: Styled matching custom Hues (Sky, Emerald, Amber) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        {/* Total Questions: themed with Sky */}
        <div className={cn('p-3.5 rounded-2xl border flex flex-col justify-between transition-all', themeDeep ? 'bg-slate-950/45 border-sky-500/20 text-slate-100' : 'bg-sky-50/50 border-sky-100 text-sky-950')}>
          <span className="text-[10px] font-black text-slate-500 dark:text-sky-400 uppercase tracking-wider">Total Questions</span>
          <span className="text-2xl font-black mt-1.5 tracking-tight tabular-nums flex items-baseline gap-1">
            {stats.totalQuestionsCount}
            <span className="text-xs font-bold text-slate-400 dark:text-sky-300/60">/ {stats.expectedTotalQuestions} expected</span>
          </span>
        </div>

        {/* Total Marks: themed with Emerald */}
        <div className={cn('p-3.5 rounded-2xl border flex flex-col justify-between transition-all', themeDeep ? 'bg-slate-950/45 border-emerald-500/20 text-slate-100' : 'bg-emerald-50/50 border-emerald-100 text-emerald-950')}>
          <span className="text-[10px] font-black text-slate-500 dark:text-emerald-400 uppercase tracking-wider">Total Paper Marks</span>
          <span className="text-2xl font-black mt-1.5 tracking-tight tabular-nums flex items-baseline gap-1">
            {stats.computedTotalMarks}
            <span className="text-xs font-bold text-slate-400 dark:text-emerald-300/60">/ {stats.expectedTotalMarks} expected</span>
          </span>
        </div>

        {/* Detected Structure: themed with Amber */}
        <div className={cn('p-3.5 rounded-2xl border flex flex-col justify-center transition-all', themeDeep ? 'bg-slate-950/45 border-amber-500/20 text-slate-100' : 'bg-amber-50/50 border-amber-100 text-amber-950')}>
          <span className="text-[10px] font-black text-slate-500 dark:text-amber-400 uppercase tracking-wider">Detected Structure</span>
          <span className="text-sm font-extrabold mt-1 text-amber-600 dark:text-amber-400 whitespace-normal leading-tight">
            {stats.patternName || 'Custom Pattern'}
          </span>
          <span className="text-[9px] font-medium text-slate-400 dark:text-amber-300/70 mt-1 leading-normal">
            {stats.expectedDetails}
          </span>
        </div>
      </div>

      {/* Part-wise breakdown cards: alternating Emerald & Pink or Sky */}
      {hasPartB ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Part A Card: themed with Emerald */}
          <div className={cn('p-4 rounded-2xl border flex flex-col justify-between transition-all', themeDeep ? 'bg-slate-950/40 border-emerald-500/10' : 'bg-emerald-50/20 border-emerald-100/70 shadow-xs')}>
            <div>
              <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1.5 mb-2.5">
                <Layers className="h-3.5 w-3.5" />
                Part A (Section A)
              </span>
              <div className="flex justify-between items-baseline mb-4 border-b border-emerald-100/50 dark:border-slate-800/50 pb-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Questions: <strong className={themeDeep ? 'text-emerald-300' : 'text-emerald-900'}>{stats.totalQuestionsA}</strong> {expectedQuestionsA !== null && `/ ${expectedQuestionsA} expected`}
                </span>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Marks: <strong className={themeDeep ? 'text-emerald-300' : 'text-emerald-900'}>{stats.computedTotalMarksA}</strong> {expectedMarksA !== null && `/ ${expectedMarksA} expected`}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {mergedA.map(({ marks, expected, found }) => {
                const isMismatch = expected > 0 && found !== expected;
                return (
                  <div
                    key={marks}
                    className={cn(
                      'flex items-center justify-between rounded-xl px-2.5 py-1.5 text-xs font-bold border shadow-xs transition-all',
                      isMismatch
                        ? themeDeep ? 'bg-amber-950/20 border-amber-500/20 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-800'
                        : themeDeep ? 'bg-slate-900/60 border-slate-800/40 text-slate-300' : 'bg-white border-slate-200/60 text-slate-700'
                    )}
                  >
                    <span className="rounded bg-emerald-600 px-1.5 py-0.5 text-[9px] font-black text-white uppercase tracking-wider">{marks}m</span>
                    <span className="tabular-nums font-extrabold text-slate-700 dark:text-slate-200">
                      {found} <span className="opacity-40 font-normal">/ {expected || '?'} expected</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Part B Card: themed with Pink */}
          <div className={cn('p-4 rounded-2xl border flex flex-col justify-between transition-all', themeDeep ? 'bg-slate-950/40 border-pink-500/10' : 'bg-pink-50/20 border-pink-100/70 shadow-xs')}>
            <div>
              <span className="text-[10px] font-black text-pink-600 dark:text-pink-400 uppercase tracking-widest flex items-center gap-1.5 mb-2.5">
                <Layers className="h-3.5 w-3.5" />
                Part B (Section B)
              </span>
              <div className="flex justify-between items-baseline mb-4 border-b border-pink-100/50 dark:border-slate-800/50 pb-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Questions: <strong className={themeDeep ? 'text-pink-300' : 'text-pink-900'}>{stats.totalQuestionsB}</strong> {expectedQuestionsB !== null && `/ ${expectedQuestionsB} expected`}
                </span>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Marks: <strong className={themeDeep ? 'text-pink-300' : 'text-pink-900'}>{stats.computedTotalMarksB}</strong> {expectedMarksB !== null && `/ ${expectedMarksB} expected`}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {mergedB.map(({ marks, expected, found }) => {
                const isMismatch = expected > 0 && found !== expected;
                return (
                  <div
                    key={marks}
                    className={cn(
                      'flex items-center justify-between rounded-xl px-2.5 py-1.5 text-xs font-bold border shadow-xs transition-all',
                      isMismatch
                        ? themeDeep ? 'bg-amber-950/20 border-amber-500/20 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-800'
                        : themeDeep ? 'bg-slate-900/60 border-slate-800/40 text-slate-300' : 'bg-white border-slate-200/60 text-slate-700'
                    )}
                  >
                    <span className="rounded bg-pink-600 px-1.5 py-0.5 text-[9px] font-black text-white uppercase tracking-wider">{marks}m</span>
                    <span className="tabular-nums font-extrabold text-slate-700 dark:text-slate-200">
                      {found} <span className="opacity-40 font-normal">/ {expected || '?'} expected</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Unified Structure Card: themed with Sky */
        <div className="grid grid-cols-1 gap-4 mb-4">
          <div className={cn('p-4 rounded-2xl border flex flex-col justify-between transition-all', themeDeep ? 'bg-slate-950/40 border-sky-500/10' : 'bg-sky-50/20 border-sky-100/70 shadow-xs')}>
            <div>
              <span className="text-[10px] font-black text-sky-600 dark:text-sky-400 uppercase tracking-widest flex items-center gap-1.5 mb-2.5">
                <Layers className="h-3.5 w-3.5" />
                Unified Structure
              </span>
              <div className="flex justify-between items-baseline mb-4 border-b border-sky-100/50 dark:border-slate-800/50 pb-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Questions: <strong className={themeDeep ? 'text-sky-300' : 'text-sky-900'}>{stats.totalQuestionsCount}</strong> {`/ ${stats.expectedTotalQuestions} expected`}
                </span>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Marks: <strong className={themeDeep ? 'text-sky-300' : 'text-sky-900'}>{stats.computedTotalMarks}</strong> {`/ ${stats.expectedTotalMarks} expected`}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              {mergedUnified.map(({ marks, expected, found }) => (
                <div key={marks} className={cn('flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold border shadow-xs transition-all', themeDeep ? 'bg-slate-900/60 border-slate-800/40 text-slate-300' : 'bg-white border-slate-200/60 text-slate-700')}>
                  <span className="rounded bg-sky-600 px-1.5 py-0.5 text-[9px] font-black text-white uppercase tracking-wider">{marks}m</span>
                  <span className="tabular-nums font-extrabold text-slate-700 dark:text-slate-200">{found} <span className="opacity-40 font-normal">/ {expected || '?'} expected</span></span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Unit counts section */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Object.entries(stats.unitCounts).slice(0, 8).map(([k, v]) => (
          <div key={k} className={cn('rounded-xl border p-3 text-sm font-bold', themeDeep ? 'bg-slate-900/30 border-slate-800/40 text-slate-300' : 'bg-white border-slate-100 text-slate-700')}>
            <div className="text-[11px] opacity-70">{k}</div>
            <div className="text-lg font-black mt-1 tabular-nums">{v}</div>
          </div>
        ))}
      </div>

      {/* Warnings list */}
      {hasWarnings && (
        <div className="mt-4 border-t pt-3 space-y-2">
          {stats.warnings.map((w, i) => (
            <div key={i} className="text-sm font-bold text-amber-700">{w}</div>
          ))}
        </div>
      )}
    </div>
  );
}

'use client';

import { useMemo, useState } from 'react';
import { TrendingUp, ChevronDown, ChevronUp, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { UnitDistributionStats, RepeatedQuestion } from '@/actions/pyq-analytics';
import { QuestionData } from './QuestionItem';
import { getCurrentExam } from '@/config/exams';
import { UnitCard } from './UnitCard';
import { useSettingsStore } from '@/store/useSettingsStore';
import { SyllabusLockModal } from '@/features/syllabus/components/SyllabusLockModal';
import { cn } from '@/lib/utils';

interface PaperAnalysisProps {
  examId?: string;
  stats: UnitDistributionStats[];
  repeatedQuestions: RepeatedQuestion[];
  isHindi: boolean;
  isPro?: boolean;
}

const FREE_YEAR = 2025;

export function PaperAnalysis({
  examId,
  stats,
  repeatedQuestions,
  isHindi,
  isPro: isProProp = false,
}: PaperAnalysisProps) {
  const [expandedYears, setExpandedYears] = useState<number[]>([]);
  const [lockModalOpen, setLockModalOpen] = useState(false);

  const { isSubscribed, user } = useSettingsStore();
  const isPro = isProProp || isSubscribed || user?.role === 'admin';

  const exam = useMemo(() => getCurrentExam(examId), [examId]);
  const subjectOrder = useMemo(
    () => new Map(exam.subjects.map((subject, index) => [subject, index])),
    [exam.subjects]
  );
  const statsByYear = useMemo(() => {
    const grouped = new Map<number, { stats: UnitDistributionStats[]; totalQuestions: number }>();
    for (const unitStat of stats) {
      const existing = grouped.get(unitStat.year);
      if (existing) {
        existing.stats.push(unitStat);
        existing.totalQuestions += unitStat.count;
      } else {
        grouped.set(unitStat.year, { stats: [unitStat], totalQuestions: unitStat.count });
      }
    }
    return grouped;
  }, [stats]);
  const years = useMemo(() => Array.from(statsByYear.keys()).sort((a, b) => b - a), [statsByYear]);
  const repeatCountByQuestionId = useMemo(() => {
    const map = new Map<string, number>();
    for (const repeated of repeatedQuestions) {
      map.set(repeated.questionId, repeated.count);
    }
    return map;
  }, [repeatedQuestions]);

  const toggleYear = (year: number) => {
    const isUnlocked = isPro || year === FREE_YEAR;
    if (!isUnlocked) {
      setLockModalOpen(true);
      return;
    }
    setExpandedYears((prev) =>
      prev.includes(year) ? prev.filter((y) => y !== year) : [...prev, year]
    );
  };

  // Helper to find repeat count
  const getRepeatCount = (questionId: string): number => repeatCountByQuestionId.get(questionId) || 0;

  return (
    <div className="space-y-6">
      <SyllabusLockModal
        open={lockModalOpen}
        onOpenChange={setLockModalOpen}
      />

      <div className="flex items-center gap-3 px-1">
        <TrendingUp className="h-6 w-6 text-emerald-400" />
        <h2 className="text-xl font-bold text-white sm:text-2xl">
          {isHindi ? 'पेपर वाइज विश्लेषण' : 'Paper-wise Analysis'}
        </h2>
      </div>

      <div className="space-y-4">
        {years.map((year) => {
          const yearBucket = statsByYear.get(year);
          if (!yearBucket) return null;
          const yearStats = yearBucket.stats;
          const totalQuestions = yearBucket.totalQuestions;
          const isUnlocked = isPro || year === FREE_YEAR;

          const sortedSections = [...yearStats];
          if (exam.layoutMode === 'UNIT_WISE') {
            sortedSections.sort((a, b) => {
              const numA = parseInt(a.unitId.replace('unit_', ''));
              const numB = parseInt(b.unitId.replace('unit_', ''));
              if (isNaN(numA)) return 1;
              if (isNaN(numB)) return -1;
              return numA - numB;
            });
          } else {
            // Sort by subject list order in config
            sortedSections.sort((a, b) => {
              const orderA = subjectOrder.get(a.unitId) ?? 99;
              const orderB = subjectOrder.get(b.unitId) ?? 99;
              return orderA - orderB;
            });
          }

          const isExpanded = expandedYears.includes(year);

          return (
            <div key={year} className="relative">
              <div className="absolute -inset-1 rounded-[2rem] bg-gradient-to-r from-emerald-500/20 to-teal-500/20 opacity-20 blur-xl" />
              <Card
                className={cn(
                  'relative z-10 overflow-hidden rounded-[2rem] border-slate-800 bg-slate-900 shadow-2xl transition-all',
                  !isUnlocked && 'opacity-75 grayscale-[0.5]'
                )}
              >
                {/* Year Header */}
                <div
                  className="flex cursor-pointer items-center justify-between border-b border-white/5 bg-transparent px-6 py-6"
                  onClick={() => toggleYear(year)}
                >
                  <div className="flex flex-col gap-1">
                    <div className="mb-1 flex items-center gap-2 text-sm font-medium tracking-wider text-slate-400 uppercase">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      {isUnlocked ? (
                        examId === 'upsc' ? (
                          isHindi ? (
                            'UPSC सिविल सेवा'
                          ) : (
                            'UPSC Civil Services'
                          )
                        ) : isHindi ? (
                          'UPSC सिविल सेवा'
                        ) : (
                          'UPSC Civil Services'
                        )
                      ) : (
                        <div className="flex items-center gap-1.5 text-amber-500/80">
                          <Lock className="h-3 w-3" />
                          {isHindi ? 'प्रीमियम अनलॉक करें' : 'Unlock Premium'}
                        </div>
                      )}
                    </div>
                    <h3 className="flex items-center gap-3 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                      {year}
                      <Badge
                        variant="outline"
                        className="hidden rounded-full border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-400 sm:inline-flex"
                      >
                        {totalQuestions} {isHindi ? 'प्रश्न' : 'Questions'}
                      </Badge>
                    </h3>
                  </div>

                  <div className="flex items-center gap-4">
                    <Badge
                      variant="secondary"
                      className="h-8 border border-slate-700 bg-slate-800 px-3 font-mono text-sm text-slate-300 sm:inline-flex"
                    >
                      {exam.layoutMode === 'UNIT_WISE'
                        ? isHindi
                          ? '10 यूनिट्स'
                          : '10 Units'
                        : `${sortedSections.length} ${isHindi ? 'विषय' : 'Subjects'}`}
                    </Badge>
                    <div
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 bg-slate-800 shadow-inner',
                        !isUnlocked && 'border-transparent bg-white/5'
                      )}
                    >
                      {isUnlocked ? (
                        isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-emerald-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-slate-400" />
                        )
                      ) : (
                        <Lock className="h-4 w-4 text-slate-500" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Year Content */}
                <AnimatePresence>
                  {isExpanded && isUnlocked && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <CardContent className="p-4 sm:p-6">
                        <div className="space-y-4">
                          {sortedSections.map((unitStat) => {
                            const questions: QuestionData[] = unitStat.questions.map((q) => ({
                              id: q.id,
                              text: q.text,
                              textEn: q.textEn,
                              year: q.year,
                              qNo: q.qNo,
                              subject: q.subject,
                              testTitle: `UPSC Prelims ${q.year}`,
                              options: q.options,
                              correctAnswer: q.correctAnswer,
                              extendedData: q.extendedData,
                              explanation: q.explanation,
                              explanationEn: q.explanationEn,
                            }));

                            return (
                              <UnitCard
                                key={`${year}-${unitStat.unitId}`}
                                examId={examId}
                                unitId={unitStat.unitId}
                                unitTitle={unitStat.unitTitle}
                                questionCount={unitStat.count}
                                totalQuestions={totalQuestions}
                                questions={questions}
                                isHindi={isHindi}
                                getRepeatCount={getRepeatCount}
                                variant="paper"
                                groupQuestionsByYear={false}
                                year={year}
                              />
                            );
                          })}
                        </div>
                      </CardContent>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}

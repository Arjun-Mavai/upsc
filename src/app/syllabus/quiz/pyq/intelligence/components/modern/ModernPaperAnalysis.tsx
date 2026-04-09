'use client';

import { useState } from 'react';
import { ChevronDown, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { UnitDistributionStats, RepeatedQuestion } from '@/actions/pyq-analytics';
import { QuestionData } from '../QuestionItem';
import { getCurrentExam } from '@/config/exams';
import { ModernUnitCard } from './ModernUnitCard';
import { useSettingsStore } from '@/store/useSettingsStore';
import { SyllabusLockModal } from '@/features/syllabus/components/SyllabusLockModal';
import { cn } from '@/lib/utils';

interface ModernPaperAnalysisProps {
  examId?: string;
  stats: UnitDistributionStats[];
  repeatedQuestions: RepeatedQuestion[];
  isHindi: boolean;
  isPro?: boolean;
}

const FREE_YEAR = 2025;

export function ModernPaperAnalysis({
  examId,
  stats,
  repeatedQuestions,
  isHindi,
  isPro: isProProp = false,
}: ModernPaperAnalysisProps) {
  const [expandedYears, setExpandedYears] = useState<number[]>([]);
  const [lockModalOpen, setLockModalOpen] = useState(false);

  const { isSubscribed, user } = useSettingsStore();
  const isPro = isProProp || isSubscribed || user?.role === 'admin';

  const years = Array.from(new Set(stats.map((s) => s.year))).sort((a, b) => b - a);

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

  const getRepeatCount = (questionId: string): number => {
    const match = repeatedQuestions.find((rq) => rq.questionId === questionId);
    return match?.count || 0;
  };

  return (
    <div className="space-y-8 pt-4">
      <SyllabusLockModal open={lockModalOpen} onOpenChange={setLockModalOpen} />

      <div className="flex items-center justify-between px-1">
        <h2 className="text-2xl font-bold tracking-tight text-[#1D1D1F] sm:text-3xl">
          {isHindi ? 'पेपर वाइज विश्लेषण' : 'Paper-wise Analysis'}
        </h2>
      </div>

      <div className="space-y-6">
        {years.map((year) => {
          const yearStats = stats.filter((s) => s.year === year);
          const totalQuestions = yearStats.reduce((acc, curr) => acc + curr.count, 0);
          const exam = getCurrentExam(examId);
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
            sortedSections.sort((a, b) => {
              const orderA = exam.subjects.indexOf(a.unitId);
              const orderB = exam.subjects.indexOf(b.unitId);
              return (orderA === -1 ? 99 : orderA) - (orderB === -1 ? 99 : orderB);
            });
          }

          const isExpanded = expandedYears.includes(year);

          return (
            <div
              key={year}
              className={cn(
                'rounded-[28px] border bg-white overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.02)] transition-colors',
                isUnlocked ? 'border-[#E5E5EA] hover:border-[#D1D1D6]' : 'border-[#F5F5F7] opacity-75'
              )}
            >
              {/* Year Header */}
              <div
                className="flex cursor-pointer items-center justify-between px-6 py-8"
                onClick={() => toggleYear(year)}
              >
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 text-[11px] font-bold tracking-widest text-[#86868B] uppercase">
                    {isUnlocked ? (
                      examId === 'upsc' ? (
                        isHindi ? 'UPSC सिविल सेवा' : 'UPSC Civil Services'
                      ) : (
                        isHindi ? 'UPSC सिविल सेवा' : 'UPSC Civil Services'
                      )
                    ) : (
                      <div className="flex items-center gap-1.5 text-[#86868B]">
                        <Lock className="h-3 w-3" />
                        {isHindi ? 'प्रीमियम अनलॉक करें' : 'Unlock Premium'}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <h3 className="text-3xl font-bold tracking-tight text-[#1D1D1F] sm:text-4xl">
                      {year}
                    </h3>
                    <span className="inline-flex items-center rounded-full bg-[#F5F5F7] px-3 py-1 text-xs font-semibold text-[#86868B]">
                      {totalQuestions} {isHindi ? 'प्रश्न' : 'Questions'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-5">
                  <span className="hidden sm:inline-flex text-xs font-semibold text-[#86868B] uppercase tracking-widest pl-4">
                    {exam.layoutMode === 'UNIT_WISE'
                      ? isHindi ? '10 यूनिट्स' : '10 Units'
                      : `${sortedSections.length} ${isHindi ? 'विषय' : 'Subjects'}`}
                  </span>
                  <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full bg-[#F5F5F7] text-[#86868B] transition-transform",
                    isExpanded && "rotate-180"
                  )}>
                    {isUnlocked ? (
                      <ChevronDown className="h-5 w-5" />
                    ) : (
                      <Lock className="h-4 w-4" />
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
                    className="overflow-hidden bg-[#FAFAFB]"
                  >
                    <div className="p-4 sm:p-6 sm:px-10 border-t border-[#F5F5F7] space-y-4">
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
                          <ModernUnitCard
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
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}

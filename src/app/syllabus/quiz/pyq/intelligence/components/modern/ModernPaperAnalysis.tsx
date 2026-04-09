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

const PASTEL_THEMES = [
  { bg: 'bg-[#F2F8FF]', border: 'border-[#D9EAFE]', hover: 'hover:bg-[#EAF4FF]', iconBg: 'bg-[#D9EAFE]' }, // Blue
  { bg: 'bg-[#FFF6E9]', border: 'border-[#FFE4C4]', hover: 'hover:bg-[#FFF1DE]', iconBg: 'bg-[#FFE4C4]' }, // Orange
  { bg: 'bg-[#F1FAEE]', border: 'border-[#D1EED1]', hover: 'hover:bg-[#E8F6E8]', iconBg: 'bg-[#D1EED1]' }, // Green
  { bg: 'bg-[#FEF1F2]', border: 'border-[#FDD1D4]', hover: 'hover:bg-[#FEE7E9]', iconBg: 'bg-[#FDD1D4]' }, // Red
  { bg: 'bg-[#FFFBED]', border: 'border-[#FFF0B3]', hover: 'hover:bg-[#FFF8D6]', iconBg: 'bg-[#FFF0B3]' }, // Yellow
  { bg: 'bg-[#F6F0FD]', border: 'border-[#E6D4F9]', hover: 'hover:bg-[#F0E5FC]', iconBg: 'bg-[#E6D4F9]' }, // Purple
];

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
    <div className="space-y-6 pt-4 px-1.5 sm:px-4">
      <SyllabusLockModal open={lockModalOpen} onOpenChange={setLockModalOpen} />

      <div className="flex items-center justify-between px-1">
        <h2 className="text-2xl font-bold tracking-tight text-[#1D1D1F] sm:text-3xl">
          {isHindi ? 'पेपर वाइज विश्लेषण' : 'Paper-wise Analysis'}
        </h2>
      </div>

      <div className="overflow-hidden rounded-[24px] sm:rounded-[32px] border border-[#E5E5EA] bg-white shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
        <div className="flex flex-col">
          {years.map((year, idx) => {
            const yearStats = stats.filter((s) => s.year === year);
            const totalQuestions = yearStats.reduce((acc, curr) => acc + curr.count, 0);
            const exam = getCurrentExam(examId);
            const isUnlocked = isPro || year === FREE_YEAR;
            const theme = PASTEL_THEMES[idx % PASTEL_THEMES.length];

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
                  "border-b border-[#F5F5F7] last:border-0 transition-colors",
                  isExpanded 
                    ? theme.bg 
                    : (idx % 2 === 0 ? theme.bg : "bg-white hover:bg-[#FAFAFB]")
                )}
              >
                {/* Year Header */}
                <div
                  className="flex cursor-pointer items-center justify-between p-4 sm:p-7 sm:gap-6"
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
                    <div className="flex items-center gap-3">
                      <h3 className="text-2xl font-bold tracking-tight text-[#1D1D1F] sm:text-3xl">
                        {year}
                      </h3>
                      <span className="inline-flex items-center rounded-full bg-white/60 backdrop-blur-sm px-3 py-1 text-xs font-semibold text-[#86868B] border border-white/50">
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
                      "flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300 shadow-sm",
                      isExpanded ? "bg-[#1D1D1F] text-white rotate-180" : "bg-white/60 text-[#86868B]"
                    )}>
                      {isUnlocked ? (
                        <ChevronDown className="h-4 w-4" />
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
                      transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                      className="overflow-hidden"
                    >
                      <div className={cn("border-t p-0", theme.border)}>
                        <div className="p-0">
                          {sortedSections.map((unitStat, unitIdx) => {
                            const unitTheme = PASTEL_THEMES[unitIdx % PASTEL_THEMES.length];
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
                                isFlat={true}
                                themeBg={unitTheme.bg}
                                themeBorder={unitTheme.border}
                              />
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

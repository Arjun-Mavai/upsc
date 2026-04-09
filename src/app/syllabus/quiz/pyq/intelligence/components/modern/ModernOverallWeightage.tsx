'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, Lock, ChevronRight, ArrowRight, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { OverallWeightageSubjectData } from '@/actions/pyq-analytics';
import { FREE_SUBJECTS } from '@/lib/pyq-constants';
import { SUBJECTS } from '@/lib/pyq-ui-constants';
import { TransitionLink } from '@/components/ui/transition-link';
import { QuestionData } from '../QuestionItem';
import { ModernQuestionList } from './ModernQuestionList';
import { getCurrentExam } from '@/config/exams';
import { useSettingsStore } from '@/store/useSettingsStore';
import { SyllabusLockModal } from '@/features/syllabus/components/SyllabusLockModal';

const PASTEL_THEMES = [
  { bg: 'bg-[#F5F9FF]', border: 'border-[#E1EBFD]', hover: 'hover:bg-[#EAF4FF]', iconBg: 'bg-[#E1EBFD]' }, // Blue
  { bg: 'bg-[#FFF9F2]', border: 'border-[#F9EAD9]', hover: 'hover:bg-[#FFF1DE]', iconBg: 'bg-[#F9EAD9]' }, // Ivory/Orange
  { bg: 'bg-[#F3FAF3]', border: 'border-[#E2F0E2]', hover: 'hover:bg-[#E8F6E8]', iconBg: 'bg-[#E2F0E2]' }, // Green
  { bg: 'bg-[#FFF5F6]', border: 'border-[#F9E4E6]', hover: 'hover:bg-[#FEE7E9]', iconBg: 'bg-[#F9E4E6]' }, // Red
  { bg: 'bg-[#FFFCF0]', border: 'border-[#F8F1D5]', hover: 'hover:bg-[#FFF8D6]', iconBg: 'bg-[#F8F1D5]' }, // Yellow
  { bg: 'bg-[#F9F6FF]', border: 'border-[#EDE8F9]', hover: 'hover:bg-[#F0E5FC]', iconBg: 'bg-[#EDE8F9]' }, // Purple
];

interface ModernOverallWeightageProps {
  examId?: string;
  simpleSubjectStats: Record<string, number>;
  subjectQuestionsData: OverallWeightageSubjectData[];
  isHindi: boolean;
  isPro?: boolean;
}

export function ModernOverallWeightage({
  examId,
  simpleSubjectStats,
  subjectQuestionsData,
  isHindi,
  isPro: isProProp = false,
}: ModernOverallWeightageProps) {
  const router = useRouter();
  const [expandedSubjects, setExpandedSubjects] = useState<string[]>([]);
  const [lockModalOpen, setLockModalOpen] = useState(false);

  const { isSubscribed, user } = useSettingsStore();
  const isPro = isProProp || isSubscribed || user?.role === 'admin' || user?.isSubscribed;

  const isUPSC = examId === 'upsc';
  const baseUrl = isUPSC ? '/upsc/intelligence' : '/syllabus/quiz/pyq/intelligence';

  const totalQuestions = useMemo(
    () => Object.values(simpleSubjectStats).reduce((sum, count) => sum + count, 0),
    [simpleSubjectStats]
  );

  const subjectsWithCounts = useMemo(() => {
    const exam = getCurrentExam(examId);

    if (isUPSC) {
      return Object.entries(simpleSubjectStats)
        .map(([subName, count]) => {
          const existingMeta = SUBJECTS.find((s) => s.name === subName || s.nameHi === subName);
          return {
            name: subName,
            nameHi: existingMeta?.nameHi || subName,
            icon: existingMeta?.icon || SUBJECTS[0].icon,
            count,
            percentage: totalQuestions > 0 ? Math.round((count / totalQuestions) * 100) : 0,
          };
        })
        .sort((a, b) => b.count - a.count);
    }

    const examSubjects = exam.subjects;
    const seenNames = new Set<string>();
    const uniqueSubjects = SUBJECTS.filter((sub) => {
      if (seenNames.has(sub.name)) return false;
      seenNames.add(sub.name);
      return true;
    });

    return uniqueSubjects
      .filter((sub) => examSubjects.includes(sub.name))
      .map((sub) => ({
        ...sub,
        count: simpleSubjectStats[sub.name] || 0,
        percentage:
          totalQuestions > 0
            ? Math.round(((simpleSubjectStats[sub.name] || 0) / totalQuestions) * 100)
            : 0,
      }))
      .filter((sub) => sub.count > 0 || examSubjects.includes(sub.name))
      .sort((a, b) => b.count - a.count);
  }, [simpleSubjectStats, totalQuestions, examId, isUPSC]);

  const toggleSubject = (subjectName: string) => {
    const isUnlocked = isPro || FREE_SUBJECTS.includes(subjectName);
    if (!isUnlocked) {
      setLockModalOpen(true);
      return;
    }
    setExpandedSubjects((prev) =>
      prev.includes(subjectName) ? prev.filter((s) => s !== subjectName) : [...prev, subjectName]
    );
  };

  useEffect(() => {
    router.prefetch(`${baseUrl}/questions?subject=All&source=subject`);
  }, [router, baseUrl]);

  return (
    <div className="space-y-6 pt-4 px-1.5 sm:px-4">
      <SyllabusLockModal open={lockModalOpen} onOpenChange={setLockModalOpen} />

      <div className="flex items-center justify-between px-1">
        <h2 className="text-2xl font-bold tracking-tight text-[#1D1D1F] sm:text-3xl">
          {isHindi ? 'कुल वेटेज' : 'Overall Weightage'}
        </h2>
        <span className="rounded-full bg-[#E5E5EA]/50 px-3 py-1 text-sm font-medium text-[#86868B]">
          {totalQuestions} {isHindi ? 'प्रश्न' : 'Questions'}
        </span>
      </div>

      <div className="overflow-hidden rounded-[24px] sm:rounded-[32px] border border-[#E5E5EA] bg-white shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
        <div className="flex flex-col">
          {subjectsWithCounts.map((sub, idx) => {
            const Icon = sub.icon;
            const isSubjectExpanded = expandedSubjects.includes(sub.name);
            const isUnlocked = isPro || FREE_SUBJECTS.includes(sub.name);
            const theme = PASTEL_THEMES[idx % PASTEL_THEMES.length];

            return (
              <div 
                key={sub.name} 
                className={cn(
                  "border-b border-[#F5F5F7] last:border-0 transition-colors",
                  isSubjectExpanded 
                    ? theme.bg 
                    : (idx % 2 === 0 ? theme.bg : "bg-white hover:bg-[#FAFAFB]")
                )}
              >
                <div
                  className={cn(
                    'flex cursor-pointer flex-col gap-3 p-4 sm:flex-row sm:items-center sm:p-6 sm:gap-6',
                    !isUnlocked && 'opacity-60 grayscale-[0.8]'
                  )}
                  onClick={() => toggleSubject(sub.name)}
                >
                  <div className="flex flex-1 items-center gap-4 sm:gap-5">
                    <div className={cn(
                      "flex h-12 w-12 sm:h-14 sm:w-14 flex-shrink-0 items-center justify-center rounded-[20px] transition-colors shadow-sm",
                      isSubjectExpanded ? "bg-white" : theme.iconBg
                    )}>
                      {isUnlocked ? (
                        <Icon className="h-6 w-6 text-[#1D1D1F]" />
                      ) : (
                        <Lock className="h-5 w-5 text-[#86868B]" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <h4 className="truncate text-base font-bold tracking-tight text-[#1D1D1F] sm:text-lg">
                          {isHindi ? sub.nameHi : sub.name}
                        </h4>
                        {!isPro && FREE_SUBJECTS.includes(sub.name) && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#1D1D1F] px-2 py-0.5 text-[9px] font-black tracking-widest text-white uppercase sm:px-2.5 sm:py-1">
                            <Sparkles className="h-2.5 w-2.5" />
                            {isHindi ? 'फ्री' : 'FREE'}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-[13px] font-semibold text-[#86868B]">
                          {sub.count} {isHindi ? 'प्रश्न' : 'Questions'}
                        </span>
                        <span className="h-1 w-1 rounded-full bg-[#D1D1D6]" />
                        <span className="text-[13px] font-bold text-[#1D1D1F]">
                          {sub.percentage}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pl-16 sm:gap-4 sm:pl-0">
                    <div className="flex-1 sm:flex-none">
                      {isUnlocked && isPro && (
                        <TransitionLink
                          href={`${baseUrl}/questions?subject=${encodeURIComponent(sub.name)}&source=subject`}
                          onClick={(e) => e.stopPropagation()}
                          className="group flex items-center justify-center gap-2 rounded-2xl border border-[#E5E5EA] bg-white px-4 py-2.5 text-[13px] font-bold text-[#1D1D1F] shadow-sm transition-all hover:shadow-md active:scale-[0.98] sm:px-5 sm:py-3"
                        >
                          {isHindi ? 'सभी देखें' : 'View All'}
                          <ArrowRight className="h-4 w-4 text-[#86868B] transition-transform group-hover:translate-x-1" />
                        </TransitionLink>
                      )}
                    </div>

                    <div className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300",
                      isSubjectExpanded ? "bg-[#1D1D1F] text-white" : "bg-[#F5F5F7] text-[#86868B]"
                    )}>
                      <ChevronDown
                        className={cn(
                          'h-4 w-4 transition-transform duration-300',
                          isSubjectExpanded && 'rotate-180'
                        )}
                      />
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {isSubjectExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                      className="overflow-hidden"
                    >
                      <div className={cn("border-t p-1 sm:p-8 sm:pt-4", theme.border)}>
                        <div className="p-0.5 sm:p-2">
                          {(() => {
                            const subjectData = subjectQuestionsData.find(
                              (data) => data.subject === sub.name || data.subject === sub.nameHi
                            );
                            const subjectQuestions = subjectData?.questions || [];
                            const mappedQuestions: QuestionData[] = subjectQuestions.map((q) => ({
                              id: q.id,
                              text: q.text,
                              textEn: q.textEn,
                              year: q.year,
                              qNo: q.qNo,
                              testTitle: q.testTitle,
                              subject: q.subject,
                              options: q.options,
                              correctAnswer: q.correctAnswer,
                              extendedData: q.extendedData,
                              explanation: q.explanation,
                              explanationEn: q.explanationEn,
                            }));

                            return mappedQuestions.length > 0 ? (
                              <div className="space-y-4">
                                <ModernQuestionList
                                  questions={mappedQuestions}
                                  isHindi={isHindi}
                                  maxVisible={5}
                                  showYears={true}
                                  examId={examId}
                                  isPro={isPro}
                                  onLockedClick={() => setLockModalOpen(true)}
                                  variant="flat"
                                />
                              </div>
                            ) : (
                              <p className="py-8 text-center text-sm font-medium text-[#86868B]">
                                {isHindi ? 'कोई प्रश्न नहीं मिले।' : 'No questions found.'}
                              </p>
                            );
                          })()}
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

      <div className="flex justify-center pt-4">
        {isPro ? (
          <TransitionLink
            href={`${baseUrl}/questions?subject=All&source=subject`}
            transitionTypes={['slide']}
            className="group flex h-14 w-full items-center justify-center rounded-full bg-[#1D1D1F] px-8 text-sm font-semibold tracking-wide text-white shadow-md transition-all hover:scale-[1.02] hover:bg-[#333336] active:scale-95 sm:w-auto sm:min-w-[320px]"
          >
            {isHindi ? 'सभी विषय के प्रश्न देखें' : 'View All Subject Questions'}
            <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </TransitionLink>
        ) : (
          <button
            onClick={() => setLockModalOpen(true)}
            className="group flex h-14 w-full items-center justify-center rounded-full bg-[#1D1D1F] px-8 text-sm font-semibold tracking-wide text-white shadow-md transition-all hover:scale-[1.02] hover:bg-[#333336] active:scale-95 sm:w-auto sm:min-w-[320px]"
          >
            {isHindi ? 'सभी विषय के प्रश्न देखें' : 'View All Subject Questions'}
            <Lock className="ml-2 h-4 w-4 opacity-70" />
          </button>
        )}
      </div>
    </div>
  );
}

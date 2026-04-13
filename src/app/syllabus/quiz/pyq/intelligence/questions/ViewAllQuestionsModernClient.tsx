'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Filter, Eye, EyeOff, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useSettingsStore } from '@/store/useSettingsStore';
import { formatUnitTitle } from '../components/shared/constants';
import { SyllabusLockModal } from '@/features/syllabus/components/SyllabusLockModal';
import { ModernQuestionList } from '../components/modern/ModernQuestionList';
import type { PyqQuestionListItem } from './pyqQuestionListItem';

interface ViewAllQuestionsModernClientProps {
  examId?: string;
  unitId: string;
  unitTitle: string;
  questions: PyqQuestionListItem[];
  source: 'paper' | 'overall' | 'topic' | 'subject';
  topicTitle?: string;
  year?: number;
  subject?: string;
  isPro?: boolean;
  onToggleMode: () => void;
}

export default function ViewAllQuestionsModernClient({
  examId,
  unitId,
  unitTitle,
  questions,
  source,
  topicTitle,
  year,
  subject,
  isPro = false,
  onToggleMode,
}: ViewAllQuestionsModernClientProps) {
  const router = useRouter();
  const { language } = useSettingsStore();
  const isHindi = language === 'hi';
  const [lockModalOpen, setLockModalOpen] = useState(false);

  const [showAllExpanded, setShowAllExpanded] = useState(false);
  const [filterYear, setFilterYear] = useState<number | null>(null);

  const searchParams = useSearchParams();
  const isPdfMode = searchParams.get('pdf_mode') === 'true';

  const uniqueYears = useMemo(() => {
    return Array.from(
      new Set(questions.map((q) => q.year).filter((y): y is number => y !== undefined))
    ).sort((a, b) => b - a);
  }, [questions]);

  const filteredQuestions = useMemo(() => {
    return filterYear ? questions.filter((q) => q.year === filterYear) : questions;
  }, [questions, filterYear]);

  useEffect(() => {
    if (isPdfMode && filteredQuestions.length > 0) {
      setShowAllExpanded(true);
    }
  }, [isPdfMode, filteredQuestions]);

  const pageTitle = useMemo(() => {
    const isUPSC = examId === 'upsc';
    const prefix = isUPSC ? 'UPSC Civil Services' : 'UPSC Civil Services';
    const yearRange = isUPSC ? '2015-2025' : '2020-2025';

    if (source === 'topic' && topicTitle) return topicTitle;
    if (source === 'paper' && year) return `${prefix} ${year} - ${formatUnitTitle(unitId || '', isHindi)}`;
    if (source === 'subject' && subject) {
      const subjectName = subject === 'All' ? (isHindi ? 'सभी विषय' : 'All Subjects') : formatUnitTitle(subject || '', isHindi);
      return `${subjectName} Questions (${yearRange})`;
    }
    return `${formatUnitTitle(unitId || '', isHindi)} - ${unitTitle || ''}`;
  }, [source, topicTitle, year, unitId, unitTitle, subject, examId, isHindi]);

  const FREE_SUBJECT = 'History';

  const toggleAll = useCallback(() => {
    if (!isPro && unitId !== FREE_SUBJECT) {
        setLockModalOpen(true);
        return;
    }
    setShowAllExpanded(!showAllExpanded);
  }, [showAllExpanded, isPro, unitId]);

  return (
    <div className="min-h-screen bg-[#F5F5F7] pb-24 text-[#1D1D1F] selection:bg-[#000000] selection:text-white font-sans antialiased">
      <SyllabusLockModal open={lockModalOpen} onOpenChange={setLockModalOpen} />

      {/* Apple-style sticky glass header */}
      <div className="sticky top-0 z-50 border-b border-[#E5E5EA] bg-[rgba(250,250,251,0.85)] backdrop-blur-xl supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="flex h-16 sm:h-[72px] items-center gap-4">
            <button
              onClick={() => router.back()}
              className="-ml-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#1D1D1F] hover:bg-[#E5E5EA]/50 active:scale-95 transition-all"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="min-w-0 flex-1 flex items-center justify-between">
              <div>
                <h1 className="truncate text-lg sm:text-xl font-semibold tracking-tight text-[#1D1D1F]">
                  {pageTitle}
                </h1>
                <p className="text-[11px] sm:text-xs font-semibold tracking-wide text-[#86868B] uppercase">
                  {filteredQuestions.length} {isHindi ? 'प्रश्न' : 'Solved Questions'}
                </p>
              </div>
              <button
                onClick={onToggleMode}
                className="hidden sm:inline-flex items-center justify-center rounded-full bg-[#1D1D1F] px-4 py-2 text-xs font-semibold tracking-wide text-white transition-all hover:bg-[#333336] active:scale-95"
              >
                Classic Mode
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Controls Header */}
      <div className="sticky top-16 sm:top-[72px] z-40 bg-[rgba(245,245,247,0.95)] backdrop-blur-md pt-4 pb-4 border-b border-[#E5E5EA] shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            
            {/* Year Filters Pill Scroll */}
            <div className="flex flex-1 overflow-hidden">
              {uniqueYears.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                  <button
                    onClick={() => setFilterYear(null)}
                    className={cn(
                      'shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-[13px] font-semibold transition-all active:scale-95',
                      filterYear === null
                        ? 'bg-[#1D1D1F] text-white shadow-sm'
                        : 'bg-white text-[#1D1D1F] border border-[#E5E5EA] shadow-sm hover:bg-[#F5F5F7]'
                    )}
                  >
                    All Years
                  </button>
                  {uniqueYears.map((y) => (
                    <button
                      key={y}
                      onClick={() => setFilterYear(y)}
                      className={cn(
                        'shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-[13px] font-semibold transition-all active:scale-95',
                        filterYear === y
                          ? 'bg-[#1D1D1F] text-white shadow-sm'
                          : 'bg-white text-[#1D1D1F] border border-[#E5E5EA] shadow-sm hover:bg-[#F5F5F7]'
                      )}
                    >
                      {y}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Expand All Action */}
            <button
              onClick={toggleAll}
              className="group flex h-9 shrink-0 items-center gap-2 rounded-full border border-[#D1D1D6] bg-white px-4 text-[13px] font-semibold text-[#1D1D1F] transition-all hover:bg-[#F5F5F7] active:scale-95 shadow-sm"
            >
              <AnimatePresence mode="wait">
                {showAllExpanded ? (
                  <motion.div
                    key="collapse"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="flex items-center gap-1.5"
                  >
                    <EyeOff className="h-4 w-4 text-[#86868B]" />
                    {isHindi ? 'सब बंद करें' : 'Collapse All'}
                  </motion.div>
                ) : (
                  <motion.div
                    key="expand"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="flex items-center gap-1.5"
                  >
                    <Eye className="h-4 w-4 text-[#86868B]" />
                    {isHindi ? 'सब खोलें' : 'Expand All'}
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {filteredQuestions.length > 0 ? (
          <ModernQuestionList 
            questions={filteredQuestions as any[]} 
            isHindi={isHindi}
            showYears={true}
            showAllExpanded={showAllExpanded}
            examId={examId}
            isPro={isPro}
            onLockedClick={() => setLockModalOpen(true)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center rounded-[32px] border border-[#E5E5EA] bg-white p-20 text-center shadow-sm">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-[#F5F5F7]">
              <Filter className="h-8 w-8 text-[#86868B]" />
            </div>
            <h3 className="text-xl font-semibold tracking-tight text-[#1D1D1F]">
              {isHindi ? 'कोई प्रश्न नहीं मिला' : 'No matches found'}
            </h3>
            <p className="mx-auto mt-3 max-w-[280px] text-sm text-[#86868B] font-medium leading-relaxed">
              {isHindi
                ? 'इस फ़िल्टर के लिए कोई डेटा नहीं है।'
                : 'Try selecting a different year or filter combination.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronDown, Repeat, Sparkles, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { YearBadge } from '../shared/UnitBadge';
import { useSettingsStore } from '@/store/useSettingsStore';
import { UPSCQuestionRenderer } from '@/features/tests/components/UPSCQuestionRenderer';
import { PremiumExplanation } from '@/features/tests/components/PremiumExplanation';
import { SUBJECT_VARIANTS, SUBJECTS } from '@/lib/pyq-ui-constants';

const PASTEL_THEMES = [
  { bg: 'bg-[#F2F8FF]', border: 'border-[#D9EAFE]', hover: 'hover:border-[#BFDBFE]' }, // Blue
  { bg: 'bg-[#FFF6E9]', border: 'border-[#FFE4C4]', hover: 'hover:border-[#FFD0A0]' }, // Orange
  { bg: 'bg-[#F1FAEE]', border: 'border-[#D1EED1]', hover: 'hover:border-[#AEE1AE]' }, // Green
  { bg: 'bg-[#FEF1F2]', border: 'border-[#FDD1D4]', hover: 'hover:border-[#FBBEC2]' }, // Red
  { bg: 'bg-[#FFFBED]', border: 'border-[#FFF0B3]', hover: 'hover:border-[#FFE680]' }, // Yellow
  { bg: 'bg-[#F6F0FD]', border: 'border-[#E6D4F9]', hover: 'hover:border-[#DECCFC]' }, // Purple
];

export interface QuestionData {
  id: string;
  text: string;
  textEn?: string | null;
  year: number;
  qNo?: number;
  subject?: string;
  testTitle?: string;
  options?: any;
  optionsEn?: string[];
  correctAnswer?: number | string;
  extendedData?: any;
  explanation?: string | null;
  explanationEn?: string | null;
  type?: string;
  matchPairs?: any[];
}

interface ModernQuestionItemProps {
  question: QuestionData;
  index: number;
  isHindi: boolean;
  repeatCount?: number;
  showYear?: boolean;
  defaultExpanded?: boolean;
  examId?: string;
  isFreeAccess?: boolean;
  onLockedClick?: () => void;
  variant?: 'card' | 'flat';
}

export function ModernQuestionItem({
  question,
  index,
  isHindi,
  repeatCount = 0,
  showYear = true,
  defaultExpanded = false,
  examId,
  isFreeAccess = false,
  onLockedClick,
  variant = 'card',
}: ModernQuestionItemProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const { user, isSubscribed } = useSettingsStore();
  
  const isPro = isSubscribed || user?.role === 'admin';
  const isUnlocked = isPro || isFreeAccess;

  const displayText = isHindi ? question.text : question.textEn || question.text;
  const themeAccent = PASTEL_THEMES[index % PASTEL_THEMES.length];

  const handleToggle = () => {
    if (!isUnlocked) {
      onLockedClick?.();
      return;
    }
    setIsExpanded(!isExpanded);
  };

  return (
    <motion.div
      layout
      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
      className={cn(
        "group relative overflow-hidden transition-all duration-500",
        variant === 'card' 
          ? cn(
              "rounded-[24px] sm:rounded-[32px]",
              isExpanded 
                ? cn("shadow-[0_8px_30px_rgba(0,0,0,0.06)]", themeAccent.bg, themeAccent.border, "border-b-0") 
                : cn("shadow-[0_4px_16px_rgba(0,0,0,0.02)] border", themeAccent.bg, themeAccent.border, themeAccent.hover, "hover:shadow-[0_4px_24px_rgba(0,0,0,0.05)]")
            )
          : cn(
              "bg-transparent border-b last:border-0",
              isExpanded ? "pb-4" : "pb-2"
            ),
        !isUnlocked && "opacity-80 grayscale-[0.3]"
      )}
    >
      {/* Free Access Top Banner / Ribbon */}
      {!isPro && isFreeAccess && (
        <div className="absolute top-0 right-6 sm:right-8 z-10">
          <div className="flex items-center gap-1.5 rounded-b-xl bg-[#1D1D1F] px-4 py-1.5 text-[9px] font-bold tracking-widest text-white uppercase shadow-sm">
            <Sparkles className="h-3 w-3" />
            {isHindi ? 'फ्री एक्सेस' : 'FREE ACCESS'}
          </div>
        </div>
      )}

      {/* Header Area */}
      <div
        className={cn(
          "flex cursor-pointer items-start gap-3 sm:gap-6 relative z-0",
          variant === 'card' ? "p-3.5 sm:p-7" : "py-4 px-1 sm:px-4",
          isExpanded && (variant === 'card' ? "pb-1 sm:pb-3" : "pb-2 sm:pb-4")
        )}
        onClick={handleToggle}
      >
        {/* Apple Style Sleek Numbering */}
        <div className="flex shrink-0 flex-col items-center gap-1">
          <div className={cn(
            "flex h-8 w-8 sm:h-12 sm:w-12 items-center justify-center rounded-xl text-[13px] sm:text-[17px] font-bold transition-colors backdrop-blur-sm border shadow-sm",
            variant === 'card' ? "bg-white/60" : "bg-white/80 border-black/5",
            themeAccent.border
          )}>
            {index + 1}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          {isExpanded ? (
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-black tracking-[0.2em] text-[#86868B] uppercase">
                {isHindi ? 'यूपीएससी प्रश्न विश्लेषण' : 'UPSC Question Analysis'}
              </span>
              <h3 className="text-base font-bold tracking-tight text-[#1D1D1F] sm:text-lg">
                {isHindi ? `प्रश्न #${index + 1}` : `Question #${index + 1}`}
              </h3>
            </div>
          ) : (
            <>
              <motion.div
                layout="position"
                className={cn(
                  "text-[15px] leading-[1.6] sm:text-[18px] font-medium tracking-tight text-[#1D1D1F]",
                  "line-clamp-2"
                )}
                style={{ WebkitFontSmoothing: 'antialiased' }}
                dangerouslySetInnerHTML={{
                  __html: displayText.slice(0, 180) + (displayText.length > 180 ? '...' : ''),
                }}
              />

              <motion.div layout="position" className="mt-2.5 flex flex-wrap items-center gap-2 sm:mt-4 sm:gap-3">
                {showYear && question.year && (
                  <span className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-semibold border",
                    variant === 'card' ? "bg-white/60 backdrop-blur-sm border-white/50" : "bg-white/20 border-black/5"
                  )}>
                    {question.year}
                  </span>
                )}

                {question.subject && (
                  <span className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide border",
                    variant === 'card' ? "bg-white/60 backdrop-blur-sm border-white/50" : "bg-white/20 border-black/5"
                  )}>
                    {question.subject}
                  </span>
                )}

                {question.qNo && (
                  <span className="text-[10px] font-semibold tracking-widest text-[#86868B] uppercase">
                    Q{question.qNo}
                  </span>
                )}

                {repeatCount > 1 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-600">
                    <Repeat className="h-3 w-3" />
                    {isHindi ? `${repeatCount}x रिपीट` : `Repeated ${repeatCount}x`}
                  </span>
                )}
              </motion.div>
            </>
          )}
        </div>

        {/* Chevron / Lock Icon */}
        <div className="mt-0.5 flex shrink-0 items-center pl-2">
          <div
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-full transition-all duration-300 shadow-sm border border-white/50',
              variant === 'card' ? "bg-white/60" : "bg-white/40",
              isExpanded && 'rotate-180 bg-[#1D1D1F] text-white'
            )}
          >
            {isUnlocked ? (
              <ChevronDown className="h-5 w-5" />
            ) : (
               <Lock className="h-4 w-4" />
            )}
          </div>
        </div>
      </div>

      {/* Expanded Modern Content */}
      <AnimatePresence>
        {isExpanded && isUnlocked && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className={cn(
              "overflow-hidden", 
              variant === 'card' && "border-t", 
              themeAccent.border
            )}
          >
            <div className={cn(
              "pb-4 pt-1",
              variant === 'card' ? "px-3.5 sm:px-8 sm:pb-8" : "px-1 sm:px-4 sm:pb-6"
            )}>
              
              {/* Force theme="light" to get the crisp dark text */}
              <UPSCQuestionRenderer 
                question={question as any} 
                isHindi={isHindi} 
                showOptions={true} 
                theme="light" 
              />

              {/* Premium Explanations */}
              <div className="pt-4">
                {(question.explanation || question.explanationEn) && (
                  <PremiumExplanation
                    explanation={
                      isHindi
                        ? question.explanation || ''
                        : question.explanationEn || question.explanation || ''
                    }
                    darkMode={false}
                    compact={true}
                    language={isHindi ? 'hi' : 'en'}
                  />
                )}
              </div>

              {/* Navigate to dedicated subject page */}
              {(() => {
                const isUPSC = examId === 'upsc';
                const baseUrl = isUPSC ? '/upsc/intelligence' : '/syllabus/quiz/pyq/intelligence';
                return (
                  <div className="mt-6 border-t border-[#E5E5EA] pt-5 pb-2">
                    <Link
                      href={`${baseUrl}/questions?subject=${encodeURIComponent(question.subject || 'All')}&source=subject`}
                      prefetch={true}
                      className="group flex w-full items-center justify-between rounded-2xl bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all hover:bg-[#F5F5F7] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] active:scale-[0.98]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                        </div>
                        <div className="text-left">
                          <div className="text-sm font-bold tracking-tight text-[#1D1D1F]">
                            {isHindi ? `${question.subject} के सभी प्रश्न` : `View All ${question.subject} Questions`}
                          </div>
                          <div className="text-[12px] font-medium text-[#86868B]">
                            {isHindi ? 'विस्तृत विश्लेषण देखें' : 'Explore deep analysis'}
                          </div>
                        </div>
                      </div>
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F5F5F7] text-[#1D1D1F] transition-transform group-hover:translate-x-1">
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </Link>
                  </div>
                );
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

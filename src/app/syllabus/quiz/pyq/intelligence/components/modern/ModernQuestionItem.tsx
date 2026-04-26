'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronDown, Repeat, Sparkles, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { YearBadge } from '../shared/UnitBadge';
import { useSettingsStore } from '@/store/useSettingsStore';
import { UPSCQuestionRenderer, type UpscRendererQuestion } from '@/features/tests/components/UPSCQuestionRenderer';
import { PremiumExplanation } from '@/features/tests/components/PremiumExplanation';
import { SUBJECT_VARIANTS, SUBJECTS } from '@/lib/pyq-ui-constants';
import type { PyqQuestionListItem } from '../../questions/pyqQuestionListItem';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { submitIntelligenceLead } from '@/actions/intelligence-lead';
import { toast } from 'sonner';

const PASTEL_THEMES = [
  { bg: 'bg-[#F2F8FF]', border: 'border-[#D9EAFE]', hover: 'hover:border-[#BFDBFE]' }, // Blue
  { bg: 'bg-[#FFF6E9]', border: 'border-[#FFE4C4]', hover: 'hover:border-[#FFD0A0]' }, // Orange
  { bg: 'bg-[#F1FAEE]', border: 'border-[#D1EED1]', hover: 'hover:border-[#AEE1AE]' }, // Green
  { bg: 'bg-[#FEF1F2]', border: 'border-[#FDD1D4]', hover: 'hover:border-[#FBBEC2]' }, // Red
  { bg: 'bg-[#FFFBED]', border: 'border-[#FFF0B3]', hover: 'hover:border-[#FFE680]' }, // Yellow
  { bg: 'bg-[#F6F0FD]', border: 'border-[#E6D4F9]', hover: 'hover:border-[#DECCFC]' }, // Purple
];

export type QuestionData = PyqQuestionListItem & {
  optionsEn?: string[];
};

interface ModernQuestionItemProps {
  question: QuestionData;
  index: number;
  isHindi: boolean;
  repeatCount?: number;
  showYear?: boolean;
  examId?: string;
  isFreeAccess?: boolean;
  onLockedClick?: () => void;
  variant?: 'card' | 'flat';
  isAlternating?: boolean;
  themeBg?: string;
}

export function ModernQuestionItem({
  question,
  index,
  isHindi,
  repeatCount = 0,
  showYear = true,
  examId,
  isFreeAccess = false,
  onLockedClick,
  variant = 'card',
  isAlternating = false,
  themeBg = 'bg-transparent',
}: ModernQuestionItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [freeIntroOpen, setFreeIntroOpen] = useState(false);
  const [pendingToggle, setPendingToggle] = useState(false);
  const [leadName, setLeadName] = useState('');
  const [leadMobile, setLeadMobile] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);

  const { user, isSubscribed } = useSettingsStore();
  
  const isPro = isSubscribed || user?.role === 'admin';
  const isUnlocked = isPro || isFreeAccess;

  const displayText = isHindi ? question.text : question.textEn || question.text;
  const themeAccent = PASTEL_THEMES[index % PASTEL_THEMES.length];

  const FREE_INTRO_KEY = 'upsc-intelligence';
  const SNOOZE_KEY = 'upsc-intelligence:snoozeUntil';

  const shouldShowFreeIntroNow = () => {
    if (typeof window === 'undefined') return false;
    const status = localStorage.getItem(FREE_INTRO_KEY);
    if (status === 'submitted') return false;
    const snoozeUntil = Number(localStorage.getItem(SNOOZE_KEY) || 0);
    if (snoozeUntil && Date.now() < snoozeUntil) return false;
    return true;
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedName = localStorage.getItem('mppsc_guest_name') || '';
    if (savedName && !leadName) setLeadName(savedName);
  }, [leadName]);

  const normalizedName = leadName.trim().replace(/\s+/g, ' ');
  const normalizedMobile = leadMobile.replace(/\D/g, '').slice(-10);
  const isValidIndianMobile = /^[6-9]\d{9}$/.test(normalizedMobile);
  const isValidName =
    normalizedName.length >= 2 &&
    normalizedName.length <= 60 &&
    /^[A-Za-z][A-Za-z .'-]*$/.test(normalizedName) &&
    !/\d/.test(normalizedName);
  const canSubmitLead = isValidName && isValidIndianMobile && !isSubmittingLead;

  const handleToggle = () => {
    if (!isUnlocked) {
      onLockedClick?.();
      return;
    }
    // If this is free access (user not pro), show the same one-time modal before expanding
    if (!isPro && isFreeAccess && typeof window !== 'undefined') {
      if (shouldShowFreeIntroNow()) {
        setPendingToggle(true);
        setFreeIntroOpen(true);
        return;
      }
    }
    setIsExpanded(!isExpanded);
  };

  return (
    <motion.div
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
              "bg-transparent border-b border-black/[0.04] last:border-0",
              themeBg !== 'bg-transparent' ? themeBg : (isAlternating ? "bg-black/[0.015]" : "bg-transparent"),
              isExpanded ? "pb-4" : "pb-2"
            ),
        !isUnlocked && "opacity-80 grayscale-[0.3]"
      )}
    >
      {/* One-time Free Intro (free access question open) */}
      <Dialog open={freeIntroOpen} onOpenChange={setFreeIntroOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-black tracking-tight text-slate-900">
              {isHindi ? 'फ्री इंटेलिजेंस (Demo)' : 'Free Intelligence (Demo)'}
            </DialogTitle>
            <DialogDescription className="text-sm font-medium leading-relaxed text-slate-600">
              {isHindi
                ? 'आप अभी फ्री कंटेंट खोल रहे हैं। फुल इंटेलिजेंस Pro में अनलॉक होती है।'
                : 'You’re opening free content. Full Intelligence unlocks with Pro.'}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-2 space-y-3">
            <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold tracking-widest text-slate-500 uppercase">
                  {isHindi ? 'नाम' : 'Name'}
                </label>
                <Input
                  value={leadName}
                  onChange={(e) => setLeadName(e.target.value.slice(0, 60))}
                  placeholder={isHindi ? 'अपना नाम लिखें' : 'Your name'}
                  className="h-11"
                  disabled={isSubmittingLead}
                />
                {!isValidName && normalizedName.length > 0 && (
                  <p className="text-[11px] font-medium text-rose-600">
                    {isHindi ? 'कृपया सही नाम लिखें (केवल अक्षर)' : 'Enter a valid name (letters only)'}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold tracking-widest text-slate-500 uppercase">
                  {isHindi ? 'मोबाइल' : 'Mobile'}
                </label>
                <Input
                  value={leadMobile}
                  onChange={(e) => setLeadMobile(e.target.value.replace(/[^\d+ -]/g, '').slice(0, 14))}
                  placeholder={isHindi ? '10 अंकों का नंबर' : '10-digit number'}
                  className="h-11"
                  inputMode="numeric"
                  disabled={isSubmittingLead}
                />
                {!isValidIndianMobile && normalizedMobile.length > 0 && (
                  <p className="text-[11px] font-medium text-rose-600">
                    {isHindi
                      ? 'वैध भारतीय मोबाइल डालें (6-9 से शुरू, 10 अंक)'
                      : 'Enter a valid Indian mobile (starts 6-9, 10 digits)'}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">
                  {isHindi ? 'ईमेल (optional)' : 'Email (optional)'}
                </label>
                <Input
                  value={leadEmail}
                  onChange={(e) => setLeadEmail(e.target.value)}
                  placeholder={isHindi ? 'Optional' : 'Optional'}
                  className="h-10"
                  disabled={isSubmittingLead}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => {
                  try {
                    localStorage.setItem(SNOOZE_KEY, String(Date.now() + 24 * 60 * 60 * 1000));
                    localStorage.setItem(FREE_INTRO_KEY, 'seen');
                  } catch {}
                  setFreeIntroOpen(false);
                  setPendingToggle(false);
                }}
              >
                {isHindi ? 'अभी नहीं' : 'Not now'}
              </Button>
              <Button
                className="flex-1 rounded-xl bg-slate-900 text-white hover:bg-slate-800"
                disabled={!canSubmitLead}
                onClick={async () => {
                  if (!canSubmitLead) {
                    toast.error(isHindi ? 'सही नाम और मोबाइल जरूरी है' : 'Valid name and mobile are required');
                    return;
                  }
                  setIsSubmittingLead(true);
                  try {
                    const source = typeof window !== 'undefined'
                      ? localStorage.getItem('upsc_intelligence_entry_source') || ''
                      : '';
                    const res = await submitIntelligenceLead({
                      name: normalizedName,
                      mobile: normalizedMobile,
                      email: leadEmail.trim() || undefined,
                      unitId: question.subject || undefined,
                      source,
                    });
                    if (!res.success) {
                      toast.error(isHindi ? 'सेव नहीं हुआ, फिर से try करें' : 'Failed to save, try again');
                      return;
                    }
                    try {
                      localStorage.setItem('mppsc_guest_name', normalizedName);
                      localStorage.setItem(FREE_INTRO_KEY, 'submitted');
                      localStorage.removeItem(SNOOZE_KEY);
                    } catch {}
                    toast.success(isHindi ? 'Done! अब खोल रहे हैं…' : 'Done! Opening…');
                    setFreeIntroOpen(false);
                    if (pendingToggle) setIsExpanded(true);
                    setPendingToggle(false);
                  } finally {
                    setIsSubmittingLead(false);
                  }
                }}
              >
                {isSubmittingLead ? (isHindi ? 'सेव हो रहा है...' : 'Saving...') : (isHindi ? 'ओपन करें' : 'Open')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
              <div
                className={cn(
                  "text-[15px] leading-[1.6] sm:text-[18px] font-medium tracking-tight text-[#1D1D1F]",
                  "max-h-[9rem] overflow-y-auto pr-1 sm:max-h-[11rem]"
                )}
                style={{ WebkitFontSmoothing: 'antialiased' }}
                dangerouslySetInnerHTML={{
                  __html: displayText,
                }}
              />

              <div className="mt-2.5 flex flex-wrap items-center gap-2 sm:mt-4 sm:gap-3">
                {showYear && question.year && (
                  <div className="flex items-center gap-1.5">
                    <span className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-semibold border",
                      variant === 'card' ? "bg-white/60 backdrop-blur-sm border-white/50" : "bg-white/20 border-black/5"
                    )}>
                      {question.year}
                    </span>
                    {question.qNo && (
                      <span className={cn(
                        "inline-flex items-center rounded-full px-1.5 py-0.5 text-[8px] font-black border uppercase tracking-tighter opacity-70",
                        variant === 'card' ? "bg-white/40 border-white/30" : "bg-black/[0.03] border-black/5"
                      )}>
                        Q. {question.qNo}
                      </span>
                    )}
                  </div>
                )}

                {question.subject && (
                  <span className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide border",
                    variant === 'card' ? "bg-white/60 backdrop-blur-sm border-white/50" : "bg-white/20 border-black/5"
                  )}>
                    {question.subject}
                  </span>
                )}

                {repeatCount > 1 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-600">
                    <Repeat className="h-3 w-3" />
                    {isHindi ? `${repeatCount}x रिपीट` : `Repeated ${repeatCount}x`}
                  </span>
                )}
              </div>
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
              variant === 'card' 
                ? "px-3.5 sm:px-8 sm:pb-8" 
                : "px-1.5 sm:px-4 sm:pb-6 bg-white/70 backdrop-blur-md rounded-[18px] mx-1 sm:mx-2 mt-1 mb-2 shadow-sm border border-white/40"
            )}>
              
              {/* Force theme="light" to get the crisp dark text */}
              <UPSCQuestionRenderer 
                question={question as UpscRendererQuestion} 
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
              {/* {(() => {
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
              })()} */}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

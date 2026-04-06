'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ChevronDown, Filter, Eye, EyeOff, Lock, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useSettingsStore } from '@/store/useSettingsStore';
import { PremiumExplanation } from '@/features/tests/components/PremiumExplanation';
import { UPSCQuestionRenderer } from '@/features/tests/components/UPSCQuestionRenderer';
import { RenderTableQuestion } from '@/features/tests/utils/questionFormatter';
import { YearBadge } from '../components/shared/UnitBadge';
import { formatUnitTitle, getUnitColor } from '../components/shared/constants';
import { SUBJECT_VARIANTS, SUBJECTS } from '@/lib/pyq-ui-constants';
import { SyllabusLockModal } from '@/features/syllabus/components/SyllabusLockModal';

interface QuestionData {
  id: string;
  text: string;
  textEn?: string | null;
  year?: number;
  qNo?: number;
  type?: string;
  options?: any[];
  matchPairs?: any[];
  correctAnswer?: any;
  explanation?: string | null;
  explanationEn?: string | null;
  subject?: string | null;
  extendedData?: {
    layoutType?: 'statements' | 'table' | 'assertion_reason' | 'standard';
    contextStr?: string;
    contextStrEn?: string;
    listItems?: { id: string; text: string; textEn?: string }[];
    statementI?: string;
    statementIEn?: string;
    statementII?: string;
    statementIIEn?: string;
    questionPrompt?: string;
    questionPromptEn?: string;
    tableHeaders?: string[];
    tableHeadersEn?: string[];
    tableRows?: string[][];
    tableRowsEn?: string[][];
  } | null;
}

interface ViewAllQuestionsClientProps {
  examId?: string;
  unitId: string;
  unitTitle: string;
  questions: QuestionData[];
  source: 'paper' | 'overall' | 'topic' | 'subject';
  topicTitle?: string;
  year?: number;
  subject?: string;
  isPro?: boolean;
}


export default function ViewAllQuestionsClient({
  examId,
  unitId,
  unitTitle,
  questions,
  source,
  topicTitle,
  year,
  subject,
  isPro = false,
}: ViewAllQuestionsClientProps) {
  const router = useRouter();
  const { language } = useSettingsStore();
  const isHindi = language === 'hi';
  const [lockModalOpen, setLockModalOpen] = useState(false);

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [showAllExpanded, setShowAllExpanded] = useState(false);
  const [filterYear, setFilterYear] = useState<number | null>(null);

  const FREE_SUBJECT = 'History';
  const FREE_LIMIT = 5;

  // Check if we're in PDF mode (for Puppeteer)
  const searchParams = useSearchParams();
  const isPdfMode = searchParams.get('pdf_mode') === 'true';

  // Get unique years for filtering
  const uniqueYears = useMemo(() => {
    return Array.from(
      new Set(questions.map((q) => q.year).filter((y): y is number => y !== undefined))
    ).sort((a, b) => b - a);
  }, [questions]);

  // Filter questions by year
  const filteredQuestions = useMemo(() => {
    let qList = filterYear ? questions.filter((q) => q.year === filterYear) : questions;
    return qList;
  }, [questions, filterYear]);

  // Auto-expand all questions in PDF mode
  useEffect(() => {
    if (isPdfMode && filteredQuestions.length > 0) {
      setExpandedIds(new Set(filteredQuestions.map((q) => q.id)));
      setShowAllExpanded(true);
    }
  }, [isPdfMode, filteredQuestions]);

  const toggleQuestion = useCallback((id: string, isLocked: boolean) => {
    if (isLocked) {
      setLockModalOpen(true);
      return;
    }
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    if (!isPro && unitId !== FREE_SUBJECT) {
        setLockModalOpen(true);
        return;
    }
    if (showAllExpanded) {
      setExpandedIds(new Set());
    } else {
      setExpandedIds(new Set(filteredQuestions.map((q) => q.id)));
    }
    setShowAllExpanded(!showAllExpanded);
  }, [showAllExpanded, filteredQuestions, isPro, unitId]);

  const colorClass = getUnitColor(unitId);

  // Title based on source
  const pageTitle = useMemo(() => {
    const isUPSC = examId === 'upsc';
    const prefix = isUPSC ? 'UPSC Civil Services' : 'UPSC Civil Services';
    const yearRange = isUPSC ? '2015-2025' : '2020-2025';

    if (source === 'topic' && topicTitle) {
      return topicTitle;
    }
    if (source === 'paper' && year) {
      return `${prefix} ${year} - ${formatUnitTitle(unitId, isHindi)}`;
    }
    if (source === 'subject' && subject) {
      const subjectName = subject === 'All' ? (isHindi ? 'सभी विषय' : 'All Subjects') : formatUnitTitle(subject, isHindi);
      return `${subjectName} Questions (${yearRange})`;
    }
    return `${formatUnitTitle(unitId, isHindi)} - ${unitTitle}`;
  }, [source, topicTitle, year, unitId, unitTitle, subject, examId, isHindi]);

  return (
    <div className="min-h-screen bg-[#080510] pb-24 text-slate-200 selection:bg-violet-500/30">
      <SyllabusLockModal 
        open={lockModalOpen}
        onOpenChange={setLockModalOpen}
      />
      {/* Dynamic Background */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] h-[600px] w-[600px] animate-pulse rounded-full bg-violet-600/10 blur-[120px]" />
        <div
          className="absolute right-[-10%] bottom-[-10%] h-[600px] w-[600px] animate-pulse rounded-full bg-amber-600/5 blur-[120px]"
          style={{ animationDelay: '2s' }}
        />
        <div className="absolute top-[30%] left-[20%] h-[400px] w-[400px] rounded-full bg-purple-600/5 blur-[100px]" />
      </div>

      {/* Premium Sticky Header */}
      <div className="sticky top-0 z-50 border-b border-white/[0.03] bg-[#080510]/70 backdrop-blur-2xl">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="flex h-16 items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="group rounded-xl bg-white/5 text-slate-400 transition-all hover:bg-white/10 hover:text-white active:scale-95"
            >
              <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-0.5" />
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-base font-black tracking-tight text-white sm:text-lg">
                {pageTitle}
              </h1>
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'h-1.5 w-1.5 animate-pulse rounded-full',
                    colorClass.replace('bg-', 'bg-').replace('indigo', 'violet')
                  )}
                />
                <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                  {filteredQuestions.length} {isHindi ? 'प्रश्न' : 'Solved Questions'}
                </p>
              </div>
            </div>
            <div
              className={cn(
                'h-10 w-1 rounded-full bg-gradient-to-b opacity-50',
                colorClass
                  .replace('bg-', 'from-')
                  .replace('indigo', 'violet')
                  .replace(' ', 'to-transparent')
              )}
            />
          </div>
        </div>
      </div>

      {/* Modernized Controls */}
      <div className="sticky top-16 z-40 border-b border-white/[0.03] bg-[#080510]/60 backdrop-blur-xl">
        <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Filter Group - Horizontal Pills */}
            <div className="flex flex-col gap-3">
              {/* Year Filter Pills */}
              {uniqueYears.length > 1 && (
                <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
                  <div className="flex h-9 items-center rounded-2xl bg-white/5 p-1">
                    <button
                      onClick={() => setFilterYear(null)}
                      className={cn(
                        'h-full rounded-xl px-4 text-[10px] font-black tracking-widest transition-all active:scale-95',
                        filterYear === null
                          ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                          : 'text-slate-400 hover:text-white'
                      )}
                    >
                      ALL YEARS
                    </button>
                    {uniqueYears.map((y) => (
                      <button
                        key={y}
                        onClick={() => setFilterYear(y)}
                        className={cn(
                          'h-full rounded-xl px-4 text-[10px] font-black tracking-widest transition-all active:scale-95',
                          filterYear === y
                            ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                            : 'text-slate-400 hover:text-white'
                        )}
                      >
                        {y}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Expand/Collapse All - Glass Action */}
            <Button
              variant="outline"
              size="sm"
              onClick={toggleAll}
              className="h-9 gap-2 rounded-xl border-white/5 bg-white/5 px-4 text-xs font-bold text-white transition-all hover:bg-white/10 active:scale-95 sm:ml-auto"
            >
              <AnimatePresence mode="wait">
                {showAllExpanded ? (
                  <motion.div
                    key="collapse"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="flex items-center gap-2"
                  >
                    <EyeOff className="h-4 w-4 text-amber-500" />
                    {isHindi ? 'सब बंद करें' : 'Collapse All'}
                  </motion.div>
                ) : (
                  <motion.div
                    key="expand"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4 text-amber-500" />
                    {isHindi ? 'सब खोलें' : 'Expand All'}
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          </div>
        </div>
      </div>

      {/* Questions List - Premium Cards */}
      <div
        className="relative mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6"
        data-testid="questions-container"
      >
        {filteredQuestions.map((q, idx) => {
          const isExpanded = expandedIds.has(q.id);
          const isHistory = q.subject === FREE_SUBJECT || unitId === FREE_SUBJECT;
          const isFreeAccess = !isPro && idx < FREE_LIMIT;
          const isLocked = !isPro && !isHistory && idx >= FREE_LIMIT;
          
          const displayText = isHindi ? q.text : q.textEn || q.text;
          const altText = isHindi ? q.textEn : q.text;

          // Special Lock Card for free users
          if (idx === FREE_LIMIT && !isPro && !isHistory) {
            return (
              <motion.div
                key="pro-lock-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-[2.5rem] border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-950 p-8 text-center shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
              >
                <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-amber-500/20 blur-[80px]" />
                <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-violet-500/20 blur-[80px]" />
                
                <div className="relative z-10">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.4)]">
                    <Lock className="h-8 w-8 text-black" />
                  </div>
                  <h3 className="mb-2 text-2xl font-black tracking-tight text-white">
                    {isHindi ? 'बाकी प्रश्न अनलॉक करें' : 'Unlock Remaining Questions'}
                  </h3>
                  <p className="mx-auto mb-6 max-w-md text-sm font-medium leading-relaxed text-slate-400">
                    {isHindi 
                      ? 'आप अभी फ्री प्रीव्यू देख रहे हैं। सभी वर्षों के प्रश्न, विस्तृत व्याख्या और AI-संचालित विश्लेषण अनलॉक करने के लिए प्रो में शामिल हों।' 
                      : 'You are viewing a free preview. Join Pro to unlock all questions across years, detailed expert explanations, and AI-powered insights.'}
                  </p>
                  <Button 
                    onClick={() => setLockModalOpen(true)}
                    className="h-12 rounded-xl bg-amber-500 px-8 text-xs font-black tracking-widest text-black transition-all hover:bg-amber-400 hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] active:scale-95"
                  >
                    {isHindi ? 'प्रो में अपग्रेड करें' : 'UPGRADE TO PRO'}
                  </Button>
                </div>
              </motion.div>
            );
          }

          // Don't render more than FREE_LIMIT + 1 (the lock card) for free users unless it's History
          if (isLocked && idx > FREE_LIMIT) return null;

          return (
            <div
              key={q.id}
              className={cn(
                "group relative transition-all duration-300",
                isLocked && "grayscale-[0.8] opacity-70",
                isFreeAccess && "scale-[1.01]"
              )}
              data-question-item
              data-question-id={q.id}
            >
              {/* Card Accent Glow */}
              <div
                className={cn(
                  'absolute -inset-px rounded-[2rem] opacity-0 blur-md transition-opacity duration-500 group-hover:opacity-100',
                  isExpanded ? 'opacity-40' : '',
                  isFreeAccess ? 'opacity-30 bg-amber-500/20' : ''
                )}
                style={{
                  background: isFreeAccess 
                    ? `linear-gradient(to right, #f59e0b, transparent)`
                    : `linear-gradient(to right, ${isExpanded ? '#8b5cf6' : '#1e293b'}, transparent)`,
                }}
              />

              <Card
                className={cn(
                  'relative z-10 overflow-hidden rounded-[2rem] border-white/[0.03] bg-slate-900/40 shadow-2xl backdrop-blur-sm transition-all duration-300',
                  isExpanded ? 'bg-[#0b081a]/80 ring-1 ring-violet-500/20' : 'hover:bg-slate-900/60',
                  isLocked && "cursor-not-allowed",
                  isFreeAccess && "border-amber-500/40 ring-1 ring-amber-500/20 shadow-[0_0_30px_rgba(245,158,11,0.05)]"
                )}
              >
                {/* Free Access Header Ribbon */}
                {isFreeAccess && (
                  <div className="absolute top-0 right-10">
                    <div className="relative">
                      <div className="absolute inset-0 bg-amber-500 blur-md opacity-20" />
                      <div className="relative rounded-b-xl bg-amber-500 px-3 py-1 text-[8px] font-black tracking-[0.2em] text-black uppercase shadow-lg">
                        {isHindi ? 'फ्री एक्सेस' : 'FREE ACCESS'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Question Header Area */}
                <div
                  className="flex cursor-pointer items-start gap-5 p-5 sm:p-7"
                  onClick={() => toggleQuestion(q.id, isLocked)}
                >
                  {/* Styled Numbering */}
                  <div className="relative flex h-10 w-10 shrink-0 items-center justify-center">
                    <div className={cn(
                      "absolute inset-0 rotate-45 rounded-xl transition-colors",
                      isFreeAccess ? "bg-amber-500/20 group-hover:bg-amber-500/30" : "bg-amber-500/10 group-hover:bg-amber-500/20"
                    )} />
                    <span className="relative text-sm font-black text-amber-500">{idx + 1}</span>
                  </div>

                  <div className="min-w-0 flex-1 pt-1">
                    <div
                      className={cn(
                        'text-[15px] leading-[1.6] font-medium tracking-tight text-slate-100 sm:text-[17px]',
                        !isExpanded && 'line-clamp-2'
                      )}
                      dangerouslySetInnerHTML={{
                        __html: isExpanded
                          ? displayText
                          : displayText.slice(0, 180) + (displayText.length > 180 ? '...' : ''),
                      }}
                    />

                    <div className="mt-3 flex items-center gap-3">
                      <YearBadge
                        year={q.year ?? 2020}
                        variant="amber"
                        className="border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[10px] font-black text-amber-500 uppercase"
                      />
                      {q.subject && (
                        <Badge 
                          className={cn(
                            "px-3 py-1 text-[10px] font-black tracking-widest border uppercase transition-all",
                            (() => {
                              const subMeta = SUBJECTS.find(s => s.name === q.subject || s.nameHi === q.subject);
                              const variant = SUBJECT_VARIANTS[subMeta?.color || 'slate'];
                              return cn(variant.bg, variant.text, variant.border);
                            })()
                          )}
                        >
                          {q.subject}
                        </Badge>
                      )}
                      {q.qNo && (
                        <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">
                          SET-Q{q.qNo}
                        </span>
                      )}
                      {isLocked && (
                        <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-[9px] font-black text-amber-500">
                          <Lock className="mr-1 h-3 w-3" />
                          PRO
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="mt-1 flex shrink-0 items-center">
                    <div
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-slate-500 transition-all',
                        isExpanded
                          ? 'rotate-180 bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                          : 'group-hover:text-slate-300',
                        isLocked && "opacity-50",
                        isFreeAccess && !isExpanded && "animate-bounce ring-2 ring-amber-500/20"
                      )}
                    >
                      {isLocked ? <Lock className="h-4 w-4" /> : <ChevronDown className="h-5 w-5" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Content Area */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-6 border-t border-white/[0.05] bg-slate-950/40 p-5 sm:p-7">
                        
                        {examId === 'upsc' ? (
                          <UPSCQuestionRenderer question={q} isHindi={isHindi} />
                        ) : (
                          <>
                            {/* 1. Table Content (if matching) */}
                            {q.type === 'matching' && q.matchPairs && q.matchPairs.length > 0 && (
                              <div className="rounded-2xl border border-white/5 bg-slate-900/50 p-4 shadow-inner">
                                <RenderTableQuestion
                                  matchPairs={q.matchPairs}
                                  language={isHindi ? 'hi' : 'en'}
                                  darkMode={true}
                                />
                              </div>
                            )}

                            {/* 2. Translation Alternative Fallback (Only if not using structured layout) */}
                            {!q.extendedData && altText && altText !== displayText && (
                              <div className="relative rounded-2xl border-l-[3px] border-amber-500/30 bg-amber-500/[0.03] p-4 text-[13px] leading-relaxed text-slate-400 italic">
                                <div className="mb-1 text-[9px] font-black tracking-tighter text-amber-400/60 uppercase opacity-50">
                                  Translated Reference
                                </div>
                                <div dangerouslySetInnerHTML={{ __html: altText }} />
                              </div>
                            )}

                            {/* 3. Redesigned Options Grid */}
                            <div className="grid gap-4 sm:grid-cols-2">
                              {(() => {
                                const rawOptions = q.options;
                                let optionsArray: any[] = [];
                                
                                if (Array.isArray(rawOptions)) {
                                  optionsArray = rawOptions;
                                } else if (typeof rawOptions === 'string') {
                                  try {
                                    optionsArray = JSON.parse(rawOptions);
                                  } catch (e) {
                                    optionsArray = [];
                                  }
                                }

                                // Convert A, B, C, D to index 0, 1, 2, 3
                                const getCorrectIndex = (ans: any): number => {
                                  if (typeof ans === 'number') return ans;
                                  if (typeof ans === 'string') {
                                    const upper = ans.trim().toUpperCase();
                                    if (upper === 'A') return 0;
                                    if (upper === 'B') return 1;
                                    if (upper === 'C') return 2;
                                    if (upper === 'D') return 3;
                                    const num = parseInt(ans);
                                    if (!isNaN(num)) return num;
                                  }
                                  return -1;
                                };

                                const correctIndex = getCorrectIndex(q.correctAnswer);

                                return optionsArray.slice(0, 4).map((opt, optIdx) => {
                                  const parsedOpt =
                                    typeof opt === 'object' && opt !== null ? opt : { text: opt };
                                  const isCorrect = correctIndex === optIdx;
                                  
                                  const optText = isHindi
                                    ? parsedOpt.text || (typeof opt === 'string' ? opt : '')
                                    : parsedOpt.text_en ||
                                      parsedOpt.textEn ||
                                      parsedOpt.text ||
                                      (typeof opt === 'string' ? opt : '');

                                  return (
                                    <div
                                      key={optIdx}
                                      className={cn(
                                        'group/opt relative flex items-center gap-4 rounded-2xl border p-4 transition-all duration-300',
                                        isCorrect
                                          ? 'border-emerald-500/40 bg-emerald-500/[0.1] shadow-[0_0_20px_rgba(16,185,129,0.1)]'
                                          : 'border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.05]'
                                      )}
                                    >
                                      {/* Alphabet Bubble */}
                                      <div
                                        className={cn(
                                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-black transition-all',
                                          isCorrect
                                            ? 'bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                                            : 'bg-white/5 text-slate-500 group-hover/opt:bg-white/10 group-hover/opt:text-slate-300'
                                        )}
                                      >
                                        {String.fromCharCode(65 + optIdx)}
                                      </div>

                                      <div
                                        className={cn(
                                          'flex-1 text-[13.5px] leading-snug font-semibold',
                                          isCorrect ? 'text-emerald-50 text-shadow-sm' : 'text-slate-300'
                                        )}
                                        dangerouslySetInnerHTML={{ __html: optText }}
                                      />

                                      {isCorrect && (
                                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20">
                                          <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                                        </div>
                                      )}
                                    </div>
                                  );
                                });
                              })()}
                            </div>
                          </>
                        )}

                        {/* Premium Insights Section */}
                        <div className="space-y-4 pt-4">
                          {(q.explanation || q.explanationEn) && (
                            <PremiumExplanation
                              explanation={
                                isHindi
                                  ? q.explanation || ''
                                  : q.explanationEn || q.explanation || ''
                              }
                              darkMode={true}
                              compact={false}
                              language={isHindi ? 'hi' : 'en'}
                            />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </div>
          );
        })}

        {/* Empty State */}
        {filteredQuestions.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-white/10 bg-white/[0.02] p-20 text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white/5">
              <Filter className="h-10 w-10 text-slate-600" />
            </div>
            <h3 className="text-xl font-black text-white">
              {isHindi ? 'कोई प्रश्न नहीं मिला' : 'No matches found'}
            </h3>
            <p className="mx-auto mt-2 max-w-[250px] text-sm text-slate-500">
              {isHindi
                ? 'सॉरी, इस साल या इस फ़िल्टर के लिए कोई डेटा नहीं है।'
                : 'Try selecting a different year or broader filters to find what you are looking for.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

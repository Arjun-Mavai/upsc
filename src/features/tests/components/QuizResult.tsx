'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Home,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Quote,
  Filter,
  TrendingDown,
  TrendingUp,
  Minus,
  Plus,
  Lightbulb,
  AlertTriangle,
  Zap,
  BookOpen,
  ArrowRight,
  Target,
  Trophy,
  Lock,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Question } from '@/types/quiz';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PremiumExplanation } from './PremiumExplanation';
import { getTestLeaderboard } from '@/actions/leaderboard-actions';
import { revalidateAnalyticsAction } from '@/features/analytics/actions';
import { LoadingQuotes } from '@/components/ui/LoadingQuotes';
import { getRandomFeedback } from '../constants/feedback';
import { useSettingsStore } from '@/store/useSettingsStore';
import { SCORING_CONFIG, getCorrectAnswerIndex } from '@/lib/quiz-scoring';
import {
  FormattedQuestionText,
  RenderTableQuestion,
  cleanMatchingQuestionText,
} from '@/features/tests/utils/questionFormatter';

import { logger } from '@/lib/logger';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  getPYQIntelligenceForWrongQuestions,
  PYQWrongTopicInsight,
} from '@/actions/pyq-intelligence';
import { submitTestFeedback, hasUserSubmittedFeedback } from '@/app/actions/feedback';
import { TestSeriesFeedbackModal } from '@/components/test-series-feedback-modal';
import type { FeedbackFormType } from '@/lib/schemas/feedback';
import { SmartQuizResult } from './SmartQuizResult';
import { QuizHeader } from './quiz/QuizHeader';
import { calculateUPSCResult, getHighYieldFactsForQuestions } from '@/features/tests/actions/test-result';
import { ConnectSocials } from '@/components/ConnectSocials';

interface QuizResultProps {
  questions: Question[];
  answers: Record<string, number>;
  mode: 'topic' | 'full' | 'pyq';
  timeTaken: number; // in seconds
  onRetry?: () => void;
  onExit?: () => void;
  title?: string;
  testId?: string;
  userId?: string;
  disableRetry?: boolean;
  isGuest?: boolean;
  showFeedbackModal?: boolean;
  questionTimes?: Record<string, number>;
}

export function QuizResult({
  questions,
  answers,
  mode,
  timeTaken,
  onRetry,
  onExit,
  title,
  testId,
  userId,
  disableRetry = false,
  isGuest = false,
  showFeedbackModal = true,
  questionTimes = {},
}: QuizResultProps) {
  const router = useRouter();
  const { language } = useSettingsStore();
  const isHindi = language === 'hi';

  const isGuestLocked = isGuest && !userId;

  const PremiumLock = ({ label, className }: { label: string; className?: string }) => (
    <div
      className={cn(
        'pointer-events-auto absolute inset-0 z-30 flex cursor-pointer items-center justify-center overflow-hidden rounded-xl bg-slate-900/10 backdrop-blur-[6px]',
        className
      )}
      onClick={() => {
        toast('🔒 Pro Feature Requested', {
          description: `This feature is locked for guest users. Unlock to access!`,
          action: {
            label: 'Unlock',
            onClick: () => router.push('/pricing'),
          },
        });
      }}
    >
      <div
        className="animate-in fade-in zoom-in pointer-events-auto relative w-[85%] max-w-[280px] cursor-default overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 text-center shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] duration-500"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 left-0 h-1.5 w-full bg-gradient-to-r from-amber-400 via-rose-500 to-amber-400"></div>
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-slate-100 bg-slate-50 shadow-inner">
          <Lock className="h-6 w-6 text-slate-900" />
        </div>
        <h3 className="mb-2 text-xl leading-tight font-black tracking-tight text-slate-900">
          {label}
        </h3>
        <p className="mb-6 px-2 text-xs leading-relaxed font-semibold text-pretty text-slate-500 opacity-80">
          {label.includes('Strategy')
            ? 'Upgrade to Pro to unlock advanced attempt intelligence and optimal simulators.'
            : 'Get Expert PYQ Insights to see repeated patterns and high-yield topics.'}
        </p>
        <Button
          className="h-12 w-full rounded-2xl bg-slate-950 text-sm font-black tracking-wide text-white shadow-xl transition-all hover:bg-slate-900 active:scale-95"
          onClick={(e) => {
            e.stopPropagation();
            router.push('/pricing');
          }}
        >
          Unlock Pro Access 🚀
        </Button>
      </div>
    </div>
  );

  const [leaderboard, setLeaderboard] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [pyqInsights, setPyqInsights] = useState<PYQWrongTopicInsight[]>([]);
  const [isFetchingInsights, setIsFetchingInsights] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get('completed') !== 'true') {
      url.searchParams.set('completed', 'true');
      window.history.replaceState(window.history.state, '', url.toString());
    }
  }, []);

  useEffect(() => {
    if (!showFeedbackModal) return;

    const checkFeedbackStatus = async () => {
      const hasFeedbackStorage =
        typeof window !== 'undefined' ? localStorage.getItem('mppsc_feedback_given') : null;
      if (hasFeedbackStorage) {
        setShowFeedback(false);
        return;
      }

      const currentTestId = testId || 'guest-test-result';
      const hasSeenSession =
        typeof window !== 'undefined'
          ? sessionStorage.getItem(`feedback_shown_${currentTestId}`)
          : null;
      if (hasSeenSession) {
        setShowFeedback(false);
        return;
      }

      if (userId) {
        const submitted = await hasUserSubmittedFeedback();
        if (submitted) {
          setShowFeedback(false);
          if (typeof window !== 'undefined') localStorage.setItem('mppsc_feedback_given', 'true');
          return;
        }
      }

      setShowFeedback(true);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(`feedback_shown_${currentTestId}`, 'true');
      }
    };

    checkFeedbackStatus();
  }, [testId, userId, showFeedbackModal]);

  const handleFeedbackSubmit = async (data: FeedbackFormType) => {
    try {
      const guestName =
        typeof window !== 'undefined' ? localStorage.getItem('mppsc_guest_name') : null;

      const currentTestId = testId || 'guest-test-result';
      const testType = mode === 'pyq' ? 'pyq' : mode === 'full' ? 'premium' : 'free';

      const response = await submitTestFeedback({
        testId: currentTestId,
        testType,
        data,
        userName: guestName,
      });

      if (response.success) {
        if (typeof window !== 'undefined') localStorage.setItem('mppsc_feedback_given', 'true');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }

    setShowFeedback(false);
  };

  // Score Calculations
  let correctCount = 0;
  let wrongCount = 0;
  let skippedCount = 0;
  let totalScore = 0;
  let maxMarks = 0;

  questions.forEach((q) => {
    const qMarks = q.marks ?? SCORING_CONFIG.MARKS_PER_QUESTION;
    const qNegative = q.negativeMarks ?? SCORING_CONFIG.NEGATIVE_MARKING;

    maxMarks += qMarks;

    if (answers[q.id] === undefined) {
      skippedCount++;
    } else if (answers[q.id] === getCorrectAnswerIndex(q.correctAnswer, q.options)) {
      correctCount++;
      totalScore += qMarks;
    } else {
      wrongCount++;
      totalScore -= qNegative;
    }
  });

  totalScore = parseFloat(totalScore.toFixed(2));
  const scorePercentage = maxMarks > 0 ? Math.round((totalScore / maxMarks) * 100) : 0;
  const attemptedCount = correctCount + wrongCount;
  const accuracy = attemptedCount > 0 ? (correctCount / attemptedCount) * 100 : 0;
  const totalQuestions = questions.length;

  useEffect(() => {
    const refreshData = async () => {
      try {
        setIsLoadingStats(true);
        const [, leaderboardData] = await Promise.all([
          revalidateAnalyticsAction(),
          testId ? getTestLeaderboard(testId, userId) : Promise.resolve(null),
        ]);

        if (leaderboardData) setLeaderboard(leaderboardData);
        router.refresh();
      } catch (error) {
        logger.error('Failed to refresh quiz result stats', error, {
          category: 'ui',
          metadata: { testId, userId },
        });
      } finally {
        setTimeout(() => setIsLoadingStats(false), 1000);
      }
    };
    refreshData();
  }, [router, testId, userId]);

  useEffect(() => {
    if (mode === 'pyq' && wrongCount > 0) {
      setIsFetchingInsights(true);
      const wrongQIds = questions
        .filter(
          (q) =>
            answers[q.id] !== undefined &&
            answers[q.id] !== getCorrectAnswerIndex(q.correctAnswer, q.options)
        )
        .map((q) => q.id);

      getPYQIntelligenceForWrongQuestions(wrongQIds)
        .then((insights) => {
          setPyqInsights(insights);
        })
        .finally(() => setIsFetchingInsights(false));
    }
  }, [mode, questions, answers, wrongCount]);

  const feedbackMessage = React.useMemo(
    () => getRandomFeedback(scorePercentage, language),
    [scorePercentage, language]
  );

  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [activeQuestionTab, setActiveQuestionTab] = useState<
    'all' | 'correct' | 'wrong' | 'skipped'
  >('all');

  const CUTOFF_PERCENTAGE = 0.50; // UPSC standard (100/200 marks)
  const CUTOFF_ESTIMATE = Math.round(maxMarks * CUTOFF_PERCENTAGE);
  const ELITE_START_EST = Math.round(maxMarks * 0.52);
  const ELITE_END_EST = Math.round(maxMarks * 0.58);
  const isCutoffCleared = totalScore >= CUTOFF_ESTIMATE;

  const renderQuestionList = () => {
    const filteredQuestions = questions
      .map((q, i) => ({ ...q, originalIndex: i }))
      .filter((q) => {
        if (activeQuestionTab === 'all') return true;
        const userAnswer = answers[q.id];
        const isSkipped = userAnswer === undefined;
        const isCorrect = userAnswer === getCorrectAnswerIndex(q.correctAnswer, q.options);

        if (activeQuestionTab === 'skipped') return isSkipped;
        if (activeQuestionTab === 'correct') return isCorrect;
        if (activeQuestionTab === 'wrong') return !isSkipped && !isCorrect;
        return true;
      });

    if (filteredQuestions.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <Filter className="mb-4 h-12 w-12 text-slate-300" />
          <h3 className="text-lg font-bold text-slate-900">No {activeQuestionTab} questions</h3>
          <p className="mt-1 text-sm text-slate-500">
            You didn't have any {activeQuestionTab} answers in this quiz.
          </p>
        </div>
      );
    }

    return filteredQuestions.map((q) => {
      const idx = q.originalIndex;
      const userAnswer = answers[q.id];
      const isCorrect = userAnswer === getCorrectAnswerIndex(q.correctAnswer, q.options);
      const isSkipped = userAnswer === undefined;
      const isExpanded = expandedQuestion === q.id;
      const isLocked = isGuestLocked && !isCorrect;

      return (
        <Card
          key={q.id}
          className={cn(
            'relative mb-4 overflow-hidden border-l-4 transition-all shadow-sm hover:shadow-md',
            isCorrect
              ? 'border-l-emerald-500'
              : isSkipped
                ? 'border-l-slate-300'
                : 'border-l-rose-500' 
          )}
        >
          <div
            onClick={() => {
              if (isLocked) {
                toast('🔒 Pro Feature Only', {
                  description: 'Solutions & analysis are available for premium members.',
                  action: {
                    label: 'Unlock',
                    onClick: () => router.push('/pricing'),
                  },
                });
                return;
              }
              setExpandedQuestion(isExpanded ? null : q.id);
            }}
            className={cn(
              'cursor-pointer pb-6 p-6 transition-all hover:bg-slate-50/50',
              isLocked && 'cursor-not-allowed'
            )}
          >
            <div className="flex flex-col gap-4">
              {/* Status Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-10 items-center justify-center rounded bg-slate-100 text-[10px] font-black tracking-tight text-slate-500">
                    Q{idx + 1}
                  </span>
                  {isCorrect ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-600 ring-1 ring-emerald-500/20">
                      <CheckCircle2 className="h-3 w-3" /> {isHindi ? 'सही उत्तर' : 'Correct'}
                    </span>
                  ) : isSkipped ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-black text-slate-500 ring-1 ring-slate-500/20">
                      <AlertCircle className="h-3 w-3" /> {isHindi ? 'छोड़ा गया' : 'Skipped'}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-black text-rose-600 ring-1 ring-rose-500/20">
                      <XCircle className="h-3 w-3" /> {isHindi ? 'गलत उत्तर' : 'Incorrect'}
                    </span>
                  )}
                </div>
                <div className="text-slate-400">
                  {isLocked ? (
                    <Lock className="h-4 w-4 text-amber-500 shadow-sm" />
                  ) : isExpanded ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5 animate-pulse" />
                  )}
                </div>
              </div>

              {/* Question Content */}
              <div className="flex-1">
                <div className="text-base leading-relaxed font-bold text-slate-900 md:text-lg lg:text-xl">
                  <FormattedQuestionText
                    text={cleanMatchingQuestionText(q.question, q)}
                    className="block"
                  />

                  {questionTimes[q.id] !== undefined && (
                    <div className="mt-3 inline-flex items-center gap-1 rounded-full border border-indigo-100 bg-indigo-50/50 px-2 py-0.5 text-[10px] font-black tracking-tight text-indigo-600 shadow-sm ring-1 ring-indigo-100/50">
                      <Clock className="h-2.5 w-2.5" />
                      {Math.round(questionTimes[q.id])}s
                    </div>
                  )}

                  {q.type === 'matching' && (
                    <RenderTableQuestion
                      text={q.question}
                      matchPairs={q.matchPairs}
                      language="hi"
                      className="mt-4 w-full"
                    />
                  )}
                </div>

                {q.questionEn && (
                  <div className="mt-3 text-sm text-slate-500 md:text-base leading-relaxed">
                    <FormattedQuestionText text={cleanMatchingQuestionText(q.questionEn, q)} />

                    {q.type === 'matching' && (
                      <RenderTableQuestion
                        text={q.questionEn}
                        matchPairs={q.matchPairs}
                        language="en"
                        className="mt-4 border-slate-300 w-full"
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="space-y-4 border-t border-slate-100 bg-slate-50/50 p-5"
            >
              <div className="space-y-2">
                {q.options.map((opt, optIdx) => {
                  const isSelected = userAnswer === optIdx;
                  const isCorrectOpt = getCorrectAnswerIndex(q.correctAnswer, q.options) === optIdx;

                  let styleClass = 'border-slate-200 bg-white text-slate-600 shadow-sm';
                  if (isCorrectOpt)
                    styleClass = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold ring-1 ring-emerald-500/10';
                  else if (isSelected && !isCorrectOpt)
                    styleClass =
                      'border-rose-500 bg-rose-50 text-rose-900 line-through decoration-rose-500/50 ring-1 ring-rose-500/10';

                  let optionText: string;
                  if (typeof opt === 'string') {
                    optionText = opt;
                  } else {
                    optionText =
                      language === 'hi'
                        ? opt.text || opt.textEn || opt.text_en || JSON.stringify(opt)
                        : opt.textEn || opt.text_en || opt.text || JSON.stringify(opt);
                  }

                  return (
                    <div
                      key={optIdx}
                      className={cn(
                        'flex items-center justify-between rounded-xl border p-4 text-sm md:text-base transition-all',
                        styleClass
                      )}
                    >
                      <div className="flex items-center gap-3">
                         <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-inherit text-[10px] font-bold">
                            {String.fromCharCode(65 + optIdx)}
                         </span>
                         <span>{optionText}</span>
                      </div>
                      {isCorrectOpt && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                      {isSelected && !isCorrectOpt && <XCircle className="h-4 w-4 text-rose-600" />}
                    </div>
                  );
                })}
              </div>

              <div
                className={cn(
                  'flex items-center gap-3 rounded-xl p-4 text-sm font-bold',
                  isCorrect
                    ? 'bg-emerald-100/50 text-emerald-800 border border-emerald-200'
                    : isSkipped
                      ? 'bg-slate-100/50 text-slate-600 border border-slate-200'
                      : 'bg-rose-100/50 text-rose-800 border border-rose-200'
                )}
              >
                {isCorrect ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : isSkipped ? (
                  <AlertCircle className="h-5 w-5" />
                ) : (
                  <XCircle className="h-5 w-5" />
                )}

                <span>
                  {isCorrect
                    ? (isHindi ? 'आपका उत्तर सही है!' : 'You answered correctly!')
                    : isSkipped
                      ? (isHindi ? 'आपने यह प्रश्न छोड़ दिया था।' : 'You skipped this question.')
                      : (isHindi ? 'आपका उत्तर गलत है।' : 'You answered incorrectly.')}
                </span>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white p-5 text-sm shadow-sm ring-1 ring-slate-100/50">
                <div className="mb-3 flex items-center gap-1.5 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  <AlertCircle className="h-4 w-4" /> Comprehensive Explanation
                </div>

                <PremiumExplanation
                  explanation={q.explanation || 'No explanation available.'}
                  explanationEn={q.explanationEn}
                  darkMode={false}
                />
              </div>
            </motion.div>
          )}
        </Card>
      );
    });
  };

    const renderResultContent = () => {
      const progressPositive = Math.max(0, totalScore);
      const progressNegative = Math.max(0, wrongCount * SCORING_CONFIG.NEGATIVE_MARKING);

      return (
        <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-4 space-y-6 pt-1 pb-12 duration-500">
          <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-8 text-white shadow-2xl">
            <div className="absolute top-0 right-0 -mt-20 -mr-20 h-80 w-80 rounded-full bg-slate-700/20 blur-[80px]"></div>
            <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-80 w-80 rounded-full bg-emerald-500/10 blur-[80px]"></div>

            <div className="relative z-10">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-xs font-black tracking-[0.2em] text-slate-500 uppercase flex items-center gap-2">
                  <Target className="h-4 w-4 text-amber-500" />
                  {title || 'Expert Review Result'}
                </div>
                {isGuest && (
                  <Link
                    href="/pricing"
                    className="group relative flex items-center gap-2 overflow-hidden rounded-full border border-amber-400/30 bg-slate-950 px-4 py-2 text-[10px] font-black tracking-wider text-white uppercase shadow-[0_0_20px_rgba(245,158,11,0.2)] transition-all hover:scale-105 hover:border-amber-400 shadow-amber-500/10 active:scale-95"
                  >
                    <Sparkles className="h-3 w-3 text-amber-400 animate-pulse" />
                    Unlock Pro Features 🚀
                  </Link>
                )}
              </div>

              <div className="mt-6 mb-10 flex flex-col items-center justify-between gap-8 sm:flex-row sm:items-end">
                <div>
                  <div className="font-display flex items-baseline justify-center gap-1 text-7xl font-black sm:justify-start tracking-tighter">
                    {totalScore}
                    <span className="text-2xl font-bold text-slate-500">/{maxMarks}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-center gap-3 sm:justify-start">
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-black tracking-widest text-emerald-400 uppercase border border-emerald-500/10 shadow-sm">
                      <Plus className="h-3 w-3" /> {SCORING_CONFIG.MARKS_PER_QUESTION} Correct
                    </div>
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-3 py-1 text-[10px] font-black tracking-widest text-rose-400 uppercase border border-rose-500/10 shadow-sm">
                      <Minus className="h-3 w-3" /> {SCORING_CONFIG.NEGATIVE_MARKING} Penalty
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center sm:items-end">
                  {isCutoffCleared ? (
                    <div className="inline-flex items-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-6 py-3 text-base font-black text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.2)] border-b-4 border-b-emerald-500/50">
                      <Trophy className="mr-3 h-5 w-5 animate-bounce" /> {isHindi ? 'कट-ऑफ पार' : 'QUALIFIED'} (~{CUTOFF_ESTIMATE})
                    </div>
                  ) : (
                    <div className="inline-flex items-center rounded-2xl border border-amber-500/30 bg-amber-500/10 px-6 py-3 text-base font-black text-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.1)] border-b-4 border-b-amber-500/50">
                      <TrendingDown className="mr-3 h-5 w-5" /> {isHindi ? 'सुधार आवश्यक' : 'NEEDS PUSH'} (~{CUTOFF_ESTIMATE})
                    </div>
                  )}
                </div>
              </div>

              {/* CUTOFF PROGRESS VISUALIZER */}
              <div className="mb-10 w-full space-y-3">
                <div className="flex justify-between text-[11px] font-black tracking-widest text-slate-500 uppercase">
                  <span>0 Marks</span>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <div className="flex items-center justify-center gap-2 rounded-full bg-indigo-500/10 px-4 py-1.5 text-[10px] font-black tracking-widest text-indigo-400 uppercase border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.1)]">
                      <Zap className="h-3 w-3 fill-indigo-400" /> 
                      Elite: {ELITE_START_EST}-{ELITE_END_EST}
                    </div>
                    <div className="flex items-center justify-center gap-2 rounded-full bg-amber-500/10 px-4 py-1.5 text-[10px] font-black tracking-widest text-amber-400 uppercase border border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
                      <Target className="h-3 w-3" /> 
                      Safe: {CUTOFF_ESTIMATE}
                    </div>
                  </div>
                  <span>{maxMarks} Max</span>
                </div>

                <div className="relative flex h-6 w-full overflow-hidden rounded-full border border-slate-700/50 bg-slate-800/80 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] p-1">
                  <div 
                    className="absolute top-0 bottom-0 z-0 bg-indigo-500/20 border-x border-white/5"
                    style={{ 
                      left: `${(ELITE_START_EST / maxMarks) * 100}%`,
                      width: `${((ELITE_END_EST - ELITE_START_EST) / maxMarks) * 100}%`
                    }}
                  />
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((progressPositive / maxMarks) * 100, 100)}%` }}
                    className="relative z-10 h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.5)]"
                  />
                  <div
                    className="absolute top-0 bottom-0 z-20 w-1.5 bg-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.8)] rounded-full"
                    style={{ left: `${(CUTOFF_ESTIMATE / maxMarks) * 100}%` }}
                  />
                </div>

                <div className="mt-4 flex justify-between text-[11px] font-black uppercase tracking-wider">
                  <span className="flex items-center gap-2 text-emerald-400">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" /> 
                    Net Score ({totalScore})
                  </span>
                  <span className="flex items-center gap-2 text-rose-400">
                    <div className="h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]" /> 
                    Penalty (-{progressNegative})
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3 pt-6 border-t border-slate-800/50">
                {[
                  { label: 'Correct', value: correctCount, color: 'text-emerald-400' },
                  { label: 'Wrong', value: wrongCount, color: 'text-rose-400' },
                  { label: 'Skipped', value: skippedCount, color: 'text-slate-500' },
                  { label: 'Accuracy', value: `${Math.round(accuracy)}%`, color: 'text-indigo-400' }
                ].map((stat, i) => (
                  <div key={i} className="text-center group transition-transform hover:scale-105">
                    <div className={cn("text-2xl font-black md:text-3xl", stat.color)}>{stat.value}</div>
                    <div className="text-[9px] font-black tracking-widest text-slate-600 uppercase mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {leaderboard && (
            <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-5">
                <h3 className="flex items-center gap-2.5 font-black text-slate-800 tracking-tight">
                  <Trophy className="h-5 w-5 text-amber-500" /> UPSC ZEN Leaderboard
                </h3>
                <Badge variant="outline" className="text-[10px] font-black tracking-widest uppercase border-slate-200 text-slate-400">
                  Top 10 Performers
                </Badge>
              </div>
              <div className="divide-y divide-slate-100">
                {leaderboard.leaderboard.map((entry: any, index: number) => {
                  const isCurrentUser = entry.userId === userId;
                  return (
                    <div
                      key={entry.id}
                      className={cn(
                        'flex items-center justify-between p-4 transition-all',
                        isCurrentUser ? 'bg-amber-50/50 border-l-4 border-l-amber-400' : 'hover:bg-slate-50/50'
                      )}
                    >
                      <div className="flex items-center gap-5">
                        <div className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-xl text-lg font-black shadow-sm',
                          index === 0 ? 'bg-amber-100 text-amber-700 ring-4 ring-amber-50' : 
                          index === 1 ? 'bg-slate-100 text-slate-600' : 
                          index === 2 ? 'bg-orange-50 text-orange-700' : 'text-slate-300'
                        )}>
                          {index === 0 ? '👑' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 text-sm font-black text-slate-900">
                            {isCurrentUser ? 'YOU' : entry.displayName || 'Anonymous User'}
                          </div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {Math.floor(entry.timeTakenSeconds / 60)}m {entry.timeTakenSeconds % 60}s
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-black text-slate-900">{entry.score}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Score</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      );
    };

    const renderReviewContent = () => {
      return (
        <div className="mt-4 space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-1 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Performance Intelligence</h3>
            </div>
            <div className="hidden sm:flex items-center gap-2 rounded-xl bg-slate-100 p-1">
              {['all', 'correct', 'wrong', 'skipped'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveQuestionTab(tab as any)}
                  className={cn(
                    "rounded-lg px-4 py-1.5 text-[10px] font-bold tracking-widest uppercase transition-all",
                    activeQuestionTab === tab ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
          
          <div className="space-y-4">
            {renderQuestionList()}
          </div>
        </div>
      );
    };

  if (isLoadingStats) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <LoadingQuotes />
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-slate-50 font-sans">
      <QuizHeader
        title={title}
        mode={mode}
        timeLeft={0}
        instantModeEnabled={false}
        isSubmitted={true}
        language={language}
        onLanguageToggle={() => {}}
        onExit={onExit || (() => router.push('/'))}
        translations={{
          instantMode: 'Review Mode',
          fullTest: 'Full Test',
          topicPractice: 'Practice',
        }}
      />

      <div className="flex-1 overflow-y-auto">
        <Tabs defaultValue="overview" className="w-full">
          <main className="mx-auto max-w-7xl px-4 py-8 md:px-6">
            {/* 🏆 STICKY PERFORMANCE HEADER */}
            <div className="sticky top-0 z-20 -mx-4 mb-8 bg-slate-50/80 px-4 pb-4 backdrop-blur-md md:-mx-6">
              <div className="flex flex-col items-center justify-between gap-6 rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-100">
                    <Trophy className="h-6 w-6" />
                  </div>
                  <div>
                    <h1 className="text-xl font-black tracking-tight text-slate-900 md:text-2xl">
                      {title || (isHindi ? 'परीक्षा परिणाम' : 'Test Results')}
                    </h1>
                    <div className="flex items-center gap-2">
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black tracking-widest text-emerald-600 uppercase ring-1 ring-emerald-500/10">
                        Score: {totalScore}/{maxMarks}
                      </div>
                      {isCutoffCleared ? (
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-black tracking-widest text-blue-600 uppercase ring-1 ring-blue-500/10">
                          Qualified
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-black tracking-widest text-amber-600 uppercase ring-1 ring-amber-500/10">
                          Attempt Review
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <ConnectSocials minimal className="hidden lg:flex" />

                <div className="flex w-full items-center gap-2 md:w-auto">
                  <TabsList className="h-12 flex-1 rounded-2xl border border-slate-200 bg-slate-50/50 p-1.5 md:flex-none">
                    <TabsTrigger
                      value="overview"
                      className="flex-1 rounded-xl px-4 text-[10px] font-black tracking-widest uppercase transition-all data-[state=active]:bg-slate-900 data-[state=active]:text-white md:px-6"
                    >
                      Result
                    </TabsTrigger>
                    <TabsTrigger
                      value="audit"
                      className="flex-1 rounded-xl px-4 text-[10px] font-black tracking-widest uppercase transition-all data-[state=active]:bg-slate-900 data-[state=active]:text-white md:px-6"
                    >
                      Audit
                    </TabsTrigger>
                    <TabsTrigger
                      value="review"
                      className="flex-1 rounded-xl px-4 text-[10px] font-black tracking-widest uppercase transition-all data-[state=active]:bg-slate-900 data-[state=active]:text-white md:px-6"
                    >
                      Review
                    </TabsTrigger>
                     <TabsTrigger
                      value="flashcards"
                      className="flex-1 rounded-xl px-4 text-[10px] font-black tracking-widest uppercase transition-all data-[state=active]:bg-slate-900 data-[state=active]:text-white md:px-6"
                    >
                      Cards
                    </TabsTrigger>
                  </TabsList>
                </div>
              </div>
            </div>

            <TabsContent value="overview" className="mt-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {renderResultContent()}
            </TabsContent>

            <TabsContent value="audit" className="mt-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
               <SmartQuizResult
                  testId={testId}
                  userId={userId}
                  title={title}
                  onRetry={onRetry}
                  onExit={onExit}
                  isGuest={isGuest}
                />
            </TabsContent>

            <TabsContent value="review" className="mt-0">
               {renderReviewContent()}
            </TabsContent>

            <TabsContent value="flashcards" className="mt-0">
               <div className="flex flex-col items-center justify-center rounded-[2.5rem] border border-dashed border-slate-200 bg-white py-24 text-center">
                  <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-600 shadow-sm">
                     <Zap className="h-10 w-10 animate-pulse" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Active Recall Cards</h3>
                  <p className="mx-auto mt-2 max-w-sm text-sm font-medium text-slate-500">
                     Generate active recall flashcards from your mistakes. Expert integration coming in the next session.
                  </p>
                  <Button className="mt-8 rounded-2xl bg-slate-950 font-black" disabled>
                     Coming Soon 🚀
                  </Button>
               </div>
            </TabsContent>
          </main>
        </Tabs>
      </div>

      <TestSeriesFeedbackModal
        isOpen={showFeedback}
        onClose={() => setShowFeedback(false)}
        onSubmit={handleFeedbackSubmit}
      />
    </div>
  );
}

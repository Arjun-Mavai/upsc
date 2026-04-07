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
  Lightbulb,
  AlertTriangle,
  Zap,
  BookOpen,
  ArrowRight,
  Target,
  Trophy,
  Lock,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Question } from '@/types/quiz';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
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
  const [showSimulatorLogic, setShowSimulatorLogic] = useState(false);
  const [isNavigatingToIntelligence, setIsNavigatingToIntelligence] = useState(false);

  const [showFeedback, setShowFeedback] = useState(false);

  // Ensure ?completed=true is in the URL whenever the result screen is shown.
  // This means a hard refresh will hit the server with completed=true and redirect
  // to /syllabus/quiz/pyq instead of reloading the test from scratch.
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
      // 1. Check LocalStorage (Global for both guests and logged-in users)
      const hasFeedbackStorage =
        typeof window !== 'undefined' ? localStorage.getItem('mppsc_feedback_given') : null;
      if (hasFeedbackStorage) {
        setShowFeedback(false);
        return;
      }

      // 2. Check SessionStorage (Legacy/Fallback)
      const currentTestId = testId || 'guest-test-result';
      const hasSeenSession =
        typeof window !== 'undefined'
          ? sessionStorage.getItem(`feedback_shown_${currentTestId}`)
          : null;
      if (hasSeenSession) {
        setShowFeedback(false);
        return;
      }

      // 3. For logged-in users, check database
      if (userId) {
        const submitted = await hasUserSubmittedFeedback();
        if (submitted) {
          setShowFeedback(false);
          // Sync with localStorage
          if (typeof window !== 'undefined') localStorage.setItem('mppsc_feedback_given', 'true');
          return;
        }
      }

      // If no feedback found anywhere, show it
      setShowFeedback(true);
      // Mark as shown in session to prevent flicker on re-renders,
      // but only set final 'given' status on actual submission
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(`feedback_shown_${currentTestId}`, 'true');
      }
    };

    checkFeedbackStatus();
  }, [testId, userId, showFeedbackModal]);

  const handleFeedbackSubmit = async (data: FeedbackFormType) => {
    console.log('QuizResult Feedback submitted:', data);

    try {
      // Get guest name from localStorage if active
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
        // Sync with localStorage on success
        if (typeof window !== 'undefined') localStorage.setItem('mppsc_feedback_given', 'true');
      } else {
        console.error('Failed to submit feedback:', response.error);
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

        // 🔧 PERF FIX: Parallelize independent operations (saves 200-400ms)
        // revalidateAnalyticsAction and getTestLeaderboard don't depend on each other
        const [, leaderboardData] = await Promise.all([
          revalidateAnalyticsAction(),
          testId ? getTestLeaderboard(testId, userId) : Promise.resolve(null),
        ]);

        if (leaderboardData) {
          setLeaderboard(leaderboardData);
        }

        // router.refresh() should run after cache invalidation is done
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

  const CUTOFF_PERCENTAGE = 0.76; // Updated to 76% for 300 marks exam (approx 228/300)
  const CUTOFF_ESTIMATE = Math.round(maxMarks * CUTOFF_PERCENTAGE);
  const isCutoffCleared = totalScore >= CUTOFF_ESTIMATE;

  // Render the detailed question analysis list
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
            'relative mb-4 overflow-hidden border-l-4',
            isCorrect
              ? 'border-l-emerald-500'
              : isSkipped
                ? 'border-l-slate-300'
                : 'border-l-rose-500' // Better red
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
              'cursor-pointer p-4 transition-colors hover:bg-slate-50',
              isLocked && 'cursor-not-allowed'
            )}
          >
            <div className="flex gap-4">
              <div className="mt-1">
                {isCorrect ? (
                  <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                ) : isSkipped ? (
                  <AlertCircle className="h-6 w-6 text-slate-300" />
                ) : (
                  <XCircle className="h-6 w-6 text-rose-500" />
                )}
              </div>
              <div className="flex-1">
                <div className="text-sm leading-snug font-bold text-slate-900 md:text-base">
                  <span className="mr-2 text-slate-400">Q{idx + 1}.</span>
                  <FormattedQuestionText
                    text={cleanMatchingQuestionText(q.question, q)}
                    className="inline"
                  />

                  {/* Time Taken Per Question */}
                  {questionTimes[q.id] !== undefined && (
                    <div className="ml-2 inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                      ⏱️ {Math.round(questionTimes[q.id])}s
                    </div>
                  )}

                  {q.type === 'matching' && (
                    <RenderTableQuestion
                      text={q.question}
                      matchPairs={q.matchPairs}
                      language="hi"
                      className="mt-2"
                    />
                  )}
                </div>

                {q.questionEn && (
                  <div className="mt-2 text-sm text-slate-500">
                    <FormattedQuestionText text={cleanMatchingQuestionText(q.questionEn, q)} />

                    {q.type === 'matching' && (
                      <RenderTableQuestion
                        text={q.questionEn}
                        matchPairs={q.matchPairs}
                        language="en"
                        className="mt-2 border-slate-300"
                      />
                    )}
                  </div>
                )}
              </div>
              <div className="text-slate-400">
                {isLocked ? (
                  <Lock className="h-5 w-5 text-amber-500" />
                ) : isExpanded ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </div>
            </div>
          </div>

          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="space-y-4 border-t border-slate-100 bg-slate-50/50 p-4"
            >
              {q.type === 'matching' && (
                <div className="mb-2 text-xs font-bold tracking-widest text-slate-400 uppercase">
                  Select the correct code:
                </div>
              )}
              <div className="space-y-2">
                {q.options.map((opt, optIdx) => {
                  const isSelected = userAnswer === optIdx;
                  const isCorrectOpt = getCorrectAnswerIndex(q.correctAnswer, q.options) === optIdx;

                  let styleClass = 'border-slate-200 bg-white text-slate-600';
                  if (isCorrectOpt)
                    styleClass = 'border-emerald-500 bg-emerald-50 text-emerald-800 font-bold';
                  else if (isSelected && !isCorrectOpt)
                    styleClass =
                      'border-rose-500 bg-rose-50 text-rose-800 line-through decoration-rose-500/50';

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
                        'flex items-center justify-between rounded-lg border p-3 text-sm',
                        styleClass
                      )}
                    >
                      <span>{optionText}</span>
                      {isCorrectOpt && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                      {isSelected && !isCorrectOpt && <XCircle className="h-4 w-4 text-rose-600" />}
                    </div>
                  );
                })}
              </div>

              <div
                className={cn(
                  'flex items-center gap-2 rounded-lg p-3 text-sm font-bold',
                  isCorrect
                    ? 'bg-emerald-100 text-emerald-800'
                    : isSkipped
                      ? 'bg-slate-100 text-slate-600'
                      : 'bg-rose-100 text-rose-800'
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
                    ? 'You answered correctly!'
                    : isSkipped
                      ? 'You skipped this question.'
                      : 'You answered incorrectly.'}
                </span>
              </div>

              <div className="rounded-xl border border-slate-100 bg-white p-4 text-sm shadow-sm">
                <div className="mb-2 flex items-center gap-1.5 text-xs font-bold tracking-wide text-slate-800 uppercase">
                  <AlertCircle className="h-4 w-4" /> Explanation
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

  // Content for Result Tab
  const renderResultContent = () => {
    // Math for progress bar segments to prevent overflow and visual glitches
    const progressPositive = Math.max(0, totalScore);
    const avgNegative = questions[0]?.negativeMarks ?? SCORING_CONFIG.NEGATIVE_MARKING;
    const progressNegative = Math.max(0, wrongCount * avgNegative);
    // Green = Score, Space = Skipped/Margin, Red = Penalty

    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6 pt-6 pb-12 duration-500">
        {/* Score Card Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-6 text-white shadow-xl">
          <div className="absolute top-0 right-0 -mt-20 -mr-20 h-64 w-64 rounded-full bg-slate-700/20 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl"></div>

          <div className="relative z-10">
            <div className="mb-2 text-sm font-bold text-slate-400 capitalize">
              {title || 'Test Result'}
            </div>

            <div className="mt-4 mb-8 flex flex-col items-center justify-between gap-6 sm:flex-row">
              <div>
                <div className="font-display flex items-baseline gap-1 text-6xl font-black">
                  {totalScore}
                  <span className="text-2xl font-bold text-slate-500">/{maxMarks}</span>
                </div>
                {wrongCount > 0 && (
                  <div className="mt-1 inline-flex rounded-full border border-rose-500/20 bg-rose-500/10 px-2 py-0.5 text-sm font-medium text-rose-400">
                    Includes penalty
                  </div>
                )}
              </div>

              <div className="flex flex-col items-center sm:items-end">
                <div className="text-4xl font-bold">{scorePercentage}%</div>
                {isCutoffCleared ? (
                  <div className="mt-2 inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/20 px-3 py-1.5 text-xs font-bold text-emerald-400 shadow-inner">
                    <TrendingUp className="mr-1.5 h-3 w-3" /> Est. Cleared (~{CUTOFF_ESTIMATE})
                  </div>
                ) : (
                  <div className="mt-2 inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/20 px-3 py-1.5 text-xs font-bold text-amber-400 shadow-inner">
                    <TrendingDown className="mr-1.5 h-3 w-3" /> Needs Push (~{CUTOFF_ESTIMATE})
                  </div>
                )}
              </div>
            </div>

            {/* CUTOFF PROGRESS BAR - Refined */}
            <div className="mb-8 w-full space-y-2.5">
              <div className="flex justify-between text-xs font-bold text-slate-400">
                <span>0</span>
                <span
                  className={cn(
                    'pr-12 transition-colors',
                    isCutoffCleared ? 'text-emerald-400' : 'text-amber-400'
                  )}
                >
                  Cutoff est. ~{CUTOFF_ESTIMATE}
                </span>
                <span>{maxMarks}</span>
              </div>

              <div className="relative flex h-4 w-full overflow-hidden rounded-full border border-slate-700/50 bg-slate-800/80 shadow-inner">
                {/* Visualizer: Score Segment */}
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((progressPositive / maxMarks) * 100, 100)}%` }}
                  className="relative z-10 h-full bg-emerald-500"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/0 to-white/20"></div>
                </motion.div>

                {/* Visualizer: Negative Marking Segment (Red at the end of the green) */}
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((progressNegative / maxMarks) * 100, 100)}%` }}
                  className="relative z-10 h-full bg-rose-500/90"
                  style={{
                    backgroundImage:
                      'repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(0,0,0,0.1) 5px, rgba(0,0,0,0.1) 10px)',
                  }}
                />

                {/* Cutoff Tick */}
                <div
                  className="absolute top-0 bottom-0 z-20 w-1 bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]"
                  style={{ left: `${(CUTOFF_ESTIMATE / maxMarks) * 100}%` }}
                />
              </div>

              <div className="mt-2 flex justify-between text-xs font-bold">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <div className="h-2 w-2 rounded-full bg-emerald-500"></div> Net Score (
                  {totalScore})
                </span>
                <span className="flex items-center gap-1.5 text-rose-400">
                  <div className="h-2 w-2 rounded-full bg-rose-500"></div> Penalty (-
                  {progressNegative})
                </span>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-4 gap-2 border-t border-slate-700/50 pt-5">
              <div className="group text-center">
                <div className="text-2xl font-black text-emerald-400 transition-transform group-hover:scale-110">
                  {correctCount}
                </div>
                <div className="mt-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  Correct
                </div>
              </div>
              <div className="group border-l border-slate-700/50 text-center">
                <div className="text-2xl font-black text-rose-400 transition-transform group-hover:scale-110">
                  {wrongCount}
                </div>
                <div className="mt-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  Wrong
                </div>
              </div>
              <div className="group border-l border-slate-700/50 text-center">
                <div className="text-2xl font-black text-slate-300 transition-transform group-hover:scale-110">
                  {skippedCount}
                </div>
                <div className="mt-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  Skipped
                </div>
              </div>
              <div className="group border-l border-slate-700/50 text-center">
                <div className="text-2xl font-black text-white transition-transform group-hover:scale-110">
                  {totalScore}
                </div>
                <div className="mt-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  Net Score
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RESTORED: LEADERBOARD TABLE */}
        {leaderboard && (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 p-4">
              <h3 className="flex items-center gap-2 font-bold text-slate-800">
                <Trophy className="h-5 w-5 text-amber-500" /> Top Performers
              </h3>
              <div className="text-xs font-medium text-slate-500">Only Top 10 shown</div>
            </div>
            <div className="divide-y divide-slate-100">
              {leaderboard.leaderboard.map((entry: any, index: number) => {
                const isCurrentUser = entry.userId === userId;
                return (
                  <div
                    key={entry.id}
                    className={cn(
                      'flex items-center justify-between p-3 transition-colors',
                      isCurrentUser ? 'bg-amber-50' : 'hover:bg-slate-50'
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold',
                          index === 0
                            ? 'bg-amber-100 text-amber-700'
                            : index === 1
                              ? 'bg-slate-200 text-slate-700'
                              : index === 2
                                ? 'bg-orange-100 text-orange-700'
                                : 'text-slate-400'
                        )}
                      >
                        {index === 0 && '👑'}
                        {index === 1 && '🥈'}
                        {index === 2 && '🥉'}
                        {index > 2 && index + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                          {isCurrentUser ? 'YOU' : entry.displayName}
                          {isCurrentUser && (
                            <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] text-slate-600">
                              ME
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {Math.floor(entry.timeTakenSeconds / 60)}m {entry.timeTakenSeconds % 60}s
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-700">{entry.score}</div>
                      <div className="text-[10px] text-slate-400">Score</div>
                    </div>
                  </div>
                );
              })}

              {/* Current user at bottom if out of top 10 */}
              {leaderboard.userRank > 10 && leaderboard.userEntry && (
                <>
                  <div className="border-y border-slate-100 bg-slate-50 p-2 text-center text-xs text-slate-400">
                    ...
                  </div>
                  <div className="flex items-center justify-between border-l-4 border-amber-400 bg-amber-50 p-3">
                    <div className="flex items-center gap-4">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-slate-500">
                        {leaderboard.userRank}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                          YOU
                          <span className="rounded bg-slate-900 px-1.5 py-0.5 text-[10px] text-white">
                            ME
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {Math.floor(leaderboard.userEntry.timeTakenSeconds / 60)}m{' '}
                          {leaderboard.userEntry.timeTakenSeconds % 60}s
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-700">{leaderboard.userEntry.score}</div>
                      <div className="text-[10px] text-slate-400">Score</div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Question Details Controller */}
        <div className="mt-8">
          <div className="mb-4 flex items-center gap-2">
            <h3 className="text-lg font-bold text-slate-900">Question Summary</h3>
          </div>
          <div className="sticky top-[72px] z-30 mb-6 max-w-full overflow-x-auto rounded-xl border border-slate-200 bg-white/80 p-2 shadow-sm backdrop-blur-md">
            <div className="flex min-w-max items-center gap-2">
              <Button
                variant={activeQuestionTab === 'all' ? 'default' : 'ghost'}
                onClick={() => setActiveQuestionTab('all')}
                className={cn(
                  'rounded-full px-4 text-sm font-bold transition-all',
                  activeQuestionTab === 'all'
                    ? 'bg-slate-800 text-white shadow-md hover:bg-slate-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                )}
              >
                All ({questions.length})
              </Button>
              <Button
                variant={activeQuestionTab === 'correct' ? 'default' : 'ghost'}
                onClick={() => setActiveQuestionTab('correct')}
                className={cn(
                  'rounded-full px-4 text-sm font-bold transition-all',
                  activeQuestionTab === 'correct'
                    ? 'bg-emerald-500 text-white shadow-md hover:bg-emerald-600'
                    : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-600'
                )}
              >
                <CheckCircle2 className="mr-1.5 h-4 w-4" /> Correct ({correctCount})
              </Button>
              <Button
                variant={activeQuestionTab === 'wrong' ? 'default' : 'ghost'}
                onClick={() => setActiveQuestionTab('wrong')}
                className={cn(
                  'rounded-full px-4 text-sm font-bold transition-all',
                  activeQuestionTab === 'wrong'
                    ? 'bg-rose-500 text-white shadow-md hover:bg-rose-600'
                    : 'text-slate-600 hover:bg-rose-50 hover:text-rose-600'
                )}
              >
                <XCircle className="mr-1.5 h-4 w-4" /> Wrong ({wrongCount})
              </Button>
              <Button
                variant={activeQuestionTab === 'skipped' ? 'default' : 'ghost'}
                onClick={() => setActiveQuestionTab('skipped')}
                className={cn(
                  'rounded-full px-4 text-sm font-bold transition-all',
                  activeQuestionTab === 'skipped'
                    ? 'bg-slate-500 text-white shadow-md hover:bg-slate-600'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-600'
                )}
              >
                <AlertCircle className="mr-1.5 h-4 w-4" /> Skipped ({skippedCount})
              </Button>
            </div>
          </div>

          <div className="space-y-4">{renderQuestionList()}</div>
        </div>
      </div>
    );
  };

  // Content for Strategy Tab
  const renderStrategyContent = () => {
    // Strategy AI analysis logic
    const isOverAttempting = wrongCount > totalQuestions * 0.15; // >15% wrong is dangerous
    const isUnderAttempting = attemptedCount < totalQuestions * 0.75; // <75% attempt is low

    // Accurate Simulator Math
    const calculateSimulatedScore = (attemptRate: number, accRate: number) => {
      const simAttempts = Math.round(totalQuestions * attemptRate);
      const simCorrect = Math.round(simAttempts * accRate);
      const simWrong = simAttempts - simCorrect;

      const marks = questions[0]?.marks ?? SCORING_CONFIG.MARKS_PER_QUESTION;
      const neg = questions[0]?.negativeMarks ?? SCORING_CONFIG.NEGATIVE_MARKING;

      const posMarks = simCorrect * marks;
      const negMarks = simWrong * neg;
      return parseFloat((posMarks - negMarks).toFixed(2));
    };

    const sim85score = calculateSimulatedScore(0.85, 0.82); // Attempt 85%, 82% precision
    const sim75score = calculateSimulatedScore(0.75, 0.9); // Attempt 75%, 90% precision

    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6 pt-6 pb-12 duration-500">
        <div>
          <h2 className="mb-1 text-2xl font-black tracking-tight text-slate-900">
            {isHindi ? 'प्रयास विश्लेषण' : 'Attempt Intelligence'}
          </h2>
          <p className="text-sm font-medium tracking-wide text-slate-500">
            {isHindi ? (
              <>
                {questions[0]?.marks ?? SCORING_CONFIG.MARKS_PER_QUESTION} अंक सही{' '}
                <span className="mx-1 font-bold text-rose-500">|</span> -
                {questions[0]?.negativeMarks ?? SCORING_CONFIG.NEGATIVE_MARKING} नकारात्मक अंकन
              </>
            ) : (
              <>
                {questions[0]?.marks ?? SCORING_CONFIG.MARKS_PER_QUESTION} marks correct{' '}
                <span className="mx-1 font-bold text-rose-500">|</span> -
                {questions[0]?.negativeMarks ?? SCORING_CONFIG.NEGATIVE_MARKING} negative marking
              </>
            )}
          </p>
        </div>

        <Card className="overflow-hidden border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 p-4">
            <h3 className="text-sm font-bold tracking-wide text-slate-800 uppercase">
              {isHindi ? 'आपका स्कोर गणित' : 'Your Attempt Math'}
            </h3>
            <span className="rounded-full bg-slate-200/50 px-2 py-1 text-xs text-[10px] font-bold text-slate-500">
              {isHindi ? 'इस मॉक का विश्लेषण' : 'This mock analysis'}
            </span>
          </div>
          <div className="divide-y divide-slate-100">
            <div className="flex items-center justify-between p-4 transition-colors hover:bg-slate-50/50">
              <span className="flex items-center gap-2 text-sm font-bold text-slate-600">
                <div className="h-1.5 w-1.5 rounded-full bg-slate-400"></div>{' '}
                {isHindi ? 'कुल प्रयास' : 'Attempted'}
              </span>
              <span className="font-bold text-slate-900">
                {attemptedCount}{' '}
                <span className="font-medium text-slate-400">/ {totalQuestions}</span>
              </span>
            </div>
            <div className="flex items-center justify-between p-4 transition-colors hover:bg-slate-50/50">
              <span className="flex items-center gap-2 text-sm font-bold text-slate-600">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>{' '}
                {isHindi ? 'सही प्रयास' : 'Correct attempts'}
              </span>
              <span className="font-bold text-emerald-600">
                {correctCount}{' '}
                <span className="mx-1 text-xs font-medium text-slate-400">
                  × {questions[0]?.marks ?? SCORING_CONFIG.MARKS_PER_QUESTION} =
                </span>{' '}
                +{correctCount * (questions[0]?.marks ?? SCORING_CONFIG.MARKS_PER_QUESTION)}
              </span>
            </div>
            <div className="flex items-center justify-between bg-rose-50/30 p-4 transition-colors hover:bg-slate-50/50">
              <span className="flex items-center gap-2 text-sm font-bold text-rose-700">
                <div className="h-1.5 w-1.5 rounded-full bg-rose-500"></div>{' '}
                {isHindi ? 'गलत प्रयास' : 'Wrong attempts'}
              </span>
              <span className="font-bold text-rose-600">
                {wrongCount}{' '}
                <span className="mx-1 text-xs font-medium text-slate-400">
                  × {questions[0]?.negativeMarks ?? SCORING_CONFIG.NEGATIVE_MARKING} =
                </span>{' '}
                -{wrongCount * (questions[0]?.negativeMarks ?? SCORING_CONFIG.NEGATIVE_MARKING)}
              </span>
            </div>
            <div className="flex items-center justify-between border-t-2 border-slate-200 bg-slate-50/80 p-4">
              <span className="pl-3.5 text-sm font-black tracking-widest text-slate-800 uppercase">
                {isHindi ? 'शुद्ध स्कोर' : 'Net Score'}
              </span>
              <span className="text-xl font-black text-slate-900">
                {totalScore}{' '}
                <span className="ml-0.5 text-sm font-bold text-slate-500">
                  {isHindi ? 'अंक' : 'pts'}
                </span>
              </span>
            </div>
            <div className="flex items-center justify-between p-4 transition-colors hover:bg-slate-50/50">
              <span className="pl-3.5 text-sm font-bold text-slate-600">
                {isHindi ? 'सटीकता दर' : 'Accuracy Rate'}
              </span>
              <span
                className={cn(
                  'flex items-center gap-2 font-bold',
                  accuracy >= 80 ? 'text-emerald-500' : 'text-amber-500'
                )}
              >
                {accuracy.toFixed(1)}%{' '}
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 opacity-70">
                  ({isHindi ? 'लक्ष्य' : 'Target'}: ≥80%)
                </span>
              </span>
            </div>
            <div
              className={cn(
                'flex items-center justify-between p-4 transition-colors hover:bg-slate-50/50',
                skippedCount > totalQuestions * 0.2 ? 'bg-amber-50/50' : ''
              )}
            >
              <span className="pl-3.5 text-sm font-bold text-slate-600">
                {isHindi ? 'छोड़े गए (सुरक्षित क्षेत्र)' : 'Skipped (Safe Zone)'}
              </span>
              <span className="font-bold text-emerald-600">
                {skippedCount}{' '}
                <span className="ml-1 text-xs font-medium text-slate-400">
                  {isHindi
                    ? `बचाए ~${skippedCount * (questions[0]?.negativeMarks ?? SCORING_CONFIG.NEGATIVE_MARKING)} नकारात्मक अंक`
                    : `saved ~${skippedCount * (questions[0]?.negativeMarks ?? SCORING_CONFIG.NEGATIVE_MARKING)} negative points`}
                </span>
              </span>
            </div>
          </div>
        </Card>

        {/* Strategy Gaps Box */}
        {(isOverAttempting || isUnderAttempting || accuracy < 80) && (
          <Card className="overflow-hidden border border-amber-500/30 bg-amber-50/60 shadow-sm">
            <div className="flex items-start gap-4 p-4">
              <div className="shrink-0 rounded-full bg-amber-100 p-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="mb-3 text-sm font-bold tracking-wide text-amber-900 uppercase">
                  {isHindi ? 'रणनीति में कमियां पाई गईं' : 'Strategy Gaps Identified'}
                </h3>
                <ul className="test-sm list-disc space-y-3 pl-4 font-medium text-amber-800 marker:text-amber-400">
                  {isOverAttempting && (
                    <li className="pl-1">
                      {isHindi ? (
                        <>
                          आपने <span className="font-bold">{wrongCount} गलत उत्तर</span> दिए। यह{' '}
                          {wrongCount *
                            (questions[0]?.negativeMarks ?? SCORING_CONFIG.NEGATIVE_MARKING)}{' '}
                          अंकों का नुकसान है। यदि आत्मविश्वास नहीं है, तो छोड़ना बेहतर है।
                        </>
                      ) : (
                        <>
                          You got <span className="font-bold">{wrongCount} wrong answers</span>.
                          That's{' '}
                          {wrongCount *
                            (questions[0]?.negativeMarks ?? SCORING_CONFIG.NEGATIVE_MARKING)}{' '}
                          points lost to negative marking. If not confident, it's better to skip.
                        </>
                      )}
                    </li>
                  )}
                  {accuracy < 80 && (
                    <li className="pl-1">
                      {isHindi ? (
                        <>
                          आपकी सटीकता <span className="font-bold">{accuracy.toFixed(0)}%</span> है।{' '}
                          {CUTOFF_ESTIMATE}+ कटऑफ को लगातार पास करने के लिए, सटीकता 80% से अधिक होनी
                          चाहिए।
                        </>
                      ) : (
                        <>
                          Your accuracy is <span className="font-bold">{accuracy.toFixed(0)}%</span>
                          . To consistently clear {CUTOFF_ESTIMATE}+ cutoffs, accuracy must exceed
                          80%.
                        </>
                      )}
                    </li>
                  )}
                  {isUnderAttempting && (
                    <li className="pl-1">
                      {isHindi ? (
                        <>
                          आपने केवल <span className="font-bold">{attemptedCount}</span> प्रश्न हल
                          किए। कटौती के साथ अच्छा स्कोर करने के लिए, कम से कम{' '}
                          {Math.round(totalQuestions * 0.8)} प्रश्नों का प्रयास करें।
                        </>
                      ) : (
                        <>
                          You attempted only <span className="font-bold">{attemptedCount}</span>{' '}
                          questions. To score well with deductions, try safely attempting at least{' '}
                          {Math.round(totalQuestions * 0.8)} questions.
                        </>
                      )}
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </Card>
        )}

        <Card className="overflow-hidden border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-800 bg-slate-900 p-4">
            <h3 className="flex items-center gap-2 text-sm font-bold tracking-wide text-white uppercase">
              <Target className="h-4 w-4 text-emerald-400" />{' '}
              {isHindi ? 'इष्टतम प्रयास सिम्युलेटर' : 'Optimal Attempt Simulator'}
            </h3>
          </div>
          <div className="border-b border-slate-100 bg-slate-50 p-4 text-xs font-bold tracking-widest text-slate-500 uppercase">
            {isHindi
              ? 'स्कोर अनुमान (सख्त नकारात्मक अंकन)'
              : 'Score Projections (Strict Negative Marking)'}
          </div>
          <div className="divide-y divide-slate-100 bg-white">
            <div className="flex items-center justify-between p-4 font-bold text-slate-700 transition-colors hover:bg-slate-50">
              <div className="flex flex-col">
                <span>
                  {isHindi ? 'प्रयास 85%' : 'Attempt 85%'}{' '}
                  <span className="ml-1 text-xs font-medium text-slate-400">
                    ({isHindi ? 'छोड़ें 15%' : 'Skip 15%'})
                  </span>
                </span>
                <span className="text-[10px] font-medium text-slate-400">
                  {isHindi ? 'मानता है 82% सटीकता' : 'Assumes 82% precision'}
                </span>
              </div>
              <div className="text-right">
                <span className="block text-lg text-emerald-600">~{sim85score}</span>
                <span className="text-[10px] text-slate-400">
                  {isHindi ? 'अनुमानित अंक' : 'Projected Marks'}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between border-l-4 border-l-transparent p-4 font-bold text-slate-700 transition-colors hover:bg-slate-50">
              <div className="flex flex-col">
                <span>
                  {isHindi ? 'प्रयास 75%' : 'Attempt 75%'}{' '}
                  <span className="ml-1 text-xs font-medium text-slate-400">
                    ({isHindi ? 'छोड़ें 25%' : 'Skip 25%'})
                  </span>
                </span>
                <span className="text-[10px] font-medium text-slate-400">
                  {isHindi ? 'मानता है 90% सटीकता' : 'Assumes 90% precision'}
                </span>
              </div>
              <div className="text-right">
                <span className="block text-lg text-emerald-500">~{sim75score}</span>
                <span className="text-[10px] text-slate-400">
                  {isHindi ? 'अनुमानित अंक' : 'Projected Marks'}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between border-l-4 border-l-amber-400 bg-amber-50/30 p-4 font-bold text-amber-700">
              <div className="flex flex-col">
                <span>{isHindi ? 'आपकी वर्तमान स्थिति' : 'Your Current State'}</span>
                <span className="text-[10px] font-medium text-amber-600/70">
                  {isHindi
                    ? `प्रयास ${attemptedCount} (${accuracy.toFixed(0)}% सटीकता)`
                    : `Attempted ${attemptedCount} (${accuracy.toFixed(0)}% precision)`}
                </span>
              </div>
              <div className="text-right">
                <span className="block text-lg">{totalScore}</span>
                <span className="text-[10px] opacity-70">
                  {isHindi ? 'वास्तविक अंक' : 'Actual Marks'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center gap-2 bg-emerald-50 p-3 text-center text-xs font-bold text-emerald-800">
            <div className="flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 fill-emerald-500" />
              {isHindi
                ? 'संतुलित प्रयास दर + उच्च सटीकता = अधिकतम शुद्ध स्कोर'
                : 'Balanced Attempt Rate + High Accuracy = Maximum Net Score'}
            </div>
            <button
              onClick={() => setShowSimulatorLogic(!showSimulatorLogic)}
              className="mt-1 flex items-center gap-1 text-[10px] text-emerald-600 underline decoration-emerald-300 underline-offset-2 hover:text-emerald-700"
            >
              {isHindi ? 'यह गणना कैसे की जाती है?' : 'How is this calculated?'}
              {showSimulatorLogic ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </button>

            {showSimulatorLogic && (
              <div className="animate-in slide-in-from-top-2 fade-in mt-2 w-full rounded-lg border border-emerald-100 bg-white/60 p-3 text-left text-[10px] leading-relaxed font-medium text-emerald-800 duration-200">
                <div className="mb-2">
                  <span className="mb-0.5 block font-bold text-emerald-900">
                    {isHindi
                      ? 'परिदृश्य 1: आक्रामक (85% प्रयास)'
                      : 'Scenario 1: Aggressive (85% Attempt)'}
                  </span>
                  85 Qs × 82% Accuracy ≈{' '}
                  <span className="font-bold text-emerald-700">70 Correct</span>, 15 Wrong
                  <br />
                  Score = (70 × 3) - (15 × 1) ={' '}
                  <span className="font-bold text-emerald-900">195 Marks</span>
                </div>
                <div>
                  <span className="mb-0.5 block font-bold text-emerald-900">
                    {isHindi
                      ? 'परिदृश्य 2: सटीक (75% प्रयास)'
                      : 'Scenario 2: Precision (75% Attempt)'}
                  </span>
                  75 Qs × 90% Accuracy ≈{' '}
                  <span className="font-bold text-emerald-700">68 Correct</span>, 7 Wrong
                  <br />
                  Score = (68 × 3) - (7 × 1) ={' '}
                  <span className="font-bold text-emerald-900">197 Marks</span>
                </div>
                <div className="mt-2 border-t border-emerald-200/50 pt-2 text-center text-emerald-600 italic">
                  {isHindi
                    ? 'निष्कर्ष: कम प्रयास लेकिन उच्च सटीकता अक्सर बेहतर स्कोर देती है।'
                    : 'Conclusion: Lower attempts with higher accuracy often yields a better score.'}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  };

  // Content for PYQ Analysis Tab
  const renderPYQAnalysisContent = () => {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 flex flex-col items-center justify-center space-y-8 pt-16 pb-20 text-center duration-500">
        <div className="max-w-sm space-y-3">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-amber-100 text-amber-600 shadow-sm">
            <Sparkles size={32} />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900">
            {isHindi ? 'विस्तृत PYQ इंटेलिजेंस' : 'Explore PYQ Intelligence'}
          </h2>
          <p className="text-sm leading-relaxed font-medium text-slate-500">
            {isHindi
              ? 'सभी 6 वर्षों के पेपर्स का गहरा विश्लेषण, रिपीटेड टॉपिक्स और ट्रेंड्स देखने के लिए नीचे बटन पर क्लिक करें।'
              : 'Dive deep into 6 years of paper analysis, see repeated topics, unit-wise weightage and emerging trends.'}
          </p>
        </div>

        <div className="group relative">
          <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 opacity-25 blur transition duration-1000 group-hover:opacity-50 group-hover:duration-200"></div>
          <Button
            asChild
            disabled={isNavigatingToIntelligence}
            onMouseEnter={() => router.prefetch('/syllabus/quiz/pyq/intelligence')}
            className="relative flex h-14 items-center gap-3 rounded-full bg-slate-950 px-10 font-black text-white shadow-2xl transition-all hover:scale-105 hover:bg-slate-900 active:scale-95 disabled:opacity-80"
          >
            <Link
              href="/syllabus/quiz/pyq/intelligence"
              onClick={() => setIsNavigatingToIntelligence(true)}
            >
              {isNavigatingToIntelligence ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
              ) : (
                <Sparkles className="h-5 w-5 animate-pulse text-amber-500" />
              )}

              <span className="text-lg">
                {isNavigatingToIntelligence
                  ? isHindi
                    ? 'खुल रहा है...'
                    : 'Loading...'
                  : isHindi
                    ? 'एक्सपर्ट इनसाइट्स खोलें'
                    : 'Open Expert Insights'}
              </span>
              {!isNavigatingToIntelligence && (
                <ArrowRight className="h-5 w-5 opacity-70 transition-transform group-hover:translate-x-1" />
              )}
            </Link>
          </Button>
        </div>

        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-slate-100/50 p-6">
          <div className="mb-4 text-[10px] font-black tracking-widest text-slate-400 uppercase">
            What you get inside
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1 text-left">
              <div className="text-xs font-bold text-slate-800">Unit Distribution</div>
              <div className="text-[10px] text-slate-500">Weightage of each unit</div>
            </div>
            <div className="space-y-1 text-left">
              <div className="text-xs font-bold text-slate-800">Repeated Topics</div>
              <div className="text-[10px] text-slate-500">Most frequent patterns</div>
            </div>
            <div className="space-y-1 text-left">
              <div className="text-xs font-bold text-slate-800">Trend Analysis</div>
              <div className="text-[10px] text-slate-500">Recent vs Old trends</div>
            </div>
            <div className="space-y-1 text-left">
              <div className="text-xs font-bold text-slate-800">Paper Wise</div>
              <div className="text-[10px] text-slate-500">Yearly subject mix</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* App-like Header */}
      <div className="sticky top-0 z-40 border-b border-slate-800 bg-slate-900 shadow-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (onExit) onExit();
                else router.push('/syllabus/quiz');
              }}
              className="h-10 w-10 rounded-full text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <Home className="h-5 w-5" />
            </Button>
            <h1 className="font-display max-w-[200px] truncate text-lg font-bold text-white sm:max-w-md">
              {title || 'Results'}
            </h1>
          </div>
          {!disableRetry && (
            <Button
              onClick={onRetry}
              variant="ghost"
              size="sm"
              className="font-bold text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Retry
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="result" className="mx-auto w-full max-w-3xl px-4 md:px-0">
        <div className="sticky top-[73px] z-40 border-b border-slate-200/60 bg-slate-50 pt-4 pb-2 shadow-sm/50">
          <TabsList
            className={cn(
              'grid w-full rounded-xl bg-slate-200/50 p-1',
              mode === 'pyq' ? 'grid-cols-3' : 'grid-cols-2'
            )}
          >
            <TabsTrigger
              value="result"
              className="rounded-lg py-2.5 text-sm font-bold text-slate-500 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
            >
              Result
            </TabsTrigger>
            <TabsTrigger
              value="strategy"
              className="rounded-lg py-2.5 text-sm font-bold text-slate-500 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
            >
              Strategy
            </TabsTrigger>
            {mode === 'pyq' && (
              <TabsTrigger
                value="pyq-analysis"
                className="rounded-lg py-2.5 text-sm font-bold text-slate-500 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
              >
                PYQ Analysis
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        <TabsContent value="result" className="m-0 focus-visible:outline-none">
          {renderResultContent()}
        </TabsContent>
        <TabsContent
          value="strategy"
          className={cn(
            'relative m-0 focus-visible:outline-none',
            isGuestLocked ? 'max-h-[500px] min-h-[300px] overflow-hidden' : 'min-h-[400px]'
          )}
        >
          {isGuestLocked && <PremiumLock label="Strategy Analysis Locked" />}
          <div className={isGuestLocked ? 'pointer-events-none blur-[6px] select-none' : ''}>
            {renderStrategyContent()}
          </div>
        </TabsContent>
        {mode === 'pyq' && (
          <TabsContent
            value="pyq-analysis"
            className={cn(
              'relative m-0 focus-visible:outline-none',
              isGuestLocked ? 'max-h-[500px] min-h-[300px] overflow-hidden' : 'min-h-[400px]'
            )}
          >
            {isGuestLocked && <PremiumLock label="PYQ Intelligence Locked" />}
            <div className={isGuestLocked ? 'pointer-events-none blur-[6px] select-none' : ''}>
              {renderPYQAnalysisContent()}
            </div>
          </TabsContent>
        )}
      </Tabs>

      <TestSeriesFeedbackModal
        isOpen={showFeedback}
        onClose={() => setShowFeedback(false)}
        onSubmit={handleFeedbackSubmit}
        testSeriesId={testId}
      />
    </div>
  );
}

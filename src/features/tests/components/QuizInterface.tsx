'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Question } from '@/types/quiz';
import { QuizResult } from './QuizResult';
import { useQuizLogic } from '@/hooks/useQuizLogic';
import { useSettingsStore } from '@/store/useSettingsStore';
import { createGuestEntry as createGuestUser } from '@/actions/guest-actions';
import { GuestResultTeaser } from '@/app/syllabus/quiz/play/GuestResultTeaser';
import { logger } from '@/lib/logger';
import { trackFbStandardEvent } from '@/lib/analytics/facebook-pixel';
import { requestFullscreenSafely, exitFullscreenSafely, isFullscreenActive, isFullscreenSupported } from '@/lib/fullscreen-utils';

import { QuizHeader } from './quiz/QuizHeader';
import { QuizQuestion } from './quiz/QuizQuestion';
import { QuizNavigation } from './quiz/QuizNavigation';
import { QuizPaletteMobile, QuizPaletteDesktop } from './quiz/QuizPalette';
import { QuizExitDialog } from './quiz/QuizExitDialog';
import { GuestEntryDialog } from './quiz/GuestEntryDialog';
import { QuizExplanation } from './quiz/QuizExplanation';
import { QUIZ_CONSTANTS } from '@/config/quiz';
import { getCorrectAnswerIndex } from '@/lib/quiz-scoring';
import { PYQFactsLoader } from '@/components/ui/PYQFactsLoader';

interface QuizInterfaceProps {
  questions: Question[];
  mode: 'topic' | 'full' | 'pyq';
  timeLimitInMinutes: number;
  testId: string;
  title?: string;
  userId: string | null;
  userName?: string;
  onExit: () => void;
  onRetry?: () => void;
  isInstantMode?: boolean;
  disablePalette?: boolean;
  hideFooter?: boolean;
}

export function QuizInterface(props: QuizInterfaceProps) {
  const {
    questions,
    mode,
    timeLimitInMinutes,
    title,
    onExit,
    disablePalette = false,
    testId,
    userId,
    userName,
  } = props;

  const {
    currentQuestionIndex,
    answers,
    markedforReview,
    isSubmitted,
    isSubmitting,
    timeLeft,
    instantModeEnabled,
    language,
    setInstantModeEnabled,
    handleOptionSelect,
    handleNext,
    handlePrev,
    handleJump,
    toggleMarkForReview,
    handleSubmit,
    handleRetry,
    getParsedOptions,
    currentQuestion,
    isAnswered,
    totalQuestions,
    questionTimes,
  } = useQuizLogic(props);

  const { setLanguage } = useSettingsStore();

  // UI state
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasAutoFullscreened, setHasAutoFullscreened] = useState(false);

  // Guest state
  const [showGuestTeaser, setShowGuestTeaser] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestMobile, setGuestMobile] = useState('');
  const [showGuestEntryDialog, setShowGuestEntryDialog] = useState(false);
  const [isSubmittingGuest, setIsSubmittingGuest] = useState(false);

  // No local facts state needed — PYQFactsLoader bundles facts internally

  // Translations
  const t = {
    exit: language === 'hi' ? 'बाहर जाएं' : 'Exit',
    instantMode: language === 'hi' ? 'इंस्टेंट मोड' : 'Instant Mode',
    fullTest: language === 'hi' ? 'पूर्ण टेस्ट' : 'Full Length Test',
    topicPractice: language === 'hi' ? 'टॉपिक अभ्यास' : 'Topic Practice',
    questionPalette: language === 'hi' ? 'प्रश्न पैलेट' : 'Question Palette',
    attempted: language === 'hi' ? 'प्रयास किया' : 'Attempted',
    submitTest: language === 'hi' ? 'टेस्ट जमा करें' : 'Submit Test',
    submit: language === 'hi' ? 'जमा करें' : 'Submit',
    next: language === 'hi' ? 'अगला' : 'Next',
    prev: language === 'hi' ? 'पिछा' : 'Prev',
    question: language === 'hi' ? 'प्रश्न' : 'Question',
    markReview: language === 'hi' ? 'समीक्षा के लिए मार्क करें' : 'Mark for Review',
    unmark: language === 'hi' ? 'अनमार्क' : 'Unmark',
    explanation: language === 'hi' ? 'व्याख्या' : 'Explanation',
    quitConfirm: language === 'hi' ? 'क्विज़ छोड़ें?' : 'Quit Quiz?',
    quitDesc:
      language === 'hi'
        ? 'क्या आप निश्चित रूप से बाहर निकलना चाहते हैं? आपकी प्रगति खो जाएगी।'
        : 'Are you sure you want to exit? Your progress will be lost and this session will not be saved.',
    cancel: language === 'hi' ? 'रद्द करें' : 'Cancel',
    yesExit: language === 'hi' ? 'हां, बाहर जाएं' : 'Yes, Exit',
    answered: language === 'hi' ? 'उत्तर दिया' : 'Answered',
    notAnswered: language === 'hi' ? 'उत्तर नहीं दिया' : 'Not Answered',
    review: language === 'hi' ? 'समीक्षा' : 'Review',
    current: language === 'hi' ? 'वर्तमान' : 'Current',
  };

  // ── Fullscreen helpers ──
  const requestFullscreen = useCallback(async () => {
    if (!isFullscreenActive()) {
      const success = await requestFullscreenSafely();
      if (success) {
        setIsFullscreen(true);
        localStorage.setItem('mppsc_quiz_fullscreen', 'true');
      } else {
        // Fullscreen failed or not supported - continue without it
        console.info('Fullscreen not available on this device');
      }
    }
  }, []);

  const handleConfirmedExit = useCallback(async () => {
    if (isFullscreenActive()) {
      const success = await exitFullscreenSafely();
      if (success) {
        setIsFullscreen(false);
        localStorage.removeItem('mppsc_quiz_fullscreen');
      }
    }
    onExit();
  }, [onExit]);

  const showExitModal = useCallback(() => setShowExitConfirm(true), []);

  const handleExitCancel = useCallback(() => {
    setShowExitConfirm(false);
    if (!isFullscreenActive() && !isSubmitted) {
      requestFullscreen();
    }
  }, [isSubmitted, requestFullscreen]);

  // ── Guest entry ──
  useEffect(() => {
    if (!userId && typeof window !== 'undefined') {
      const saved = localStorage.getItem('mppsc_guest_name');
      if (saved) setGuestName(saved);
      else setShowGuestEntryDialog(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGuestEntrySubmit = async () => {
    if (!guestName.trim()) return;
    setIsSubmittingGuest(true);
    try {
      localStorage.setItem('mppsc_guest_name', guestName.trim());
      await createGuestUser({ name: guestName, email: guestEmail, mobile: guestMobile });

      // 🎯 Track Lead generated when Guest gives contact info
      trackFbStandardEvent('Lead', {
        content_name: 'Guest Quiz Access',
        content_category: testId,
      });

      setShowGuestEntryDialog(false);
    } catch (error) {
      logger.error('Guest entry creation failed', error, {
        category: 'auth',
        metadata: { guestName, guestEmail },
      });
      // Optionally show an alert or toast here
    } finally {
      setIsSubmittingGuest(false);
    }
  };

  // ── Auto-fullscreen on mount ──
  useEffect(() => {
    if (!hasAutoFullscreened && !isSubmitted) {
      const timer = setTimeout(() => {
        requestFullscreen();
        setHasAutoFullscreened(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [hasAutoFullscreened, isSubmitted, requestFullscreen]);

  // ── Fullscreen change listener ──
  useEffect(() => {
    const handler = () => {
      if (!document.fullscreenElement && isFullscreen) {
        setIsFullscreen(false);
        setShowExitConfirm(true);
      }
    };
    document.addEventListener('fullscreenchange', handler);
    document.addEventListener('webkitfullscreenchange', handler);
    return () => {
      document.removeEventListener('fullscreenchange', handler);
      document.removeEventListener('webkitfullscreenchange', handler);
    };
  }, [isFullscreen]);

  // ── Browser back button → show exit modal ──
  useEffect(() => {
    if (isSubmitted) return;
    // Push a dummy state so we can intercept popstate
    window.history.pushState({ quizActive: true }, '');

    const handlePopState = () => {
      // Re-push state to prevent actual navigation
      window.history.pushState({ quizActive: true }, '');
      setShowExitConfirm(true);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isSubmitted]);

  // ── Submit handler (guest vs logged-in) ──
  const handleQuizSubmitAction = useCallback(() => {
    if (!userId) setShowGuestTeaser(true);
    else handleSubmit();
  }, [userId, handleSubmit]);

  // Bhai test khatam hua to fullscreen se bahar nikalo - user ko normal view me result dikhao
  useEffect(() => {
    if (showGuestTeaser || isSubmitted) {
      if (document.fullscreenElement) {
        document
          .exitFullscreen()
          .then(() => {
            setIsFullscreen(false);
            localStorage.removeItem('mppsc_quiz_fullscreen');
          })
          .catch(() => {});
      }

      // Update URL to include completed=true so that page refresh redirects back to test list
      if (isSubmitted) {
        const url = new URL(window.location.href);
        if (url.searchParams.get('completed') !== 'true') {
          url.searchParams.set('completed', 'true');
          window.history.replaceState(
            { ...window.history.state, quizActive: false },
            '',
            url.toString()
          );
        }
      }
    }
  }, [showGuestTeaser, isSubmitted]);

  // ── Early returns: result screens ──
  if (showGuestTeaser) {
    let earnedScore = 0;
    Object.entries(answers).forEach(([qId, ansIdx]) => {
      const q = questions.find((q) => q.id === qId);
      if (q) {
        if (getCorrectAnswerIndex(q.correctAnswer, q.options) === ansIdx) earnedScore += q.marks || QUIZ_CONSTANTS.MARKS_PER_QUESTION;
        else
          earnedScore -=
            q.negativeMarks !== undefined ? q.negativeMarks : QUIZ_CONSTANTS.NEGATIVE_MARKING;
      }
    });
    return (
      <GuestResultTeaser
        score={earnedScore}
        totalQuestions={questions.length}
        timeTaken={timeLimitInMinutes * 60 - timeLeft}
        guestName={guestName}
        onHome={() => (window.location.href = '/')}
      />
    );
  }

  if (isSubmitted && userId) {
    // 🎯 Reverted Smart Result for now, back to standard ranking view
    /* if (mode === 'pyq') {
      return (
        <SmartQuizResult
          testId={testId}
          userId={userId}
          title={title}
          onRetry={handleRetry}
          onExit={onExit}
        />
      );
    } */

    return (
      <QuizResult
        questions={questions}
        answers={answers}
        mode={mode}
        timeTaken={timeLimitInMinutes * 60 - timeLeft}
        questionTimes={questionTimes}
        onRetry={handleRetry}
        title={title}
        testId={testId}
        userId={userId}
        showFeedbackModal={false}  // Don't show feedback for logged-in users
      />
    );
  }

  // ── Palette props (shared between mobile drawer & desktop sidebar) ──
  const paletteProps = {
    questions,
    answers,
    markedForReview: markedforReview,
    currentIndex: currentQuestionIndex,
    totalQuestions,
    onJump: handleJump,
    onSubmit: handleQuizSubmitAction,
    translations: {
      questionPalette: t.questionPalette,
      attempted: t.attempted,
      answered: t.answered,
      notAnswered: t.notAnswered,
      review: t.review,
      current: t.current,
      submitTest: t.submitTest,
    },
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // MAIN QUIZ LAYOUT
  // Desktop: Header | [Content + Sidebar] | Bottom Nav
  // Mobile:  Header | Content | Bottom Nav
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 font-sans">
      {/* Fixed Header */}
      <QuizHeader
        title={title}
        mode={mode}
        timeLeft={timeLeft}
        instantModeEnabled={instantModeEnabled}
        isSubmitted={isSubmitted}
        language={language}
        onInstantModeToggle={() => setInstantModeEnabled(!instantModeEnabled)}
        onLanguageToggle={() => setLanguage(language === 'hi' ? 'en' : 'hi')}
        onExit={showExitModal}
        translations={{
          instantMode: t.instantMode,
          fullTest: t.fullTest,
          topicPractice: t.topicPractice,
        }}
        paletteButton={!disablePalette ? <QuizPaletteMobile {...paletteProps} /> : undefined}
      />

      {/* Main area: content + desktop sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Scrollable question area */}
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
            <QuizQuestion
              question={currentQuestion}
              questionIndex={currentQuestionIndex}
              totalQuestions={totalQuestions}
              selectedAnswer={answers[currentQuestion.id]}
              isAnswered={isAnswered}
              instantModeEnabled={instantModeEnabled}
              isMarkedForReview={markedforReview.includes(currentQuestion.id)}
              language={language}
              onOptionSelect={handleOptionSelect}
              onToggleReview={toggleMarkForReview}
              getParsedOptions={getParsedOptions}
              translations={{ question: t.question, markReview: t.markReview, unmark: t.unmark }}
            />

            {/* Explanation - no scroll limit, full content */}
            {instantModeEnabled && isAnswered && (
              <div className="mx-auto mt-4 max-w-3xl">
                <QuizExplanation
                  question={currentQuestion}
                  language={language}
                  translations={{ explanation: t.explanation }}
                />
              </div>
            )}
          </div>

          {/* Fixed Bottom Navigation */}
          <QuizNavigation
            currentIndex={currentQuestionIndex}
            totalQuestions={totalQuestions}
            onPrev={handlePrev}
            onNext={handleNext}
            onSubmit={handleQuizSubmitAction}
            translations={{ prev: t.prev, next: t.next, submit: t.submit }}
          />
        </main>

        {/* Desktop sidebar palette - always visible on lg+ */}
        {!disablePalette && <QuizPaletteDesktop {...paletteProps} />}
      </div>

      {/* Dialogs */}
      <QuizExitDialog
        open={showExitConfirm}
        onOpenChange={setShowExitConfirm}
        onCancel={handleExitCancel}
        onConfirmExit={handleConfirmedExit}
        translations={{
          quitConfirm: t.quitConfirm,
          quitDesc: t.quitDesc,
          cancel: t.cancel,
          yesExit: t.yesExit,
        }}
      />

      <GuestEntryDialog
        open={showGuestEntryDialog}
        guestName={guestName}
        guestEmail={guestEmail}
        guestMobile={guestMobile}
        isSubmitting={isSubmittingGuest}
        onNameChange={setGuestName}
        onEmailChange={setGuestEmail}
        onMobileChange={setGuestMobile}
        onSubmit={handleGuestEntrySubmit}
        onExit={showExitModal}
      />

      {/* Submission overlay */}
      {isSubmitting && <PYQFactsLoader variant="overlay" label="Submitting test..." />}
    </div>
  );
}

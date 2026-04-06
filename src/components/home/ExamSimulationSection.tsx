'use client';

/**
 * ExamSimulationSection — Real Exam Simulation wala dark section bhai!
 * Yeh ek interactive mock test demo hai — 4 questions ka mini quiz.
 * Intro → Active (answering) → Result — teen states hain.
 * All mock quiz state is self-contained inside this component.
 */

import React from 'react';
import { Trophy, CheckCircle2, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useSettingsStore } from '@/store/useSettingsStore';
import { calculateScore } from '@/lib/quiz-scoring';

export function ExamSimulationSection() {
  const { language } = useSettingsStore();

  const [mockStep, setMockStep] = React.useState<'intro' | 'active' | 'result'>('intro');
  const [mockQIndex, setMockQIndex] = React.useState(0);
  const [correctCount, setCorrectCount] = React.useState(0);
  const [wrongCount, setWrongCount] = React.useState(0);
  const [mockSelected, setMockSelected] = React.useState<number | null>(null);
  const [isPreparing, setIsPreparing] = React.useState(false);

  const mockQuestions = [
    {
      id: 1,
      q: 'As of 2024, what is the total number of districts in Madhya Pradesh?',
      q_hi: '2024 तक मध्य प्रदेश में कुल जिलों की संख्या कितनी है?',
      options: ['52', '53', '54', '55'],
      options_hi: ['52', '53', '54', '55'],
      correct: 3,
    },
    {
      id: 2,
      q: 'Which Article of the Constitution empowers the High Court to issue writs for the enforcement of Fundamental Rights?',
      q_hi: 'संविधान का कौन सा अनुच्छेद उच्च न्यायालय को मौलिक अधिकारों के प्रवर्तन के लिए रिट जारी करने की शक्ति देता है?',
      options: ['Article 32', 'Article 226', 'Article 131', 'Article 214'],
      options_hi: ['अनुच्छेद 32', 'अनुच्छेद 226', 'अनुच्छेद 131', 'अनुच्छेद 214'],
      correct: 1,
    },
    {
      id: 3,
      q: 'The "Patalkot" region of Chhindwara is primarily inhabited by which tribe?',
      q_hi: 'छिंदवाड़ा का "पातालकोट" क्षेत्र मुख्य रूप से किस जनजाति द्वारा बसा हुआ है?',
      options: ['Bhil', 'Gond', 'Bharia', 'Sahariya'],
      options_hi: ['भील', 'गोंड', 'भारिया', 'सहरिया'],
      correct: 2,
    },
    {
      id: 4,
      q: 'Who appoints the Judges of the Supreme Court of India under Article 124(2)?',
      q_hi: 'अनुच्छेद 124(2) के तहत भारत के सर्वोच्च न्यायालय के न्यायाधीशों की नियुक्ति कौन करता है?',
      options: ['Chief Justice of India', 'Prime Minister', 'President of India', 'Law Minister'],
      options_hi: ['भारत के मुख्य न्यायाधीश', 'प्रधानमंत्री', 'भारत के राष्ट्रपति', 'कानून मंत्री'],
      correct: 2,
    },
    {
      id: 5,
      q: 'Which is the newly formed 55th district of Madhya Pradesh?',
      q_hi: 'मध्य प्रदेश का नवनिर्मित 55वां जिला कौन सा है?',
      options: ['Mauganj', 'Maihar', 'Pandhurna', 'Niwari'],
      options_hi: ['मऊगंज', 'मैहर', 'पांढुर्णा', 'निवाड़ी'],
      correct: 1,
    },
  ];

  const handleMockStart = () => {
    setIsPreparing(true);
    setTimeout(() => {
      setIsPreparing(false);
      setMockStep('active');
      setMockQIndex(0);
      setCorrectCount(0);
      setWrongCount(0);
      setMockSelected(null);
    }, 600);
  };

  const handleMockAnswer = (idx: number) => {
    if (mockSelected !== null) return;
    setMockSelected(idx);

    setTimeout(() => {
      if (idx === mockQuestions[mockQIndex].correct) {
        setCorrectCount((s) => s + 1);
      } else {
        setWrongCount((s) => s + 1);
      }

      if (mockQIndex < mockQuestions.length - 1) {
        setMockQIndex((prev) => prev + 1);
        setMockSelected(null);
      } else {
        setMockStep('result');
      }
    }, 800);
  };

  const results = calculateScore(mockQuestions.length, correctCount, wrongCount);

  return (
    <section className="relative overflow-hidden bg-slate-900 py-32 text-white">
      {/* Background Mesh */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-slate-950"></div>
      <div className="pointer-events-none absolute top-0 right-0 h-[600px] w-[600px] rounded-full bg-rose-500/10 blur-[100px]"></div>

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-20 lg:grid-cols-2">
          <div className="order-2 flex justify-center lg:order-1 lg:justify-start">
            <div className="relative w-full max-w-lg">
              <div className="absolute -inset-1 animate-pulse rounded-3xl bg-gradient-to-r from-rose-500 to-pink-600 opacity-75 blur-md"></div>
              <Card className="relative z-10 flex min-h-[500px] flex-col overflow-hidden rounded-3xl border-0 bg-white text-slate-900 shadow-2xl transition-all duration-300">
                {/* HEADER */}
                <div className="flex shrink-0 items-center justify-between bg-slate-950 bg-[url('/grid.svg')] p-6 text-white">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'h-2 w-2 rounded-full',
                        mockStep === 'active' ? 'animate-ping bg-red-500' : 'bg-slate-500'
                      )}
                    />
                    <span className="text-sm font-bold tracking-widest text-slate-300 uppercase">
                      {mockStep === 'result'
                        ? language === 'hi'
                          ? 'टेस्ट परिणाम'
                          : 'Test Result'
                        : language === 'hi'
                          ? 'लाइव मॉक टेस्ट'
                          : 'Live Mock Test'}
                    </span>
                  </div>
                </div>

                {/* BODY */}
                <div className="flex flex-1 flex-col justify-center p-8">
                  {/* INTRO STATE */}
                  {mockStep === 'intro' && (
                    <div className="animate-in fade-in zoom-in space-y-6 text-center duration-300">
                      <div className="mx-auto mb-2 flex h-20 w-20 items-center justify-center rounded-full bg-rose-100">
                        <Trophy className="h-10 w-10 text-rose-600" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-slate-900">
                          {language === 'hi' ? 'चुनौती के लिए तैयार हैं?' : 'Ready to Challenge?'}
                        </h3>
                        <p className="mt-2 text-slate-500">
                          {language === 'hi'
                            ? 'अपनी तैयारी के स्तर को जांचने के लिए 5-प्रश्नों का डेमो टेस्ट लें।'
                            : 'Take a quick 5-question demo to see your preparation level.'}
                        </p>
                      </div>
                      <Button
                        onClick={handleMockStart}
                        disabled={isPreparing}
                        className="h-12 w-full rounded-xl bg-rose-600 font-bold text-white shadow-lg shadow-rose-200 transition-all hover:bg-rose-700 active:scale-95"
                      >
                        {isPreparing ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : language === 'hi' ? (
                          'डेमो टेस्ट शुरू करें'
                        ) : (
                          'Start Demo Test'
                        )}
                      </Button>
                    </div>
                  )}

                  {/* ACTIVE STATE */}
                  {mockStep === 'active' && (
                    <div className="animate-in slide-in-from-right fade-in w-full space-y-6 duration-300">
                      <div className="mb-2 flex gap-2">
                        {mockQuestions.map((_, idx) => (
                          <div
                            key={idx}
                            className={cn(
                              'h-1 flex-1 rounded-full transition-colors duration-300',
                              idx <= mockQIndex ? 'bg-rose-500' : 'bg-slate-100'
                            )}
                          />
                        ))}
                      </div>

                      <h3 className="flex min-h-[5rem] items-center text-lg leading-snug font-bold">
                        {language === 'hi'
                          ? (mockQuestions[mockQIndex] as any).q_hi
                          : mockQuestions[mockQIndex].q}
                      </h3>

                      <div className="grid grid-cols-1 gap-3">
                        {(language === 'hi'
                          ? (mockQuestions[mockQIndex] as any).options_hi
                          : mockQuestions[mockQIndex].options
                        ).map((opt: string, idx: number) => (
                          <div
                            key={idx}
                            onClick={() => handleMockAnswer(idx)}
                            className={cn(
                              'relative cursor-pointer overflow-hidden rounded-xl border border-slate-200 p-4 text-sm font-medium transition-all',
                              mockSelected === null
                                ? 'hover:border-slate-900 hover:bg-slate-50'
                                : mockSelected === idx
                                  ? idx === mockQuestions[mockQIndex].correct
                                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                                    : 'border-red-500 bg-red-50 text-red-900'
                                  : 'opacity-50'
                            )}
                          >
                            {opt}
                            {mockSelected === idx && (
                              <div className="absolute top-3.5 right-3">
                                {idx === mockQuestions[mockQIndex].correct ? (
                                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                ) : (
                                  <X className="h-5 w-5 text-red-600" />
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* RESULT STATE */}
                  {mockStep === 'result' && (
                    <div className="animate-in zoom-in fade-in space-y-6 text-center duration-500">
                      <div className="relative inline-block">
                        <div className="absolute -inset-4 animate-pulse rounded-full bg-emerald-500/20 blur-xl"></div>
                        <div className="relative flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-slate-900 shadow-xl">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-emerald-400">
                              {results.totalScore}
                              <span className="text-sm text-slate-500">/{results.maxMarks}</span>
                            </div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase">
                              Marks
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h3 className="text-2xl font-bold text-slate-900">
                          {correctCount === 4
                            ? language === 'hi'
                              ? 'शानदार!'
                              : 'Outstanding!'
                            : correctCount >= 2
                              ? language === 'hi'
                                ? 'बहुत अच्छे!'
                                : 'Good Job!'
                              : language === 'hi'
                                ? 'सुधार की आवश्यकता है'
                                : 'Needs Work'}
                        </h3>
                        <p className="text-sm text-slate-500">
                          {language === 'hi'
                            ? 'आप असली परीक्षा के लिए तैयार हैं। अब पूर्ण 100-प्रश्नों के मॉक टेस्ट अनलॉक करें।'
                            : "You're ready for the real deal. Unlock full 100-question mock tests now."}
                        </p>
                      </div>

                      <div className="flex justify-around rounded-xl border border-slate-100 bg-slate-50 p-3 text-center">
                        <div>
                          <div className="text-xl font-bold text-slate-900">
                            {results.percentage}%
                          </div>
                          <div className="text-xs text-slate-500">
                            {language === 'hi' ? 'सटीकता' : 'Accuracy'}
                          </div>
                        </div>
                        <div className="w-px bg-slate-200"></div>
                        <div>
                          <div className="text-xl font-bold text-slate-900">
                            {results.percentage >= 80
                              ? 'Top 5%'
                              : results.percentage >= 50
                                ? 'Top 25%'
                                : 'Top 60%'}
                          </div>
                          <div className="text-xs text-slate-500">
                            {language === 'hi' ? 'रैंक' : 'Rank'}
                          </div>
                        </div>
                      </div>

                      <Button
                        onClick={handleMockStart}
                        variant="ghost"
                        className="text-sm text-slate-400 hover:text-slate-900"
                      >
                        {language === 'hi' ? 'पुनः प्रयास करें' : 'Try Again'}
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>

          <div className="order-1 space-y-8 lg:order-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-sm font-bold text-rose-300">
              <Trophy size={14} /> {language === 'hi' ? 'परीक्षा तैयारी' : 'Exam Readiness'}
            </div>
            <h2 className="text-4xl font-extrabold tracking-tight text-white md:text-5xl">
              {language === 'hi' ? 'वास्तविक परीक्षा सिमुलेशन।' : 'Real Exam Simulation.'}
            </h2>
            <p className="text-lg leading-relaxed font-medium text-slate-400">
              {language === 'hi'
                ? 'UPSC 2026 Civil Services Prelims पैटर्न पर आधारित। 100 प्रश्न, 200 अंक, 2 घंटे — असली परीक्षा जैसा अनुभव।'
                : 'Practice with UPSC 2026 Civil Services Prelims pattern. 100 questions, 200 marks, 2 hours — real exam simulation.'}
            </p>
            <Button
              onClick={handleMockStart}
              disabled={isPreparing}
              className="h-14 rounded-full bg-rose-600 px-8 text-lg font-bold text-white shadow-lg shadow-rose-600/20 transition-all hover:bg-rose-500 active:scale-95"
            >
              {isPreparing ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : language === 'hi' ? (
                'फ्री मॉक टेस्ट शुरू करें'
              ) : (
                'Start Free Mock Test'
              )}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

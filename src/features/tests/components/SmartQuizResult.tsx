'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BrainCircuit, Trophy, Lightbulb, ShieldAlert, Repeat, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { calculateUPSCResult, SmartResultResponse } from '@/features/tests/actions/test-result';
import { useSettingsStore } from '@/store/useSettingsStore';

interface SmartQuizResultProps {
  testId?: string;
  userId?: string;
  title?: string;
  onRetry?: () => void;
  onExit?: () => void;
  initialResult?: SmartResultResponse;
  isGuest?: boolean;
}

export function SmartQuizResult({
  testId,
  userId,
  title,
  onRetry,
  onExit,
  initialResult,
  isGuest = false,
}: SmartQuizResultProps) {
  const router = useRouter();
  const [result, setResult] = useState<SmartResultResponse | null>(initialResult || null);
  const [loading, setLoading] = useState(!initialResult);
  const { language } = useSettingsStore();
  const isHi = language === 'hi';

  useEffect(() => {
    async function fetchResult() {
      if (!testId || initialResult) return;
      try {
        const res = await calculateUPSCResult(testId);
        if ('error' in res) {
          console.error(res.error);
        } else {
          setResult(res as SmartResultResponse);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchResult();
  }, [testId, initialResult]);

  const handleUnlock = () => {
    router.push('/pricing');
  };

  const PremiumLock = ({ label }: { label: string }) => (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-lg border border-slate-100 bg-white/60 backdrop-blur-[2px]">
      <div className="max-w-[200px] rounded-2xl border border-slate-100 bg-white p-4 text-center shadow-xl">
        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
          <Lock className="h-5 w-5 text-amber-600" />
        </div>
        <p className="mb-2 text-sm font-bold text-slate-800">{label}</p>
        <Button
          size="sm"
          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 font-bold text-white hover:from-amber-600 hover:to-orange-600"
          onClick={handleUnlock}
        >
          Unlock Now
        </Button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <h2 className="text-xl font-semibold text-slate-800">Analyzing Performance...</h2>
          <p className="text-slate-500">Calculating negative marking impact & topic trends</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return <div className="p-8 text-center">Failed to load results. Please try again.</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-4 py-3 shadow-sm">
        <div>
          <h1 className="line-clamp-1 text-lg font-bold text-slate-900">
            {title || 'Test Result'}
          </h1>
          <p className="text-xs text-slate-500">UPSC Prelims Analysis</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onExit}>
          {isHi ? 'बाहर जाएं' : 'Exit'}
        </Button>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-3xl space-y-6 p-4">
        {/* Score Card */}
        <Card className="relative overflow-hidden border-none bg-white shadow-md">
          <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
          <CardContent className="p-6">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <p className="mb-1 text-sm font-medium text-slate-500">Net Score (New Pattern)</p>
                <div className="flex items-baseline gap-2">
                  <h2 className="text-4xl font-bold text-slate-900">{result.net_score}</h2>
                  <span className="text-slate-400">/ {result.max_score}</span>
                </div>
                {result.qualification && (
                  <Badge
                    variant={
                      result.qualification.status === 'Qualified' ? 'default' : 'destructive'
                    }
                    className="mt-2"
                  >
                    {result.qualification.status === 'Qualified' ? 'Qualified' : 'Missed Cutoff'}
                  </Badge>
                )}
              </div>
              <div className="text-right">
                <div
                  className={`text-2xl font-bold ${getGradeColor(result.attempt_intelligence.strategy_grade)}`}
                >
                  Grade {result.attempt_intelligence.strategy_grade}
                </div>
                <p className="text-xs text-slate-500">Strategy Score</p>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="mb-6 grid grid-cols-3 gap-4">
              <div className="rounded-lg border border-green-100 bg-green-50 p-3 text-center">
                <div className="text-2xl font-bold text-green-700">{result.correct}</div>
                <div className="text-xs font-medium text-green-600">Correct (+3)</div>
              </div>
              <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-center">
                <div className="text-2xl font-bold text-red-700">{result.wrong}</div>
                <div className="text-xs font-medium text-red-600">Wrong (-1)</div>
              </div>
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-center">
                <div className="text-2xl font-bold text-slate-700">{result.skipped}</div>
                <div className="text-xs font-medium text-slate-600">Skipped</div>
              </div>
            </div>

            {/* Attempt Intelligence */}
            <div className="relative overflow-hidden rounded-lg border border-amber-100 bg-amber-50 p-4">
              <div className="flex items-start gap-3">
                <BrainCircuit className="mt-1 h-5 w-5 flex-shrink-0 text-amber-600" />
                <div>
                  <h3 className="text-sm font-semibold text-amber-900">Attempt Intelligence</h3>
                  <p className="mt-1 text-xs leading-relaxed text-amber-800">
                    You lost{' '}
                    <span className="font-bold">
                      {result.attempt_intelligence.wasted_points} marks
                    </span>{' '}
                    due to negative marking. If you had skipped those wrong answers, your score
                    would be{' '}
                    <span className="font-bold">
                      {result.attempt_intelligence.could_have_scored}
                    </span>
                    .
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for detailed view */}
        <Tabs defaultValue="analysis" className="w-full">
          <TabsList className="mb-4 grid w-full grid-cols-3">
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
            <TabsTrigger value="review">Review</TabsTrigger>
            <TabsTrigger value="facts">Flashcards</TabsTrigger>
          </TabsList>

          {/* ANALYSIS TAB */}
          <TabsContent value="analysis" className="relative space-y-4">
            {isGuest && <PremiumLock label="Detailed Analysis Locked" />}
            <h3 className="mb-2 text-sm font-semibold tracking-wider text-slate-500 uppercase">
              Subject Performance
            </h3>
            {result.subject_breakdown.map((sub) => (
              <div key={sub.subject} className="rounded-xl border bg-white p-4 shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-medium text-slate-800">{sub.subject}</span>
                  <span
                    className={`text-sm font-bold ${sub.score >= 0 ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {sub.score} pts
                  </span>
                </div>
                <div className="flex h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    style={{ width: `${(sub.correct / sub.total) * 100}%` }}
                    className="h-full bg-green-500"
                  />
                  <div
                    style={{ width: `${(sub.wrong / sub.total) * 100}%` }}
                    className="h-full bg-red-500"
                  />
                </div>
                <div className="mt-2 flex justify-between text-xs text-slate-400">
                  <span>{sub.correct} Correct</span>
                  <span>{sub.wrong} Wrong</span>
                </div>
              </div>
            ))}
          </TabsContent>

          {/* REVIEW TAB (All Questions) */}
          <TabsContent value="review" className="relative min-h-[200px] space-y-4">
            {result.detailed_analysis?.map((q: any, idx: number) => {
              const isLocked = isGuest && q.status !== 'correct';
              return (
                <Card
                  key={idx}
                  className={`border-l-4 shadow-sm ${
                    q.status === 'correct'
                      ? 'border-l-green-500'
                      : q.status === 'wrong'
                        ? 'border-l-red-500'
                        : 'border-l-slate-300'
                  } relative overflow-hidden`}
                >
                  {/* Lock Overlay for Guest on Wrong/Skipped */}
                  {isLocked && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/10 backdrop-blur-[4px]">
                      <div className="rounded-xl border border-slate-100 bg-white p-3 text-center shadow-lg">
                        <div className="mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-amber-50">
                          <Lock className="h-4 w-4 text-amber-600" />
                        </div>
                        <p className="mb-1 text-xs font-bold text-slate-800">Unlock Solution</p>
                        <Button
                          size="sm"
                          className="h-7 bg-amber-500 text-xs text-white hover:bg-amber-600"
                          onClick={handleUnlock}
                        >
                          Upgrade
                        </Button>
                      </div>
                    </div>
                  )}

                  <CardContent className="p-4">
                    <div className="mb-2 flex items-start justify-between">
                      <Badge variant="outline" className="text-xs">
                        {q.subject || 'General'}
                      </Badge>
                      <Badge
                        variant={
                          q.status === 'correct'
                            ? 'default'
                            : q.status === 'wrong'
                              ? 'destructive'
                              : 'secondary'
                        }
                        className="text-[10px] uppercase"
                      >
                        {q.status}
                      </Badge>
                    </div>

                    <p className="mb-3 text-sm font-medium text-slate-800">
                      <span className="mr-2 text-slate-400">Q{idx + 1}.</span>
                      {q.questionText || q.question || 'Question Text'}
                    </p>

                    <div className="space-y-1 rounded bg-slate-50 p-3 text-xs text-slate-600">
                      <p className={q.status === 'correct' ? 'font-bold text-green-700' : ''}>
                        <span className="font-semibold text-slate-500">Your Answer:</span>{' '}
                        {q.userAnswer ?? 'Skipped'}
                      </p>
                      {!isLocked && (
                        <p>
                          <span className="font-semibold text-slate-500">Correct Answer:</span>{' '}
                          {q.correctAnswer}
                        </p>
                      )}
                    </div>

                    {!isLocked && q.explanation && (
                      <div className="mt-3 border-t pt-2 text-xs text-slate-600">
                        <span className="mb-1 block font-semibold">Explanation:</span>
                        {q.explanation}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          {/* FACTS TAB (Flashcards) */}
          <TabsContent value="facts" className="relative min-h-[200px] space-y-4">
            {isGuest && <PremiumLock label="Flashcards Locked" />}
            {result.pyq_facts.length === 0 ? (
              <div className="py-10 text-center text-slate-500">
                No high-yield facts linked to your mistakes.
              </div>
            ) : (
              <div className="grid gap-4">
                {result.pyq_facts.map((fact: any) => (
                  <Card
                    key={fact.id}
                    className="overflow-hidden border-l-4 border-l-amber-400 shadow-sm"
                  >
                    <CardContent className="p-5">
                      <div className="mb-3 flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className="bg-amber-100 text-amber-800 hover:bg-amber-200"
                        >
                          {fact.subject}
                        </Badge>
                        {fact.importanceScore > 8 && (
                          <span className="flex items-center gap-1 text-xs font-bold text-red-600">
                            <Trophy className="h-3 w-3" /> High Yield
                          </span>
                        )}
                      </div>

                      <p className="mb-4 text-sm leading-relaxed font-medium text-slate-800">
                        {isHi && fact.factText ? fact.factText : fact.factTextEn || fact.factText}
                      </p>

                      {(fact.memoryTip || fact.memoryTipEn) && (
                        <div className="mb-3 rounded-lg border border-blue-100 bg-blue-50 p-3">
                          <div className="mb-1 flex items-center gap-2 text-blue-800">
                            <Lightbulb className="h-4 w-4" />
                            <span className="text-xs font-bold uppercase">Memory Tip</span>
                          </div>
                          <p className="text-xs text-blue-700">
                            {isHi && fact.memoryTip
                              ? fact.memoryTip
                              : fact.memoryTipEn || fact.memoryTip}
                          </p>
                        </div>
                      )}

                      {(fact.scamAlert || fact.scamAlertEn) && (
                        <div className="rounded-lg border border-red-100 bg-red-50 p-3">
                          <div className="mb-1 flex items-center gap-2 text-red-800">
                            <ShieldAlert className="h-4 w-4" />
                            <span className="text-xs font-bold uppercase">Scam Alert</span>
                          </div>
                          <p className="text-xs text-red-700">
                            {isHi && fact.scamAlert
                              ? fact.scamAlert
                              : fact.scamAlertEn || fact.scamAlert}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 z-20 flex w-full gap-3 border-t bg-white p-4 shadow-lg">
        <Button variant="outline" className="flex-1" onClick={onRetry}>
          <Repeat className="mr-2 h-4 w-4" /> Retry
        </Button>
        <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={onExit}>
          Finish Analysis
        </Button>
      </div>
    </div>
  );
}

function getGradeColor(grade: string) {
  switch (grade) {
    case 'A':
      return 'text-green-600';
    case 'B':
      return 'text-blue-600';
    case 'C':
      return 'text-amber-600';
    default:
      return 'text-red-600';
  }
}

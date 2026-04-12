'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BrainCircuit, Trophy, Lightbulb, ShieldAlert, Repeat, Lock, Clock, Target, Plus, Minus,
  TrendingDown, ChevronRight, Zap, Landmark, Map, Compass, PieChart, FlaskConical,
  Languages, Globe, BookOpen, Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { calculateUPSCResult, SmartResultResponse } from '@/features/tests/actions/test-result';
import { useSettingsStore } from '@/store/useSettingsStore';
import { cn } from '@/lib/utils';
import { ConnectSocials } from '@/components/ConnectSocials';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

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
  const { language, setLanguage } = useSettingsStore();
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
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-[2rem] border border-slate-100 bg-white/60 backdrop-blur-[2px]">
      <div className="max-w-[200px] rounded-[2rem] border-b-4 border-amber-500/20 bg-white p-6 text-center shadow-xl">
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

  const wrongCount = result.wrong;
  const totalQuestions = result.total_questions || result.detailed_analysis?.length || 0;
  const attemptedCount = result.correct + result.wrong;
  const accuracy = attemptedCount > 0 ? (result.correct / attemptedCount) * 100 : 0;
  
  const isOverAttempting = wrongCount > totalQuestions * 0.15;

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans">
      <div className="pt-6">
        <div className="mx-auto max-w-3xl px-4">
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-100 shadow-sm">
                <Trophy className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-lg font-black tracking-tight text-slate-900 leading-tight">
                  {title || (isHi ? 'क्विज़ रिजल्ट' : 'Quiz Result')}
                </h1>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Performance Intelligence Analysis
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
                <ConnectSocials minimal className="flex-1 sm:flex-none" />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl p-4">
        <Tabs defaultValue="result" className="w-full">
          <TabsList className="mb-6 grid w-full grid-cols-2 rounded-2xl bg-white p-1 shadow-sm border border-slate-100">
            <TabsTrigger value="result" className="rounded-xl py-3 text-[11px] font-black tracking-widest uppercase transition-all data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md">
              {isHi ? 'परिणाम' : 'Result'}
            </TabsTrigger>
            <TabsTrigger value="review" className="rounded-xl py-3 text-[11px] font-black tracking-widest uppercase transition-all data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md">
              {isHi ? 'समीक्षा' : 'Review'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="result" className="space-y-6 outline-none">
            {/* Main Score Card */}
            <div className="group relative overflow-hidden rounded-[2.5rem] border-b-4 border-indigo-500/20 bg-white p-8 shadow-sm transition-all hover:shadow-md">
              <div className="absolute top-0 left-0 h-1.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-20" />
              
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[11px] font-black tracking-widest text-slate-400 uppercase">
                  <Target className="h-4 w-4 text-amber-500" />
                  Expert Verified Analysis
                </div>
                <Badge variant="secondary" className="rounded-full px-3 py-1 text-[10px] font-black tracking-widest uppercase">
                  {totalQuestions} Questions
                </Badge>
              </div>

              <div className="mb-8 flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
                <div>
                  <p className="mb-1 text-xs font-bold tracking-widest text-slate-400 uppercase">Net Score (UPSC Standard)</p>
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-6xl font-black text-slate-900 tracking-tighter">{result.net_score}</h2>
                    <span className="text-2xl font-bold text-slate-400">/ {result.max_score}</span>
                  </div>
                  
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                     <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-black tracking-widest text-emerald-600 uppercase border border-emerald-500/10">
                        <Plus className="h-3 w-3" /> {result.correct} Correct
                     </div>
                     <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-3 py-1 text-[10px] font-black tracking-widest text-rose-600 uppercase border border-rose-500/10">
                        <Minus className="h-3 w-3" /> {result.wrong} Penalty
                     </div>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-4 sm:items-end">
                  {result.qualification && (
                    <div className={cn(
                      "inline-flex items-center rounded-2xl px-4 py-2 text-xs font-black shadow-sm border",
                      result.net_score >= (result.max_score * 0.48)
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                    )}>
                      {result.net_score >= (result.max_score * 0.48) ? (
                        <><Trophy className="mr-2 h-4 w-4" /> QUALIFIED</>
                      ) : (
                        <><TrendingDown className="mr-2 h-4 w-4" /> PUSH NEEDED</>
                      )}
                    </div>
                  )}
                  
                  <div className="flex gap-4">
                    <div className="text-center sm:text-right">
                      <div className={`text-2xl font-black ${getGradeColor(result.attempt_intelligence.strategy_grade)}`}>
                        Grade {result.attempt_intelligence.strategy_grade}
                      </div>
                      <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Strategy</p>
                    </div>
                    <div className="h-8 w-[1px] bg-slate-100" />
                    <div className="text-center sm:text-right">
                      <div className="text-2xl font-black text-amber-500">
                        {result.detailed_analysis?.reduce((acc: number, curr: any) => acc + (curr.timeTakenSeconds || 0), 0) > 0 
                          ? `${Math.floor(result.detailed_analysis.reduce((acc: number, curr: any) => acc + (curr.timeTakenSeconds || 0), 0) / 60)}m`
                          : '--'}
                      </div>
                      <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Duration</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                 <div className="flex justify-between text-[10px] font-black tracking-widest text-slate-400 uppercase">
                    <span>Performance Scale</span>
                    <span className="text-indigo-500">Elite Zone: {Math.round(result.max_score * 0.55)}+</span>
                 </div>
                 <div className="relative flex h-3 w-full overflow-hidden rounded-full bg-slate-100 border border-slate-200">
                    <div className="absolute left-[48%] z-20 h-full w-[1.5px] bg-amber-500" />
                    <div className="absolute left-[55%] z-20 h-full w-[1.5px] bg-indigo-500/50" />
                    <motion.div
                       initial={{ width: 0 }}
                       animate={{ width: `${Math.min((result.net_score / result.max_score) * 100, 100)}%` }}
                       className="relative z-10 h-full bg-gradient-to-r from-emerald-500 to-indigo-500"
                    />
                 </div>
                 <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                    <span>0 Marks</span>
                    <span className="text-amber-500">Target Range ({Math.round(result.max_score * 0.48)})</span>
                    <span>Max ({result.max_score})</span>
                 </div>
              </div>
            </div>

            {/* 
              Future Implementation: Audit & Strategic Intelligence Cards 
              Bhai, yaha par wo audit cards aayenge jab feature full activate hoga.
            */}
            {/*
            {(isOverAttempting || accuracy < 75) && (
              <div className="group relative overflow-hidden rounded-[2rem] border-b-4 border-rose-500/20 bg-white p-6 shadow-sm transition-all hover:shadow-md">
                 ... Audit Card Content ...
              </div>
            )}
            */}
          </TabsContent>

          <TabsContent value="review" className="space-y-4 outline-none">
             <div className="flex items-center justify-between px-2 mb-2">
                <h3 className="text-sm font-black tracking-widest text-slate-400 uppercase">{isHi ? 'समीक्षा' : 'Review Performance'}</h3>
                <Badge variant="outline" className="text-[10px] font-black border-slate-200 text-slate-400">DETAILED VIEW</Badge>
             </div>
             
             <div className="space-y-4">
              {result.detailed_analysis?.map((q: any, idx: number) => {
                const isLocked = isGuest && q.status !== 'correct';
                return (
                  <div
                    key={idx}
                    className={cn(
                      "group relative overflow-hidden rounded-[1.5rem] border-l-8 bg-white p-6 shadow-sm transition-all hover:shadow-md",
                      q.status === 'correct' ? 'border-l-emerald-500' : q.status === 'wrong' ? 'border-l-rose-500' : 'border-l-slate-300'
                    )}
                  >
                    {isLocked && (
                      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/40 backdrop-blur-[4px]">
                         <PremiumLock label="Solution Locked" />
                      </div>
                    )}

                    <div className="mb-4 flex items-center justify-between">
                      <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest border-slate-200 text-slate-500">
                         {q.subject || 'GS'} • Q{idx + 1}
                      </Badge>
                      <div className={cn(
                        "flex h-6 items-center px-2 rounded-full text-[9px] font-black uppercase tracking-widest",
                        q.status === 'correct' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
                      )}>
                        {q.status}
                      </div>
                    </div>

                    <p className="mb-4 text-sm font-bold leading-relaxed text-slate-900">
                      {q.questionText || q.question}
                    </p>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                         <span className="block mb-1 text-[9px] font-black text-slate-400 uppercase">Your Choice</span>
                         <span className="text-xs font-bold text-slate-700">{q.userAnswer || 'Skipped'}</span>
                      </div>
                      {!isLocked && (
                        <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3">
                           <span className="block mb-1 text-[9px] font-black text-emerald-500 uppercase">Correct Answer</span>
                           <span className="text-xs font-bold text-emerald-700">{q.correctAnswer}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
             </div>
          </TabsContent>
        </Tabs>
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

function getSubjectIcon(subject: string) {
  const s = subject.toLowerCase();
  if (s.includes('history')) return <Landmark className="h-4 w-4" />;
  if (s.includes('geography')) return <Map className="h-4 w-4" />;
  if (s.includes('polity')) return <Compass className="h-4 w-4" />;
  if (s.includes('economy')) return <PieChart className="h-4 w-4" />;
  if (s.includes('science')) return <FlaskConical className="h-4 w-4" />;
  if (s.includes('hindi') || s.includes('english')) return <Languages className="h-4 w-4" />;
  if (s.includes('current')) return <Globe className="h-4 w-4" />;
  return <BookOpen className="h-4 w-4" />;
}

function getSubjectColor(subject: string) {
  const s = subject.toLowerCase();
  if (s.includes('history')) return 'border-amber-100 text-amber-600';
  if (s.includes('geography')) return 'border-emerald-100 text-emerald-600';
  if (s.includes('polity')) return 'border-blue-100 text-blue-600';
  if (s.includes('economy')) return 'border-indigo-100 text-indigo-600';
  return 'border-slate-100 text-slate-600';
}

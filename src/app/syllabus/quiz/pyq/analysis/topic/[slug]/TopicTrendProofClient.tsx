'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  FileText,
  TrendingUp,
  Zap,
  ChevronRight,
  ShieldCheck,
  History,
  Target,
  Search,
  Calculator,
  BookOpen,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PremiumExplanation } from '@/features/tests/components/PremiumExplanation';
import { RenderTableQuestion } from '@/features/tests/utils/questionFormatter';
import { getCorrectAnswerIndex } from '@/lib/quiz-scoring';
import type { TopicTrendProof } from '@/features/tests/actions/pyq-insights';
import { useSettingsStore } from '@/store/useSettingsStore';

// Helper to parse options safely
const getParsedOptions = (opts: any) => {
  if (!opts) return [];
  if (Array.isArray(opts)) return opts;
  if (typeof opts === 'string') {
    try {
      const parsed = JSON.parse(opts);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }
  return [];
};

export default function TopicTrendProofClient({ proof }: { proof: TopicTrendProof }) {
  const router = useRouter();
  const [activeYear, setActiveYear] = useState<number>(proof.currentYear);
  const { language, setLanguage } = useSettingsStore();

  const delta = proof.currentQuestions.length - proof.prevQuestions.length;
  const isHindi = language === 'hi';

  return (
    <div className="min-h-screen bg-slate-950 pb-20 relative overflow-hidden">
      {/* Premium background effects */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute top-[-10%] left-[-10%] h-[600px] w-[600px] rounded-full bg-amber-500/10 blur-[120px]" />
        <div className="absolute right-[-5%] bottom-[10%] h-[500px] w-[500px] rounded-full bg-amber-600/5 blur-[100px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] opacity-20" />
      </div>
      
      <div className="mx-auto max-w-4xl px-4 pt-4 sm:px-6 relative z-10">
        {/* Navigation Row */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="group rounded-xl border border-white/5 bg-white/5 px-4 font-bold text-slate-400 backdrop-blur-md transition-all hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
            {isHindi ? 'वापस जाएं' : 'Back'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setLanguage(isHindi ? 'en' : 'hi')}
            className="rounded-xl border-white/10 bg-white/5 font-black text-slate-200 backdrop-blur-md transition-all hover:bg-white/10 hover:text-amber-400 active:scale-95 px-5"
          >
            {isHindi ? 'English' : 'हिंदी'}
          </Button>
        </div>

        {/* Proof Header Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-10 p-8 sm:p-10 rounded-[2.5rem] border border-slate-800 bg-slate-900/40 shadow-2xl backdrop-blur-xl relative overflow-hidden"
        >
          {/* grid texture */}
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px] opacity-[0.2]" />
          
          <div className="relative z-10 space-y-6 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
               <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                 <ShieldCheck className="h-3.5 w-3.5" />
                 100% Data Proof Verified
               </div>
               {delta > 0 && (
                  <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-orange-400">
                    <TrendingUp className="h-3.5 w-3.5" />
                    +{delta} {isHindi ? 'अधिक' : 'More'} Questions
                  </div>
               )}
            </div>

            <div className="space-y-3">
              <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl leading-tight">
                <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                  {isHindi ? proof.topicTitle : proof.topicTitleEn || proof.topicTitle}
                </span>
              </h1>
              <p className="max-w-2xl text-lg font-semibold text-slate-400 leading-relaxed mx-auto sm:mx-0">
                {isHindi 
                  ? `यह प्रमाण है कि ${proof.currentYear} में इस टॉपिक से ${proof.currentQuestions.length} सवाल आए, जबकि ${proof.prevYear} में सिर्फ ${proof.prevQuestions.length} थे।`
                  : `Evidence that ${proof.currentQuestions.length} questions were asked in ${proof.currentYear}, up from ${proof.prevQuestions.length} in ${proof.prevYear}.`}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid - Premium Selection Layout */}
        <div className="flex flex-col sm:grid sm:grid-cols-2 gap-4 mb-8">
           <div 
             className={cn(
               "rounded-[2.5rem] border-2 transition-all p-7 cursor-pointer relative overflow-hidden group",
               activeYear === proof.currentYear 
                 ? "border-amber-500 bg-amber-500/10 shadow-[0_0_30px_rgba(245,158,11,0.2)]" 
                 : "border-slate-800 bg-slate-900/40 hover:border-slate-700 backdrop-blur-md"
             )} 
             onClick={() => setActiveYear(proof.currentYear)}
           >
              {activeYear === proof.currentYear && (
                <div className="absolute top-0 right-0 h-32 w-32 bg-amber-500/10 rounded-full -mr-16 -mt-16 blur-2xl" />
              )}
              <div className="flex justify-between items-start mb-6 relative z-10">
                 <div className={cn(
                   "p-3.5 rounded-2xl transition-all", 
                   activeYear === proof.currentYear ? "bg-amber-500 text-black shadow-lg shadow-amber-500/40" : "bg-slate-800 text-slate-400"
                 )}>
                    <Calendar className="h-6 w-6" />
                 </div>
                 <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{isHindi ? 'नया साल' : 'New Year'}</span>
                    <Badge className={cn(
                      "rounded-lg px-2.5 py-0.5 font-black border-none",
                      activeYear === proof.currentYear ? "bg-amber-500 text-black shadow-sm" : "bg-slate-800 text-slate-400"
                    )}>
                      {proof.currentYear}
                    </Badge>
                 </div>
              </div>
              <div className={cn("text-4xl font-black tracking-tight mb-1", activeYear === proof.currentYear ? "text-white" : "text-slate-300")}>
                {proof.currentQuestions.length}
              </div>
              <div className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">{isHindi ? 'प्रश्न पूछे गए' : 'Questions Matched'}</div>
           </div>

           <div 
             className={cn(
               "rounded-[2.5rem] border-2 transition-all p-7 cursor-pointer relative overflow-hidden group",
               activeYear === proof.prevYear 
                 ? "border-amber-500/50 bg-amber-500/5 shadow-xl" 
                 : "border-slate-800 bg-slate-900/40 hover:border-slate-700 backdrop-blur-md"
             )} 
             onClick={() => setActiveYear(proof.prevYear)}
           >
              <div className="flex justify-between items-start mb-6 relative z-10">
                 <div className={cn(
                   "p-3.5 rounded-2xl transition-all", 
                   activeYear === proof.prevYear ? "bg-amber-500 text-black" : "bg-slate-800 text-slate-400"
                 )}>
                    <History className="h-6 w-6" />
                 </div>
                 <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{isHindi ? 'पिछला साल' : 'Previous'}</span>
                    <Badge className={cn(
                      "rounded-lg px-2.5 py-0.5 font-black border-none",
                      activeYear === proof.prevYear ? "bg-amber-500 text-black" : "bg-slate-800 text-slate-400"
                    )}>
                      {proof.prevYear}
                    </Badge>
                 </div>
              </div>
              <div className={cn("text-4xl font-black tracking-tight mb-1", activeYear === proof.prevYear ? "text-white" : "text-slate-300")}>
                {proof.prevQuestions.length}
              </div>
              <div className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">{isHindi ? 'प्रश्न पूछे गए' : 'Questions Matched'}</div>
           </div>
        </div>

        {/* Calculation Logic Card - Optimized Dark Mode */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-10">
           <div className="rounded-[2.5rem] border border-white/5 bg-white/5 p-8 backdrop-blur-sm relative overflow-hidden">
              <div className="flex items-center gap-3 mb-6 relative z-10">
                 <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                   <Calculator className="h-4 w-4 text-amber-500" />
                 </div>
                 <h3 className="text-[11px] font-black text-amber-500/80 uppercase tracking-[0.3em]">{isHindi ? 'ट्रेंड की गणना' : 'Trend Calculation Method'}</h3>
              </div>

              <div className="flex flex-wrap items-center gap-4 relative z-10">
                 <div className="flex flex-col gap-1 px-5 py-3 rounded-2xl border border-slate-800 bg-slate-900/60 font-black shadow-sm">
                    <span className="text-[9px] text-slate-500 uppercase tracking-widest">{proof.currentYear} Data</span>
                    <span className="text-white text-lg">{proof.currentQuestions.length} Qs</span>
                 </div>
                 
                 <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-500 uppercase">
                   vs
                 </div>

                 <div className="flex flex-col gap-1 px-5 py-3 rounded-2xl border border-slate-800 bg-slate-900/60 font-black shadow-sm">
                    <span className="text-[9px] text-slate-500 uppercase tracking-widest">{proof.prevYear} Data</span>
                    <span className="text-white text-lg">{proof.prevQuestions.length} Qs</span>
                 </div>

                 <div className="hidden sm:block flex-1 border-t-2 border-dashed border-slate-800 mx-2" />

                 <div className={cn(
                   "flex flex-col gap-1 px-6 py-3 rounded-2xl font-black shadow-2xl transition-all",
                   delta >= 0 
                     ? "bg-gradient-to-br from-amber-400 to-orange-500 text-black shadow-amber-500/20" 
                     : "bg-gradient-to-br from-slate-400 to-slate-600 text-white"
                 )}>
                    <span className={cn("text-[9px] uppercase tracking-widest opacity-70", delta >= 0 ? "text-amber-950" : "text-white")}>
                      {isHindi ? 'नेट बदलाव' : 'Net Delta'}
                    </span>
                    <span className="text-xl">
                      {delta >= 0 ? `+${delta}` : delta} {isHindi ? 'ट्रेंड' : 'Trend'}
                    </span>
                 </div>
              </div>
           </div>
        </motion.div>

        {/* Questions List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-black text-white flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400">
                <Search className="h-4 w-4" />
              </div>
              <span>{activeYear} {isHindi ? 'के सभी प्रश्न' : 'Questions Evidence'}</span>
            </h2>
            <div className="text-[10px] font-black text-amber-500 uppercase tracking-widest bg-amber-500/10 px-4 py-1.5 rounded-full border border-amber-500/20 shadow-sm">
              {activeYear === proof.currentYear ? proof.currentQuestions.length : proof.prevQuestions.length} Qs
            </div>
          </div>

          <div className="grid gap-6">
            {(activeYear === proof.currentYear ? proof.currentQuestions : proof.prevQuestions).map((q, i) => (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="rounded-[2.5rem] border border-slate-800 bg-slate-900/40 p-8 pt-16 shadow-2xl backdrop-blur-md group hover:border-amber-500/30 transition-all relative overflow-hidden">
                  {/* Numbering and Test Title - Styled from Reference */}
                  <div className="absolute top-6 left-8 flex flex-col items-start gap-4">
                    <div className="relative flex h-10 w-10 items-center justify-center">
                      <div className="absolute inset-0 rotate-45 rounded-xl bg-amber-500/10 transition-colors group-hover:bg-amber-500/20" />
                      <span className="relative text-sm font-black text-amber-500">{i + 1}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-lg border border-white/10 shadow-sm backdrop-blur-sm">
                      <Target className="h-3 w-3 text-emerald-500" />
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-tight">
                         {isHindi ? q.testTitle : q.testTitleEn || q.testTitle}
                      </span>
                    </div>
                  </div>

                  {/* Verified Label in Top Right */}
                  <div className="absolute top-6 right-8 flex flex-col items-end gap-1.5 text-right">
                    <div className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1.5">
                      <ShieldCheck className="h-3 w-3" />
                      Verified PYQ
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-6 pt-6">
                      <div className="flex flex-wrap items-center gap-3 border-b border-white/5 pb-5 mt-4">
                         {/* Topic Badge */}
                         {/* (topicTitle is not available in TopicTrendProof, it's the current topic) */}
                      </div>

                      <div className="space-y-6">
                        <div className="prose prose-invert prose-sm max-w-none whitespace-pre-line text-slate-100 sm:prose-base font-bold leading-relaxed">
                          {isHindi ? q.questionText : q.questionTextEn || q.questionText}
                        </div>
                        
                        {isHindi && q.questionTextEn && (
                          <div className="relative pl-5 border-l-2 border-emerald-500/30 py-1 bg-emerald-500/[0.02] rounded-r-xl">
                            <p className="text-sm font-semibold text-slate-400 italic leading-relaxed tracking-tight">
                              {q.questionTextEn}
                            </p>
                          </div>
                        )}

                        {/* Options Display - Redesigned to match Reference */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                          {getParsedOptions(q.options).map((opt: any, idx: number) => {
                            const correctIdx = getCorrectAnswerIndex(q.correctAnswer, q.options);
                            const isCorrect = correctIdx !== -1 && correctIdx === idx;
                            
                            let optionText = opt;
                            if (typeof opt === 'object' && opt !== null) {
                               optionText = isHindi 
                                 ? opt.text || opt.textEn || JSON.stringify(opt)
                                 : opt.textEn || opt.text || JSON.stringify(opt);
                            }

                            return (
                              <div
                                key={idx}
                                className={cn(
                                  "group/opt relative flex items-center gap-4 rounded-2xl border p-4 transition-all duration-300",
                                  isCorrect 
                                    ? "border-emerald-500/30 bg-emerald-500/[0.08] shadow-[0_0_20px_rgba(16,185,129,0.05)]" 
                                    : "border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.05]"
                                )}
                              >
                                {/* Alphabet Bubble */}
                                <div
                                  className={cn(
                                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-black transition-all",
                                    isCorrect
                                      ? "bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.4)]"
                                      : "bg-white/5 text-slate-500 group-hover/opt:bg-white/10 group-hover/opt:text-slate-300"
                                  )}
                                >
                                  {String.fromCharCode(65 + idx)}
                                </div>

                                <span
                                  className={cn(
                                    "flex-1 text-sm leading-tight font-medium",
                                    isCorrect ? "text-emerald-500" : "text-slate-300"
                                  )}
                                  dangerouslySetInnerHTML={{ __html: optionText }}
                                />

                                {isCorrect && (
                                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20">
                                    <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      { (q.explanation || q.explanationEn) && (
                        <div className="mt-4 pt-6 border-t border-white/5">
                           <PremiumExplanation 
                             explanation={isHindi ? (q.explanation || '') : (q.explanationEn || q.explanation || '')} 
                             explanationEn={q.explanationEn} 
                             language={isHindi ? 'hi' : 'en'}
                             compact={false}
                             darkMode={true}
                           />
                        </div>
                      )}
                  </div>
                </div>
              </motion.div>
            ))}

            {(activeYear === proof.currentYear ? proof.currentQuestions : proof.prevQuestions).length === 0 && (
               <div className="rounded-[3rem] border border-dashed border-slate-800 p-16 text-center bg-slate-900/40 backdrop-blur-md">
                  <div className="mx-auto w-16 h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mb-6 text-slate-500">
                     <FileText className="h-8 w-8" />
                  </div>
                  <p className="text-slate-400 font-black text-lg">इस साल इस टॉपिक से कोई सवाल नहीं आया।</p>
               </div>
            )}
          </div>
        </div>

        {/* Final Affirmation - Premium Amber Callout */}
        {delta > 0 && activeYear === proof.currentYear && (
           <motion.div 
             initial={{ opacity: 0, scale: 0.95 }}
             animate={{ opacity: 1, scale: 1 }}
             className="mt-16 p-10 rounded-[3rem] bg-gradient-to-br from-amber-600 to-orange-700 text-black text-center shadow-[0_20px_50px_rgba(245,158,11,0.3)] relative overflow-hidden group"
           >
              <div className="absolute top-0 right-0 h-48 w-48 bg-white opacity-10 rounded-full -mr-24 -mt-24 blur-3xl group-hover:scale-125 transition-transform duration-1000"></div>
              <div className="absolute bottom-0 left-0 h-32 w-32 bg-black opacity-10 rounded-full -ml-16 -mb-16 blur-2xl"></div>
              
              <div className="relative z-10">
                <div className="bg-black/20 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6 backdrop-blur-md border border-white/20">
                  <Zap className="h-8 w-8 text-white animate-pulse" />
                </div>
                <h3 className="text-3xl font-black mb-3 tracking-tight">{isHindi ? 'Explosive Trend Verified' : 'Explosive Trend Verified'}</h3>
                <p className="text-black/80 font-black mb-8 max-w-xl mx-auto leading-relaxed">
                   {isHindi 
                     ? `यह ${delta} अतिरिक्त सवाल दिखाते हैं कि आयोग इस विषय पर आक्रामक हो रहा है। इसे बिल्कुल मिस न करें!`
                     : `These ${delta} extra questions prove the Commission is becoming aggressive on this topic. This is a high-priority zone for your prep!`}
                </p>
                <div className="flex justify-center gap-2">
                   <div className="h-1.5 w-16 rounded-full bg-black/40"></div>
                   <div className="h-1.5 w-4 rounded-full bg-black/20"></div>
                   <div className="h-1.5 w-4 rounded-full bg-black/10"></div>
                </div>
              </div>
           </motion.div>
        )}
      </div>
    </div>
  );
}

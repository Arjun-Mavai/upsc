'use client';

import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  FileText,
  ShieldCheck,
  Target,
  AlertCircle,
  BookOpen,
  CheckCircle2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PremiumExplanation } from '@/features/tests/components/PremiumExplanation';
import { RenderTableQuestion } from '@/features/tests/utils/questionFormatter';
import { getCorrectAnswerIndex } from '@/lib/quiz-scoring';
import type { YearlySubjectQuestions } from '@/features/tests/actions/pyq-insights';
import { useSettingsStore } from '@/store/useSettingsStore';
import { cn } from '@/lib/utils';

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

// Helper to parse matchPairs safely
const getParsedMatchPairs = (pairs: any) => {
  if (!pairs) return [];
  if (Array.isArray(pairs)) return pairs;
  if (typeof pairs === 'string') {
    try {
      const parsed = JSON.parse(pairs);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }
  return [];
};

export default function YearlyProofClient({ data }: { data: YearlySubjectQuestions }) {
  const router = useRouter();
  const { language, setLanguage } = useSettingsStore();
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
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mb-10 space-y-6">
           <div className="p-8 sm:p-10 rounded-[2.5rem] border border-slate-800 bg-slate-900/40 shadow-2xl backdrop-blur-xl relative overflow-hidden">
             {/* grid texture */}
             <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px] opacity-[0.2]" />
             
             <div className="relative z-10 space-y-6 text-center sm:text-left">
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                    <Calendar className="h-3.5 w-3.5" />
                    {data.year} {isHindi ? 'के सभी प्रश्न' : 'Questions List'} — Verified
                </div>
                <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl leading-tight">
                  <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                    {data.subject}
                  </span>
                </h1>
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <ShieldCheck className="h-5 w-5 text-amber-500/80" />
                  <p className="text-lg font-black text-slate-400">
                    {isHindi 
                      ? `विश्लेषित सवाल: ${data.questions.length}`
                      : `Analyzed Questions: ${data.questions.length}`}
                  </p>
                </div>
             </div>
           </div>
           
           <div className="p-6 rounded-[2rem] border border-amber-500/20 bg-amber-500/5 backdrop-blur-md flex items-start gap-4 shadow-xl">
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <AlertCircle className="h-4 w-4 text-amber-500" />
              </div>
              <p className="text-[11px] font-black text-amber-200/90 leading-relaxed uppercase tracking-widest pt-1">
                 {isHindi 
                   ? "हमने यहाँ केवल Unique प्रश्न दिखाए हैं। यदि कोई प्रश्न एकाधिक टॉपिक्स में आता है, तो वह यहाँ एक ही बार दिखेगा।"
                   : "Unique questions only. Multi-topic questions are shown once for perfect accuracy."}
              </p>
           </div>
        </motion.div>

        <div className="grid gap-6">
           {data.questions.map((q, i) => (
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
                        <Target className="h-3 w-3 text-slate-500" />
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-tight">
                           {q.testTitle}
                        </span>
                      </div>
                    </div>

                    {/* Verified Label in Top Right */}
                    <div className="absolute top-6 right-8 flex flex-col items-end gap-1.5 text-right">
                      <div className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
                        <ShieldCheck className="h-3 w-3" />
                        Verified PYQ
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-6 pt-6">
                        <div className="flex flex-wrap items-center gap-3 border-b border-white/5 pb-5 mt-4">
                           <div className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-4 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-widest shadow-sm">
                              {q.topicTitle}
                           </div>
                        </div>

                        <div className="space-y-6">
                          {/* Handle Matching Questions */}
                          {q.type === 'matching' && getParsedMatchPairs(q.matchPairs).length > 0 ? (
                            <>
                              <div className="prose prose-invert prose-sm mb-4 max-w-none whitespace-pre-line text-slate-200 sm:prose-base font-black leading-relaxed">
                                {(isHindi ? q.questionText : q.questionTextEn || q.questionText)
                                  .replace(/List-?\s*I{1,2}\b.*$/gim, '')
                                  .replace(/सूची-?\s*I{1,2}\b.*$/gim, '')
                                  .trim()}
                              </div>
                              <RenderTableQuestion 
                                matchPairs={getParsedMatchPairs(q.matchPairs)}
                                language={isHindi ? 'hi' : 'en'}
                                className="mb-4"
                                darkMode={true}
                              />
                            </>
                          ) : (
                              <p className="text-[17px] leading-[1.6] whitespace-pre-line font-black text-slate-100 italic sm:not-italic">
                               {isHindi ? q.questionText : q.questionTextEn || q.questionText}
                              </p>
                          )}
                          
                          {isHindi && q.questionTextEn && q.type !== 'matching' && (
                            <div className="relative pl-5 border-l-2 border-slate-800 py-1">
                              <p className="text-sm font-semibold text-slate-500 italic leading-relaxed tracking-tight">
                                {q.questionTextEn}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Options Display - 2 Column Grid from Reference */}
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
                                 <div className={cn(
                                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-black transition-all",
                                    isCorrect 
                                      ? "bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.4)]" 
                                      : "bg-white/5 text-slate-500 group-hover/opt:bg-white/10 group-hover/opt:text-slate-300"
                                 )}>
                                    {String.fromCharCode(65 + idx)}
                                 </div>
                                 <span className={cn(
                                   "flex-1 text-sm leading-tight font-medium",
                                   isCorrect ? "text-emerald-500 font-black" : "text-slate-300"
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

           {data.questions.length === 0 && (
              <div className="rounded-[3rem] border border-dashed border-slate-800 p-20 text-center bg-slate-900/40 backdrop-blur-md">
                 <div className="mx-auto w-16 h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mb-6 text-slate-500">
                    <FileText className="h-8 w-8" />
                 </div>
                 <p className="text-slate-400 font-black text-lg italic">कोई सवाल नहीं मिला।</p>
              </div>
           )}
        </div>
      </div>
    </div>
  );
}

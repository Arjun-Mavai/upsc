'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Brain, Zap, CheckCircle2, Lightbulb, AlertTriangle, ArrowRight } from 'lucide-react';
import { useSettingsStore } from '@/store/useSettingsStore';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export function InstantModeSection() {
  const { language } = useSettingsStore();
  const hi = language === 'hi';
  const [showExplanation, setShowExplanation] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setShowExplanation((prev) => !prev);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const demoData = {
    year: '2023',
    subject: hi ? 'राज्यव्यवस्था' : 'POLITY',
    question: {
      context: hi ? 'निम्नलिखित कथनों पर विचार कीजिए:' : 'Consider the following statements:',
      statements: hi ? [
        'भारत में, उम्मीदवारों को एक लोकसभा चुनाव में तीन निर्वाचन क्षेत्रों से लड़ने से रोकने वाला कोई कानून नहीं है।',
        '1991 के लोकसभा चुनाव में, श्री देवी लाल ने तीन लोकसभा निर्वाचन क्षेत्रों से चुनाव लड़ा था।',
        'मौजूदा नियमों के अनुसार, यदि उम्मीदवार तीन निर्वाचन क्षेत्रों से चुनाव लड़ता है, तो उसे उनमें से दो को खाली करना होगा।'
      ] : [
        'In India, there is no law restricting the candidates from contesting in one Lok Sabha election from three constituencies.',
        'In 1991 Lok Sabha Election, Shri Devi Lal contested from three Lok Sabha constituencies.',
        'As per existing rules, if a candidate contests from three constituencies, he/she has to vacate two of them.'
      ],
      prompt: hi ? 'उपर्युक्त कथनों में से कौन-सा/से सही है/हैं?' : 'Which of the statements given above is/are correct?',
      options: [
        { l: 'a', t: hi ? 'केवल 1' : '1 only' },
        { l: 'b', t: hi ? 'केवल 2' : '2 only' },
        { l: 'c', t: hi ? 'केवल 3' : '3 only' },
        { l: 'd', t: hi ? '1, 2 और 3' : '1, 2 and 3' }
      ],
      correct: 'b'
    },
    explanation: {
      verdict: hi 
        ? 'विकल्प (b) सही है। केवल कथन 2 सत्य है।' 
        : 'Option (b) is correct. Only statement 2 is accurate.',
      corePillar: hi
        ? 'जन प्रतिनिधित्व अधिनियम (RPA) 1951 - चुनाव लड़ने की सीमाएं (धारा 33)।'
        : 'Representation of the People Act (RPA) 1951 - Contesting Limits (Section 33).',
      logicPath: hi
        ? 'RPA 1951 की धारा 33(7) को 1996 में संशोधित किया गया था ताकि अधिकतम 2 सीटों की सीमा तय की जा सके। चूंकि देवी लाल ने 1991 में चुनाव लड़ा था, उस समय 3 सीटों पर कोई रोक नहीं थी। वर्तमान नियम 2 सीटों का है, न कि 3 का।'
        : 'Section 33(7) of RPA 1951 was amended in 1996 to set a 2-seat limit. Since Devi Lal contested in 1991, the 3-seat limit was legal then. Current rules allow 2, not 3.',
      trapWatch: hi
        ? 'UPSC "कोई कानून नहीं" (No Law) जैसे शब्दों का उपयोग करके फंसाता है। हमेशा जांचें कि क्या किसी विशिष्ट संशोधन ने इसे बदल दिया है!'
        : 'UPSC traps you with "No Law" phrases. Always check if a specific amendment has changed the status quo!'
    }
  };

  return (
    <section className="relative overflow-hidden bg-white py-24 md:py-32">
      {/* Abstract Background Element - Amber/Gold themed */}
      <div className="pointer-events-none absolute top-0 right-0 h-[600px] w-[600px] bg-amber-50/50 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-[400px] w-[400px] bg-slate-50 blur-[100px]" />

      <div className="mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          {/* Text Content */}
          <div className="space-y-8">
            <Badge className="bg-amber-100 text-amber-900 hover:bg-amber-200 px-4 py-1.5 text-xs font-black uppercase tracking-widest border border-amber-200">
              <Sparkles className="mr-2 h-3.5 w-3.5 fill-amber-600 text-amber-600" />
              {hi ? 'न्यू फीचर: एक्सपर्ट इंटेलिजेंस' : 'New Feature: Expert Intel'}
            </Badge>

            <h2 className="text-4xl font-black leading-[1.15] text-slate-900 md:text-5xl lg:text-6xl tracking-tight">
              {hi ? (
                <>
                  प्रीमियम <span className="text-amber-600 relative inline-block">
                    Expert Logic
                    <motion.span 
                      className="absolute -bottom-1 left-0 h-1 bg-amber-200 w-full" 
                      initial={{ width: 0 }}
                      whileInView={{ width: '100%' }}
                      viewport={{ once: true }}
                    />
                  </span><br />
                  हर एक जवाब के पीछे।
                </>
              ) : (
                <>
                  Premium <span className="text-amber-600 relative inline-block">
                    Expert Logic
                    <motion.span 
                      className="absolute -bottom-1 left-0 h-1 bg-amber-200 w-full" 
                      initial={{ width: 0 }}
                      whileInView={{ width: '100%' }}
                      viewport={{ once: true }}
                    />
                  </span><br />
                  Behind Every Answer.
                </>
              )}
            </h2>

            <p className="text-lg font-medium leading-relaxed text-slate-600 md:text-xl">
              {hi 
                ? 'सिर्फ सही विकल्प नहीं, बल्कि उसके पीछे का "क्यों" समझें। हमारी एक्सपर्ट विजडम आपको गहराई से समझाती है कि कौन सा विकल्प सही है और क्यों, बिल्कुल एक पर्सनल मेंटर की तरह।'
                : 'Don\'t just find the right answer, understand the "Why" behind it. Our Expert Wisdom provides deep logical reasoning for every choice, acting as your 24/7 personal UPSC mentor.'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { hi: 'स्मार्ट एलिमिनेशन', en: 'Smart Elimination', icon: Zap, color: 'text-amber-600 bg-amber-50' },
                { hi: 'कॉन्सेप्चुअल गहराई', en: 'Deep Insights', icon: Brain, color: 'text-emerald-600 bg-emerald-50' },
                { hi: 'मेमोरी ट्रिक्स', en: 'Mnemonics', icon: Sparkles, color: 'text-purple-600 bg-purple-50' },
                { hi: 'ट्रैप अलर्ट्स', en: 'UPSC Trap Alerts', icon: AlertTriangle, color: 'text-rose-600 bg-rose-50' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm transition-all hover:border-amber-200 hover:shadow-md">
                  <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", item.color)}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-bold text-slate-700">{hi ? item.hi : item.en}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Visual Showcase (Question Mockup) */}
          <div className="relative">
            {/* Animated Glow Rings */}
            <div className="absolute -inset-10 animate-pulse rounded-full bg-amber-500/5 blur-3xl" />
            
            <div className="relative h-[700px] w-full max-w-[520px] mx-auto perspective-[2000px]">
              <AnimatePresence mode="popLayout" initial={false}>
                {!showExplanation ? (
                  <motion.div
                    key="question"
                    initial={{ rotateY: -15, opacity: 0, scale: 0.95, x: -20 }}
                    animate={{ rotateY: 0, opacity: 1, scale: 1, x: 0 }}
                    exit={{ rotateY: 15, opacity: 0, scale: 0.95, x: 20 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="absolute inset-0 h-full w-full will-change-transform"
                  >
                    <Card className="h-full overflow-hidden rounded-[3rem] border-slate-200 bg-white p-0 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] flex flex-col border-2 ring-1 ring-slate-100">
                      <div className="bg-slate-50 px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black tracking-[0.3em] text-amber-600 uppercase">UPSC TEST SERIES</span>
                          <span className="text-xs font-bold text-slate-500 tracking-tight">{demoData.year} · {demoData.subject}</span>
                        </div>
                        <div className="h-12 w-12 rounded-2xl bg-white border-2 border-slate-200 shadow-sm flex items-center justify-center text-[12px] font-black text-slate-700 italic">
                          Q.42
                        </div>
                      </div>

                      <div className="flex-1 overflow-y-auto p-10 font-serif">
                        <p className="text-[20px] font-bold leading-relaxed text-slate-900 mb-8 italic">
                          {demoData.question.context}
                        </p>

                        <div className="space-y-6 mb-10">
                          {demoData.question.statements.map((s, i) => (
                            <div key={i} className="flex gap-6 group">
                              <span className="font-black text-amber-500 text-lg shrink-0 w-6 text-right">
                                {i + 1}.
                              </span>
                              <p className="text-[17px] leading-relaxed text-slate-800 font-medium">
                                {s}
                              </p>
                            </div>
                          ))}
                        </div>

                        <div className="mb-10 bg-slate-50 rounded-2xl border-l-4 border-slate-900 p-6 shadow-sm">
                          <p className="text-[18px] font-black leading-relaxed text-slate-900">
                            {demoData.question.prompt}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          {demoData.question.options.map((opt) => (
                            <div key={opt.l} className="flex items-center gap-4 p-4 rounded-2xl border-2 border-slate-100 bg-slate-50/50">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white border-2 border-slate-200 font-black text-xs text-slate-400 shadow-sm uppercase">
                                ({opt.l})
                              </div>
                              <span className="text-[16px] font-bold text-slate-700">{opt.t}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="p-8 bg-slate-50 border-t border-slate-100">
                         <div className="flex flex-col gap-3">
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                               <span>Human Mind Solving...</span>
                               <span className="text-amber-500">Expert Logic Ready</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                              <motion.div 
                                className="h-full bg-gradient-to-r from-amber-500 to-amber-300" 
                                animate={{ width: ['0%', '100%'] }} 
                                transition={{ duration: 6, ease: "linear", repeat: Infinity }}
                              />
                            </div>
                         </div>
                      </div>
                    </Card>
                  </motion.div>
                ) : (
                  <motion.div
                    key="explanation"
                    initial={{ rotateY: 15, opacity: 0, scale: 0.95, x: 20 }}
                    animate={{ rotateY: 0, opacity: 1, scale: 1, x: 0 }}
                    exit={{ rotateY: -15, opacity: 0, scale: 0.95, x: -20 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="absolute inset-0 h-full w-full will-change-transform"
                  >
                    <Card className="h-full overflow-hidden rounded-[3rem] border-amber-200 bg-white p-0 shadow-[0_50px_100px_-20px_rgba(245,158,11,0.25)] flex flex-col border-2 ring-1 ring-amber-100">
                      <div className="bg-amber-600 p-8 flex items-center justify-between text-white relative overflow-hidden">
                        <motion.div 
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-full"
                          animate={{ x: ['-200%', '200%'] }}
                          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        />
                        <div className="relative z-10 flex items-center gap-4">
                          <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md shadow-inner border border-white/30">
                            <Brain className="h-7 w-7 text-white" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black tracking-[0.3em] text-amber-100 uppercase">UPSC ZEN</span>
                            <span className="text-2xl font-black tracking-tight">{hi ? 'प्रीमियम विशेषज्ञ व्याख्या' : 'Premium Expert Logic'}</span>
                          </div>
                        </div>
                        <div className="relative z-10 px-4 py-1.5 bg-amber-500 rounded-full border border-white/20 text-[10px] font-black uppercase tracking-widest shadow-lg">
                          EXPERT
                        </div>
                      </div>

                      <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-gradient-to-b from-amber-50/40 to-white">
                        {/* Verdict Section */}
                        <div className="bg-emerald-600 p-5 rounded-[2rem] flex items-center gap-4 shadow-xl shadow-emerald-100 border border-emerald-500">
                          <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-lg">
                            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                          </div>
                          <div>
                            <h4 className="text-[10px] font-black text-emerald-100 uppercase tracking-[0.2em] mb-1">{hi ? 'फैसला' : 'Verdict'}</h4>
                            <p className="text-[15px] font-black text-white leading-tight">{demoData.explanation.verdict}</p>
                          </div>
                        </div>

                        {/* Core Pillar */}
                        <div className="flex gap-5 items-start">
                          <div className="mt-1 h-10 w-10 shrink-0 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-600">
                            <Lightbulb size={20} />
                          </div>
                          <div>
                            <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em] mb-1">{hi ? 'मुख्य अवधारणा' : 'Core Pillar'}</h4>
                            <p className="text-[15px] leading-relaxed text-slate-800 font-bold">{demoData.explanation.corePillar}</p>
                          </div>
                        </div>

                        {/* Logic Path */}
                        <div className="bg-slate-50 border-2 border-slate-100 p-6 rounded-3xl relative overflow-hidden group">
                           <div className="absolute top-0 right-0 p-3 opacity-[0.03]">
                             <Brain size={80} className="text-slate-900" />
                           </div>
                           <h4 className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">
                             <Zap size={14} className="fill-amber-500 text-amber-500" /> {hi ? 'तर्क का रास्ता' : 'Logic Path'}
                           </h4>
                           <p className="text-[14px] leading-relaxed text-slate-700 font-bold relative z-10">{demoData.explanation.logicPath}</p>
                        </div>

                        {/* Trap Watch */}
                        <div className="bg-rose-50 border-2 border-rose-100 p-5 rounded-3xl relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-3 opacity-5">
                            <AlertTriangle size={60} className="text-rose-600" />
                          </div>
                          <h4 className="flex items-center gap-2 text-[10px] font-black text-rose-700 uppercase tracking-[0.2em] mb-2">
                            {hi ? 'ट्रैप वॉच' : 'Trap Watch'}
                          </h4>
                          <p className="text-[14px] leading-relaxed text-rose-900 font-black relative z-10">{demoData.explanation.trapWatch}</p>
                        </div>
                      </div>

                      <div className="p-8 border-t border-slate-100 bg-white">
                        <button className="w-full bg-slate-900 hover:bg-slate-800 text-white py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-3 shadow-xl shadow-slate-200 transition-all active:scale-[0.98]">
                          {hi ? 'अगले प्रश्न पर जाएं' : 'Next Question'} <ArrowRight size={18} />
                        </button>
                      </div>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Enhanced 2x Floating Badge */}
              <motion.div 
                className="absolute -right-16 -bottom-12 hidden md:block z-30"
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="flex flex-col items-center justify-center rounded-[3rem] bg-slate-900 p-10 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.4)] border-4 border-white">
                  <div className="text-6xl font-black text-amber-500 tracking-tighter mb-1">2x</div>
                  <div className="text-[12px] font-black uppercase tracking-[0.2em] text-white">FASTER</div>
                  <div className="text-[12px] font-black uppercase tracking-[0.2em] text-amber-200/50 leading-none">RETENTION</div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

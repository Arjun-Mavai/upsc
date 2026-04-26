'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Brain, Lightbulb, AlertTriangle, ArrowRight, Link as LinkIcon, CheckCircle2 } from 'lucide-react';
import { useSettingsStore } from '@/store/useSettingsStore';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export function InstantModeSection() {
  const { language } = useSettingsStore();
  const hi = language === 'hi';
  const [showExplanation, setShowExplanation] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setShowExplanation((prev) => !prev), 6000);
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
      core: hi ? 'विकल्प (b) सही है। केवल कथन 2 सत्य है।' : 'Option (b) is correct. Only statement 2 is accurate.',
      link: hi ? 'जन प्रतिनिधित्व अधिनियम (RPA) 1951 - धारा 33।' : 'Representation of the People Act (RPA) 1951 - Sec 33.',
      wisdom: hi ? 'यूपीएससी ऐतिहासिक संशोधनों और उनके अपवादों का परीक्षण करना पसंद करता है।' : 'UPSC loves testing historical amendments and exceptions.',
      tricks: hi ? '1996 के बाद से "2 सीटों की सीमा" नियम लागू है।' : '"2-seat limit" rule applies post-1996.'
    }
  };

  return (
    <section className="relative overflow-hidden bg-white py-24 md:py-32">
      <div className="pointer-events-none absolute top-0 right-0 h-[600px] w-[600px] bg-amber-50/50 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-[400px] w-[400px] bg-slate-50 blur-[100px]" />

      <div className="mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          {/* Text Content */}
          <div className="space-y-8">
            <Badge className="bg-amber-100 text-amber-900 px-4 py-1.5 text-xs font-black uppercase tracking-widest border border-amber-200">
              <Sparkles className="mr-2 h-3.5 w-3.5 fill-amber-600 text-amber-600" />
              {hi ? 'न्यू फीचर: एक्सपर्ट इंटेलिजेंस' : 'New Feature: Expert Intel'}
            </Badge>

            <h2 className="text-4xl font-black leading-[1.15] text-slate-900 md:text-5xl lg:text-6xl tracking-tight">
              {hi ? <>प्रीमियम <span className="text-amber-600">Expert Analysis</span><br />हर एक जवाब के पीछे।</> : <>Premium <span className="text-amber-600">Expert Analysis</span><br />Behind Every Answer.</>}
            </h2>

            <p className="text-lg font-medium leading-relaxed text-slate-600 md:text-xl">
              {hi ? 'सिर्फ सही विकल्प नहीं, बल्कि उसके पीछे का "क्यों" समझें।' : 'Don\'t just find the right answer, understand the "Why" behind it.'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { en: 'Conceptual Core', icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
                { en: 'Inter-disciplinary Link', icon: Lightbulb, color: 'text-amber-600 bg-amber-50' },
                { en: 'Veteran\'s Wisdom', icon: Brain, color: 'text-purple-600 bg-purple-50' },
                { en: 'Tips & Elimination', icon: AlertTriangle, color: 'text-rose-600 bg-rose-50' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                  <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", item.color)}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-bold text-slate-700">{item.en}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Visual Showcase */}
          <div className="relative">
            <div className="relative h-[680px] w-full max-w-[500px] mx-auto">
              <AnimatePresence mode="popLayout" initial={false}>
                {!showExplanation ? (
                  <motion.div key="question" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.4 }} className="absolute inset-0">
                    <Card className="h-full rounded-[2.5rem] border-2 border-slate-100 bg-white shadow-2xl flex flex-col p-8">
                       <div className="mb-6 flex justify-between items-center">
                         <span className="text-[10px] font-black tracking-widest text-amber-600 uppercase">UPSC PYQ MOCK</span>
                         <span className="text-[11px] font-bold text-slate-400 italic">Question Analysis</span>
                       </div>
                       <div className="flex-1 overflow-y-auto space-y-6">
                         <p className="text-[19px] font-bold leading-relaxed text-slate-900 italic">{demoData.question.context}</p>
                         <div className="space-y-4">
                           {demoData.question.statements.map((s, i) => (
                             <div key={i} className="flex gap-4">
                               <span className="font-black text-amber-500">{i + 1}.</span>
                               <p className="text-[15px] leading-relaxed text-slate-700 font-medium">{s}</p>
                             </div>
                           ))}
                         </div>
                       </div>
                    </Card>
                  </motion.div>
                ) : (
                  <motion.div key="explanation" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.4 }} className="absolute inset-0">
                    <Card className="h-full rounded-[2.5rem] border-2 border-slate-100 bg-white shadow-2xl flex flex-col p-8 space-y-8">
                       {/* Section 1: Conceptual Core (Emerald) */}
                       <div className="relative pl-8">
                         <div className="absolute left-0 top-0.5 bottom-0.5 w-[3.5px] bg-emerald-500/60 rounded-full" />
                         <div className="mb-2 flex items-center gap-2.5">
                           <CheckCircle2 size={15} className="text-emerald-500" />
                           <h4 className="text-[10px] font-black tracking-[0.2em] uppercase text-emerald-600">CONCEPTUAL CORE</h4>
                         </div>
                         <p className="text-[15px] font-bold text-slate-800 leading-tight">{demoData.explanation.core}</p>
                       </div>

                       {/* Section 2: Inter-disciplinary Link (Amber) */}
                       <div className="relative pl-8">
                         <div className="absolute left-0 top-0.5 bottom-0.5 w-[3.5px] bg-amber-500/60 rounded-full" />
                         <div className="mb-2 flex items-center gap-2.5">
                           <Lightbulb size={15} className="text-amber-500" />
                           <h4 className="text-[10px] font-black tracking-[0.2em] uppercase text-amber-600">INTER-DISCIPLINARY LINK</h4>
                         </div>
                         <p className="text-[15px] font-bold text-slate-700 leading-tight">{demoData.explanation.link}</p>
                       </div>

                       {/* Section 3: Veteran's Wisdom (Indigo) */}
                       <div className="relative pl-8">
                         <div className="absolute left-0 top-0.5 bottom-0.5 w-[3.5px] bg-indigo-500/60 rounded-full" />
                         <div className="mb-2 flex items-center gap-2.5">
                           <Brain size={15} className="text-indigo-500" />
                           <h4 className="text-[10px] font-black tracking-[0.2em] uppercase text-indigo-600">VETERAN'S WISDOM & PATTERN</h4>
                         </div>
                         <p className="text-[15px] font-medium italic text-slate-700 leading-tight">{demoData.explanation.wisdom}</p>
                       </div>

                       {/* Section 4: Tips & Tricks (Rose) */}
                       <div className="relative pl-8">
                         <div className="absolute left-0 top-0.5 bottom-0.5 w-[3.5px] bg-rose-500/60 rounded-full" />
                         <div className="mb-2 flex items-center gap-2.5">
                           <AlertTriangle size={15} className="text-rose-500" />
                           <h4 className="text-[10px] font-black tracking-[0.2em] uppercase text-rose-600">TIPS, TRICKS & ELIMINATION</h4>
                         </div>
                         <p className="text-[15px] font-bold text-slate-700 leading-tight">{demoData.explanation.tricks}</p>
                       </div>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

'use client';

/**
 * PremiumExplanationSectionUPSC — "More Than Just Answers" for UPSC Zen
 * Shows our structured explanation approach: Conceptual Core, Inter-disciplinary Link, Veteran's Wisdom, Tips & Tricks
 * Matches public/explan.png exact design and mapping
 */

import React from 'react';
import { CheckCircle2, Lightbulb, Brain, ArrowRight, Target, Link as LinkIcon, AlertTriangle, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSettingsStore } from '@/store/useSettingsStore';
import { cn } from '@/lib/utils';

export function PremiumExplanationSectionUPSC() {
  const { language } = useSettingsStore();
  const isHindi = language === 'hi';

  return (
    <section className="border-t border-slate-200 bg-slate-50 py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto mb-20 max-w-3xl text-center">
          <Badge
            variant="outline"
            className="mb-6 rounded-full border-amber-200 bg-amber-50 px-4 py-1 text-sm text-amber-700 font-bold"
          >
            {isHindi ? 'विशेषज्ञ व्याख्या' : 'Expert Wisdom'}
          </Badge>
          <h2 className="mb-6 text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl lg:text-6xl">
            {isHindi ? 'सिर्फ उत्तर नहीं,' : 'More Than Just Answers.'} <br />
            <span className="text-slate-700">
              {isHindi ? 'संपूर्ण कांसेप्ट सीखें।' : 'Master The Concept.'}
            </span>
          </h2>
          <p className="text-lg leading-relaxed text-slate-600">
            {isHindi
              ? 'हर UPSC प्रश्न के साथ मिलती है एक विस्तृत विशेषज्ञ व्याख्या: अवधारणात्मक कोर, अंतर्विषयक लिंक, विजडम और टिप्स-ट्रिक्स।'
              : 'Every UPSC question comes with a structured expert breakdown: Conceptual Core, Inter-disciplinary Link, Veteran\'s Wisdom, and Tips & Tricks.'}
          </p>
        </div>

        <div className="grid items-start gap-16 lg:grid-cols-2">
          {/* Visual Showcase (Matching public/explan.png exact design) */}
          <div className="relative">
            <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-slate-200/50 to-slate-100/50 opacity-20 blur-2xl"></div>
            <Card className="relative z-10 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl p-10 md:p-12 space-y-12">
              
              {/* 1. CONCEPTUAL CORE (Emerald Solid Border) */}
              <div className="relative pl-10">
                <div className="absolute left-0 top-0.5 bottom-0.5 w-[4px] bg-emerald-500/60 rounded-full" />
                <div className="mb-4 flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-emerald-500 stroke-[2.5]" />
                  <h4 className="text-[12px] font-black tracking-[0.25em] uppercase text-emerald-600/90">
                    {isHindi ? 'अवधारणात्मक कोर' : 'CONCEPTUAL CORE'}
                  </h4>
                </div>
                <div className="text-[18px] font-bold text-slate-900 leading-snug tracking-tight">
                  {isHindi ? 'विकल्प (a) सही है। केवल कथन I सत्य है।' : 'The correct answer is A (I only).'}
                </div>
              </div>

              {/* 2. INTER-DISCIPLINARY LINK (Amber Solid Border) */}
              <div className="relative pl-10">
                <div className="absolute left-0 top-0.5 bottom-0.5 w-[4px] bg-amber-500/60 rounded-full" />
                <div className="mb-4 flex items-center gap-3">
                  <Lightbulb size={18} className="text-amber-500 stroke-[2.5]" />
                  <h4 className="text-[12px] font-black tracking-[0.25em] uppercase text-amber-600/90">
                    {isHindi ? 'अंतर्विषयक लिंक' : 'INTER-DISCIPLINARY LINK'}
                  </h4>
                </div>
                <div className="text-[18px] font-bold text-slate-800 tracking-tight">
                  Global AI Governance Summits
                </div>
              </div>

              {/* 3. VETERAN'S WISDOM & PATTERN (Indigo Solid Border) */}
              <div className="relative pl-10">
                <div className="absolute left-0 top-0.5 bottom-0.5 w-[4px] bg-indigo-500/60 rounded-full" />
                <div className="mb-4 flex items-center gap-3">
                  <Brain size={18} className="text-indigo-500 stroke-[2.5]" />
                  <h4 className="text-[12px] font-black tracking-[0.25em] uppercase text-indigo-600/90">
                    {isHindi ? 'विजडम और पैटर्न' : "VETERAN'S WISDOM & PATTERN"}
                  </h4>
                </div>
                <div className="text-[17px] font-medium text-slate-700 leading-[1.7] tracking-tight">
                  {isHindi 
                    ? '2025 पेरिस एआई एक्शन समिट की सह-अध्यक्षता भारत ने की थी। हालांकि, अमेरिका ने हस्ताक्षर करने से इनकार कर दिया था।'
                    : 'The 2025 Paris AI Action Summit was co-chaired by India. However, a major news point was that the United States notably refused to sign the final declaration.'}
                </div>
              </div>

              {/* 4. TIPS, TRICKS & ELIMINATION (Rose Solid Border) */}
              <div className="relative pl-10">
                <div className="absolute left-0 top-0.5 bottom-0.5 w-[4px] bg-rose-500/60 rounded-full" />
                <div className="mb-4 flex items-center gap-3">
                  <AlertTriangle size={18} className="text-rose-500 stroke-[2.5]" />
                  <h4 className="text-[12px] font-black tracking-[0.25em] uppercase text-rose-600/90">
                    {isHindi ? 'टिप्स और एलिमिनेशन' : 'TIPS, TRICKS & ELIMINATION'}
                  </h4>
                </div>
                <div className="text-[17px] font-medium text-slate-700 leading-[1.7] tracking-tight">
                   {isHindi 
                    ? 'यह मान लेना कि अमेरिका जैसी बड़ी तकनीकी शक्तियां स्वचालित रूप से घोषणाओं पर हस्ताक्षर करती हैं, एक सामान्य ट्रैप है।'
                    : 'Assuming that major tech powers like the US automatically sign generic-sounding declarations.'}
                </div>
              </div>
            </Card>
          </div>

          {/* Features List */}
          <div className="space-y-12 lg:pt-4">
            {[
              { 
                title: 'Conceptual Core', 
                desc: 'Maps directly to the final verdict. Eliminates ambiguity instantly.',
                color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle2 
              },
              { 
                title: 'Inter-disciplinary Link', 
                desc: 'Connects the question to larger syllabus themes and relevant current affairs.',
                color: 'text-amber-600', bg: 'bg-amber-50', icon: Lightbulb 
              },
              { 
                title: 'Veteran\'s Wisdom', 
                desc: 'Identifies the "Examiner\'s mindset" and repeating PYQ patterns.',
                color: 'text-indigo-600', bg: 'bg-indigo-50', icon: Brain 
              },
              { 
                title: 'Tips & Elimination', 
                desc: 'Practical mental models to solve when facts are fuzzy.',
                color: 'text-rose-600', bg: 'bg-rose-50', icon: AlertTriangle 
              },
            ].map((f, i) => (
              <div key={i} className="flex gap-6 group">
                <div className={cn("flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-sm transition-all group-hover:scale-110", f.bg, f.color)}>
                  <f.icon size={26} className="stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="mb-1 text-xl font-bold text-slate-900">{f.title}</h3>
                  <p className="text-slate-600 leading-relaxed text-[15px]">{f.desc}</p>
                </div>
              </div>
            ))}

            {/* CTA */}
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl flex items-center gap-5">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 shrink-0 shadow-lg">
                  <Sparkles className="h-6 w-6 text-amber-400" />
                </div>
                <div className="flex-1">
                  <p className="font-black text-slate-900 text-lg">600+ Expert Breaks</p>
                  <p className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase">Interactive Analysis Ready</p>
                </div>
                <div className="h-10 w-10 flex items-center justify-center rounded-full bg-slate-50 border border-slate-100">
                  <ArrowRight className="h-5 w-5 text-slate-400" />
                </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

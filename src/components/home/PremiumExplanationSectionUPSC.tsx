'use client';

/**
 * PremiumExplanationSectionUPSC — "More Than Just Answers" for UPSC Intelligence
 * Shows our structured explanation approach: Core Logic, Exam Fact, Memory Tip, Scam Alert
 * Reference: syllabus-explanation/src/components/home/PremiumExplanationSection.tsx
 */

import React from 'react';
import { CheckCircle2, Lightbulb, Brain, AlertTriangle, ArrowRight, Target } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSettingsStore } from '@/store/useSettingsStore';

export function PremiumExplanationSectionUPSC() {
  const { language } = useSettingsStore();
  const isHindi = language === 'hi';

  return (
    <section className="border-t border-slate-200 bg-slate-50 py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <Badge
            variant="outline"
            className="mb-6 rounded-full border-amber-200 bg-amber-50 px-4 py-1 text-sm text-amber-700"
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
              ? 'हर UPSC प्रश्न के साथ मिलती है एक विस्तृत विशेषज्ञ व्याख्या: फैसला, मुख्य स्तंभ, तर्क का रास्ता और ट्रैप वॉच।'
              : 'Every UPSC question comes with a structured expert breakdown: Verdict, Core Pillar, Logic Path, and Trap Watch.'}
          </p>
        </div>

        <div className="grid items-start gap-12 lg:grid-cols-2">
          {/* The Card Visualization */}
          <div className="relative">
            <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-amber-500/10 to-orange-500/10 opacity-10 blur-xl"></div>
            <Card className="relative z-10 overflow-hidden rounded-[2rem] border-2 border-slate-100 bg-white shadow-2xl">
              {/* Question Header */}
              <div className="border-b border-slate-100 bg-slate-50 p-6">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-lg leading-snug font-bold text-slate-900">
                    Which of the following is/are the indicator/indicators used by UNDP for
                    constructing Human Development Index?
                    <br />
                    <span className="mt-1 block text-base font-medium text-slate-500">
                      मानव विकास सूचकांक बनाने के लिए UNDP द्वारा कौन से संकेतक का/के उपयोग किया
                      जाता है?
                    </span>
                  </h3>
                  <Badge className="shrink-0 bg-amber-100 text-amber-700 hover:bg-amber-100">
                    ECONOMY
                  </Badge>
                </div>
              </div>

              <div className="space-y-6 p-6 md:p-8">
                {/* 1. Verdict */}
                <div className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500">
                    <CheckCircle2 className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="text-xs font-bold tracking-wider text-emerald-700 uppercase">
                      {isHindi ? 'फैसला (Verdict)' : 'Verdict'}
                    </div>
                    <div className="text-sm font-bold text-slate-900">
                      {isHindi ? 'स्वास्थ्य, शिक्षा और जीवन स्तर' : 'Health, Education & Standard of Living'}
                    </div>
                  </div>
                </div>

                {/* The 4 Explanation Sections */}
                <div className="space-y-4">
                  {/* 2. Core Pillar */}
                  <div className="flex gap-4">
                    <div className="w-1.5 shrink-0 rounded-full bg-amber-500"></div>
                    <div className="flex-1">
                      <h4 className="mb-1 flex items-center gap-2 text-xs font-black tracking-widest text-amber-700 uppercase">
                        <Lightbulb size={14} /> {isHindi ? 'मुख्य स्तंभ (Core Pillar)' : 'Core Pillar'}
                      </h4>
                      <p className="text-sm leading-relaxed font-semibold text-slate-700">
                        {isHindi 
                          ? 'HDI 3 आयामों का उपयोग करता है: स्वास्थ्य (जीवन प्रत्याशा), शिक्षा (स्कूली शिक्षा के औसत वर्ष), और जीवन स्तर (प्रति व्यक्ति GNI)।'
                          : 'HDI uses 3 dimensions: Health (life expectancy), Education (mean years of schooling), and Standard of living (GNI per capita).'}
                      </p>
                    </div>
                  </div>

                  {/* 3. Logic Path */}
                  <div className="flex gap-4">
                    <div className="w-1.5 shrink-0 rounded-full bg-indigo-500"></div>
                    <div className="flex-1">
                      <h4 className="mb-1 flex items-center gap-2 text-xs font-black tracking-widest text-indigo-700 uppercase">
                        <Brain size={14} /> {isHindi ? 'तर्क का रास्ता (Logic Path)' : 'Logic Path'}
                      </h4>
                      <p className="text-sm leading-relaxed font-semibold text-slate-700">
                        {isHindi
                          ? 'यह सूचकांक केवल मौद्रिक वृद्धि के बजाय सामाजिक-आर्थिक विकास को मापता है। इससे स्पष्ट होता है कि कथन 1, 2 और 3 सही होने चाहिए।'
                          : 'The index measures socio-economic development rather than just monetary growth. This explains why Statement 1, 2, and 3 must be true.'}
                      </p>
                    </div>
                  </div>

                  {/* 4. Trap Watch */}
                  <div className="flex gap-4">
                    <div className="w-1.5 shrink-0 rounded-full bg-rose-500"></div>
                    <div className="flex-1">
                      <h4 className="mb-1 flex items-center gap-2 text-xs font-black tracking-widest text-rose-700 uppercase">
                        <AlertTriangle size={14} /> {isHindi ? 'ट्रैप वॉच (Trap Watch)' : 'Trap Watch'}
                      </h4>
                      <p className="rounded-lg border border-rose-100 bg-rose-50/50 p-3 text-sm leading-relaxed font-bold text-slate-700">
                        <span className="text-rose-600">{isHindi ? 'सतर्क रहें:' : 'Trap Watch:'}</span> {isHindi 
                          ? 'GDP सीधा HDI घटक नहीं है। GNI और GDP के बीच के अंतर को ध्यान से समझें!'
                          : 'GDP is NOT a direct HDI component. Examine the difference between GNI and GDP carefully!'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Features List */}
          <div className="space-y-10 lg:pt-10">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h3 className="mb-2 text-xl font-bold text-slate-900">
                  {isHindi ? 'सटीक फैसला (Verdict)' : 'Final Verdict'}
                </h3>
                <p className="text-slate-600">
                  {isHindi
                    ? 'हर उत्तर के लिए एक स्पष्ट और सटीक निष्कर्ष जो भ्रम को दूर करता है।'
                    : 'A clear and precise conclusion for every answer that eliminates any ambiguity.'}
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                <Lightbulb size={24} />
              </div>
              <div>
                <h3 className="mb-2 text-xl font-bold text-slate-900">
                  {isHindi ? 'मुख्य स्तंभ (Core Pillar)' : 'Core Pillar'}
                </h3>
                <p className="text-slate-600">
                  {isHindi
                    ? 'विषय की बुनियादी अवधारणा की पहचान करें जिस पर प्रश्न आधारित है।'
                    : 'Identify the fundamental concept or subject pillar that the question is built upon.'}
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <Brain size={24} />
              </div>
              <div>
                <h3 className="mb-2 text-xl font-bold text-slate-900">
                  {isHindi ? 'तर्क का रास्ता (Logic Path)' : 'Logic Path'}
                </h3>
                <p className="text-slate-600">
                  {isHindi
                    ? 'सिर्फ जवाब नहीं, बल्कि उत्तर तक पहुँचने के तार्किक चरणों को समझें।'
                    : "Don't just get the answer; understand the logical steps required to reach it."}
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="mb-2 text-xl font-bold text-slate-900">
                  {isHindi ? 'ट्रैप वॉच (Trap Watch)' : 'Trap Watch'}
                </h3>
                <p className="text-slate-600">
                  {isHindi
                    ? 'UPSC के चालाक जाल और सामान्य गलतियों को पहचानने की शक्ति।'
                    : "The power to recognize UPSC's clever traps and common pitfalls before you make them."}
                </p>
              </div>
            </div>

            {/* CTA */}
            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900">
                  <ArrowRight className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-black text-slate-900">
                    {isHindi ? '600+ UPSC प्रश्न' : '600+ UPSC Questions'}
                  </p>
                  <p className="text-xs font-bold tracking-widest text-slate-600 uppercase">
                    {isHindi
                      ? 'इसी विशेषज्ञ स्तर की व्याख्या के साथ'
                      : 'with this level of expert logic'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

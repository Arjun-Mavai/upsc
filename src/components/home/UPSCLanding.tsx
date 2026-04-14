import { HeroSectionUPSC } from './HeroSectionUPSC';
import { PYQIntelligenceSection } from './PYQIntelligenceSection';
import { PYQShowcaseSection } from './PYQShowcaseSection';
import { PremiumExplanationSectionUPSC } from './PremiumExplanationSectionUPSC';
import { InstantModeSection } from './InstantModeSection';
import { Testimonials } from './Testimonials';
import { AppInstallGuideUPSC } from './AppInstallGuideUPSC';
import { ExamConfig } from '@/config/exams';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Globe, LayoutGrid, Sparkles, Target, Zap, BrainCircuit } from 'lucide-react';
import dynamic from 'next/dynamic';

const PricingSection = dynamic(() =>
  import('@/components/home/PricingSection').then((m) => m.PricingSection)
);

interface UPSCLandingProps {
  exam: ExamConfig;
}

export function UPSCLanding({ exam }: UPSCLandingProps) {
  return (
    <main className="bg-white">
      <h1 className="sr-only">
        UPSC Zen — Master UPSC CSE PYQs (2020-2025) with Expert Logic & Subject-Wise
        Analysis
      </h1>

      {/* 1. Hero Section */}
      <HeroSectionUPSC />

      {/* 2. PYQ Intelligence Section (2020-2025 Matrix) */}
      {/* <PYQIntelligenceSection exam={exam} /> */}

      {/* 3. PYQ Showcase Section (Strategic Intelligence) */}
      <PYQShowcaseSection />

      {/* 4. Expert Wisdom Explanation Section */}
      <PremiumExplanationSectionUPSC />

      {/* 5. Instant Mode Feature (Logic Behind Every Option) */}
      <InstantModeSection />



      {/* 6. Why UPSC Zen? (4 Pillars) */}
      <section className="relative overflow-hidden bg-slate-50 py-32 md:py-48">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-20 text-center">
            <h2 className="text-3xl font-black tracking-tight text-slate-900 md:text-5xl lg:text-6xl">
              Why <span className="text-amber-600">UPSC Zen</span>?
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg font-bold text-slate-500">
              The most organized platform to decode UPSC CSE General Studies (2020–2025) with expert
              precision and logical depth.
            </p>
          </div>

          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: LayoutGrid,
                title: 'Organized PYQs',
                titleHi: 'व्यवस्थित PYQs',
                desc: 'All questions from the last 6 years (2020-2025) perfectly categorized by subject and year for focused study.',
                descHi: 'पिछले 6 वर्षों के सभी प्रश्न विषयों और वर्षों के अनुसार व्यवस्थित।',
                color: 'text-amber-600 bg-amber-50',
              },
              {
                icon: BrainCircuit,
                title: 'Expert Wisdom',
                titleHi: 'विशेषज्ञ विजडम',
                desc: 'Deep logic-based explanations including Verdict, Core Pillar, and Trap Watch for every question.',
                descHi: 'फैसला, मुख्य स्तंभ और ट्रैप वॉच के साथ गहन तर्क-आधारित व्याख्याएं।',
                color: 'text-emerald-600 bg-emerald-50',
              },
              {
                icon: Zap,
                title: 'Instant Mode',
                titleHi: 'इंस्टेंट मोड',
                desc: 'Learn while you test. Reveal the logic behind every option instantly to build conceptual clarity.',
                descHi:
                  'टेस्ट के दौरान ही सीखें। वैचारिक स्पष्टता के लिए हर विकल्प के पीछे का तर्क तुरंत जानें।',
                color: 'text-indigo-600 bg-indigo-50',
              },
              {
                icon: Target,
                title: 'High-Yield Focus',
                titleHi: 'हाई-यील्ड फोकस',
                desc: 'Identify the most important topics and framing patterns from the latest era of UPSC Prelims.',
                descHi:
                  'UPSC प्रीलिम्स के नवीनतम युग से सबसे महत्वपूर्ण विषयों और पैटर्न की पहचान करें।',
                color: 'text-rose-600 bg-rose-50',
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="group relative rounded-3xl border border-slate-200 bg-white p-8 transition-all hover:-translate-y-2 hover:border-amber-200 hover:shadow-2xl"
              >
                <div
                  className={`mb-6 flex h-16 w-16 items-center justify-center rounded-2xl ${feature.color}`}
                >
                  <feature.icon className="h-8 w-8" strokeWidth={2.5} />
                </div>
                <h3 className="mb-3 text-xl font-black text-slate-900 transition-colors group-hover:text-amber-600">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed font-medium text-slate-500">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. App Install Guide (Detailed) */}
      <AppInstallGuideUPSC />

      {/* 8. Pricing Section */}
      <PricingSection />

      {/* 9. Testimonials */}
      <Testimonials />
    </main>
  );
}

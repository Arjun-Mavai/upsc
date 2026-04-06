import { getExamContext, generateExamMetadata } from '@/lib/exam-context';
import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { HeroSection } from '@/components/home/HeroSection';
import { InstantFeedbackSection } from '@/components/home/InstantFeedbackSection';
import { SubjectMasterySection } from '@/components/home/SubjectMasterySection';
import { ContentSuiteSection } from '@/components/home/ContentSuiteSection';

// Below-fold sections
const PremiumExplanationSection = dynamic(() =>
  import('@/components/home/PremiumExplanationSection').then((m) => ({
    default: m.PremiumExplanationSection,
  }))
);
const PYQShowcaseSection = dynamic(() =>
  import('@/components/home/PYQShowcaseSection').then((m) => ({
    default: m.PYQShowcaseSection,
  }))
);
const PricingSection = dynamic(() =>
  import('@/components/home/PricingSection').then((m) => ({ default: m.PricingSection }))
);

export async function generateMetadata(): Promise<Metadata> {
  const exam = await getExamContext();
  const base = await generateExamMetadata();
  return {
    ...base,
    title: `Premium Access | ${exam.title}`,
    description: `Unlock expert analysis, solved PYQs, and real-time insights for ${exam.id.toUpperCase()} 2026.`,
  };
}

export default async function UpgradePage() {
  const exam = await getExamContext();
  const isUPSC = exam.id === 'upsc';

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-slate-100 selection:text-slate-900">
      <HeroSection />
      <PremiumExplanationSection />
      <PYQShowcaseSection />
      <InstantFeedbackSection />
      <SubjectMasterySection />
      <ContentSuiteSection />

      <PricingSection />
    </div>
  );
}

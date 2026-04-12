'use client';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💰 PRICING PAGE — Dynamic prices from backend, marketing-optimized
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// All prices fetched from /api/pricing → admin changes reflect instantly.
// Designed as a lead-gen conversion page:
//   - Urgency banner (FOMO)
//   - Clear "what you get" breakdown
//   - Validity tied to exam dates (Prelims/Mains)
//   - Bilingual (EN/HI)
//   - Trust signals + FAQ
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronDown,
  Shield,
  Zap,
  Clock,
  Users,
  Sparkles,
  Target,
  BookOpen,
  BarChart3,
  FileText,
  Flame,
  History,
  TrendingUp,
  BrainCircuit,
  LayoutGrid,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useSettingsStore } from '@/store/useSettingsStore';
import { PRICING_DEFAULTS, PRO_FEATURES } from '@/config/pricing';
import { PaymentModal } from '@/components/payment/PaymentModal';
import { PricingCard } from '@/components/PricingCard';
import { cn } from '@/lib/utils';
import { getPricingData } from '@/actions/pricing-actions';
import { useQuery } from '@tanstack/react-query';

// ── FAQ data — bilingual ────────────────────────────────────
const faqData = [
  {
    q: { en: 'How long is my access valid?', hi: 'मेरा एक्सेस कब तक वैध रहेगा?' },
    a: {
      en: 'Access is valid till UPSC CSE Prelims 2026.',
      hi: 'एक्सेस UPSC CSE प्रीलिम्स 2026 तक वैध है।',
    },
  },
];

// ── Feature lists from centralized config ───────────────
// Icon mapping for pricing page
const ICON_MAP: Record<string, any> = {
  Target,
  BookOpen,
  Sparkles,
  FileText,
  Clock,
  Zap,
  BarChart3,
  History,
  TrendingUp,
};

const proFeatures = PRO_FEATURES.map((f) => ({ ...f, icon: f.icon || 'Target' }));

// ── FAQ Accordion Item ──────────────────────────────────────
function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-200 last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="group flex w-full cursor-pointer items-center justify-between py-5 text-left"
      >
        <span className="pr-4 text-sm font-semibold text-slate-800 md:text-base">{question}</span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <div
        className={`grid transition-all duration-200 ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
      >
        <div className="overflow-hidden">
          <p className="pb-5 text-sm leading-relaxed text-slate-600">{answer}</p>
        </div>
      </div>
    </div>
  );
}

export default function PricingPage() {
  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState({
    planType: 'pro' as 'pro' | 'upgrade',
    name: '',
  });

  const { language, user } = useSettingsStore();
  const hi = language === 'hi';
  const router = useRouter();
  const planTier = user?.planTier ?? 'free';
  const isProUser = planTier === 'pro';

  // 🔒 Fetch pricing with React Query + Server Action
  const { data: pricingData, isLoading } = useQuery({
    queryKey: ['pricing', 'upsc'],
    queryFn: async () => await getPricingData('upsc'),
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });

  const p = pricingData?.pricing || PRICING_DEFAULTS;

  // Pro users ko pricing page bilkul na dikhao — redirect to quiz
  useEffect(() => {
    if (isProUser) {
      router.replace('/syllabus/quiz/pyq');
    }
  }, [isProUser, router]);

  const handleBuy = (plan: 'pro' | 'upgrade') => {
    if (plan === 'pro') {
      setSelectedPlan({ planType: 'pro', name: `Pro Plan — ₹${p.proPrice}` });
    } else if (plan === 'upgrade') {
      setSelectedPlan({ planType: 'upgrade', name: `Pro Upgrade — ₹${p.upgradePrice}` });
    }
    setShowPaymentModal(true);
  };

  // 🦴 SKELETON LOADING STATE
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white pt-24 pb-20">
        <div className="mx-auto max-w-5xl px-4">
          <div className="mb-12 space-y-4 text-center">
            <Skeleton className="mx-auto h-8 w-48 rounded-full" />
            <Skeleton className="mx-auto h-12 w-3/4 max-w-lg rounded-xl" />
            <Skeleton className="mx-auto h-6 w-1/2 max-w-md rounded-lg" />
          </div>
          <div className="mx-auto max-w-md h-[600px] w-full animate-pulse rounded-3xl bg-slate-100" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fffdfa] font-sans selection:bg-amber-100 selection:text-amber-900 overflow-hidden relative">
      {/* Background Decoration */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-amber-500/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-orange-500/5 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2" />

      {/* ── Hero Header ──────────────────────────────────── */}
      <section className="relative z-10 px-4 pt-24 pb-4 text-center md:pt-32 md:pb-8">
        <Badge className="mb-6 cursor-default border-amber-200 bg-amber-50 px-5 py-2 text-xs font-black tracking-widest text-amber-800 uppercase shadow-sm">
          UPSC 2026 Special
        </Badge>
        <h1 className="font-display mb-4 text-4xl leading-tight font-black tracking-tight text-slate-900 md:text-6xl">
          {hi ? (
             <>अपनी <span className="text-amber-600">UPSC सफलता</span> में निवेश करें</>
          ) : (
             <>Invest in Your <span className="text-amber-600">UPSC Success</span></>
          )}
        </h1>
        <p className="mx-auto mb-2 max-w-2xl text-lg font-bold text-slate-600 md:text-xl">
          {hi ? 'उन गंभीर छात्रों के साथ जुड़ें जो स्मार्ट और डेटा-आधारित तैयारी कर रहे हैं' : 'Join serious aspirants who are mastering the syllabus with a data-driven approach'}
        </p>
      </section>

      {/* ── Free users — One plan ──────────────────────── */}
      {!isProUser && (
        <section className="px-4 pb-16">
          
          {/* ── What You Get Section (Value First) ───────── */}
          <div className="mx-auto mb-16 max-w-6xl">
            <div className="mb-8 flex flex-col items-center gap-2">
               <h2 className="text-2xl font-black text-slate-900 md:text-3xl tracking-tight">
                {hi ? 'आपको क्या मिलता है?' : 'What do you get?'}
              </h2>
              <div className="h-1.5 w-20 rounded-full bg-amber-500" />
            </div>
            
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {[
                {
                  icon: BrainCircuit,
                  label: hi ? 'विशेषज्ञ विजडम' : 'Expert Wisdom',
                  sub: hi ? 'फैसला, तर्क और ट्रैप वॉच' : 'Verdict, Logic & Trap Watch',
                  highlight: true
                },
                {
                  icon: Target,
                  label: hi ? 'व्यवस्थित PYQs' : 'Organized PYQs',
                  sub: hi ? 'विषय-वार और वर्ष-वार' : 'Subject & Year-wise (2020-2025)',
                  highlight: true
                },
                {
                  icon: Sparkles,
                  label: hi ? 'प्रीमियम फैक्ट्स' : 'Premium Facts',
                  sub: hi ? 'हाई-यील्ड एग्जाम डेटा' : 'High-yield Exam Data',
                  highlight: true
                },
                {
                  icon: Zap,
                  label: hi ? 'इंस्टेंट मोड' : 'Instant Mode',
                  sub: hi ? 'हर विकल्प के पीछे का तर्क' : 'Logic behind every option',
                },
                {
                  icon: History,
                  label: hi ? '6 साल के PYQs' : '6 Years PYQs',
                  sub: hi ? 'विस्तृत व्याख्या सहित' : 'With detailed breakdowns',
                  badges: hi 
                    ? ['UPSC 2020-25'] 
                    : ['UPSC 2020-25'],
                  highlight: true
                },
                {
                  icon: LayoutGrid,
                  label: hi ? 'व्यक्तिगत डैशबोर्ड' : 'Personal Dashboard',
                  sub: hi ? 'टेस्ट हिस्ट्री और प्रोग्रेस' : 'Test History & Progress',
                },
                {
                  icon: TrendingUp,
                  label: hi ? 'एनालिटिकल इनसाइट्स' : 'Analytical Insights',
                  sub: hi ? 'सबसे महत्वपूर्ण टॉपिक्स' : 'Most important topics',
                },
                {
                  icon: BookOpen,
                  label: hi ? 'कॉन्सेप्ट क्लैरिटी' : 'Concept Clarity',
                  sub: hi ? 'विस्तृत ब्रेकडाउन' : 'Detailed Breakdowns',
                  highlight: true
                },
              ].map((item) => {
                const { icon: Icon, label, sub, highlight } = item;
                const badges = (item as any).badges as string[] | undefined;
                
                return (
                  <div
                    key={label}
                    className={cn(
                      "group relative rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-1 shadow-sm",
                      highlight 
                        ? "border-amber-200 bg-amber-50/20 shadow-amber-500/5 hover:shadow-amber-500/10 hover:border-amber-300" 
                        : "border-slate-100 bg-white hover:border-amber-100 hover:shadow-lg"
                    )}
                  >
                    {badges && (
                      <div className="absolute -top-1.5 -right-1.5 flex h-7 w-7 animate-bounce items-center justify-center rounded-full bg-amber-400 text-white shadow-lg">
                        <Sparkles size={14} className="animate-pulse" />
                      </div>
                    )}

                    <div className={cn(
                      "mb-4 flex h-12 w-12 items-center justify-center rounded-xl transition-colors",
                      highlight ? "bg-amber-500 text-white shadow-xl shadow-amber-500/20" : "bg-slate-100 text-slate-700 group-hover:bg-amber-100 group-hover:text-amber-600"
                    )}>
                      <Icon className="h-6 w-6" />
                    </div>
                    
                    <p className="mb-1 text-sm font-black text-slate-900 md:text-base tracking-tight">{label}</p>
                    
                    {badges && (
                      <div className="mb-3 flex flex-wrap gap-1.5">
                        {badges.map((badge: string) => (
                          <span 
                            key={badge} 
                            className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[8px] font-black tracking-widest text-emerald-700 uppercase"
                          >
                            {badge}
                          </span>
                        ))}
                      </div>
                    )}

                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{sub}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* FOMO badge */}
          <div className="mb-10 flex justify-center">
            <div className="relative inline-flex items-center gap-3 rounded-full border border-amber-200 bg-amber-50/80 backdrop-blur-sm px-5 py-2.5 shadow-xl shadow-amber-500/5">
              <Flame className="h-4 w-4 text-orange-600 animate-pulse" />
              <span className="text-sm font-black text-amber-900 uppercase tracking-tight">
                {hi ? p.urgencyTextHi : p.urgencyText}
              </span>
              <div className="h-4 w-px bg-amber-200 mx-1" />
              <Badge className="h-6 border-emerald-200 bg-emerald-100 px-2 py-0 text-xs font-black text-emerald-800 hover:bg-emerald-100">
                <Users className="mr-1 h-3 w-3" />
                {p.studentsBought} joined
              </Badge>
            </div>
          </div>

          {/* ── Pricing Cards ────────────────────────────── */}
          <div className="mx-auto max-w-md">
            <PricingCard
              planType="pro"
              pricing={p}
              features={proFeatures}
              language={language}
              onBuy={() => handleBuy('pro')}
              isPopular
            />
          </div>

          {/* Trust signals */}
          <div className="mt-8 flex items-center justify-center gap-2">
            <Shield className="h-4 w-4 text-slate-400" />
            <p className="text-xs font-medium text-slate-400">
              {hi
                ? 'सुरक्षित भुगतान • कोई ऑटो-रिन्यूअल नहीं • RazorPay से एक्टिवेट'
                : 'Secure Payment • No Auto-Renewal • Activate via RazorPay'}
            </p>
          </div>
        </section>
      )}

      {/* ── FAQ Section ──────────────────────────────────── */}
      <section className="px-4 pt-4 pb-20">
        <div className="mx-auto max-w-2xl">
          <h2 className="font-display mb-12 text-center text-2xl font-bold text-slate-900 md:text-3xl">
            {hi ? 'अक्सर पूछे जाने वाले सवाल' : 'Frequently Asked Questions'}
          </h2>
          <div className="space-y-4">
            {faqData.map((item, i) => (
              <FaqItem
                key={i}
                question={hi ? item.q.hi : item.q.en}
                answer={hi ? item.a.hi : item.a.en}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Payment Modal Integration */}
      <PaymentModal
        open={showPaymentModal}
        onOpenChange={setShowPaymentModal}
        planType={selectedPlan.planType}
        planName={selectedPlan.name}
      />
    </div>
  );
}

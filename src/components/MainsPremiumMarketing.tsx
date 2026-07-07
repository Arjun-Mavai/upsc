'use client';

/**
 * Mains vault pitch inside SyllabusLockMainsModal — mirrors PremiumMarketing shell,
 * prices + bullets from `getPricingData('mppsc')` (DB + merged defaults).
 */
import { Flame, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useSettingsStore } from '@/store/useSettingsStore';
import { PRICING_DEFAULTS, type PlanFeatureWithIcon } from '@/config/pricing';
import { PricingCard } from '@/components/PricingCard';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useQuery } from '@tanstack/react-query';
import { getPricingData } from '@/actions/pricing-actions';
import { DEFAULT_UPSC_PRODUCT_COPY } from '@/config/upsc-product-copy';

interface MainsPremiumMarketingProps {
  onClose?: () => void;
}

export function MainsPremiumMarketing({ onClose }: MainsPremiumMarketingProps) {
  const { language } = useSettingsStore();
  const hi = language === 'hi';

  const { data: pricingData, isLoading } = useQuery({
    queryKey: ['pricing', 'mppsc'],
    queryFn: async () => await getPricingData('mppsc'),
    staleTime: 5 * 60 * 1000,
  });

  const p = pricingData?.pricing ?? PRICING_DEFAULTS;
  const copy = DEFAULT_UPSC_PRODUCT_COPY;

  const mainsFeatures: PlanFeatureWithIcon[] = copy.mains.bulletsEn.map((en: string, i: number) => ({
    en,
    hi: copy.mains.bulletsHi[i] ?? en,
    icon: 'Target' as const,
  }));

  if (isLoading) {
    return (
      <div className="relative flex min-h-[420px] flex-col items-center bg-slate-50 px-4 py-8 md:p-10">
        <Skeleton className="mb-6 h-9 w-3/4 max-w-md rounded-lg" />
        <Skeleton className="mb-10 h-4 w-2/3 max-w-sm rounded" />
        <Skeleton className="h-[440px] w-full max-w-md rounded-2xl" />
        <DialogPrimitive.Close className="absolute top-2 right-2 z-50 rounded-full border-2 border-emerald-100 bg-white p-2 text-emerald-600 shadow-sm transition-all hover:bg-emerald-50">
          <X className="h-6 w-6" strokeWidth={3} />
        </DialogPrimitive.Close>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in zoom-in-95 relative flex flex-col items-center bg-slate-50 px-4 py-6 text-center duration-200 md:p-10">
      <Badge className="mb-4 border-amber-200 bg-amber-50 px-4 py-1.5 text-amber-800 md:mb-5">
        {hi ? 'UPSC मेंस लाइब्रेरी' : 'UPSC Mains Library'}
      </Badge>

      <h2 className="font-display mb-3 max-w-xl text-2xl leading-tight font-black tracking-tight text-slate-900 md:text-4xl">
        {hi ? (
          <>
            सिलेबस से उत्तर तक की <span className="text-emerald-700">स्पष्ट समझ</span>
          </>
        ) : (
          <>
            Clear <span className="text-emerald-700">understanding</span> from syllabus to answers
          </>
        )}
      </h2>
{/* <p className="mx-auto mb-8 max-w-lg px-2 text-sm font-medium text-slate-600 md:text-base">
        {hi
          ? 'सिलेबस के प्रत्येक टॉपिक की गहरी समझ (Syllabus Grasp) के लिए पिछले वर्षों के प्रश्नों (PYQs) के हिंदी व इंग्लिश (English & Hindi) में तैयार 2 अलग-अलग स्टाइल के सटीक मॉडल उत्तर।'
          : 'Deeply grasp every syllabus topic with complete previous years\' questions (PYQs) and 2 distinct model answer styles (Dual-Style variations) in clean English & Hindi.'}
      </p> */}

      <div className="mb-8 flex justify-center">
        <div className="relative inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2">
          <span className="text-xs font-bold text-amber-900 uppercase tracking-tight">
            {hi ? 'अर्ली बर्ड ऑफर — UPSC 🚀' : 'Early Bird Offer — UPSC 🚀'}
          </span>
        </div>
      </div>

      <div className="mx-auto w-full max-w-md px-0 md:px-4">
        <PricingCard
          planType={"mains" as any}
          pricing={p}
          features={mainsFeatures}
          language={language}
          onBuy={() => onClose?.()}
          href="/pricing?need=mains"
        />
        <p className="mt-4 text-center text-xs text-slate-500">
          {hi ? (
            <>
              प्री + मेंस एक साथ?{' '}
              <a href="/pricing" onClick={() => onClose?.()} className="font-bold text-amber-700 underline underline-offset-2">
                प्राइसिंग पर कॉम्बो देखें
              </a>
            </>
          ) : (
            <>
              Want Pre + Mains together?{' '}
              <a href="/pricing" onClick={() => onClose?.()} className="font-bold text-amber-700 underline underline-offset-2">
                See the combo on pricing
              </a>
            </>
          )}
        </p>
      </div>

      <DialogPrimitive.Close className="absolute top-2 right-2 z-50 rounded-full border-2 border-rose-100 bg-white p-2 text-rose-500 shadow-sm transition-all hover:scale-110 hover:bg-rose-50 hover:text-rose-600 active:scale-95">
        <X className="h-6 w-6" strokeWidth={3} />
      </DialogPrimitive.Close>
    </div>
  );
}

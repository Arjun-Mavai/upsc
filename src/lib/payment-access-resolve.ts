import { PRICING_DEFAULTS, type PricingData } from '@/config/pricing';
import {
  mergeGrantsAfterComboPurchase,
  parseAccessGrants,
} from '@/lib/access-grants';
import { notesPlanTypeMatchesAmount } from '@/lib/plan-security';

export type ResolvedPayment = {
  allowedAmount: boolean;
  planTier: 'free' | 'lite' | 'pro' | 'mains' | 'combo';
  accessGrants: string[];
  months: number;
  paymentLabel: 'lite' | 'pro' | 'mains' | 'combo' | 'upgrade';
};

/**
 * For UPSC, there is only ONE premium product (Pro+).
 * Any valid payment automatically upgrades the user to full 'combo' access
 * (which includes upsc_pre and upsc_mains).
 */
export function resolveVerifiedPayment(
  amountInPaise: number,
  notesPlanType: string | undefined,
  pricing: PricingData,
  priorGrantsRaw: unknown,
  priorPlanTier: string | undefined
): ResolvedPayment {
  const priorGrants = parseAccessGrants(priorGrantsRaw);
  const prior = String(priorPlanTier ?? 'free').toLowerCase() as 'free' | 'lite' | 'pro' | 'mains' | 'combo';

  const fail = (): ResolvedPayment => ({
    allowedAmount: false,
    planTier: prior,
    accessGrants: priorGrants.length ? priorGrants : ['upsc_pre'],
    months: 0,
    paymentLabel: 'pro',
  });

  if (!notesPlanTypeMatchesAmount(notesPlanType, amountInPaise, pricing)) {
    return fail();
  }

  // UPSC only has one premium plan (Pro+), so ANY valid payment grants full Combo access
  return {
    allowedAmount: true,
    planTier: 'combo',
    accessGrants: mergeGrantsAfterComboPurchase(), // ["upsc_pre", "upsc_mains"]
    months: pricing.comboMonths ?? pricing.proMonths ?? PRICING_DEFAULTS.proMonths,
    paymentLabel: 'combo',
  };
}

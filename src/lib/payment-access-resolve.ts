import { PRICING_DEFAULTS, type PricingData } from '@/config/pricing';
import {
  mergeGrantsAfterComboPurchase,
  mergeGrantsAfterMainsPurchase,
  mergeGrantsAfterPrePurchase,
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

function prePurchaseGrants(priorGrants: string[]) {
  return mergeGrantsAfterPrePurchase(priorGrants.length ? priorGrants : ['upsc_pre']);
}

/**
 * Three **products** (simple mental model):
 * - **pro** → full UPSC Prelims (`upsc_pre`)
 * - **mains** → full Mains vault (`upsc_mains`) — bags computed server-side (no client mainsOffer)
 * - **combo** → Pre + Mains (`upsc_pre` + `upsc_mains`)
 *
 * Legacy: **lite**, **upgrade** still honoured for old Razorpay orders.
 *
 * Security: amount must match SKU; `notes.planType` must match amount when present (`plan-security.ts`).
 */
export function resolveVerifiedPayment(
  amountInPaise: number,
  notesPlanType: string | undefined,
  pricing: PricingData,
  priorGrantsRaw: unknown,
  priorPlanTier: string | undefined
): ResolvedPayment {
  if (!notesPlanTypeMatchesAmount(notesPlanType, amountInPaise, pricing)) {
    return {
      allowedAmount: false,
      planTier: 'free',
      accessGrants: [],
      months: 0,
      paymentLabel: 'lite',
    };
  }

  const litePaise = (pricing.litePrice ?? PRICING_DEFAULTS.litePrice) * 100;
  const proPaise = (pricing.proPrice ?? PRICING_DEFAULTS.proPrice) * 100;
  const upgradePaise = (pricing.upgradePrice ?? PRICING_DEFAULTS.upgradePrice) * 100;
  const mainsPaise = (pricing.mainsPrice ?? PRICING_DEFAULTS.mainsPrice) * 100;
  const comboPaise = (pricing.comboPrice ?? PRICING_DEFAULTS.comboPrice) * 100;

  const priorGrants = parseAccessGrants(priorGrantsRaw);
  const prior = String(priorPlanTier ?? 'free').toLowerCase() as 'free' | 'lite' | 'pro' | 'mains' | 'combo';
  const pt = String(notesPlanType ?? '').trim().toLowerCase();

  const fail = (): ResolvedPayment => ({
    allowedAmount: false,
    planTier: prior,
    accessGrants: priorGrants.length ? priorGrants : ['upsc_pre'],
    months: 0,
    paymentLabel: 'lite',
  });

  // ── Combo (Pre + Mains full) ─────────────────────────────
  if (amountInPaise === comboPaise) {
    if (pt && pt !== 'combo') return fail();
    const months = pricing.comboMonths ?? PRICING_DEFAULTS.comboMonths;
    return {
      allowedAmount: true,
      planTier: 'combo',
      accessGrants: mergeGrantsAfterComboPurchase(),
      months,
      paymentLabel: 'combo',
    };
  }

  // ── Mains only ────────────────────────────────────────────
  if (amountInPaise === mainsPaise) {
    if (pt && pt !== 'mains') return fail();
    const months = pricing.mainsMonths ?? PRICING_DEFAULTS.mainsMonths;
    const paidPrelimsProduct = prior === 'lite' || prior === 'pro';
    const grants = paidPrelimsProduct
      ? mergeGrantsAfterMainsPurchase(priorGrants.length ? priorGrants : ['upsc_pre'])
      : ['upsc_mains'];
    return {
      allowedAmount: true,
      planTier: paidPrelimsProduct ? 'combo' : 'mains',
      accessGrants: grants,
      months,
      paymentLabel: 'mains',
    };
  }

  const liteMonths = pricing.liteMonths ?? PRICING_DEFAULTS.liteMonths;
  const proMonths = pricing.proMonths ?? PRICING_DEFAULTS.proMonths;

  // ── Lite vs Pro (same ₹ possible — disambiguate with notes.planType) ─
  if (litePaise === proPaise && amountInPaise === litePaise) {
    if (pt === 'lite') {
      return {
        allowedAmount: true,
        planTier: 'lite',
        accessGrants: prePurchaseGrants(priorGrants),
        months: liteMonths,
        paymentLabel: 'lite',
      };
    }
    if (pt === 'pro' || !pt) {
      return {
        allowedAmount: true,
        planTier: 'pro',
        accessGrants: prePurchaseGrants(priorGrants),
        months: proMonths,
        paymentLabel: 'pro',
      };
    }
    return fail();
  }

  // ── Lite (legacy) ───────────────────────────────────────
  if (amountInPaise === litePaise) {
    if (pt && pt !== 'lite') return fail();
    return {
      allowedAmount: true,
      planTier: 'lite',
      accessGrants: prePurchaseGrants(priorGrants),
      months: liteMonths,
      paymentLabel: 'lite',
    };
  }

  // ── Pro vs Upgrade (same ₹ possible — disambiguate with notes.planType) ─
  if (proPaise === upgradePaise && amountInPaise === proPaise) {
    if (pt === 'upgrade') {
      return {
        allowedAmount: true,
        planTier: 'pro',
        accessGrants: prePurchaseGrants(priorGrants),
        months: proMonths,
        paymentLabel: 'upgrade',
      };
    }
    if (pt === 'pro' || !pt) {
      return {
        allowedAmount: true,
        planTier: 'pro',
        accessGrants: prePurchaseGrants(priorGrants),
        months: proMonths,
        paymentLabel: 'pro',
      };
    }
    return fail();
  }

  if (amountInPaise === upgradePaise) {
    if (pt && pt !== 'upgrade') return fail();
    return {
      allowedAmount: true,
      planTier: 'pro',
      accessGrants: prePurchaseGrants(priorGrants),
      months: proMonths,
      paymentLabel: 'upgrade',
    };
  }

  if (amountInPaise === proPaise) {
    if (pt && pt !== 'pro') return fail();
    return {
      allowedAmount: true,
      planTier: 'pro',
      accessGrants: prePurchaseGrants(priorGrants),
      months: proMonths,
      paymentLabel: 'pro',
    };
  }

  return fail();
}

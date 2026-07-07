import type { PricingData } from '@/config/pricing';
import { PRICING_DEFAULTS } from '@/config/pricing';

/**
 * Razorpay order notes.planType must match the captured amount (anti-tamper).
 * Legacy orders may omit planType → allowed when amount matches exactly one SKU.
 */
export function notesPlanTypeMatchesAmount(
  notesPlanType: string | undefined,
  amountInPaise: number,
  pricing: PricingData
): boolean {
  const pt = String(notesPlanType ?? '').trim().toLowerCase();
  const L = (pricing.litePrice ?? PRICING_DEFAULTS.litePrice) * 100;
  const P = (pricing.proPrice ?? PRICING_DEFAULTS.proPrice) * 100;
  const U = (pricing.upgradePrice ?? PRICING_DEFAULTS.upgradePrice) * 100;
  const M = (pricing.mainsPrice ?? PRICING_DEFAULTS.mainsPrice) * 100;
  const C = (pricing.comboPrice ?? PRICING_DEFAULTS.comboPrice) * 100;

  if (!pt) return true;

  const map: Record<string, number[]> = {
    lite: [L],
    pro: [P],
    upgrade: [U],
    mains: [M],
    combo: [C],
  };

  const allowed = map[pt];
  if (!allowed) return false;
  return allowed.includes(amountInPaise);
}

/** Call from CI / admin: alert if two SKUs share the same paise (needs notes.planType discipline). */
export function listPricingAmountCollisions(pricing: PricingData): string[] {
  const entries: [string, number][] = [
    ['lite', (pricing.litePrice ?? PRICING_DEFAULTS.litePrice) * 100],
    ['pro', (pricing.proPrice ?? PRICING_DEFAULTS.proPrice) * 100],
    ['upgrade', (pricing.upgradePrice ?? PRICING_DEFAULTS.upgradePrice) * 100],
    ['mains', (pricing.mainsPrice ?? PRICING_DEFAULTS.mainsPrice) * 100],
    ['combo', (pricing.comboPrice ?? PRICING_DEFAULTS.comboPrice) * 100],
  ];
  const byAmount = new Map<number, string[]>();
  for (const [name, paise] of entries) {
    const xs = byAmount.get(paise) ?? [];
    xs.push(name);
    byAmount.set(paise, xs);
  }
  const problems: string[] = [];
  for (const [paise, names] of byAmount) {
    if (names.length > 1) problems.push(`${paise} paise: ${names.join(' + ')}`);
  }
  return problems;
}

'use server';

import { PRICING_DEFAULTS, type PricingData } from '@/config/pricing';
import { getPricingConfigRow, pricingRowToData } from '@/lib/pricing-db';

/**
 * 💰 Get Pricing Data (Server Action)
 *
 * Uses DB row for `examId`, then falls back to `default` (same row admin updates).
 * Last resort: PRICING_DEFAULTS from config.
 */
export async function getPricingData(examId: string = 'upsc'): Promise<{ pricing: PricingData }> {
  try {
    const row = await getPricingConfigRow(examId);
    return { pricing: pricingRowToData(row) };
  } catch {
    return { pricing: PRICING_DEFAULTS };
  }
}

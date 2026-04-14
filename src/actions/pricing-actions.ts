'use server';

import { db } from '@/db';
import { pricingConfig } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { PRICING_DEFAULTS, type PricingData } from '@/config/pricing';
import { logger } from '@/lib/logger';

/**
 * 💰 Get Pricing Data (Server Action)
 *
 * Fetches current pricing configuration from database for a specific exam.
 * Falls back to defaults if not found.
 */
export async function getPricingData(
  examType: 'upsc' | 'mppsc' | 'mppolice' = 'upsc'
): Promise<{ pricing: PricingData }> {
  try {
    const pricingRows = await db
      .select()
      .from(pricingConfig)
      .where(eq(pricingConfig.examType, examType))
      .limit(1);

    if (pricingRows.length > 0) {
      const row = pricingRows[0];
      // Coerce nullable DB values to non-null using defaults
      const pricing: PricingData = {
        proPrice: row.proPrice ?? PRICING_DEFAULTS.proPrice,
        proOriginalPrice: row.proOriginalPrice ?? PRICING_DEFAULTS.proOriginalPrice,
        litePrice: row.litePrice ?? PRICING_DEFAULTS.litePrice,
        liteOriginalPrice: row.liteOriginalPrice ?? PRICING_DEFAULTS.liteOriginalPrice,
        proValidityText: row.proValidityText ?? PRICING_DEFAULTS.proValidityText,
        proMonths: row.proMonths ?? PRICING_DEFAULTS.proMonths,
        liteMonths: row.liteMonths ?? PRICING_DEFAULTS.liteMonths,
        liteValidityText: row.liteValidityText ?? PRICING_DEFAULTS.liteValidityText,
        upgradePrice: row.upgradePrice ?? PRICING_DEFAULTS.upgradePrice,
        upgradeOriginalPrice: row.upgradeOriginalPrice ?? PRICING_DEFAULTS.upgradeOriginalPrice,
        urgencyText: row.urgencyText ?? PRICING_DEFAULTS.urgencyText,
        urgencyTextHi: row.urgencyTextHi ?? PRICING_DEFAULTS.urgencyTextHi,
        studentsBought: row.studentsBought ?? PRICING_DEFAULTS.studentsBought,
      };
      return { pricing };
    }

    return { pricing: PRICING_DEFAULTS };
  } catch (error) {
    logger.error('Get Pricing Data Error:', error);
    // Fallback to defaults on error
    return { pricing: PRICING_DEFAULTS };
  }
}

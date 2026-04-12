import { db } from '@/db';
import { pricingConfig } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { PRICING_DEFAULTS, type PricingData } from '@/config/pricing';

export type PricingConfigRow = typeof pricingConfig.$inferSelect;

/**
 * Single source for which DB row drives live pricing.
 * Admin `/api/pricing` upserts `id === 'default'`. Optional per-exam rows can use other ids.
 */
export async function getPricingConfigRow(examId: string): Promise<PricingConfigRow | null> {
  const primary = await db.select().from(pricingConfig).where(eq(pricingConfig.id, examId)).limit(1);
  if (primary[0]) return primary[0];
  if (examId !== 'default') {
    const fallback = await db
      .select()
      .from(pricingConfig)
      .where(eq(pricingConfig.id, 'default'))
      .limit(1);
    if (fallback[0]) return fallback[0];
  }
  return null;
}

export function pricingRowToData(row: PricingConfigRow | null | undefined): PricingData {
  if (!row) return PRICING_DEFAULTS;
  return {
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
}

import { PRICING_DEFAULTS, type PricingData } from '@/config/pricing';

const PRICING_ROW_OMIT = new Set(['id', 'updatedAt', 'mppscProductCopyJson']);

/** Merge DB `pricing_config` row with defaults (null-safe, strips Drizzle meta keys). */
export function mergePricingRow(row: unknown): PricingData {
  if (!row || typeof row !== 'object') return PRICING_DEFAULTS;
  const o = row as Record<string, unknown>;
  const restEntries = Object.entries(o).filter(([k]) => !PRICING_ROW_OMIT.has(k));
  const rest = Object.fromEntries(restEntries) as Partial<PricingData>;
  return { ...PRICING_DEFAULTS, ...rest };
}

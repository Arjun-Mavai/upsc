import { db } from '@/db';
import { pricingConfig } from '@/db/schema';
import { eq } from 'drizzle-orm';

export type PricingExamId = 'upsc' | 'mppsc' | 'mppolice';

/**
 * Load pricing row for an exam. Tries `id === examType`, then legacy row `id === 'default'`.
 */
export async function fetchPricingConfigRow(examType: string) {
  const byExam = await db
    .select()
    .from(pricingConfig)
    .where(eq(pricingConfig.examType, examType as 'upsc' | 'mppsc' | 'mppolice' | 'all'))
    .limit(1);
  if (byExam[0]) return byExam[0];
  const legacy = await db
    .select()
    .from(pricingConfig)
    .where(eq(pricingConfig.examType, 'upsc'))
    .limit(1);
  return legacy[0] ?? null;
}

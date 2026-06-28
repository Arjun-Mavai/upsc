import { sql } from 'drizzle-orm';
import { mainsPyqPapers } from '@/db/schema';

/**
 * Student PYQ desk / prompt pools: coalesce hides NULL/old rows without `is_hidden` as visible.
 * Safer than `OR is null` across LibSQL/sqlite adapters.
 * Also strictly requires paper_number >= 1 to hide malformed "Paper 0" entries.
 */
export function whereMainsPyqPaperListed() {
  return sql`(coalesce(${mainsPyqPapers.isHidden}, 0) = 0) AND (${mainsPyqPapers.paperNumber} >= 1)`;
}

/** Prefer `whereMainsPyqPaperListed()`; fallback when SQL helper misbehaves. */
export function isMainsPyqPaperListedRow(paper: { isHidden?: boolean | null, paperNumber?: number | null }): boolean {
  if (paper.paperNumber !== undefined && paper.paperNumber !== null && paper.paperNumber < 1) return false;
  return !(paper.isHidden ?? false);
}

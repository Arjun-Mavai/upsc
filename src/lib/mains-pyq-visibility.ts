import { sql } from 'drizzle-orm';
import { mainsPyqPapers } from '@/db/schema';

/**
 * Student PYQ desk / prompt pools: coalesce hides NULL/old rows without `is_hidden` as visible.
 * Safer than `OR is null` across LibSQL/sqlite adapters.
 * Also strictly requires paper_number >= 1 to hide malformed "Paper 0" entries.
 */
export function whereMainsPyqPaperListed() {
  const currentExam = (process.env.NEXT_PUBLIC_EXAM_ID || 'upsc') as string;
  const slugPrefix = currentExam === 'mppolice' ? 'mppolice%' : `${currentExam}%`;
  return sql`(coalesce(${mainsPyqPapers.isHidden}, 0) = 0) AND (${mainsPyqPapers.paperNumber} >= 1) AND (${mainsPyqPapers.slug} LIKE ${slugPrefix})`;
}

/** Prefer `whereMainsPyqPaperListed()`; fallback when SQL helper misbehaves. */
export function isMainsPyqPaperListedRow(paper: { isHidden?: boolean | null, paperNumber?: number | null, slug?: string | null }): boolean {
  if (paper.paperNumber !== undefined && paper.paperNumber !== null && paper.paperNumber < 1) return false;
  const currentExam = (process.env.NEXT_PUBLIC_EXAM_ID || 'upsc') as string;
  if (paper.slug && !paper.slug.startsWith(currentExam)) return false;
  return !(paper.isHidden ?? false);
}

/** Public teaser: full PYQ desk UI; only these unlock without `mppsc_mains`. */

export const MAINS_PYQ_DEMO_YEAR = 2024;
export const MAINS_PYQ_DEMO_PAPER_NUMBER = 1;

/** Free samples per part (A and B) on demo paper — same bands as before. */
export const MAINS_PYQ_FREE_QUESTION_CAP_PER_PART = 4;

export function isMainsPyqDemoPaper(examYear: number, paperNumber: number): boolean {
  return examYear === MAINS_PYQ_DEMO_YEAR && paperNumber === MAINS_PYQ_DEMO_PAPER_NUMBER;
}

export type PyqMarksPickRow = { id: string; marks: number; part: string };

function normalizePart(part: string): string {
  return String(part).trim().toUpperCase();
}

/**
 * One part (A or B): 2-mark×2, one 5/7-mark, one 10/11-mark; fill to cap if bands missing.
 */
export function pickMainsPyqFreeDemoQuestionIdsForPart(
  questions: PyqMarksPickRow[],
  cap = MAINS_PYQ_FREE_QUESTION_CAP_PER_PART
): Set<string> {
  const picked = new Set<string>();

  let twoCount = 0;
  for (const q of questions) {
    if (q.marks === 2 && !picked.has(q.id)) {
      picked.add(q.id);
      twoCount++;
      if (twoCount >= 2) break;
    }
  }

  const mid = questions.find((q) => (q.marks === 5 || q.marks === 7) && !picked.has(q.id));
  if (mid) picked.add(mid.id);

  const high = questions.find((q) => (q.marks === 10 || q.marks === 11) && !picked.has(q.id));
  if (high) picked.add(high.id);

  if (picked.size < cap) {
    for (const q of questions) {
      if (!picked.has(q.id)) picked.add(q.id);
      if (picked.size >= cap) break;
    }
  }

  return picked;
}

/** Demo paper: same free cap for Part A and Part B (up to 8 questions total). */
export function pickMainsPyqFreeDemoQuestionIds(questions: PyqMarksPickRow[]): Set<string> {
  const picked = new Set<string>();
  const partsPresent = new Set(questions.map((q) => normalizePart(q.part)));

  for (const part of ['A', 'B'] as const) {
    if (!partsPresent.has(part)) continue;
    const inPart = questions.filter((q) => normalizePart(q.part) === part);
    for (const id of pickMainsPyqFreeDemoQuestionIdsForPart(inPart)) {
      picked.add(id);
    }
  }

  return picked;
}

/** Display order for free strip: preferred marks bands first, then stable by original index. */
function markTierForDemoSort(marks: number): number {
  if (marks === 2) return 0;
  if (marks === 5) return 1;
  if (marks === 7) return 2;
  if (marks === 10) return 3;
  if (marks === 11) return 4;
  return 99;
}

export function orderMainsPyqRowsForVaultDemo<T extends PyqMarksPickRow>(
  questions: T[],
  freeIds: Set<string>,
  vaultUnlocked: boolean
): T[] {
  if (vaultUnlocked || freeIds.size === 0) return questions;
  const free = questions.filter((q) => freeIds.has(q.id));
  const locked = questions.filter((q) => !freeIds.has(q.id));
  free.sort((a, b) => markTierForDemoSort(a.marks) - markTierForDemoSort(b.marks));
  return [...free, ...locked];
}

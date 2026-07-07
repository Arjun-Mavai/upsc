/** Only these exam years are injected into AI prompts (quality / recency). */
export const PYQ_PROMPT_EXAM_YEARS = [2024, 2023] as const;

export type PyqBand = 'S' | 'L';

/** UPSC-style buckets: short (10m), long (15m/20m). */
export function pyqMarkBand(marks: number): PyqBand {
  if (marks <= 10) return 'S';
  return 'L';
}

export type CuratablePyq = {
  id: string;
  marks: number;
  examYear: number;
  linked: boolean;
};

/** Prefer linked stems, then newer year; cap each band (default 1) for prompt size / focus. */
export function curatePyqForPrompt<T extends CuratablePyq>(rows: T[], perBand = 1): T[] {
  const sorted = [...rows].sort((a, b) => {
    if (a.linked !== b.linked) return a.linked ? -1 : 1;
    if (b.examYear !== a.examYear) return b.examYear - a.examYear;
    return 0;
  });
  const n = { S: 0, L: 0 };
  const out: T[] = [];
  for (const r of sorted) {
    const b = pyqMarkBand(r.marks);
    if (n[b] < perBand) {
      out.push(r);
      n[b]++;
    }
  }
  return out;
}

export function bandLabel(b: PyqBand): string {
  if (b === 'S') return 'SHORT (10 marks)';
  return 'LONG (15-20 marks)';
}

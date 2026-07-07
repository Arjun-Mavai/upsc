import fs from 'node:fs';
import path from 'node:path';

/**
 * Slice segregated mains prompt corpus (`scratch/prompt-segregation-*.txt`).
 * Markers match the BOX / PAPER N PART headings in those files.
 */
export function sliceBetweenMarkers(raw: string, start: RegExp, end: RegExp | null): string {
  const m = start.exec(raw);
  if (!m || m.index == null) return '';
  const rest = raw.slice(m.index);
  if (!end) return rest.trim();
  const e = end.exec(rest);
  if (!e || e.index == null) return rest.trim();
  return rest.slice(0, e.index).trim();
}

/** Paper 1–3 + Paper 4–6 modules keyed by mains paper number and unit.part (A/B). */
export function mainsPartAddonFromScratch(
  scratch13: string,
  scratch46: string,
  pn: number,
  part: string
): string {
  const p = String(part || 'NONE').trim().toUpperCase();

  if (pn === 1 && p === 'A') {
    return sliceBetweenMarkers(
      scratch13,
      /🏛️ BOX 1:\s*PAPER 1 PART A\b[\s\S]*?/i,
      /🌍 BOX 2:\s*PAPER 1 PART B\b/i
    );
  }
  if (pn === 1 && p === 'B') {
    return sliceBetweenMarkers(scratch13, /🌍 BOX 2:\s*PAPER 1 PART B\b[\s\S]*?/i, /\nPAPER 2 PART A\b/i);
  }
  if (pn === 2 && p === 'A') {
    return sliceBetweenMarkers(scratch13, /\nPAPER 2 PART A\b[\s\S]*?/i, /\nPAPER 2 PART B\b/i);
  }
  if (pn === 2 && p === 'B') {
    return sliceBetweenMarkers(scratch13, /\nPAPER 2 PART B\b[\s\S]*?/i, /\n\s*PAPER 3 PART A\b/im);
  }
  if (pn === 3 && p === 'A') {
    return sliceBetweenMarkers(scratch13, /\n\s*PAPER 3 PART A\b[\s\S]*?/im, /\n\s*PAPER 3 PART B\b/im);
  }
  if (pn === 3 && p === 'B') {
    return sliceBetweenMarkers(scratch13, /\n\s*PAPER 3 PART B\b[\s\S]*?/i, null);
  }

  if (pn === 4 && p === 'A') {
    return sliceBetweenMarkers(scratch46, /^\s*PAPER 4 PART A\b[\s\S]*?/im, /^\s*PAPER 4 PART B\b/im);
  }
  if (pn === 4 && p === 'B') {
    return sliceBetweenMarkers(scratch46, /^\s*PAPER 4 PART B\b[\s\S]*?/im, /^\s*Paper 5 Hindi\b/im);
  }
  if (pn === 5) {
    return sliceBetweenMarkers(scratch46, /^\s*Paper 5 Hindi\b[\s\S]*?/im, /^\s*Paper 6 Essay\b/im);
  }
  if (pn === 6) {
    return sliceBetweenMarkers(scratch46, /^\s*Paper 6 Essay\b[\s\S]*?/im, null);
  }
  return '';
}

export function loadMainsScratchPromptFiles(repoRoot: string = process.cwd()): {
  scratch13: string;
  scratch46: string;
} {
  return {
    scratch13: fs.readFileSync(path.join(repoRoot, 'scratch', 'prompt-segregation-paper-1-3.txt'), 'utf8'),
    scratch46: fs.readFileSync(path.join(repoRoot, 'scratch', 'prompt-segregation-paper-4-6.txt'), 'utf8'),
  };
}

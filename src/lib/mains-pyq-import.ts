/**
 * Parse admin-pasted MPPSC mains PYQ JSON (flexible root key) into DB rows.
 */

export type ParsedPyqQuestion = {
  part: string;
  unitNumber: number;
  unitTitleHi: string;
  unitTitleEn: string;
  questionNumber: string;
  marks: number;
  questionType: string;
  questionHi: string;
  questionEn: string;
  displayOrder: number;
};

export type ParsedPyqPaper = {
  slug: string;
  examYear: number;
  paperNumber: number;
  examLabel: string | null;
  titleHi: string | null;
  titleEn: string | null;
  questions: ParsedPyqQuestion[];
};

export function stableQuestionKey(
  part: string,
  unitNumber: number,
  questionNumber: string,
  displayOrder?: number
): string {
  const p = String(part ?? 'NONE').toUpperCase().slice(0, 1);
  const safePart = p === 'A' || p === 'B' ? p : 'A';
  const qn = String(questionNumber ?? '').trim();
  const qPiece = qn.length ? qn : `_order_${displayOrder ?? 0}`;
  return `${safePart}|${Number(unitNumber)}|${qPiece}`;
}

export function stripCiteMarkers(s: string): string {
  return s.replace(/\[cite:\s*\d+\]/gi, '').replace(/\s+/g, ' ').trim();
}

function isPaperShape(v: unknown): v is Record<string, unknown> {
  return (
    !!v &&
    typeof v === 'object' &&
    typeof (v as Record<string, unknown>).paper_number === 'number' &&
    Number((v as Record<string, unknown>).paper_number) >= 1 &&
    Array.isArray((v as Record<string, unknown>).parts)
  );
}

export function findPaperPayload(json: unknown): { rootKey: string; paper: Record<string, unknown> } | null {
  if (!json || typeof json !== 'object') return null;
  const root = json as Record<string, unknown>;
  for (const [key, val] of Object.entries(root)) {
    if (isPaperShape(val)) return { rootKey: key, paper: val };
  }
  return null;
}

/** exam_year on root object overrides regex from key (when present). */
function readExamYear(found: {
  rootKey: string;
  paper: Record<string, unknown>;
}): number {
  const p = found.paper;
  const yr = Number(p.exam_year ?? p.year ?? p.examYear);
  if (Number.isFinite(yr) && yr >= 1990 && yr <= 2100) return yr;
  let examYear = 0;
  const m = found.rootKey.match(/(\d{4})/);
  if (m) examYear = parseInt(m[1], 10);
  const exam = typeof p.exam === 'string' ? stripCiteMarkers(p.exam) : null;
  if (!examYear && exam) {
    const m2 = exam.match(/(\d{4})/);
    if (m2) examYear = parseInt(m2[1], 10);
  }
  if (!examYear) examYear = new Date().getFullYear();
  return examYear;
}

export function parseMainsPyqImportJson(json: unknown): ParsedPyqPaper | null {
  const found = findPaperPayload(json);
  if (!found) return null;
  const p = found.paper;
  const paperNumber = Number(p.paper_number);
  const exam = typeof p.exam === 'string' ? stripCiteMarkers(p.exam) : null;
  const titleHi = typeof p.paper_title_hi === 'string' ? stripCiteMarkers(p.paper_title_hi) : null;
  const titleEn = typeof p.paper_title_en === 'string' ? stripCiteMarkers(p.paper_title_en) : null;

  const examYear = readExamYear(found);

  const slug = `${found.rootKey}`.replace(/[^a-z0-9_]+/gi, '_').toLowerCase();

  const questions: ParsedPyqQuestion[] = [];
  let order = 0;
  const parts = p.parts as unknown[];
  for (const partObj of parts) {
    if (!partObj || typeof partObj !== 'object') continue;
    const po = partObj as Record<string, unknown>;
    const part = String(po.part ?? 'NONE').toUpperCase().slice(0, 1);
    const units = Array.isArray(po.units) ? po.units : [];
    for (const uu of units) {
      if (!uu || typeof uu !== 'object') continue;
      const u = uu as Record<string, unknown>;
      const unitNumber = Number(u.unit_number);
      const unitTitleHi = typeof u.unit_title_hi === 'string' ? stripCiteMarkers(u.unit_title_hi) : '';
      const unitTitleEn = typeof u.unit_title_en === 'string' ? stripCiteMarkers(u.unit_title_en) : '';
      const qs = Array.isArray(u.questions) ? u.questions : [];
      for (const qq of qs) {
        if (!qq || typeof qq !== 'object') continue;
        const q = qq as Record<string, unknown>;
        order += 1;
        const qHi = stripCiteMarkers(String(q.question_hi ?? ''));
        if (!qHi.trim()) continue;
        questions.push({
          part: part === 'A' || part === 'B' ? part : 'A',
          unitNumber: Number.isFinite(unitNumber) ? unitNumber : 0,
          unitTitleHi,
          unitTitleEn,
          questionNumber: String(q.question_number ?? ''),
          marks: Math.max(0, Math.round(Number(q.marks ?? 0))),
          questionType: String(q.type ?? 'Unknown'),
          questionHi: qHi,
          questionEn: stripCiteMarkers(String(q.question_en ?? '')),
          displayOrder: order,
        });
      }
    }
  }

  return {
    slug,
    examYear,
    paperNumber,
    examLabel: exam,
    titleHi,
    titleEn,
    questions,
  };
}

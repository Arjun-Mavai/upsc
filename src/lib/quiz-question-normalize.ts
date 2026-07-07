import type { Question } from '@/types/quiz';


/**
 * Split "(iii) rest of text" into list column id + body (Hindi/English matching columns).
 */
export function splitLeadingMarker(s: string): { id: string; rest: string } {
  const t = s.trim();
  if (!t) return { id: '•', rest: '' };
  const m = t.match(/^\s*(\([^)]+\))\s*([\s\S]*)$/);
  if (m) {
    return { id: m[1].trim(), rest: (m[2] || '').trim() };
  }
  return { id: '•', rest: t };
}

/**
 * Convert upload/API matchPairs (left/right) or legacy { label, matchId, match } into client shape.
 */
export function normalizeMatchPairs(pairs: unknown): Question['matchPairs'] {
  if (pairs == null) return undefined;
  let arr: unknown[] = [];
  if (typeof pairs === 'string') {
    try {
      const p = JSON.parse(pairs);
      arr = Array.isArray(p) ? p : [];
    } catch {
      return undefined;
    }
  } else if (Array.isArray(pairs)) {
    arr = pairs;
  } else {
    return undefined;
  }
  if (arr.length === 0) return undefined;

  return arr.map((raw: unknown) => {
    const p = raw as Record<string, unknown>;
    const hasNewShape =
      p.left != null ||
      p.right != null ||
      p.left_en != null ||
      p.right_en != null;

    if (hasNewShape) {
      const id = String(p.id ?? '1');
      const label = String(p.left ?? p.label ?? '');
      const labelEn =
        p.left_en != null ? String(p.left_en) : p.labelEn != null ? String(p.labelEn) : undefined;
      const right = String(p.right ?? p.match ?? '');
      const rightEnRaw = p.right_en != null ? String(p.right_en) : p.matchEn != null ? String(p.matchEn) : '';
      const r = splitLeadingMarker(right);
      const re = rightEnRaw !== '' ? splitLeadingMarker(rightEnRaw) : r;
      return {
        id,
        label,
        labelEn,
        matchId: r.id,
        match: r.rest || right,
        matchEn: rightEnRaw !== '' ? re.rest || rightEnRaw : undefined,
      };
    }

    return {
      id: String(p.id ?? ''),
      label: String(p.label ?? ''),
      labelEn: p.labelEn != null ? String(p.labelEn) : undefined,
      match: String(p.match ?? ''),
      matchId: String(p.matchId ?? ''),
      matchEn: p.matchEn != null ? String(p.matchEn) : undefined,
    };
  });
}

function parseJsonIfString<T = unknown>(v: unknown): T | unknown {
  if (typeof v !== 'string') return v;
  const t = v.trim();
  if (!t.startsWith('{') && !t.startsWith('[')) return v;
  try {
    return JSON.parse(t) as T;
  } catch {
    return v;
  }
}

/**
 * Resolve explanation + extended expert blob from DB row or upload JSON.
 * Supports: explanation_hi, explanation_en, explanation as string OR { stream: mppsc_expert },
 * extendedData, and legacy columns explanation / explanationEn only.
 */
export function resolveExplanationFields(q: Record<string, unknown>): {
  explanation?: string;
  explanationEn: string | null;
  explanation_hi: string | null;
  extendedData: unknown;
} {
  // Raw SQL / some APIs use snake_case
  if (q.extendedData == null && q.extended_data != null) {
    q = { ...q, extendedData: q.extended_data };
  }

  let extendedData: unknown = parseJsonIfString(q.extendedData);

  const expl: unknown = q.explanation;
  let classicFromExplanationCol: string | undefined;
  let expertFromExplanationCol: Record<string, unknown> | null = null;

  if (expl != null) {
    if (typeof expl === 'object' && !Array.isArray(expl)) {
      expertFromExplanationCol = expl as Record<string, unknown>;
    } else if (typeof expl === 'string') {
      const parsed = parseJsonIfString(expl);
      if (
        parsed &&
        typeof parsed === 'object' &&
        !Array.isArray(parsed) &&
        'stream' in (parsed as Record<string, unknown>)
      ) {
        expertFromExplanationCol = parsed as Record<string, unknown>;
      } else {
        classicFromExplanationCol = expl;
      }
    }
  }

  if (expertFromExplanationCol) {
    if (extendedData && typeof extendedData === 'object' && !Array.isArray(extendedData)) {
      extendedData = { ...(extendedData as object), ...expertFromExplanationCol };
    } else {
      extendedData = expertFromExplanationCol;
    }
  }

  const explanation_hi =
    (typeof q.explanation_hi === 'string' && q.explanation_hi) ||
    (typeof q.explanationHi === 'string' && q.explanationHi) ||
    classicFromExplanationCol ||
    null;

  const explanationEn =
    (typeof q.explanationEn === 'string' && q.explanationEn) ||
    (typeof q.explanation_en === 'string' && q.explanation_en) ||
    null;

  const explanation = explanation_hi || undefined;

  return {
    explanation,
    explanationEn,
    explanation_hi,
    extendedData,
  };
}

export interface MapRawQuestionOptions {
  subject?: string;
  marks?: number;
  negativeMarks?: number;
}

/**
 * Map DB row or API JSON (questionText, explanation_hi, left/right matchPairs, etc.) to client {@link Question}.
 */
export function mapRawQuestionToClientQuestion(
  q: Record<string, unknown>,
  opts: MapRawQuestionOptions = {}
): Question {
  const optionsRaw = q.options;
  let parsedOptions: unknown = optionsRaw;
  if (typeof optionsRaw === 'string') {
    try {
      parsedOptions = JSON.parse(optionsRaw);
    } catch {
      parsedOptions = [];
    }
  }
  if (!Array.isArray(parsedOptions)) {
    parsedOptions = [];
  }

  const { explanation, explanationEn, explanation_hi, extendedData } = resolveExplanationFields(q);

  const matchPairs = normalizeMatchPairs(q.matchPairs);
  const correctAnswer = String(q.correctAnswer ?? '');

  return {
    id: String(q.id),
    question: String(q.question ?? q.questionText ?? ''),
    questionEn: (q.questionEn as string) ?? (q.questionTextEn as string) ?? null,
    options: parsedOptions as Question['options'],
    correctAnswer,
    explanation: explanation || undefined,
    explanationEn: explanationEn ?? null,
    explanation_hi: explanation_hi ?? null,
    extendedData: extendedData ?? undefined,
    type: (q.type as Question['type']) || 'standard',
    matchPairs,
    subject: opts.subject !== undefined ? opts.subject : (q.subject as string) || undefined,
    marks: opts.marks !== undefined ? opts.marks : Number(q.marks) || 0,
    negativeMarks: opts.negativeMarks !== undefined ? opts.negativeMarks : Number(q.negativeMarks) || 0,
  };
}

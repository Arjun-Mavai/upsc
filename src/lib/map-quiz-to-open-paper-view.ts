import type { Question } from '@/types/quiz';

/**
 * Row shape for {@link OpenPyq2026PaperView} — same fields as the intelligence
 * "view all" page expects (no import from that route to keep bundles isolated).
 */
export type OpenPaperViewQuestion = {
  id: string;
  text: string;
  textEn?: string | null;
  year?: number;
  qNo?: number;
  type?: string;
  options?: unknown[];
  matchPairs?: unknown[];
  correctAnswer?: string | number;
  explanation?: string | null;
  explanationEn?: string | null;
  explanation_hi?: string | null;
  extendedData?: string | Record<string, unknown> | null;
  subject?: string | null;
};

export function mapQuizToOpenPaperViewQuestion(
  q: Question,
  index: number,
  year: number
): OpenPaperViewQuestion {
  return {
    id: q.id,
    text: q.question,
    textEn: q.questionEn,
    year,
    qNo: index + 1,
    type: q.type || 'standard',
    options: Array.isArray(q.options) ? (q.options as unknown[]) : [],
    matchPairs: q.matchPairs ? ([...q.matchPairs] as unknown[]) : undefined,
    correctAnswer: q.correctAnswer,
    explanation: q.explanation,
    explanationEn: q.explanationEn,
    explanation_hi: q.explanation_hi,
    extendedData: q.extendedData as string | Record<string, unknown> | null | undefined,
    subject: q.subject,
  };
}

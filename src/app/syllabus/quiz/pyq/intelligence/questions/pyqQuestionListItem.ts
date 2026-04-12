/**
 * Row shape from getQuestionsWithDetails → View All / Modern / Classic clients.
 */
export interface PyqQuestionListItem {
  id: string;
  text: string;
  textEn?: string | null;
  year?: number;
  qNo?: number;
  type?: string;
  options?: unknown;
  matchPairs?: unknown;
  correctAnswer?: unknown;
  explanation?: string | null;
  explanationEn?: string | null;
  subject?: string | null;
  testTitle?: string;
  extendedData?: unknown | null;
}

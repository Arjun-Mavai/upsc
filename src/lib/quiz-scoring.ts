import { QUIZ_CONSTANTS } from '@/config/quiz';
import { ExamConfig, ScoringConfig } from '@/config/exams';

export const SCORING_CONFIG = {
  MARKS_PER_QUESTION: QUIZ_CONSTANTS.MARKS_PER_QUESTION,
  NEGATIVE_MARKING: QUIZ_CONSTANTS.NEGATIVE_MARKING,
} as const;

/**
 * 🎯 Dynamic scoring based on Exam Context & Test Type
 * Bhai, UPSC me GS aur CSAT ke marks alag hote hain, isliye ye zaruri hai!
 */
export function getExamScoring(exam: ExamConfig, testType?: string): ScoringConfig {
  // 1. If it's CSAT, use CSAT specific scoring if available
  if (testType?.toUpperCase() === 'CSAT' && exam.scoring.CSAT) {
    return exam.scoring.CSAT;
  }
  
  // 2. Default to exam's default scoring
  return exam.scoring.default;
}

export function calculateScore(
  totalQuestions: number,
  correctCount: number,
  wrongCount: number,
  customMarks?: number,
  customNegative?: number
): { totalScore: number; maxMarks: number; percentage: number } {
  const marksPerQ = customMarks ?? SCORING_CONFIG.MARKS_PER_QUESTION;
  const negativePerQ = customNegative ?? SCORING_CONFIG.NEGATIVE_MARKING;

  const totalScore = correctCount * marksPerQ - wrongCount * negativePerQ;
  const maxMarks = totalQuestions * marksPerQ;

  // Ensure score doesn't go below 0 if that's the rule, but standard exams allow negative.
  // User requested "proper marks distribution".
  // Usually we show negative if user got negative.
  // But let's keep exact value.

  const percentage = maxMarks > 0 ? Math.round((totalScore / maxMarks) * 100) : 0;

  return {
    totalScore: parseFloat(totalScore.toFixed(2)),
    maxMarks,
    percentage,
  };
}

/**
 * Maps correct answer string (A/B/C/D or 0/1/2/3) to numeric index
 */
export function mapCorrectAnswerToIndex(answer: string | number | null | undefined): number {
  if (answer === null || answer === undefined || answer === '') return -1;
  const num = Number(answer);
  if (!isNaN(num) && String(answer).trim() !== '' && !/^[A-Z]$/i.test(String(answer))) return num;
  
  // Handle 'A', 'B', 'C', 'D'
  if (typeof answer === 'string') {
    const charCode = answer.toUpperCase().charCodeAt(0);
    if (charCode >= 65 && charCode <= 68) return charCode - 65;
  }
  
  return -1;
}

/**
 * Robustly finds the index of the correct option
 */
export function getCorrectAnswerIndex(
  correctAnswer: string | number | null | undefined,
  options: any[] | string
): number {
  if (correctAnswer === null || correctAnswer === undefined || correctAnswer === '') return -1;

  // 1. Parse options if they are a string
  let parsedOptions: any[] = [];
  if (Array.isArray(options)) {
    parsedOptions = options;
  } else if (typeof options === 'string') {
    try {
      parsedOptions = JSON.parse(options);
    } catch (e) {
      return -1;
    }
  }

  // 2. Try mapCorrectAnswerToIndex first (A/B/C/D or 0/1/2/3)
  const mapped = mapCorrectAnswerToIndex(correctAnswer);
  // If it's a number and within bounds, it's likely correct
  if (mapped >= 0 && mapped < parsedOptions.length) {
    // Extra safety: check if the mapped ID actually matches if it's a character
    // Many legacy DBs use 'A' to mean index 0.
    return mapped;
  }

  // 3. Search by ID or Text match
  const searchStr = String(correctAnswer).trim().toLowerCase();
  const foundIdx = parsedOptions.findIndex((opt: any) => {
    if (!opt) return false;
    const optId = String(typeof opt === 'object' ? opt.id : '').trim().toLowerCase();
    const optText = String(typeof opt === 'object' ? opt.text : opt).trim().toLowerCase();
    const optTextEn = String(typeof opt === 'object' ? opt.textEn || opt.text_en : '').trim().toLowerCase();

    return optId === searchStr || optText === searchStr || optTextEn === searchStr;
  });

  return foundIdx;
}

import { getCurrentExam } from '@/config/exams';

// ============================================
// CANONICAL TEST IDS - Verified from PROD DB
// For UPSC Civil Services Prelims 2020-2025
// ============================================

export const CANONICAL_TEST_IDS: Record<number, string> = {
  2020: '5KRVTgTIw07bWNxu20YNl',
  2021: 'ix0FnJV496Rgvw0YHOEFj',
  2022: 'o_rO3J1tSEACKENOLT9QI',
  2023: 'mQ1a9hZoTdfSRfkz40K5C',
  2024: '3XmZ0l700BJV3j2FLd0XZ',
  2025: 'D0gf6bklgl3RT-sTnue2n',
};

// Helper to get canonical test IDs as array
export function getCanonicalTestIds(examId?: string): string[] {
  const examConfig = getCurrentExam(examId);
  return Object.values(examConfig.canonicalTestIds);
}

// Helper to get year from test ID
export function getYearFromTestId(testId: string, examId?: string): number {
  const examConfig = getCurrentExam(examId);
  
  // Check current exam config first
  for (const [year, id] of Object.entries(examConfig.canonicalTestIds)) {
    if (id === testId) return Number(year);
  }
  
  // Fallback to defaults
  for (const [year, id] of Object.entries(CANONICAL_TEST_IDS)) {
    if (id === testId) return Number(year);
  }
  
  return 2020; // fallback
}
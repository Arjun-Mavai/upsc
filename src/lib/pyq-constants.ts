import { getCurrentExam } from '@/config/exams';

// ============================================
// CANONICAL TEST IDS - Verified from PROD DB
// For UPSC Civil Services Prelims 2020-2025
// ============================================

export const CANONICAL_TEST_IDS: Record<number, string> = {
  2020: 'hWIXnF5yTUhrPdpYAQUBP',
  2021: '9C03dS8AC3cTi1_veCJLv',
  2022: '6qqqSGCLbSKL99FpsZeO2',
  2023: 'YmGpGJ_XEMwRdO8mWbrer',
  2024: 'PS0pMCOO4gOtoUTCMV_HH',
  2025: '9YZzj61hPIg2AgtmQkE1e',
};

export const FREE_SUBJECTS = [
  // UPSC (Canonical)
  'History (Ancient, Medieval, Modern)', 
  'Geography (India & World)',
  // MPPSC (Legacy/Fallback)
  'History',
  'Geography'
];

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
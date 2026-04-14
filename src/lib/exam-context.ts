import { getCurrentExam, ExamConfig } from '@/config/exams';

// UPSC Zen — Dedicated platform for UPSC Civil Services preparation
// Subdomain: upsc.zenscroll.app

/**
 * getExamContext - Returns UPSC exam configuration
 * This is a UPSC-only repository.
 */
export async function getExamContext(): Promise<ExamConfig> {
  return getCurrentExam('upsc');
}

/**
 * Client-side helper - Always returns 'upsc'
 * (host parameter kept for API compatibility)
 */
export function getExamFromHost(_host?: string): string {
  return 'upsc';
}

/**
 * generateExamMetadata - UPSC-specific metadata generator
 */
export async function generateExamMetadata(): Promise<any> {
  const exam = await getExamContext();

  return {
    title: exam.title,
    description: exam.description,
    keywords: [
      'UPSC Prelims',
      'UPSC CSE 2026',
      'UPSC PYQ',
      'Civil Services',
      'IAS Preparation',
      'UPSC Zen',
    ],
    openGraph: {
      title: exam.title,
      description: exam.description,
      type: 'website',
      url: 'https://upsc.zenscroll.app',
    },
  };
}

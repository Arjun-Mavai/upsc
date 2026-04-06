'use client';

import { usePathname } from 'next/navigation';
import { QuizSubNav } from '@/features/syllabus/components/QuizSubNav';

export default function QuizLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPlayPage = pathname?.includes('/play');

  if (isPlayPage) {
    return <div className="relative min-h-screen bg-[#fafbfc]">{children}</div>;
  }

  // Pages where nav should be hidden (PYQ sub-pages)
  const HIDDEN_NAV_PATHS = [
    '/syllabus/quiz/pyq/intelligence',
    '/syllabus/quiz/pyq/facts',
    '/syllabus/quiz/pyq/analysis',
    '/syllabus/quiz/pyq/repeated',
    '/syllabus/quiz/pyq/question',
  ];

  const shouldHideNav = HIDDEN_NAV_PATHS.some(path => pathname?.startsWith(path));

  return (
    <div className="relative min-h-screen bg-[#fafbfc]">
      {/* 
        Shared Sticky Header for Desktop
      */}
      {/* Navigation hidden per user request */}

      {children}
    </div>
  );
}

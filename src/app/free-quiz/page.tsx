import { Suspense } from 'react';
import { getCachedFreeQuizzes } from './actions';
import FreeQuizClient from './FreeQuizClient';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🆓 FREE QUIZ PAGE — Public landing for lead generation
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const metadata = {
  title: 'Free Daily Quiz — UPSC 2026 Practice',
  description:
    'UPSC 2026 ke liye free daily quizzes. Hindi & English me practice karo — History, Geography, Polity, Science aur sabhi units.',
};

export default async function FreeQuizPage() {
  return (
    <Suspense fallback={<FreeQuizSkeleton />}>
      <FreeQuizData />
    </Suspense>
  );
}

// Server data fetcher — tests DB se laao
async function FreeQuizData() {
  const quizzes = await getCachedFreeQuizzes();
  return <FreeQuizClient quizzes={quizzes} />;
}

// Loading skeleton — jab tak data load ho raha h
function FreeQuizSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 pt-24 pb-32">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="space-y-2 text-center">
          <div className="mx-auto h-8 w-64 animate-pulse rounded-xl bg-slate-200" />
          <div className="mx-auto h-4 w-96 animate-pulse rounded-lg bg-slate-100" />
        </div>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-white border border-slate-100" />
        ))}
      </div>
    </div>
  );
}

import { getCachedPYQTests, getUserAttemptsByType } from '@/features/tests/actions/submission';
import { getSubjectWisePYQStats } from '@/features/tests/actions/pyq-analytics'; // Back to original
import PYQPageClient from './PYQPageClient';
import { verifyAuth } from '@/lib/auth';
import { getUserTier, hasAccessToContent } from '@/lib/access-control';
import { getCachedAttemptLimits } from '@/app/admin/test-access/actions';
import { Suspense } from 'react';
import { QuizListSkeleton } from '@/components/QuizListSkeleton';
import { getExamContext, generateExamMetadata } from '@/lib/exam-context';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const exam = await getExamContext();
  const base = await generateExamMetadata();
  return {
    ...base,
    title: `Solved PYQs | ${exam.title}`,
    description: `Access solved ${exam.id.toUpperCase()} Previous Year Questions with expert explanations and theme-based analysis.`,
  };
}

export default async function PYQPage({ 
  searchParams 
}: { 
  searchParams?: Promise<{ mode?: string }> 
}) {
  const params = searchParams ? await searchParams : {};
  
  return (
    <div className="relative min-h-screen bg-[#fafbfc] pb-20 font-sans">
      <Suspense fallback={<QuizListFallback />}>
        <PYQPageData mode={params.mode} />
      </Suspense>
    </div>
  );
}

function QuizListFallback() {
  return (
    <div className="relative z-10 mx-auto max-w-5xl px-6 pt-32">
      <div className="mb-12 space-y-2 text-center">
        <div className="mx-auto mb-4 h-12 w-64 animate-pulse rounded-xl bg-slate-200" />
        <div className="mx-auto h-4 w-96 animate-pulse rounded-lg bg-slate-100" />
      </div>
      <QuizListSkeleton />
    </div>
  );
}

async function PYQPageData({ mode }: { mode?: string }) {
  const userPromise = verifyAuth();
  const exam = await getExamContext();

  const [user, tests, attemptLimits, attempts, subjectStats] = await Promise.all([
    userPromise,
    getCachedPYQTests(exam.id),
    getCachedAttemptLimits(),
    (async () => {
      const resolvedUser = await userPromise;
      const userId = resolvedUser?.id;
      return userId ? getUserAttemptsByType('PYQ', userId, exam.id) : ({} as Record<string, number>);
    })(),
    getSubjectWisePYQStats(exam.id), // Back to original working function
  ]);

  const tier = getUserTier(user);
  const maxRetries = attemptLimits['PYQ'] ?? null;

  const hasProAccess =
    user?.role === 'admin' ||
    hasAccessToContent(
      {
        isFreeAccess: false,
        isLiteAccess: false,
        isProAccess: true,
      },
      user
    );

  const enrichedTests = tests.map((test: typeof tests[0]) => {
    const hasAccess =
      user?.role === 'admin' ||
      hasAccessToContent(
        {
          isFreeAccess: test.isFreeAccess,
          isLiteAccess: test.isLiteAccess,
          isProAccess: test.isProAccess,
        },
        user
      );
    const attemptsCount = attempts[test.id] || 0;
    const attemptsLeft = maxRetries != null ? Math.max(0, maxRetries - attemptsCount) : null;

    return {
      ...test,
      type: test.type,
      questions: test.totalQuestions ?? 0,
      totalQuestions: test.totalQuestions ?? 0,
      isLocked: !hasAccess && !(test.isFreeAccess ?? false),
      isFree: (test.isFreeAccess ?? false) && !user,
      attemptsLeft: user && attemptsLeft != null ? attemptsLeft : undefined,
      maxRetries: user ? maxRetries : null,
      year: test.year ? parseInt(test.year) : undefined,
    };
  });

  return <PYQPageClient initialTests={enrichedTests} subjectStats={subjectStats} isLoggedIn={!!user} mode={mode} isPro={hasProAccess} />;
}

import { getCachedFLTTests, getUserAttemptsByType } from '@/features/tests/actions/submission';
import FLTPageClient, { TestWithAccess } from './FLTPageClient';
import { verifyAuth } from '@/lib/auth';
import { getUserTier, hasAccessToContent } from '@/lib/access-control';
import { getCachedAttemptLimits } from '@/app/admin/test-access/actions';
import { Suspense } from 'react';
import { PYQFactsLoader } from '@/components/ui/PYQFactsLoader';

export default async function FLTPage() {
  return (
    <div className="relative min-h-screen bg-[#fafbfc] pb-20 font-sans">
      <Suspense fallback={<PYQFactsLoader label="Loading Full Length Tests..." theme="dark" />}>
        <FLTPageData />
      </Suspense>
    </div>
  );
}

async function FLTPageData() {
  const userPromise = verifyAuth();
  const [user, tests, attemptLimits, attempts] = await Promise.all([
    userPromise,
    getCachedFLTTests(),
    getCachedAttemptLimits(),
    (async () => {
      const resolvedUser = await userPromise;
      const userId = resolvedUser?.id;
      return userId ? getUserAttemptsByType('FLT', userId) : ({} as Record<string, number>);
    })(),
  ]);

  const tier = getUserTier(user);
  const maxRetries = attemptLimits['FLT'] ?? null;

  const enrichedTests: TestWithAccess[] = tests.map((test) => {
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
    const isLocked = !hasAccess;
    const attemptsCount = attempts[test.id] || 0;
    const attemptsLeft = maxRetries != null ? Math.max(0, maxRetries - attemptsCount) : null;

    return {
      ...test,
      totalQuestions: test.totalQuestions || 0,
      isLocked: isLocked && !(test.isFreeAccess ?? false),
      isCompleted: attemptsLeft === 0,
      attemptsCount,
      attemptsLeft: user ? (attemptsLeft ?? 9999) : null,
      maxRetries: user ? maxRetries : null,
      isFree: (test.isFreeAccess ?? false) && !user,
    };
  });

  return <FLTPageClient tests={enrichedTests} />;
}

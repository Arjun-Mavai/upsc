import { getCachedCSATTests, getUserAttemptsByType } from '@/features/tests/actions/submission';
import CSATPageClient from './CSATPageClient';
import { verifyAuth } from '@/lib/auth';
import { getUserTier, hasAccessToContent } from '@/lib/access-control';
import { getCachedAttemptLimits } from '@/app/admin/test-access/actions';
import { Suspense } from 'react';
import { PYQFactsLoader } from '@/components/ui/PYQFactsLoader';

export default async function CSATPage() {
  return (
    <div className="relative min-h-screen bg-[#fafbfc] pb-20 font-sans">
      <Suspense fallback={<PYQFactsLoader label="Loading CSAT Tests..." theme="dark" />}>
        <CSATPageData />
      </Suspense>
    </div>
  );
}

async function CSATPageData() {
  const userPromise = verifyAuth();
  const [user, tests, attemptLimits, attempts] = await Promise.all([
    userPromise,
    getCachedCSATTests(),
    getCachedAttemptLimits(),
    (async () => {
      const resolvedUser = await userPromise;
      const userId = resolvedUser?.id;
      return userId ? getUserAttemptsByType('CSAT', userId) : ({} as Record<string, number>);
    })(),
  ]);

  const tier = getUserTier(user);
  const maxRetries = attemptLimits['CSAT'] ?? null;

  const enrichedTests = tests.map((test: any) => {
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
      isLocked: !hasAccess && !(test.isFreeAccess ?? false),
      isFree: (test.isFreeAccess ?? false) && !user,
      attemptsLeft: user ? attemptsLeft : null,
      maxRetries: user ? maxRetries : null,
    };
  });

  return <CSATPageClient initialTests={enrichedTests} />;
}

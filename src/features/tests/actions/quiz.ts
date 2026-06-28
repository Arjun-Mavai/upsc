'use server';

import { db } from '@/db';
import { tests, userAttempts } from '@/db/schema';
import { eq, and, sql, inArray, asc } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';
import { verifyAuth } from '@/lib/auth';
import { getCachedAttemptLimits } from '@/app/admin/test-access/actions';

// Same pattern as getCachedFLTTests — 60s revalidate, tag 'tests'
const getCachedUnitTests = unstable_cache(
  async () => {
    return await db
      .select()
      .from(tests)
      .where(and(eq(tests.type, 'UNIT'), eq(tests.isHidden, false)))
      .orderBy(asc(tests.displayOrder));
  },
  ['unit-tests-list'],
  { revalidate: 60, tags: ['tests'] }
);

export async function getAvailableUnitTests() {
  const [user, allUnitTests, attemptLimits] = await Promise.all([
    verifyAuth(),
    getCachedUnitTests(),
    getCachedAttemptLimits(),
  ]);

  if (allUnitTests.length === 0) return [];

  const maxRetries = attemptLimits['UNIT'] ?? null;
  let attemptsMap = new Map<string, number>();

  // If user exists, fetch their attempts
  if (user) {
    const testIds = allUnitTests.map((t: typeof tests.$inferSelect) => t.id);

    const attempts = await db
      .select({
        testId: userAttempts.testId,
        count: sql<number>`count(*)`,
      })
      .from(userAttempts)
      .where(and(eq(userAttempts.userId, user.id), inArray(userAttempts.testId, testIds)))
      .groupBy(userAttempts.testId);

    attemptsMap = new Map(attempts.map((a) => [a.testId, Number(a.count)]));
  }

  return allUnitTests.map((test: typeof tests.$inferSelect) => {
    const attemptsCount = attemptsMap.get(test.id) || 0;
    const attemptsLeft = maxRetries != null ? Math.max(0, maxRetries - attemptsCount) : null;

    return {
      ...test,
      attempts: attemptsCount,
      attemptsLeft: user ? attemptsLeft : null,
      maxRetries: maxRetries,
      isFree: (test.isFreeAccess ?? false) && !user,
      isFreeAccess: !!test.isFreeAccess,
      isLiteAccess: !!test.isLiteAccess,
      isProAccess: test.isProAccess !== false,
    };
  });
}

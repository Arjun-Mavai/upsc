'use server';

import { db } from '@/db';
import { tests } from '@/db/schema';
import { like, and, eq } from 'drizzle-orm';
import { verifyAuth } from '@/lib/auth';
import { canAccessTest } from '@/lib/access-control';
import { unstable_cache } from 'next/cache';
import { logger } from '@/lib/logger';

export interface PartAccessStatus {
  isLocked: boolean;
  slug: string;
  testId?: string;
  isFree?: boolean;
}

const ALLOWED_SUBJECTS = [
  'mp gk',
  'history',
  'geography',
  'polity',
  'economy',
  'science',
  'ict',
  'current affairs',
  'environment',
  'misc',
];

// Cache the part tests fetch - this is static data
const getCachedSubjectPartTests = unstable_cache(
  async (subject: string) => {
    const subjectSlug = subject.toLowerCase().replace(/\s+/g, '-');
    const pattern = `pyq-${subjectSlug}-part-%`;

    return await db
      .select()
      .from(tests)
      .where(and(eq(tests.type, 'PYQ'), like(tests.slug, pattern)));
  },
  ['subject-part-tests'],
  { revalidate: 300, tags: ['tests'] }
);

export async function getSubjectPartAccess(subject: string) {
  if (!ALLOWED_SUBJECTS.includes(subject.toLowerCase())) {
    return {};
  }

  // Parallelize: Fetch user and cached tests simultaneously
  const [user, partTests] = await Promise.all([
    verifyAuth(),
    getCachedSubjectPartTests(subject)
  ]);

  // Build access map with parallel access checks
  const accessChecks = partTests.map(async (test: typeof partTests[0]) => {
    const parts = test.slug.split('-');
    const partNum = parseInt(parts[parts.length - 1]);

    if (isNaN(partNum)) return null;

    try {
      const hasAccess = await canAccessTest(test, user ?? null);
      return {
        partNum,
        status: {
          isLocked: !hasAccess,
          slug: test.slug,
          testId: test.id,
          isFree: test.isFreeAccess || false,
        } as PartAccessStatus
      };
    } catch (error) {
      logger.warn('Failed to evaluate PYQ part access', {
        category: 'auth',
        metadata: {
          testId: test.id,
          slug: test.slug,
          subject,
          error: error instanceof Error ? error.message : String(error),
        },
      });
      return null;
    }
  });

  const results = await Promise.all(accessChecks);
  
  const accessMap: Record<number, PartAccessStatus> = {};
  for (const result of results) {
    if (result) {
      accessMap[result.partNum] = result.status;
    }
  }

  return accessMap;
}

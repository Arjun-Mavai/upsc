import { unstable_cache } from 'next/cache';
import { revalidateTag } from 'next/cache';

export const REVALIDATE_TIME = 60 * 60 * 24 * 7; // 7 Days (Default Long Cache)
export const SHORT_CACHE = 60 * 60; // 1 Hour (for frequently updated content)

// Centralized Cache System
// Usage:
// - Fetching: use CACHE.BLOGS.GET_ALL.tags
// - Invalidating: revalidateTag(CACHE.BLOGS.TAGS.ALL)

export const CACHE = {
  BLOGS: {
    TAGS: {
      ALL: 'blogs-list',
      DETAIL: (slug: string) => `blog-${slug}`,
    },
    GET_ALL: {
      tags: ['blogs-list'],
      revalidate: SHORT_CACHE, // 1 hour for blogs
    },
    GET_BY_SLUG: (slug: string) => ({
      tags: [`blog-${slug}`],
      revalidate: SHORT_CACHE, // 1 hour for blog details
    }),
  },
  SYLLABUS: {
    TAGS: {
      ALL: 'syllabus-topics',
      UNIT: (unitId: string) => `syllabus-unit-${unitId}`,
    },
    GET_ALL: {
      tags: ['syllabus-topics'],
      revalidate: REVALIDATE_TIME,
    },
  },
  TESTS: {
    TAGS: {
      ALL: 'tests-list',
      DETAIL: (id: string) => `test-${id}`,
      BY_TOPIC: (topicId: string) => `tests-topic-${topicId}`,
    },
    GET_ALL: {
      tags: ['tests-list'],
      revalidate: SHORT_CACHE, // 1 hour for tests
    },
  },
  ATTEMPT_LIMITS: {
    TAGS: {
      ALL: 'attempt-limits',
    },
    GET_ALL: {
      tags: ['attempt-limits'],
      revalidate: REVALIDATE_TIME,
    },
  },
  PYQ: {
    TAGS: {
      ALL: 'mains-pyq-papers-list',
    },
  },
  MAINS: {
    TAGS: {
      ALL: 'mains-all-topics',
      UNIT: (unitId: string) => `mains-unit-${unitId}`,
      PAPER: (paperNumber: number) => `mains-paper-${paperNumber}`,
      TOPIC: (topicId: string) => `mains-topic-${topicId}`,
    },
  },
};

// Generic cache wrapper
export const cachedData = <T, Args extends any[]>(
  fetcher: (...args: Args) => Promise<T>,
  keys: string[],
  tags: string[],
  revalidate: number = REVALIDATE_TIME
) => {
  return unstable_cache(fetcher, keys, {
    revalidate: revalidate,
    tags: tags,
  });
};

export async function revalidatePyqOnUpload(paperNumber?: number) {
  revalidateTag(CACHE.PYQ.TAGS.ALL, { expire: 0 });
  revalidateTag('mains-pyq-paper',{expire:0});
  if (paperNumber !== undefined) {
    revalidateTag(`mains-pyq-paper-${paperNumber}`, { expire: 0 });
  }
}

export async function revalidateMainsOnUpload(paperNumber?: number, unitId?: string, topicId?: string) {
  revalidateTag(CACHE.MAINS.TAGS.ALL, { expire: 0 });
  if (paperNumber !== undefined) {
    revalidateTag(CACHE.MAINS.TAGS.PAPER(paperNumber), { expire: 0 });
  }
  if (unitId !== undefined) {
    revalidateTag(CACHE.MAINS.TAGS.UNIT(unitId), { expire: 0 });
  }
  if (topicId !== undefined) {
    revalidateTag(CACHE.MAINS.TAGS.TOPIC(topicId), { expire: 0 });
  }
}

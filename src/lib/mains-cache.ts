'use server';

/**
 * Mains Content Caching Layer
 * Optimizes data fetching for mains topics, concepts, and model answers
 * Uses Next.js Tag-based caching with on-demand revalidation
 */

import { unstable_cache } from 'next/cache';
import { CACHE, revalidateMainsOnUpload } from '@/lib/cache';
import { db } from '@/db';
import { mainsTopics, mainsUnits, mainsPapers } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Cached: Get all mains topics (for syllabus hub)
 * - Long-lived cache (24h)
 * - Revalidated on-demand when topics are uploaded/updated
 */
export const getCachedMainsTopics = unstable_cache(
  async () => {
    return db.query.mainsTopics.findMany({
      with: { unit: { with: { paper: true } } },
    });
  },
  ['mains-all-topics'],
  {
    tags: [CACHE.MAINS.TAGS.ALL],
    revalidate: 60 * 60 * 24, // 24 hours
  }
);

/**
 * Cached: Get topics by unit
 * - Long-lived cache (24h)
 * - Tagged by unit for granular revalidation
 */
export const getCachedMainsTopicsByUnit = (unitId: string) =>
  unstable_cache(
    async () => {
      return db.query.mainsTopics.findMany({
        where: eq(mainsTopics.unitId, unitId),
        with: { unit: { with: { paper: true } } },
      });
    },
    [`mains-unit-${unitId}`],
    {
      tags: [CACHE.MAINS.TAGS.UNIT(unitId), CACHE.MAINS.TAGS.ALL],
      revalidate: 60 * 60 * 24, // 24 hours
    }
  );

/**
 * Cached: Get topics by paper
 * - Long-lived cache (24h)
 * - Tagged by paper for granular revalidation
 */
export const getCachedMainsTopicsByPaper = (paperNumber: number) =>
  unstable_cache(
    async () => {
      const rows = await db
        .select({
          topic: mainsTopics,
        })
        .from(mainsTopics)
        .innerJoin(mainsUnits, eq(mainsTopics.unitId, mainsUnits.id))
        .innerJoin(mainsPapers, eq(mainsUnits.paperId, mainsPapers.id))
        .where(eq(mainsPapers.paperNumber, paperNumber));

      return rows.map((row) => row.topic);
    },
    [`mains-paper-${paperNumber}`],
    {
      tags: [CACHE.MAINS.TAGS.PAPER(paperNumber), CACHE.MAINS.TAGS.ALL],
      revalidate: 60 * 60 * 24, // 24 hours
    }
  );

/**
 * Cached: Get single topic with full content
 * - Long-lived cache (24h)
 * - Tagged by topic ID for precise revalidation
 */
export const getCachedMainsTopic = (topicId: string) =>
  unstable_cache(
    async () => {
      return db.query.mainsTopics.findFirst({
        where: eq(mainsTopics.id, topicId),
        with: { unit: { with: { paper: true } } },
      });
    },
    [`mains-topic-${topicId}`],
    {
      tags: [CACHE.MAINS.TAGS.TOPIC(topicId), CACHE.MAINS.TAGS.ALL],
      revalidate: 60 * 60 * 24, // 24 hours
    }
  );

/**
 * Export revalidation function for admin upload actions
 * Call this after uploading new mains topics/concepts
 */
export { revalidateMainsOnUpload };

'use server';

/**
 * PYQ Library Caching Layer
 * Optimizes data fetching for PYQ questions, answers, and variants
 * Uses Next.js Tag-based caching with on-demand revalidation
 */

import { unstable_cache } from 'next/cache';
import { CACHE, revalidatePyqOnUpload } from '@/lib/cache';
import {
  getMainsPyqPaperPublic,
  listMainsPyqPapersLibrarySummary,
  adminGetPyqPaperPrepDetail,
} from '@/actions/mains-pyq-prepared-actions';

/**
 * Cached: Get a single PYQ paper with all questions and variants
 * - Long-lived cache (24h)
 * - Revalidated on-demand when paper answers are uploaded
 */
export const getCachedPyqPaperPublic = (pyqPaperId: string) =>
  unstable_cache(
    async () => getMainsPyqPaperPublic(pyqPaperId),
    ['pyq-paper-public', pyqPaperId],
    {
      tags: [CACHE.PYQ.TAGS.ALL],
      revalidate: 60 * 60 * 24, // 24 hours
    }
  );

/**
 * Cached: List all PYQ papers (library summary)
 * - Long-lived cache (24h)
 * - Revalidated on-demand when new papers are added/removed
 * - This is the CRITICAL cache for the library page
 */
export const getCachedPyqLibrarySummary = unstable_cache(
  async () => listMainsPyqPapersLibrarySummary(),
  ['pyq-library-summary'],
  {
    tags: [CACHE.PYQ.TAGS.ALL],
    revalidate: 60 * 60 * 24, // 24 hours
  }
);

/**
 * Cached: Get PYQ paper details for admin
 * - Moderate cache (3h) for admin views
 * - More frequently updated than public view
 */
export const getCachedPyqPaperAdminDetail = (pyqPaperId: string) =>
  unstable_cache(
    async () => adminGetPyqPaperPrepDetail(pyqPaperId),
    ['pyq-paper-admin', pyqPaperId],
    {
      tags: [CACHE.PYQ.TAGS.ALL],
      revalidate: 60 * 60 * 3, // 3 hours for admin
    }
  );

/**
 * Export revalidation function for admin upload actions
 * Call this after uploading new PYQ answers/variants
 */
export { revalidatePyqOnUpload };

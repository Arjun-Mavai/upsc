import { db } from '@/db';
import { contentBlogs } from '@/db/schema';
import { eq, desc, and, count, sql } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { CACHE, cachedData } from '@/lib/cache';

/**
 * getBlogCounts — Fetch counts of blogs per unit with caching
 * Zero impact on performance due to server-side caching
 */
export const getBlogCounts = cachedData(
  async (examType: string = 'upsc') => {
    try {
      // Base condition for UPSC domain filtering
      const baseConditions = [
        eq(contentBlogs.isPublished, true), 
        eq(contentBlogs.isHidden, false)
      ];
      
      // Add exam type filtering
      if (examType !== 'all') {
        baseConditions.push(
          sql`(${contentBlogs.examType} = ${examType} OR ${contentBlogs.examType} = 'all')`
        );
      }

      // Get counts grouped by category (subjects) - UPSC doesn't use unit-wise filtering
      const categoryCounts = await db
        .select({
          category: contentBlogs.category,
          count: count(),
        })
        .from(contentBlogs)
        .where(and(...baseConditions))
        .groupBy(contentBlogs.category);

      // Get count for Free articles
      const freeResult = await db
        .select({ count: count() })
        .from(contentBlogs)
        .where(
          and(...baseConditions, eq(contentBlogs.isFreeAccess, true))
        );

      const countsMap: Record<string, number> = {};
      const categoryCountsMap: Record<string, number> = {};

      categoryCounts.forEach((row) => {
        if (row.category) {
          categoryCountsMap[row.category] = row.count;
        }
      });

      // Simple sum of all published and non-hidden blogs
      const allResult = await db
        .select({ count: count() })
        .from(contentBlogs)
        .where(and(eq(contentBlogs.isPublished, true), eq(contentBlogs.isHidden, false)));

      countsMap['All'] = allResult[0]?.count || 0;
      countsMap['Free'] = freeResult[0]?.count || 0;

      return { units: countsMap, categories: categoryCountsMap };
    } catch (error) {
      logger.error('Get Blog Counts Error:', error);
      return { units: { All: 0, Free: 0 }, categories: {} };
    }
  },
  ['blog-counts-meta'],
  CACHE.BLOGS.GET_ALL.tags, // Busts when blogs change
  CACHE.BLOGS.GET_ALL.revalidate
);

/**
 * getCachedBlogs — unstable_cache se wrapped, 1 hour cache
 * Used for generateStaticParams to fetch ALL blogs
 */
export const getCachedBlogs = cachedData(
  async () => {
    try {
      return await db
        .select()
        .from(contentBlogs)
        .where(and(eq(contentBlogs.isPublished, true), eq(contentBlogs.isHidden, false)))
        .orderBy(desc(contentBlogs.createdAt));
    } catch (error) {
      logger.error('Get Blogs Error:', error);
      return [];
    }
  },
  ['blogs-list'],
  CACHE.BLOGS.GET_ALL.tags,
  CACHE.BLOGS.GET_ALL.revalidate
);

export async function getBlogs({
  page = 1,
  limit = 10,
  search = '',
  category = 'All',
  isPremium = undefined, // undefined = all, true = premium, false = free
  isFreeAccess = undefined,
  examType = 'upsc', // UPSC-only repo
  isAdmin = false,
}: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  isPremium?: boolean;
  isFreeAccess?: boolean;
  examType?: string;
  isAdmin?: boolean;
} = {}) {
  try {
    const offset = (page - 1) * limit;

    // Build Where Clause
    const whereConditions = [];

    // Filter by Published & Hidden (user view only)
    if (!isAdmin) {
      whereConditions.push(eq(contentBlogs.isPublished, true));
      whereConditions.push(eq(contentBlogs.isHidden, false));
    }

    // Filter by Category (Subject) - UPSC doesn't use unit-wise filtering
    if (category && category !== 'All') {
      whereConditions.push(eq(contentBlogs.category, category));
    }

    // Filter by Search
    if (search) {
      whereConditions.push(
        sql`(${contentBlogs.title} LIKE ${`%${search}%`} OR ${contentBlogs.description} LIKE ${`%${search}%`})`
      );
    }

    // Filter by Premium Status (if specified)
    if (isPremium !== undefined) {
      whereConditions.push(eq(contentBlogs.isPremium, isPremium));
    }

    // Filter by Free Access (if specified)
    if (isFreeAccess !== undefined) {
      whereConditions.push(eq(contentBlogs.isFreeAccess, isFreeAccess));
    }

    // Filter by Exam Type (UPSC/MPPSC segregation)
    if (examType && examType !== 'all') {
      whereConditions.push(
        sql`(${contentBlogs.examType} = ${examType} OR ${contentBlogs.examType} = 'all')`
      );
    }

    const whereClause = and(...whereConditions);

    // Fetch Data
    const blogs = await db
      .select()
      .from(contentBlogs)
      .where(whereClause)
      .orderBy(desc(contentBlogs.createdAt))
      .limit(limit)
      .offset(offset);

    // Fetch Total Count (for pagination math)
    const totalResult = await db.select({ count: count() }).from(contentBlogs).where(whereClause);

    const total = totalResult[0]?.count || 0;
    const hasMore = offset + blogs.length < total;

    return {
      blogs,
      pagination: {
        page,
        limit,
        total,
        hasMore,
      },
    };
  } catch (error) {
    logger.error('Get Blogs Error:', error);
    return {
      blogs: [],
      pagination: { page: 1, limit: 10, total: 0, hasMore: false },
    };
  }
}

/**
 * getBlogBySlug — slug se specific blog fetch, 1 hour cached
 * revalidateTag('blog-{slug}') se on-demand bust hoga
 */
export const getBlogBySlug = async (slug: string) => {
  const { revalidate, tags } = CACHE.BLOGS.GET_BY_SLUG(slug);
  return await cachedData(
    async () => {
      try {
        return (
          (await db
            .select()
            .from(contentBlogs)
            .where(
              and(
                eq(contentBlogs.slug, slug),
                eq(contentBlogs.isPublished, true),
                eq(contentBlogs.isHidden, false)
              )
            )
            .get()) ?? null
        );
      } catch (error) {
        logger.error('Get Blog Error:', error);
        return null;
      }
    },
    [`blog-${slug}`],
    tags,
    revalidate
  )();
};

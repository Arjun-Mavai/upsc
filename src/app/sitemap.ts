import { MetadataRoute } from 'next';
import { db } from '@/db';
import { contentBlogs } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * 🗺️ SITEMAP — UPSC Zen
 * Pages indexed for Google search — upsc.zenscroll.app
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://upsc.zenscroll.app';

  // Static pages — core SEO backbone
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/syllabus/quiz/pyq`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.95, // "UPSC PYQ" search
    },
    {
      url: `${baseUrl}/syllabus/quiz/pyq/intelligence`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blogs`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
  ];

  try {
    // Blog pages — organic traffic driver
    const allBlogs = await db
      .select({
        slug: contentBlogs.slug,
        updatedAt: contentBlogs.updatedAt,
      })
      .from(contentBlogs)
      .where(eq(contentBlogs.isPublished, true));

    const blogPages: MetadataRoute.Sitemap = allBlogs.map((blog) => ({
      url: `${baseUrl}/blogs/${blog.slug}`,
      lastModified: blog.updatedAt || new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

    return [...staticPages, ...blogPages];
  } catch (error) {
    console.error('❌ Sitemap generation failed:', error);
    return staticPages;
  }
}

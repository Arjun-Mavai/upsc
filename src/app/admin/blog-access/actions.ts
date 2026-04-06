'use server';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎛️ BLOG ACCESS ACTIONS — Admin se blog access flags toggle karo
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// Same pattern as test-access/topic-access
// Toggle DB flags → cache bust → fresh data
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { db } from '@/db';
import { contentBlogs } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { revalidateTag, revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth-admin';
import { logger } from '@/lib/logger';
import { CACHE } from '@/lib/cache';

/**
 * getAllBlogsForAdmin — Sab blogs fetch with access flags
 * No cache — admin ko fresh data chahiye
 */
export async function getAllBlogsForAdmin() {
  await requireAdmin();

  const allBlogs = await db
    .select({
      id: contentBlogs.id,
      slug: contentBlogs.slug,
      title: contentBlogs.title,
      category: contentBlogs.category,
      examType: contentBlogs.examType,
      unitId: contentBlogs.unitId,
      isPremium: contentBlogs.isPremium,
      isFreeAccess: contentBlogs.isFreeAccess,
      isLiteAccess: contentBlogs.isLiteAccess,
      isProAccess: contentBlogs.isProAccess,
      isPublished: contentBlogs.isPublished,
      isHidden: contentBlogs.isHidden,
      createdAt: contentBlogs.createdAt,
    })
    .from(contentBlogs)
    .orderBy(contentBlogs.createdAt);

  return allBlogs;
}

/**
 * toggleBlogAccess — Single blog ka ek flag toggle karo
 *
 * Legacy isPremium bhi sync me rakhta h:
 * - isFreeAccess = true → isPremium = false (kyuki free hai)
 * - isFreeAccess = false + isLiteAccess = false → isPremium = true
 */
export async function toggleBlogAccess(
  blogId: string,
  field: 'isFreeAccess' | 'isLiteAccess' | 'isProAccess',
  value: boolean
) {
  await requireAdmin();

  // Update the specific field
  await db
    .update(contentBlogs)
    .set({ [field]: value, updatedAt: new Date() })
    .where(eq(contentBlogs.id, blogId));

  // Sync legacy isPremium — agar free hai to premium false
  if (field === 'isFreeAccess' && value === true) {
    await db.update(contentBlogs).set({ isPremium: false }).where(eq(contentBlogs.id, blogId));
  }

  // Cache bust — blog pages re-fetch honge
  revalidateTag(CACHE.BLOGS.TAGS.ALL, { expire: 0 });
  revalidatePath('/blogs');

  // Blog slug bhi bust karo
  const blog = await db
    .select({ slug: contentBlogs.slug })
    .from(contentBlogs)
    .where(eq(contentBlogs.id, blogId))
    .get();
  if (blog) {
    revalidateTag(CACHE.BLOGS.TAGS.DETAIL(blog.slug), { expire: 0 });
  }

  logger.info(`Blog access updated: ${blogId} → ${field}=${value}`);

  return { success: true };
}

/**
 * bulkUpdateBlogAccess — Unit/category wise blog access set karo
 * unitId = 'all' → sab blogs update
 * unitId = 'unit_1' → sirf us unit ke blogs
 * unitId = 'no_unit' → unassigned blogs (unitId null)
 */
export async function bulkUpdateBlogAccess(
  field: 'isFreeAccess' | 'isLiteAccess' | 'isProAccess',
  value: boolean,
  unitId?: string
) {
  await requireAdmin();

  if (unitId && unitId !== 'all') {
    if (unitId === 'no_unit') {
      // Blogs without unitId
      await db
        .update(contentBlogs)
        .set({ [field]: value, updatedAt: new Date() })
        .where(sql`${contentBlogs.unitId} IS NULL`);
    } else {
      await db
        .update(contentBlogs)
        .set({ [field]: value, updatedAt: new Date() })
        .where(eq(contentBlogs.unitId, unitId));
    }
  } else {
    // All blogs
    await db.update(contentBlogs).set({ [field]: value, updatedAt: new Date() });
  }

  revalidateTag(CACHE.BLOGS.TAGS.ALL, { expire: 0 });
  revalidatePath('/blogs');

  logger.info(`Bulk blog access: ${unitId || 'all'} → ${field}=${value}`);

  return { success: true };
}

/**
 * toggleBlogHidden — Blog ko hide/unhide karo
 * Hidden blogs user ko nahi dikhenge
 */
export async function toggleBlogHidden(blogId: string, isHidden: boolean) {
  await requireAdmin();

  await db
    .update(contentBlogs)
    .set({ isHidden, updatedAt: new Date() })
    .where(eq(contentBlogs.id, blogId));

  revalidateTag(CACHE.BLOGS.TAGS.ALL, { expire: 0 });
  revalidatePath('/blogs');

  const blog = await db
    .select({ slug: contentBlogs.slug })
    .from(contentBlogs)
    .where(eq(contentBlogs.id, blogId))
    .get();
  if (blog) {
    revalidateTag(CACHE.BLOGS.TAGS.DETAIL(blog.slug), { expire: 0 });
  }

  logger.info(`Blog hidden toggled: ${blogId} → isHidden=${isHidden}`);
  return { success: true };
}

/**
 * getBlogById — Edit ke liye poora blog data fetch karo
 * ID se blog dhundho → imageUrl + content JSON return karo
 */
export async function getBlogById(blogId: string) {
  await requireAdmin();

  const blog = await db
    .select({
      id: contentBlogs.id,
      slug: contentBlogs.slug,
      title: contentBlogs.title,
      description: contentBlogs.description,
      excerpt: contentBlogs.excerpt,
      content: contentBlogs.content,
      category: contentBlogs.category,
      imageUrl: contentBlogs.imageUrl,
      readingTime: contentBlogs.readingTime,
      contentType: contentBlogs.contentType,
      unitId: contentBlogs.unitId,
      topicId: contentBlogs.topicId,
    })
    .from(contentBlogs)
    .where(eq(contentBlogs.id, blogId))
    .get();

  if (!blog) return { success: false as const, error: `Blog not found for id ${blogId}` };

  return { success: true as const, blog };
}

/**
 * updateBlog — Blog ko edit/update karo (image + content sab)
 * Pehle validate → phir DB update → cache bust
 * Content-manager jaisa hi flow — bas update h insert ki jagah
 */
export async function updateBlog(
  blogId: string,
  data: { imageUrl: string; contentJson: string }
) {
  await requireAdmin();

  try {
    const { imageUrl, contentJson } = data;
    const parsed = JSON.parse(contentJson);

    // Validate — metadata aur content dono chahiye
    if (!parsed.metadata || !parsed.content) {
      return { success: false, error: "Invalid JSON: 'metadata' aur 'content' dono chahiye bhai" };
    }

    const { metadata } = parsed;

    if (!metadata.title || !metadata.slug || !metadata.category) {
      return { success: false, error: 'Title, slug, ya category missing h bhai' };
    }

    // Legacy support: agar content array ya string hai, to usko single-language
    // blog maan kar hi/en dono me same assign kar do.
    let content: any = parsed.content;

    if (Array.isArray(parsed.content) || typeof parsed.content === 'string') {
      content = { hi: parsed.content, en: parsed.content };
    }

    if (!content || !content.hi || !content.en) {
      return { success: false, error: "Content me 'hi' aur 'en' dono keys chahiye" };
    }

    // Text extract karo excerpt/description generate karne ke liye
    // NOTE: 'content' variable ab local let hai, isliye 'extractTextIteratively'
    // ko move kiya ya update kiya taaki wo sahi scope se 'content' use kare
    const extractTextIteratively = (node: any): string => {
      if (!node) return '';
      if (typeof node === 'string') return node;
      if (Array.isArray(node)) {
        return node.map((item) => extractTextIteratively(item)).join(' ');
      }
      if (typeof node === 'object') {
        if (node.type === 'h2' || node.type === 'h3' || node.type === 'p') return node.text || '';
        if (node.type === 'ul' || node.type === 'ol')
          return Array.isArray(node.items) ? node.items.join(' ') : '';
        if (node.type === 'table')
          return Array.isArray(node.body)
            ? node.body.map((row: any[]) => row.join(' ')).join(' ')
            : '';
        if (node.type === 'fact_card') return node.facts ? node.facts.join(' ') : '';
        return node.text || node.title || node.description || '';
      }
      return '';
    };

    // Auto-generate excerpt — Hindi preferred, English fallback
    const blocksToProcess = content.hi && content.hi.length > 0 ? content.hi : content.en || [];
    let textContent = extractTextIteratively(blocksToProcess);
    textContent = textContent.replace(/\s+/g, ' ').trim();

    let description = metadata.description;
    if (!description || description.trim().length < 10) {
      let introText = textContent;
      const firstPara = blocksToProcess.find((b: any) => b.type === 'p');
      if (firstPara && firstPara.text) introText = firstPara.text;
      description = introText.substring(0, 300) + (introText.length > 300 ? '...' : '');
    }

    const excerpt =
      (description || textContent).substring(0, 160) +
      ((description || textContent).length > 160 ? '...' : '');

    // Pehle purana slug lo — cache bust ke liye
    const oldBlog = await db
      .select({ slug: contentBlogs.slug })
      .from(contentBlogs)
      .where(eq(contentBlogs.id, blogId))
      .get();

    if (!oldBlog) {
      return { success: false, error: `Blog not found for id ${blogId}` };
    }

    // DB update — full blog data overwrite
    await db
      .update(contentBlogs)
      .set({
        title: metadata.title,
        slug: metadata.slug,
        description: description || '',
        excerpt,
        category: metadata.category,
        imageUrl: imageUrl || null,
        readingTime:
          Number.isFinite(Number(metadata.readingTime)) && Number(metadata.readingTime) >= 0
            ? Number(metadata.readingTime)
            : 5,
        content,
        contentType: metadata.type || 'blog',
        unitId: metadata.unit || null,
        topicId: metadata.topic || null,
        updatedAt: new Date(),
      })
      .where(eq(contentBlogs.id, blogId));

    // Cache bust — purana slug + naya slug dono bust karo
    revalidateTag(CACHE.BLOGS.TAGS.ALL, { expire: 0 });
    revalidatePath('/blogs');
    if (oldBlog) {
      revalidateTag(CACHE.BLOGS.TAGS.DETAIL(oldBlog.slug), { expire: 0 });
    }
    if (metadata.slug !== oldBlog?.slug) {
      revalidateTag(CACHE.BLOGS.TAGS.DETAIL(metadata.slug), { expire: 0 });
    }

    logger.info(`Blog updated: ${blogId} → ${metadata.title}`);

    return { success: true };
  } catch (error: any) {
    logger.error('Update Blog Error:', error);
    if (error.code === 'SQLITE_CONSTRAINT') {
      return { success: false, error: 'Ye slug already kisi aur blog ka h bhai' };
    }
    return { success: false, error: error.message || 'Blog update fail ho gaya' };
  }
}

/**
 * deleteBlog — Blog ko permanent delete karo
 */
export async function deleteBlog(blogId: string) {
  await requireAdmin();

  try {
    // Slug fetch karo cache bust karne ke liye
    const blog = await db
      .select({ slug: contentBlogs.slug })
      .from(contentBlogs)
      .where(eq(contentBlogs.id, blogId))
      .get();

    await db.delete(contentBlogs).where(eq(contentBlogs.id, blogId));

    // Cache bust
    revalidateTag(CACHE.BLOGS.TAGS.ALL, { expire: 0 });
    revalidatePath('/blogs');
    if (blog) {
      revalidateTag(CACHE.BLOGS.TAGS.DETAIL(blog.slug), { expire: 0 });
    }

    logger.info(`Blog deleted: ${blogId}`);
    return { success: true };
  } catch (error: any) {
    logger.error('Delete Blog Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * updateBlogExamType — Blog ka exam type update karo
 */
export async function updateBlogExamType(blogId: string, examType: 'upsc' | 'mppsc' | 'all') {
  await requireAdmin();

  try {
    await db
      .update(contentBlogs)
      .set({ examType, updatedAt: new Date() })
      .where(eq(contentBlogs.id, blogId));

    // Cache bust
    revalidateTag(CACHE.BLOGS.TAGS.ALL, { expire: 0 });
    revalidatePath('/blogs');

    logger.info(`Blog exam type updated: ${blogId} → ${examType}`);
    return { success: true };
  } catch (error: any) {
    logger.error('Update Blog Exam Type Error:', error);
    return { success: false, error: error.message || 'Exam type update fail' };
  }
}

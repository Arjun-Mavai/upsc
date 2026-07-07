'use server';

/**
 * 🏛️ UPSC MAINS - SYLLABUS & CONTENT MANAGEMENT ACTIONS
 * 
 * Ye file UPSC Mains ke syllabus (Papers, Units, Topics) aur unke deep content (Concept, Model Answers)
 * ko manage karne ke liye hai. Ye saare actions Admin Dashboard ko power dete hain.
 * 
 * 📜 FILE OVERVIEW & FLOW:
 * 1. Admin UI se data aata hai (JSON ya form input).
 * 2. Ye file input validate karti hai (Zod schemas use karke) aur DB me save karti hai.
 * 3. Cache revalidate karti hai (`/admin/mains`) taaki naya data turant dikhe.
 * 
 * 🍔 THE CACHING RESTAURANT STORY (Dual Cache Burst):
 * - Database = Kitchen, UI/HTML = Waiter's Tray.
 * - getMainsSyllabusTree & getAllMainsPapersWithSyllabus (Data Queries) are wrapped in `unstable_cache`.
 * - Jab student page kholta hai, Data RAM (fridge) se 0ms me aata hai. Waiter turant serve karta hai.
 * - Jab admin data save/upload karta hai toh 2 bomb fat-te hain:
 *   1. revalidatePath('/mains/syllabus') -> Waiter ki tray ka purana HTML faik deta hai. (UI Cache Burst)
 *   2. revalidateTag('mains_syllabus', {expire:0}) -> Fridge ka purana data faik deta hai. (RAM/DB Cache Burst)
 * - Isse next click pe 0 seconds lagte hain aur hamesha fresh data milta hai!
 * 
 * 📑 FUNCTION INDEX (Timeline):
 * - `getMainsProgressOverview`: (Optimized) Pure syllabus ka progress dikhata hai (Kitne topics published hain).
 * - `getMainsDetailedProgressOverview`: Unit-wise aur Part-wise detailed progress dikhata hai.
 * - `upsertMainsPaper`: Naya paper add karne ya existing ko update karne ke liye.
 * - `upsertMainsUnit`: Unit level data manage karne ke liye.
 * - `upsertMainsTopic`: Topic level data manage karne ke liye.
 * - `upsertMainsContent`: AI-generated Deep Content (Concept + Model Answers) save karne ke liye.
 * - `getMainsTopicForPage`: Student side par single topic page render karne ke liye data fetch karta hai.
 * - `getTopicContentForAdmin`: Admin side par topic ka content edit karne ke liye fetch karta hai.
 */

import { db } from '@/db';
import { mainsPapers, mainsUnits, mainsTopics, mainsContent } from '@/db/schema';
import { eq, and, sql, count, asc, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache';
import { assertAdmin, verifyAuth } from '@/lib/auth';
import type { MainsUnitPart } from '@/lib/mains-syllabus-unit-label';
import { isMainsVaultUnlockedUser } from '@/lib/mains-vault-access';
import { logger } from '@/lib/logger';
import { z } from 'zod';

/** 📜 MAINS SCHEMAS
 * Bhai, ye schemas input validation ensure karenge.
 * Prod-ready code mein hamesha input validate karna chahiye.
 */
const MainsPaperSchema = z.object({
  id: z.string().uuid().optional(),
  paperNumber: z.number().min(1).max(6),
  titleHi: z.string().min(1),
  titleEn: z.string().min(1),
  totalMarks: z.number().default(300),
  durationMinutes: z.number().default(180),
  displayOrder: z.number().default(0),
  description: z.string().optional(),
});

const MainsUnitSchema = z.object({
  id: z.string().uuid().optional(),
  paperId: z.string().uuid(),
  part: z.enum(['A', 'B', 'NONE']).default('NONE'),
  unitNumber: z.number().min(1).max(10),
  titleHi: z.string().min(1),
  titleEn: z.string().min(1),
  displayOrder: z.number().default(0),
});

const MainsContentSchema = z.object({
  conceptHi: z.string().min(1),
  conceptEn: z.string().default(''),
  expertStrategyHi: z.string().optional().nullable(),
  expertStrategyEn: z.string().optional().nullable(),
  modelAnswers: z.record(z.string(), z.unknown()).default({}),
  keyTermsHi: z.string().optional().nullable(),
  keyTermsEn: z.string().optional().nullable(),
  practiceQuestions: z.unknown().optional().nullable(),
  richPayload: z.record(z.string(), z.unknown()).optional().nullable(),
  examType: z.enum(['upsc', 'mppsc', 'all', 'mppolice', 'upsc']).default('upsc'),
});

export type MainsPaperInput = z.infer<typeof MainsPaperSchema>;
export type MainsUnitInput = z.infer<typeof MainsUnitSchema>;
export type MainsContentInput = z.infer<typeof MainsContentSchema>;

function blobFromError(error: unknown): string {
  const base = error instanceof Error ? error.message : String(error);
  const cause =
    error &&
    typeof error === 'object' &&
    'cause' in error &&
    (error as { cause?: unknown }).cause != null
      ? String((error as { cause?: unknown }).cause)
      : '';
  return `${base} ${cause}`;
}

// 1. Get Progress Overview for Admin (optimized: 2 queries instead of 9)
/** 📊 Admin Dashboard ke liye pure syllabus ka progress fetch karta hai. */
export const getMainsProgressOverview = unstable_cache(
  async () => {
    try {
      const papers = await db.select().from(mainsPapers).orderBy(mainsPapers.displayOrder);
      
      // Single aggregated query: units + topics stats per paper
      const statsPerPaper = await db
        .select({
          paperId: mainsUnits.paperId,
          unitsCount: count(sql`DISTINCT ${mainsUnits.id}`),
          totalTopics: count(mainsTopics.id),
          publishedTopics: count(mainsContent.id),
        })
        .from(mainsUnits)
        .leftJoin(mainsTopics, eq(mainsTopics.unitId, mainsUnits.id))
        .leftJoin(mainsContent, eq(mainsContent.topicId, mainsTopics.id))
        .groupBy(mainsUnits.paperId);

      // Build lookup map for O(1) access
      const statsMap = new Map<string, typeof statsPerPaper[number]>(
        statsPerPaper
          .filter((s): s is typeof s & { paperId: string } => !!s.paperId)
          .map((s) => [s.paperId, s])
      );

      const overview = papers.map((paper) => {
        const stats = statsMap.get(paper.id) ?? { 
          unitsCount: 0, 
          totalTopics: 0, 
          publishedTopics: 0 
        };
        
        const totalTopics = Number(stats.totalTopics ?? 0);
        return {
          ...paper,
          unitsCount: Number(stats.unitsCount ?? 0),
          totalTopics,
          publishedTopics: Number(stats.publishedTopics ?? 0),
          progress: totalTopics > 0 
            ? Math.round((Number(stats.publishedTopics ?? 0) / totalTopics) * 100) 
            : 0
        };
      });

      return { success: true as const, data: overview };
    } catch (error) {
      console.error('Mains Overview Error:', error);
      const blob = blobFromError(error);
      if (/no such table:?\s*mains_/i.test(blob)) {
        return {
          success: false as const,
          error: 'mains_tables_missing' as const,
          hint:
            'Mains tables missing on this DB. Run: `npm run db:migrate` (local) or `USE_PROD_DB=true npm run db:migrate` (Turso URL in .env). One-shot: `npm run db:setup:mains:remote`.',
        };
      }
      return { success: false as const, error: 'Failed to fetch overview' as const, detail: blob.slice(0, 220) };
    }
  },
  ['mains-progress-overview-v1'],
  { tags: ['mains_syllabus'], revalidate: 604800 } // Cache 7 days, bursts on upload
);

/** 📊 DETAILED PROGRESS TRACKER (PART-WISE)
 * Bhai, ye action admin ko detailed breakdown dega:
 * Paper -> Part A/B -> Units -> Topics (Total vs Published) + Last Activity
 */
/** 📈 Unit-wise aur Part-wise detailed progress nikalta hai taaki pata chale kahan kitna kaam baaki hai. */
export async function getMainsDetailedProgressOverview() {
  try {
    await assertAdmin();
    const papers = await db.select().from(mainsPapers).orderBy(mainsPapers.displayOrder);

    // Fetch all parts and their stats
    const partStats = await db
      .select({
        paperId: mainsUnits.paperId,
        part: mainsUnits.part,
        unitNumber: mainsUnits.unitNumber,
        unitTitleEn: mainsUnits.titleEn,
        totalTopics: count(mainsTopics.id),
        publishedTopics: count(mainsContent.id),
        lastUpdated: sql<string | null>`max(${mainsContent.updatedAt})`,
      })
      .from(mainsUnits)
      .leftJoin(mainsTopics, eq(mainsTopics.unitId, mainsUnits.id))
      .leftJoin(mainsContent, eq(mainsContent.topicId, mainsTopics.id))
      .groupBy(mainsUnits.paperId, mainsUnits.part, mainsUnits.unitNumber, mainsUnits.titleEn);

    const detailedOverview = papers.map((paper) => {
      const paperUnits = partStats.filter((s) => s.paperId === paper.id);
      
      const units = paperUnits.map(u => ({
        part: u.part || 'NONE',
        unitNumber: Number(u.unitNumber ?? 0),
        unitTitleEn: u.unitTitleEn || 'Untitled',
        totalTopics: Number(u.totalTopics ?? 0),
        publishedTopics: Number(u.publishedTopics ?? 0),
        progress: Number(u.totalTopics ?? 0) > 0 
          ? Math.round((Number(u.publishedTopics ?? 0) / Number(u.totalTopics ?? 0)) * 100) 
          : 0,
        lastUpdated: u.lastUpdated ? new Date(u.lastUpdated) : null,
      })).sort((a, b) => {
        if (a.part !== b.part) return (a.part || '').localeCompare(b.part || '');
        return a.unitNumber - b.unitNumber;
      });

      const totalTopics = units.reduce((acc, u) => acc + u.totalTopics, 0);
      const totalPublished = units.reduce((acc, u) => acc + u.publishedTopics, 0);
      const lastUpdated = units.reduce((acc, u) => {
        if (!u.lastUpdated) return acc;
        if (!acc) return u.lastUpdated;
        return u.lastUpdated > acc ? u.lastUpdated : acc;
      }, null as Date | null);

      return {
        id: paper.id,
        paperNumber: paper.paperNumber,
        titleEn: paper.titleEn,
        titleHi: paper.titleHi,
        units,
        totalTopics,
        totalPublished,
        progress: totalTopics > 0 ? Math.round((totalPublished / totalTopics) * 100) : 0,
        lastUpdated,
      };
    });

    return { success: true as const, data: detailedOverview };
  } catch (error) {
    console.error('Detailed Progress Overview Error:', error);
    return { success: false as const, error: 'Failed to fetch detailed overview' };
  }
}

// 2. Add/Update Paper
/** 📄 Naya paper banane ya existing paper ki details (marks, duration) update karne ke liye. */
export async function upsertMainsPaper(rawInput: MainsPaperInput) {
  try {
    await assertAdmin();
    const data = MainsPaperSchema.parse(rawInput);
    const id = data.id || uuidv4();
    if (data.id) {
      await db.update(mainsPapers).set(data).where(eq(mainsPapers.id, id));
    } else {
      await db.insert(mainsPapers).values({ ...data, id });
    }
    // 💥 DUAL CACHE BURST:
    // 1. Path: UI/HTML Frontend Cache expire karo
    // 2. Tag: DB/RAM Backend Data Cache expire karo (0 seconds me)
    revalidatePath('/admin/mains');
    revalidateTag('mains_syllabus', { expire: 0 });
    return { success: true as const, id };
  } catch (error) {
    logger.error('upsertMainsPaper failed', error);
    return { success: false as const, error: 'Failed to save paper' };
  }
}

// 3. Add/Update Unit
/** 📁 Paper ke andar unit (Unit 1-10) aur Part (A/B) manage karne ke liye. */
export async function upsertMainsUnit(rawInput: MainsUnitInput) {
  try {
    await assertAdmin();
    const data = MainsUnitSchema.parse(rawInput);
    const id = data.id || uuidv4();
    if (data.id) {
      await db.update(mainsUnits).set(data).where(eq(mainsUnits.id, id));
    } else {
      await db.insert(mainsUnits).values({ ...data, id });
    }
    // 💥 DUAL CACHE BURST (Path for UI, Tag for DB RAM Cache)
    revalidatePath('/admin/mains');
    revalidateTag('mains_syllabus', { expire: 0 });
    return { success: true as const, id };
  } catch (error) {
    logger.error('upsertMainsUnit failed', error);
    return { success: false as const, error: 'Failed to save unit' };
  }
}

// 4. Upsert Deep Content (The AI-generated Expert Content)
/** 📝 AI se generate kiya hua deep content (Concept, Model Answers) save karne ke liye. */
export async function upsertMainsContent(topicId: string, rawInput: MainsContentInput) {
  try {
    await assertAdmin();
    // Re-enabling Zod validation if it's safe. If it was causing crashes, we need to know why.
    // In many cases, it's due to circular refs or complex JSON which Drizzle handles fine but Zod 
    // might struggle with if not defined precisely. 
    // For now, I'll attempt to use .parse() but wrap in a more specific try-catch or fallback.
    const content = MainsContentSchema.parse(rawInput);
    
    const existing = await db
      .select()
      .from(mainsContent)
      .where(eq(mainsContent.topicId, topicId))
      .limit(1);

    if (existing[0]) {
      await db
        .update(mainsContent)
        .set({
          ...content,
          modelAnswers: content.modelAnswers as any,
          practiceQuestions: content.practiceQuestions as any,
          richPayload: content.richPayload as any,
          examType: content.examType as any,
          updatedAt: new Date(),
        })
        .where(eq(mainsContent.topicId, topicId));
    } else {
      await db.insert(mainsContent).values({
        id: uuidv4(),
        topicId,
        ...content,
        modelAnswers: content.modelAnswers as any,
        practiceQuestions: content.practiceQuestions as any,
        richPayload: content.richPayload as any,
        examType: content.examType as any,
        updatedAt: new Date(),
      });
    }

    // Mark topic as published when content is added
    await db
      .update(mainsTopics)
      .set({ status: 'published' })
      .where(eq(mainsTopics.id, topicId));

    // 💥 DUAL CACHE BURST (Path for UI, Tag for DB RAM Cache)
    revalidatePath('/admin/mains');
    revalidatePath(`/mains/syllabus`);
    revalidateTag('mains_syllabus', { expire: 0 });
    return { success: true as const };
  } catch (error) {
    logger.error('Upsert Content Error:', error);
    return { success: false as const, error: 'Failed to save content' };
  }
}


/** Admin clears expert row; topic goes back to draft until re-saved. */
/** 🗑️ Kisi topic ka content delete karne ke liye (Reset karne ke kaam aata hai). */
export async function adminDeleteMainsContentForTopic(topicId: string) {
  try {
    await assertAdmin();
    await db.delete(mainsContent).where(eq(mainsContent.topicId, topicId));
    await db.update(mainsTopics).set({ status: 'draft' }).where(eq(mainsTopics.id, topicId));
    // 💥 DUAL CACHE BURST (Path for UI, Tag for DB RAM Cache)
    revalidatePath('/admin/mains');
    revalidatePath('/mains/syllabus');
    revalidateTag('mains_syllabus', { expire: 0 });
    return { success: true as const };
  } catch (error) {
    console.error('adminDeleteMainsContentForTopic', error);
    return { success: false as const, error: blobFromError(error).slice(0, 240) };
  }
}

// 5. Get Detailed Syllabus Tree for a Paper (Admin & Student)
/** 🌳 Student aur Admin dono ke liye paper ka pura structure (Units -> Topics) fetch karta hai. */
export const getMainsSyllabusTree = unstable_cache(
  async (paperId: string) => {
    try {
      const units = await db
        .query.mainsUnits.findMany({
          where: eq(mainsUnits.paperId, paperId),
          orderBy: [asc(mainsUnits.part), asc(mainsUnits.displayOrder), asc(mainsUnits.id)],
          with: {
            topics: {
              columns: {
                id: true,
                unitId: true,
                titleHi: true,
                titleEn: true,
                displayOrder: true,
                status: true,
                createdAt: true,
                examType: true,
              },
              orderBy: [mainsTopics.displayOrder],
              with: {
                content: {
                  columns: {
                    id: true,
                    updatedAt: true,
                  },
                },
              },
            },
          },
        });
      return { success: true as const, data: units };
    } catch (error: unknown) {
      const blob = `${error instanceof Error ? error.message : ''} ${typeof error === 'object' && error && 'cause' in error ? String((error as { cause?: unknown }).cause) : ''}`;
      // eslint-disable-next-line no-console
      console.error('[getMainsSyllabusTree] failed', { paperId, blob });
      if (/no such table:?\s*mains_/i.test(blob)) {
        return {
          success: false as const,
          error: 'mains_tables_missing' as const,
          hint:
            'Run `npm run db:migrate` (local) or `USE_PROD_DB=true npm run db:migrate` (Turso). Full setup: `npm run db:setup:mains:remote`.',
          data: [],
        };
      }
      if (/no such column/i.test(blob)) {
        return {
          success: false as const,
          error: 'schema_outdated' as const,
          hint:
            'Database missing a newer column (e.g. `mains_content.rich_payload` or mains PYQ fields). Run: `npm run db:migrate` or `npm run db:setup:mains:remote`.',
          detail: blob.slice(0, 500),
        };
      }
      return { success: false as const, error: 'Failed to fetch syllabus tree' as const, detail: blob.slice(0, 500) };
    }
  },
  ['mains-syllabus-tree-v1'],
  { tags: ['mains_syllabus'], revalidate: 604800 }
);

/** Topic + unit + paper + optional expert content (for `/mains/syllabus/[paperId]/[topicId]`). */
/** 📖 Student side par jab koi topic kholta hai, toh uska content aur navigation links fetch karne ke liye. */
export async function getMainsTopicForPage(topicId: string, paperId: string) {
  try {
    const row = await db.query.mainsTopics.findFirst({
      where: eq(mainsTopics.id, topicId),
      with: {
        unit: { with: { paper: true } },
        content: true,
      },
    });
    if (!row?.unit?.paper || row.unit.paper.id !== paperId) {
      return { success: false as const, error: 'not_found' };
    }
    const user = await verifyAuth();
    const vaultUnlocked = isMainsVaultUnlockedUser(user);
    const isGuest = !user;

    // Fetch first topic of the unit to identify it
    const firstTopic = await db.query.mainsTopics.findFirst({
      where: eq(mainsTopics.unitId, row.unitId!),
      orderBy: [asc(mainsTopics.displayOrder)],
    });
    const isFirstTopic = firstTopic && firstTopic.id === topicId;

    // Rock solid rule: Only Paper 1, Unit 1, Part A, Topic 1 is open for guests
    const isGuestDemoTopic = isGuest && 
      row.unit.paper.paperNumber === 1 && 
      row.unit.part === 'A' && 
      row.unit.unitNumber === 1 && 
      isFirstTopic;

    if (!row.content) {
      return { success: true as const, data: row, isDemoTopic: !!isGuestDemoTopic };
    }

    if (vaultUnlocked || isGuestDemoTopic) {
      return { success: true as const, data: row, isDemoTopic: !!isGuestDemoTopic };
    }

    const conceptHi = (row.content.conceptHi ?? '').trim();
    const conceptEn = (row.content.conceptEn ?? '').trim();
    
    // 🔒 Type-safe content masking for non-vault users
    const masked: any = {
      ...row.content,
      conceptHi: conceptHi ? `${conceptHi.slice(0, 220)}...` : '',
      conceptEn: conceptEn ? `${conceptEn.slice(0, 220)}...` : '',
      expertStrategyHi: '',
      expertStrategyEn: '',
      modelAnswers: {},
      keyTermsHi: null,
      keyTermsEn: null,
      richPayload: null,
    };

    return { success: true as const, data: { ...row, content: masked }, isDemoTopic: false };
  } catch (error) {
    logger.error('getMainsTopicForPage: failed to fetch topic', error, {
      category: 'content',
      topicId,
      paperId,
    });
    return { success: false as const, error: 'fetch_failed' };
  }
}

/** Admin side: get full topic content without masking. */
export async function getTopicContentForAdmin(topicId: string) {
  try {
    await assertAdmin();
    const row = await db.query.mainsTopics.findFirst({
      where: eq(mainsTopics.id, topicId),
      with: {
        content: true,
      },
    });
    return { success: true as const, data: row };
  } catch (error) {
    logger.error('getTopicContentForAdmin failed', error);
    return { success: false as const, error: 'Failed to fetch admin content' };
  }
}

/** Get all papers 1-6 with their full units and topics tree for the global Syllabus Menu */
/** 📚 Dropdowns aur menus me dikhane ke liye saare papers aur unke units ka data. */
export const getAllMainsPapersWithSyllabus = unstable_cache(
  async () => {
    try {
      const papers = await db.query.mainsPapers.findMany({
        orderBy: [asc(mainsPapers.displayOrder)],
        with: {
          units: {
            orderBy: [asc(mainsUnits.part), asc(mainsUnits.displayOrder), asc(mainsUnits.id)],
            with: {
              topics: {
                columns: {
                  id: true,
                  unitId: true,
                  titleHi: true,
                  titleEn: true,
                  displayOrder: true,
                  status: true,
                },
                orderBy: [mainsTopics.displayOrder],
              },
            },
          },
        },
      });

      const data = papers.map((p) => ({
        id: p.id,
        paperNumber: p.paperNumber,
        titleEn: p.titleEn,
        titleHi: p.titleHi,
        units: p.units.map((u) => ({
          id: u.id,
          unitNumber: u.unitNumber,
          part: (u.part || 'NONE') as MainsUnitPart,
          titleHi: u.titleHi,
          titleEn: u.titleEn,
          topics: u.topics.map((t) => ({
            id: t.id,
            titleHi: t.titleHi,
            titleEn: t.titleEn,
            status: t.status ?? 'draft',
          })),
        })),
      }));

      return { success: true as const, data };
    } catch (error) {
      console.error('getAllMainsPapersWithSyllabus failed:', error);
      return { success: false as const, error: 'fetch_failed' as const };
    }
  },
  ['all-mains-papers-syllabus-v1'],
  { tags: ['mains_syllabus'], revalidate: 604800 }
);


/** 🕒 TRACK RECENT SYLLABUS ACTIVITY
 * Bhai, ye action admin ko batayega ki hal hi mein kis topic par expert content upload hua hai.
 */
/** ⏱️ Dashboard par recent updates (Kaunsa topic kab update hua) dikhane ke liye. */
export async function adminGetRecentMainsActivity() {
  try {
    await assertAdmin();
    const rows = await db
      .select({
        id: mainsContent.id,
        updatedAt: mainsContent.updatedAt,
        topicId: mainsContent.topicId,
        topicTitleHi: mainsTopics.titleHi,
        topicTitleEn: mainsTopics.titleEn,
        unitNumber: mainsUnits.unitNumber,
        unitPart: mainsUnits.part,
        paperNumber: mainsPapers.paperNumber,
      })
      .from(mainsContent)
      .innerJoin(mainsTopics, eq(mainsTopics.id, mainsContent.topicId))
      .innerJoin(mainsUnits, eq(mainsUnits.id, mainsTopics.unitId))
      .innerJoin(mainsPapers, eq(mainsPapers.id, mainsUnits.paperId))
      .orderBy(desc(mainsContent.updatedAt))
      .limit(10);

    return { success: true as const, data: rows };
  } catch (error) {
    console.error('adminGetRecentMainsActivity', error);
    return { success: false as const, error: 'Failed to fetch activity' };
  }
}

/**
 * 📦 BULK SYLLABUS UPLOAD (Admin Automation)
 * Takes JSON from the Decoder Prompt and inserts Papers, Units, and Topics into the DB automatically.
 */
export async function adminApplyMainsSyllabusJson(jsonString: string) {
  try {
    await assertAdmin();
    const parsed = JSON.parse(jsonString);
    if (!parsed.papers || !Array.isArray(parsed.papers)) {
      return { success: false as const, error: 'Invalid JSON: Missing papers array' };
    }

    let totalPapers = 0;
    let totalUnits = 0;
    let totalTopics = 0;

    for (const paperData of parsed.papers) {
      const paperId = uuidv4();
      await db.insert(mainsPapers).values({
        id: paperId,
        paperNumber: paperData.paper_number,
        titleHi: paperData.paper_title_hi,
        titleEn: paperData.paper_title_en,
        totalMarks: paperData.total_marks || 250,
        durationMinutes: paperData.duration_minutes || 180,
        displayOrder: paperData.paper_number,
        examType: 'upsc',
      }).onConflictDoNothing();
      totalPapers++;

      for (const partData of paperData.parts || []) {
        for (const unitData of partData.units || []) {
          const unitId = uuidv4();
          await db.insert(mainsUnits).values({
            id: unitId,
            paperId,
            part: partData.part || 'NONE',
            unitNumber: unitData.unit_number,
            titleHi: unitData.unit_title_hi || '',
            titleEn: unitData.unit_title_en || '',
            displayOrder: unitData.unit_number,
            examType: 'upsc',
          }).onConflictDoNothing();
          totalUnits++;

          const topics = [];
          const topicsEnRaw = unitData.topics_en || unitData.topics || [];
          const topicsHiRaw = unitData.topics_hi || unitData.topics || [];
          const enLen = topicsEnRaw.length;
          const hiLen = topicsHiRaw.length;
          const maxLen = Math.max(enLen, hiLen);
          
          for (let i = 0; i < maxLen; i++) {
            let titleEn = topicsEnRaw[i] || topicsHiRaw[i] || 'Untitled Topic';
            let titleHi = topicsHiRaw[i] || topicsEnRaw[i] || 'Untitled Topic';
            
            // If it's an object instead of string
            if (typeof titleEn === 'object' && titleEn !== null) {
              titleEn = (titleEn as any).title_en || (titleEn as any).title || JSON.stringify(titleEn);
            }
            if (typeof titleHi === 'object' && titleHi !== null) {
              titleHi = (titleHi as any).title_hi || (titleHi as any).title || JSON.stringify(titleHi);
            }

            topics.push({
              id: uuidv4(),
              unitId,
              titleHi: String(titleHi),
              titleEn: String(titleEn),
              displayOrder: i + 1,
              status: 'published' as const,
              examType: 'upsc' as const,
            });
          }
          if (topics.length > 0) {
            await db.insert(mainsTopics).values(topics).onConflictDoNothing();
            totalTopics += topics.length;
          }
        }
      }
    }

    revalidatePath('/admin/mains');
    revalidatePath('/mains/syllabus');
    revalidateTag('mains_syllabus', { expire: 0 });

    return { 
      success: true as const, 
      message: `Successfully uploaded ${totalPapers} papers, ${totalUnits} macro-themes, and ${totalTopics} micro-topics.` 
    };
  } catch (error: any) {
    console.error('adminApplyMainsSyllabusJson error:', error);
    return { success: false as const, error: blobFromError(error) };
  }
}

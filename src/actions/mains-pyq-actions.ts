'use server';

import { assertAdmin } from '@/lib/auth';
import { db } from '@/db';
import {
  mainsPyqPapers,
  mainsPyqPreparedVariants,
  mainsPyqQuestions,
  mainsTopics,
  mainsTopicPyqLinks,
} from '@/db/schema';
import { eq, and, desc, count, inArray, sql, isNull } from 'drizzle-orm';
import { whereMainsPyqPaperListed } from '@/lib/mains-pyq-visibility';
import { v4 as uuidv4 } from 'uuid';
import { revalidatePath, revalidateTag } from 'next/cache';
import { MAINS_PYQ_PURGE_CONFIRMATION_PHRASE } from '@/config/mains-pyq-admin';
import { stripJsonFence } from '@/lib/mains-pyq-batch-paste';
import { parseMainsPyqImportJson, stripCiteMarkers, stableQuestionKey } from '@/lib/mains-pyq-import';
import { repairInteriorDoubleQuotesInMappedStrings } from '@/lib/mains-pyq-paste-json-parse';
import { jsonrepair } from 'jsonrepair';
import {
  buildMainsTopicUserPrompt,
  MAINS_TOPIC_AI_MICRO_TONE,
} from '@/config/mains-topic-ai-prompt';
// Scratch imports removed because we use getMainsPaperExpertAddon now.
import {
  PYQ_PROMPT_EXAM_YEARS,
  bandLabel,
  curatePyqForPrompt,
  pyqMarkBand,
  type CuratablePyq,
} from '@/lib/mains-pyq-prompt-curate';

function errBlob(e: unknown): string {
  const base = e instanceof Error ? e.message : String(e);
  const c =
    e && typeof e === 'object' && 'cause' in e && (e as { cause?: unknown }).cause != null
      ? String((e as { cause?: unknown }).cause)
      : '';
  return `${base} ${c}`;
}

function adminReadableError(e: unknown): string {
  const b = errBlob(e);
  if (/Unauthorized|Admin access required/i.test(b)) {
    return 'Admin login chahiye — /auth/login se admin account se sign in karo, phir /admin/mains reload karo.';
  }
  if (/no such table/i.test(b)) {
    return `DB table missing — migrations chalao: npm run db:migrate (local) ya USE_PROD_DB=true npm run db:migrate (Turso). Optional: npm run db:setup:mains:remote. (${b.slice(0, 140)})`;
  }
  return b.slice(0, 400);
}


function parseJson(raw: string): unknown {
  const trimmed = stripJsonFence(raw);
  try {
    return JSON.parse(trimmed);
  } catch {
    const repairedQuotes = repairInteriorDoubleQuotesInMappedStrings(trimmed);
    return JSON.parse(jsonrepair(repairedQuotes));
  }
}

function qRowKey(part: string, unitNumber: number, questionNumber: string, displayOrder: number | null): string {
  return stableQuestionKey(part, unitNumber, questionNumber, displayOrder ?? undefined);
}

/** Admin: paste full JSON → upsert by `(exam_year, paper_number)`; merge stems by part+unit+q#; keeps stable question IDs when keys match. */
export async function importMainsPyqPaperJson(rawText: string) {
  await assertAdmin();
  let data: unknown;
  try {
    data = parseJson(rawText);
  } catch (e) {
    return { success: false as const, error: `Invalid JSON: ${adminReadableError(e)}` };
  }
  const parsed = parseMainsPyqImportJson(data);
  if (!parsed || parsed.questions.length === 0) {
    return {
      success: false as const,
      error: 'Unrecognised JSON: need paper_number + parts[].units[].questions[] with non-empty question_hi',
    };
  }

  const rawBackup = typeof rawText === 'string' ? rawText : JSON.stringify(data);

  try {
  const stats = await db.transaction(async (tx) => {
    const dupes = await tx
      .select()
      .from(mainsPyqPapers)
      .where(
        and(eq(mainsPyqPapers.examYear, parsed.examYear), eq(mainsPyqPapers.paperNumber, parsed.paperNumber))
      )
      .orderBy(desc(mainsPyqPapers.createdAt));

    let paperId: string;
    let slug: string;
    const mergedDupRows = Math.max(0, dupes.length - 1);

    if (dupes.length === 0) {
      paperId = uuidv4();
      slug = `upsc_mains_${parsed.examYear}_p${parsed.paperNumber}_${paperId.slice(0, 10)}`;
      await tx.insert(mainsPyqPapers).values({
        id: paperId,
        slug,
        examYear: parsed.examYear,
        paperNumber: parsed.paperNumber,
        examLabel: parsed.examLabel,
        titleHi: parsed.titleHi,
        titleEn: parsed.titleEn,
        rawJson: rawBackup,
        isHidden: false,
      });
    } else {
      const keeper = dupes[0]!;
      paperId = keeper.id;
      slug = keeper.slug;
      const dropIds = dupes.slice(1).map((r) => r.id);
      if (dropIds.length) {
        await tx.delete(mainsPyqPapers).where(inArray(mainsPyqPapers.id, dropIds));
      }
      await tx
        .update(mainsPyqPapers)
        .set({
          examLabel: parsed.examLabel,
          titleHi: parsed.titleHi,
          titleEn: parsed.titleEn,
          rawJson: rawBackup,
        })
        .where(eq(mainsPyqPapers.id, paperId));
    }

    const existingQs = await tx
      .select()
      .from(mainsPyqQuestions)
      .where(eq(mainsPyqQuestions.paperId, paperId));

    const byKey = new Map(
      existingQs.map((q) => [qRowKey(q.part, q.unitNumber, q.questionNumber, q.displayOrder), q])
    );

    let inserted = 0;
    let updated = 0;
    const survived = new Set<string>();
    const toInsert: (typeof mainsPyqQuestions.$inferInsert)[] = [];

    for (const q of parsed.questions) {
      const key = qRowKey(q.part, q.unitNumber, q.questionNumber, q.displayOrder);
      const prev = byKey.get(key);

      if (prev) {
        await tx
          .update(mainsPyqQuestions)
          .set({
            unitTitleHi: q.unitTitleHi || null,
            unitTitleEn: q.unitTitleEn || null,
            questionNumber: q.questionNumber,
            marks: q.marks,
            questionType: q.questionType,
            questionHi: q.questionHi,
            questionEn: q.questionEn || null,
            displayOrder: q.displayOrder,
          })
          .where(eq(mainsPyqQuestions.id, prev.id));
        survived.add(prev.id);
        updated++;
      } else {
        const nid = uuidv4();
        toInsert.push({
          id: nid,
          paperId,
          part: q.part,
          unitNumber: q.unitNumber,
          unitTitleHi: q.unitTitleHi || null,
          unitTitleEn: q.unitTitleEn || null,
          questionNumber: q.questionNumber,
          marks: q.marks,
          questionType: q.questionType,
          questionHi: q.questionHi,
          questionEn: q.questionEn || null,
          displayOrder: q.displayOrder,
        });
        survived.add(nid);
        inserted++;
      }
    }

    for (let i = 0; i < toInsert.length; i += 80) {
      await tx.insert(mainsPyqQuestions).values(toInsert.slice(i, i + 80));
    }

    const toDelete = existingQs.filter((q) => !survived.has(q.id)).map((q) => q.id);
    if (toDelete.length) {
      await tx.delete(mainsPyqQuestions).where(inArray(mainsPyqQuestions.id, toDelete));
    }

    return {
      paperId,
      inserted,
      updated,
      removed: toDelete.length,
      mergedDupRows,
      slug,
      count: parsed.questions.length,
    };
  });

  revalidatePath('/admin/mains-pyq');
  revalidatePath('/mains/syllabus/pyq-library');
  const { revalidatePyqOnUpload } = await import('@/lib/cache');
  await revalidatePyqOnUpload(parsed.paperNumber);

  return {
    success: true as const,
    paperId: stats.paperId,
    slug: stats.slug,
    count: stats.count,
    examYear: parsed.examYear,
    paperNumber: parsed.paperNumber,
    inserted: stats.inserted,
    updated: stats.updated,
    removed: stats.removed,
    mergedDuplicatePapers: stats.mergedDupRows,
  };
  } catch (e) {
    return { success: false as const, error: adminReadableError(e) };
  }
}

export async function listMainsPyqPapers() {
  await assertAdmin();
  
  // Single optimized query for papers and their question counts
  const papers = await db
    .select({
      paper: mainsPyqPapers,
      qTotal: count(mainsPyqQuestions.id),
    })
    .from(mainsPyqPapers)
    .leftJoin(mainsPyqQuestions, eq(mainsPyqQuestions.paperId, mainsPyqPapers.id))
    .groupBy(mainsPyqPapers.id)
    .orderBy(desc(mainsPyqPapers.examYear), mainsPyqPapers.paperNumber);

  // Single optimized query for "done" counts (questions with at least 1 variant)
  const qDoneCounts = await db
    .select({
      paperId: mainsPyqQuestions.paperId,
      questionId: mainsPyqQuestions.id,
      variantCount: count(mainsPyqPreparedVariants.id),
    })
    .from(mainsPyqQuestions)
    .innerJoin(
      mainsPyqPreparedVariants,
      eq(mainsPyqQuestions.id, mainsPyqPreparedVariants.pyqQuestionId)
    )
    .groupBy(mainsPyqQuestions.id, mainsPyqQuestions.paperId);

  // Aggregate done counts per paper
  const doneMap = new Map<string, number>();
  for (const row of qDoneCounts) {
    const current = doneMap.get(row.paperId) || 0;
    doneMap.set(row.paperId, current + 1);
  }

  const data = papers.map(({ paper, qTotal }) => ({
    ...paper,
    qCount: Number(qTotal),
    doneCount: doneMap.get(paper.id) || 0,
  }));

  return { success: true as const, data };
}

/** 📊 PYQ PROGRESS OVERVIEW
 * Bhai, ye action admin ko batayega ki PYQ side par kya scene hai.
 * Kitne papers uploaded hain, kitne questions prepare ho gaye hain.
 */
export async function getMainsPyqDetailedOverview() {
  try {
    await assertAdmin();
    
    // 1. Fetch all papers
    const papers = await db.select().from(mainsPyqPapers).orderBy(desc(mainsPyqPapers.examYear), mainsPyqPapers.paperNumber);
    
    // 2. Optimized: Get total question counts per paper in one query
    const totalCounts = await db
      .select({
        paperId: mainsPyqQuestions.paperId,
        n: count(),
      })
      .from(mainsPyqQuestions)
      .groupBy(mainsPyqQuestions.paperId);
    
    const totalMap = new Map(totalCounts.map(c => [c.paperId, Number(c.n)]));

    // 3. Optimized: Get done counts per paper in one query
    // Done = has at least one prepared variant
    const qDonePerQuestion = await db
      .select({
        paperId: mainsPyqQuestions.paperId,
        questionId: mainsPyqQuestions.id,
        variantCount: count(mainsPyqPreparedVariants.id),
      })
      .from(mainsPyqQuestions)
      .innerJoin(
        mainsPyqPreparedVariants,
        eq(mainsPyqQuestions.id, mainsPyqPreparedVariants.pyqQuestionId)
      )
      .groupBy(mainsPyqQuestions.id, mainsPyqQuestions.paperId);

    const doneMap = new Map<string, number>();
    for (const row of qDonePerQuestion) {
      const current = doneMap.get(row.paperId) || 0;
      doneMap.set(row.paperId, current + 1);
    }

    // 4. Optimized: Get last activity per paper in one query
    const lastActivityPerPaper = await db
      .select({
        paperId: mainsPyqQuestions.paperId,
        lastUpdated: sql<string>`max(${mainsPyqPreparedVariants.updatedAt})`,
      })
      .from(mainsPyqPreparedVariants)
      .innerJoin(mainsPyqQuestions, eq(mainsPyqPreparedVariants.pyqQuestionId, mainsPyqQuestions.id))
      .groupBy(mainsPyqQuestions.paperId);
    
    const activityMap = new Map(lastActivityPerPaper.map(a => [a.paperId, a.lastUpdated]));

    const detailedData = papers.map((p) => {
      const total = totalMap.get(p.id) || 0;
      const done = doneMap.get(p.id) || 0;
      const lastUpdated = activityMap.get(p.id);

      return { 
        id: p.id,
        examYear: p.examYear,
        paperNumber: p.paperNumber,
        titleEn: p.titleEn,
        qCount: total,
        doneCount: done,
        progress: total > 0 ? Math.round((done / total) * 100) : 0,
        lastUpdated: lastUpdated ? new Date(lastUpdated) : null,
        isHidden: p.isHidden
      };
    });

    const totalQuestions = detailedData.reduce((acc, p) => acc + p.qCount, 0);
    const totalDone = detailedData.reduce((acc, p) => acc + p.doneCount, 0);
    const lastGlobalUpdate = detailedData.reduce((acc, p) => {
      if (!p.lastUpdated) return acc;
      if (!acc) return p.lastUpdated;
      return p.lastUpdated > acc ? p.lastUpdated : acc;
    }, null as Date | null);

    // Target: 2020-2024, P1-P6 = 30 papers
    const expectedYears = [2020, 2021, 2022, 2023, 2024];
    const expectedPapers = [1, 2, 3, 4, 5, 6];
    const missing: { year: number; paper: number }[] = [];
    let targetImportedCount = 0;
    let targetPreparedCount = 0;

    for (const y of expectedYears) {
      for (const p of expectedPapers) {
        const found = detailedData.find(d => Number(d.examYear) === y && Number(d.paperNumber) === p);
        if (!found) {
          missing.push({ year: y, paper: p });
        } else {
          targetImportedCount++;
          if (found.progress === 100) {
            targetPreparedCount++;
          }
        }
      }
    }

    const marksBreakdownRaw = await db
      .select({
        marks: mainsPyqQuestions.marks,
        count: count(),
      })
      .from(mainsPyqQuestions)
      .groupBy(mainsPyqQuestions.marks)
      .orderBy(mainsPyqQuestions.marks);

    const marksBreakdown = marksBreakdownRaw.map(r => ({
      marks: r.marks === null ? 0 : Number(r.marks),
      count: Number(r.count)
    }));

    return { 
      success: true as const, 
      data: detailedData,
      missing,
      summary: {
        totalPapers: detailedData.length,
        totalQuestions,
        totalDone,
        overallProgress: totalQuestions > 0 ? Math.round((totalDone / totalQuestions) * 100) : 0,
        lastGlobalUpdate: lastGlobalUpdate ? lastGlobalUpdate.toISOString() : null,
        targetTotal: expectedYears.length * expectedPapers.length,
        targetImported: targetImportedCount,
        targetMissing: missing.length,
        targetPrepared: targetPreparedCount,
        targetPendingPrep: targetImportedCount - targetPreparedCount,
        marksBreakdown
      }
    };
  } catch (error) {
    console.error('getMainsPyqDetailedOverview error:', error);
    return { success: false as const, error: adminReadableError(error) };
  }
}

/** Narrow stem shape so SELECT works on older DBs missing e.g. `expert_insights_*` columns. */
type PyqStemForPrompt = {
  id: string;
  part: string;
  unitNumber: number;
  marks: number;
  questionNumber: string;
  questionHi: string;
  questionEn: string | null;
};

type PoolRow = CuratablePyq & { q: PyqStemForPrompt };

async function topicLinkedQuestionIds(topicId: string): Promise<Set<string>> {
  try {
    const rows = await db
      .select({ id: mainsPyqQuestions.id })
      .from(mainsTopicPyqLinks)
      .innerJoin(mainsPyqQuestions, eq(mainsTopicPyqLinks.pyqQuestionId, mainsPyqQuestions.id))
      .where(eq(mainsTopicPyqLinks.topicId, topicId));
    return new Set(rows.map((r) => r.id));
  } catch {
    return new Set();
  }
}

function rowToPoolRow(row: PyqStemForPrompt & { examYear: number }, linked: boolean): PoolRow {
  return {
    id: row.id,
    marks: row.marks,
    examYear: row.examYear,
    linked,
    q: {
      id: row.id,
      part: row.part,
      unitNumber: row.unitNumber,
      marks: row.marks,
      questionNumber: row.questionNumber,
      questionHi: row.questionHi,
      questionEn: row.questionEn,
    },
  };
}

async function fetchLinkedPyqPool(topicId: string): Promise<PoolRow[]> {
  try {
    const rows = await db
      .select({
        id: mainsPyqQuestions.id,
        paperId: mainsPyqQuestions.paperId,
        part: mainsPyqQuestions.part,
        unitNumber: mainsPyqQuestions.unitNumber,
        marks: mainsPyqQuestions.marks,
        questionNumber: mainsPyqQuestions.questionNumber,
        questionHi: mainsPyqQuestions.questionHi,
        questionEn: mainsPyqQuestions.questionEn,
        examYear: mainsPyqPapers.examYear,
      })
      .from(mainsTopicPyqLinks)
      .innerJoin(mainsPyqQuestions, eq(mainsTopicPyqLinks.pyqQuestionId, mainsPyqQuestions.id))
      .innerJoin(mainsPyqPapers, eq(mainsPyqQuestions.paperId, mainsPyqPapers.id))
      .where(
        and(
          eq(mainsTopicPyqLinks.topicId, topicId),
          inArray(mainsPyqPapers.examYear, [...PYQ_PROMPT_EXAM_YEARS]),
          whereMainsPyqPaperListed()
        )
      )
      .orderBy(desc(mainsPyqPapers.examYear), mainsPyqQuestions.displayOrder);
    return rows.map((r) => rowToPoolRow(r, true));
  } catch (e) {
    const b = errBlob(e);
    if (/no such table:?\s*mains_topic_pyq_links/i.test(b)) return [];
    if (/no such column/i.test(b)) return [];
    throw e;
  }
}

async function fetchUnitBucketPyqPool(
  pn: number,
  partRaw: string | null | undefined,
  un: number,
  excludeIds: Set<string>
): Promise<PoolRow[]> {
  try {
    const y = [...PYQ_PROMPT_EXAM_YEARS];
    const conds = [
      eq(mainsPyqPapers.paperNumber, pn),
      inArray(mainsPyqPapers.examYear, y),
      eq(mainsPyqQuestions.unitNumber, un),
      whereMainsPyqPaperListed(),
    ];
    if (partRaw && partRaw !== 'NONE') {
      conds.push(eq(mainsPyqQuestions.part, partRaw));
    }
    const rows = await db
      .select({
        id: mainsPyqQuestions.id,
        paperId: mainsPyqQuestions.paperId,
        part: mainsPyqQuestions.part,
        unitNumber: mainsPyqQuestions.unitNumber,
        marks: mainsPyqQuestions.marks,
        questionNumber: mainsPyqQuestions.questionNumber,
        questionHi: mainsPyqQuestions.questionHi,
        questionEn: mainsPyqQuestions.questionEn,
        examYear: mainsPyqPapers.examYear,
      })
      .from(mainsPyqQuestions)
      .innerJoin(mainsPyqPapers, eq(mainsPyqQuestions.paperId, mainsPyqPapers.id))
      .where(and(...conds))
      .orderBy(desc(mainsPyqPapers.examYear), mainsPyqQuestions.displayOrder);

    return rows
      .filter((r) => !excludeIds.has(r.id))
      .map((r) => rowToPoolRow(r, false));
  } catch (e) {
    const b = errBlob(e);
    if (/no such table:?\s*mains_pyq/i.test(b)) return [];
    if (/no such column/i.test(b)) return [];
    throw e;
  }
}

function formatCuratedPyqBlock(rows: PoolRow[]): string {
  if (rows.length === 0) return '';
  const byBand: Record<'S' | 'L', PoolRow[]> = { S: [], L: [] };
  for (const r of rows) {
    byBand[pyqMarkBand(r.marks)].push(r);
  }
  const lines: string[] = [
    '### CURATED PYQs — official papers **2023–2024 only**',
    'Cap: **1 stem per band** — SHORT (10m) · LONG (15m–20m). Prefer shaping model_answers_* to these stems.',
    '`topic-linked` = admin mapped · `unit-bucket` = same paper / part / unit import.',
    '',
  ];
  for (const b of ['S', 'L'] as const) {
    const chunk = byBand[b];
    if (chunk.length === 0) continue;
    lines.push(`**${bandLabel(b)}**`);
    for (const r of chunk) {
      const tag = r.linked ? 'topic-linked' : 'unit-bucket';
      lines.push(
        `- [${r.examYear} | ${r.marks}m | Part ${r.q.part} | ${tag}] ${r.q.questionNumber}: ${stripCiteMarkers(r.q.questionHi)} | EN: ${stripCiteMarkers(r.q.questionEn ?? '')}`
      );
    }
    lines.push('');
  }
  return lines.join('\n').trim();
}

/**
 * Builds prompt text: **2023–2024** papers only; merged linked + unit bucket; **max 2 stems per mark band**.
 */
export async function buildMainsPyqReferenceForTopic(topicId: string): Promise<{
  text: string;
  hadAnyImportedPyq: boolean;
  linkedCount: number;
  unitStemCount: number;
  pyqPromptStemCount: number;
  pyqBandCounts: { S: number; L: number };
}> {
  try {
    const topic = await db.query.mainsTopics.findFirst({
      where: eq(mainsTopics.id, topicId),
      with: { unit: { with: { paper: true } } },
    });
    if (!topic?.unit?.paper) {
      return {
        text: '',
        hadAnyImportedPyq: false,
        linkedCount: 0,
        unitStemCount: 0,
        pyqPromptStemCount: 0,
        pyqBandCounts: { S: 0, L: 0 },
      };
    }

    const pn = topic.unit.paper.paperNumber;
    const partRaw = topic.unit.part;
    const un = topic.unit.unitNumber;

    const linkedAllIds = await topicLinkedQuestionIds(topicId);
    const linkedPool = await fetchLinkedPyqPool(topicId);
    const unitPool = await fetchUnitBucketPyqPool(pn, partRaw, un, linkedAllIds);
    const unitStemCount = unitPool.length;

    const merged = new Map<string, PoolRow>();
    for (const r of linkedPool) merged.set(r.id, r);
    for (const r of unitPool) if (!merged.has(r.id)) merged.set(r.id, r);

    const curated = curatePyqForPrompt(Array.from(merged.values()), 1);
    const text = formatCuratedPyqBlock(curated);

    const pyqBandCounts = { S: 0, L: 0 };
    for (const r of curated) {
      pyqBandCounts[pyqMarkBand(r.marks)]++;
    }

    return {
      text,
      hadAnyImportedPyq: curated.length > 0,
      linkedCount: linkedAllIds.size,
      unitStemCount,
      pyqPromptStemCount: curated.length,
      pyqBandCounts,
    };
  } catch (e) {
    const b = errBlob(e);
    if (/no such table:?\s*mains_/i.test(b)) {
      return {
        text: '',
        hadAnyImportedPyq: false,
        linkedCount: 0,
        unitStemCount: 0,
        pyqPromptStemCount: 0,
        pyqBandCounts: { S: 0, L: 0 },
      };
    }
    if (/no such column/i.test(b)) {
      return {
        text: '',
        hadAnyImportedPyq: false,
        linkedCount: 0,
        unitStemCount: 0,
        pyqPromptStemCount: 0,
        pyqBandCounts: { S: 0, L: 0 },
      };
    }
    throw e;
  }
}

/** @deprecated use buildMainsPyqReferenceForTopic — kept for clarity */
export async function getMainsPyqPromptBlockForTopic(topicId: string): Promise<string> {
  const r = await buildMainsPyqReferenceForTopic(topicId);
  return r.text;
}

export type MainsFullPromptMeta = {
  linkedPyqCount: number;
  unitStemCount: number;
  hadAnyImportedPyq: boolean;
  pyqPromptStemCount: number;
  pyqBandCounts: { S: number; L: number };
};

/** Shared: topic + PYQ + scratch slice → LATEST user block (Expert-Rich instructions). */
async function composeMainsTopicAiUserBlock(
  topicId: string
): Promise<
  | { success: true; topicBlock: string; meta: MainsFullPromptMeta }
  | { success: false; error: string }
> {
  const topic = await db.query.mainsTopics.findFirst({
    where: eq(mainsTopics.id, topicId),
    with: { unit: { with: { paper: true } } },
  });
  if (!topic?.unit?.paper) {
    return { success: false, error: 'Topic not found in DB — pehle paper select karke syllabus load hona chahiye.' };
  }
  const paper = topic.unit.paper;
  const pyqRef = await buildMainsPyqReferenceForTopic(topicId);

  const topicBlock = buildMainsTopicUserPrompt({
    paperNumber: paper.paperNumber,
    paperTitleEn: paper.titleEn,
    unitTitleHi: topic.unit.titleHi,
    unitTitleEn: topic.unit.titleEn,
    topicTitleHi: topic.titleHi,
    topicTitleEn: topic.titleEn,
    unitPart: topic.unit.part ?? 'NONE',
    paperPartAddon: '', // The expert addon is handled dynamically inside buildMainsTopicUserPrompt
    pyqReferenceBlock: pyqRef.text || undefined,
    noImportedQuestions: !pyqRef.hadAnyImportedPyq,
  });

  return {
    success: true,
    topicBlock,
    meta: {
      linkedPyqCount: pyqRef.linkedCount,
      unitStemCount: pyqRef.unitStemCount,
      hadAnyImportedPyq: pyqRef.hadAnyImportedPyq,
      pyqPromptStemCount: pyqRef.pyqPromptStemCount,
      pyqBandCounts: pyqRef.pyqBandCounts,
    },
  };
}

/** Admin: same LATEST middle section as inside full prompt — copy without legacy global blob. */
export async function buildMainsTopicAiUserBlock(topicId: string) {
  try {
    await assertAdmin();
    const r = await composeMainsTopicAiUserBlock(topicId);
    if (!r.success) return { success: false as const, error: r.error };
    return { success: true as const, topicBlock: r.topicBlock, meta: r.meta };
  } catch (e) {
    return { success: false as const, error: adminReadableError(e) };
  }
}

/** Admin: LATEST block + short tone hints (no giant legacy schema). */
export async function getMainsFullAiPromptForTopic(topicId: string) {
  try {
    await assertAdmin();
    const inner = await composeMainsTopicAiUserBlock(topicId);
    if (!inner.success) {
      return { success: false as const, error: inner.error };
    }
    const { topicBlock, meta } = inner;

    const prompt = [
      '══════════════════════════════════════════════════════════════════',
      'UPSC MAINS — FULL TOPIC PROMPT (curated 2023–24 PYQs + scratch lens)',
      '══════════════════════════════════════════════════════════════════',
      '',
      'FINAL reply = ONE raw Expert-Rich JSON object only. No markdown fences. No pre/post text.',
      '',
      '──────── LATEST (AUTHORITATIVE — scratch lens + Expert-Rich key contract) ────────',
      topicBlock,
      '',
      '──────── TONE (short — ignore legacy flat JSON anywhere else) ────────',
      MAINS_TOPIC_AI_MICRO_TONE,
      '',
      '--- END — output Expert-Rich JSON now. ---',
    ].join('\n');

    return {
      success: true as const,
      prompt,
      meta,
    };
  } catch (e) {
    return { success: false as const, error: adminReadableError(e) };
  }
}

export type PyqCandidateRow = {
  id: string;
  examYear: number;
  marks: number;
  part: string;
  questionNumber: string;
  previewHi: string;
  linked: boolean;
};

/** Admin: all imported PYQ rows in same paper + part + unit as this topic, with link state. */
export async function adminListPyqCandidatesForTopic(topicId: string) {
  try {
    await assertAdmin();
    const topic = await db.query.mainsTopics.findFirst({
      where: eq(mainsTopics.id, topicId),
      with: { unit: { with: { paper: true } } },
    });
    if (!topic?.unit?.paper) {
      return { success: false as const, error: 'Topic not found' };
    }

    const pn = topic.unit.paper.paperNumber;
    const partRaw = topic.unit.part;
    const un = topic.unit.unitNumber;

    const baseConds =
      partRaw && partRaw !== 'NONE'
        ? and(
            eq(mainsPyqPapers.paperNumber, pn),
            eq(mainsPyqQuestions.unitNumber, un),
            eq(mainsPyqQuestions.part, partRaw)
          )
        : and(eq(mainsPyqPapers.paperNumber, pn), eq(mainsPyqQuestions.unitNumber, un));

    const rows = await db
      .select({
        id: mainsPyqQuestions.id,
        marks: mainsPyqQuestions.marks,
        part: mainsPyqQuestions.part,
        questionNumber: mainsPyqQuestions.questionNumber,
        questionHi: mainsPyqQuestions.questionHi,
        year: mainsPyqPapers.examYear,
      })
      .from(mainsPyqQuestions)
      .innerJoin(mainsPyqPapers, eq(mainsPyqQuestions.paperId, mainsPyqPapers.id))
      .where(baseConds)
      .orderBy(desc(mainsPyqPapers.examYear), mainsPyqQuestions.displayOrder);

    let linkedSet = new Set<string>();
    try {
      const links = await db
        .select({ pyqQuestionId: mainsTopicPyqLinks.pyqQuestionId })
        .from(mainsTopicPyqLinks)
        .where(eq(mainsTopicPyqLinks.topicId, topicId));
      linkedSet = new Set(links.map((l) => l.pyqQuestionId));
    } catch {
      /* links table absent → treat all unlinked */
    }

    const data: PyqCandidateRow[] = rows.map(({ id, marks, part, questionNumber, questionHi, year }) => ({
      id,
      examYear: year,
      marks,
      part,
      questionNumber,
      previewHi: stripCiteMarkers(questionHi).slice(0, 160) + (questionHi.length > 160 ? '…' : ''),
      linked: linkedSet.has(id),
    }));

    return { success: true as const, data, paperNumber: pn, unitNumber: un, part: partRaw ?? 'NONE' };
  } catch (e) {
    return { success: false as const, error: adminReadableError(e) };
  }
}

export async function adminLinkTopicPyq(topicId: string, pyqQuestionId: string) {
  try {
    await assertAdmin();
    await db.insert(mainsTopicPyqLinks).values({ topicId, pyqQuestionId }).onConflictDoNothing();
    return { success: true as const };
  } catch (e) {
    return { success: false as const, error: adminReadableError(e) };
  }
}

export async function adminUnlinkTopicPyq(topicId: string, pyqQuestionId: string) {
  try {
    await assertAdmin();
    await db
      .delete(mainsTopicPyqLinks)
      .where(and(eq(mainsTopicPyqLinks.topicId, topicId), eq(mainsTopicPyqLinks.pyqQuestionId, pyqQuestionId)));
    return { success: true as const };
  } catch (e) {
    return { success: false as const, error: adminReadableError(e) };
  }
}

/** Wipes every mains PYQ import row — papers, stems, variants, topic↔PYQ links. Does not touch syllabus (`mains_papers`) or vault theory. */
export async function purgeAllMainsPyqVaultConfirm(confirmation: string) {
  try {
    await assertAdmin();
    if ((confirmation ?? '').trim() !== MAINS_PYQ_PURGE_CONFIRMATION_PHRASE) {
      return {
        success: false as const,
        error: `Type exactly "${MAINS_PYQ_PURGE_CONFIRMATION_PHRASE}" to confirm.`,
      };
    }

    await db.transaction(async (tx) => {
      await tx.delete(mainsTopicPyqLinks);
      await tx.delete(mainsPyqPreparedVariants);
      await tx.delete(mainsPyqQuestions);
      await tx.delete(mainsPyqPapers);
    });

    revalidatePath('/admin/mains-pyq');
    revalidatePath('/mains/syllabus/pyq-library');
    return { success: true as const };
  } catch (e) {
    return { success: false as const, error: adminReadableError(e) };
  }
}

export async function deleteMainsPyqPaperAdmin(paperId: string) {
  try {
    await assertAdmin();
    if (!paperId?.trim()) return { success: false as const, error: 'paperId required' };
    await db.delete(mainsPyqPapers).where(eq(mainsPyqPapers.id, paperId));
    revalidatePath('/admin/mains-pyq');
    revalidatePath('/mains/syllabus/pyq-library');
    return { success: true as const };
  } catch (e) {
    return { success: false as const, error: adminReadableError(e) };
  }
}

export async function updateMainsPyqPaperAdmin(input: {
  paperId: string;
  titleHi?: string | null;
  titleEn?: string | null;
  examLabel?: string | null;
  isHidden?: boolean;
}) {
  try {
    await assertAdmin();
    const patch: Partial<typeof mainsPyqPapers.$inferInsert> = {};
    if (input.titleHi !== undefined) patch.titleHi = input.titleHi;
    if (input.titleEn !== undefined) patch.titleEn = input.titleEn;
    if (input.examLabel !== undefined) patch.examLabel = input.examLabel;
    if (typeof input.isHidden === 'boolean') patch.isHidden = input.isHidden;
    if (Object.keys(patch).length === 0) {
      return { success: false as const, error: 'Nothing to update' };
    }
    await db.update(mainsPyqPapers).set(patch).where(eq(mainsPyqPapers.id, input.paperId));
    revalidatePath('/admin/mains-pyq');
    revalidatePath('/mains/syllabus/pyq-library');
    return { success: true as const };
  } catch (e) {
    return { success: false as const, error: adminReadableError(e) };
  }
}

export async function updateMainsPyqQuestionStemAdmin(input: {
  questionId: string;
  questionHi: string;
  questionEn?: string | null;
}) {
  try {
    await assertAdmin();
    if (!input.questionId || !input.questionHi.trim()) {
      return { success: false as const, error: 'Question ID and Hindi stem are required' };
    }
    await db
      .update(mainsPyqQuestions)
      .set({
        questionHi: input.questionHi.trim(),
        questionEn: input.questionEn !== undefined ? (input.questionEn?.trim() || null) : undefined,
      })
      .where(eq(mainsPyqQuestions.id, input.questionId));

    revalidatePath('/admin/mains-pyq');
    revalidatePath('/mains/syllabus/pyq-library');
    return { success: true as const };
  } catch (e) {
    return { success: false as const, error: adminReadableError(e) };
  }
}

export async function adminGetQuestionStem(questionId: string) {
  try {
    await assertAdmin();
    const q = await db
      .select({
        id: mainsPyqQuestions.id,
        questionHi: mainsPyqQuestions.questionHi,
        questionEn: mainsPyqQuestions.questionEn,
      })
      .from(mainsPyqQuestions)
      .where(eq(mainsPyqQuestions.id, questionId))
      .limit(1);

    if (q.length === 0) {
      return { success: false as const, error: 'Question not found' };
    }
    return { success: true as const, data: q[0]! };
  } catch (e) {
    return { success: false as const, error: adminReadableError(e) };
  }
}

export async function adminUpsertCurrentAffairsBatch(jsonPayload: string) {
  try {
    await assertAdmin();
    // Strip markdown formatting if AI included it
    let cleanPayload = jsonPayload.trim();
    if (cleanPayload.startsWith('```')) {
      cleanPayload = cleanPayload.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    const payload = JSON.parse(cleanPayload);
    
    if (!payload || !Array.isArray(payload.updates)) {
      return { success: false as const, error: 'Invalid JSON format. Expected an object with an "updates" array.' };
    }

    let updatedCount = 0;
    for (const update of payload.updates) {
      const hasNewKit = update.value_addition_kit_en || update.value_addition_kit_hi || update.current_affairs_data_en || update.current_affairs_data_hi;
      const hasOldKit = update.value_addition_kit || update.current_affairs_data;
      
      if (update.id && (hasNewKit || hasOldKit)) {
        let payloadToSave: Record<string, unknown> = {};
        
        if (hasNewKit) {
          if (update.value_addition_kit_en) payloadToSave.value_addition_kit_en = update.value_addition_kit_en;
          if (update.value_addition_kit_hi) payloadToSave.value_addition_kit_hi = update.value_addition_kit_hi;
          if (update.current_affairs_data_en) payloadToSave.current_affairs_data_en = update.current_affairs_data_en;
          if (update.current_affairs_data_hi) payloadToSave.current_affairs_data_hi = update.current_affairs_data_hi;
        } else {
          payloadToSave = update.value_addition_kit || update.current_affairs_data;
        }

        await db.update(mainsPyqQuestions)
          .set({ currentAffairsData: JSON.stringify(payloadToSave) })
          .where(eq(mainsPyqQuestions.id, update.id));
        updatedCount++;
      }
    }

    revalidatePath('/admin/mains-pyq');
    revalidatePath('/mains/syllabus/pyq-library');
    revalidateTag('mains-pyq-paper', 'max');
    return { success: true as const, updatedCount };
  } catch (e) {
    return { success: false as const, error: adminReadableError(e) };
  }
}

export async function adminGetCAQuestionsToProcess(examYear: number, paperNumber: number, limit: number = 50, part?: string, includeCompleted: boolean = false) {
  try {
    await assertAdmin();
    // First find the paper
    const paper = await db.query.mainsPyqPapers.findFirst({
      where: and(
        eq(mainsPyqPapers.examYear, examYear),
        eq(mainsPyqPapers.paperNumber, paperNumber)
      )
    });

    if (!paper) {
      return { success: false as const, error: 'Paper not found for the given year and number.' };
    }

    const conditions: any[] = [
      eq(mainsPyqQuestions.paperId, paper.id),
    ];

    if (!includeCompleted) {
      conditions.push(isNull(mainsPyqQuestions.currentAffairsData));
    }

    if (part && part !== 'ALL') {
      conditions.push(eq(mainsPyqQuestions.part, part));
    }

    const questions = await db.query.mainsPyqQuestions.findMany({
      where: and(...conditions),
      limit,
      columns: {
        id: true,
        marks: true,
        questionHi: true,
        questionEn: true,
      },
    });

    return { success: true as const, questions };
  } catch (e) {
    return { success: false as const, error: adminReadableError(e) };
  }
}

export async function adminGetCAStats(examYear: number, paperNumber: number, part: string = 'ALL') {
  try {
    await assertAdmin();
    const paper = await db.query.mainsPyqPapers.findFirst({
      where: and(
        eq(mainsPyqPapers.examYear, examYear),
        eq(mainsPyqPapers.paperNumber, paperNumber)
      )
    });

    if (!paper) {
      return { success: true as const, stats: { total: 0, missing: 0, done: 0 } };
    }

    const totalConditions = [eq(mainsPyqQuestions.paperId, paper.id)];
    if (part && part !== 'ALL') {
      totalConditions.push(eq(mainsPyqQuestions.part, part));
    }

    const [totalRes] = await db
      .select({ count: count() })
      .from(mainsPyqQuestions)
      .where(and(...totalConditions));
      
    const missingConditions = [
      eq(mainsPyqQuestions.paperId, paper.id),
      isNull(mainsPyqQuestions.currentAffairsData)
    ];
    if (part && part !== 'ALL') {
      missingConditions.push(eq(mainsPyqQuestions.part, part));
    }

    const [missingRes] = await db
      .select({ count: count() })
      .from(mainsPyqQuestions)
      .where(and(...missingConditions));

    const total = totalRes?.count || 0;
    const missing = missingRes?.count || 0;
    const done = total - missing;

    return { success: true as const, stats: { total, missing, done } };
  } catch (e) {
    return { success: false as const, error: adminReadableError(e) };
  }
}

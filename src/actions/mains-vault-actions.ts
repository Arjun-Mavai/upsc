'use server';

import { assertAdmin } from '@/lib/auth';
import { db } from '@/db';
import {
  mainsPyqPapers,
  mainsPyqQuestions,
  mainsPyqPreparedVariants,
  mainsTopicExpectedQuestions,
  mainsTopicExpectedVariants,
  mainsTopicPyqLinks,
  mainsTopicTheoryStructured,
  mainsTopics,
} from '@/db/schema';
import { and, count, desc, eq, inArray } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

/** Admin: structured theory JSON (Deep Dive) — complements `mains_content` markdown fields. */
export async function adminUpsertTopicTheoryStructured(topicId: string, payload: Record<string, unknown>) {
  await assertAdmin();
  const topic = await db.query.mainsTopics.findFirst({ where: eq(mainsTopics.id, topicId) });
  if (!topic) return { success: false as const, error: 'Topic not found' };
  const id = uuidv4();
  await db
    .insert(mainsTopicTheoryStructured)
    .values({
      id,
      topicId,
      payload,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: mainsTopicTheoryStructured.topicId,
      set: {
        payload,
        updatedAt: new Date(),
      },
    });
  return { success: true as const };
}

type PyqVariantInput = {
  variantSlot: number;
  styleLabel?: string | null;
  styleLabelHi?: string | null;
  structureBreakdown?: string | null;
  answerHi: string;
  answerEn?: string | null;
};

/** Admin: upsert up to two prepared answers for one official PYQ row. */
export async function adminReplacePyqPreparedVariants(pyqQuestionId: string, variants: PyqVariantInput[]) {
  await assertAdmin();
  const qrow = await db.query.mainsPyqQuestions.findFirst({
    where: eq(mainsPyqQuestions.id, pyqQuestionId),
  });
  if (!qrow) return { success: false as const, error: 'PYQ question not found' };

  const norm = variants
    .filter((v) => v.variantSlot === 1 || v.variantSlot === 2)
    .filter((v) => String(v.answerHi ?? '').trim().length > 0);
  if (norm.length === 0) {
    await db.delete(mainsPyqPreparedVariants).where(eq(mainsPyqPreparedVariants.pyqQuestionId, pyqQuestionId));
    return { success: true as const, count: 0 };
  }

  await db.transaction(async (tx) => {
    await tx.delete(mainsPyqPreparedVariants).where(eq(mainsPyqPreparedVariants.pyqQuestionId, pyqQuestionId));
    await tx.insert(mainsPyqPreparedVariants).values(
      norm.map((v) => ({
        id: uuidv4(),
        pyqQuestionId,
        variantSlot: v.variantSlot,
        styleLabel: v.styleLabel ?? null,
        styleLabelHi: v.styleLabelHi ?? null,
        structureBreakdown: v.structureBreakdown ?? null,
        answerHi: v.answerHi.trim(),
        answerEn: v.answerEn?.trim() || null,
        updatedAt: new Date(),
      }))
    );
  });
  return { success: true as const, count: norm.length };
}

type ExpectedQInput = {
  marks: number;
  wordLimitHint?: number | null;
  questionHi: string;
  questionEn?: string | null;
  sortOrder?: number;
  sourceLabel?: string;
  variants: PyqVariantInput[];
};

/** Admin: replace all expected/demo questions (+ variants) for a topic. */
export async function adminReplaceTopicExpectedPack(topicId: string, questions: ExpectedQInput[]) {
  await assertAdmin();
  const topic = await db.query.mainsTopics.findFirst({ where: eq(mainsTopics.id, topicId) });
  if (!topic) return { success: false as const, error: 'Topic not found' };

  const existing = await db.query.mainsTopicExpectedQuestions.findMany({
    where: eq(mainsTopicExpectedQuestions.topicId, topicId),
  });
  const existingIds = existing.map((e) => e.id);

  await db.transaction(async (tx) => {
    if (existingIds.length) {
      await tx
        .delete(mainsTopicExpectedVariants)
        .where(inArray(mainsTopicExpectedVariants.expectedQuestionId, existingIds));
      await tx.delete(mainsTopicExpectedQuestions).where(eq(mainsTopicExpectedQuestions.topicId, topicId));
    }

    for (const q of questions) {
      if (!String(q.questionHi ?? '').trim()) continue;
      const qid = uuidv4();
      await tx.insert(mainsTopicExpectedQuestions).values({
        id: qid,
        topicId,
        marks: q.marks,
        wordLimitHint: q.wordLimitHint ?? null,
        questionHi: q.questionHi.trim(),
        questionEn: q.questionEn?.trim() || null,
        sortOrder: q.sortOrder ?? 0,
        sourceLabel: q.sourceLabel ?? 'expected',
        examType: topic.examType ?? 'upsc',
      });
      const vv = (q.variants ?? []).filter(
        (v) => (v.variantSlot === 1 || v.variantSlot === 2) && String(v.answerHi ?? '').trim().length > 0
      );
      if (vv.length) {
        await tx.insert(mainsTopicExpectedVariants).values(
          vv.map((v) => ({
            id: uuidv4(),
            expectedQuestionId: qid,
            variantSlot: v.variantSlot,
            styleLabel: v.styleLabel ?? null,
            structureBreakdown: v.structureBreakdown ?? null,
            answerHi: v.answerHi.trim(),
            answerEn: v.answerEn?.trim() || null,
            updatedAt: new Date(),
          }))
        );
      }
    }
  });
  return { success: true as const };
}

/** Admin: badge / precise mapping — link one syllabus topic to one official PYQ stem. */
export async function adminLinkTopicToPyq(topicId: string, pyqQuestionId: string) {
  await assertAdmin();
  await db
    .insert(mainsTopicPyqLinks)
    .values({ topicId, pyqQuestionId, createdAt: new Date() })
    .onConflictDoNothing();
  return { success: true as const };
}

export async function adminUnlinkTopicFromPyq(topicId: string, pyqQuestionId: string) {
  await assertAdmin();
  await db
    .delete(mainsTopicPyqLinks)
    .where(
      and(eq(mainsTopicPyqLinks.topicId, topicId), eq(mainsTopicPyqLinks.pyqQuestionId, pyqQuestionId))
    );
  return { success: true as const };
}

export type VaultFilters = {
  paperNumber: number;
  part?: string | null;
  marks?: number | null;
  examYear?: number | null;
};

/**
 * Admin preview: official PYQ stems for a paper (+ whether prepared variants exist).
 * Student UI can reuse with auth later.
 */
export async function adminListMainsPyqVault(filters: VaultFilters) {
  await assertAdmin();

  const paperCond = eq(mainsPyqPapers.paperNumber, filters.paperNumber);
  const yearCond = filters.examYear != null ? eq(mainsPyqPapers.examYear, filters.examYear) : undefined;
  const papers = await db
    .select()
    .from(mainsPyqPapers)
    .where(yearCond ? and(paperCond, yearCond) : paperCond)
    .orderBy(desc(mainsPyqPapers.examYear));

  if (papers.length === 0) return { success: true as const, rows: [] };

  const paperIds = papers.map((p) => p.id);
  const parts = [inArray(mainsPyqQuestions.paperId, paperIds)];
  if (filters.part && filters.part !== 'ALL') parts.push(eq(mainsPyqQuestions.part, filters.part));
  if (filters.marks != null) parts.push(eq(mainsPyqQuestions.marks, filters.marks));

  const questions = await db.select().from(mainsPyqQuestions).where(and(...parts)).orderBy(
    mainsPyqQuestions.displayOrder,
    mainsPyqQuestions.questionNumber
  );

  const ids = questions.map((q) => q.id);
  const variantCounts =
    ids.length === 0
      ? []
      : await db
          .select({
            pyqQuestionId: mainsPyqPreparedVariants.pyqQuestionId,
            n: count(),
          })
          .from(mainsPyqPreparedVariants)
          .where(inArray(mainsPyqPreparedVariants.pyqQuestionId, ids))
          .groupBy(mainsPyqPreparedVariants.pyqQuestionId);

  const vn = new Map(variantCounts.map((r) => [r.pyqQuestionId, Number(r.n)]));

  const paperById = new Map(papers.map((p) => [p.id, p]));

  const rows = questions.map((q) => ({
    ...q,
    examYear: paperById.get(q.paperId)?.examYear,
    preparedVariantCount: vn.get(q.id) ?? 0,
  }));

  return { success: true as const, rows };
}

/** Topic-level bundle for future student page: theory blob + linked PYQs + expected Qs. */
export async function adminGetMainsTopicVaultBundle(topicId: string) {
  await assertAdmin();
  const topic = await db.query.mainsTopics.findFirst({
    where: eq(mainsTopics.id, topicId),
    with: {
      unit: { with: { paper: true } },
      theoryStructured: true,
      pyqLinks: { with: { pyqQuestion: { with: { paper: true, preparedVariants: true } } } },
      expectedQuestions: { with: { variants: true } },
    },
  });
  if (!topic) return { success: false as const, error: 'Topic not found' };
  return { success: true as const, data: topic };
}

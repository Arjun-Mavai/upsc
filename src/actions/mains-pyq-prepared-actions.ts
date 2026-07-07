'use server';

import { assertAdmin, verifyAuth } from '@/lib/auth';
import { db } from '@/db';
import { mainsPyqPapers, mainsPyqQuestions, mainsPyqPreparedVariants } from '@/db/schema';
import { eq, and, desc, count, inArray, type InferSelectModel } from 'drizzle-orm';
import { isMainsPyqPaperListedRow, whereMainsPyqPaperListed } from '@/lib/mains-pyq-visibility';
import { MAINS_PYQ_PREPARED_VARIANTS_PURGE_PHRASE } from '@/config/mains-pyq-admin';
import { v4 as uuidv4 } from 'uuid';
import { revalidatePath, unstable_cache } from 'next/cache';
import { revalidateTag as originalRevalidateTag } from 'next/cache';
const revalidateTag = originalRevalidateTag as any;
import { buildPyqAnswersBatchUserPrompt, type PyqBatchQuestion } from '@/config/mains-pyq-answers-batch-prompt';
import { extractPasteItems } from '@/lib/mains-pyq-batch-paste';
import { parseMainsPyqPasteJson } from '@/lib/mains-pyq-paste-json-parse';
import type { NormalizedVariant } from '@/lib/mains-pyq-batch-paste';
import { isMainsVaultUnlockedUser } from '@/lib/mains-vault-access';
import { isMainsPyqDemoPaper, pickMainsPyqFreeDemoQuestionIds } from '@/lib/mains-vault-demo';
import { logger } from '@/lib/logger';
import { revalidatePyqOnUpload } from '@/lib/cache';

function variantsMissingStyleLabelHiColumn(message: string) {
  return /no such column[\s\S]*style_label_hi/i.test(message);
}

/** Shape shared by Drizzle relational loads (full + legacy column sets). */
type PyqQuestionWithVariantsRow = {
  id: string;
  part: string;
  unitNumber: number;
  unitTitleHi?: string | null;
  unitTitleEn?: string | null;
  marks: number;
  questionType: string;
  questionNumber: string;
  questionHi: string;
  questionEn: string | null;
  expertInsightsHi: string | null;
  expertInsightsEn: string | null;
  currentAffairsData?: string | null;
  preparedVariants?: Array<{
    variantSlot: number;
    styleLabel: string | null;
    styleLabelHi?: string | null;
    answerHi: string;
    answerEn: string | null;
  }>;
};

function mapPyqPaperPublicQuestions(qs: PyqQuestionWithVariantsRow[]) {
  return qs.map((q) => {
    let currentAffairsData = null;
    if (q.currentAffairsData) {
      try {
        currentAffairsData = JSON.parse(q.currentAffairsData);
      } catch (e) {
        // ignore
      }
    }

    return {
      id: q.id,
      part: q.part,
      unitNumber: q.unitNumber,
      unitTitleHi: q.unitTitleHi ?? null,
      unitTitleEn: q.unitTitleEn ?? null,
      marks: q.marks,
      questionType: q.questionType,
      questionNumber: q.questionNumber,
      questionHi: q.questionHi,
      questionEn: q.questionEn,
      expertInsightsHi: q.expertInsightsHi,
      expertInsightsEn: q.expertInsightsEn,
      currentAffairsData,
      variants: (q.preparedVariants ?? []).map((v) => ({
        slot: v.variantSlot,
        styleLabel: v.styleLabel,
        styleLabelHi: v.styleLabelHi ?? null,
        answerHi: v.answerHi,
        answerEn: v.answerEn,
      })),
    };
  });
}

/** When DB migrations lag behind schema (SQLite reports one missing column per failed SELECT). */
const PYQ_QUESTION_COLS_NO_EXPERT = {
  id: true,
  paperId: true,
  part: true,
  unitNumber: true,
  unitTitleHi: true,
  unitTitleEn: true,
  questionNumber: true,
  marks: true,
  questionType: true,
  questionHi: true,
  questionEn: true,
  displayOrder: true,
} as const;

const PYQ_VARIANT_COLS_LEGACY = {
  id: true,
  pyqQuestionId: true,
  variantSlot: true,
  styleLabel: true,
  structureBreakdown: true,
  answerHi: true,
  answerEn: true,
  updatedAt: true,
} as const;

function normalizeLoadedPyqRows(rows: PyqQuestionWithVariantsRow[]): PyqQuestionWithVariantsRow[] {
  return rows.map((q) => ({
    ...q,
    expertInsightsHi: q.expertInsightsHi ?? null,
    expertInsightsEn: q.expertInsightsEn ?? null,
    preparedVariants: (q.preparedVariants ?? []).map((v) => ({
      ...v,
      styleLabelHi: v.styleLabelHi ?? null,
    })),
  }));
}

async function loadPaperQuestionsWithVariantsRelational(
  pyqPaperId: string
): Promise<PyqQuestionWithVariantsRow[]> {
  try {
    const rows = await db.query.mainsPyqQuestions.findMany({
      where: eq(mainsPyqQuestions.paperId, pyqPaperId),
      orderBy: [mainsPyqQuestions.displayOrder],
      with: {
        preparedVariants: true,
      },
    });
    return normalizeLoadedPyqRows(rows as unknown as PyqQuestionWithVariantsRow[]);
  } catch (err) {
    logger.error('[loadPaperQuestionsWithVariantsRelational] primary query failed', err as Error);
    // Minimal fallback for missing new columns
    const rows = await db.query.mainsPyqQuestions.findMany({
      where: eq(mainsPyqQuestions.paperId, pyqPaperId),
      orderBy: [mainsPyqQuestions.displayOrder],
      columns: PYQ_QUESTION_COLS_NO_EXPERT,
      with: {
        preparedVariants: { columns: PYQ_VARIANT_COLS_LEGACY },
      },
    });
    return normalizeLoadedPyqRows(rows as unknown as PyqQuestionWithVariantsRow[]);
  }
}


// ━━━ CACHED DATA FETCHERS (event-driven invalidation) ━━━

async function attachQuestionCountsToPapers(papers: InferSelectModel<typeof mainsPyqPapers>[]) {
  if (papers.length === 0) return papers.map((p) => ({ ...p, questionCount: 0 }));

  const ids = papers.map((p) => p.id);
  const countRows = await db
    .select({ paperId: mainsPyqQuestions.paperId, questionCount: count() })
    .from(mainsPyqQuestions)
    .where(inArray(mainsPyqQuestions.paperId, ids))
    .groupBy(mainsPyqQuestions.paperId);

  const countByPaper = new Map(countRows.map((r) => [r.paperId, Number(r.questionCount)]));

  return papers.map((p) => ({
    ...p,
    questionCount: countByPaper.get(p.id) ?? 0,
  }));
}

const cachedListMainsPyqPapersLibrarySummary = unstable_cache(
  async () => {
    const orderBy = [desc(mainsPyqPapers.examYear), mainsPyqPapers.paperNumber];
    try {
      const papers = await db.query.mainsPyqPapers.findMany({
        where: whereMainsPyqPaperListed(),
        orderBy,
      });
      return { success: true as const, data: await attachQuestionCountsToPapers(papers) };
    } catch (e1) {
      const m1 = e1 instanceof Error ? e1.message : String(e1);
      logger.error('[listMainsPyqPapersLibrarySummary] filtered query failed', new Error(m1), {
        category: 'db',
      });

      try {
        const papers = await db.query.mainsPyqPapers.findMany({ orderBy });
        const listed = papers.filter(isMainsPyqPaperListedRow);
        return { success: true as const, data: await attachQuestionCountsToPapers(listed) };
      } catch (e2) {
        const m2 = e2 instanceof Error ? e2.message : String(e2);
        logger.error('[listMainsPyqPapersLibrarySummary] unfiltered fallback failed', new Error(m2), {
          category: 'db',
        });
        return {
          success: false as const,
          error: 'fetch_failed' as const,
          detail: `${m1} | fallback: ${m2}`.slice(0, 1200),
        };
      }
    }
  },
  ['mains-pyq-papers-list'],
  { revalidate: 86400, tags: ['mains-pyq-papers-list'] } // 24h fallback, but event-driven revalidation on admin upload
);

const cachedGetMainsPyqPaperPublic = unstable_cache(
  async (pyqPaperId: string) => {
    try {
      const paper = await db.query.mainsPyqPapers.findFirst({
        where: eq(mainsPyqPapers.id, pyqPaperId),
      });
      if (!paper || Boolean(paper.isHidden)) return { success: false as const, error: 'not_found' as const };

      const qs = await loadPaperQuestionsWithVariantsRelational(pyqPaperId);

      return {
        success: true as const,
        data: {
          paper,
          questions: mapPyqPaperPublicQuestions(qs),
        },
      };
    } catch (e) {
      logger.error('[getMainsPyqPaperPublic] failed to fetch paper', e as Error, {
        category: 'content',
        paperId: pyqPaperId,
      });
      return { success: false as const, error: 'fetch_failed' as const };
    }
  },
  ['mains-pyq-paper'],
  { revalidate: 86400, tags: ['mains-pyq-paper'] } // 24h fallback
);

type VariantDbPayload = {
  styleLabel: string | null;
  styleLabelHi: string | null;
  structureBreakdown: string | null;
  answerHi: string;
  answerEn: string | null;
  updatedAt: Date;
};

async function upsertPreparedVariantInTx(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  qid: string,
  slot: 1 | 2,
  payload: VariantDbPayload
) {
  const existing = await tx.query.mainsPyqPreparedVariants.findFirst({
    where: and(
      eq(mainsPyqPreparedVariants.pyqQuestionId, qid),
      eq(mainsPyqPreparedVariants.variantSlot, slot)
    ),
  });

  const base = {
    styleLabel: payload.styleLabel,
    structureBreakdown: payload.structureBreakdown,
    answerHi: payload.answerHi,
    answerEn: payload.answerEn,
    updatedAt: payload.updatedAt,
  };

  const tryApply = async (includeStyleHi: boolean) => {
    const rowPayload = includeStyleHi ? { ...base, styleLabelHi: payload.styleLabelHi } : base;
    if (existing) {
      await tx
        .update(mainsPyqPreparedVariants)
        .set(rowPayload)
        .where(eq(mainsPyqPreparedVariants.id, existing.id));
    } else {
      await tx.insert(mainsPyqPreparedVariants).values({
        id: uuidv4(),
        pyqQuestionId: qid,
        variantSlot: slot,
        ...(rowPayload as typeof rowPayload & { styleLabelHi?: string | null }),
      });
    }
  };

  try {
    await tryApply(true);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!variantsMissingStyleLabelHiColumn(msg)) throw err;
    await tryApply(false);
  }
}

function normalizedVariantToDbPayload(v: NormalizedVariant): VariantDbPayload {
  return {
    styleLabel: v.styleLabel,
    styleLabelHi: v.styleLabelHi,
    structureBreakdown: v.structureBreakdown,
    answerHi: v.answerHi,
    answerEn: v.answerEn,
    updatedAt: new Date(),
  };
}

/** Deletes all model-answer variants. Does not touch `mains_pyq_papers`, `mains_pyq_questions`, expert_insights_* or topic links. */
export async function purgeAllMainsPyqPreparedVariantsConfirm(confirmation: string) {
  try {
    await assertAdmin();
    if (confirmation !== MAINS_PYQ_PREPARED_VARIANTS_PURGE_PHRASE) {
      return { success: false as const, error: 'Confirmation phrase does not match' };
    }
    await db.delete(mainsPyqPreparedVariants);
    revalidatePath('/admin/mains-pyq');
    revalidatePath('/mains/syllabus/pyq-library');
    revalidateTag('mains-pyq-papers-list', 'max');
    revalidateTag('mains-pyq-paper', 'max');
    await revalidatePyqOnUpload();
    return { success: true as const };
  } catch (e) {
    return { success: false as const, error: e instanceof Error ? e.message : String(e) };
  }
}
export async function purgeMainsPyqPreparedVariantsForPaper(paperId: string) {
  try {
    await assertAdmin();
    if (!paperId) return { success: false as const, error: 'No paper ID provided' };
    const paper = await db.query.mainsPyqPapers.findFirst({
      where: eq(mainsPyqPapers.id, paperId),
      columns: { paperNumber: true },
    });
    if (!paper) return { success: false as const, error: 'Paper not found' };

    const qs = await db.select({ id: mainsPyqQuestions.id }).from(mainsPyqQuestions).where(eq(mainsPyqQuestions.paperId, paperId));
    const qIds = qs.map(q => q.id);

    if (qIds.length > 0) {
      await db.delete(mainsPyqPreparedVariants).where(inArray(mainsPyqPreparedVariants.pyqQuestionId, qIds));
    }
    
    revalidatePath('/admin/mains-pyq');
    revalidatePath('/mains/syllabus/pyq-library');
    revalidateTag('mains-pyq-papers-list', 'max');
    revalidateTag('mains-pyq-paper', 'max');
    await revalidatePyqOnUpload(paper.paperNumber);
    return { success: true as const };
  } catch (e) {
    return { success: false as const, error: e instanceof Error ? e.message : String(e) };
  }
}


export async function adminGetPyqPrepOverview() {
  try {
    await assertAdmin();
    const [tq] = await db.select({ n: count() }).from(mainsPyqQuestions);
    const grouped = await db
      .select({
        qid: mainsPyqPreparedVariants.pyqQuestionId,
        c: count(),
      })
      .from(mainsPyqPreparedVariants)
      .groupBy(mainsPyqPreparedVariants.pyqQuestionId);

    const withTwo = grouped.filter((g) => Number(g.c) >= 2).length;
    const withAny = grouped.filter((g) => Number(g.c) >= 1).length;

    return {
      success: true as const,
      data: {
        totalQuestions: Number(tq?.n ?? 0),
        /** Stems that have variant slot 1 and 2 filled */
        questionsWithTwoVariants: withTwo,
        /** Stems that have at least one variant row */
        questionsWithAnyVariant: withAny,
      },
    };
  } catch (e) {
    return { success: false as const, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function adminGetPyqPaperPrepDetail(pyqPaperId: string) {
  try {
    await assertAdmin();
    const paper = await db.query.mainsPyqPapers.findFirst({
      where: eq(mainsPyqPapers.id, pyqPaperId),
    });
    if (!paper) return { success: false as const, error: 'Paper not found' };

    const qs = await loadPaperQuestionsWithVariantsRelational(pyqPaperId);

    const rows = qs.map((q) => ({
      id: q.id,
      part: q.part,
      unitNumber: q.unitNumber,
      questionNumber: q.questionNumber,
      marks: q.marks,
      questionType: q.questionType,
      previewHi: q.questionHi.slice(0, 160),
      previewEn: q.questionEn ? q.questionEn.slice(0, 160) : '',
      variantCount: q.preparedVariants?.length ?? 0,
      slots: (q.preparedVariants ?? []).map((v) => v.variantSlot),
    }));

    const done = rows.filter((r) => r.variantCount >= 2).length;

    return {
      success: true as const,
      data: {
        paper,
        progress: { total: rows.length, done },
        questions: rows,
      },
    };
  } catch (e) {
    return { success: false as const, error: e instanceof Error ? e.message : String(e) };
  }
}

/**
 * Next N questions from the work pool, offset by parallel batch slot.
 * Pool = incomplete (<2 variants) when any exist, else full paper (re-edit / regen).
 * Batch tab k (0-based index) → slice [k * batchSize, (k+1) * batchSize) so tabs 1–4 don’t duplicate the same 8 stems.
 */
async function selectBatchQuestions(
  pyqPaperId: string,
  batchSize: number,
  batchSlotIndex = 0
): Promise<PyqBatchQuestion[]> {
  const qs = await loadPaperQuestionsWithVariantsRelational(pyqPaperId);

  const incomplete = qs.filter((q) => (q.preparedVariants?.length ?? 0) < 2);
  const pool = incomplete.length ? incomplete : qs;
  const slot = Math.max(0, Math.floor(batchSlotIndex));
  const start = slot * batchSize;
  const pick = pool.slice(start, start + batchSize);

  return pick.map((q) => ({
    id: q.id,
    part: q.part,
    unitNumber: q.unitNumber,
    questionNumber: q.questionNumber,
    marks: q.marks,
    questionType: q.questionType,
    questionHi: q.questionHi,
    questionEn: q.questionEn ?? null,
  }));
}

export async function adminBuildPyqAnswersBatchPrompt(pyqPaperId: string, batchSize = 8, batchSlotIndex = 0, targetQuestionId?: string) {
  try {
    await assertAdmin();
    const paper = await db.query.mainsPyqPapers.findFirst({
      where: eq(mainsPyqPapers.id, pyqPaperId),
    });
    if (!paper) return { success: false as const, error: 'Paper not found' };

    const slot = Math.max(0, Math.floor(batchSlotIndex));
    let questions: PyqBatchQuestion[] = [];

    if (targetQuestionId) {
      const q = await db.query.mainsPyqQuestions.findFirst({
        where: and(eq(mainsPyqQuestions.id, targetQuestionId), eq(mainsPyqQuestions.paperId, pyqPaperId)),
      });
      if (!q) return { success: false as const, error: 'Target question not found' };
      questions = [{
        id: q.id,
        part: q.part,
        unitNumber: q.unitNumber,
        questionNumber: q.questionNumber,
        marks: q.marks,
        questionType: q.questionType,
        questionHi: q.questionHi,
        questionEn: q.questionEn ?? null,
      }];
    } else {
      questions = await selectBatchQuestions(pyqPaperId, batchSize, slot);
    }
    if (questions.length === 0) {
      const qs = await loadPaperQuestionsWithVariantsRelational(pyqPaperId);
      if (qs.length === 0) {
        return { success: false as const, error: 'No questions in this paper' };
      }
      const incomplete = qs.filter((q) => (q.preparedVariants?.length ?? 0) < 2);
      const poolLen = incomplete.length ? incomplete.length : qs.length;
      return {
        success: false as const,
        error:
          slot === 0
            ? 'No questions in this paper'
            : `Batch ${slot + 1}: no stems in this slice (only ${poolLen} in pool; earlier batches cover 1–${slot * batchSize}). Generate from Batch 1 or wait until more incompletes exist.`,
      };
    }

    const prompt = buildPyqAnswersBatchUserPrompt({
      paperNumber: paper.paperNumber,
      examYear: paper.examYear,
      examLabel: paper.examLabel,
      questions,
    });

    return {
      success: true as const,
      prompt,
      meta: {
        questionIds: questions.map((q) => q.id),
        count: questions.length,
        batchSlot: slot + 1,
        batchOffset: slot * batchSize,
      },
    };
  } catch (e) {
    return { success: false as const, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function adminPastePyqAnswersBatchJson(pyqPaperId: string, rawText: string) {
  try {
    await assertAdmin();
    const paper = await db.query.mainsPyqPapers.findFirst({
      where: eq(mainsPyqPapers.id, pyqPaperId),
    });
    if (!paper) return { success: false as const, error: 'Paper not found' };

    const parseResult = parseMainsPyqPasteJson(rawText);
    if (!parseResult.ok) {
      const MAX = 6500;
      const snippet = parseResult.context ? `\n\n${parseResult.context}` : '';
      const body = `Invalid JSON: ${parseResult.message}${snippet}`;
      return {
        success: false as const,
        error: body.length > MAX ? `${body.slice(0, MAX)}\n… [error truncated for UI; full details in server logs]` : body,
      };
    }
    const parsed = parseResult.value;
    let warnings: string[] = [...(parseResult.recoveryNotes ?? [])];

    const extracted = extractPasteItems(parsed);
    if (!Array.isArray(extracted)) {
      return { success: false as const, error: extracted.error };
    }

    let variantsWritten = 0;
    let insightQuestionsTouched = 0;

    await db.transaction(async (tx) => {
      for (const item of extracted) {
        const qid = item.questionId;
        const belongs = await tx.query.mainsPyqQuestions.findFirst({
          where: and(eq(mainsPyqQuestions.id, qid), eq(mainsPyqQuestions.paperId, pyqPaperId)),
        });
        if (!belongs) {
          warnings.push(`Skipped unknown question_id (wrong paper or typo): ${qid.slice(0, 12)}…`);
          continue;
        }

        const insightPatch: Partial<typeof mainsPyqQuestions.$inferInsert> = {};

        if (item.expertPatch && (item.expertPatch.hi !== undefined || item.expertPatch.en !== undefined)) {
          if (item.expertPatch.hi !== undefined) {
            insightPatch.expertInsightsHi =
              item.expertPatch.hi != null && item.expertPatch.hi.length > 0 ? item.expertPatch.hi : null;
          }
          if (item.expertPatch.en !== undefined) {
            insightPatch.expertInsightsEn =
              item.expertPatch.en != null && item.expertPatch.en.length > 0 ? item.expertPatch.en : null;
          }
        }

        if (item.valueAdditionPatch && Object.keys(item.valueAdditionPatch).length > 0) {
          insightPatch.currentAffairsData = JSON.stringify(item.valueAdditionPatch);
        }

        if (Object.keys(insightPatch).length > 0) {
          await tx.update(mainsPyqQuestions).set(insightPatch).where(eq(mainsPyqQuestions.id, qid));
          insightQuestionsTouched++;
        }

        for (const v of item.variants) {
          await upsertPreparedVariantInTx(tx, qid, v.slot, normalizedVariantToDbPayload(v));
          variantsWritten++;
        }
      }
    });

    revalidatePath('/admin/mains-pyq');
    revalidatePath('/mains/syllabus/pyq-library');
    revalidateTag('mains-pyq-papers-list', 'max');
    revalidateTag('mains-pyq-paper', 'max');
    await revalidatePyqOnUpload(paper.paperNumber);

    const upserted = variantsWritten + insightQuestionsTouched;
    return {
      success: true as const,
      upserted,
      variantsUpserted: variantsWritten,
      insightQuestionsUpdated: insightQuestionsTouched,
      warnings: warnings.slice(0, 40),
      warningCount: warnings.length,
    };
  } catch (e) {
    return {
      success: false as const,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

/** Student / library: one imported paper with questions + variants. */
export async function getMainsPyqPaperPublic(pyqPaperId: string) {
  const result = await cachedGetMainsPyqPaperPublic(pyqPaperId);
  if (!result.success) return result;

  const user = await verifyAuth();
  const vaultUnlocked = isMainsVaultUnlockedUser(user);

  if (vaultUnlocked) return result;

  const { paper, questions } = result.data;
  const isDemo = isMainsPyqDemoPaper(paper.examYear, paper.paperNumber);

  if (!isDemo) {
    const sanitized = questions.map((q) => ({
      ...q,
      questionHi: '',
      questionEn: null,
      expertInsightsHi: null,
      expertInsightsEn: null,
      currentAffairsData: null,
      variants: [] as typeof q.variants,
      isLocked: true as const,
    }));
    return { success: true as const, data: { paper, questions: sanitized } };
  }

  const freeIds = pickMainsPyqFreeDemoQuestionIds(questions);
  const sanitized = questions.map((q) => {
    const isPreview = freeIds.has(q.id);
    return {
      ...q,
      expertInsightsHi: isPreview ? q.expertInsightsHi : null,
      expertInsightsEn: isPreview ? q.expertInsightsEn : null,
      variants: isPreview ? q.variants : [],
      isLocked: !isPreview,
    };
  });

  return { success: true as const, data: { paper, questions: sanitized } };
}


export type MainsPyqLibraryPaperRow = InferSelectModel<typeof mainsPyqPapers> & { questionCount: number };

export type MainsPyqPaperListResponse =
  | { success: true; data: MainsPyqLibraryPaperRow[] }
  | { success: false; error: 'fetch_failed'; detail?: string };

export async function listMainsPyqPapersLibrarySummary(): Promise<MainsPyqPaperListResponse> {
  return cachedListMainsPyqPapersLibrarySummary();
}

/** 🕒 TRACK RECENT PYQ BATCH ACTIVITY
 * Bhai, ye admin ko batayega ki hal hi mein kis paper ke answers paste huye hain.
 */
export async function adminGetRecentMainsPyqActivity() {
  try {
    await assertAdmin();
    const rows = await db
      .select({
        id: mainsPyqPreparedVariants.id,
        updatedAt: mainsPyqPreparedVariants.updatedAt,
        variantSlot: mainsPyqPreparedVariants.variantSlot,
        questionHi: mainsPyqQuestions.questionHi,
        questionEn: mainsPyqQuestions.questionEn,
        paperNumber: mainsPyqPapers.paperNumber,
        examYear: mainsPyqPapers.examYear,
      })
      .from(mainsPyqPreparedVariants)
      .innerJoin(mainsPyqQuestions, eq(mainsPyqQuestions.id, mainsPyqPreparedVariants.pyqQuestionId))
      .innerJoin(mainsPyqPapers, eq(mainsPyqPapers.id, mainsPyqQuestions.paperId))
      .orderBy(desc(mainsPyqPreparedVariants.updatedAt))
      .limit(10);

    return { success: true as const, data: rows };
  } catch (error) {
    console.error('adminGetRecentMainsPyqActivity', error);
    return { success: false as const, error: 'Failed to fetch activity' };
  }
}


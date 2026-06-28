/**
 * Robust parsing / normalization for admin paste of mains_pyq_answers_batch JSON.
 */

export type NormalizedPasteItem = {
  questionId: string;
  /** Present only when JSON included these keys (allows partial update). */
  expertPatch?: { hi?: string | null; en?: string | null };
  valueAdditionPatch?: Record<string, unknown>;
  variants: NormalizedVariant[];
};

export type NormalizedVariant = {
  slot: 1 | 2;
  answerHi: string;
  answerEn: string | null;
  styleLabel: string | null;
  styleLabelHi: string | null;
  structureBreakdown: string | null;
};

export function stripJsonFence(s: string): string {
  return s
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

function hasQuestionIdShape(o: Record<string, unknown>): boolean {
  const id = o.question_id ?? o.questionId;
  return typeof id === 'string' ? id.trim().length > 0 : typeof id === 'number';
}

/** Accept `items` array, bare array of items, or accidental `{ results: [] }`. */
export function extractPasteItems(root: unknown): NormalizedPasteItem[] | { error: string } {
  if (root == null) return { error: 'Empty JSON.' };
  if (typeof root !== 'object') return { error: 'JSON root must be an object or array.' };

  let rawItems: unknown[];
  if (Array.isArray(root)) {
    rawItems = root;
  } else {
    const obj = root as Record<string, unknown>;
    const items = obj.items ?? obj.results ?? obj.data;
    if (!Array.isArray(items)) return { error: 'Expected top-level `items` array or a JSON array of batch rows.' };
    rawItems = items;
  }

  const out: NormalizedPasteItem[] = [];
  for (let i = 0; i < rawItems.length; i++) {
    const it = rawItems[i];
    if (!it || typeof it !== 'object') continue;
    const row = it as Record<string, unknown>;
    if (!hasQuestionIdShape(row)) continue;

    const questionId = String(row.question_id ?? row.questionId ?? '').trim();
    const variantsRaw = row.variants;
    const variants: NormalizedVariant[] = [];

    if (Array.isArray(variantsRaw)) {
      for (const v of variantsRaw) {
        if (!v || typeof v !== 'object') continue;
        const vr = v as Record<string, unknown>;
        const slotNum = Number(vr.variant_slot ?? vr.variantSlot ?? 0);
        const slot = slotNum === 2 ? 2 : slotNum === 1 ? 1 : (0 as 0);
        if (slot !== 1 && slot !== 2) continue;

        const answerHi = coerceLongText(vr.answer_hi ?? vr.answerHi).trim();
        if (!answerHi) continue;

        const answerEnRaw = coerceLongText(vr.answer_en ?? vr.answerEn).trim();
        const styleEnRaw = vr.style_label_en ?? vr.styleLabelEn ?? vr.style_label ?? vr.styleLabel;
        const styleHiRaw = vr.style_label_hi ?? vr.styleLabelHi;

        variants.push({
          slot,
          answerHi,
          answerEn: answerEnRaw.length ? answerEnRaw : null,
          styleLabel:
            styleEnRaw != null && String(styleEnRaw).trim() ? String(styleEnRaw).trim() : null,
          styleLabelHi:
            styleHiRaw != null && String(styleHiRaw).trim() ? String(styleHiRaw).trim() : null,
          structureBreakdown:
            vr.structure_breakdown != null ? String(vr.structure_breakdown).slice(0, 50_000) : null,
        });
      }
    }

    const eiHiRaw = row.expert_insights_hi ?? row.expertInsightsHi;
    const eiEnRaw = row.expert_insights_en ?? row.expertInsightsEn;

    let expertPatch: { hi?: string | null; en?: string | null } | undefined;
    if (eiHiRaw !== undefined || eiEnRaw !== undefined) {
      expertPatch = {};
      if (eiHiRaw !== undefined) {
        expertPatch.hi = eiHiRaw == null ? null : coerceLongText(eiHiRaw).trim() || null;
      }
      if (eiEnRaw !== undefined) {
        expertPatch.en = eiEnRaw == null ? null : coerceLongText(eiEnRaw).trim() || null;
      }
    }

    let valueAdditionPatch: Record<string, unknown> | undefined;
    const hasValueAdd = row.value_addition_kit_en !== undefined || row.value_addition_kit_hi !== undefined || row.current_affairs_data_en !== undefined || row.current_affairs_data_hi !== undefined;
    if (hasValueAdd) {
      valueAdditionPatch = {};
      if (row.value_addition_kit_en !== undefined) valueAdditionPatch.value_addition_kit_en = row.value_addition_kit_en;
      if (row.value_addition_kit_hi !== undefined) valueAdditionPatch.value_addition_kit_hi = row.value_addition_kit_hi;
      if (row.current_affairs_data_en !== undefined) valueAdditionPatch.current_affairs_data_en = row.current_affairs_data_en;
      if (row.current_affairs_data_hi !== undefined) valueAdditionPatch.current_affairs_data_hi = row.current_affairs_data_hi;
    }

    const hasAny =
      variants.length > 0 || (expertPatch !== undefined && Object.keys(expertPatch).length > 0) || (valueAdditionPatch !== undefined && Object.keys(valueAdditionPatch).length > 0);
    if (!hasAny) continue;

    out.push({
      questionId,
      ...(expertPatch ? { expertPatch } : {}),
      ...(valueAdditionPatch ? { valueAdditionPatch } : {}),
      variants,
    });
  }

  if (out.length === 0) {
    return {
      error:
        'No usable rows: need question_id and (variants with answer_hi) and/or expert_insights_* fields.',
    };
  }

  return mergePasteItemsByQuestionId(out);
}

/** Later rows override earlier for same variant_slot / insight keys (AI sometimes duplicates items). */
function mergePasteItemsByQuestionId(rows: NormalizedPasteItem[]): NormalizedPasteItem[] {
  const m = new Map<string, NormalizedPasteItem>();

  const mergeExperts = (
    prevEp: NormalizedPasteItem['expertPatch'],
    rowEp: NormalizedPasteItem['expertPatch']
  ): NormalizedPasteItem['expertPatch'] => {
    if (!prevEp && !rowEp) return undefined;
    return { ...(prevEp ?? {}), ...(rowEp ?? {}) };
  };

  const mergeVariants = (a: NormalizedVariant[], b: NormalizedVariant[]): NormalizedVariant[] => {
    const bySlot = new Map<number, NormalizedVariant>();
    for (const v of a) bySlot.set(v.slot, v);
    for (const v of b) bySlot.set(v.slot, v);
    return [1, 2].flatMap((s) => (bySlot.has(s) ? [bySlot.get(s)!] : []));
  };

  for (const row of rows) {
    const prev = m.get(row.questionId);
    if (!prev) {
      m.set(row.questionId, { ...row });
      continue;
    }
    const prevEp = prev.expertPatch;
    const rowEp = row.expertPatch;
    const ep = !prevEp && !rowEp ? undefined : { ...(prevEp ?? {}), ...(rowEp ?? {}) };

    const prevVap = prev.valueAdditionPatch;
    const rowVap = row.valueAdditionPatch;
    const vap = !prevVap && !rowVap ? undefined : { ...(prevVap ?? {}), ...(rowVap ?? {}) };

    m.set(row.questionId, {
      questionId: row.questionId,
      ...(ep && (ep.hi !== undefined || ep.en !== undefined) ? { expertPatch: ep } : {}),
      ...(vap && Object.keys(vap).length > 0 ? { valueAdditionPatch: vap } : {}),
      variants: mergeVariants(prev.variants, row.variants),
    });
  }
  return [...m.values()];
}

/** Safe string for markdown answers / insights (cap size). */
export function coerceLongText(v: unknown, max = 800_000): string {
  if (v == null) return '';
  if (typeof v === 'string') return v.length > max ? `${v.slice(0, max)}\n… [truncated]` : v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  try {
    const s = JSON.stringify(v);
    return s.length > max ? `${s.slice(0, max)}…` : s;
  } catch {
    return '';
  }
}

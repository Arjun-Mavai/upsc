import JSON5 from 'json5';
import { jsonrepair } from 'jsonrepair';
import { stripJsonFence } from '@/lib/mains-pyq-batch-paste';

/** Remove BOM / NULLs LLMs sometimes paste. */
function sanitizeJsonInput(raw: string): string {
  return raw
    .replace(/^\uFEFF/, '')
    .replace(/\u0000/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');
}

/**
 * Models often paste English like `The answer "focuses on…"` inside a JSON string → breaks RFC JSON.
 * After `opening "`, escape interior ASCII `"` until the structural closer (",", "}", "]" after whitespace).
 */
function isLikelyJsonDoubleQuoteCloser(json: string, quoteIdx: number): boolean {
  let j = quoteIdx + 1;
  while (j < json.length && ' \t\n\r\u00A0\u200B'.includes(json[j]!)) j++;
  if (j >= json.length) return true;
  const c = json[j]!;
  return c === ',' || c === '}' || c === ']';
}

/** Keys whose values are often long prose / markdown (where stray `"` is common). */
export function repairEscapedJsonObjectKeys(raw: string): string {
  // FIRST REPAIR PASS: Handle AI hallucinations where object keys are escaped
  // E.g., "question_id\": becomes "question_id":
  // This is a pre-pass before interior quote repair to ensure keys are in canonical form
  return raw.replace(
    /(^|[\{,\[]\s*)\\*\"([A-Za-z0-9_:-]+)\\*\"\s*[:\\]+\s*/g,
    (_match, prefix: string, key: string) => `${prefix}"${key}": `
  );
}

/** Keys whose values are often long prose / markdown (where stray `"` is common). */
export function repairInteriorDoubleQuotesInMappedStrings(raw: string): string {
  // SECOND REPAIR PASS: Fix interior unescaped quotes inside string values
  // This comes AFTER repairEscapedJsonObjectKeys() to ensure keys are canonical.
  // 
  // WHY TWO PASSES?
  // 1. First pass (repairEscapedJsonObjectKeys) normalizes malformed keys like \"key\": → "key":
  // 2. Second pass (this function) assumes keys are clean and focuses on interior quote issues
  //    e.g., "answer_hi": "The teacher said "hello" in class" → fix the interior "hello"
  //
  // INTERACTION GUARANTEE:
  // - First pass uses regex on key names only (never touches values)
  // - Second pass operates after first pass succeeds, so keys are guaranteed clean
  // - This prevents the regex patterns from interfering with each other
  
  // Keys whose values are often long prose / markdown (where stray " is common).
  // We handle both clean quotes "key": and escaped hallucinations \"key\": or even "key\": (missing start escape)
  // We also handle cases where the AI forgets the colon entirely!
  const KEY_RE =
    /\s*\\*"(question_id|marks|expert_insights_en|expert_insights_hi|answer_hi|answer_en|style_label_hi|style_label_en|style_label|structure_breakdown|cognitive_intro_hi|cognitive_intro_en|concept_hi|concept_en|syllabus_grasp_hi|syllabus_grasp_en|expert_strategy_hi|expert_strategy_en|pyq_trend_analysis_hi|pyq_trend_analysis_en|desi_analogy_hi|desi_analogy_en|authentic_source_citation_hi|authentic_source_citation_en|psychological_memory_hook_hi|psychological_memory_hook_en|visual_infographic_cue_hi|visual_infographic_cue_en|examiner_trap_hi|examiner_trap_en|topper_x_factor_hi|topper_x_factor_en|expert_evaluator_lens_applied|text|stem|hint|term|dimension_name|question_hi|question_en|paper_title_hi|paper_title_en|part_title_hi|part_title_en|unit_title_hi|unit_title_en|type|facts_for_prelims|pyq_pre_examples|potential_mains_questions|practice_questions|key_terms_hi|key_terms_en|interlinking_dots_hi|interlinking_dots_en|multidimensional_interlinking_hi|multidimensional_interlinking_en|emoji)\\*"\s*[:\\]*\s*/g;

  // Pre-pass: Fix common hallucinated escaped key patterns like \"key\": or "key\":
  // and handle cases where the colon is missing or escaped.
  const s = repairEscapedJsonObjectKeys(raw);

  let out = '';
  let cursor = 0;

  function repairSingleString(startIdx: number): { repaired: string; endIdx: number } {
    let i = startIdx;
    let res = '';

    // Handle hallucinated \" opening
    if (s[i] === '\\' && s[i+1] === '"') {
      res = '"';
      i += 2;
    } else if (s[i] === '"') {
      res = '"';
      i++;
    } else {
      return { repaired: '', endIdx: startIdx };
    }

    let escaped = false;
    let foundCloser = false;

    while (i < s.length) {
      const ch = s[i]!;
      if (escaped) {
        res += ch;
        escaped = false;
        i++;
        continue;
      }
      if (ch === '\\') {
        res += '\\';
        escaped = true;
        i++;
        continue;
      }
      if (ch === '"') {
        if (isLikelyJsonDoubleQuoteCloser(s, i)) {
          res += '"';
          i++;
          foundCloser = true;
          break;
        } else {
          res += '\\"';
          i++;
          continue;
        }
      }
      res += ch;
      i++;
    }

    if (!foundCloser) {
      return { repaired: s.slice(startIdx, i), endIdx: i };
    }
    return { repaired: res, endIdx: i };
  }

  function repairStringArray(startIdx: number): { repaired: string; endIdx: number } {
    let i = startIdx;
    let res = '[';
    i++; // Skip '['

    while (i < s.length) {
      const ch = s[i]!;
      if (ch === ']') {
        res += ']';
        i++;
        break;
      }
      
      // If it starts a string element
      if (ch === '"' || (ch === '\\' && s[i+1] === '"')) {
        const { repaired, endIdx } = repairSingleString(i);
        res += repaired;
        i = endIdx;
        continue;
      }
      
      res += ch;
      i++;
    }
    return { repaired: res, endIdx: i };
  }

  while (cursor < s.length) {
    KEY_RE.lastIndex = cursor;
    const m = KEY_RE.exec(s);
    if (!m) {
      out += s.slice(cursor);
      break;
    }

    // Match is found. Normalize the key to clean "key": format
    const keyName = m[1];
    out += s.slice(cursor, m.index) + `"${keyName}": `;
    let i = m.index + m[0].length;

    let ws = '';
    while (i < s.length && ' \t\n\r'.includes(s[i]!)) {
      ws += s[i];
      i++;
    }

    // Check for " or \" opening the value, or [ opening an array
    if (i < s.length && (s[i] === '"' || (s[i] === '\\' && s[i+1] === '"'))) {
      out += ws;
      const { repaired, endIdx } = repairSingleString(i);
      out += repaired;
      cursor = endIdx;
    } else if (i < s.length && s[i] === '[') {
      out += ws;
      const { repaired, endIdx } = repairStringArray(i);
      out += repaired;
      cursor = endIdx;
    } else {
      out += ws;
      cursor = i;
    }
  }

  return out;
}

/** Closing index (inclusive) of `{`/`[` opened at `startIdx`, or null if malformed. */
export function scanBalancedClosingFrom(s: string, startIdx: number): number | null {
  const ch = s[startIdx];
  if (ch !== '{' && ch !== '[') return null;
  const pairs: Record<string, string> = { '{': '}', '[': ']' };
  const stack: string[] = [];
  let inStr = false;
  let escape = false;

  for (let i = startIdx; i < s.length; i++) {
    const c = s[i]!;
    if (inStr) {
      if (escape) {
        escape = false;
        continue;
      }
      if (c === '\\') {
        escape = true;
        continue;
      }
      if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') {
      inStr = true;
      continue;
    }

    if (c === '{' || c === '[') {
      stack.push(pairs[c]!);
      continue;
    }
    if (c === '}' || c === ']') {
      const want = stack[stack.length - 1];
      if (want !== c) return null;
      stack.pop();
      if (stack.length === 0) return i;
    }
  }
  return null;
}

export function sliceFirstBalancedTopLevelJson(input: string): string | null {
  const trimmed = input.trimStart();
  let start = -1;
  for (let i = 0; i < trimmed.length; i++) {
    const c = trimmed[i]!;
    if (c === '{' || c === '[') {
      start = i;
      break;
    }
  }
  if (start < 0) return null;
  const end = scanBalancedClosingFrom(trimmed, start);
  if (end === null) return null;
  return trimmed.slice(start, end + 1);
}

/** Extract `/position\s+(\d+)/i`-style offsets from parser errors. */
function parseErrorCharIndex(message: string): number | undefined {
  const m = message.match(/\bposition\s+(\d+)/i);
  if (m) return Number.parseInt(m[1]!, 10);
  const m2 = message.match(/\bat\s+(\d+)\s*[:-]/i);
  if (m2) return Number.parseInt(m2[1]!, 10);
  return undefined;
}

export function jsonParseSnippetContext(
  source: string,
  position: number | undefined,
  radius = 160
): string {
  const clamped =
    position !== undefined && Number.isFinite(position) && position >= 0
      ? Math.min(Math.floor(position), Math.max(0, source.length))
      : Math.min(400, Math.max(0, source.length - 1));
  const lo = Math.max(0, clamped - radius);
  const hi = Math.min(source.length, clamped + radius);
  const chunk = source.slice(lo, hi);
  const caretPos = Math.min(Math.max(0, clamped - lo), 400);
  const line = `${' '.repeat(caretPos)}^ (near byte ${clamped})`;
  return `--- excerpt bytes ${lo}–${hi} of ${source.length} ---\n${chunk}\n${line}`;
}

export type PyqPasteJsonParseResult =
  | { ok: true; value: unknown; sourceUsed: string; recoveryNotes?: string[] }
  | {
      ok: false;
      message: string;
      sourceUsed: string;
      position?: number;
      context?: string;
    };

const QUESTION_ITEM_HEAD = /\{\s*"question_id"\s*:/g;

/** Cut each `{ "question_id": … }` object and parse independently (whole-file breaks on unescaped " in long strings). */
function extractBatchQuestionItemSlices(payload: string): string[] {
  const slices: string[] = [];
  const re = new RegExp(QUESTION_ITEM_HEAD.source, 'g');
  let m: RegExpExecArray | null;
  while ((m = re.exec(payload)) !== null) {
    const open = m.index;
    const close = scanBalancedClosingFrom(payload, open);
    if (close === null) continue;
    slices.push(payload.slice(open, close + 1));
    re.lastIndex = close + 1;
  }
  return slices;
}

function parseOneBatchItemSlice(slice: string): unknown | null {
  const patched = repairInteriorDoubleQuotesInMappedStrings(slice);
  const tries = [
    () => JSON.parse(patched),
    () => JSON.parse(jsonrepair(patched)),
    () => JSON5.parse(patched),
    () => JSON5.parse(jsonrepair(patched)),
  ];
  for (const t of tries) {
    try {
      return t();
    } catch {
      /* continue */
    }
  }
  return null;
}

function tryRecoverItemsFromBrokenBatch(payload: string): {
  value: unknown;
  notes: string[];
} | null {
  const slices = extractBatchQuestionItemSlices(payload);
  if (slices.length === 0) return null;

  const notes: string[] = [];
  const items: unknown[] = [];
  for (let i = 0; i < slices.length; i++) {
    const row = parseOneBatchItemSlice(slices[i]!);
    if (row === null) {
      notes.push(
        `Row ${i + 1}/${slices.length}: still invalid — usually an unescaped " inside expert_insights_* or answer_*; fix or omit that row from paste.`
      );
      continue;
    }
    items.push(row);
  }
  if (items.length === 0) return null;

  notes.unshift(`Row-wise recovery: parsed ${items.length}/${slices.length} question blocks (skipped rows not saved).`);
  return {
    value: {
      schema_version: 'mains_pyq_answers_batch_v2',
      items,
    },
    notes,
  };
}

/**
 * Multi-step parse for admin-pasted batch JSON (fences, junk after JSON, jsonrepair).
 */
export function parseMainsPyqPasteJson(raw: string): PyqPasteJsonParseResult {
  let s = sanitizeJsonInput(stripJsonFence(raw)).trim();
  if (!s.length) {
    return { ok: false, message: 'Empty paste after stripping markdown fences.', sourceUsed: s };
  }

  s = repairInteriorDoubleQuotesInMappedStrings(s);

  const attempts: Array<{ label: string; get: () => string }> = [
    { label: 'raw', get: () => s },
    { label: 'balanced_slice', get: () => sliceFirstBalancedTopLevelJson(s) ?? s },
  ];

  const tried = new Set<string>();
  let lastErr = 'Unknown parse error';
  let lastSource = s;

  for (const { label, get } of attempts) {
    const candidate = get();
    if (tried.has(candidate)) continue;
    tried.add(candidate);
    lastSource = candidate;

    const steps: Array<() => unknown> = [
      () => JSON.parse(candidate),
      () => JSON.parse(jsonrepair(candidate)),
      () => JSON5.parse(candidate),
      () => JSON5.parse(jsonrepair(candidate)),
    ];

    for (const parse of steps) {
      try {
        const value = parse();
        if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
          console.log('[parseMainsPyqPasteJson] OK via', label, 'len=', candidate.length);
        }
        return { ok: true, value, sourceUsed: candidate };
      } catch (e) {
        lastErr = e instanceof Error ? e.message : String(e);
      }
    }
  }

  const recovered = tryRecoverItemsFromBrokenBatch(s);
  if (recovered) {
    if (typeof process !== 'undefined') {
      console.warn('[parseMainsPyqPasteJson] RECOVERED via per-question slices', recovered.notes);
    }
    return {
      ok: true,
      value: recovered.value,
      sourceUsed: s,
      recoveryNotes: recovered.notes,
    };
  }

  const pos = parseErrorCharIndex(lastErr);
  const context =
    pos !== undefined ? jsonParseSnippetContext(lastSource, pos) : jsonParseSnippetContext(lastSource, 0, 280);

  if (typeof process !== 'undefined') {
    const head = lastSource.slice(0, 200).replace(/\n/g, '\\n');
    const tail = lastSource.slice(Math.max(0, lastSource.length - 160)).replace(/\n/g, '\\n');
    console.error('[parseMainsPyqPasteJson] FAILED', {
      rawLen: raw.length,
      usedLen: lastSource.length,
      error: lastErr,
      position: pos,
      head,
      tail,
    });
    console.error('[parseMainsPyqPasteJson] context\n', context);

  }

  return {
    ok: false,
    message: lastErr,
    sourceUsed: lastSource,
    position: pos,
    context,
  };
}

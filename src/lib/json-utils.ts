import { jsonrepair } from 'jsonrepair';
import JSON5 from 'json5';

const INVISIBLE_CHARS =
  /[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F-\u009F\u200B-\u200D\uFEFF]/g;

/** Strip BOM / zero-width / other invisible chars that break parsers */
function stripInvisible(s: string): string {
  return s.replace(INVISIBLE_CHARS, '');
}

/**
 * Strip fences / invisible chars. Do **not** replace typographic "smart" quotes globally — that can
 * turn a valid inner “inch”/quote in an explanation string into a raw `"` and break the JSON
 * (exactly: "Expected ',' or '}' after property value" at a later offset).
 */
export function minimalClean(jsonString: string): string {
  let cleaned = stripInvisible(jsonString.trim());
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '');
  return cleaned.trim();
}

/**
 * Some LLM outputs use typographic “ ” or « » instead of ASCII " for nested emphasis.
 * Used only as an extra lenient-parse *candidate* (not in `minimalClean` itself) so valid JSON
 * that truly contains U+201C as data is not altered when an earlier `JSON.parse` already succeeds.
 */
function replaceUnicodeDoubleQuotesForLenientJson(s: string): string {
  return s.replace(/[\u201C\u201D\u201E\u00AB\u00BB]/g, '"');
}

/**
 * LLM output often has raw \\n inside JSON string values (or Unicode line/paragraph sep).
 * JSON.parse requires those to be `\\` + `n`, not real newlines. Walk as JSON would for strings:
 * not inside strings = copy as-is; inside = escape U+0000–U+001F and line separators unless already after `\\`.
 */
export function fixUnescapedStringControlCharsInJsonText(input: string): string {
  const s = input;
  let out = '';
  let i = 0;
  let inString = false;
  let escape = false;
  while (i < s.length) {
    const c = s[i];
    if (inString) {
      if (escape) {
        out += c;
        escape = false;
        i++;
        continue;
      }
      if (c === '\\') {
        out += c;
        escape = true;
        i++;
        continue;
      }
      if (c === '"') {
        inString = false;
        out += c;
        i++;
        continue;
      }
      if (c === '\n' || c === '\r') {
        if (c === '\r' && s[i + 1] === '\n') {
          out += '\\n';
          i += 2;
        } else {
          out += '\\n';
          i += 1;
        }
        continue;
      }
      if (c === '\t') {
        out += '\\t';
        i++;
        continue;
      }
      if (c === '\u2028' || c === '\u2029') {
        out += '\\n';
        i++;
        continue;
      }
      const code = c.charCodeAt(0);
      if (code < 0x20) {
        out += `\\u${code.toString(16).padStart(4, '0')}`;
        i++;
        continue;
      }
      out += c;
      i++;
      continue;
    }
    if (c === '"') inString = true;
    out += c;
    i++;
  }
  return out;
}

const KNOWN_JSON_OBJECT_KEY_NAMES = new Set(
  // Classic bulk, full PYQ upload, and common Gemini keys — used only to decide: unescaped " closes a value vs inner quote
  'questionId id questionText questionTextEn options correctAnswer type year paper subject matchPairs marks negativeMarks idealTime'
    .split(/\s+/)
    .filter(Boolean)
    .concat([
      'explanation_hi',
      'explanation_en',
      'explanationEn',
      'explanation',
      'source_notes',
      'class',
      'tags',
      'id',
    ]),
);

function skipJsonWhitespace(s: string, from: number): number {
  let j = from;
  while (j < s.length) {
    const c = s[j];
    if (c === ' ' || c === '\t' || c === '\n' || c === '\r') j++;
    else break;
  }
  return j;
}

/**
 * If `from` points at `"`, return the key name when the next non-ws char after the closing
 * quote is `:`; otherwise return null. Keys are one line / standard JSON (escape-aware).
 */
function readJsonStringKeyBeforeColon(
  s: string,
  from: number,
): { key: string; endQuote: number; colon: number } | null {
  if (from >= s.length || s[from] !== '"') return null;
  let i = from + 1;
  let esc = false;
  for (; i < s.length; i++) {
    const c = s[i];
    if (esc) {
      esc = false;
      continue;
    }
    if (c === '\\') {
      esc = true;
      continue;
    }
    if (c === '"') {
      const key = s.slice(from + 1, i);
      const j = skipJsonWhitespace(s, i + 1);
      if (j < s.length && s[j] === ':') return { key, endQuote: i, colon: j };
      return null;
    }
  }
  return null;
}

/**
 * LLMs often put literal `"` inside long Hindi/English explanations. That terminates JSON strings
 * early and causes `Expected ',' or '}'` at a large offset. When inside a string, a `"` that is
 * *not* followed (after optional ws) by `,` `}` `]`, and *not* by `"knownKey":`, is treated as an
 * inner quote and written as `\"`.
 */
export function escapeUnescapedDoubleQuotesInJsonStringValues(s: string): string {
  const input = s;
  let out = '';
  let i = 0;
  let inString = false;
  let escape = false;
  while (i < input.length) {
    const c = input[i];
    if (!inString) {
      if (c === '"') {
        inString = true;
        out += c;
        i++;
        continue;
      }
      out += c;
      i++;
      continue;
    }
    if (inString) {
      if (escape) {
        out += c;
        escape = false;
        i++;
        continue;
      }
      if (c === '\\') {
        out += c;
        escape = true;
        i++;
        continue;
      }
      if (c !== '"') {
        out += c;
        i++;
        continue;
      }
      // Unescaped " inside a string: close value vs inner quote
      const j0 = skipJsonWhitespace(s, i + 1);
      if (j0 >= s.length) {
        inString = false;
        out += '"';
        i++;
        continue;
      }
      const next = s[j0];
      if (next === ',' || next === '}' || next === ']') {
        inString = false;
        out += '"';
        i++;
        continue;
      }
      if (next === '"') {
        const k = readJsonStringKeyBeforeColon(s, j0);
        if (k && KNOWN_JSON_OBJECT_KEY_NAMES.has(k.key)) {
          inString = false;
          out += '"';
          i++;
          continue;
        }
        out += '\\"';
        i++;
        continue;
      }
      out += '\\"';
      i++;
    }
  }
  return out;
}

/**
 * Heuristic: `"someValue"\n"questionId":` (comma missing) — very common in Gemini output for our schema.
 * Runs after newlines in strings are escaped, so a value is usually one logical `"..."` before `\n"key"`.
 */
function insertMissingCommasBetweenObjectFields(s: string): string {
  // Known top-level / nested object keys in our LLM JSON (avoids `"... "\n"foo":` false positives in prose)
  const k =
    'questionId|id|questionText|questionTextEn|options|correctAnswer|explanationEn|explanation_hi|explanation_en|explanation|type|year|paper|subject|matchPairs|marks|negativeMarks|idealTime|source_notes|class|tags|conceptual_depth_hi|conceptual_depth_en|interdisciplinary_link_hi|interdisciplinary_link_en|historical_trend_hi|historical_trend_en|elimination_strategy_hi|elimination_strategy_en|memory_mnemonic_hi|memory_mnemonic_en|toppers_mantra_hi|toppers_mantra_en|mains_application_hi|mains_application_en|ncert_reference|stream|topic_micro_mapping|high_yield_facts_hi|high_yield_facts_en|text|text_en';
  return s.replace(
    new RegExp(
      `("(?:\\\\.|[^"\\\\])*")(\\s*\\r?\\n\\s*)("(?:${k})"\\s*:)`,
      'g',
    ),
    '$1,$2$3',
  );
}

/**
 * Slice the first complete top-level JSON object or array using bracket depth,
 * respecting strings and escapes. Safer than first `{` to last `}` (which pulls
 * trailing prose or merges unrelated `}` characters outside the payload).
 */
export function extractBalancedJsonFragment(input: string): string | null {
  const s = input;
  const start = s.search(/[\[{]/);
  if (start === -1) return null;

  const stack: string[] = [];
  const closer: Record<string, string> = { '{': '}', '[': ']' };
  const openers = new Set(['{', '[']);
  const closers = new Set(['}', ']']);

  let inString = false;
  let escape = false;

  for (let i = start; i < s.length; i++) {
    const c = s[i];
    if (inString) {
      if (escape) {
        escape = false;
        continue;
      }
      if (c === '\\') {
        escape = true;
        continue;
      }
      if (c === '"') inString = false;
      continue;
    }
    if (c === '"') {
      inString = true;
      continue;
    }
    if (openers.has(c)) {
      stack.push(closer[c]);
      continue;
    }
    if (closers.has(c)) {
      if (stack.length === 0 || stack[stack.length - 1] !== c) return null;
      stack.pop();
      if (stack.length === 0) return s.slice(start, i + 1);
    }
  }
  return null;
}

/**
 * Light structural cleanup for LLM / paste JSON. Inner unescaped quotes in long
 * strings are fixed by `escapeUnescapedDoubleQuotesInJsonStringValues` before
 * structural fixes; smart-quote global replacement is avoided (see `minimalClean`).
 */
export function sanitizeJSONString(jsonString: string): string {
  let cleaned = fixUnescapedStringControlCharsInJsonText(minimalClean(jsonString));
  cleaned = escapeUnescapedDoubleQuotesInJsonStringValues(cleaned);

  const extracted = extractBalancedJsonFragment(cleaned);
  if (extracted) cleaned = extracted;

  cleaned = cleaned.replace(/}\s*(\n\s*)*{/g, '},{');
  cleaned = cleaned.replace(/]\s*(\n\s*)*{/g, '],[{');
  cleaned = cleaned.replace(/}\s*(\n\s*)*\[/g, '},[');

  cleaned = insertMissingCommasBetweenObjectFields(cleaned);

  cleaned = cleaned.replace(/,\s*([\]}])/g, '$1');

  try {
    JSON.parse(cleaned);
  } catch {
    const openBraces = (cleaned.match(/{/g) || []).length;
    let closeBraces = (cleaned.match(/}/g) || []).length;
    const openBrackets = (cleaned.match(/\[/g) || []).length;
    let closeBrackets = (cleaned.match(/]/g) || []).length;

    while (openBraces > closeBraces) {
      cleaned += '}';
      closeBraces++;
    }
    while (openBrackets > closeBrackets) {
      cleaned += ']';
      closeBrackets++;
    }
  }

  return cleaned.trim();
}

/**
 * Parse pasted / LLM JSON with multiple strategies: strict parse, structural
 * cleanup, balanced extraction, then `jsonrepair` for trailing commas, comments,
 * unquoted keys, truncated output, etc.
 */
export function parseLenientJSON<T = unknown>(raw: string): T {
  if (raw == null || typeof raw !== 'string') {
    throw new SyntaxError('JSON input is empty.');
  }
  if (raw.trim().length === 0) {
    throw new SyntaxError('JSON input is empty.');
  }

  let lastError = 'Unknown parse error';
  const tried = new Set<string>();
  const tried5 = new Set<string>();

  function tryParse(s: string): T | null {
    const t = s.trim();
    if (!t) return null;
    if (tried.has(t)) return null;
    tried.add(t);
    try {
      return JSON.parse(t) as T;
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
      return null;
    }
  }

  /**
   * JSON5 helps with trailing commas / some minor issues only *after* text is already
   * structurally valid enough. Running it on broken LLM JSON surfaces confusing errors like
   * `invalid character 'फ'` (Hindi is fine in JSON strings — the real bug is usually a stray `"`).
   * Never overwrite `lastError` from JSON5.
   */
  function tryJson5Silent(s: string): T | null {
    const t = s.trim();
    if (!t) return null;
    if (tried5.has(t)) return null;
    tried5.add(t);
    try {
      return JSON5.parse(t) as T;
    } catch {
      return null;
    }
  }

  const minimal = minimalClean(raw);
  const fixed = fixUnescapedStringControlCharsInJsonText(minimal);
  const inner = escapeUnescapedDoubleQuotesInJsonStringValues(fixed);
  const commaFixed = insertMissingCommasBetweenObjectFields(fixed);
  const commaInner = insertMissingCommasBetweenObjectFields(inner);
  const balanced =
    extractBalancedJsonFragment(inner) ??
    extractBalancedJsonFragment(fixed) ??
    extractBalancedJsonFragment(minimal);
  const fixedBal = balanced
    ? escapeUnescapedDoubleQuotesInJsonStringValues(
        fixUnescapedStringControlCharsInJsonText(balanced),
      )
    : null;
  const commaFixedBal = fixedBal ? insertMissingCommasBetweenObjectFields(fixedBal) : null;

  const uq = replaceUnicodeDoubleQuotesForLenientJson(minimal);
  const uqFixed = fixUnescapedStringControlCharsInJsonText(uq);
  const uqInner = escapeUnescapedDoubleQuotesInJsonStringValues(uqFixed);
  const uqComma = insertMissingCommasBetweenObjectFields(uqInner);

  const preRepair: string[] = [
    raw.trim(),
    minimal,
    fixed,
    inner,
    commaFixed,
    commaInner,
    uq,
    uqFixed,
    uqInner,
    uqComma,
    sanitizeJSONString(raw),
  ];
  if (balanced) {
    preRepair.push(balanced, insertMissingCommasBetweenObjectFields(balanced));
  }
  if (fixedBal) {
    preRepair.push(fixedBal);
  }
  if (commaFixedBal) {
    preRepair.push(commaFixedBal);
  }

  for (const candidate of preRepair) {
    const v = tryParse(candidate);
    if (v !== null) return v;
  }

  const repairFns: Array<() => string> = [
    () => jsonrepair(raw.trim()),
    () => jsonrepair(minimal),
    () => jsonrepair(fixed),
    () => jsonrepair(inner),
    () => jsonrepair(commaFixed),
    () => jsonrepair(commaInner),
    () => jsonrepair(fixedBal ?? fixed),
    () => jsonrepair(commaFixedBal ?? commaInner),
    () => jsonrepair(balanced ?? fixed),
    () => jsonrepair(jsonrepair(fixed)),
    () => jsonrepair(jsonrepair(inner)),
    () => jsonrepair(jsonrepair(jsonrepair(fixed))),
    () => jsonrepair(sanitizeJSONString(raw)),
    () => jsonrepair(uqInner),
    () => jsonrepair(uqComma),
  ];

  for (const get of repairFns) {
    let repaired: string;
    try {
      repaired = get();
    } catch {
      continue;
    }
    const v = tryParse(repaired);
    if (v !== null) return v;
    const j5 = tryJson5Silent(repaired);
    if (j5 !== null) return j5;
  }

  throw new SyntaxError(
    lastError === 'Unknown parse error'
      ? 'Could not parse JSON after repair attempts.'
      : lastError,
  );
}

/** Canonical JSON string for FormData / APIs after lenient parse */
export function repairJSONToParseableString(raw: string): string {
  return JSON.stringify(parseLenientJSON(raw));
}

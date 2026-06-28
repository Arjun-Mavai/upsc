/** One flash card derived from structured JSON or newline string. */
export type KeyTermFlashItem = {
  emoji?: string;
  term: string;
  hint: string;
};

/** Admin / AI structured rows (preferred). */
export function parseStructuredKeyTermsCards(raw: unknown): KeyTermFlashItem[] {
  if (!Array.isArray(raw)) return [];
  const out: KeyTermFlashItem[] = [];
  for (const row of raw) {
    if (!row || typeof row !== 'object') continue;
    const o = row as Record<string, unknown>;
    const term = String(o.term ?? o.label ?? o.title ?? '').trim();
    const hint = String(o.hint ?? o.recall ?? o.line ?? o.gloss ?? o.meaning ?? '').trim();
    const emoji = typeof o.emoji === 'string' ? o.emoji.trim() : '';
    if (term && hint) out.push({ emoji: emoji || undefined, term, hint });
  }
  return out;
}

/**
 * Fallback: newline / JSON string → cards.
 * Accepts `- 🧭 Term: gloss` or `Term — gloss`.
 */
export function parseKeyTermsFlashString(raw: string | null | undefined): KeyTermFlashItem[] {
  const t = String(raw ?? '').trim();
  if (!t) return [];
  if (t.startsWith('[')) {
    try {
      const j = JSON.parse(t) as unknown;
      const st = parseStructuredKeyTermsCards(j);
      if (st.length) return st;
    } catch {
      /* fall through */
    }
  }

  let lines = t
    .split(/\n/)
    .map((l) => l.replace(/^\s*[-•*]\s*/, '').trim())
    .filter(Boolean);

  // Model sometimes dumps everything in one line — split on common separators so cards render.
  if (lines.length === 1 && lines[0].length > 72) {
    const blob = lines[0];
    const byChunk = blob
      .split(/\s*(?:;|·|•)\s+|\s*\|\s+/)
      .map((x) => x.trim())
      .filter(Boolean);
    if (byChunk.length >= 4) lines = byChunk;
    else if (/\s+[—–]\s+/.test(blob) && blob.split(/\s+[—–]\s+/).length >= 4) {
      lines = blob.split(/\s+[—–]\s+/).map((x) => x.trim()).filter(Boolean);
    }
  }

  const out: KeyTermFlashItem[] = [];
  for (const line of lines) {
    const rest = line;
    let sep = -1;
    let sepLen = 1;
    const candidates: { i: number; len: number }[] = [];
    for (const { ch, len } of [
      { ch: ':', len: 1 },
      { ch: '：', len: 1 },
      { ch: '—', len: 1 },
      { ch: '–', len: 1 },
      { ch: '·', len: 1 },
      { ch: '|', len: 1 },
    ]) {
      const i = rest.indexOf(ch);
      if (i > 0) candidates.push({ i, len });
    }
    const mDash = rest.match(/\s+[—–]\s+/);
    if (mDash && mDash.index != null && mDash.index > 0) {
      candidates.push({ i: mDash.index, len: mDash[0].length });
    }
    if (candidates.length) {
      candidates.sort((a, b) => a.i - b.i);
      sep = candidates[0]!.i;
      sepLen = candidates[0]!.len;
    }

    if (sep > 0) {
      const termPart = rest.slice(0, sep).trim();
      const gloss = rest.slice(sep + sepLen).trim();
      out.push({
        term: termPart || '—',
        hint: gloss || '—',
      });
    } else {
      out.push({ term: '', hint: rest });
    }
  }
  return out;
}

export function mergeFlashItemsFromSources(
  structured: unknown,
  stringFallback: string | null | undefined
): KeyTermFlashItem[] {
  const fromObj = parseStructuredKeyTermsCards(structured);
  if (fromObj.length) return fromObj;
  return parseKeyTermsFlashString(stringFallback ?? '');
}

/** Persistable newline form when only structured cards exist in AI JSON. */
export function structuredKeyTermsToString(raw: unknown): string {
  const items = parseStructuredKeyTermsCards(raw);
  if (!items.length) return '';
  return items
    .map((i) => `- ${i.emoji ? `${i.emoji} ` : ''}${i.term}: ${i.hint}`)
    .join('\n');
}

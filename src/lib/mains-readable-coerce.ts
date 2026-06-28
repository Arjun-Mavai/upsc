/** Split on Latin or Devanagari sentence enders, but avoid splitting after numbered lists (1., 2.) or abbreviations like vs., Dr., Mr., etc. */
const SENTENCE_SPLIT = /(?<=(?<!\b(?:[A-Za-z]|\d+|vs|Vs|v|Dr|Mr|Mrs|Prof|etc|e\.g|i\.e))[.!?।])\s+/;

/**
 * Turn plain prose into markdown bullets so UI can render scan-friendly chips
 * (legacy content / AI that forgot "- " lines).
 */
export function coerceMarkdownBullets(text: string): string {
  const t = text.trim();
  if (!t) return '';
  
  const cleanLines = t.split(/\n+/).map(l => l.trim()).filter(l => Boolean(l) && l !== '-' && l !== '*' && l !== '•');
  if (cleanLines.length === 0) return '';
  const cleanText = cleanLines.join('\n');

  if (/^-\s/m.test(cleanText) || /^#{1,3}\s/m.test(cleanText)) return cleanText;

  if (cleanLines.length > 1) {
    return cleanLines.map((l) => (/^-\s/.test(l) ? l : `- ${l}`)).join('\n');
  }

  const one = cleanLines[0] ?? cleanText;
  const sents = one.split(SENTENCE_SPLIT).map((s) => s.trim()).filter(Boolean);
  if (sents.length <= 1) return `- ${one}`;
  return sents.map((s) => `- ${s}`).join('\n');
}

export function ensureBulletMarkdown(text: string): string {
  return coerceMarkdownBullets(text);
}

/** Like coerceMarkdownBullets but keeps `##` / `###` blocks and bulletizes plain paragraphs between them. */
export function coerceMarkdownBulletsLoose(text: string): string {
  const t = text.trim();
  if (!t) return '';
  return t
    .split(/\n{2,}/)
    .map((para) => {
      const p = para.trim();
      if (!p) return '';
      if (/^#{1,3}\s/m.test(p)) return p;
      return coerceMarkdownBullets(p);
    })
    .filter(Boolean)
    .join('\n\n');
}

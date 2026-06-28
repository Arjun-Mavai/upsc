export const MAINS_HISTORY_RICH_VERSION = 'mains_history_rich_v1' as const;

export type MainsModelVariant = { text: string; stem?: string | null };

/** Used by viewers when reading model JSON blobs without full normalization. */
export function pickVariantStem(o: Record<string, unknown>): string | null {
  for (const k of ['stem', 'stem_hi', 'stem_en', 'question', 'prompt', 'q', 'ask'] as const) {
    const s = o[k];
    if (typeof s === 'string' && s.trim()) return s.trim();
  }
  return null;
}

export function normalizeVariantArr(arr: unknown): MainsModelVariant[] {
  if (!Array.isArray(arr)) return [];
  return arr.map((v) => {
    if (typeof v === 'string') return { text: v };
    if (v && typeof v === 'object') {
      const o = v as Record<string, unknown>;
      const stem = pickVariantStem(o);
      if (typeof o.text === 'string') return { text: o.text, stem };
      const first = Object.values(o).find((x) => typeof x === 'string');
      if (typeof first === 'string') return { text: first, stem };
    }
    return { text: '' };
  });
}

/** Detect new History/GS-I extended JSON (bilingual model blocks). */
export function isHistoryRichPayload(raw: Record<string, unknown>): boolean {
  if (raw.schema_version === MAINS_HISTORY_RICH_VERSION) return true;
  if (typeof raw.cognitive_intro_hi === 'string' && raw.cognitive_intro_hi.trim()) return true;
  if (raw.model_answers_hi && typeof raw.model_answers_hi === 'object') return true;
  return false;
}

function line(blockTitle: string, body: string | null | undefined): string {
  const t = String(body ?? '').trim();
  if (!t) return '';
  return `## ${blockTitle}\n${t}\n\n`;
}

function pickSuffixed(
  parsed: Record<string, unknown>,
  base: string,
  lang: 'hi' | 'en'
): string {
  const suf = lang === 'hi' ? '_hi' : '_en';
  return String(parsed[`${base}${suf}`] ?? '').trim();
}

/** Interlinking fields may be prose or a JSON array — normalize to markdown bullets for viewers / expert_strategy. */
export function interlinkingToMarkdown(raw: unknown): string {
  if (raw == null) return '';
  if (typeof raw === 'object' && raw !== null && !Array.isArray(raw)) {
    const o = raw as Record<string, unknown>;
    const nested = o.links ?? o.items ?? o.dots ?? o.bullets ?? o.lines;
    if (Array.isArray(nested)) return interlinkingToMarkdown(nested);
  }
  if (Array.isArray(raw)) {
    const lines: string[] = [];
    for (const item of raw) {
      if (typeof item === 'string') {
        const s = item.trim();
        if (s) lines.push(/^[-•*]\s/.test(s) ? s : `- ${s}`);
      } else if (item && typeof item === 'object') {
        const o = item as Record<string, unknown>;
        const b = String(o.bullet ?? o.line ?? o.text ?? '').trim();
        const to = String(o.to ?? o.target ?? o.paper ?? o.link ?? o.with ?? '').trim();
        if (!b) continue;
        lines.push(to ? `- **↔ ${to}:** ${b}` : `- ${b}`);
      }
    }
    return lines.join('\n');
  }
  return String(raw).trim();
}

/** Resolved interlinking text for a language (supports string or structured array in payload). */
export function pickInterlinkingMarkdown(parsed: Record<string, unknown>, lang: 'hi' | 'en'): string {
  const suf = lang === 'hi' ? '_hi' : '_en';
  const raw =
    parsed[`multidimensional_interlinking${suf}`] ?? parsed[`interlinking_dots${suf}`];
  if (typeof raw === 'string') return raw.trim();
  const fromArr = interlinkingToMarkdown(raw).trim();
  if (fromArr) return fromArr;
  return (
    pickSuffixed(parsed, 'multidimensional_interlinking', lang) ||
    pickSuffixed(parsed, 'interlinking_dots', lang)
  );
}

function dynamicDimsToMd(
  parsed: Record<string, unknown>,
  lang: 'hi' | 'en',
  label: string
): string {
  const suf = lang === 'hi' ? '_hi' : '_en';
  const dims = parsed[`dynamic_dimensions${suf}`] ?? parsed.dynamic_dimensions;
  if (!Array.isArray(dims)) return '';
  const chunks: string[] = [];
  for (const d of dims) {
    if (!d || typeof d !== 'object') continue;
    const o = d as Record<string, unknown>;
    const name = String(o.dimension_name ?? o.dimensionName ?? '').trim();
    const bullets = Array.isArray(o.bullets) ? o.bullets : [];
    if (!name && bullets.length === 0) continue;
    const bLines = bullets
      .map((x) => (typeof x === 'string' ? `- ${x}` : ''))
      .filter(Boolean)
      .join('\n');
    chunks.push(`### ${name || 'Dimension'}\n${bLines}\n`);
  }
  if (!chunks.length) return '';
  return `## ${label}\n${chunks.join('\n')}\n\n`;
}

/** Collapse rich object into legacy `expert_strategy_*` markdown (for search / fallback / admin preview). */
export function composeExpertStrategyFromRich(parsed: Record<string, unknown>, lang: 'hi' | 'en'): string {
  const inter = pickInterlinkingMarkdown(parsed, lang);

  const grasp = pickSuffixed(parsed, 'syllabus_grasp', lang);
  const cognitive = pickSuffixed(parsed, 'cognitive_intro', lang);
  let syllabusBlock = '';
  if (grasp && cognitive) {
    syllabusBlock = line(
      lang === 'hi' ? 'सिलेबस समझ' : 'Syllabus grasp',
      `${grasp}\n\n### ${lang === 'hi' ? 'संक्षिप्त परिचय' : 'Opening lens'}\n${cognitive}`
    );
  } else if (grasp) {
    syllabusBlock = line(lang === 'hi' ? 'सिलेबस समझ' : 'Syllabus grasp', grasp);
  } else if (cognitive) {
    syllabusBlock = line(lang === 'hi' ? 'संक्षिप्त परिचय' : 'Opening frame', cognitive);
  }

  return [
    syllabusBlock,
    lang === 'hi' ? line('PYQ ट्रेंड', pickSuffixed(parsed, 'pyq_trend_analysis', lang)) : line('PYQ trend', pickSuffixed(parsed, 'pyq_trend_analysis', lang)),
    lang === 'hi' ? line('देसी एनालॉजी', pickSuffixed(parsed, 'desi_analogy', lang)) : line('Modern analogy', pickSuffixed(parsed, 'desi_analogy', lang)),
    lang === 'hi'
      ? line('प्रामाणिक स्रोत (Brahmastra)', pickSuffixed(parsed, 'authentic_source_citation', lang))
      : line('Authentic source', pickSuffixed(parsed, 'authentic_source_citation', lang)),
    dynamicDimsToMd(parsed, lang, lang === 'hi' ? 'डायनैमिक आयाम' : 'Dynamic dimensions'),
    line(lang === 'hi' ? 'अंतर-पेपर जुड़ाव' : 'Interlinking', inter),
    line(lang === 'hi' ? 'मेमोरी हुक' : 'Memory hook', pickSuffixed(parsed, 'psychological_memory_hook', lang)),
    line(lang === 'hi' ? 'मानचित्र / चित्र' : 'Infographic cue', pickSuffixed(parsed, 'visual_infographic_cue', lang)),
    line(lang === 'hi' ? 'एग्जामिनर ट्रैप' : 'Examiner trap', pickSuffixed(parsed, 'examiner_trap', lang)),
    line(lang === 'hi' ? 'टॉपर X-factor' : 'Topper X-factor', pickSuffixed(parsed, 'topper_x_factor', lang)),
  ]
    .filter(Boolean)
    .join('')
    .trim();
}

export type ModelBlock = Record<string, MainsModelVariant[]>;

export function extractModelAnswersForValidation(parsed: Record<string, unknown>): ModelBlock {
  const raw = (
    parsed.model_answers_hi ??
    parsed.model_answer_hi ??
    parsed.modelanswers_hi ??
    parsed.model_answers ??
    parsed.model_answer ??
    parsed.modelAnswers ??
    parsed.modelAnswer ??
    parsed.modelanswers
  ) as ModelBlock | Record<string, unknown> | undefined;
  if (!raw || typeof raw !== 'object') {
    return { '2m': [], '7m': [], '10m': [], '11m': [], '15m': [], '20m': [], case18: [] };
  }
  const o = raw as Record<string, unknown>;
  return {
    '2m': normalizeVariantArr(o['2m'] ?? o['2'] ?? o['2-mark'] ?? o['2marks'] ?? o['2_marks']),
    '7m': normalizeVariantArr(o['7m'] ?? o['7'] ?? o['7-mark'] ?? o['7marks'] ?? o['7_marks']),
    '10m': normalizeVariantArr(o['10m'] ?? o['10'] ?? o['10-mark'] ?? o['10marks'] ?? o['10_marks']),
    '11m': normalizeVariantArr(o['11m'] ?? o['11'] ?? o['11-mark'] ?? o['11marks'] ?? o['11_marks']),
    '15m': normalizeVariantArr(o['15m'] ?? o['15'] ?? o['15-mark'] ?? o['15marks'] ?? o['15_marks']),
    '20m': normalizeVariantArr(o['20m'] ?? o['20'] ?? o['20-mark'] ?? o['20marks'] ?? o['20_marks']),
    case18: normalizeVariantArr(o.case18 ?? o['18'] ?? o['18m'] ?? o['case_18'] ?? o['case-18']),
  };
}

export function extractModelAnswersEn(parsed: Record<string, unknown>): ModelBlock {
  const raw = (
    parsed.model_answers_en ??
    parsed.model_answer_en ??
    parsed.modelanswers_en
  ) as Record<string, unknown> | undefined;
  if (!raw || typeof raw !== 'object') {
    return { '2m': [], '7m': [], '10m': [], '11m': [], '15m': [], '20m': [], case18: [] };
  }
  const o = raw as Record<string, unknown>;
  return {
    '2m': normalizeVariantArr(o['2m'] ?? o['2'] ?? o['2-mark'] ?? o['2marks'] ?? o['2_marks']),
    '7m': normalizeVariantArr(o['7m'] ?? o['7'] ?? o['7-mark'] ?? o['7marks'] ?? o['7_marks']),
    '10m': normalizeVariantArr(o['10m'] ?? o['10'] ?? o['10-mark'] ?? o['10marks'] ?? o['10_marks']),
    '11m': normalizeVariantArr(o['11m'] ?? o['11'] ?? o['11-mark'] ?? o['11marks'] ?? o['11_marks']),
    case18: normalizeVariantArr(o.case18 ?? o['18'] ?? o['18m'] ?? o['case_18'] ?? o['case-18']),
  };
}

export function extractModelAnswers(parsed: Record<string, unknown>, lang: 'hi' | 'en'): ModelBlock {
  const isHi = lang === 'hi';
  const primary = isHi ? extractModelAnswersForValidation(parsed) : extractModelAnswersEn(parsed);
  
  // If English model answers are empty, fallback to Hindi model answers as backup
  if (!isHi) {
    const hasAnyEn =
      primary['2m'].length +
      primary['7m'].length +
      primary['10m'].length +
      (primary['11m'] ? primary['11m'].length : 0) +
      (primary['15m'] ? primary['15m'].length : 0) +
      (primary['20m'] ? primary['20m'].length : 0) +
      primary.case18.length > 0;
    if (!hasAnyEn) {
      return extractModelAnswersForValidation(parsed);
    }
  }
  return primary;
}

export function stripServerFields(parsed: Record<string, unknown>): Record<string, unknown> {
  return {
    ...parsed,
    schema_version: MAINS_HISTORY_RICH_VERSION,
  };
}

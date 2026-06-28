/**
 * Coerce API/DB explanation fields to plain strings. Some rows store bilingual
 * objects or nested blobs; rendering them directly shows "[object Object]".
 */
export function coerceExplanationToString(
  value: unknown,
  language: 'hi' | 'en' = 'hi',
  depth = 0,
): string {
  if (value == null) return '';
  if (depth > 12) return '';
  if (typeof value === 'string') {
    const t = value.trim();
    if (t === '[object Object]') return '';
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    return value
      .map((v) => coerceExplanationToString(v, language, depth + 1))
      .filter((s) => s.length > 0)
      .join('\n\n');
  }
  if (typeof value === 'object') {
    const o = value as Record<string, unknown>;
    const asStr = (v: unknown) => (typeof v === 'string' ? v : '');

    // Full expert / CSAT blobs: never flatten into "classic" cards (avoids garbage text).
    if (o.stream === 'mppsc_expert' || o.stream === 'csat_logic') {
      return '';
    }

    const tryNested = (v: unknown) => coerceExplanationToString(v, language, depth + 1);

    const pickLang = () => {
      if (language === 'hi') {
        return (
          asStr(o.hi ?? o.hindi ?? o.text_hi ?? o.explanation_hi) ||
          asStr(o.text ?? o.content) ||
          asStr(o.en ?? o.english ?? o.textEn ?? o.explanationEn ?? o.explanation_en)
        );
      }
      return (
        asStr(
          o.en ?? o.english ?? o.textEn ?? o.explanationEn ?? o.explanation_en,
        ) ||
        asStr(o.text ?? o.content) ||
        asStr(o.hi ?? o.hindi ?? o.text_hi ?? o.explanation_hi)
      );
    };

    if (o.bilingual != null && typeof o.bilingual === 'object') {
      const b = tryNested(o.bilingual);
      if (b) return b;
    }

    const leafOrNested = (v: unknown) =>
      typeof v === 'string' ? v : v != null && typeof v === 'object' ? tryNested(v) : '';

    const blob =
      pickLang() ||
      asStr(
        o.value ?? o.detail ?? o.body ?? o.summary ?? o.markdown,
      ) ||
      leafOrNested(o.verdict) ||
      leafOrNested(o.core_logic) ||
      leafOrNested(o.logic) ||
      leafOrNested(o.exam_fact) ||
      leafOrNested(o.fact) ||
      leafOrNested(o.core_concept) ||
      leafOrNested(o.memory_tip) ||
      leafOrNested(o.tip) ||
      leafOrNested(o.memory_trick) ||
      leafOrNested(o.elimination_wisdom) ||
      leafOrNested(o.scam_alert) ||
      leafOrNested(o.scam) ||
      leafOrNested(o.trap_alert) ||
      leafOrNested(o.trap_alerts);

    if (blob) return blob;

    if (o.explanation != null && o.explanation !== value) {
      return coerceExplanationToString(o.explanation, language, depth + 1);
    }

    // Last resort: join direct string children (weird LLM shapes like { a: "x", b: "y" }).
    const stringVals = Object.values(o).filter(
      (v): v is string => typeof v === 'string' && v.trim().length > 0,
    );
    if (stringVals.length) return stringVals.join('\n\n');

    const anyJoined = Object.values(o)
      .map((v) => tryNested(v))
      .filter((s) => s.length > 0);
    if (anyJoined.length) return anyJoined.join('\n\n');

    return '';
  }
  return '';
}

// UPSC Zen — PYQ Scope Configuration
export const PYQ_SCOPE_START_YEAR = 2020;
export const PYQ_SCOPE_END_YEAR = 2025;

const normalizeWhitespace = (value: string): string => value.replace(/\s+/g, ' ').trim();

export function getScopedStateServiceYear(title: string): number | null {
  const normalized = normalizeWhitespace(title);

  // Match UPSC Civil Services Prelims patterns
  const enMatch = normalized.match(/UPSC.*?(?:Civil Services|CSE|IAS).*?Prelims.*?(20\d{2})/i);
  if (enMatch) return Number(enMatch[1]);

  // Match UPSC GS Paper 1 patterns
  const gsMatch = normalized.match(/UPSC.*?(?:GS|General Studies).*?Paper.*?1.*?(20\d{2})/i);
  if (gsMatch) return Number(gsMatch[1]);

  // Match Hindi patterns
  const hiMatch = normalized.match(/UPSC.*?(?:सिविल सेवा|प्रारंभिक).*?(20\d{2})/);
  if (hiMatch) return Number(hiMatch[1]);

  // Simple year extraction for UPSC tests
  const simpleMatch = normalized.match(/UPSC.*?(20\d{2})/i);
  if (simpleMatch) return Number(simpleMatch[1]);

  return null;
}

export function isWithinScopedStateServiceRange(
  title: string,
  fromYear: number,
  toYear: number
): boolean {
  const year = getScopedStateServiceYear(title);
  return year !== null && year >= fromYear && year <= toYear;
}

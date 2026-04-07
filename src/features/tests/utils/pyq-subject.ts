import { logger } from '@/lib/logger';

/**
 * 🎓 UPSC PROFESSIONAL BUCKETING LOGIC
 * Standardizing 600+ Questions into UPSC Pillars:
 * 1. History (Ancient, Medieval, Modern, Art & Culture)
 * 2. Geography (Physical, Indian, World)
 * 3. Polity & Governance
 * 4. Economy (Agriculture, Budget, Infrastructure)
 * 5. Environment & Ecology (Climate, Biodiversity)
 * 6. Science & Technology
 * 7. International Relations
 * 8. Current Affairs
 */
export function normalizeSubject(rawSubject: string | null, isUPSC: boolean = false): string {
  if (!rawSubject) return isUPSC ? 'Current Affairs' : 'General Studies';
  const lower = rawSubject.toLowerCase().trim();

  // 1. Environment & Ecology (UPSC)
  if (
    lower.includes('environment') || 
    lower.includes('ecology') || 
    lower.includes('biodiversity') || 
    lower.includes('climate') || 
    lower.includes('forest') || 
    lower.includes('pollution') ||
    lower.includes('wildlife') ||
    lower.includes('climatology')
  ) {
    return 'Environment & Ecology';
  }

  // 2. Science & Technology
  if (
    lower.includes('science') || 
    lower.includes('technology') || 
    lower.includes('tech') || 
    /\bit\b/.test(lower) || 
    lower.includes('computer') || 
    lower.includes('space') || 
    lower.includes('defense') ||
    lower.includes('defence') ||
    lower.includes('biotech')
  ) {
    return 'Science & Technology';
  }

  // 3. Economy
  if (
    lower.includes('economy') || 
    lower.includes('economic') || 
    lower.includes('agriculture') || 
    lower.includes('budget') || 
    lower.includes('infrastructure') || 
    lower.includes('trade') ||
    lower.includes('banking') ||
    lower.includes('finance')
  ) {
    return 'Economy (Basic Economics & Indian Economy)';
  }

  // 4. Polity & Governance
  if (
    lower.includes('polity') || 
    lower.includes('governance') || 
    lower.includes('constitution') || 
    /\bact\b/.test(lower) || 
    lower.includes('bill') || 
    lower.includes('commission') ||
    lower.includes('panchayat') ||
    lower.includes('rights') ||
    lower.includes('amendment')
  ) {
    return 'Polity (Indian Constitution & Governance)';
  }

  // 5. Art & Culture
  if (
    lower.includes('culture') || 
    /\bart\b/.test(lower)
  ) {
    return 'Art & Culture';
  }

  // 6. History
  if (
    lower.includes('history') || 
    lower.includes('ancient') || 
    lower.includes('medieval') || 
    lower.includes('modern') || 
    lower.includes('freedom struggle') ||
    lower.includes('national movement')
  ) {
    return 'History (Ancient, Medieval, Modern)';
  }

  // 7. Geography
  if (
    lower.includes('geography') || 
    lower.includes('physical') || 
    lower.includes('indian geo') || 
    lower.includes('world geo') || 
    lower.includes('mapping') || 
    lower.includes('resource')
  ) {
    return 'Geography (India & World)';
  }

  // 8. Current Affairs (Mapping International Relations here or directly as Current Affairs)
  if (
    lower.includes('current') || 
    lower.includes('news') || 
    lower.includes('daily') || 
    lower.includes('award') || 
    lower.includes('summit') ||
    lower.includes('international') || 
    /\bir\b/.test(lower) || 
    lower.includes('relation') ||
    lower.includes('organization') ||
    lower.includes('institution')
  ) {
    return 'Current Affairs';
  }

  // 9. Strict UPSC Fallback
  // The user requested NO stray strings like "Subject" or "Misc" in UPSC views.
  if (isUPSC) {
    return 'Current Affairs';
  }

  // 10. General Catch-all (Capitalized) for MPPSC
  if (lower === 'subject' || lower === 'general studies') return 'General Studies';
  const capitalized = rawSubject.charAt(0).toUpperCase() + rawSubject.slice(1);
  return capitalized;
}

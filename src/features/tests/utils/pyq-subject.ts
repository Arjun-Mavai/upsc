import { logger } from '@/lib/logger';

// Matches 300+ variations in DB to canonical categories.
export function normalizeSubject(rawSubject: string | null): string {
  if (!rawSubject) return 'Misc';
  const lower = rawSubject.toLowerCase().trim();

  if (
    lower.includes('mp ') ||
    lower.includes('madhya pradesh') ||
    lower.includes('unit 1') ||
    lower.includes('unit 3') ||
    lower.includes('unit 5') ||
    lower.includes('tribes') ||
    lower.includes('folk') ||
    lower.includes('tourism') ||
    lower.includes('dynasties') ||
    lower.includes('literature') ||
    lower.includes('personalities')
  ) {
    return 'MP GK';
  }

  if (
    lower.includes('current') ||
    lower.includes('समसामयिकी') ||
    lower.includes('करेंट') ||
    lower.includes('करंट') ||
    lower.includes('वर्तमान') ||
    lower.includes('समसामयिक') ||
    lower.includes('sports') ||
    lower.includes('award') ||
    lower.includes('unit 8') ||
    lower.includes('defence') ||
    lower.includes('summit') ||
    lower.includes('international') ||
    lower.includes('relations') ||
    lower.includes('report') ||
    lower.includes('index') ||
    lower.includes('indices') ||
    lower.includes('organization') ||
    lower.includes('awareness') ||
    lower.includes('general knowledge')
  ) {
    return 'Current Affairs';
  }

  if (
    lower.includes('history') ||
    lower.includes('इतिहास') ||
    lower.includes('freedom') ||
    lower.includes('ancient') ||
    lower.includes('medieval') ||
    lower.includes('modern') ||
    lower.includes('unit 2') ||
    lower.includes('culture') ||
    lower.includes('archaeology')
  ) {
    return 'History';
  }

  if (
    lower.includes('geography') ||
    lower.includes('भूगोल') ||
    lower.includes('climate') ||
    lower.includes('monsoon') ||
    lower.includes('resource') ||
    lower.includes('agriculture') ||
    lower.includes('unit 4') ||
    lower.includes('disaster') ||
    lower.includes('environment') ||
    lower.includes('census') ||
    lower.includes('demography') ||
    lower.includes('population') ||
    lower.includes('energy')
  ) {
    if (lower.includes('mp') || lower.includes('madhya')) {
        return 'MP GK';
    }
    return 'Geography';
  }

  if (
    lower.includes('polity') ||
    lower.includes('राजव्यवस्था') ||
    lower.includes('constitution') ||
    lower.includes('commission') ||
    lower.includes('act') ||
    lower.includes('governance') ||
    lower.includes('panchat') ||
    lower.includes('unit 10') ||
    lower.includes('unit 6')
  ) {
    return 'Polity';
  }

  if (
    lower.includes('economy') ||
    lower.includes('अर्थव्यवस्था') ||
    lower.includes('economic') ||
    lower.includes('budget') ||
    lower.includes('financial') ||
    lower.includes('trade') ||
    lower.includes('bank') ||
    lower.includes('sebi') ||
    lower.includes('rbi')
  ) {
    return 'Economy';
  }

  if (
    lower.includes('science') ||
    lower.includes('विज्ञान') ||
    lower.includes('bio') ||
    lower.includes('physics') ||
    lower.includes('chem') ||
    lower.includes('nutrition') ||
    lower.includes('health') ||
    lower.includes('disease') ||
    lower.includes('unit 7') ||
    lower.includes('institute')
  ) {
    return 'Science';
  }

  if (
    lower.includes('computer') ||
    lower.includes('ict') ||
    lower.includes('internet') ||
    lower.includes('cyber') ||
    lower.includes('robotics') ||
    lower.includes('ai') ||
    lower.includes('electronics') ||
    lower.includes('unit 9') ||
    lower.includes('information') ||
    lower.includes('technology') ||
    lower.includes('communication') ||
    lower.includes('e-commerce') ||
    lower.includes('networking') ||
    /\b(it|i\.t\.|information technology)\b/i.test(lower)
  ) {
    return 'ICT';
  }

  logger.warn(`normalizeSubject: Unmatched subject category for '${rawSubject}'`, {
    rawSubject,
    category: 'system',
  });
  return 'Misc';
}

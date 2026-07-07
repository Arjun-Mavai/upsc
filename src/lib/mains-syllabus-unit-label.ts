/** `mains_units.part` mirrors MPPSC paper खंड A / B — same `unit_number` can repeat per खंड. */

export type MainsUnitPart = 'A' | 'B' | 'NONE';

export function mainsUnitPartChip(
  part: MainsUnitPart,
  language: 'hi' | 'en'
): string | null {
  if (part === 'NONE') return null;
  if (language === 'hi') return `खंड ${part}`;
  return `Part ${part}`;
}

/** Short badge for tight UI: `A·U1` */
export function mainsUnitShortBadge(part: MainsUnitPart, unitNumber: number): string {
  if (part === 'NONE') return `U${unitNumber}`;
  return `${part}·U${unitNumber}`;
}

/** Two-line context: paper + खंड + unit (avoids duplicate “Unit 1” confusion). */
export function mainsUnitSubtitle(
  paperNumber: number,
  part: MainsUnitPart,
  unitNumber: number,
  language: 'hi' | 'en'
): string {
  if (language === 'hi') {
    const p = part === 'NONE' ? '' : ` · खंड ${part}`;
    return `पेपर ${paperNumber}${p} · इकाई ${unitNumber}`;
  }
  const p = part === 'NONE' ? '' : ` · Part ${part}`;
  return `Paper ${paperNumber}${p} · Unit ${unitNumber}`;
}

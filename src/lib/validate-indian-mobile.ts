/**
 * Indian mobile: 10 digits, starts with 6–9, rejects common fake/placeholder patterns.
 */

const SEQUENTIAL_WINDOW =
  '01234567890' +
  '0987654321' +
  '1234567890' +
  '9876543210' +
  '123456789012345';

/** Every digit 6–9 (common fake / toy patterns use only “high” digits). */
const ONLY_HIGH_DIGITS = /^[6-9]{10}$/;

const MSG_SUSPECT = 'This does not look like a real number. Please enter your 10-digit mobile.';

/**
 * 9797979797 style: the same 2 digits repeating in pairs for the first 8,
 * then 2 more digits (e.g. 9696969699).
 */
function isFourPairBlocksPlusTail(s: string): boolean {
  return /^(\d{2})\1{3}\d{2}$/.test(s);
}

/**
 * 9898989898 — full ABAB… for 5 pairs (caught by unique-count when only 6–9,
 * but 1212121212 uses 1,2 so we also check strict alternation).
 */
function isStrictPairAlternation(s: string): boolean {
  if (s.length !== 10) return false;
  const a = s[0]!;
  const b = s[1]!;
  if (a === b) return false;
  for (let i = 0; i < 10; i++) {
    if (s[i] !== (i % 2 === 0 ? a : b)) return false;
  }
  return true;
}

export function isIndianMobileValid(raw: string): boolean {
  return validateIndianMobileMessage(raw) === null;
}

/** Returns a short, user-facing error message, or null if valid. */
export function validateIndianMobileMessage(input: string): string | null {
  const s = String(input).replace(/\D/g, '');
  if (s.length === 0) {
    return 'Enter your 10-digit mobile number.';
  }
  if (s.length !== 10) {
    return s.length < 10
      ? 'Enter all 10 digits.'
      : 'Use a valid 10-digit Indian mobile number.';
  }
  if (!/^[6-9]/.test(s)) {
    return 'Indian numbers start with 6, 7, 8, or 9.';
  }
  if (/^(\d)\1{9}$/.test(s)) {
    return MSG_SUSPECT;
  }
  if (/^(\d{2})\1{4}$/.test(s)) {
    return MSG_SUSPECT;
  }
  if (/^(\d{3})\1{2}\d$/.test(s)) {
    return MSG_SUSPECT;
  }
  for (let i = 0; i <= SEQUENTIAL_WINDOW.length - 10; i++) {
    if (SEQUENTIAL_WINDOW.slice(i, i + 10) === s) {
      return 'Please do not use a straight-up or down number.';
    }
  }
  if (isStrictPairAlternation(s)) {
    return MSG_SUSPECT;
  }
  if (isFourPairBlocksPlusTail(s)) {
    return MSG_SUSPECT;
  }
  if (ONLY_HIGH_DIGITS.test(s)) {
    const unique = new Set(s).size;
    if (unique <= 3) {
      return MSG_SUSPECT;
    }
  }
  return null;
}

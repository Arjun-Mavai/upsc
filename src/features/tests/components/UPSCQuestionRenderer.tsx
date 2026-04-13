import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { RenderTableQuestion } from '@/features/tests/utils/questionFormatter';
import type { Question as QuizQuestion } from '@/types/quiz';

// ============================================================================
// TYPES
// ============================================================================

interface ListDataItem {
  id?: string;
  text: string;
  textEn?: string;
}

interface UPSCQuestionMetadata {
  layoutType?: 'statements' | 'pairs' | 'table' | 'assertion_reason' | 'standard';
  listType?: 'roman' | 'number' | 'statements' | 'alpha' | 'none';
  contextStr?: string;
  contextStrEn?: string;
  listItems?: ListDataItem[];
  /** Multi-column table (e.g. Organization | Functions | Works under) from PDF/JSON pipeline */
  tableHeaders?: string[];
  tableHeadersEn?: string[];
  /** Explicit Hindi columns (when `tableRows` holds English or mixed pipelines) */
  tableHeadersHi?: string[];
  tableRows?: string[][];
  tableRowsEn?: string[][];
  /** Explicit Hindi rows */
  tableRowsHi?: string[][];
  /**
   * Optional nested i18n: { en: { tableRows, tableHeaders }, hi: { ... } }.
   * Also supported at read time: `translations.en.tableRows`, `locale.en.tableRows`, `englishTableRows`.
   */
  i18n?: {
    en?: { tableRows?: string[][]; tableHeaders?: string[] };
    hi?: { tableRows?: string[][]; tableHeaders?: string[] };
  };
  statementI?: string;
  statementIEn?: string;
  statementII?: string;
  statementIIEn?: string;
  statementIII?: string;
  statementIIIEn?: string;
  questionPrompt?: string;
  questionPromptEn?: string;
}

/** Option cell as stored in DB JSON */
type UpscQuestionOptionObject = {
  id?: string | number;
  text?: string;
  textEn?: string;
  text_en?: string;
};

type UpscQuestionOption = string | UpscQuestionOptionObject;

interface UpscMatchPair {
  id?: string | number;
  label?: string;
  labelEn?: string;
  match?: string;
  matchEn?: string;
  matchId?: string;
}

function upscOptionDisplayLength(o: UpscQuestionOption): number {
  if (typeof o === 'string') return o.length;
  const t = (o.text ?? o.textEn ?? o.text_en ?? '').toString();
  return t.length;
}

export interface UpscRendererQuestion {
  id: string;
  text: string;
  textEn?: string | null;
  type?: string;
  /** Array or JSON string from DB — normalized in the component. */
  options?: unknown;
  matchPairs?: unknown;
  correctAnswer?: unknown;
  /** Raw JSON from DB; parsed inside the component. */
  extendedData?: unknown;
}

interface UPSCQuestionRendererProps {
  question: UpscRendererQuestion;
  isHindi: boolean;
  showOptions?: boolean;
  theme?: 'light' | 'dark';
}

interface ParsedItem {
  marker: string;
  text: string;
  type: 'number' | 'roman' | 'statement' | 'alpha' | 'pair';
}

interface ParsedContent {
  context: string;
  items: ParsedItem[];
  questionLine: string;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const toRoman = (num: number): string => {
  if (num <= 0) return '';
  const romanNumerals: [string, number][] = [
    ['M', 1000], ['CM', 900], ['D', 500], ['CD', 400],
    ['C', 100], ['XC', 90], ['L', 50], ['XL', 40],
    ['X', 10], ['IX', 9], ['V', 5], ['IV', 4], ['I', 1]
  ];
  let result = '';
  for (const [symbol, value] of romanNumerals) {
    while (num >= value) {
      result += symbol;
      num -= value;
    }
  }
  return result;
};

const cleanHtml = (text: string): string => {
  return text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/?[^>]+(>|$)/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
};

/** True if extended intro HTML already contains Statement / कथन labels (would duplicate parsed items). */
function extIntroEmbedsStatementLabels(htmlOrText: string | undefined): boolean {
  if (!htmlOrText) return false;
  const plain = cleanHtml(htmlOrText).replace(/\s+/g, ' ');
  return /(?:Statement|कथन)\s*[-:]?\s*(?:I{1,3}|IV|V|VI{0,3}|VII|VIII|IX|X|\d+)\b/i.test(plain);
}

/** Plain intro line only — everything before the first Statement / कथन marker (matches parseUPSCContent). */
function introBeforeFirstStatement(rawText: string): string {
  if (!rawText) return '';
  const text = cleanHtml(rawText).replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
  const re = /(?:Statement|कथन)\s*[-:]?\s*(I{1,3}|IV|V|VI{0,3}|VII|VIII|IX|X|\d+)\s*[:.]?\s*/i;
  const m = text.match(re);
  if (m && m.index !== undefined && m.index > 0) {
    return text.substring(0, m.index).trim();
  }
  return '';
}

/**
 * Some CMS stems repeat "Statement-I … Statement-II …" after Statement III inside the last slice.
 * Truncate before that rerun so cards don't duplicate.
 */
function truncateDuplicateStatementTail(text: string): string {
  const patterns = [
    /\n\s*Statement-I\b/i,
    /\s{2,}Statement-I\b/i,
    /\n\s*Statement\s+I\s*[:.]/i,
    /\r?\n\s*(?:Statement|कथन)\s*-\s*I\b/i,
  ];
  let cut = text.length;
  for (const p of patterns) {
    const m = text.match(p);
    if (m && m.index !== undefined && m.index > 60 && m.index < cut) cut = m.index;
  }
  if (cut < text.length) return text.substring(0, cut).trim();
  return text;
}

// Valid Roman numerals for list items (I through X)
const ROMAN_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

const DEVANAGARI = /[\u0900-\u097F]/;

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

/** True if first non-empty cell looks like Hindi script */
function rowsLookDevanagari(rows: string[][]): boolean {
  for (const row of rows) {
    for (const cell of row) {
      const t = stripTags(String(cell ?? ''));
      if (t && DEVANAGARI.test(t)) return true;
      if (t) return false;
    }
  }
  return false;
}

function headersLookDevanagari(headers: string[]): boolean {
  return headers.some((h) => DEVANAGARI.test(stripTags(String(h ?? ''))));
}

function isFilledRowMatrix(v: unknown): v is string[][] {
  return Array.isArray(v) && v.length > 0 && Array.isArray((v as string[][])[0]);
}

function getNestedRecord(obj: unknown, key: string): Record<string, unknown> | undefined {
  if (obj == null || typeof obj !== 'object' || Array.isArray(obj)) return undefined;
  const v = (obj as Record<string, unknown>)[key];
  if (v != null && typeof v === 'object' && !Array.isArray(v)) return v as Record<string, unknown>;
  return undefined;
}

/** First non-empty row matrix among candidates (upload pipelines use different key shapes). */
function firstFilledRowMatrix(...candidates: unknown[]): string[][] | undefined {
  for (const c of candidates) {
    if (isFilledRowMatrix(c)) return c as string[][];
  }
  return undefined;
}

function firstFilledHeaderRow(...candidates: unknown[]): string[] | undefined {
  for (const c of candidates) {
    if (Array.isArray(c) && c.length > 0 && c.every((x) => typeof x === 'string' || typeof x === 'number')) {
      return c.map(String);
    }
  }
  return undefined;
}

/** Pick table rows/headers for UI language; supports En/Hi keys, snake_case, and i18n nesting. */
function resolveExtendedTable(
  ext: UPSCQuestionMetadata & Record<string, unknown>,
  isHindi: boolean
): { rows: string[][] | null; headers: string[] | null } {
  const r = ext;
  const x = r as Record<string, unknown>;

  const rowsEn = firstFilledRowMatrix(
    r.tableRowsEn,
    x.table_rows_en,
    r.i18n?.en?.tableRows,
    getNestedRecord(getNestedRecord(x, 'translations'), 'en')?.tableRows,
    getNestedRecord(getNestedRecord(x, 'translation'), 'en')?.tableRows,
    getNestedRecord(getNestedRecord(x, 'locale'), 'en')?.tableRows,
    x.tableRowsEnglish,
    x.englishTableRows
  );

  const rowsHi = firstFilledRowMatrix(
    r.tableRowsHi,
    x.table_rows_hi,
    r.i18n?.hi?.tableRows,
    getNestedRecord(getNestedRecord(x, 'translations'), 'hi')?.tableRows,
    getNestedRecord(getNestedRecord(x, 'translation'), 'hi')?.tableRows,
    getNestedRecord(getNestedRecord(x, 'locale'), 'hi')?.tableRows
  );

  const rowsBase = r.tableRows ?? (x.table_rows as string[][] | undefined);

  const headsEn = firstFilledHeaderRow(
    r.tableHeadersEn,
    x.table_headers_en,
    r.i18n?.en?.tableHeaders,
    getNestedRecord(getNestedRecord(x, 'translations'), 'en')?.tableHeaders,
    getNestedRecord(getNestedRecord(x, 'translation'), 'en')?.tableHeaders,
    getNestedRecord(getNestedRecord(x, 'locale'), 'en')?.tableHeaders,
    x.tableHeadersEnglish,
    x.englishTableHeaders
  );

  const headsHi = firstFilledHeaderRow(
    r.tableHeadersHi,
    x.table_headers_hi,
    r.i18n?.hi?.tableHeaders,
    getNestedRecord(getNestedRecord(x, 'translations'), 'hi')?.tableHeaders,
    getNestedRecord(getNestedRecord(x, 'translation'), 'hi')?.tableHeaders,
    getNestedRecord(getNestedRecord(x, 'locale'), 'hi')?.tableHeaders
  );

  const headsBase = r.tableHeaders ?? (x.table_headers as string[] | undefined);

  const pickHeaders = (): string[] | null => {
    const first = (...lists: (string[] | undefined | null)[]): string[] | null => {
      for (const h of lists) {
        if (h && h.length > 0) return h;
      }
      return null;
    };
    if (isHindi) {
      return first(headsHi, headsBase, headsEn);
    }
    if (headsEn && headsEn.length) return headsEn;
    if (headsBase && headsBase.length && !headersLookDevanagari(headsBase)) return headsBase;
    if (headsHi && headsHi.length) return headsHi;
    return headsBase && headsBase.length ? headsBase : null;
  };

  if (isHindi) {
    if (isFilledRowMatrix(rowsHi)) {
      return { rows: rowsHi, headers: pickHeaders() };
    }
    if (isFilledRowMatrix(rowsBase)) {
      return { rows: rowsBase, headers: pickHeaders() };
    }
    if (isFilledRowMatrix(rowsEn)) {
      return { rows: rowsEn, headers: pickHeaders() };
    }
    return { rows: null, headers: null };
  }

  // English: prefer explicit English rows; else Latin `tableRows`; else any
  if (isFilledRowMatrix(rowsEn)) {
    return { rows: rowsEn, headers: pickHeaders() };
  }
  if (isFilledRowMatrix(rowsBase)) {
    if (!rowsLookDevanagari(rowsBase)) {
      return { rows: rowsBase, headers: pickHeaders() };
    }
  }
  if (isFilledRowMatrix(rowsHi)) {
    return { rows: rowsHi, headers: pickHeaders() };
  }
  if (isFilledRowMatrix(rowsBase)) {
    return { rows: rowsBase, headers: pickHeaders() };
  }
  return { rows: null, headers: null };
}

// ============================================================================
// QUESTION LINE PATTERNS - Detect final question
// These patterns identify the closing question line that should appear separately
// ============================================================================

const QUESTION_LINE_PATTERNS = [
  // SUPER GENERIC - Any "How many of the above" regardless of what follows
  /How\s+many\s+of\s+the\s+above\b.*/i,
  
  // Generic "Which of the above" patterns
  /Which\s+of\s+the\s+(?:above|statements?\s+given\s+above).*/i,
  
  // "How many of the following" - also generic
  /How\s+many\s+of\s+the\s+following\b.*/i,
  
  // "Which one of the following is correct" patterns
  /Which\s+one\s+of\s+the\s+following\s+is\s+correct.*/i,
  
  // "In how many..." patterns  
  /In\s+how\s+many\s+of\s+the\s+above.*/i,
  
  // "Select the correct..." patterns
  /Select\s+the\s+(?:correct|right)\s+(?:answer|option|code).*/i,
  
  // "Which of the statements given above"
  /Which\s+of\s+the\s+statements?\s+given\s+above.*/i,
  
  // "The correct answer" / "correct option"
  /The\s+correct\s+(?:answer|option|code)\s+is.*/i,
  
  // "In which of the above/following"
  /In\s+which\s+of\s+the\s+(?:above|following).*/i,
  
  // Hindi patterns
  /उपर्युक्त\s+(?:कथनों|युग्मों)\s+में\s+से.*/i,
  /उपर्युक्त\s+कथनों\s+के\s+संदर्भ\s+में.*/i,
  /इनमें\s+से\s+कितने?\s+(?:कथन|युग्म).*/i,
  /सही\s+(?:कूट|उत्तर|विकल्प).*/i,
  /निम्नलिखित\s+में\s+से\s+कौन.*सही\s+है.*/i,
  /कितने\s+(?:कथन|युग्म|जोड़े)\s+सही\s+हैं.*/i,
];

/** Closing prompts ("Which of the following…") are short; stems that repeat similar phrases inside a statement are not. */
const MAX_QUESTION_TAIL_CHARS = 1100;

/**
 * After the last *first-seen* Statement/कथन header when there are 2+ distinct markers — question line must not be taken from earlier in the stem.
 */
function endAfterLastUniqueStatementHeader(text: string): number | null {
  const statementPattern =
    /(?:Statement|कथन)\s*[-:]?\s*(I{1,3}|IV|V|VI{0,3}|VII|VIII|IX|X|\d+)\s*[:.]?\s*/gi;
  const statementMatches = [...text.matchAll(statementPattern)];
  const seenStmtKeys = new Set<string>();
  const unique = statementMatches.filter((m) => {
    const key = m[1].toUpperCase();
    if (seenStmtKeys.has(key)) return false;
    seenStmtKeys.add(key);
    return true;
  });
  if (unique.length < 2) return null;
  const last = unique[unique.length - 1];
  return (last.index ?? 0) + last[0].length;
}

/** Prefer the latest match whose tail is short (real UPSC prompt at the end, not a phrase mid-statement). */
function extractClosingQuestionLine(text: string): { main: string; questionLine: string } {
  const len = text.length;
  if (!len) return { main: '', questionLine: '' };

  const afterLastStmt = endAfterLastUniqueStatementHeader(text);
  const minStart = afterLastStmt != null ? afterLastStmt : Math.floor(len * 0.28);

  let bestIdx = -1;
  for (const pattern of QUESTION_LINE_PATTERNS) {
    const re = new RegExp(
      pattern.source,
      pattern.global ? pattern.flags : `${pattern.flags}g`
    );
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const idx = m.index;
      const tailLen = len - idx;
      if (idx >= minStart && tailLen <= MAX_QUESTION_TAIL_CHARS && idx > bestIdx) {
        bestIdx = idx;
      }
    }
  }

  if (bestIdx >= 0) {
    return {
      main: text.substring(0, bestIdx).trim(),
      questionLine: text.substring(bestIdx).trim(),
    };
  }
  return { main: text, questionLine: '' };
}

/** Strip a trailing prompt from the last list slice only when it looks like a short closing line. */
function stripEmbeddedQuestionLineFromTail(itemText: string): { body: string; questionLine: string } {
  const len = itemText.length;
  if (!len) return { body: itemText, questionLine: '' };
  const minStart = Math.floor(len * 0.3);

  let bestIdx = -1;
  for (const pattern of QUESTION_LINE_PATTERNS) {
    const re = new RegExp(
      pattern.source,
      pattern.global ? pattern.flags : `${pattern.flags}g`
    );
    let m: RegExpExecArray | null;
    while ((m = re.exec(itemText)) !== null) {
      const idx = m.index;
      const tailLen = len - idx;
      if (idx >= minStart && tailLen <= MAX_QUESTION_TAIL_CHARS && idx > bestIdx) {
        bestIdx = idx;
      }
    }
  }

  if (bestIdx < 0) return { body: itemText, questionLine: '' };
  return {
    body: itemText.substring(0, bestIdx).trim(),
    questionLine: itemText.substring(bestIdx).trim(),
  };
}

// ============================================================================
// PARSER - Robust pattern detection
// ============================================================================

function parseUPSCContent(rawText: string): ParsedContent {
  if (!rawText) return { context: '', items: [], questionLine: '' };

  // Clean and normalize
  let text = cleanHtml(rawText);
  text = text.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();

  // Step 1: Extract question line from end (avoid matching mid-statement phrases)
  const extracted = extractClosingQuestionLine(text);
  let mainContent = extracted.main;
  let questionLine = extracted.questionLine;

  const items: ParsedItem[] = [];
  let context = mainContent;

  // Step 2: Try Statement pattern first (highest priority)
  // Pattern: "Statement I:", "Statement-I", "कथन I:", "कथन-I", etc.
  // Support both English "Statement" and Hindi "कथन"
  // Only match Roman numerals (I, II, III, IV, V) or numbers (1, 2, 3) - NOT single letters like "S"
  const statementPattern = /(?:Statement|कथन)\s*[-:]?\s*(I{1,3}|IV|V|VI{0,3}|VII|VIII|IX|X|\d+)\s*[:.]?\s*/gi;
  const statementMatches = [...mainContent.matchAll(statementPattern)];

  // CMS text often repeats "Statement I … III" then again "Statement-I …" — keep first occurrence per marker only.
  const seenStmtKeys = new Set<string>();
  const statementMatchesUnique = statementMatches.filter((m) => {
    const key = m[1].toUpperCase();
    if (seenStmtKeys.has(key)) return false;
    seenStmtKeys.add(key);
    return true;
  });

  if (statementMatchesUnique.length >= 2) {
    // Verify these are sequential (I, II, III or 1, 2, 3)
    const markers = statementMatchesUnique.map(m => m[1].toUpperCase());
    const isSequential = markers.every((m, i) => {
      if (i === 0) return true;
      const prevIdx = ROMAN_NUMERALS.indexOf(markers[i-1]);
      const currIdx = ROMAN_NUMERALS.indexOf(m);
      if (prevIdx >= 0 && currIdx >= 0) return currIdx > prevIdx;
      // Check numeric sequence
      const prevNum = parseInt(markers[i-1]);
      const currNum = parseInt(m);
      if (!isNaN(prevNum) && !isNaN(currNum)) return currNum > prevNum;
      return true;
    });

    if (isSequential) {
      context = mainContent.substring(0, statementMatchesUnique[0].index ?? 0).trim();
      
      for (let i = 0; i < statementMatchesUnique.length; i++) {
        const match = statementMatchesUnique[i];
        const startIdx = (match.index ?? 0) + match[0].length;
        const endIdx = i < statementMatchesUnique.length - 1 
          ? (statementMatchesUnique[i + 1].index ?? mainContent.length)
          : mainContent.length;
        
        let itemText = mainContent.substring(startIdx, endIdx).trim();
        
        // For last item, check if it contains a question line
        if (i === statementMatchesUnique.length - 1 && !questionLine) {
          const stripped = stripEmbeddedQuestionLineFromTail(itemText);
          if (stripped.questionLine) {
            questionLine = stripped.questionLine;
            itemText = stripped.body;
          }
        }
        
        if (itemText) {
          if (i === statementMatchesUnique.length - 1) {
            itemText = truncateDuplicateStatementTail(itemText);
          }
          // Use the original word (Statement/कथन) from the match
          const originalWord = match[0].includes('कथन') ? 'कथन' : 'Statement';
          items.push({
            marker: `${originalWord} ${match[1].toUpperCase()}`,
            text: itemText,
            type: 'statement',
          });
        }
      }
      
      return { context, items, questionLine };
    }
  }

  // Step 3: Try Roman numeral pattern
  // STRICT: Look for patterns like "I. Arunachal" - Roman numeral followed by period and capital letter
  // Support both English (A-Z) and Hindi (Devanagari: \u0900-\u097F) scripts
  const romanSplitPattern = /\s+(I{1,3}|IV|V|VI{0,3}|VII|VIII|IX|X)\.\s+(?=[A-Z\u0900-\u097F])/g;
  const romanMatches: RegExpMatchArray[] = [];
  let romanMatch;
  const romanRegex = new RegExp(romanSplitPattern.source, 'g');
  while ((romanMatch = romanRegex.exec(mainContent)) !== null) {
    if (ROMAN_NUMERALS.includes(romanMatch[1].toUpperCase())) {
      romanMatches.push(romanMatch);
    }
  }
  
  // Validate roman numerals are in sequence
  const validRomanMatches = romanMatches.filter(m => ROMAN_NUMERALS.includes(m[1].toUpperCase()));
  
  if (validRomanMatches.length >= 2) {
    // Check if they form a proper sequence (I, II, III...)
    const romanIndices = validRomanMatches.map(m => ROMAN_NUMERALS.indexOf(m[1].toUpperCase()));
    let isValidSequence = true;
    for (let i = 1; i < romanIndices.length; i++) {
      if (romanIndices[i] <= romanIndices[i-1]) {
        isValidSequence = false;
        break;
      }
    }
    
    if (isValidSequence) {
      context = mainContent.substring(0, validRomanMatches[0].index ?? 0).trim();
      
      for (let i = 0; i < validRomanMatches.length; i++) {
        const match = validRomanMatches[i];
        const startIdx = (match.index ?? 0) + match[0].length;
        const endIdx = i < validRomanMatches.length - 1 
          ? (validRomanMatches[i + 1].index ?? mainContent.length)
          : mainContent.length;
        
        let itemText = mainContent.substring(startIdx, endIdx).trim();
        
        // For last item, check if it contains a question line
        if (i === validRomanMatches.length - 1 && !questionLine) {
          const stripped = stripEmbeddedQuestionLineFromTail(itemText);
          if (stripped.questionLine) {
            questionLine = stripped.questionLine;
            itemText = stripped.body;
          }
        }
        
        if (itemText) {
          items.push({
            marker: `${match[1].toUpperCase()}.`,
            text: itemText,
            type: 'roman',
          });
        }
      }
      
      return { context, items, questionLine };
    }
  }

  // Step 4: Try number pattern (1. 2. 3.)
  // STRICT: Number followed by period/paren and capital letter (English or Hindi)
  const numberSplitPattern = /\s+(\d+)[.\)]\s+(?=[A-Z\u0900-\u097F])/g;
  const numberMatches: RegExpMatchArray[] = [];
  let numMatch;
  const numRegex = new RegExp(numberSplitPattern.source, 'g');
  while ((numMatch = numRegex.exec(mainContent)) !== null) {
    numberMatches.push(numMatch);
  }
  
  if (numberMatches.length >= 2) {
    // Verify sequential numbers starting from 1
    const numbers = numberMatches.map(m => parseInt(m[1]));
    const isSequential = numbers.every((n, i) => i === 0 ? n === 1 : n === numbers[i-1] + 1);
    
    if (isSequential && numbers[0] === 1) {
      context = mainContent.substring(0, numberMatches[0].index ?? 0).trim();
      
      for (let i = 0; i < numberMatches.length; i++) {
        const match = numberMatches[i];
        const startIdx = (match.index ?? 0) + match[0].length;
        const endIdx = i < numberMatches.length - 1 
          ? (numberMatches[i + 1].index ?? mainContent.length)
          : mainContent.length;
        
        let itemText = mainContent.substring(startIdx, endIdx).trim();
        
        // For last item, check if it contains a question line
        if (i === numberMatches.length - 1 && !questionLine) {
          const stripped = stripEmbeddedQuestionLineFromTail(itemText);
          if (stripped.questionLine) {
            questionLine = stripped.questionLine;
            itemText = stripped.body;
          }
        }
        
        if (itemText) {
          items.push({
            marker: `${match[1]}.`,
            text: itemText,
            type: 'number',
          });
        }
      }
      
      return { context, items, questionLine };
    }
  }

  // Step 5: Handle "Consider the following" with inline items
  const considerMatch = mainContent.match(/consider\s+the\s+following[^:]*:\s*/i);
  if (considerMatch && considerMatch.index !== undefined) {
    const afterColon = mainContent.substring(considerMatch.index + considerMatch[0].length);
    context = mainContent.substring(0, considerMatch.index + considerMatch[0].length).trim();
    
    // Try to find inline numbered items: "1. item 2. item 3. item"
    // Be careful not to match "a." articles - support both English and Hindi
    const inlineItems = afterColon.split(/\s+(?=\d+\.\s+[A-Z\u0900-\u097F])/);
    if (inlineItems.length >= 2) {
      for (const item of inlineItems) {
        const match = item.match(/^(\d+)\.\s+(.+)/);
        if (match) {
          items.push({
            marker: `${match[1]}.`,
            text: match[2].trim(),
            type: 'number',
          });
        }
      }
      if (items.length >= 2) {
        return { context, items, questionLine };
      }
      items.length = 0; // Reset if failed
    }
    
    // Try Roman numerals inline - support both English and Hindi
    const romanInlineItems = afterColon.split(/\s+(?=(?:I{1,3}|IV|V|VI{0,3})\.\s+[A-Z\u0900-\u097F])/i);
    if (romanInlineItems.length >= 2) {
      for (const item of romanInlineItems) {
        const match = item.match(/^(I{1,3}|IV|V|VI{0,3})\.\s+(.+)/i);
        if (match && ROMAN_NUMERALS.includes(match[1].toUpperCase())) {
          items.push({
            marker: `${match[1].toUpperCase()}.`,
            text: match[2].trim(),
            type: 'roman',
          });
        }
      }
      if (items.length >= 2) {
        return { context, items, questionLine };
      }
      items.length = 0;
    }
    
    // Reset context if no items found
    context = mainContent;
  }

  return { context, items, questionLine };
}

// ============================================================================
// THEME STYLES
// ============================================================================

const getThemeStyles = (theme: 'light' | 'dark') => {
  if (theme === 'light') {
    return {
      container: 'text-slate-900',
      context: 'text-slate-900',
      itemMarker: 'text-slate-700 bg-slate-100',
      itemMarkerStatement: 'text-blue-800 bg-blue-50 border-blue-200',
      itemText: 'text-slate-800',
      questionLine: 'text-emerald-900 border-emerald-500 bg-emerald-50',
      optionBg: 'border-slate-200 bg-white hover:bg-slate-50',
      optionCorrect: 'border-emerald-500 bg-emerald-50',
      optionMarker: 'bg-slate-100 text-slate-600',
      optionMarkerCorrect: 'bg-emerald-500 text-white',
      optionText: 'text-slate-700',
      optionTextCorrect: 'text-emerald-800',
    };
  }
  return {
    container: 'text-slate-100',
    context: 'text-white',
    itemMarker: 'text-amber-400 bg-amber-500/10',
    itemMarkerStatement: 'text-blue-300 bg-blue-500/10 border-blue-500/30',
    itemText: 'text-slate-200',
    questionLine: 'text-emerald-100 border-emerald-500/60 bg-gradient-to-r from-emerald-500/15 to-transparent',
    optionBg: 'border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.05]',
    optionCorrect: 'border-emerald-500/40 bg-emerald-500/[0.1]',
    optionMarker: 'bg-white/5 text-slate-500',
    optionMarkerCorrect: 'bg-emerald-500 text-white',
    optionText: 'text-slate-300',
    optionTextCorrect: 'text-emerald-50',
  };
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const UPSCQuestionRenderer: React.FC<UPSCQuestionRendererProps> = ({
  question,
  isHindi,
  showOptions = true,
  theme = 'dark',
}) => {
  const styles = useMemo(() => getThemeStyles(theme), [theme]);
  
  // Parse extended data
  const ext = useMemo(() => {
    if (!question.extendedData) return null;
    try {
      return (typeof question.extendedData === 'string' 
        ? JSON.parse(question.extendedData) 
        : question.extendedData) as UPSCQuestionMetadata;
    } catch { return null; }
  }, [question.extendedData]);

  /**
   * Plain-text parser runs on ONE string: Hindi uses `question.text`, English uses `questionTextEn`.
   * Often the English stem is short ("consider… In how many…") while Hindi still has "Row I / II / III"
   * or Roman-numeral lines — so `parseUPSCContent(en)` yields **no items** and Hindi yields rows.
   * Fallback: reuse row splits from Hindi text for the middle block (until extendedData / full EN stem exist).
   */
  const { parsed, usedHindiRowFallback } = useMemo(() => {
    const primaryText = isHindi ? question.text : question.textEn || question.text;
    const fromPrimary = parseUPSCContent(primaryText);

    if (isHindi) {
      return { parsed: fromPrimary, usedHindiRowFallback: false };
    }
    if (fromPrimary.items.length > 0) {
      return { parsed: fromPrimary, usedHindiRowFallback: false };
    }
    if (question.text && question.text.trim() !== primaryText.trim()) {
      const fromHindi = parseUPSCContent(question.text);
      if (fromHindi.items.length > 0) {
        return {
          parsed: { ...fromPrimary, items: fromHindi.items },
          usedHindiRowFallback: true,
        };
      }
    }
    return { parsed: fromPrimary, usedHindiRowFallback: false };
  }, [isHindi, question.text, question.textEn]);

  // Determine display values
  const contextStr = useMemo(() => {
    const parsedStatementBlocks =
      parsed.items.length >= 2 && parsed.items.every((it) => it.type === 'statement');
    const fromExtStatementList =
      Boolean(
        ext?.listItems &&
          ext.listItems.length >= 2 &&
          (ext.listType === 'statements' || ext.layoutType === 'statements')
      );
    const structuredStatements = parsedStatementBlocks || fromExtStatementList;

    // CMS often puts full stem+statements in contextStr while we also render statement cards → duplicate.
    if (structuredStatements) {
      const stem = isHindi ? question.text : question.textEn || question.text;
      let intro = (parsed.context || '').trim();
      const stemPlain = cleanHtml(stem).replace(/\s+/g, ' ');
      const stemLen = stemPlain.length || 1;
      if (!intro || intro.length > stemLen * 0.72) {
        const cut = introBeforeFirstStatement(stem);
        if (cut) intro = cut;
      }
      return intro;
    }

    if (!ext?.contextStr && !ext?.contextStrEn) {
      return parsed.context;
    }
    const extIntro = isHindi ? ext.contextStr! : ext.contextStrEn || ext.contextStr!;
    if (parsedStatementBlocks && extIntroEmbedsStatementLabels(extIntro)) {
      return parsed.context;
    }
    return extIntro;
  }, [ext, isHindi, parsed.context, parsed.items, question.text, question.textEn]);

  const questionLine = ext?.questionPrompt 
    ? (isHindi ? ext.questionPrompt : ext.questionPromptEn || ext.questionPrompt) 
    : parsed.questionLine;
  
  const extendedTable = useMemo(() => {
    if (!ext) {
      return { rows: null as string[][] | null, headers: null as string[] | null };
    }
    const r = ext as Record<string, unknown>;
    const hasRowMatrix =
      (Array.isArray(ext.tableRows) && ext.tableRows.length > 0) ||
      (Array.isArray(ext.tableRowsEn) && ext.tableRowsEn.length > 0) ||
      (Array.isArray(r.table_rows) && (r.table_rows as string[][]).length > 0) ||
      (Array.isArray(r.table_rows_en) && (r.table_rows_en as string[][]).length > 0);
    /** Table renders if layoutType is table/pairs OR rows exist (layoutType optional in JSON uploads). */
    const isTableLayout =
      ext.layoutType === 'table' ||
      ext.layoutType === 'pairs' ||
      hasRowMatrix;
    if (!isTableLayout) {
      return { rows: null as string[][] | null, headers: null as string[] | null };
    }
    return resolveExtendedTable(ext as UPSCQuestionMetadata & Record<string, unknown>, isHindi);
  }, [ext, isHindi]);

  const extendedTableRows = extendedTable.rows;
  const extendedTableHeaders = extendedTable.headers;

  // Get display items (exclude matchPairs if we're showing them as a table)
  const displayItems = useMemo(() => {
    // Priority: extendedData > parsed > (NOT matchPairs when type=matching)
    if (ext?.listItems && ext.listItems.length > 0) {
      const listType = ext.listType || 'roman';
      return ext.listItems.map((item, idx) => ({
        marker: item.id
          ? `${item.id}.`
          : listType === 'roman'
            ? `${toRoman(idx + 1)}.`
            : `${idx + 1}.`,
        text: isHindi ? item.text : item.textEn || item.text,
        type: listType as ParsedItem['type'],
      }));
    }

    if (extendedTableRows) {
      return [];
    }
    
    // For matching type, don't add matchPairs here - they'll be shown as a table
    if (question.type === 'matching') {
      return parsed.items;
    }
    
    // For non-matching questions with matchPairs data, show as list items
    const pairsUnknown = question.matchPairs;
    if (Array.isArray(pairsUnknown) && pairsUnknown.length > 0) {
      const pairs = pairsUnknown as UpscMatchPair[];
      return pairs.map((pair: UpscMatchPair) => ({
        marker: pair.id != null && String(pair.id) !== '' ? String(pair.id) : '1.',
        text: `${isHindi ? pair.label : (pair.labelEn || pair.label)} - ${isHindi ? pair.match : (pair.matchEn || pair.match)}`,
        type: 'pair' as ParsedItem['type'],
      }));
    }
    
    return parsed.items;
  }, [ext, extendedTableRows, question.matchPairs, question.type, parsed.items, isHindi]);

  // Parse options
  const options = useMemo((): UpscQuestionOption[] => {
    const raw = question.options;
    let rawOptions: UpscQuestionOption[] = [];
    if (Array.isArray(raw)) rawOptions = raw as UpscQuestionOption[];
    else if (typeof raw === 'string') {
      try {
        const parsed: unknown = JSON.parse(raw);
        rawOptions = Array.isArray(parsed) ? (parsed as UpscQuestionOption[]) : [];
      } catch {
        rawOptions = [];
      }
    }
    return rawOptions.slice(0, 4);
  }, [question.options]);

  const isShortOptions = options.every((o) => upscOptionDisplayLength(o) < 45);
  
  const correctIndex = useMemo(() => {
    const ans = question.correctAnswer;
    if (ans === undefined || ans === null) return -1;
    if (typeof ans === 'number') return ans;
    
    // String matching
    if (typeof ans === 'string') {
      const upper = ans.trim().toUpperCase();
      if (['A','B','C','D'].includes(upper)) return upper.charCodeAt(0) - 65;
      
      // Try finding by ID or Text in options
      if (options && Array.isArray(options)) {
        const idx = options.findIndex((opt: UpscQuestionOption) => {
          if (typeof opt === 'string') {
             return opt.trim().toLowerCase() === ans.trim().toLowerCase();
          }
          if (opt && typeof opt === 'object') {
             if (String(opt.id) === String(ans) || String(opt.id).toUpperCase() === upper) return true;
             if (opt.text && String(opt.text).trim().toLowerCase() === ans.trim().toLowerCase()) return true;
             if (opt.textEn && String(opt.textEn).trim().toLowerCase() === ans.trim().toLowerCase()) return true;
          }
          return false;
        });
        if (idx !== -1) return idx;
      }

      // Check numeric strings '1', '2', '3', '4'
      const num = parseInt(ans);
      if (!isNaN(num) && num >= 1 && num <= 4) return num - 1;
    }
    
    return -1;
  }, [question.correctAnswer, options]);

  // Check if items are statements
  const isStatementType = displayItems.some(item => 
    item.type === 'statement' || item.marker.toLowerCase().includes('statement')
  );

  const parsedStatementBlocks =
    parsed.items.length >= 2 && parsed.items.every((it) => it.type === 'statement');
  const showAssertionReasonBlock =
    ext?.layoutType === 'assertion_reason' && !parsedStatementBlocks;

  return (
    <div className={cn('space-y-4 font-serif selection:bg-emerald-500/30', styles.container)}>
      {/* Context/Introduction */}
      {contextStr && (
        <div
          className={cn(
            'text-[17px] leading-[1.75] font-semibold tracking-tight sm:text-[19px]',
            styles.context
          )}
          dangerouslySetInnerHTML={{ __html: contextStr }}
        />
      )}

      {usedHindiRowFallback && (
        <p
          className={cn(
            'rounded-lg border px-3 py-2 text-[12px] leading-snug sm:text-[13px]',
            theme === 'dark'
              ? 'border-amber-500/30 bg-amber-500/10 text-amber-100'
              : 'border-amber-200 bg-amber-50 text-amber-950'
          )}
        >
          Row details below were parsed from the Hindi stem (English{' '}
          <code className="rounded bg-black/10 px-1 text-[11px]">questionTextEn</code> has no extractable rows). Add{' '}
          <code className="rounded bg-black/10 px-1 text-[11px]">extendedData.tableRowsEn</code> /{' '}
          <code className="rounded bg-black/10 px-1 text-[11px]">tableHeadersEn</code>,{' '}
          <code className="rounded bg-black/10 px-1 text-[11px]">i18n.en.tableRows</code>, or a full English stem.
        </p>
      )}

      {/* List Items - UPSC Paper Style */}
      {displayItems.length > 0 && (
        <div className={cn(
          'py-2',
          isStatementType ? 'space-y-4' : 'space-y-2.5 pl-2 sm:pl-4'
        )}>
          {displayItems.map((item, idx) => (
            <div key={idx} className={cn(
              'flex',
              isStatementType ? 'flex-col gap-2' : 'items-start gap-3 sm:gap-4'
            )}>
              {/* Marker */}
              <span className={cn(
                'shrink-0 font-bold',
                isStatementType 
                  ? cn('text-[15px] sm:text-[16px] px-3 py-1 rounded-md border w-fit', styles.itemMarkerStatement)
                  : cn('text-[15px] sm:text-[17px] w-8 sm:w-10 text-right rounded px-1', styles.itemMarker)
              )}>
                {item.marker}
              </span>
              {/* Text */}
              <div className={cn(
                'leading-relaxed font-medium min-w-0 flex-1',
                isStatementType 
                  ? 'text-[16px] sm:text-[18px] pl-1' 
                  : 'text-[15px] sm:text-[17px]',
                styles.itemText
              )}>
                <span dangerouslySetInnerHTML={{ __html: item.text }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* extendedData: paper-style table (rows/columns), e.g. Polity org chart questions */}
      {extendedTableRows && extendedTableRows.length > 0 && (
        <div className="overflow-x-auto py-2">
          <table
            className={cn(
              'w-full min-w-[280px] border-collapse text-left text-[14px] sm:text-[16px]',
              theme === 'dark'
                ? 'rounded-xl border border-white/10 bg-white/[0.03]'
                : 'overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm'
            )}
          >
            {extendedTableHeaders && extendedTableHeaders.length > 0 && (
              <thead>
                <tr className={theme === 'dark' ? 'bg-white/10' : 'bg-slate-50'}>
                  {extendedTableHeaders.map((h, i) => (
                    <th
                      key={i}
                      className={cn(
                        'border-b px-3 py-2.5 font-bold leading-snug sm:px-4 sm:py-3',
                        theme === 'dark' ? 'border-white/10 text-slate-100' : 'border-slate-200 text-slate-900'
                      )}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {extendedTableRows.map((row, ri) => (
                <tr
                  key={ri}
                  className={
                    theme === 'dark'
                      ? 'border-b border-white/[0.06] last:border-0'
                      : 'border-b border-slate-100 last:border-0'
                  }
                >
                  {row.map((cell, ci) => (
                    <td
                      key={ci}
                      className={cn(
                        'px-3 py-2.5 align-top leading-relaxed sm:px-4 sm:py-3',
                        styles.itemText
                      )}
                    >
                      <span dangerouslySetInnerHTML={{ __html: cell }} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Assertion/Reason Layout — skip if stem already parsed as multi-statement (avoids I/II twice) */}
      {showAssertionReasonBlock && (
        <div className="space-y-5 py-2">
          {[
            { label: isHindi ? 'कथन-I' : 'Statement-I', text: isHindi ? ext.statementI : ext.statementIEn || ext.statementI },
            { label: isHindi ? 'कथन-II' : 'Statement-II', text: isHindi ? ext.statementII : ext.statementIIEn || ext.statementII },
          ].filter(s => s.text).map((s, idx) => (
            <div key={idx} className="flex flex-col gap-2">
              <span className={cn(
                'text-[15px] sm:text-[16px] font-bold px-3 py-1 rounded-md border w-fit',
                styles.itemMarkerStatement
              )}>
                {s.label}
              </span>
              <p className={cn('text-[16px] leading-relaxed font-medium sm:text-[18px] pl-1', styles.itemText)}>
                {s.text}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Match Pairs / Table */}
      {question.type === 'matching' && Array.isArray(question.matchPairs) && question.matchPairs.length > 0 && (
        <div className={cn(
          'overflow-hidden rounded-2xl border py-3',
          theme === 'dark' 
            ? 'border-white/[0.08] bg-slate-900/50'
            : 'border-slate-200 bg-white shadow-sm'
        )}>
          <RenderTableQuestion
            matchPairs={question.matchPairs as QuizQuestion['matchPairs']}
            language={isHindi ? 'hi' : 'en'}
            darkMode={theme === 'dark'}
          />
        </div>
      )}

      {/* Question Line - Always on new line, highlighted */}
      {questionLine && (
        <div className="mt-6">
          <div className={cn(
            'border-l-4 px-4 py-3 rounded-r-xl',
            styles.questionLine
          )}>
            <div
              className={cn('text-[16px] font-bold leading-relaxed sm:text-[18px]')}
              dangerouslySetInnerHTML={{ __html: questionLine }}
            />
          </div>
        </div>
      )}

      {/* Options */}
      {showOptions && options.length > 0 && (
        <div className={cn(
          'mt-6 pt-5',
          theme === 'dark' ? 'border-t border-white/5' : 'border-t border-slate-100'
        )}>
          <div className="mb-5 flex items-center gap-3">
            <span className={cn(
              'text-[10px] font-bold tracking-[0.25em] uppercase',
              theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
            )}>
              Options
            </span>
            <div className={cn(
              'h-px flex-1',
              theme === 'dark' ? 'bg-white/10' : 'bg-slate-200'
            )} />
          </div>

          <div className={cn('grid gap-2.5 sm:gap-3', isShortOptions ? 'sm:grid-cols-2' : 'grid-cols-1')}>
            {options.map((opt, idx) => {
              const parsedOpt = typeof opt === 'object' && opt !== null ? opt : { text: opt };
              const isCorrect = correctIndex === idx;
              const optText = isHindi
                ? parsedOpt.text || (typeof opt === 'string' ? opt : '')
                : [
                    (parsedOpt as Record<string, unknown>).text_en,
                    parsedOpt.textEn,
                    (parsedOpt as Record<string, unknown>)['text-en'],
                    parsedOpt.text,
                    typeof opt === 'string' ? opt : '',
                  ]
                    .map((x) => (typeof x === 'string' ? x : ''))
                    .find((s) => s && s.trim().length > 0) || '';
              const letter = String.fromCharCode(65 + idx);

              return (
                <div key={idx} className={cn(
                  'flex items-center gap-3 rounded-xl border p-3 sm:p-3.5 transition-all',
                  isCorrect ? styles.optionCorrect : styles.optionBg,
                  isCorrect && theme === 'dark' && 'shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                )}>
                  <div className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold',
                    isCorrect ? styles.optionMarkerCorrect : styles.optionMarker
                  )}>
                    {letter}
                  </div>
                  
                  <div className={cn(
                    'flex-1 text-[13px] sm:text-[14px] leading-snug font-medium',
                    isCorrect ? styles.optionTextCorrect : styles.optionText
                  )} dangerouslySetInnerHTML={{ __html: optText }} />
                  
                  {isCorrect && (
                    <div className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/20">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

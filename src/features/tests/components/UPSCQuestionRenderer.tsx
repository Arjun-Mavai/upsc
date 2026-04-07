import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { RenderTableQuestion } from '@/features/tests/utils/questionFormatter';

// ============================================================================
// TYPES
// ============================================================================

interface ListDataItem {
  id: string;
  text: string;
  textEn?: string;
}

interface UPSCQuestionMetadata {
  layoutType?: 'statements' | 'table' | 'assertion_reason' | 'standard';
  listType?: 'roman' | 'number' | 'statements' | 'alpha' | 'none';
  contextStr?: string;
  contextStrEn?: string;
  listItems?: ListDataItem[];
  statementI?: string;
  statementIEn?: string;
  statementII?: string;
  statementIIEn?: string;
  statementIII?: string;
  statementIIIEn?: string;
  questionPrompt?: string;
  questionPromptEn?: string;
}

interface QuestionData {
  id: string;
  text: string;
  textEn?: string | null;
  type?: string;
  options?: any[];
  matchPairs?: any[];
  correctAnswer?: any;
  extendedData?: UPSCQuestionMetadata | string | null;
}

interface UPSCQuestionRendererProps {
  question: QuestionData;
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

// Valid Roman numerals for list items (I through X)
const ROMAN_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

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

// ============================================================================
// PARSER - Robust pattern detection
// ============================================================================

function parseUPSCContent(rawText: string): ParsedContent {
  if (!rawText) return { context: '', items: [], questionLine: '' };

  // Clean and normalize
  let text = cleanHtml(rawText);
  text = text.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();

  // Step 1: Extract question line from end
  let questionLine = '';
  let mainContent = text;
  
  for (const pattern of QUESTION_LINE_PATTERNS) {
    const match = text.match(pattern);
    if (match && match.index !== undefined) {
      // More flexible threshold: either after 20% of text OR after any statement patterns
      const hasStatements = /(?:Statement|कथन)\s*[-:]?\s*[I1]/.test(text);
      const flexibleThreshold = hasStatements ? text.length * 0.2 : text.length * 0.3;
      
      if (match.index > flexibleThreshold) {
        questionLine = text.substring(match.index).trim();
        mainContent = text.substring(0, match.index).trim();
        break;
      }
    }
  }

  const items: ParsedItem[] = [];
  let context = mainContent;

  // Step 2: Try Statement pattern first (highest priority)
  // Pattern: "Statement I:", "Statement-I", "कथन I:", "कथन-I", etc.
  // Support both English "Statement" and Hindi "कथन"
  // Only match Roman numerals (I, II, III, IV, V) or numbers (1, 2, 3) - NOT single letters like "S"
  const statementPattern = /(?:Statement|कथन)\s*[-:]?\s*(I{1,3}|IV|V|VI{0,3}|VII|VIII|IX|X|\d+)\s*[:.]?\s*/gi;
  const statementMatches = [...mainContent.matchAll(statementPattern)];
  
  if (statementMatches.length >= 2) {
    // Verify these are sequential (I, II, III or 1, 2, 3)
    const markers = statementMatches.map(m => m[1].toUpperCase());
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
      context = mainContent.substring(0, statementMatches[0].index ?? 0).trim();
      
      for (let i = 0; i < statementMatches.length; i++) {
        const match = statementMatches[i];
        const startIdx = (match.index ?? 0) + match[0].length;
        const endIdx = i < statementMatches.length - 1 
          ? (statementMatches[i + 1].index ?? mainContent.length)
          : mainContent.length;
        
        let itemText = mainContent.substring(startIdx, endIdx).trim();
        
        // For last item, check if it contains a question line
        if (i === statementMatches.length - 1 && !questionLine) {
          for (const pattern of QUESTION_LINE_PATTERNS) {
            const qlMatch = itemText.match(pattern);
            if (qlMatch && qlMatch.index !== undefined && qlMatch.index >= 0) {
              questionLine = itemText.substring(qlMatch.index).trim();
              itemText = itemText.substring(0, qlMatch.index).trim();
              break;
            }
          }
        }
        
        if (itemText) {
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
          for (const pattern of QUESTION_LINE_PATTERNS) {
            const qlMatch = itemText.match(pattern);
            if (qlMatch && qlMatch.index !== undefined && qlMatch.index >= 0) {
              questionLine = itemText.substring(qlMatch.index).trim();
              itemText = itemText.substring(0, qlMatch.index).trim();
              break;
            }
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
          for (const pattern of QUESTION_LINE_PATTERNS) {
            const qlMatch = itemText.match(pattern);
            if (qlMatch && qlMatch.index !== undefined && qlMatch.index >= 0) {
              questionLine = itemText.substring(qlMatch.index).trim();
              itemText = itemText.substring(0, qlMatch.index).trim();
              break;
            }
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

  // Get base text
  const baseText = isHindi ? question.text : question.textEn || question.text;
  
  // Parse content
  const parsed = useMemo(() => parseUPSCContent(baseText), [baseText]);

  // Determine display values
  const contextStr = ext?.contextStr 
    ? (isHindi ? ext.contextStr : ext.contextStrEn || ext.contextStr) 
    : parsed.context;
    
  const questionLine = ext?.questionPrompt 
    ? (isHindi ? ext.questionPrompt : ext.questionPromptEn || ext.questionPrompt) 
    : parsed.questionLine;
  
  // Get display items (exclude matchPairs if we're showing them as a table)
  const displayItems = useMemo(() => {
    // Priority: extendedData > parsed > (NOT matchPairs when type=matching)
    if (ext?.listItems && ext.listItems.length > 0) {
      const listType = ext.listType || 'roman';
      return ext.listItems.map((item, idx) => ({
        marker: listType === 'roman' ? `${toRoman(idx + 1)}.` : `${idx + 1}.`,
        text: isHindi ? item.text : item.textEn || item.text,
        type: listType as ParsedItem['type'],
      }));
    }
    
    // For matching type, don't add matchPairs here - they'll be shown as a table
    if (question.type === 'matching') {
      return parsed.items;
    }
    
    // For non-matching questions with matchPairs data, show as list items
    if (question.matchPairs && Array.isArray(question.matchPairs) && question.matchPairs.length > 0) {
      return question.matchPairs.map((pair: any) => ({
        marker: pair.id || '1.',
        text: `${isHindi ? pair.label : (pair.labelEn || pair.label)} - ${isHindi ? pair.match : (pair.matchEn || pair.match)}`,
        type: 'pair' as ParsedItem['type'],
      }));
    }
    
    return parsed.items;
  }, [ext, question.matchPairs, question.type, parsed.items, isHindi]);

  // Parse options
  const options = useMemo(() => {
    let rawOptions: any[] = [];
    if (Array.isArray(question.options)) rawOptions = question.options;
    else if (typeof question.options === 'string') {
      try { rawOptions = JSON.parse(question.options); } catch { rawOptions = []; }
    }
    return rawOptions.slice(0, 4);
  }, [question.options]);

  const isShortOptions = options.every(o => (o?.text || o || '').toString().length < 45);
  
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
        const idx = options.findIndex(opt => {
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

  return (
    <div className={cn('space-y-5 font-serif selection:bg-emerald-500/30', styles.container)}>
      {/* Context/Introduction */}
      {contextStr && (
        <div className={cn(
          'text-[17px] leading-[1.75] font-semibold tracking-tight sm:text-[19px]',
          styles.context
        )}>
          {contextStr}
        </div>
      )}

      {/* List Items - UPSC Paper Style */}
      {displayItems.length > 0 && (
        <div className={cn(
          'py-3',
          isStatementType ? 'space-y-5' : 'space-y-3 pl-2 sm:pl-4'
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

      {/* Assertion/Reason Layout */}
      {ext?.layoutType === 'assertion_reason' && (
        <div className="space-y-6 py-3">
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
      {question.type === 'matching' && question.matchPairs && (
        <div className={cn(
          'overflow-hidden rounded-2xl border py-3',
          theme === 'dark' 
            ? 'border-white/[0.08] bg-slate-900/50'
            : 'border-slate-200 bg-white shadow-sm'
        )}>
          <RenderTableQuestion
            matchPairs={question.matchPairs}
            language={isHindi ? 'hi' : 'en'}
            darkMode={theme === 'dark'}
          />
        </div>
      )}

      {/* Question Line - Always on new line, highlighted */}
      {questionLine && (
        <div className="mt-6">
          <div className={cn(
            'border-l-4 px-5 py-4 rounded-r-xl',
            styles.questionLine
          )}>
            <div className={cn(
              'text-[16px] font-bold leading-relaxed sm:text-[18px]'
            )}>
              {questionLine}
            </div>
          </div>
        </div>
      )}

      {/* Options */}
      {showOptions && options.length > 0 && (
        <div className={cn(
          'mt-8 pt-6',
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
                : parsedOpt.text_en || parsedOpt.textEn || parsedOpt.text || (typeof opt === 'string' ? opt : '');
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

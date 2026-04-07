import React from 'react';
import { cn } from '@/lib/utils';
import { Question } from '@/types/quiz';
import { UPSCQuestionRenderer } from '@/features/tests/components/UPSCQuestionRenderer';

/**
 * Removes the raw "List-I ... List-II" text from the question description
 * if we already have structured matchPairs to render a beautiful table.
 */
export function cleanMatchingQuestionText(questionText: string, question: Question): string {
  if (
    !questionText ||
    question.type !== 'matching' ||
    !question.matchPairs ||
    question.matchPairs.length === 0
  ) {
    return questionText;
  }

  // Broad regex matching List-I, List-II, List-1, List-2, and Hindi variants
  const listRegex = /List-?\s*I{1,2}\b|सूची-?\s*I{1,2}\b|सूची-?\s*[12]/i;
  const listIndex = questionText.search(listRegex);

  if (listIndex !== -1) {
    return questionText.substring(0, listIndex).trim();
  }

  return questionText;
}

/**
 * Maps correct answer string (A/B/C/D or 0/1/2/3) to numeric index
 */
// (Already imported from @/lib/quiz-scoring)

interface FormattedQuestionTextProps {
  text: string;
  className?: string;
  question?: Question;
  isHindi?: boolean;
  useEnhancedRenderer?: boolean;
  theme?: 'light' | 'dark';
}

export function FormattedQuestionText({ 
  text, 
  className, 
  question, 
  isHindi = false, 
  useEnhancedRenderer = false,
  theme = 'light',
}: FormattedQuestionTextProps) {
  if (!text) return null;

  // Use enhanced UPSCQuestionRenderer when available and requested
  if (useEnhancedRenderer && question) {
    const questionData = {
      id: question.id,
      text: text,
      textEn: question.questionEn || null,
      type: question.type,
      options: question.options,
      correctAnswer: question.correctAnswer,
      extendedData: (question as any).extended_data || (question as any).extendedData || null,
      matchPairs: question.matchPairs,
    };
    
    return (
      <div className={className}>
        <UPSCQuestionRenderer 
          question={questionData} 
          isHindi={isHindi} 
          showOptions={false}
          theme={theme}
        />
      </div>
    );
  }

  // 1. Check for "Match Column" / "List-I & List-II" pattern (English + Hindi)
  const hasListPattern =
    (text.includes('List-I') && text.includes('List-II')) ||
    (text.includes('सूची-I') && text.includes('सूची-II')) ||
    (text.includes('सूची-1') && text.includes('सूची-2')) ||
    (text.includes('सूची- I') && text.includes('सूची- II'));
  if (hasListPattern) {
    return <RenderTableQuestion text={text} className={className} />;
  }

  // 2. Check for "Assertion (A)" and "Reason (R)" or "Statement I" & "Statement II" (including Hindi equivalents)
  const hasAssertionPattern = text.includes('Assertion (A)') && text.includes('Reason (R)');
  const hasStatementPattern = 
    /(?:Statement|कथन)\s*:?\s*I\b/i.test(text) && 
    /(?:Statement|कथन)\s*:?\s*II\b/i.test(text);

  if (hasAssertionPattern || hasStatementPattern) {
    return <RenderStatementSet text={text} className={className} isAssertion={hasAssertionPattern} />;
  }

  // 3. Check for Numbered Lists (1. ... 2. ... 3. ...) or Roman (I. ... II. ...)
  return <RenderStandardText text={text} className={className} />;
}

// ---------------------------------------------------------------------------
// SUB-RENDERERS
// ---------------------------------------------------------------------------

export interface RenderTableQuestionProps {
  text?: string;
  className?: string;
  matchPairs?: any[];
  language?: string;
  darkMode?: boolean;
}

export function RenderTableQuestion({
  text,
  className,
  matchPairs,
  language = 'hi',
  darkMode = false,
}: RenderTableQuestionProps) {
  // If we have structured matchPairs, use them directly
  if (matchPairs && Array.isArray(matchPairs) && matchPairs.length > 0) {
    const isHindi = language === 'hi';
    const h1 = isHindi ? 'सूची - I' : 'List - I';
    const h2 = isHindi ? 'सूची - II' : 'List - II';

    // Dark mode styles
    const borderColor = darkMode ? 'border-slate-600' : 'border-slate-800';
    const headerBg = darkMode ? 'bg-slate-800' : 'bg-slate-50';
    const headerText = darkMode ? 'text-slate-200' : 'text-slate-900';
    const rowBg = darkMode ? 'bg-slate-900' : 'bg-white';
    const cellBg = darkMode ? 'bg-slate-800' : 'bg-slate-50';
    const cellText = darkMode ? 'text-slate-200' : 'text-slate-900';
    const cellBorder = darkMode ? 'border-slate-700' : 'border-slate-300';

    return (
      <div
        className={cn(
          'w-full overflow-hidden rounded-lg border-2 text-sm sm:text-base',
          borderColor,
          className
        )}
      >
        <div className={cn('grid w-full grid-cols-2 border-b-2', borderColor, headerBg)}>
          <div className={cn('border-r-2 px-2 py-2.5 text-center text-xs font-bold sm:px-4 sm:py-3 sm:text-sm', borderColor, headerText)}>
            {h1}
          </div>
          <div className={cn('px-2 py-2.5 text-center text-xs font-bold sm:px-4 sm:py-3 sm:text-sm', headerText)}>
            {h2}
          </div>
        </div>
        {matchPairs.map((pair, i) => (
          <div
            key={i}
            className={cn(
              'grid w-full grid-cols-2',
              rowBg,
              i !== matchPairs.length - 1 && cn('border-b', borderColor)
            )}
          >
            <div className={cn('flex items-center border-r-2', borderColor)}>
              <div className={cn('min-w-[2rem] border-r px-2 py-2 text-center text-xs font-bold sm:min-w-[3rem] sm:px-3 sm:py-3 sm:text-sm', cellBorder, cellBg, cellText)}>
                {pair.id}
              </div>
              <div className={cn('flex-1 px-2 py-2 text-xs sm:px-3 sm:py-3 sm:text-sm', cellText)}>
                {isHindi ? pair.label : pair.labelEn || pair.label}
              </div>
            </div>
            <div className="flex items-center">
              <div className={cn('min-w-[2rem] border-r px-2 py-2 text-center text-xs font-bold sm:min-w-[3rem] sm:px-3 sm:py-3 sm:text-sm', cellBorder, cellBg, cellText)}>
                {pair.matchId}
              </div>
              <div className={cn('flex-1 px-2 py-2 text-xs sm:px-3 sm:py-3 sm:text-sm', cellText)}>
                {isHindi ? pair.match : pair.matchEn || pair.match}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Fallback to text parsing if no matchPairs or text is provided
  if (!text) return null;
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const parseItem = (item: string) => {
    const match = item.match(/^([A-Za-z0-9]+\.?\)?\s*)/);
    if (match) {
      const identifier = match[1].trim();
      const content = item.substring(match[0].length).trim();
      return { identifier, content };
    }
    return { identifier: '', content: item };
  };

  // Detect list headers with subtitles: "List-I (Philosophy)" or "सूची-I (दर्शन)"
  const listHeaderRegex = /(?:List-?\s*I+|सूची-?\s*I+|सूची-?\s*[12])\s*(\([^)]*\))?/gi;

  const extractHeaders = () => {
    let h1 = 'List - I';
    let h2 = 'List - II';
    const isHindi = text.includes('सूची');

    for (const line of lines) {
      // Combined header line: "List-I (Philosophy)    List-II (Founder)"
      const combinedMatch = line.match(
        isHindi
          ? /(सूची-?\s*(?:I|1))\s*(\([^)]*\))?\s+(सूची-?\s*(?:II|2))\s*(\([^)]*\))?/i
          : /(List-?\s*I)\s*(\([^)]*\))?\s+(List-?\s*II)\s*(\([^)]*\))?/i
      );
      if (combinedMatch) {
        h1 = combinedMatch[1] + (combinedMatch[2] ? ' ' + combinedMatch[2] : '');
        h2 = combinedMatch[3] + (combinedMatch[4] ? ' ' + combinedMatch[4] : '');
        return { h1, h2, isHindi };
      }

      // Separate header lines
      const singleMatch1 = line.match(
        isHindi ? /^(सूची-?\s*(?:I|1))\s*(\([^)]*\))?\s*$/i : /^(List-?\s*I)\s*(\([^)]*\))?\s*$/i
      );
      if (singleMatch1) {
        h1 = singleMatch1[1] + (singleMatch1[2] ? ' ' + singleMatch1[2] : '');
      }
      const singleMatch2 = line.match(
        isHindi ? /^(सूची-?\s*(?:II|2))\s*(\([^)]*\))?\s*$/i : /^(List-?\s*II)\s*(\([^)]*\))?\s*$/i
      );
      if (singleMatch2) {
        h2 = singleMatch2[1] + (singleMatch2[2] ? ' ' + singleMatch2[2] : '');
      }
    }

    if (isHindi) {
      h1 = h1 === 'List - I' ? 'सूची - I' : h1;
      h2 = h2 === 'List - II' ? 'सूची - II' : h2;
    }
    return { h1, h2, isHindi };
  };

  const { h1, h2, isHindi } = extractHeaders();

  // Check if both List-I and List-II appear on the same header line
  let headerIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    const hasL1 =
      line.includes('list-i') ||
      line.includes('सूची-i') ||
      line.includes('सूची-1') ||
      line.includes('सूची- i');
    const hasL2 =
      line.includes('list-ii') ||
      line.includes('सूची-ii') ||
      line.includes('सूची-2') ||
      line.includes('सूची- ii');
    if (hasL1 && hasL2) {
      headerIndex = i;
      break;
    }
  }

  const renderTable = (intro: string[], list1Items: string[], list2Items: string[]) => {
    const maxLength = Math.max(list1Items.length, list2Items.length);
    return (
      <div className={cn('space-y-3', className)}>
        {intro.length > 0 && (
          <div className="text-base leading-relaxed font-medium text-slate-900 sm:text-lg">
            {intro.map((l, i) => (
              <div key={i}>{l}</div>
            ))}
          </div>
        )}
        <div className="w-full overflow-hidden rounded-lg border-2 border-slate-800 text-sm sm:text-base">
          <div className="grid w-full grid-cols-2 border-b-2 border-slate-800 bg-slate-50">
            <div className="border-r-2 border-slate-800 px-2 py-2.5 text-center text-xs font-bold text-slate-900 sm:px-4 sm:py-3 sm:text-sm">
              {h1}
            </div>
            <div className="px-2 py-2.5 text-center text-xs font-bold text-slate-900 sm:px-4 sm:py-3 sm:text-sm">
              {h2}
            </div>
          </div>
          {Array.from({ length: maxLength }).map((_, i) => {
            const list1 = parseItem(list1Items[i] || '');
            const list2 = parseItem(list2Items[i] || '');
            return (
              <div
                key={i}
                className={cn(
                  'grid w-full grid-cols-2 bg-white',
                  i !== maxLength - 1 && 'border-b border-slate-800'
                )}
              >
                <div className="flex items-center border-r-2 border-slate-800">
                  <div className="min-w-[2rem] border-r border-slate-300 bg-slate-50 px-2 py-2 text-center text-xs font-bold text-slate-900 sm:min-w-[3rem] sm:px-3 sm:py-3 sm:text-sm">
                    {list1.identifier}
                  </div>
                  <div className="flex-1 px-2 py-2 text-xs text-slate-900 sm:px-3 sm:py-3 sm:text-sm">
                    {list1.content}
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="min-w-[2rem] border-r border-slate-300 bg-slate-50 px-2 py-2 text-center text-xs font-bold text-slate-900 sm:min-w-[3rem] sm:px-3 sm:py-3 sm:text-sm">
                    {list2.identifier}
                  </div>
                  <div className="flex-1 px-2 py-2 text-xs text-slate-900 sm:px-3 sm:py-3 sm:text-sm">
                    {list2.content}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // If we found a combined header (List-I ... List-II on same line)
  if (headerIndex !== -1) {
    const intro = lines.slice(0, headerIndex);
    const dataLines = lines.slice(headerIndex + 1);

    const list1Items: string[] = [];
    const list2Items: string[] = [];

    for (const line of dataLines) {
      const match = line.match(/^(\d+\.?\)?\s+[^A-Z]*?)([A-Z]+\.?\)?\s+.*)$/);
      if (match) {
        list1Items.push(match[1].trim());
        list2Items.push(match[2].trim());
      } else {
        const splitMatch = line.match(/^(.*?)\s+([A-Z]\.?\)?\s+.*)$/);
        if (splitMatch) {
          list1Items.push(splitMatch[1].trim());
          list2Items.push(splitMatch[2].trim());
        } else {
          list1Items.push(line);
          list2Items.push('');
        }
      }
    }
    return renderTable(intro, list1Items, list2Items);
  }

  // Try the old format: separate List-I and List-II sections
  let list1Index = -1;
  let list2Index = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    const isL1 =
      (line.includes('list-i') ||
        line.includes('सूची-i') ||
        line.includes('सूची-1') ||
        line.includes('सूची- i')) &&
      !line.includes('list-ii') &&
      !line.includes('सूची-ii') &&
      !line.includes('सूची-2') &&
      !line.includes('सूची- ii') &&
      line.length < 80;
    const isL2 =
      (line.includes('list-ii') ||
        line.includes('सूची-ii') ||
        line.includes('सूची-2') ||
        line.includes('सूची- ii')) &&
      line.length < 80;
    if (isL1) list1Index = i;
    else if (isL2) list2Index = i;
  }

  // Fallback: first occurrence
  if (list1Index === -1)
    list1Index = lines.findIndex(
      (l) => l.includes('List-I') || l.includes('सूची-I') || l.includes('सूची-1')
    );
  if (list2Index === -1)
    list2Index = lines.findIndex(
      (l) => l.includes('List-II') || l.includes('सूची-II') || l.includes('सूची-2')
    );

  if (list1Index !== -1 && list2Index !== -1 && list1Index < list2Index) {
    const intro = lines.slice(0, list1Index);
    const list1Items = lines.slice(list1Index + 1, list2Index);
    const list2Items = lines.slice(list2Index + 1);
    return renderTable(intro, list1Items, list2Items);
  }

  // Fallback if parsing fails
  return <RenderStandardText text={text} className={className} />;
}

interface RenderStatementSetProps {
  text: string;
  className?: string;
  isAssertion?: boolean;
}

function RenderStatementSet({ text, className, isAssertion }: RenderStatementSetProps) {
  // Broad regex for Statement I, कथन I, Statement: I, कथन: I, Assertion (A), Reason (R) etc.
  const markerRegex = isAssertion 
    ? /(Assertion \(A\)|Reason \(R\))/g
    : /((?:Statement|कथन)\s*:?\s*(?:I|II|III|IV|V|VI|VII|VIII|IX|X)\b)/gi;

  const parts = text.split(markerRegex);
  
  // parts[0] = intro
  // parts[1] = marker 1, parts[2] = content 1
  // parts[3] = marker 2, parts[4] = content 2 ...
  
  if (parts.length < 3) return <RenderStandardText text={text} className={className} />;

  const intro = parts[0].trim();
  const statements = [];
  for (let i = 1; i < parts.length; i += 2) {
    statements.push({
      marker: parts[i].trim(),
      content: parts[i+1]?.replace(/^[:\s\-।]+/, '').trim()
    });
  }

  return (
    <div className={cn('space-y-4', className)}>
      {intro && (
        <div className="mb-4 text-lg leading-relaxed font-medium text-slate-900">
          {intro}
        </div>
      )}

      <div className="space-y-3">
        {statements.map((s, idx) => {
          const isAlt = idx % 2 !== 0;
          return (
            <div 
              key={idx} 
              className={cn(
                "rounded-xl border p-4",
                isAlt 
                  ? "border-blue-100 bg-blue-50/50" 
                  : "border-amber-100 bg-amber-50/50"
              )}
            >
              <span className={cn(
                "mb-1 block font-bold",
                isAlt ? "text-blue-800" : "text-amber-800"
              )}>
                {s.marker}
              </span>
              <div className="leading-relaxed font-medium text-slate-800">
                {s.content}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RenderStandardText({ text, className }: FormattedQuestionTextProps) {
  // Enhanced pattern detection for numbered and Roman numeral lists
  // Even if they are inline, we'll try to split them if they follow a clear pattern
  
  const detectAndFormatList = (rawText: string) => {
    // Check if the text contains a clear sequence like "I. ... II. ... III. ..."
    const romanSequence = /((?:\s|^)(?:I|II|III|IV|V|VI)\.\s+.*?(?=(?:\s|^)(?:I|II|III|IV|V|VI)\.|$))/gs;
    const matches = Array.from(rawText.matchAll(romanSequence));
    
    if (matches.length >= 2) {
      const intro = rawText.substring(0, matches[0].index).trim();
      const items = matches.map(m => {
        const markerMatch = m[0].match(/^(\s*)([IVX]+\.)\s+(.*)/s);
        return {
          marker: markerMatch ? markerMatch[2] : "",
          content: markerMatch ? markerMatch[3].trim() : m[0].trim()
        };
      });
      return { intro, items };
    }
    
    // Normal newline split as fallback
    const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
    const items: {marker: string, content: string}[] = [];
    let currentIntro = "";
    
    lines.forEach(line => {
      const match = line.match(/^([0-9]+\.|[IVX]+\.)\s+(.*)/i);
      if (match) {
        items.push({ marker: match[1], content: match[2] });
      } else if (items.length === 0) {
        currentIntro += (currentIntro ? "\n" : "") + line;
      } else {
        // Append to last item if it doesn't look like a new item
        items[items.length - 1].content += " " + line;
      }
    });
    
    return items.length >= 2 ? { intro: currentIntro, items } : null;
  };

  const listData = detectAndFormatList(text);

  if (listData) {
    return (
      <div className={cn('space-y-4', className)}>
        {listData.intro && (
          <div className="text-lg leading-relaxed font-medium text-slate-900">
            {listData.intro}
          </div>
        )}
        <div className="space-y-2">
          {listData.items.map((item, i) => (
            <div key={i} className="flex items-start gap-3 py-1 pl-4">
              <span className="mt-1 shrink-0 rounded bg-slate-100 px-1.5 text-sm font-bold text-slate-500">
                {item.marker}
              </span>
              <span className="text-lg leading-relaxed font-medium text-slate-900">{item.content}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Pure standard text if no list detected
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  return (
    <div className={cn('space-y-2 text-lg leading-relaxed font-medium text-slate-900', className)}>
      {lines.map((line, i) => <div key={i}>{line}</div>)}
    </div>
  );
}


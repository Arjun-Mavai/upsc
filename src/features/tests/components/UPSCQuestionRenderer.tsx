import React from 'react';
import { cn } from '@/lib/utils';
import { RenderTableQuestion } from '@/features/tests/utils/questionFormatter';

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
}

const toRoman = (num: number): string => {
  if (num <= 0) return '';
  const roman: Record<string, number> = {
    M: 1000, CM: 900, D: 500, CD: 400, C: 100, XC: 90, L: 50, XL: 40, X: 10, IX: 9, V: 5, IV: 4, I: 1,
  };
  let result = '';
  for (const i of Object.keys(roman)) {
    const q = Math.floor(num / roman[i]);
    num -= q * roman[i];
    result += i.repeat(q);
  }
  return result;
};

/**
 * UPSC ULTRA-PARSER
 * Splits raw strings into structured UPSC components with 100% precision.
 */
function parseUPSCContent(rawText: string) {
  if (!rawText) return { intro: '', items: [], prompt: '' };

  // 1. Pre-process: Strip HTML but preserve spacing for markers
  const text = rawText
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/?[^>]+(>|$)/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // 2. Extract Prompt from the end (Instructions like "In how many...")
  // Added Hindi full stop । and more prompt keywords
  const promptRegex = /(?:\.|\?|\!|।)\s*(In\s+how\s+many|How\s+many|Which\s+of|Select\s+the|Which\s+one|उपर्युक्त\s+|इनमें\s+से\s+कौन|उपरोक्त\s+|सही\s+कूट|सही\s+उत्तर|कितने\s+युग्म|निम्नलिखित\s+में\s+से|नीचे\s+दिए\s+गए|Select\s+the\s+correct)/i;
  const promptMatch = text.match(promptRegex);
  
  let intro = text;
  let prompt = "";

  if (promptMatch && promptMatch.index !== undefined) {
    const splitIdx = promptMatch.index + 1;
    intro = text.substring(0, splitIdx).trim();
    prompt = text.substring(splitIdx).trim();
  }

  // 3. Identify and Split List Items
  // Markers can be Statement I, कथन I, I. II. III. or 1. 2. 3.
  const markers = [
    { type: 'statement', regex: /(?:\s|^|[\.\?\!:;।])(Statement|कथन)\s+(I|II|III|IV|V|VI|VII|VIII|IX|X)[\s:]+/g },
    { type: 'roman', regex: /(?:\s|^|[\.\?\!:;।])(I|II|III|IV|V|VI|VII|VIII|IX|X)[\.\s:]+\s*/g },
    { type: 'number', regex: /(?:\s|^|[\.\?\!:;।])([1-9]\d?[\.\s])\s*/g }
  ];

  const items: { marker: string; text: string }[] = [];
  let useRegex = null;

  // Find which pattern dominates
  let firstMatch = null;
  let bestMarkerIdx = -1;

  for (let i = 0; i < markers.length; i++) {
    markers[i].regex.lastIndex = 0;
    const match = markers[i].regex.exec(intro);
    if (match && (firstMatch === null || match.index < firstMatch.index)) {
      firstMatch = match;
      bestMarkerIdx = i;
    }
  }

  if (bestMarkerIdx !== -1) {
    useRegex = markers[bestMarkerIdx].regex;
    useRegex.lastIndex = 0;
    let match;
    const splitPoints = [];
    while ((match = useRegex.exec(intro)) !== null) {
      let marker = match[1];
      if (markers[bestMarkerIdx].type === 'statement') {
        marker = match[1] + " " + match[2];
      }
      splitPoints.push({ index: match.index, marker: marker, fullMatch: match[0] });
    }

    if (splitPoints.length > 0) {
      const actualIntro = intro.substring(0, splitPoints[0].index).trim();
      for (let i = 0; i < splitPoints.length; i++) {
        const start = splitPoints[i].index + splitPoints[i].fullMatch.length;
        const end = i < splitPoints.length - 1 ? splitPoints[i+1].index : intro.length;
        items.push({ 
          marker: splitPoints[i].marker.endsWith('.') || splitPoints[i].marker.includes(' ') ? splitPoints[i].marker : splitPoints[i].marker + '.',
          text: intro.substring(start, end).trim() 
        });
      }
      intro = actualIntro;
    }
  }

  return { intro, items, prompt };
}

export const UPSCQuestionRenderer: React.FC<UPSCQuestionRendererProps> = ({
  question,
  isHindi,
}) => {
  const ext = React.useMemo(() => {
    if (!question.extendedData) return null;
    try {
      return (typeof question.extendedData === 'string' ? JSON.parse(question.extendedData) : question.extendedData) as UPSCQuestionMetadata;
    } catch (e) { return null; }
  }, [question.extendedData]);

  const baseText = isHindi ? question.text : question.textEn || question.text;
  const parsed = React.useMemo(() => parseUPSCContent(baseText), [baseText]);

  // Combined Strategy
  const contextStr = ext?.contextStr ? (isHindi ? ext.contextStr : ext.contextStrEn || ext.contextStr) : parsed.intro;
  const questionPrompt = ext?.questionPrompt ? (isHindi ? ext.questionPrompt : ext.questionPromptEn || ext.questionPrompt) : parsed.prompt;
  
  const displayItems = (ext?.listItems && ext.listItems.length > 0)
    ? ext.listItems.map((item, idx) => {
        const listType = ext.listType || 'roman';
        return { marker: listType === 'roman' ? `${toRoman(idx + 1)}.` : `${idx + 1}.`, text: isHindi ? item.text : item.textEn || item.text };
      })
    : parsed.items;

  const isShortItems = displayItems.length > 2 && displayItems.every(item => item.text.length < 35);
  const isStatementLayout = displayItems.some(item => item.marker.includes('Statement') || item.marker.includes('कथन'));

  // Options Logic
  let rawOptions: any[] = [];
  if (Array.isArray(question.options)) rawOptions = question.options;
  else if (typeof question.options === 'string') {
    try { rawOptions = JSON.parse(question.options); } catch (e) { rawOptions = []; }
  }
  const isShortOptions = rawOptions.every(o => (o?.text || o || "").toString().length < 45);
  const getCorrectIndex = (ans: any): number => {
    if (typeof ans === 'number') return ans;
    if (typeof ans === 'string') {
      const upper = ans.trim().toUpperCase();
      if (['A','B','C','D'].includes(upper)) return upper.charCodeAt(0) - 65;
    }
    return -1;
  };
  const correctIndex = getCorrectIndex(question.correctAnswer);

  return (
    <div className="space-y-6 font-serif text-slate-100 selection:bg-emerald-500/30">
      {/* 1. The Intro/Context */}
      {contextStr && (
        <div className="text-[18px] leading-[1.7] font-bold tracking-tight text-white sm:text-[21px]">
          {contextStr}
        </div>
      )}

      {/* 2. Structured List Items */}
      {displayItems.length > 0 && (
        <div className={cn(
          "py-4 pl-1 sm:pl-8",
          isShortItems ? "grid grid-cols-2 gap-x-12 gap-y-4" : "space-y-5"
        )}>
          {displayItems.map((item, idx) => (
            <div key={idx} className="flex items-start gap-5">
              <span className={cn(
                "shrink-0 font-black text-slate-400 text-[18px]",
                isStatementLayout ? "w-fit min-w-[100px] text-left border-b border-white/10 italic" : "w-10 text-right"
              )}>
                {item.marker}
              </span>
              <span className="text-[17.5px] leading-relaxed font-semibold text-slate-200 sm:text-[20px]">
                {item.text}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* 3. Logic/Statement Pattern (Assertion/Reason) */}
      {ext?.layoutType === 'assertion_reason' && (
        <div className="space-y-8 py-4 pl-1 sm:pl-8">
          {[
            { label: isHindi ? 'कथन-I' : 'Statement-I', text: isHindi ? ext.statementI : ext.statementIEn || ext.statementI },
            { label: isHindi ? 'कथन-II' : 'Statement-II', text: isHindi ? ext.statementII : ext.statementIIEn || ext.statementII },
          ].filter(s => s.text).map((s, idx) => (
            <div key={idx} className="flex flex-col gap-3">
              <span className="text-[18px] font-black text-slate-300 italic border-b border-white/10 w-fit pb-1">{s.label}&nbsp;:</span>
              <p className="text-[17.5px] leading-relaxed font-semibold text-white sm:text-[20px]">{s.text}</p>
            </div>
          ))}
        </div>
      )}

      {/* 4. Match Pairs / Table */}
      {question.type === 'matching' && question.matchPairs && (
        <div className="overflow-hidden rounded-3xl border border-white/[0.08] bg-slate-900/50 py-4 shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
          <RenderTableQuestion
            matchPairs={question.matchPairs}
            language={isHindi ? 'hi' : 'en'}
            darkMode={true}
          />
        </div>
      )}

      {/* 5. The Question Prompt (The instruction) */}
      {questionPrompt && (
        <div className="mt-8 border-l-4 border-emerald-500/40 bg-emerald-500/5 px-6 py-5 text-[18px] font-black leading-relaxed text-white sm:text-[21px] rounded-r-2xl">
          {questionPrompt}
        </div>
      )}

      {/* 6. UPSC Premium Options */}
      <div className="mt-12 border-t border-white/5 pt-12">
        <div className="mb-8 flex items-center justify-between">
          <span className="text-[11px] font-black tracking-[0.5em] text-slate-500 uppercase">Select Correct Option</span>
          <div className="h-px flex-1 ml-6 bg-gradient-to-r from-white/10 to-transparent" />
        </div>

        <div className={cn('grid gap-5', isShortOptions ? 'grid-cols-2' : 'grid-cols-1')}>
          {rawOptions.slice(0, 4).map((opt, idx) => {
            const parsedOpt = typeof opt === 'object' && opt !== null ? opt : { text: opt };
            const isCorrect = correctIndex === idx;
            const optText = isHindi ? parsedOpt.text || (typeof opt === 'string' ? opt : '') : parsedOpt.text_en || parsedOpt.textEn || parsedOpt.text || (typeof opt === 'string' ? opt : '');
            const letter = String.fromCharCode(97 + idx);

            return (
              <div key={idx} className={cn(
                'group relative flex items-center gap-6 rounded-[1.5rem] border p-6 transition-all duration-500',
                isCorrect 
                  ? 'border-emerald-500/50 bg-emerald-500/[0.12] shadow-[0_0_50px_rgba(16,185,129,0.15)] scale-[1.02]' 
                  : 'border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/20'
              )}>
                <div className={cn(
                  'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl font-black italic transition-all text-[22px]',
                  isCorrect ? 'bg-emerald-500 text-white shadow-[0_10px_20px_rgba(16,185,129,0.4)]' : 'bg-white/10 text-slate-400 group-hover:bg-white/20 group-hover:text-slate-100'
                )}>
                  ({letter})
                </div>
                <div className={cn(
                  'flex-1 text-[18px] leading-snug font-bold',
                  isCorrect ? 'text-emerald-50' : 'text-slate-200'
                )} dangerouslySetInnerHTML={{ __html: optText }} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

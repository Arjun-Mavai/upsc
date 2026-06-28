'use client';

import type { ReactNode } from 'react';

// parseBold moved inside the component to support custom classes.

function flashBulletize(raw: string): string {
  return raw
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => {
      let t = line.trim();
      if (!t) return '';
      // Strip any existing bullet marker and leading spaces
      t = t.replace(/^[-*•]\s*/, '');
      if (!t) return '';
      if (/^#{1,3}\s/.test(t)) return t;
      return `- ${t}`;
    })
    .filter(Boolean)
    .join('\n');
}

import { cn } from '@/lib/utils';

export function MainsMarkdownBody({
  markdown,
  isHindi,
  /** Key-term / flash strips: treat every non-heading line as a bullet. */
  flashLineBullets = false,
  strongClassName,
  itemClassName,
  bulletClassName,
  bodyTextClassName,
  ulClassName,
  splitSentences = false,
}: {
  markdown: string;
  /** Slightly tuned line-height for Devanagari. */
  isHindi: boolean;
  flashLineBullets?: boolean;
  strongClassName?: string;
  itemClassName?: string;
  bulletClassName?: string;
  bodyTextClassName?: string;
  ulClassName?: string;
  splitSentences?: boolean;
}) {
  function splitIntoSentences(text: string): string[] {
    const trimmedText = text.trim();
    
    // Check if the text matches the inline numbered list pattern (e.g. "1. A, 2. B, 3. C")
    // We check that it starts with a number + dot/parenthesis, AND contains a subsequent number + dot/parenthesis
    if (/^\d+[\.\)]\s+/.test(trimmedText) && /\b\d+[\.\)]\s+/.test(trimmedText.substring(3))) {
      const items = trimmedText.split(/(?=\b\d+[\.\)]\s+)/)
        .map(item => item.trim().replace(/[,;]\s*$/, '').trim())
        .filter(Boolean);
      if (items.length > 1) {
        return items;
      }
    }

    const sentences: string[] = [];
    let currentSentence = '';
    let inParentheses = 0;
    
    for (let idx = 0; idx < text.length; idx++) {
      const char = text[idx];
      if (char === '(' || char === '（') {
        inParentheses++;
      } else if (char === ')' || char === '）') {
        inParentheses = Math.max(0, inParentheses - 1);
      }
      
      currentSentence += char;
      
      // Check if we hit a sentence end character outside parentheses
      const isSentenceEnd = (char === '।' || char === '|' || char === '?' || char === '!');
      // Ignore periods if the preceding word is a number (e.g. 1. or 2.) or a single English letter
      const isPeriodEnd = (char === '.' && (idx === text.length - 1 || (text[idx + 1] === ' ' && !/\b[a-zA-Z]$/.test(text.substring(0, idx)) && !/\d+$/.test(text.substring(0, idx)))));
      
      if (inParentheses === 0 && (isSentenceEnd || isPeriodEnd)) {
        sentences.push(currentSentence.trim());
        currentSentence = '';
      }
    }
    
    if (currentSentence.trim()) {
      sentences.push(currentSentence.trim());
    }
    
    return sentences;
  }

  function parseTextWithSentences(text: string, itemIndex = 0) {
    if (!splitSentences) {
      return parseBold(text);
    }

    const sentences = splitIntoSentences(text);
    return (
      <span className="flex flex-col gap-2.5 sm:gap-3 mt-1 w-full">
        {sentences.map((sentence, sIdx) => {
          const cleanSentence = sentence.trim();
          
          // Check for the specific "Colon + Parentheses" pattern (e.g. "Heading: Content (1953)")
          const colonIdx = cleanSentence.indexOf(':');
          const hasBracketsAfterColon = colonIdx !== -1 && (
            cleanSentence.substring(colonIdx).includes('(') || 
            cleanSentence.substring(colonIdx).includes('（')
          );
          
          if (hasBracketsAfterColon) {
            const headingPart = cleanSentence.substring(0, colonIdx).trim().replace(/\*+/g, '');
            const bodyPart = cleanSentence.substring(colonIdx + 1).trim();
            
            const badgeSkins = [
              'bg-pink-50/70 border border-pink-200/60 text-pink-700 shadow-sm shadow-pink-500/[0.015] dark:bg-pink-950/20 dark:border-pink-800/40 dark:text-pink-300',
              'bg-emerald-50/70 border border-emerald-200/60 text-emerald-700 shadow-sm shadow-emerald-500/[0.015] dark:bg-emerald-950/20 dark:border-emerald-800/40 dark:text-emerald-300',
              'bg-amber-50/70 border border-amber-200/60 text-amber-700 shadow-sm shadow-amber-500/[0.015] dark:bg-amber-950/20 dark:border-amber-800/40 dark:text-amber-300',
              'bg-rose-50/70 border border-rose-200/60 text-rose-700 shadow-sm shadow-rose-500/[0.015] dark:bg-rose-950/20 dark:border-rose-800/40 dark:text-rose-300',
            ];
            const badgeSkin = badgeSkins[(sIdx + itemIndex) % badgeSkins.length];
            
            return (
              <span key={sIdx} className="block w-full space-y-2 mt-1 first:mt-0">
                <span className="block">
                  <span className={cn(
                    "inline-flex items-center rounded-lg px-2.5 py-1 text-xs uppercase tracking-wider font-extrabold shadow-sm border",
                    isHindi ? "font-[family-name:var(--font-pyq-dev)]" : "font-[family-name:var(--font-pyq-serif)]",
                    badgeSkin
                  )}>
                    {headingPart}
                  </span>
                </span>
                <span className="block pl-1.5 text-[15px] sm:text-[16px] leading-[1.8] sm:leading-[1.85] text-slate-800 dark:text-slate-200 font-medium">
                  {parseBold(bodyPart)}
                </span>
              </span>
            );
          }

          // Otherwise use standard styling with underlines
          const words = cleanSentence.split(/(\s+)/);
          const wordTokens = words.filter(w => w.trim().length > 0);
          if (wordTokens.length > 0) {
            const numHighlight = Math.min(3, wordTokens.length);
            let wordCount = 0;
            let cutIndex = 0;
            for (let idx = 0; idx < words.length; idx++) {
              if (words[idx].trim().length > 0) {
                wordCount++;
                if (wordCount === numHighlight) {
                  cutIndex = idx + 1;
                  break;
                }
              }
            }
            const highlightedPart = words.slice(0, cutIndex).join('');
            const remainingPart = words.slice(cutIndex).join('');
            
            // 🎨 Alternating Premium UI/UX Style Palette (Designed by 20-Year UI/UX Expert)
            // Offset by itemIndex so consecutive bullets have alternative starting underlines!
            const styleIdx = (sIdx + itemIndex) % 4;
            let highlightStyle: React.CSSProperties = {};
            let textColorClass = "text-slate-950 dark:text-white";
            
            if (styleIdx === 0) {
              // Pink Wavy
              highlightStyle = {
                textDecorationLine: 'underline',
                textDecorationStyle: 'wavy',
                textDecorationColor: '#ec4899',
                textDecorationThickness: '1.5px',
                textUnderlineOffset: '5px',
              };
              textColorClass = "text-pink-950 dark:text-pink-100 font-extrabold";
            } else if (styleIdx === 1) {
              // Emerald Solid Thick
              highlightStyle = {
                textDecorationLine: 'underline',
                textDecorationStyle: 'solid',
                textDecorationColor: '#10b981',
                textDecorationThickness: '2px',
                textUnderlineOffset: '5px',
              };
              textColorClass = "text-emerald-950 dark:text-emerald-100 font-extrabold";
            } else if (styleIdx === 2) {
              // Amber Dashed
              highlightStyle = {
                textDecorationLine: 'underline',
                textDecorationStyle: 'dashed',
                textDecorationColor: '#f59e0b',
                textDecorationThickness: '2px',
                textUnderlineOffset: '5px',
              };
              textColorClass = "text-amber-950 dark:text-amber-100 font-extrabold";
            } else {
              // Rose Wavy (Squiggly)
              highlightStyle = {
                textDecorationLine: 'underline',
                textDecorationStyle: 'wavy',
                textDecorationColor: '#f43f5e',
                textDecorationThickness: '1.5px',
                textUnderlineOffset: '5px',
              };
              textColorClass = "text-rose-950 dark:text-rose-100 font-extrabold";
            }
            
            return (
              <span key={sIdx} className="block leading-relaxed">
                <span 
                  className={textColorClass}
                  style={highlightStyle}
                >
                  {parseBold(highlightedPart)}
                </span>
                {parseBold(remainingPart)}
              </span>
            );
          }
          
          return (
            <span key={sIdx} className="block leading-relaxed">
              {parseBold(sentence)}
            </span>
          );
        })}
      </span>
    );
  }

  function parseBoldOnly(text: string) {
    const parts = text.split(/(\*\*.+?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        return (
          <strong key={i} className={cn("font-extrabold", strongClassName || "text-emerald-800 dark:text-emerald-200")}>
            {part.slice(2, -2)}
          </strong>
        );
      }
      return <span key={i}>{part.replace(/\*+/g, '')}</span>;
    });
  }

  function parseBold(text: string) {
    const regex = isHindi 
      ? /(\(जैसे-[^)]+\))/g 
      : /(\((?:e\.g\.|eg)[^)]+\))/g;
      
    const parts = text.split(regex);
    
    return parts.map((part, i) => {
      if (!part) return null;
      
      const match = isHindi 
        ? part.match(/^\((जैसे-)(.+)\)$/)
        : part.match(/^\(((?:e\.g\.|eg),?\s*)(.+)\)$/);
        
      if (match) {
        const content = match[2];
        return (
          <span key={`ex-${i}`} className="block mt-1 mb-1 text-[13px] sm:text-[14px] font-semibold text-slate-600 dark:text-slate-400">
            <span className="font-extrabold text-pink-600 dark:text-pink-400">{isHindi ? '💡 जैसे: ' : '💡 e.g., '}</span>
            {parseBoldOnly(content.trim())}
          </span>
        );
      }
      
      return <span key={`p-${i}`}>{parseBoldOnly(part)}</span>;
    });
  }


  const blocks: ReactNode[] = [];
  const sourceMd = flashLineBullets ? flashBulletize(markdown) : markdown;
  const lines = sourceMd.replace(/\r\n/g, '\n').split('\n');

  let i = 0;
  let ulKey = 0;

  const bodyFont = isHindi ? 'font-[family-name:var(--font-pyq-dev)] tracking-wide [word-spacing:0.06em]' : 'font-[family-name:var(--font-pyq-serif)] tracking-tight';

  const bodyText = `${bodyFont} text-[16px] sm:text-[18px] leading-[1.82] sm:leading-[1.9] ${bodyTextClassName || "text-slate-800 dark:text-slate-100"}`;

  const h3Class =
    'mt-6 mb-3 first:mt-0 py-2.5 pl-3.5 pr-3 text-[17px] sm:text-[19px] font-black tracking-tight border-l-[5px] border-slate-900 dark:border-white bg-gradient-to-r from-white via-slate-50 to-white dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 text-slate-950 dark:text-slate-50 border-b-[3px] border-r border-slate-200/90 dark:border-black/60 rounded-r-xl shadow-md shadow-black/5 dark:shadow-black/30 ring-1 ring-white/60 dark:ring-white/10';

  const h4Sub =
    'mt-5 mb-2 py-2 pl-3 pr-2.5 text-[15.5px] sm:text-[17px] font-black tracking-tight border-l-[4px] border-slate-700 dark:border-slate-300 bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 text-slate-900 dark:text-slate-100 border-b-[2px] border-r border-slate-200/80 dark:border-black/50 rounded-r-lg shadow-sm shadow-black/5 ring-1 ring-white/50 dark:ring-white/10';

  while (i < lines.length) {
    const line = lines[i].trimEnd();

    if (line.trim() === '') {
      i += 1;
      continue;
    }

    const matchH = line.match(/^(#{1,5})\s+(.*)/);
    if (matchH) {
      const level = matchH[1].length;
      const content = matchH[2].replace(/\*+/g, '').trim();
      if (level <= 2) {
        blocks.push(
          <h3 key={`h-${i}`} className={h3Class}>
            {content}
          </h3>
        );
      } else {
        blocks.push(
          <h4 key={`hh-${i}`} className={h4Sub}>
            {content}
          </h4>
        );
      }
      i += 1;
      continue;
    }

    if (/^-\s+/.test(line.trim())) {
      const items: string[] = [];
      while (i < lines.length && /^-\s+/.test(lines[i].trim())) {
        const cleaned = lines[i].trim().replace(/^-\s+/, '').replace(/^[-*•]\s*/, '').trim();
        if (cleaned && cleaned !== '-' && cleaned !== '*' && cleaned !== '•') {
          items.push(cleaned);
        }
        i += 1;
      }
      if (items.length > 0) {
        ulKey += 1;
        blocks.push(
          <ul key={`ul-${ulKey}`} className={cn("my-4 space-y-3 sm:space-y-3.5", ulClassName)}>
            {items.map((item, idx) => {
              const colonIdx = item.indexOf(':');
              let prefix = '';
              let rest = item;
              if (colonIdx !== -1 && colonIdx < 55) {
                prefix = item.substring(0, colonIdx).trim().replace(/\*+/g, '');
                rest = item.substring(colonIdx + 1).trim();
              }

              const badgeSkin = [
                'bg-gradient-to-r from-amber-500/30 to-amber-500/10 text-amber-950 dark:text-amber-300 border-b-[3px] border-r border-amber-500/60 shadow-md shadow-black/10 dark:shadow-black/40 ring-1 ring-white/60 dark:ring-white/10',
                'bg-gradient-to-r from-emerald-500/30 to-emerald-500/10 text-emerald-950 dark:text-emerald-300 border-b-[3px] border-r border-emerald-500/60 shadow-md shadow-black/10 dark:shadow-black/40 ring-1 ring-white/60 dark:ring-white/10',
                'bg-gradient-to-r from-sky-500/30 to-sky-500/10 text-sky-950 dark:text-sky-300 border-b-[3px] border-r border-sky-500/60 shadow-md shadow-black/10 dark:shadow-black/40 ring-1 ring-white/60 dark:ring-white/10',
                'bg-gradient-to-r from-purple-500/30 to-purple-500/10 text-purple-950 dark:text-purple-300 border-b-[3px] border-r border-purple-500/60 shadow-md shadow-black/10 dark:shadow-black/40 ring-1 ring-white/60 dark:ring-white/10',
              ][idx % 4];

              return (
                <li
                  key={idx}
                  className={cn(
                    "rounded-xl sm:rounded-2xl border p-3 sm:p-3.5 shadow-sm transition-all duration-300 overflow-hidden space-y-2",
                    itemClassName || "border-slate-200/90 bg-white/90 dark:border-slate-700/80 dark:bg-slate-900/70"
                  )}
                >
                  {prefix ? (
                    <div>
                      <span className={cn("inline-flex items-center rounded-lg px-3 py-1 text-xs uppercase tracking-wider font-extrabold shadow-sm", isHindi ? "font-[family-name:var(--font-pyq-dev)]" : "font-[family-name:var(--font-pyq-serif)]", badgeSkin)}>
                        {prefix}
                      </span>
                    </div>
                  ) : null}
                  {rest.trim() !== '' && (
                    <div className="flex items-start gap-2.5">
                      <span className={cn(
                        "mt-2 inline-block size-2 shrink-0 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)] ring-4 ring-emerald-500/15",
                        bulletClassName
                      )} />
                      <span className={bodyText}>{parseTextWithSentences(rest, idx)}</span>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        );
      }
      continue;
    }

    if (line.trim().startsWith('|') || line.trim().startsWith('- |')) {
      const tableLines: string[] = [];
      while (i < lines.length && (lines[i].trim().startsWith('|') || lines[i].trim().startsWith('- |'))) {
        let tLine = lines[i].trim();
        if (tLine.startsWith('- |')) tLine = tLine.slice(2).trim();
        tableLines.push(tLine);
        i += 1;
      }
      ulKey += 1;
      
      const rows = tableLines.filter(r => !/^\|[\s-:]+\|/.test(r));
      if (rows.length > 0) {
        blocks.push(
          <div key={`table-${ulKey}`} className="my-6 w-full overflow-x-auto rounded-xl border border-slate-200/90 shadow-sm dark:border-slate-700/80">
            <table className="w-full text-left text-[15px] sm:text-[16px]">
              <thead className="bg-slate-50 text-slate-900 dark:bg-slate-900/50 dark:text-slate-100">
                <tr>
                  {rows[0].split('|').filter((_, idx, arr) => idx !== 0 && idx !== arr.length - 1).map((cell, idx) => (
                    <th key={idx} className="px-4 py-3 font-bold border-b border-slate-200 dark:border-slate-700 whitespace-nowrap">
                      {parseBold(cell.trim())}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(1).map((row, rIdx) => (
                  <tr key={rIdx} className="bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-900/40">
                    {row.split('|').filter((_, idx, arr) => idx !== 0 && idx !== arr.length - 1).map((cell, idx) => (
                      <td key={idx} className="px-4 py-3 text-slate-800 dark:text-slate-200 border-r border-slate-100 dark:border-slate-800 last:border-r-0 align-top">
                        {parseBold(cell.trim())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      continue;
    }

    if (line.trim().startsWith('>')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(lines[i].trim().slice(1).trim());
        i += 1;
      }
      blocks.push(
        <blockquote key={`quote-${i}`} className="my-6 border-l-[4px] border-amber-500 bg-amber-50/50 py-4 pl-5 pr-4 dark:border-amber-600/80 dark:bg-amber-950/20 rounded-r-xl shadow-sm">
          {quoteLines.map((ql, qIdx) => (
            <p key={qIdx} className={cn("mb-2 last:mb-0 italic", bodyText, "text-amber-950 dark:text-amber-100")}>
              {parseTextWithSentences(ql, qIdx)}
            </p>
          ))}
        </blockquote>
      );
      continue;
    }

    blocks.push(
      <p key={`p-${i}`} className={`my-4 max-w-[52rem] rounded-lg ${bodyText}`}>
        {parseTextWithSentences(line.trim(), i)}
      </p>
    );
    i += 1;
  }

  return <div className="max-w-none sm:max-w-3xl">{blocks}</div>;
}

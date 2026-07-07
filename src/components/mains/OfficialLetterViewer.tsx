'use client';

import { cn } from '@/lib/utils';
import { memo, ReactNode, useState } from 'react';

function segmentBold(text: string, strongClassName = 'font-semibold'): ReactNode[] {
  if (!text.includes('**')) return [<span key="plain">{text}</span>];
  const parts = text.split(/(\*\*[\s\S]*?\*\*)/g);
  return parts.map((part, i) => {
    const m = part.match(/^\*\*([\s\S]*)\*\*$/);
    if (m) {
      return (
        <strong key={i} className={cn(strongClassName, 'text-inherit')}>
          {m[1]}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

const FormatHint = ({ hint }: { hint: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <span 
      className="inline-flex items-center mr-2 align-middle cursor-pointer relative z-20"
      onClick={() => setOpen(!open)}
      title="परीक्षा में इस अलाइनमेंट का प्रयोग करें"
    >
      <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full border border-indigo-200 bg-indigo-50 text-[11px] font-black text-indigo-500 shadow-sm transition-colors hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300 select-none">
        ?
      </span>
      {open && (
        <span className="ml-1.5 whitespace-normal text-[10px] font-bold tracking-wide text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded shadow-sm border border-indigo-200 dark:bg-indigo-900 dark:text-indigo-100 dark:border-indigo-700">
          {hint.replace(/\//g, ' / ')}
        </span>
      )}
    </span>
  );
};

export const OfficialLetterViewer = memo(({ text, theme }: { text: string; theme: 'deep' | 'paper' }) => {
  // Surface classes
  const surface = theme === 'deep'
    ? 'bg-[#18181b] text-slate-200 border-slate-700 shadow-2xl'
    : 'bg-[#FDFBF7] text-slate-900 border-[#e5e5e5] shadow-xl';

  const font = 'font-[family-name:var(--font-pyq-dev)] text-[15px] md:text-[16px]';

  // 1. If the AI has generated a visually structured text block (using Master Prompt)
  const hasUnicodeLines = /━|─|│|┌|└|├|┬|┴|┼/.test(text);

  if (hasUnicodeLines) {
    let cleanText = text.replace(/```text\n?/g, '').replace(/```\n?/g, '').replace(/```/g, '');
    return (
      <div className={cn(
        'w-full max-w-3xl mx-auto border rounded-sm p-4 sm:p-8 my-6 relative overflow-x-auto',
        surface
      )}>
        <pre className="whitespace-pre text-[14px] sm:text-[15px] leading-[1.6] font-mono">
          {cleanText.trim()}
        </pre>
      </div>
    );
  }

  // 2. Otherwise parse the DB format (which might contain explicit [Align] tags)
  const lines = text.replace(/\r\n/g, '\n').split('\n');

  return (
    <div className={cn(
      'w-full max-w-3xl mx-auto border rounded-sm px-6 py-8 sm:px-12 sm:py-12 my-6 relative overflow-hidden leading-relaxed',
      surface,
      font
    )}>
      <div className="relative z-10 space-y-1">
        {lines.map((line, index) => {
          let trimmed = line.trim();
          if (!trimmed) return <div key={index} className="h-3" />;

          // Strip simple markdown lists
          if (trimmed.startsWith('## ')) trimmed = trimmed.slice(3).trim();
          if (trimmed.startsWith('### ')) trimmed = trimmed.slice(4).trim();
          if (trimmed.startsWith('> ')) trimmed = trimmed.slice(2).trim();
          
          let isBullet = trimmed.startsWith('- ') || trimmed.startsWith('• ');
          if (isBullet) trimmed = trimmed.replace(/^[-•]\s+/, '').trim();

          const cleanStr = trimmed.replace(/\*\*/g, '');

          let alignClass = 'text-left';
          let spacingClass = 'mb-2';
          let parsedLine = trimmed;
          let hint = '';

          // Look for alignment tags like [मध्य में/Center Align]
          const alignMatch = parsedLine.match(/\[([^\]]*?(Align|ओर|मध्य|Center|Left|Right|Bottom|Top)[^\]]*?)\]/i);
          
          if (alignMatch) {
            hint = alignMatch[1].replace(/\*\*/g, '').trim();
            parsedLine = parsedLine.replace(alignMatch[0], '').trim();
            // Clean empty bold markers if tag was wrapped like **[Left]**
            parsedLine = parsedLine.replace(/^\*\*\s*\*\*/, '').replace(/\*\*\s*$/, '').trim();

            const h = hint.toLowerCase();
            if (h.includes('center') || h.includes('मध्य')) {
              alignClass = 'text-center font-bold text-[16px] sm:text-[17px]';
              spacingClass = 'mb-1';
            } else if (h.includes('bottom right') || (h.includes('दाई') && h.includes('नीचे'))) {
              alignClass = 'text-right pr-0 sm:pr-8 font-semibold';
              spacingClass = 'mt-6 mb-1';
            } else if (h.includes('bottom left') || (h.includes('बाई') && h.includes('नीचे'))) {
              alignClass = 'text-left pl-0 sm:pl-8 font-semibold';
              spacingClass = 'mt-6 mb-1';
            } else if (h.includes('right') || h.includes('दाई')) {
              alignClass = 'text-right pr-0 sm:pr-8 font-semibold';
              spacingClass = 'mb-1';
            } else if (h.includes('left') || h.includes('बाई')) {
              alignClass = 'text-left pl-0 sm:pl-8 font-semibold';
              spacingClass = 'mb-1';
            }
          } else {
            // Heuristics fallback if no tags
            if (cleanStr.includes('क्रमांक') && cleanStr.includes('दिनांक')) {
               const dateMatch = trimmed.match(/(दिनांक.*)/);
               const kramank = trimmed.replace(/(दिनांक.*)/, '');
               return (
                 <div key={index} className="flex flex-wrap justify-between items-start my-4 font-semibold w-full">
                   <span>{segmentBold(kramank.trim())}</span>
                   <span>{dateMatch ? segmentBold(dateMatch[1]) : ''}</span>
                 </div>
               );
            }
            if (cleanStr.startsWith('विषय:') || cleanStr.startsWith('विषय :') || cleanStr.startsWith('संदर्भ:')) {
               alignClass = 'text-center font-bold pl-0 sm:pl-10 my-4';
            } else if (cleanStr.startsWith('प्रेषक') || cleanStr.startsWith('प्रति') || cleanStr.startsWith('सेवा में')) {
               alignClass = 'text-left font-bold mt-4 mb-1';
            } else if (cleanStr.length > 50) {
               alignClass = 'text-justify indent-6 sm:indent-12';
            } else if (index < 4 && cleanStr.length < 40) {
               alignClass = 'text-center font-bold text-[16px] sm:text-lg';
            }
          }

          // Strip leftover hyphens in case they were inside the bolding
          if (parsedLine.startsWith('- ')) parsedLine = parsedLine.slice(2).trim();
          
          if (!parsedLine && !hint) return null;

          return (
            <div key={index} className={cn(alignClass, spacingClass, "w-full block relative break-words")}>
              {hint && <FormatHint hint={hint} />}
              <span>{segmentBold(parsedLine)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
});

OfficialLetterViewer.displayName = 'OfficialLetterViewer';

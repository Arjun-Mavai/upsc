'use client';

import { cn } from '@/lib/utils';
import { mergeFlashItemsFromSources, type KeyTermFlashItem } from '@/lib/mains-key-terms-flash';

function parseBold(text: string) {
  if (!text) return null;
  const parts = text.split(/(\*\*.+?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={i} className="font-extrabold text-slate-900 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part.replace(/\*+/g, '')}</span>;
  });
}

export function MainsKeyTermsFlash({
  structured,
  fallbackText,
  isHindi,
  className,
}: {
  structured?: unknown;
  fallbackText?: string | null;
  isHindi: boolean;
  className?: string;
}) {
  const items: KeyTermFlashItem[] = mergeFlashItemsFromSources(structured, fallbackText ?? '');

  if (items.length === 0) {
    return (
      <p className={cn('text-sm text-violet-800/85 dark:text-violet-200/85', className)}>
        {isHindi ? '(अभी कोई की-टर्म नहीं)' : '(No key terms yet)'}
      </p>
    );
  }

  const font = isHindi ? 'font-[family-name:var(--font-pyq-dev)]' : 'font-[family-name:var(--font-pyq-serif)]';

  return (
    <ul
      className={cn(
        'grid list-none gap-2.5 p-0 sm:grid-cols-2',
        font,
        className
      )}
    >
      {items.map((it, idx) => (
        <li
          key={`${idx}-${it.term}-${it.hint.slice(0, 12)}`}
          className={cn(
            'rounded-xl sm:rounded-2xl border-2 px-2.5 sm:px-3 py-2 sm:py-2.5 shadow-sm transition-transform duration-200 hover:-translate-y-0.5 overflow-hidden',
            [
              'border-pink-200/90 bg-gradient-to-br from-white via-pink-50/60 to-white dark:border-pink-800/60 dark:from-pink-950/50 dark:via-slate-900',
              'border-emerald-200/90 bg-gradient-to-br from-white via-emerald-50/60 to-white dark:border-emerald-800/60 dark:from-emerald-950/50 dark:via-slate-900',
              'border-amber-200/90 bg-gradient-to-br from-white via-amber-50/60 to-white dark:border-amber-800/60 dark:from-amber-950/50 dark:via-slate-900',
              'border-sky-200/90 bg-gradient-to-br from-white via-sky-50/60 to-white dark:border-sky-800/60 dark:from-sky-950/50 dark:via-slate-900',
            ][idx % 4]
          )}
        >
          <div className="mb-2">
            <span className={cn(
              "inline-flex items-center gap-1.5 rounded-lg border-b-[3px] border-r px-3 py-1 text-xs uppercase tracking-wider font-extrabold shadow-md shadow-black/10 dark:shadow-black/40 ring-1 ring-white/60 dark:ring-white/10",
              [
                'bg-gradient-to-r from-pink-500/30 to-pink-500/10 text-pink-950 dark:text-pink-300 border-pink-500/60',
                'bg-gradient-to-r from-emerald-500/30 to-emerald-500/10 text-emerald-950 dark:text-emerald-300 border-emerald-500/60',
                'bg-gradient-to-r from-amber-500/30 to-amber-500/10 text-amber-950 dark:text-amber-300 border-amber-500/60',
                'bg-gradient-to-r from-sky-500/30 to-sky-500/10 text-sky-950 dark:text-sky-300 border-sky-500/60',
              ][idx % 4]
            )}>
              {it.emoji ? (
                <span className="select-none text-base sm:text-lg leading-none shrink-0" aria-hidden>
                  {it.emoji}
                </span>
              ) : null}
              {parseBold(it.term)}
            </span>
          </div>
          <div
            className={cn(
              'text-[14.5px] sm:text-[15.5px] leading-[1.75] sm:leading-[1.8] tracking-[0.01em] text-slate-800 dark:text-slate-200 whitespace-pre-line pl-0.5',
              it.term ? 'mt-1.5 border-t border-slate-200/50 pt-1.5 dark:border-slate-800/50' : 'font-semibold'
            )}
          >
            {parseBold(it.hint.replace(/\s*\|\s*/g, '\n• ').replace(/\.\s+(?=[A-Z\u0900-\u097F])/g, '.\n• ').replace(/,\s*/g, ',\n• '))}
          </div>
        </li>
      ))}
    </ul>
  );
}

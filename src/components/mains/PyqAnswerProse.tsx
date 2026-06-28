'use client';

import { cn } from '@/lib/utils';
import { variants as syllabusCardVariants } from '@/components/SyllabusTopicCard';
import { memo, type ReactNode } from 'react';
import { OfficialLetterViewer } from './OfficialLetterViewer';

const PALETTE = ['pink', 'emerald', 'amber', 'sky'] as const;
type PaletteKey = (typeof PALETTE)[number];

/** Repeating light wave under “Evolution”-style bullets */
const WAVE_PAPER =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="5" viewBox="0 0 48 5"><path d="M0 2.5 Q12 .5 24 2.5 T48 2.5" fill="none" stroke="%2394a3b8" stroke-width="0.9" stroke-linecap="round" opacity="0.55"/></svg>`
  );

const WAVE_DEEP =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="5" viewBox="0 0 48 5"><path d="M0 2.5 Q12 .5 24 2.5 T48 2.5" fill="none" stroke="%23e2e8f0" stroke-width="0.9" stroke-linecap="round" opacity="0.35"/></svg>`
  );

const BULLET_DEEP: Record<PaletteKey, string> = {
  pink: 'border-pink-400/22 bg-slate-950/45 shadow-[0_1px_0_rgba(255,255,255,0.04)]',
  emerald: 'border-emerald-500/30 bg-emerald-950/30 shadow-[0_1px_0_rgba(255,255,255,0.04)]',
  amber: 'border-amber-500/28 bg-amber-950/25 shadow-[0_1px_0_rgba(255,255,255,0.04)]',
  sky: 'border-sky-400/25 bg-slate-900/55 shadow-[0_1px_0_rgba(255,255,255,0.04)]',
};

/** Nine strip styles for expert-insights `##` headings (PYQ coach mode) — tile-like, distinct per section. */
const COACH_HEADING_STRIP: { paper: string; deep: string }[] = [
  {
    paper:
      'border-l-violet-500 bg-gradient-to-r from-violet-100 via-fuchsia-50/85 to-transparent text-violet-950 ring-1 ring-violet-200/55',
    deep: 'border-l-violet-400 bg-gradient-to-r from-violet-950/88 via-fuchsia-950/48 to-transparent text-violet-50 ring-1 ring-white/10',
  },
  {
    paper:
      'border-l-fuchsia-500 bg-gradient-to-r from-fuchsia-100 via-pink-50/80 to-transparent text-fuchsia-950 ring-1 ring-fuchsia-200/50',
    deep: 'border-l-fuchsia-400 bg-gradient-to-r from-fuchsia-950/85 via-pink-950/42 to-transparent text-fuchsia-50 ring-1 ring-white/10',
  },
  {
    paper:
      'border-l-rose-500 bg-gradient-to-r from-rose-100 via-orange-50/75 to-transparent text-rose-950 ring-1 ring-rose-200/50',
    deep: 'border-l-rose-400 bg-gradient-to-r from-rose-950/82 via-orange-950/38 to-transparent text-rose-50 ring-1 ring-white/10',
  },
  {
    paper:
      'border-l-orange-500 bg-gradient-to-r from-orange-100 via-amber-50/85 to-transparent text-orange-950 ring-1 ring-orange-200/55',
    deep: 'border-l-orange-400 bg-gradient-to-r from-orange-950/85 via-amber-950/40 to-transparent text-orange-50 ring-1 ring-white/10',
  },
  {
    paper:
      'border-l-amber-500 bg-gradient-to-r from-amber-100 via-yellow-50/70 to-transparent text-amber-950 ring-1 ring-amber-200/55',
    deep: 'border-l-amber-400 bg-gradient-to-r from-amber-950/82 via-yellow-950/35 to-transparent text-amber-50 ring-1 ring-white/10',
  },
  {
    paper:
      'border-l-emerald-600 bg-gradient-to-r from-emerald-100 via-teal-50/80 to-transparent text-emerald-950 ring-1 ring-emerald-200/55',
    deep: 'border-l-emerald-400 bg-gradient-to-r from-emerald-950/85 via-teal-950/42 to-transparent text-emerald-50 ring-1 ring-white/10',
  },
  {
    paper:
      'border-l-teal-600 bg-gradient-to-r from-teal-100 via-cyan-50/78 to-transparent text-teal-950 ring-1 ring-teal-200/50',
    deep: 'border-l-teal-400 bg-gradient-to-r from-teal-950/85 via-cyan-950/40 to-transparent text-teal-50 ring-1 ring-white/10',
  },
  {
    paper:
      'border-l-sky-600 bg-gradient-to-r from-sky-100 via-blue-50/75 to-transparent text-sky-950 ring-1 ring-sky-200/50',
    deep: 'border-l-sky-400 bg-gradient-to-r from-sky-950/82 via-blue-950/38 to-transparent text-sky-50 ring-1 ring-white/10',
  },
  {
    paper:
      'border-l-indigo-600 bg-gradient-to-r from-indigo-100 via-violet-50/78 to-transparent text-indigo-950 ring-1 ring-indigo-200/50',
    deep: 'border-l-indigo-400 bg-gradient-to-r from-indigo-950/88 via-violet-950/45 to-transparent text-indigo-50 ring-1 ring-white/10',
  },
];

function segmentBold(text: string, keyPrefix: string, strongClassName = 'font-semibold'): ReactNode[] {
  if (!text.includes('**')) return [<span key={`${keyPrefix}-plain`}>{text}</span>];
  const parts = text.split(/(\*\*[\s\S]*?\*\*)/g);
  return parts.map((part, i) => {
    const m = part.match(/^\*\*([\s\S]*)\*\*$/);
    if (m) {
      return (
        <strong key={`${keyPrefix}-${i}`} className={cn(strongClassName, 'text-inherit')}>
          {m[1]}
        </strong>
      );
    }
    return <span key={`${keyPrefix}-${i}`}>{part}</span>;
  });
}

function markBandLabel(marks: number, lang: 'hi' | 'en'): string | null {
  if (marks <= 2) return lang === 'hi' ? 'त्वरित बिंदु (~२० शब्द तक)' : 'Quick points (~20 words)';
  if (marks <= 5) return lang === 'hi' ? 'संक्षिप्त बिंदु' : 'Short bullet grid';
  if (marks <= 7) return lang === 'hi' ? 'कॉम्पैक्ट ग्रिड (~६० शब्द वर्ग)' : 'Compact grid (~60-word class)';
  if (marks <= 11) return lang === 'hi' ? 'स्तरीय बिंदु · वैल्यू ऐड' : 'Layered points · value-add';
  return lang === 'hi' ? 'केस / लंबा प्रारूप' : 'Case / long format';
}

/** “2m · Quick points…” chip — PYQ stem header beside title */
export function PyqMarksBandChip({
  marks,
  lang,
  theme,
}: {
  marks: number;
  lang: 'hi' | 'en';
  theme: 'deep' | 'paper';
}) {
  const band = markBandLabel(marks, lang);
  if (!band) return null;
  return (
    <div
      className={cn(
        'inline-flex max-w-[min(100%,20rem)] flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border px-2.5 py-1',
        theme === 'deep'
          ? 'border-emerald-400/35 bg-emerald-950/60 text-emerald-100 shadow-sm'
          : 'border-emerald-200 bg-emerald-50 text-emerald-900 shadow-sm ring-1 ring-emerald-100/90'
      )}
    >
      <span className="shrink-0 text-[9px] font-black tabular-nums tracking-wide opacity-95">{marks}m</span>
      <span className="min-w-0 text-[9px] font-bold leading-snug tracking-wide opacity-95">{band}</span>
    </div>
  );
}

function renderBulletLead(
  body: string,
  keyPrefix: string,
  theme: 'deep' | 'paper',
  base: string,
  options?: { labelProminent?: boolean }
): ReactNode {
  const labelProminent = Boolean(options?.labelProminent);

  const lead = body.match(/^\*\*([^*]+)\*\*([\s\S]*)$/);
  if (lead) {
    const title = lead[1].trim();
    const tailRaw = lead[2] ?? '';
    const isEvolution = /evolution|विकास/i.test(title);

    return (
      <div className="min-w-0 flex-1">
        <span className={base}>
          <strong
            className={cn(
              labelProminent ? 'mr-1.5 font-black tracking-wide uppercase' : 'mr-1 font-bold',
              labelProminent
                ? theme === 'paper'
                  ? 'inline text-[14px] md:text-[15px] text-slate-950 bg-amber-100/80 border-b-2 border-amber-500 px-1.5 py-0.5 rounded-md mb-1.5 shadow-sm box-decoration-clone'
                  : 'inline text-[14px] md:text-[15px] text-amber-300 bg-amber-950/70 border-b-2 border-amber-400 px-1.5 py-0.5 rounded-md mb-1.5 shadow-sm box-decoration-clone'
                : theme === 'paper'
                  ? 'border-b-[2.5px] border-slate-900/85 pb-[1px] text-slate-900'
                  : 'border-b-2 border-white/80 pb-px text-slate-50'
            )}
          >
            {title}
          </strong>
            {tailRaw.trimStart() ? (
            tailRaw.includes('**') ? (
              segmentBold(tailRaw.trimStart(), `${keyPrefix}-tail`, 'font-semibold')
            ) : (
              <span>{tailRaw}</span>
            )
          ) : null}
        </span>
        {isEvolution ? (
          <div
            className="mt-1.5 mb-1 h-[5px] w-full shrink-0 bg-repeat-x opacity-95 [background-size:32px_5px]"
            style={{
              backgroundImage: `url(${theme === 'paper' ? WAVE_PAPER : WAVE_DEEP})`,
            }}
            aria-hidden
          />
        ) : null}
      </div>
    );
  }

  /* Subsection cue: "निर्माण तकनीक: …" — bold label, clearer than plain body copy */
  if (labelProminent) {
    const colon = body.match(/^([^:\n]{1,72}):\s+([\s\S]+)$/);
    if (colon && colon[2].trim()) {
      const lab = colon[1].trim();
      const rest = colon[2].trim();
      const wordy = lab.split(/\s+/).length > 14;
      if (!wordy) {
        return (
          <div className="min-w-0 flex-1">
            <span className={base}>
              <strong
                className={cn(
                  'inline font-black tracking-wide text-[14px] md:text-[15px] px-1.5 py-0.5 rounded-md mb-1.5 border-b-2 mr-1.5 shadow-sm box-decoration-clone',
                  theme === 'paper' 
                    ? 'text-slate-950 bg-amber-100/80 border-amber-500' 
                    : 'text-amber-300 bg-amber-950/70 border-amber-400'
                )}
              >
                {lab}:
              </strong>
              {rest.includes('**') ? segmentBold(rest, `${keyPrefix}-colon`, 'font-semibold') : <span>{rest}</span>}
            </span>
          </div>
        );
      }
    }
  }

  return (
    <div className={cn('min-w-0 flex-1 break-words text-pretty', base)}>
      {segmentBold(body, keyPrefix, 'font-semibold')}
    </div>
  );
}

export const PyqAnswerProse = memo(({
  text,
  lang,
  theme,
  sectionTint,
  marks,
  paletteRotationStart = 0,
  density = 'comfortable',
  coachMode = false,
  prominentHeadings = false,
  mainsBoxLayout = false,
  readerAccent = false,
}: {
  text: string;
  lang: 'hi' | 'en';
  theme: 'deep' | 'paper';
  sectionTint?: 0 | 1;
  marks?: number;
  paletteRotationStart?: number;
  density?: 'comfortable' | 'compact';
  /** Rotating colourful strips on each `##` heading (PYQ expert insights). */
  coachMode?: boolean;
  /** Larger bolder ## / ### for long mains model answers (7m+). */
  prominentHeadings?: boolean;
  /** Mains topic model answers — bordered readable boxes for every mark band (PYQ desk keeps default). */
  mainsBoxLayout?: boolean;
  /** Slightly richer tracking/legibility for long-form mains models (light reading). */
  readerAccent?: boolean;
}) => {
  // Trigger letter viewer if it explicitly has AI alignment tags or if it's 12.5/15m Hindi
  const isDraftFormat = lang === 'hi' && (
    marks === 15 || 
    marks === 12.5 || 
    text.includes('[मध्य में') || 
    text.includes('[Center Align]') ||
    text.includes('प्रारूप लेखन')
  );

  if (isDraftFormat) {
    return <OfficialLetterViewer text={text} theme={theme} />;
  }

  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const tint = sectionTint ?? 0;
  const headingBar =
    theme === 'deep'
      ? tint === 0
        ? 'border-l-emerald-400/55 bg-gradient-to-r from-emerald-500/12 to-transparent'
        : 'border-l-sky-400/45 bg-gradient-to-r from-sky-500/10 to-transparent'
      : tint === 0
        ? 'border-l-emerald-500/70 bg-gradient-to-r from-emerald-500/15 to-transparent'
        : 'border-l-slate-500/60 bg-gradient-to-r from-slate-500/12 to-transparent';

  const hiFont = 'font-[family-name:var(--font-pyq-dev)]';
  const enFont = 'font-[family-name:var(--font-pyq-serif)]';
  const tight = marks != null && marks <= 2;
  const compact = density === 'compact';
  const base = cn(
    'text-pretty',
    compact
      ? 'text-[15px] md:text-[16px]'
      : tight
        ? 'text-[16px] md:text-[17px]'
        : readerAccent
          ? 'text-[17px] md:text-[1.125rem]'
          : 'text-[17px] md:text-[18px]',
    lang === 'hi'
      ? cn(
          hiFont,
          compact
            ? 'leading-[1.72] tracking-[0.02em]'
            : tight
              ? 'leading-[1.78] tracking-[0.02em]'
              : readerAccent
                ? 'leading-[1.92] tracking-[0.035em]'
                : 'leading-[1.88] tracking-[0.02em]'
        )
      : cn(
          enFont,
          compact
            ? 'leading-[1.65] tracking-[0.01em]'
            : tight
              ? 'leading-[1.68] tracking-[0.01em]'
              : readerAccent
                ? 'leading-[1.82] tracking-[0.025em]'
                : 'leading-[1.78] tracking-[0.01em]'
        ),
    mainsBoxLayout
      ? theme === 'deep'
        ? 'text-slate-50'
        : 'text-slate-950'
      : theme === 'deep'
        ? 'text-slate-100'
        : 'text-slate-800'
  );

  const nodes: ReactNode[] = [];
  let li = 0;
  let bulletOrdinal = 0;
  let coachH2Ordinal = 0;

  /** Mains model surface: boxed, high-contrast (2m–case18). PYQ library leaves this false. */
  const examSurfaceChrome = Boolean(mainsBoxLayout) || Boolean(prominentHeadings);
  const longBandHeadings = marks != null && marks >= 7;

  let currentTable: string[] = [];
  let currentQuote: string[] = [];

  const flushQuote = () => {
    if (currentQuote.length === 0) return;
    const qKey = `quote-${li++}`;
    nodes.push(
      <blockquote key={qKey} className={cn("my-3 border-l-[4px] py-3 pl-4 pr-3 rounded-r-xl shadow-sm italic", theme === 'deep' ? 'border-amber-600/80 bg-amber-950/20 text-amber-100' : 'border-amber-500 bg-amber-50/50 text-amber-950')}>
        {currentQuote.map((ql, qIdx) => (
          <p key={qIdx} className={cn("mb-2 last:mb-0", base)}>{segmentBold(ql, `${qKey}-p-${qIdx}`, 'font-semibold')}</p>
        ))}
      </blockquote>
    );
    currentQuote = [];
  };

  const flushTable = () => {
    if (currentTable.length === 0) return;
    const rows = currentTable.filter(r => !/^\|[\s-:]+\|/.test(r));
    if (rows.length > 0) {
      const tKey = `table-${li++}`;
      nodes.push(
        <div key={tKey} className={cn("my-4 w-full overflow-x-auto rounded-xl border shadow-sm", theme === 'deep' ? 'border-slate-700/80' : 'border-slate-200/90')}>
          <table className="w-full text-left text-[14px] sm:text-[15px]">
            <thead className={theme === 'deep' ? 'bg-slate-900/50 text-slate-100' : 'bg-slate-50 text-slate-900'}>
              <tr>
                {rows[0].split('|').filter((_, idx, arr) => idx !== 0 && idx !== arr.length - 1).map((cell, idx) => (
                  <th key={idx} className={cn("px-4 py-3 font-bold border-b whitespace-nowrap", theme === 'deep' ? 'border-slate-700' : 'border-slate-200')}>
                    {segmentBold(cell.trim(), `${tKey}-th-${idx}`, 'font-black')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(1).map((row, rIdx) => (
                <tr key={rIdx} className={cn("border-b last:border-0", theme === 'deep' ? 'bg-slate-950 border-slate-800 hover:bg-slate-900/40' : 'bg-white border-slate-100 hover:bg-slate-50')}>
                  {row.split('|').filter((_, idx, arr) => idx !== 0 && idx !== arr.length - 1).map((cell, idx) => (
                    <td key={idx} className={cn("px-4 py-3 border-r last:border-r-0 align-top", theme === 'deep' ? 'text-slate-200 border-slate-800' : 'text-slate-800 border-slate-100')}>
                      {segmentBold(cell.trim(), `${tKey}-td-${rIdx}-${idx}`, 'font-semibold')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    currentTable = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('|') || trimmed.startsWith('- |')) {
      flushQuote();
      currentTable.push(trimmed.startsWith('- |') ? trimmed.slice(2).trim() : trimmed);
      continue;
    }

    if (trimmed.startsWith('>')) {
      flushTable();
      currentQuote.push(trimmed.slice(1).trim());
      continue;
    }

    flushTable();
    flushQuote();

    if (!trimmed) {
      nodes.push(<div key={`gap-${li++}`} className={compact ? 'h-1' : tight ? 'h-1.5' : 'h-2'} />);
      continue;
    }
    const hash = trimmed.match(/^(#{2,3})\s+(.+)$/);
    if (hash) {
      const level = hash[1].length;
      const k = `h-${li++}`;
      const stripClass =
        examSurfaceChrome
          ? theme === 'deep'
            ? 'border-l-[4px] border-white bg-slate-950 text-slate-50 shadow-none ring-0 border-b border-slate-700 pb-2'
            : 'border-l-[4px] border-slate-900 bg-white text-slate-950 shadow-none ring-0 border-b border-slate-200 pb-2'
          : coachMode && level === 2
            ? (theme === 'deep'
                ? COACH_HEADING_STRIP[coachH2Ordinal % COACH_HEADING_STRIP.length].deep
                : COACH_HEADING_STRIP[coachH2Ordinal % COACH_HEADING_STRIP.length].paper)
            : headingBar;
      if (coachMode && level === 2 && !examSurfaceChrome) coachH2Ordinal++;

      nodes.push(
        <div
          key={k}
          className={cn(
            'mt-3 mb-2 rounded-r-md py-1.5 pl-2 pr-1 break-words text-pretty min-w-0 overflow-hidden',
            examSurfaceChrome ? 'font-black tracking-tight' : prominentHeadings ? 'border-l-[6px]' : 'border-l-4',
            !examSurfaceChrome && (prominentHeadings ? 'font-black' : 'font-bold'),
            stripClass,
            compact && !prominentHeadings && 'py-1 pl-2',
            examSurfaceChrome &&
              level === 2 &&
              (longBandHeadings ? 'py-2.5 pl-3 text-[18px] md:text-[1.35rem]' : 'py-2 pl-3 text-[16px] md:text-[17px]'),
            examSurfaceChrome &&
              level === 3 &&
              (longBandHeadings ? 'py-2 pl-3 text-[16px] md:text-lg' : 'py-1.5 pl-3 text-[15px] md:text-[16px]'),
            !examSurfaceChrome &&
              prominentHeadings &&
              level === 2 &&
              'py-2.5 pl-3 md:py-3',
            !examSurfaceChrome &&
              (level === 2
                ? prominentHeadings
                  ? 'text-[16px] md:text-xl'
                  : 'text-[15px] md:text-[17px]'
                : prominentHeadings
                  ? 'text-[14px] md:text-[17px] font-black'
                  : 'text-[14px] md:text-[16px]')
          )}
        >
          {segmentBold(hash[2], k, examSurfaceChrome ? 'font-black' : 'font-semibold')}
        </div>
      );
      continue;
    }

    const numbered = trimmed.match(/^(\d+)[.)]\s+(.+)$/);
    const bullet = trimmed.match(/^[-•]\s+(.+)$/);
    const body = numbered ? numbered[2] : bullet ? bullet[1] : null;

    if (body != null) {
      const k = `b-${li++}`;
      bulletOrdinal++;
      const key = PALETTE[(bulletOrdinal - 1 + paletteRotationStart) % 4];
      const light =
        key === 'sky'
          ? { bg: 'bg-sky-50', border: 'border-sky-100' }
          : syllabusCardVariants[key as 'pink' | 'emerald' | 'amber'];

      const chip = examSurfaceChrome
        ? cn(
            compact ? 'rounded-md px-2 py-1.5' : 'rounded-lg border px-2 sm:px-2.5 py-1.5 sm:py-2',
            'shadow-sm break-words min-w-0 overflow-hidden text-pretty',
            theme === 'deep'
              ? 'border-slate-600 bg-slate-950 text-slate-50'
              : 'border-slate-300 bg-white text-slate-950'
          )
        : cn(
            compact ? 'rounded-lg border px-1.5 py-1 shadow-none' : 'rounded-xl border px-2 sm:px-2.5 py-1.5 sm:py-2 shadow-sm',
            'transition-colors break-words min-w-0 overflow-hidden text-pretty',
            theme === 'deep'
              ? BULLET_DEEP[key]
              : cn(light.bg, 'border-black/[0.10] ring-1 ring-black/[0.04] dark:ring-white/[0.05]')
          );

      const dot = examSurfaceChrome
        ? theme === 'deep'
          ? 'bg-emerald-400'
          : 'bg-slate-800'
        : theme === 'deep'
          ? key === 'pink'
            ? 'bg-pink-400'
            : key === 'emerald'
              ? 'bg-emerald-400'
              : key === 'amber'
                ? 'bg-amber-400'
                : 'bg-sky-400'
          : key === 'pink'
            ? 'bg-pink-500'
            : key === 'emerald'
              ? 'bg-emerald-500'
              : key === 'amber'
                ? 'bg-amber-500'
                : 'bg-sky-500';

      nodes.push(
        <div key={k} className={chip}>
          <div className={cn('flex items-start min-w-0 w-full', compact ? 'gap-2' : examSurfaceChrome ? 'gap-2.5' : 'gap-3')}>
            {!examSurfaceChrome ? (
              <span
                className={cn(
                  'h-2.5 w-2.5 shrink-0 rounded-full ring-2 self-center',
                  dot,
                  theme === 'paper' ? 'ring-white/95' : 'ring-white/10'
                )}
                aria-hidden
              />
            ) : (
              <span
                className={cn('mt-2.5 h-2 w-2 shrink-0 rounded-full', dot)}
                aria-hidden
              />
            )}
            {renderBulletLead(body, k, theme, base, { labelProminent: mainsBoxLayout })}
          </div>
        </div>
      );
      continue;
    }

    const k = `p-${li++}`;
    const strayLayout = examSurfaceChrome
      ? compact
        ? 'my-1 rounded-md border px-2.5 py-1.5 text-[15px] md:text-[16px] break-words text-pretty min-w-0 overflow-hidden'
        : 'my-1.5 rounded-lg border px-3 py-2 break-words text-pretty min-w-0 overflow-hidden'
      : compact
        ? 'my-1 rounded-md border border-dashed px-2 py-1.5 text-[15px] md:text-[16px] break-words text-pretty min-w-0 overflow-hidden'
        : 'my-2 rounded-lg border border-dashed px-3 py-2 break-words text-pretty min-w-0 overflow-hidden';
    const straySurface = examSurfaceChrome
      ? theme === 'deep'
        ? 'border-slate-600 bg-slate-950'
        : 'border-slate-300 bg-white'
      : theme === 'deep'
        ? 'border-slate-600/50 bg-slate-900/40'
        : 'border-slate-200 bg-white/50';

    nodes.push(
      <p key={k} className={cn(strayLayout, straySurface, base)}>
        {segmentBold(trimmed, k, 'font-semibold')}
      </p>
    );
  }

  flushTable();
  flushQuote();

  return (
    <div
      className={cn(
        'select-text px-px',
        readerAccent && 'subpixel-antialiased [text-rendering:optimizeLegibility]'
      )}
    >
      <div className={compact ? '-mx-0.5 space-y-4' : readerAccent ? 'space-y-4' : 'space-y-4'}>{nodes}</div>
    </div>
  );
});

PyqAnswerProse.displayName = 'PyqAnswerProse';

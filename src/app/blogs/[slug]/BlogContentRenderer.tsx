'use client';

import { useEffect } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, ArrowLeft, Lock, Crown } from 'lucide-react';
import Link from 'next/link';
import NextImage from 'next/image';
import { Button } from '@/components/ui/button';
import { useSettingsStore } from '@/store/useSettingsStore';
import { cn } from '@/lib/utils';
import { useRouter, useSearchParams } from 'next/navigation';

// Format inline text: bold quoted text, bold **text**, handle Key: Value
function formatText(text: string, highlightClassName: string = 'text-slate-900'): React.ReactNode {
  if (typeof text !== 'string') return String(text || '');
  if (!text) return text;

  // Process markdown bold (**text**) into actual bold, then quoted text
  // Split by **bold** markers first
  const boldParts = text.split(/(\*{2}[^*]+\*{2})/g);
  if (boldParts.length > 1) {
    return boldParts.map((part, i) => {
      if (/^\*{2}[^*]+\*{2}$/.test(part)) {
        const inner = part.replace(/\*{2}/g, '');
        return (
          <strong key={i} className={cn(highlightClassName, 'font-semibold')}>
            {inner}
          </strong>
        );
      }
      // Remove stray single stars
      const clean = part.replace(/\*([^*]+)\*/g, '$1');
      // Check for quoted text in this segment
      const quoteParts = clean.split(/(["'][^"']+["'])/g);
      if (quoteParts.length > 1) {
        return quoteParts.map((qp, j) => {
          if (/^["'][^"']+["']$/.test(qp)) {
            return (
              <strong key={`${i}-${j}`} className={cn(highlightClassName, 'font-semibold')}>
                {qp}
              </strong>
            );
          }
          return <span key={`${i}-${j}`}>{qp}</span>;
        });
      }
      return <span key={i}>{clean}</span>;
    });
  }

  // Remove remaining stars
  const cleaned = text.replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1');

  // Bold quoted text
  const parts = cleaned.split(/(["'][^"']+["'])/g);
  if (parts.length > 1) {
    return parts.map((part, i) => {
      if (/^["'][^"']+["']$/.test(part)) {
        return (
          <strong key={i} className={cn(highlightClassName, 'font-semibold')}>
            {part}
          </strong>
        );
      }
      return <span key={i}>{part}</span>;
    });
  }

  return cleaned;
}

// Render a single list item that may contain "Label: description" pattern
function renderListItem(
  item: string,
  num: number | string,
  i: number,
  highlightClassName: string = 'text-slate-900'
): React.ReactNode {
  if (typeof item !== 'string') return <li key={i}>{String(item || '')}</li>;
  const trimmed = item.trim();
  // Check for "**Label:** content" or "Label: content" pattern
  const boldLabelMatch = trimmed.match(/^\*{0,2}([^:*]{2,30})\*{0,2}:\s*(.+)/);
  if (boldLabelMatch) {
    return (
      <li key={i} className="flex items-start gap-3 leading-relaxed text-slate-700">
        <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
          {num}
        </span>
        <span className="flex-1 text-base">
          <strong className={cn(highlightClassName, 'font-semibold')}>
            {boldLabelMatch[1].replace(/\*/g, '')}:
          </strong>{' '}
          {formatText(boldLabelMatch[2], highlightClassName)}
        </span>
      </li>
    );
  }
  return (
    <li key={i} className="flex items-start gap-3 leading-relaxed text-slate-700">
      <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
        {num}
      </span>
      <span className="flex-1 text-base">{formatText(trimmed, highlightClassName)}</span>
    </li>
  );
}

// Detect numbered items, bullet dots, key:value, or plain paragraph
function renderParagraphOrList(
  text: string,
  idx: number,
  highlightClassName: string = 'text-slate-900'
): React.ReactNode {
  if (typeof text !== 'string' || !text) return null;

  // Remove stars for detection (but keep original for formatText)
  const cleaned = text.replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1');

  // Check for bullet dot pattern: "• item1 • item2" or lines starting with •
  if (cleaned.includes('•')) {
    const bulletItems = cleaned
      .split(/•/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (bulletItems.length > 0) {
      // Check if there's text before the first bullet
      const beforeBullet = cleaned.substring(0, cleaned.indexOf('•')).trim();
      return (
        <div key={idx} className="my-4">
          {beforeBullet && (
            <p className={cn(highlightClassName, 'mb-2 text-base font-semibold')}>
              {formatText(beforeBullet, highlightClassName)}
            </p>
          )}
          <ul className="ml-1 space-y-1.5">
            {bulletItems.map((item, i) => {
              // Check for "Label: value" inside bullet
              const colonMatch = item.match(/^([^:]{2,40}):\s*(.+)/);
              if (colonMatch) {
                return (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 text-base leading-relaxed text-slate-700"
                  >
                    <span className="mt-1 flex-shrink-0 text-emerald-500">•</span>
                    <span>
                      <strong className={cn(highlightClassName, 'font-semibold')}>
                        {colonMatch[1]}:
                      </strong>{' '}
                      {formatText(colonMatch[2], highlightClassName)}
                    </span>
                  </li>
                );
              }
              return (
                <li
                  key={i}
                  className="flex items-start gap-2.5 text-base leading-relaxed text-slate-700"
                >
                  <span className="mt-1 flex-shrink-0 text-emerald-500">•</span>
                  <span>{formatText(item, highlightClassName)}</span>
                </li>
              );
            })}
          </ul>
        </div>
      );
    }
  }

  // Check for numbered list pattern: "1. xxx 2. xxx" or inline "1. **Bold:** text 2. ..."
  const numberedPattern = /(?:^|\s)(\d+)[.)]\s+/;
  if (numberedPattern.test(cleaned)) {
    const items = cleaned.split(/(?:^|\s)\d+[.)]\s+/).filter(Boolean);
    const numbers = cleaned.match(/\d+(?=[.)]\s)/g) || [];

    if (items.length > 1) {
      // Check if there's intro text before first number
      const firstNumIdx = cleaned.search(/\d+[.)]\s/);
      const intro = firstNumIdx > 0 ? cleaned.substring(0, firstNumIdx).trim() : '';

      return (
        <div key={idx} className="my-4">
          {intro && (
            <p className={cn(highlightClassName, 'mb-2 text-base font-semibold')}>
              {formatText(intro, highlightClassName)}
            </p>
          )}
          <ol className="space-y-2">
            {items.map((item, i) =>
              renderListItem(item, numbers[i] || i + 1, i, highlightClassName)
            )}
          </ol>
        </div>
      );
    }
  }

  // Check for "Key: Value" pattern (key facts)
  const colonMatch = cleaned.match(/^([^:]{3,40}):\s*(.+)/);
  if (colonMatch && !cleaned.startsWith('http')) {
    return (
      <p key={idx} className="mb-4 text-base leading-relaxed text-slate-700">
        <strong className={cn(highlightClassName, 'font-semibold')}>{colonMatch[1]}:</strong>{' '}
        {formatText(colonMatch[2], highlightClassName)}
      </p>
    );
  }

  return (
    <p key={idx} className="mb-5 text-base leading-relaxed text-slate-700">
      {formatText(cleaned, highlightClassName)}
    </p>
  );
}

export default function BlogContentRenderer({
  blog,
  isLocked = false,
}: {
  blog: any;
  isLocked?: boolean;
}) {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  const { language, setLanguage } = useSettingsStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromQuery = searchParams.get('from');
  const backHref = fromQuery ? `/blogs?${fromQuery}` : '/blogs';

  useEffect(() => {
    router.prefetch(backHref);
  }, [router, backHref]);

  const rawContent = Array.isArray(blog.content)
    ? blog.content
    : blog.content[language] || blog.content['hi'] || [];

  // Handle both array format and structured object format { introduction, blocks, conclusion }
  const blocks = Array.isArray(rawContent) ? rawContent : rawContent.blocks || [];
  const introduction = !Array.isArray(rawContent) ? rawContent.introduction : '';
  const conclusion = !Array.isArray(rawContent) ? rawContent.conclusion : '';

  const renderContent = (blocks: any[]) => {
    if (!blocks || !Array.isArray(blocks)) return null;

    return blocks.map((block: any, idx: number) => {
      switch (block.type) {
        case 'h2': {
          const text = (block.text || '').replace(/\*{1,2}/g, '');
          return (
            <h2
              key={idx}
              className="mt-10 mb-4 border-b border-slate-100 pb-2 text-xl font-bold text-slate-900 md:text-2xl"
            >
              {text}
            </h2>
          );
        }
        case 'h3': {
          const text = (block.text || '').replace(/\*{1,2}/g, '');
          return (
            <h3 key={idx} className="mt-7 mb-3 text-lg font-semibold text-slate-800 md:text-xl">
              {text}
            </h3>
          );
        }
        case 'p':
          return renderParagraphOrList(block.text, idx);

        case 'img':
          return (
            <div
              key={idx}
              className="relative my-6 overflow-hidden rounded-xl border border-slate-100 shadow-md"
            >
              <div className="relative aspect-video w-full">
                <NextImage
                  src={block.src}
                  alt={block.alt || 'Blog image'}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 800px"
                />
              </div>
              {block.caption && (
                <p className="bg-slate-50 py-2 text-center text-sm text-slate-500 italic">
                  {block.caption}
                </p>
              )}
            </div>
          );
        case 'ul':
          return (
            <ul key={idx} className="my-4 ml-1 space-y-2">
              {block.items.map((item: string, i: number) => {
                const cleaned = (item || '').replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1');
                return (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 text-base leading-relaxed text-slate-700"
                  >
                    <span className="mt-1.5 flex-shrink-0 text-emerald-500">•</span>
                    <span>{formatText(cleaned)}</span>
                  </li>
                );
              })}
            </ul>
          );
        case 'table':
          return (
            <div
              key={idx}
              className="my-6 overflow-hidden rounded-xl border border-slate-200 shadow-sm"
            >
              <div className="-mx-px overflow-x-auto">
                <table className="w-full border-collapse bg-white text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      {block.head.map((header: string, i: number) => (
                        <th
                          key={i}
                          className="border-b-2 border-slate-200 px-3 py-3 text-left text-xs font-bold whitespace-nowrap text-slate-900 sm:px-5 sm:text-sm"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {block.body.map((row: string[], rowIdx: number) => (
                      <tr key={rowIdx} className="hover:bg-slate-50/50">
                        {row.map((cell: string, cellIdx: number) => (
                          <td
                            key={cellIdx}
                            className="px-3 py-2.5 text-xs text-slate-700 sm:px-5 sm:text-sm"
                          >
                            {formatText(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {block.instruction && (
                <p className="border-t border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-500 italic">
                  {block.instruction}
                </p>
              )}
            </div>
          );
        case 'quote':
          return (
            <blockquote
              key={idx}
              className="my-6 rounded-r-lg border-l-4 border-emerald-500 bg-emerald-50/40 py-3 pl-5"
            >
              <p className="text-base leading-relaxed font-medium text-slate-800 italic">
                {formatText(block.text)}
              </p>
            </blockquote>
          );

        case 'highlight': {
          const levelColors: Record<string, string> = {
            critical: 'bg-amber-50 border-amber-300 text-amber-900',
            important: 'bg-yellow-50 border-yellow-300 text-yellow-900',
            note: 'bg-blue-50 border-blue-300 text-blue-900',
          };
          const levelIcons: Record<string, string> = {
            critical: '⚠️',
            important: '💡',
            note: 'ℹ️',
          };
          return (
            <div
              key={idx}
              className={`my-5 rounded-xl border-l-4 p-4 ${levelColors[block.level] || levelColors.important}`}
            >
              <div className="flex items-start gap-2.5">
                <span className="flex-shrink-0 text-xl">
                  {block.icon || levelIcons[block.level]}
                </span>
                <p className="text-sm leading-relaxed font-medium">{formatText(block.text)}</p>
              </div>
            </div>
          );
        }

        case 'pyq':
          return (
            <div key={idx} className="my-6 rounded-xl bg-slate-900 p-5 text-white shadow-lg">
              <div className="mb-3 flex items-center gap-2.5">
                <span className="text-lg">📝</span>
                <div>
                  <p className="text-xs font-bold tracking-wider text-emerald-400 uppercase">
                    {block.exam}
                  </p>
                  <p className="text-xs text-slate-400">{block.year}</p>
                </div>
              </div>
              <p className="mb-3 text-base leading-relaxed font-medium">
                {formatText(block.question, 'text-emerald-400')}
              </p>
              {block.options && (
                <div className="mb-3 space-y-1.5">
                  {block.options.map((opt: string, i: number) => (
                    <div
                      key={i}
                      className={`rounded-lg px-3 py-2 text-sm ${opt === block.correct ? 'border border-emerald-500/50 bg-emerald-600/20' : 'bg-slate-800/60'}`}
                    >
                      <span className="mr-1.5 font-mono text-xs">
                        {String.fromCharCode(65 + i)}.
                      </span>
                      {formatText(opt, 'text-emerald-400')}
                      {opt === block.correct && (
                        <span className="ml-1.5 text-xs text-emerald-400">✓</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {block.strategy && (
                <div className="mt-3 border-t border-slate-700 pt-3">
                  <p className="mb-1 text-[11px] tracking-wider text-slate-400 uppercase">
                    Strategy
                  </p>
                  <p className="text-sm text-slate-300">
                    {formatText(block.strategy, 'text-emerald-400')}
                  </p>
                </div>
              )}
            </div>
          );

        case 'mnemonic':
          return (
            <div
              key={idx}
              className="my-6 rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 p-5"
            >
              <div className="mb-3 flex items-center gap-2.5">
                <span className="text-2xl">{block.visual || '🧠'}</span>
                <div>
                  <p className="text-[11px] font-bold tracking-wider text-purple-600 uppercase">
                    Memory Trick
                  </p>
                  <p className="text-sm font-semibold text-slate-800">{block.topic}</p>
                </div>
              </div>
              <div className="mb-2 rounded-lg bg-white/70 p-3">
                {renderParagraphOrList(block.trick || '', idx * 1000)}
              </div>
              {block.explanation && (
                <div className="text-sm text-slate-600">
                  {renderParagraphOrList(block.explanation || '', idx * 1000 + 1)}
                </div>
              )}
            </div>
          );

        case 'fact_card':
          return (
            <div
              key={idx}
              className="my-6 rounded-xl border border-emerald-200 bg-emerald-50/80 p-5"
            >
              <div className="mb-3 flex items-center gap-2.5">
                <span className="text-2xl">{block.icon || '📊'}</span>
                <p className="text-base font-bold text-emerald-900">{block.title}</p>
              </div>
              <ul className="space-y-1.5">
                {block.facts.map((fact: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="mt-0.5 flex-shrink-0 font-bold text-emerald-500">✓</span>
                    <span>{formatText(fact)}</span>
                  </li>
                ))}
              </ul>
            </div>
          );

        case 'case_study':
          return (
            <div key={idx} className="my-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
              <div className="mb-3 flex items-start gap-2.5">
                <span className="flex-shrink-0 text-2xl">⚖️</span>
                <div>
                  <p className="text-lg font-bold text-slate-900">{block.title}</p>
                  {block.year && <p className="text-xs text-slate-500">{block.year}</p>}
                </div>
              </div>
              <div className="mb-3 rounded-lg bg-white p-3">
                <p className="mb-1 text-xs font-semibold text-slate-500">Significance</p>
                <p className="text-sm text-slate-800">{block.significance}</p>
              </div>
              <ul className="mb-3 space-y-1">
                {block.keyPoints.map((point: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="mt-0.5 text-slate-400">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
              {block.examRelevance && (
                <p className="border-t border-slate-200 pt-2 text-xs font-semibold text-emerald-600">
                  📌 {block.examRelevance}
                </p>
              )}
            </div>
          );

        case 'exam_pattern':
          return (
            <div key={idx} className="my-6 rounded-xl bg-indigo-900 p-5 text-white">
              <div className="mb-3 flex items-center gap-2.5">
                <span className="text-2xl">📊</span>
                <div>
                  <p className="text-[11px] font-bold tracking-wider text-indigo-300 uppercase">
                    Exam Pattern
                  </p>
                  <p className="text-base font-bold">{block.topic}</p>
                </div>
              </div>
              <p className="mb-3 text-sm text-indigo-200">
                {formatText(block.analysis, 'text-indigo-300')}
              </p>
              <div className="mb-2 rounded-lg bg-white/10 p-3">
                <ul className="space-y-1.5">
                  {block.stats.map((stat: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-indigo-300">▸</span>
                      <span>{formatText(stat, 'text-indigo-300')}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {block.trend && (
                <div className="border-t border-white/20 pt-2">
                  <p className="mb-1 text-[11px] tracking-wider text-indigo-300 uppercase">Trend</p>
                  <p className="text-sm">{formatText(block.trend, 'text-indigo-300')}</p>
                </div>
              )}
            </div>
          );

        default:
          return null;
      }
    });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Reading Progress Bar */}
      <motion.div
        className="fixed top-[64px] right-0 left-0 z-50 h-0.5 origin-left bg-gradient-to-r from-emerald-500 to-teal-500"
        style={{ scaleX }}
      />

      {/* Hero Section — compact */}
      <div className="relative flex min-h-[280px] w-full items-end overflow-hidden bg-slate-900 sm:min-h-[360px]">
        <div className="absolute inset-0 z-0 opacity-40">
          {blog.imageUrl ? (
            /* We use the same image as below but without 'priority' here to let the main content image load first if needed.
               Actually, for LCP, the main image below is more important if it's visible. 
               But this background is also above fold. 
               Let's keep this one as priority=false (lazy is default) or use a smaller version if possible.
               Since we don't have variants, we just rely on NextImage optimization.
            */
            <NextImage
              src={blog.imageUrl}
              alt={blog.title}
              fill
              className="object-cover"
              sizes="100vw"
            />
          ) : (
            <div className="h-full w-full bg-slate-800" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/70 to-transparent" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-3xl px-5 pt-20 pb-8 text-white lg:max-w-5xl">
          <Badge className="pointer-events-none mb-3 bg-emerald-600/90 px-3 py-1 text-xs tracking-widest uppercase hover:bg-emerald-700">
            {blog.category.replace(/_/g, ' ')}
          </Badge>
          <h1 className="mb-3 text-2xl leading-tight font-black tracking-tight sm:text-3xl md:text-4xl">
            {blog.title}
          </h1>
          <div className="flex items-center gap-4 text-sm text-slate-400">
            <span className="flex items-center gap-1.5">
              <Clock size={14} />
              {blog.readingTime || 5} min
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar size={14} />
              {new Date(blog.createdAt).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <article className="mx-auto max-w-3xl px-5 py-8 sm:py-12 lg:max-w-5xl">
        {/* Back Button & Language Toggle */}
        <div className="mb-8 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 text-sm text-slate-500 hover:text-slate-900"
            onClick={() => (window.history.length > 1 ? router.back() : router.push(backHref))}
          >
            <ArrowLeft size={14} className="mr-1.5" /> Back
          </Button>

          {!isLocked && !Array.isArray(blog.content) && (
            <div className="flex rounded-lg bg-slate-100 p-0.5">
              <button
                onClick={() => setLanguage('hi')}
                className={`rounded-md px-3 py-1 text-sm font-bold transition-all ${language === 'hi' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                हिंदी
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`rounded-md px-3 py-1 text-sm font-bold transition-all ${language === 'en' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                EN
              </button>
            </div>
          )}
        </div>

        {/* BRAND NEW PROMINENT FEATURED IMAGE */}
        {blog.imageUrl && (
          <div className="group relative mb-10 w-full overflow-hidden rounded-3xl shadow-xl ring-1 ring-slate-900/5">
            <div className="relative w-full">
              <NextImage
                src={blog.imageUrl}
                alt={blog.title}
                width={1200}
                height={800}
                priority
                className="h-auto w-full object-contain transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                sizes="(max-width: 1024px) 100vw, 1024px"
              />
            </div>
          </div>
        )}

        {/* LOCKED VIEW: Excerpt + Paywall */}
        {isLocked ? (
          <div className="relative">
            {/* Excerpt / Intro */}
            <div className="mb-6">
              {(blog.description || blog.excerpt) && (
                <p className="text-xl leading-relaxed font-medium text-slate-700">
                  {formatText(blog.description || blog.excerpt || '')}
                </p>
              )}
            </div>

            {/* Faded Content Preview (Fake Lines) */}
            <div className="space-y-4 opacity-30 blur-[2px] select-none">
              <div className="h-4 w-full rounded bg-slate-800"></div>
              <div className="h-4 w-5/6 rounded bg-slate-800"></div>
              <div className="h-4 w-4/6 rounded bg-slate-800"></div>
              <div className="h-32 w-full rounded-xl bg-slate-200"></div>
              <div className="h-4 w-full rounded bg-slate-800"></div>
            </div>

            {/* Paywall Overlay */}
            <div className="absolute inset-x-0 top-20 bottom-0 flex flex-col items-center justify-end bg-gradient-to-b from-white/0 via-white/80 to-white pb-10">
              <div className="animate-in fade-in zoom-in-95 mt-10 max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-2xl duration-700">
                <div className="mb-4 flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-900 shadow-lg">
                    <Lock className="h-8 w-8 text-yellow-400" />
                  </div>
                </div>
                <h3 className="mb-2 text-2xl font-black text-slate-900">Read the Full Strategy</h3>
                <p className="mb-6 text-slate-600">
                  Unlock this premium article and get full access to UPSC blogs, expert test
                  series, and detailed performance analytics.
                </p>
                <Button
                  size="lg"
                  className="w-full rounded-xl bg-emerald-600 font-bold hover:bg-emerald-700"
                  asChild
                >
                  <Link href="/pricing">
                    Unlock Now <Crown className="ml-2 h-4 w-4 fill-emerald-200 text-emerald-200" />
                  </Link>
                </Button>
                <p className="mt-4 text-xs font-semibold text-slate-400">
                  Already a member?{' '}
                  <Link href="/login" className="text-emerald-600 hover:underline">
                    Login here
                  </Link>
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Description — larger with more space */}
            {/* If we have a structured introduction, show that. If not, fallback to blog.description if it's not already shown in hero (usually description is distinct) */}
            {(blog.description || introduction) && (
              <div className="mb-8 border-b border-slate-100 pb-6">
                {blog.description && !introduction && (
                  <p className="mb-4 text-lg leading-relaxed font-medium text-slate-600">
                    {blog.description}
                  </p>
                )}
                {introduction && (
                  <div className="text-lg leading-relaxed text-slate-700">
                    {formatText(introduction)}
                  </div>
                )}
              </div>
            )}

            {/* Render JSON Content */}
            <div className="max-w-none">{renderContent(blocks)}</div>

            {/* Conclusion */}
            {conclusion && (
              <div className="mt-8 mb-6 rounded-xl border border-slate-100 bg-slate-50 p-6">
                <h3 className="mb-3 text-lg font-bold text-slate-900">Conclusion</h3>
                <p className="text-base leading-relaxed text-slate-700">{formatText(conclusion)}</p>
              </div>
            )}

            {/* Footer */}
            <div className="mt-12 flex items-center justify-between border-t border-slate-100 pt-6">
              <div>
                <p className="text-xs font-medium text-slate-400">Published by</p>
                <p className="text-sm font-bold text-slate-800">UPSC 2026</p>
              </div>
            </div>
          </>
        )}
      </article>
    </div>
  );
}

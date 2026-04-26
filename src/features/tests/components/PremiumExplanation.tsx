'use client';

import React from 'react';
import { CheckCircle2, Lightbulb, Brain, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface PremiumExplanationProps {
  explanation: string;
  explanationEn?: string | null;
  language?: 'hi' | 'en';
  /** When true, layout adjusts for tighter spaces */
  compact?: boolean;
  /** Adapts text colors for dark backgrounds */
  darkMode?: boolean;
}

import { useSettingsStore } from '@/store/useSettingsStore';

export const PremiumExplanation: React.FC<PremiumExplanationProps> = ({
  explanation,
  explanationEn,
  language,
  compact = false,
  darkMode = false,
}) => {
  const storeLanguage = useSettingsStore((state) => state.language);
  const finalLanguage = language || storeLanguage;

  const textToParse =
    (finalLanguage === 'en' && explanationEn ? explanationEn : explanation) || '';

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.12 },
    },
  };

  const item = {
    hidden: { opacity: 0, x: -12 },
    show: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] } },
  };

  // Helper for Section Labels
  const getLabels = (key: string) => {
    const labels: Record<string, { en: string; hi: string }> = {
      verdict: { en: 'VERDICT', hi: 'फैसला' },
      pillar: { en: 'CORE PILLAR', hi: 'कोर पिलर' },
      logic: { en: 'LOGIC PATH', hi: 'लॉजिक पाथ' },
      trap: { en: 'TRAP WATCH', hi: 'ट्रैप वॉच' },
    };
    return labels[key] || { en: '', hi: '' };
  };

  const splitIntoSentences = (text: string, isHi: boolean) => {
    const t = text.replace(/\s+/g, ' ').trim();
    if (!t) return [];
    // Break at sentence end punctuation for scanability.
    // English: . ! ?   Hindi: । ! ?
    const parts = isHi
      ? t
          .split(/(?<=[।!?])\s+/g)
          .map((s) => s.trim())
          .filter(Boolean)
      : t
          .split(/(?<=[.!?])\s+(?=[A-Z0-9(])/g)
          .map((s) => s.trim())
          .filter(Boolean);
    return parts.length ? parts : [t];
  };

  const renderReadableText = (text: string) => {
    const rawLines = text
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    // If already multi-line, keep paragraphs.
    if (rawLines.length >= 2) {
      return (
        <div>
          {rawLines.map((line, i) => (
            <p key={i} className="mb-4 last:mb-0">
              {line}
            </p>
          ))}
        </div>
      );
    }

    // For longer single-line content, split into sentence chunks.
    const sentences = splitIntoSentences(text, finalLanguage === 'hi');
    if (sentences.length <= 2 && text.length < 220) {
      return (
        <p className="mb-0 leading-relaxed">
          {text.trim()}
        </p>
      );
    }

    return (
      <div className="space-y-3">
        {sentences.map((s, i) => (
          <p key={i} className="leading-relaxed">
            {s}
          </p>
        ))}
      </div>
    );
  };

  const renderJSONExplanation = (jsonStr: string) => {
    try {
      const trimmed = jsonStr.trim();
      if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return null;
      const data = JSON.parse(trimmed);

      const analysisItems = [
        {
          key: 'verdict',
          label: finalLanguage === 'hi' ? getLabels('verdict').hi : getLabels('verdict').en,
          icon: <CheckCircle2 size={18} className="stroke-[2.5]" />,
          color: 'emerald',
          // Map from "Conceptual Core" style content to VERDICT block
          content: data.core_concept || data.coreConcept || data.conceptual_core || data.verdict || data.quick_verdict,
        },
        {
          key: 'pillar',
          label: finalLanguage === 'hi' ? getLabels('pillar').hi : getLabels('pillar').en,
          icon: <Lightbulb size={18} className="stroke-[2.5]" />,
          color: 'amber',
          // Map from "Inter-disciplinary Link" style content to CORE PILLAR block
          content: data.interdisciplinary_link || data.interdisciplinaryLink || data.inter_link || data.interLink || data.core_pillar,
        },
        {
          key: 'logic',
          label: finalLanguage === 'hi' ? getLabels('logic').hi : getLabels('logic').en,
          icon: <Brain size={18} className="stroke-[2.5]" />,
          color: 'indigo',
          // Map from "Veteran's Wisdom & Pattern" style content to LOGIC PATH block
          content: data.veteran_wisdom || data.veteranWisdom || data.wisdom || data.logic_path,
        },
        {
          key: 'trap',
          label: finalLanguage === 'hi' ? getLabels('trap').hi : getLabels('trap').en,
          icon: <AlertTriangle size={18} className="stroke-[2.5]" />,
          color: 'rose',
          // Map from "Tips, Tricks & Elimination" style content to TRAP WATCH block
          content: data.tips_tricks || data.tipsTricks || data.tricks || data.trap_watch || data.trap_alert,
        },
      ].filter((item) => item.content);

      if (analysisItems.length === 0) return null;

      return (
        <div className="flex flex-col gap-12 py-6">
          {analysisItems.map((ai) => (
            <motion.div
              key={ai.key}
              variants={item}
              className={cn('relative transition-all', compact ? 'pl-6' : 'pl-10')}
            >
              <div
                className={cn(
                  'absolute left-0 top-0.5 bottom-0.5 w-[4px] rounded-full',
                  ai.color === 'emerald' && 'bg-emerald-500/60',
                  ai.color === 'amber' && 'bg-amber-500/60',
                  ai.color === 'indigo' && 'bg-indigo-500/60',
                  ai.color === 'rose' && 'bg-rose-500/60'
                )}
              />

              <div className="mb-4 flex items-center gap-3">
                <div
                  className={cn(
                    ai.color === 'emerald' && 'text-emerald-500',
                    ai.color === 'amber' && 'text-amber-500',
                    ai.color === 'indigo' && 'text-indigo-500',
                    ai.color === 'rose' && 'text-rose-500'
                  )}
                >
                  {ai.icon}
                </div>
                <h4
                  className={cn(
                    'text-[12px] font-black tracking-[0.25em] uppercase',
                    ai.color === 'emerald' && 'text-emerald-600/90',
                    ai.color === 'amber' && 'text-amber-600/90',
                    ai.color === 'indigo' && 'text-indigo-600/90',
                    ai.color === 'rose' && 'text-rose-600/90'
                  )}
                >
                  {ai.label}
                </h4>
              </div>

              <div
                className={cn(
                  'text-[17px] leading-[1.75] font-medium tracking-tight sm:text-[18px]',
                  darkMode ? 'text-slate-200' : 'text-slate-900'
                )}
              >
                {typeof ai.content === 'string' ? renderReadableText(ai.content) : ai.content}
              </div>
            </motion.div>
          ))}
        </div>
      );
    } catch {
      return null;
    }
  };

  const jsonExplanation = renderJSONExplanation(textToParse);
  if (jsonExplanation)
    return (
      <motion.div variants={container} initial="hidden" animate="show">
        {jsonExplanation}
      </motion.div>
    );

  // Fallback for Text-based extraction
  const parseNumberedBlocks = (text: string) => {
    if (!text) return null;

    // Matches: "1. ✅ **Conceptual Core**: ..." (emoji/bold optional)
    const re = /(?:^|\n)\s*(\d+)\.\s*([^\n:]{2,80}?)\s*:\s*/g;
    const matches = Array.from(text.matchAll(re));
    if (matches.length === 0) return null;

    const normalizeHeading = (h: string) =>
      h
        .replace(/[*_`]/g, '')
        .replace(/[✅🔄🧠⚡💡🌀]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();

    const pickKey = (heading: string) => {
      const h = normalizeHeading(heading);
      if (h.includes('conceptual core')) return 'conceptualCore';
      if (h.includes('inter-disciplinary link') || h.includes('interdisciplinary link')) return 'interLink';
      if (h.includes("veteran's wisdom") || h.includes('veterans wisdom')) return 'veteranWisdom';
      if (h.includes('tips, tricks') || h.includes('tips tricks')) return 'tipsTricks';
      return null;
    };

    const blocks: Record<string, string> = {};
    for (let i = 0; i < matches.length; i++) {
      const m = matches[i];
      const heading = (m?.[2] || '').trim();
      const key = pickKey(heading);
      if (!key) continue;

      const start = (m.index ?? 0) + m[0].length;
      const end = i + 1 < matches.length ? (matches[i + 1].index ?? text.length) : text.length;
      const content = text.slice(start, end).trim();
      if (content) blocks[key] = content;
    }

    if (Object.keys(blocks).length === 0) return null;
    return blocks as Partial<{
      conceptualCore: string;
      interLink: string;
      veteranWisdom: string;
      tipsTricks: string;
    }>;
  };

  let coreLogic = textToParse;
  let firstMarkerIndex = coreLogic.length;
  const firstNumbered = coreLogic.search(/(?:^|\n)\s*\d+\.\s*[^\n:]{2,80}?\s*:\s*/);
  if (firstNumbered !== -1) firstMarkerIndex = firstNumbered;
  coreLogic = coreLogic.slice(0, firstMarkerIndex).trim();

  const cleanContent = (s: string | null) => {
    if (!s) return null;
    return s
      .replace(/^\s*\d+\.\s*/, '') // remove "1. " numbering if present
      .replace(/^\s*[✅🔄🧠⚡💡🌀]\s*/, '')
      .replace(/^\s*\*\*.*?\*\*\s*:\s*/i, '') // remove "**Heading**:" at line start
      .replace(/^(\s*(\(High Value\)|\(Mnemonic\)|\(Elimination\))?\s*)?(\*\*|:)?\s*:?\s*/, '')
      .trim();
  };

  const numbered = parseNumberedBlocks(textToParse);
  const sections = {
    logic: cleanContent(coreLogic),
    conceptualCore: cleanContent(numbered?.conceptualCore ?? null),
    interLink: cleanContent(numbered?.interLink ?? null),
    veteranWisdom: cleanContent(numbered?.veteranWisdom ?? null),
    tipsTricks: cleanContent(numbered?.tipsTricks ?? null),
  };

  const renderSection = (title: string, content: string | null, color: string, icon: React.ReactNode) => {
    if (!content) return null;
    return (
      <motion.div variants={item} className={cn('relative pl-10', compact && 'pl-6')}>
        <div className={cn("absolute left-0 top-1 bottom-1 w-[4px] rounded-full",
          color === 'emerald' && 'bg-emerald-500/60',
          color === 'amber' && 'bg-amber-500/60',
          color === 'indigo' && 'bg-indigo-500/60',
          color === 'rose' && 'bg-rose-500/60'
        )} />
        <div className="mb-4 flex items-center gap-3">
          <div className={cn(
            color === 'emerald' && 'text-emerald-500',
            color === 'amber' && 'text-amber-500',
            color === 'indigo' && 'text-indigo-500',
            color === 'rose' && 'text-rose-500'
          )}>
            {icon}
          </div>
          <h4 className={cn('text-[12px] font-black tracking-[0.25em] uppercase',
            color === 'emerald' && 'text-emerald-600/90',
            color === 'amber' && 'text-amber-600/90',
            color === 'indigo' && 'text-indigo-600/90',
            color === 'rose' && 'text-rose-600/90'
          )}>
            {title}
          </h4>
        </div>
        <div
          className={cn(
            'text-[17px] leading-[1.75] font-medium tracking-tight sm:text-[18px]',
            darkMode ? 'text-slate-200' : 'text-slate-900'
          )}
        >
          {renderReadableText(content)}
        </div>
      </motion.div>
    );
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      <div className="flex flex-col gap-12 py-8">
        {renderSection(
          finalLanguage === 'hi' ? getLabels('verdict').hi : getLabels('verdict').en,
          sections.conceptualCore || sections.logic,
          'emerald',
          <CheckCircle2 size={18} className="stroke-[2.5]" />
        )}
        {renderSection(
          finalLanguage === 'hi' ? getLabels('pillar').hi : getLabels('pillar').en,
          sections.interLink,
          'amber',
          <Lightbulb size={18} className="stroke-[2.5]" />
        )}
        {renderSection(
          finalLanguage === 'hi' ? getLabels('logic').hi : getLabels('logic').en,
          sections.veteranWisdom,
          'indigo',
          <Brain size={18} className="stroke-[2.5]" />
        )}
        {renderSection(
          finalLanguage === 'hi' ? getLabels('trap').hi : getLabels('trap').en,
          sections.tipsTricks,
          'rose',
          <AlertTriangle size={18} className="stroke-[2.5]" />
        )}
      </div>
    </motion.div>
  );
};

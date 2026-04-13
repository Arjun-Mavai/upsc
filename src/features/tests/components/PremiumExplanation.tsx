'use client';

import React from 'react';
import { CheckCircle2, Lightbulb, Brain, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface PremiumExplanationProps {
  explanation: string;
  explanationEn?: string | null;
  language?: 'hi' | 'en';
  /** When true, Core Logic renders without a border-box — plain text, more space on small screens */
  compact?: boolean;
  /** Adapts text colors for dark backgrounds (e.g. PYQ Analysis pages) */
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

  const DEFAULT_MSG =
    finalLanguage === 'hi'
      ? 'यह प्रश्न सीधे अवधारणात्मक (Conceptual) है। यदि यह गलत हुआ है, तो कृपया संबंधित विषय के मूल तथ्यों (Basics) को दोहराएं।'
      : 'This question addresses core concepts. If answered incorrectly, please review the fundamental facts of this topic.';

  const textToParse =
    (finalLanguage === 'en' && explanationEn ? explanationEn : explanation) || DEFAULT_MSG;

  // 1. Motion Variants (At Top to avoid use-before-declaration)
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
  };

  // 2. JSON DETECTION & RENDERING
  const renderJSONExplanation = (jsonStr: string) => {
    try {
      const trimmed = jsonStr.trim();
      if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return null;
      const data = JSON.parse(trimmed);

      const analysisItems = [
        {
          key: 'verdict',
          label: finalLanguage === 'hi' ? 'फैसला (Verdict)' : 'Verdict',
          icon: <CheckCircle2 size={16} className="text-emerald-500" />,
          color: 'emerald',
          content: data.verdict,
        },
        {
          key: 'core_concept',
          label: finalLanguage === 'hi' ? 'मुख्य अवधारणा (Core Concept)' : 'Core Pillar',
          icon: <Lightbulb size={16} className="text-amber-500" />,
          color: 'amber',
          content: data.core_concept,
        },
        {
          key: 'elimination_wisdom',
          label: finalLanguage === 'hi' ? 'एलिमिनेशन लॉजिक (Elimination)' : 'Logic Path',
          icon: <Brain size={16} className="text-indigo-500" />,
          color: 'indigo',
          content: data.elimination_wisdom,
        },
        {
          key: 'trap_alerts',
          label: finalLanguage === 'hi' ? 'ट्रैप अलर्ट (Trap Alert)' : 'Trap Watch',
          icon: <AlertTriangle size={16} className="text-rose-500" />,
          color: 'rose',
          content: data.trap_alerts,
        },
      ].filter((item) => item.content);

      if (analysisItems.length === 0) return null;

      return (
        <div className="space-y-4">
          {analysisItems.map((ai) => (
            <div
              key={ai.key}
              className={cn(
                'group relative overflow-hidden transition-all duration-300',
                compact
                  ? 'mb-6 last:mb-0 px-0.5'
                  : cn(
                      'rounded-2xl border p-4',
                      ai.color === 'emerald' &&
                        'border-emerald-500/20 bg-emerald-500/[0.03] hover:bg-emerald-500/[0.05]',
                      ai.color === 'amber' &&
                        'border-amber-500/20 bg-amber-500/[0.03] hover:bg-amber-500/[0.05]',
                      ai.color === 'indigo' &&
                        'border-indigo-500/20 bg-indigo-500/[0.03] hover:bg-indigo-500/[0.05]',
                      ai.color === 'rose' &&
                        'border-rose-500/20 bg-rose-500/[0.03] hover:bg-rose-500/[0.05]'
                    )
              )}
            >
              {compact && (
                <div 
                  className={cn(
                    "absolute top-0 bottom-0 left-0 w-1 rounded-full",
                    ai.color === 'emerald' && 'bg-emerald-500/40',
                    ai.color === 'amber' && 'bg-amber-500/40',
                    ai.color === 'indigo' && 'bg-indigo-500/40',
                    ai.color === 'rose' && 'bg-rose-500/40'
                  )} 
                />
              )}
              <div className="mb-2 flex items-center gap-2.5">
                <div
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-lg sm:h-8 sm:w-8',
                    compact ? 'bg-transparent' : `bg-${ai.color}-500/10`
                  )}
                >
                  {ai.icon}
                </div>
                <h4
                  className={cn(
                    'text-[10px] font-black tracking-[0.2em] uppercase',
                    `text-${ai.color}-500`
                  )}
                >
                  {ai.label}
                </h4>
              </div>
              <div
                className={cn(
                  'text-[14px] leading-relaxed font-semibold tracking-tight sm:text-[15.5px]',
                  compact ? 'pl-4' : '',
                  darkMode ? 'text-slate-200' : 'text-slate-800'
                )}
              >
                {ai.key === 'elimination_wisdom' ? (
                  // Logic Path - Smart pattern detection for better readability
                  <div className={cn(
                    'text-[14px] leading-[1.8] font-medium space-y-2',
                    darkMode ? 'text-slate-200' : 'text-slate-800'
                  )}>
                    {(() => {
                      const content = ai.content;
                      
                      // Pattern 1: Numbered lists (1. 2. 3. etc.) - English & Hindi
                      const numberedPattern = /(\d+\.\s*)/g;
                      const numberedMatches = [...content.matchAll(numberedPattern)];
                      
                      if (numberedMatches.length >= 2) {
                        const parts = content.split(numberedPattern).filter(Boolean);
                        const renderedParts = [];
                        
                        for (let i = 0; i < parts.length; i++) {
                          if (/^\d+\.\s*$/.test(parts[i])) {
                            // This is a number marker, combine with next part
                            const marker = parts[i].trim();
                            const text = parts[i + 1] || '';
                            if (text.trim()) {
                              // Remove ending dot if it's followed by next number
                              let cleanText = text.trim();
                              if (i + 2 < parts.length && /^\d+\.\s*$/.test(parts[i + 2])) {
                                cleanText = cleanText.replace(/\.\s*$/, '');
                              }
                              
                              renderedParts.push(
                                <div key={i} className="flex items-start gap-2 py-1">
                                  <span className={cn(
                                    'shrink-0 text-xs font-bold px-2 py-1 rounded',
                                    darkMode ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-100 text-indigo-700'
                                  )}>
                                    {marker}
                                  </span>
                                  <span className="flex-1">{cleanText}</span>
                                </div>
                              );
                              i++; // Skip the text part as we've processed it
                            }
                          }
                        }
                        
                        if (renderedParts.length > 0) {
                          return <div className="space-y-1">{renderedParts}</div>;
                        }
                      }
                      
                      // Pattern 2: Letter patterns (A. B. C. or (A) (B) (C))
                      const letterPattern = /([A-Z][\.\)]\s*)/g;
                      const letterMatches = [...content.matchAll(letterPattern)];
                      
                      if (letterMatches.length >= 2) {
                        const parts = content.split(letterPattern).filter(Boolean);
                        const renderedParts = [];
                        
                        for (let i = 0; i < parts.length; i++) {
                          if (/^[A-Z][\.\)]\s*$/.test(parts[i])) {
                            const marker = parts[i].trim();
                            const text = parts[i + 1] || '';
                            if (text.trim()) {
                              let cleanText = text.trim();
                              if (i + 2 < parts.length && /^[A-Z][\.\)]\s*$/.test(parts[i + 2])) {
                                cleanText = cleanText.replace(/\.\s*$/, '');
                              }
                              
                              renderedParts.push(
                                <div key={i} className="flex items-start gap-2 py-1">
                                  <span className={cn(
                                    'shrink-0 text-xs font-bold px-2 py-1 rounded',
                                    darkMode ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-100 text-indigo-700'
                                  )}>
                                    {marker}
                                  </span>
                                  <span className="flex-1">{cleanText}</span>
                                </div>
                              );
                              i++;
                            }
                          }
                        }
                        
                        if (renderedParts.length > 0) {
                          return <div className="space-y-1">{renderedParts}</div>;
                        }
                      }
                      
                      // Pattern 3: Pipe-separated points (Hindi/English)
                      if (content.includes('|') && content.split('|').length >= 2) {
                        const parts = content.split('|').map((part: string) => part.trim()).filter(Boolean);
                        if (parts.length >= 2) {
                          return (
                            <div className="space-y-2">
                              {parts.map((part: string, idx: number) => (
                                <div key={idx} className="flex items-start gap-2 py-1">
                                  <span className={cn(
                                    'shrink-0 text-xs font-bold px-2 py-1 rounded',
                                    darkMode ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-100 text-indigo-700'
                                  )}>
                                    {idx + 1}
                                  </span>
                                  <span className="flex-1">{part}</span>
                                </div>
                              ))}
                            </div>
                          );
                        }
                      }
                      
                      // Pattern 4: Arrow flow (→)
                      if (content.includes('→')) {
                        const steps = content.split('→').map((step: string) => step.trim()).filter(Boolean);
                        if (steps.length >= 2) {
                          return (
                            <div className="flex flex-wrap gap-2 items-center">
                              {steps.map((step: string, idx: number) => (
                                <div key={idx} className="flex items-center">
                                  <span className={cn(
                                    'px-3 py-2 rounded-lg text-sm font-medium border',
                                    darkMode 
                                      ? 'bg-indigo-500/20 text-indigo-200 border-indigo-500/30'
                                      : 'bg-indigo-100 text-indigo-800 border-indigo-200'
                                  )}>
                                    {step}
                                  </span>
                                  {idx < steps.length - 1 && (
                                    <span className={cn(
                                      'mx-2 text-lg font-bold',
                                      darkMode ? 'text-indigo-400' : 'text-indigo-600'
                                    )}>→</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          );
                        }
                      }
                      
                      // Pattern 5: Sentence-based breakdown (detect multiple sentences)
                      const sentences = content.split(/(?<=[.।!?])\s+/).filter((s: string) => s.trim().length > 10);
                      if (sentences.length >= 3) {
                        return (
                          <div className="space-y-2">
                            {sentences.map((sentence: string, idx: number) => (
                              <div key={idx} className="flex items-start gap-2 py-1">
                                <span className={cn(
                                  'shrink-0 w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold',
                                  darkMode ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-100 text-indigo-700'
                                )}>
                                  {idx + 1}
                                </span>
                                <span className="flex-1">{sentence.trim()}</span>
                              </div>
                            ))}
                          </div>
                        );
                      }
                      
                      // Default: Just return content as-is
                      return content;
                    })()}
                  </div>
                ) : (
                  ai.content
                )}
              </div>
            </div>
          ))}
        </div>
      );
    } catch (e) {
      return null;
    }
  };

  const jsonExplanation = renderJSONExplanation(textToParse);
  if (jsonExplanation)
    return (
      <motion.div variants={container} initial="hidden" animate="show" className="pt-2">
        {jsonExplanation}
      </motion.div>
    );

  // 3. TEXT-BASED EXTRACTION (FALLBACK)
  const extractSection = (text: string, marker: string, nextMarkers: string[]) => {
    if (!text) return null;
    const startIndex = text.indexOf(marker);
    if (startIndex === -1) return null;

    const content = text.slice(startIndex + marker.length);
    let minIndex = content.length;
    nextMarkers.forEach((nm) => {
      const idx = content.indexOf(nm);
      if (idx !== -1 && idx < minIndex) {
        minIndex = idx;
      }
    });

    return content.slice(0, minIndex).trim();
  };

  const MARKERS = {
    FACT: '**💡 Exam Fact',
    TIP: '**🧠 Memory Tip',
    SCAM: '**🚫 Scam Alert',
  };

  const examFact = extractSection(textToParse, MARKERS.FACT, [MARKERS.TIP, MARKERS.SCAM]);
  const memoryTip = extractSection(textToParse, MARKERS.TIP, [MARKERS.FACT, MARKERS.SCAM]);
  const scamAlert = extractSection(textToParse, MARKERS.SCAM, [MARKERS.FACT, MARKERS.TIP]);

  let coreLogic = textToParse;
  const allMarkers = [MARKERS.FACT, MARKERS.TIP, MARKERS.SCAM];
  let firstMarkerIndex = coreLogic.length;

  allMarkers.forEach((m) => {
    const idx = coreLogic.indexOf(m);
    if (idx !== -1 && idx < firstMarkerIndex) {
      firstMarkerIndex = idx;
    }
  });

  coreLogic = coreLogic.slice(0, firstMarkerIndex).trim();

  const cleanContent = (s: string | null) => {
    if (!s) return null;
    return s
      .replace(/^(\s*(\(High Value\)|\(Mnemonic\)|\(Elimination\))?\s*)?(\*\*|:)?\s*:?\s*/, '')
      .replace(/#{1,6}\s*/g, '')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/---+/g, '')
      .replace(/^\s*[-*]\s+/gm, '• ')
      .trim();
  };

  const sections = {
    logic: coreLogic,
    fact: cleanContent(examFact),
    tip: cleanContent(memoryTip),
    scam: cleanContent(scamAlert),
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-3.5 text-left font-sans"
    >
      {/* 1. Core Logic */}
      {sections.logic && (
        <motion.div variants={item}>
          {compact ? (
            /* Compact mode: no border-box — full-width plain text with generous line height */
            <div
              className={cn(
                'space-y-4 text-[15px] leading-[1.8] font-medium tracking-tight sm:text-[16px]',
                darkMode ? 'text-slate-300' : 'text-slate-800'
              )}
            >
              {sections.logic
                ?.split('\n')
                .filter((l) => l.trim())
                .map((line, i) => (
                  <p key={i} className="relative pl-0">
                    {line.trim().startsWith('•') || line.trim().startsWith('-') ? (
                      <span className="flex gap-3">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500/50" />
                        <span>{cleanContent(line)}</span>
                      </span>
                    ) : (
                      cleanContent(line)
                    )}
                  </p>
                ))}
            </div>
          ) : (
            /* Premium Default: Gradient border and subtle highlight */
            <div className="group relative overflow-hidden rounded-2xl border border-white/[0.03] bg-white/[0.02] p-5 sm:p-6">
              {/* Left Accent Gradient */}
              <div className="absolute top-0 bottom-0 left-0 w-[3px] bg-gradient-to-b from-emerald-500 via-teal-400 to-transparent opacity-80" />

              <h4 className="mb-4 flex items-center gap-2 text-[11px] font-black tracking-[0.2em] text-emerald-500 uppercase">
                <Brain size={14} className="shrink-0" />{' '}
                {finalLanguage === 'hi' ? 'फैसला एवं तर्क (Verdict)' : 'Verdict & Logic Path'}
              </h4>

              <div
                className={cn(
                  'space-y-4 text-[15px] leading-[1.8] font-medium tracking-tight sm:text-[16.5px]',
                  darkMode ? 'text-slate-200' : 'text-slate-900'
                )}
              >
                {sections.logic
                  ?.split('\n')
                  .filter((l) => l.trim())
                  .map((line, i) => (
                    <p key={i} className="relative">
                      {line.trim().startsWith('•') || line.trim().startsWith('-') ? (
                        <span className="flex gap-4 rounded-xl bg-white/[0.03] p-3 px-4 transition-colors hover:bg-white/[0.05]">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                          <span>{cleanContent(line)}</span>
                        </span>
                      ) : (
                        <span className="block px-1">{cleanContent(line)}</span>
                      )}
                    </p>
                  ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* 2. Exam Fact */}
      {sections.fact && (
        <motion.div variants={item} className="border-l-2 border-slate-700 pl-3">
          <h4
            className={cn(
              'mb-1 flex items-center gap-1.5 text-[10px] font-black tracking-widest uppercase',
              darkMode ? 'text-slate-400' : 'text-slate-600'
            )}
          >
            <Lightbulb size={12} className="shrink-0" />{' '}
            {finalLanguage === 'hi' ? 'एग्जाम फैक्ट' : 'Exam Fact'}
          </h4>
          <p
            className={cn(
              'text-[14px] leading-relaxed font-bold tracking-tight sm:text-[15px]',
              darkMode
                ? 'text-slate-300 [text-shadow:none]'
                : 'text-slate-800 [text-shadow:1px_1px_2px_rgba(0,0,0,0.05)]'
            )}
          >
            {sections.fact}
          </p>
        </motion.div>
      )}

      {/* 3. Memory Tip */}
      {sections.tip && (
        <motion.div variants={item} className="border-l-2 border-amber-500 pl-3">
          <h4 className="mb-1 flex items-center gap-1.5 text-[10px] font-black tracking-widest text-amber-600 uppercase">
            <Brain size={12} className="shrink-0" />{' '}
            {finalLanguage === 'hi' ? 'मेमोरी टिप' : 'Memory Tip'}
          </h4>
          <p
            className={cn(
              'rounded-xl border px-3 py-2 text-[14px] leading-relaxed font-bold tracking-tight italic sm:text-[15px]',
              darkMode
                ? 'border-amber-500/20 bg-amber-500/10 text-amber-200/90 [text-shadow:none]'
                : 'border-amber-100/50 bg-amber-50/40 text-slate-700 [text-shadow:1px_1px_2px_rgba(0,0,0,0.05)]'
            )}
          >
            {sections.tip}
          </p>
        </motion.div>
      )}

      {/* 4. Scam Alert */}
      {sections.scam && (
        <motion.div variants={item} className="border-l-2 border-red-500 pl-3">
          <h4 className="mb-1 flex items-center gap-1.5 text-[10px] font-black tracking-widest text-red-600 uppercase">
            <AlertTriangle size={12} className="shrink-0" />{' '}
            {finalLanguage === 'hi' ? 'स्कैम अलर्ट' : 'Scam Alert'}
          </h4>
          <p
            className={cn(
              'text-[14px] leading-relaxed font-bold tracking-tight sm:text-[15px]',
              darkMode
                ? 'text-slate-300 [text-shadow:none]'
                : 'text-slate-800 [text-shadow:1px_1px_2px_rgba(0,0,0,0.05)]'
            )}
          >
            {sections.scam}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

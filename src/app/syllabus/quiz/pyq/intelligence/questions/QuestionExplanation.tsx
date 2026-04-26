'use client';

import { motion } from 'framer-motion';
import { Brain, Sparkles, CheckCircle2, AlertTriangle, Lightbulb } from 'lucide-react';
import { PremiumExplanationCard } from '@/components/ui/PremiumExplanationCard';
import { cn } from '@/lib/utils';

interface QuestionExplanationProps {
  explanation?: string;
  explanationEn?: string;
  isHindi: boolean;
  compact?: boolean;
}

export default function QuestionExplanation({
  explanation,
  explanationEn,
  isHindi,
  compact = false,
}: QuestionExplanationProps) {
  const rawText = isHindi ? explanation : explanationEn || explanation;

  if (!rawText) return null;

  // Try parsing as Premium Wisdom JSON format first
  let parsedJson = null;
  try {
    const parsed = JSON.parse(rawText);
    if (parsed && typeof parsed === 'object' && ('quick_verdict' in parsed || 'core_concept' in parsed || 'elimination_wisdom' in parsed || 'verdict' in parsed)) {
      parsedJson = parsed;
    }
  } catch {
    // Not valid JSON
  }

  if (parsedJson) {
    return <PremiumExplanationCard explanationRaw={rawText} language={isHindi ? 'hi' : 'en'} />;
  }

  const textToParse = rawText;

  // Extract sections based on markers
  const extractSection = (content: string, marker: string, otherMarkers: string[]) => {
    const markerIndex = content.indexOf(marker);
    if (markerIndex === -1) return null;

    let endIndex = content.length;
    otherMarkers.forEach((m) => {
      const idx = content.indexOf(m, markerIndex + marker.length);
      if (idx !== -1 && idx < endIndex) {
        endIndex = idx;
      }
    });

    const extracted = content.slice(markerIndex + marker.length, endIndex).trim();
    return extracted || null;
  };

  const MARKERS = {
    CORE: '✅ Conceptual Core',
    PILLAR: '💡 Core Pillar',
    LOGIC: '🧠 Logic Path',
    TRAP: '⚠️ Trap Watch',
    FACT: '**💡 Exam Fact',
  };

  const conceptualCore = extractSection(textToParse, MARKERS.CORE, Object.values(MARKERS).filter(m => m !== MARKERS.CORE));
  const corePillar = extractSection(textToParse, MARKERS.PILLAR, Object.values(MARKERS).filter(m => m !== MARKERS.PILLAR));
  const logicPath = extractSection(textToParse, MARKERS.LOGIC, Object.values(MARKERS).filter(m => m !== MARKERS.LOGIC));
  const trapWatch = extractSection(textToParse, MARKERS.TRAP, Object.values(MARKERS).filter(m => m !== MARKERS.TRAP));
  const examFact = extractSection(textToParse, MARKERS.FACT, Object.values(MARKERS).filter(m => m !== MARKERS.FACT));

  // Extract leading text (often verdict-style)
  let coreLogic = textToParse;
  const allMarkers = Object.values(MARKERS);
  let firstMarkerIndex = coreLogic.length;
  allMarkers.forEach((m) => {
    const idx = coreLogic.indexOf(m);
    if (idx !== -1 && idx < firstMarkerIndex) firstMarkerIndex = idx;
  });
  coreLogic = coreLogic.slice(0, firstMarkerIndex).trim();

  const cleanContent = (s: string | null) => {
    if (!s) return null;
    return s.replace(/^(\s*(\(High Value\)|\(Mnemonic\)|\(Elimination\))?\s*)?(\*\*|:)?\s*:?\s*/, '').trim();
  };

  const sections = {
    logic: cleanContent(coreLogic),
    conceptualCore: cleanContent(conceptualCore),
    corePillar: cleanContent(corePillar),
    logicPath: cleanContent(logicPath),
    trapWatch: cleanContent(trapWatch),
    fact: cleanContent(examFact),
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const item = {
    hidden: { opacity: 0, x: -10 },
    show: { opacity: 1, x: 0 },
  };

  const renderSection = (title: string, content: string | null, color: 'emerald' | 'amber' | 'indigo' | 'rose', icon: React.ReactNode) => {
    if (!content) return null;
    return (
      <motion.div
        variants={item}
        className={cn(
          'group relative pl-10 transition-all duration-300',
          compact && 'pl-6'
        )}
      >
        <div 
          className={cn(
            "absolute left-0 top-1 bottom-1 w-[4px] rounded-full transition-all duration-300",
            color === 'emerald' && 'bg-emerald-500/60',
            color === 'amber' && 'bg-amber-500/60',
            color === 'indigo' && 'bg-indigo-500/60',
            color === 'rose' && 'bg-rose-500/60'
          )} 
        />
        <div className="mb-4 flex items-center gap-3">
          <div className={cn(
            color === 'emerald' && 'text-emerald-400',
            color === 'amber' && 'text-amber-400',
            color === 'indigo' && 'text-indigo-400',
            color === 'rose' && 'text-rose-400'
          )}>
            {icon}
          </div>
          <h4 className={cn(
            'text-[12px] font-black tracking-[0.25em] uppercase',
            color === 'emerald' && 'text-emerald-500/90',
            color === 'amber' && 'text-amber-500/90',
            color === 'indigo' && 'text-indigo-500/90',
            color === 'rose' && 'text-rose-500/90'
          )}>
            {title}
          </h4>
        </div>
        <div className="text-[17px] leading-[1.7] font-medium text-slate-200 tracking-tight sm:text-[18px]">
          {content.split('\n').filter(Boolean).map((line, i) => <p key={i} className="mb-4 last:mb-0">{line}</p>)}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm backdrop-blur-xl dark:border-slate-800/50 dark:bg-slate-900/30 sm:p-10 dark:shadow-2xl">
      <motion.div variants={container} initial="hidden" animate="show" className="flex flex-col gap-12">
        {/* 1. Conceptual Core */}
        {renderSection(
          isHindi ? 'अवधारणात्मक कोर' : 'CONCEPTUAL CORE',
          sections.conceptualCore || sections.logic,
          'emerald',
          <CheckCircle2 size={18} className="stroke-[2.5]" />
        )}

        {/* 2. Core Pillar */}
        {renderSection(
          isHindi ? 'कोर पिलर' : 'CORE PILLAR',
          sections.corePillar,
          'amber',
          <Lightbulb size={18} className="stroke-[2.5]" />
        )}

        {/* 3. Logic Path */}
        {renderSection(
          isHindi ? 'लॉजिक पाथ' : 'LOGIC PATH',
          sections.logicPath,
          'indigo',
          <Brain size={18} className="stroke-[2.5]" />
        )}

        {/* 4. Trap Watch */}
        {renderSection(
          isHindi ? 'ट्रैप वॉच' : 'TRAP WATCH',
          sections.trapWatch,
          'rose',
          <AlertTriangle size={18} className="stroke-[2.5]" />
        )}

        {/* Exam Fact Footer */}
        {sections.fact && (
          <div className="flex items-center gap-3 px-2 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 border-t border-slate-200 pt-8 mt-4 dark:border-slate-800/50">
            <Sparkles className="h-4 w-4 text-amber-500/60 dark:text-amber-500/60" />
            <span>{isHindi ? 'एग्जाम फैक्ट' : 'Exam Fact'}: {sections.fact}</span>
          </div>
        )}
      </motion.div>
    </div>
  );
}

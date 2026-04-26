import React from 'react';
import { Lightbulb, CheckCircle2, BookOpen, Brain, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface WisdomExplanation {
  quick_verdict?: string;
  verdict?: string;
  core_concept?: string;
  core_pillar?: string;
  veteran_wisdom?: string;
  wisdom?: string;
  elimination_wisdom?: string[];
  logic_path?: string;
  tips_tricks?: string;
  interlinking?: string;
  interdisciplinary_link?: string;
  trap_alert?: string;
  trap_watch?: string;
  source_mapping?: string;
}

interface PremiumExplanationCardProps {
  explanationRaw?: string | null;
  language?: 'en' | 'hi';
}

function parseWisdom(raw?: string | null): WisdomExplanation | string | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') return parsed as WisdomExplanation;
    return raw;
  } catch {
    return raw;
  }
}

export function PremiumExplanationCard({ explanationRaw, language = 'en' }: PremiumExplanationCardProps) {
  const data = parseWisdom(explanationRaw);
  if (!data) return null;

  // Fallback for simple string explanations
  if (typeof data === 'string') {
    return (
      <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-3 text-emerald-500 font-bold">
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-[12px] tracking-[0.2em] uppercase">{language === 'hi' ? 'फैसला' : 'VERDICT'}</span>
        </div>
        <div className="text-[17px] leading-[1.7] text-slate-200 font-medium tracking-tight whitespace-pre-wrap">{data}</div>
      </div>
    );
  }

  const renderSection = (title: string, content: string | string[] | undefined, color: 'emerald' | 'amber' | 'indigo' | 'rose', icon: React.ReactNode) => {
    if (!content) return null;
    return (
      <div className="relative pl-10">
        <div className={cn("absolute left-0 top-0.5 bottom-0.5 w-[4px] rounded-full",
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

        <div className="text-[17px] leading-[1.75] font-medium text-slate-900 tracking-tight sm:text-[18px] dark:text-slate-200">
          {Array.isArray(content) ? (
            <ul className="space-y-4">
              {content.map((point, idx) => (
                <li key={idx} className="flex gap-3 items-start">
                  <span className="text-slate-500 font-mono mt-1 shrink-0 dark:text-slate-500">•</span>
                  <span className="leading-relaxed">{point}</span>
                </li>
              ))}
            </ul>
          ) : (
            content.split('\n').filter(Boolean).map((line, i) => <p key={i} className="mb-4 last:mb-0">{line}</p>)
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="mt-6 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm backdrop-blur-xl dark:border-slate-800/50 dark:bg-slate-900/30 sm:p-10 dark:shadow-2xl">
      <div className="flex flex-col gap-12">
      {/* 1. Emerald -> Conceptual Core (extendedData.verdict) */}
      {renderSection(
        language === 'hi' ? 'अवधारणात्मक कोर' : 'CONCEPTUAL CORE',
        data.verdict || data.quick_verdict,
        'emerald',
        <CheckCircle2 size={18} className="stroke-[2.5]" />
      )}

      {/* 2. Amber -> Core Pillar (extendedData.core_pillar) */}
      {renderSection(
        language === 'hi' ? 'कोर पिलर' : 'CORE PILLAR',
        data.core_pillar,
        'amber',
        <Lightbulb size={18} className="stroke-[2.5]" />
      )}

      {/* 3. Indigo -> Logic Path (extendedData.logic_path) */}
      {renderSection(
        language === 'hi' ? 'लॉजिक पाथ' : 'LOGIC PATH',
        data.logic_path,
        'indigo',
        <Brain size={18} className="stroke-[2.5]" />
      )}

      {/* 4. Rose -> Trap Watch (extendedData.trap_watch) */}
      {renderSection(
        language === 'hi' ? 'ट्रैप वॉच' : 'TRAP WATCH',
        data.trap_watch || data.trap_alert,
        'rose',
        <AlertTriangle size={18} className="stroke-[2.5]" />
      )}

      {data.source_mapping && (
        <div className="mt-4 flex items-center gap-3 px-2 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 border-t border-slate-200 pt-8 dark:border-slate-800">
          <BookOpen size={14} className="text-indigo-500/70 dark:text-indigo-400" />
          <span>Source: {data.source_mapping}</span>
        </div>
      )}
      </div>
    </div>
  );
}

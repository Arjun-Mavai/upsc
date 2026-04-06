import React from 'react';
import { Lightbulb, Target, AlertTriangle, Link as LinkIcon, BookOpen, BrainCircuit } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface WisdomExplanation {
  quick_verdict?: string;
  core_concept?: string;
  elimination_wisdom?: string[];
  interlinking?: string;
  trap_alert?: string;
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
    if (parsed && typeof parsed === 'object' && (parsed.quick_verdict || parsed.core_concept || parsed.elimination_wisdom)) {
      return parsed as WisdomExplanation;
    }
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
      <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-100/80 leading-relaxed shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
        <div className="flex items-center gap-2 mb-2 font-medium text-emerald-400">
          <Lightbulb className="w-4 h-4" />
          <span>{language === 'hi' ? 'विस्तृत विवरण' : 'Detailed Explanation'}</span>
        </div>
        <div className="whitespace-pre-wrap">{data}</div>
      </div>
    );
  }

  // Premium JSON Wisdom Rendering
  return (
    <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-indigo-500/30 bg-slate-900 overflow-hidden shadow-2xl">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/10 px-5 py-3 border-b border-indigo-500/20 flex items-center justify-between">
        <div className="flex items-center gap-2 text-indigo-300 font-semibold tracking-wide text-sm">
          <BrainCircuit className="w-5 h-5 text-indigo-400" />
          {language === 'hi' ? 'विशेषाज्ञ दृष्टिकोण' : 'EXPERT WISDOM'}
        </div>
      </div>

      <div className="p-5 flex flex-col gap-4">
        {/* Quick Verdict */}
        {data.quick_verdict && (
          <div className="flex items-start gap-3 bg-emerald-500/5 rounded-xl p-3 border border-emerald-500/20">
            <Target className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
                {language === 'hi' ? 'त्वरित निर्णय' : 'Quick Verdict'}
              </h4>
              <p className="text-sm text-slate-300 leading-relaxed">{data.quick_verdict}</p>
            </div>
          </div>
        )}

        {/* Core Concept */}
        {data.core_concept && (
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-amber-500/90 uppercase tracking-wider mb-1">
                {language === 'hi' ? 'मुख्य अवधारणा' : 'Core Concept'}
              </h4>
              <p className="text-sm text-slate-300 leading-relaxed">{data.core_concept}</p>
            </div>
          </div>
        )}

        {/* Elimination Wisdom */}
        {data.elimination_wisdom && data.elimination_wisdom.length > 0 && (
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              {language === 'hi' ? 'एलिमिनेशन तकनीक' : 'Elimination Logic'}
            </h4>
            <ul className="space-y-2">
              {data.elimination_wisdom.map((point, idx) => (
                <li key={idx} className="flex gap-2 text-sm text-slate-300 items-start">
                  <span className="text-rose-400 font-mono mt-0.5">✗</span>
                  <span className="leading-relaxed">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Trap Alert */}
        {data.trap_alert && (
          <div className="flex items-start gap-3 bg-rose-500/5 rounded-xl p-3 border border-rose-500/20">
            <AlertTriangle className="w-5 h-5 text-rose-400 mt-0.5 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-1">
                {language === 'hi' ? 'सतर्क रहें (ट्रैप)' : 'Examiner\'s Trap'}
              </h4>
              <p className="text-sm text-slate-300 leading-relaxed">{data.trap_alert}</p>
            </div>
          </div>
        )}

        {/* Footer (Interlinking & Source) */}
        {(data.interlinking || data.source_mapping) && (
          <div className="mt-2 pt-3 border-t border-slate-700/50 flex flex-col sm:flex-row gap-4 sm:items-center justify-between text-xs text-slate-400">
            {data.interlinking && (
              <div className="flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5" />
                <span>{data.interlinking}</span>
              </div>
            )}
            {data.source_mapping && (
              <div className="flex items-center gap-1.5 text-indigo-300/80">
                <BookOpen className="w-3.5 h-3.5" />
                <span>{data.source_mapping}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

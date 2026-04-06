import React from 'react';
import { cn } from '@/lib/utils';
import { Layers, ListOrdered, Navigation } from 'lucide-react';

export interface UPSCQuestionMetadata {
  layoutType: 'statements' | 'pairs' | 'table' | 'assertion_reason' | 'standard';
  contextStr?: string;
  listItems?: Array<{ id: string; text: string }>;
  tableHeaders?: string[];
  tableRows?: string[][];
  statementI?: string;
  statementII?: string;
  questionPrompt?: string;
}

interface UPSCPremiumQuestionCardProps {
  extendedData: UPSCQuestionMetadata | string | null;
  isHindi: boolean;
  isExpanded: boolean;
}

function parseExtendedData(data: UPSCQuestionMetadata | string | null): UPSCQuestionMetadata | null {
  if (!data) return null;
  if (typeof data === 'object') return data;
  try {
    const parsed = JSON.parse(data);
    if (parsed && typeof parsed === 'object' && parsed.layoutType) {
      return parsed as UPSCQuestionMetadata;
    }
  } catch {
    return null;
  }
  return null;
}

export function UPSCPremiumQuestionCard({ extendedData, isHindi, isExpanded }: UPSCPremiumQuestionCardProps) {
  const data = parseExtendedData(extendedData);

  if (!data) return null;

  return (
    <div className={cn("flex flex-col gap-4 mt-2", !isExpanded && "line-clamp-2 overflow-hidden relative mb-2")}>
      {/* Context String */}
      {data.contextStr && (
        <p className={cn("text-sm sm:text-base font-medium text-slate-200 leading-relaxed", !isExpanded && "line-clamp-1 truncate")}>
          {data.contextStr}
        </p>
      )}

      {isExpanded && (
        <div className="flex flex-col gap-5 my-2">
          {/* Layout: Statements / Numbered Lists */}
          {data.layoutType === 'statements' && data.listItems && data.listItems.length > 0 && (
            <div className="flex flex-col gap-3 relative before:absolute before:inset-0 before:-z-10 before:-left-3 before:w-[calc(100%+1.5rem)] before:bg-slate-800/20 before:rounded-xl">
              {data.listItems.map((item, idx) => (
                <div key={idx} className="flex gap-3 text-sm text-slate-300 items-start">
                  <span className="font-mono font-bold text-indigo-400 mt-0.5 shrink-0 min-w-[1.5rem]">{item.id}.</span>
                  <span className="leading-relaxed">{item.text}</span>
                </div>
              ))}
            </div>
          )}

          {/* Layout: Assertion / Reason */}
          {data.layoutType === 'assertion_reason' && (
            <div className="flex flex-col gap-4 bg-slate-800/20 p-4 rounded-xl border border-slate-700/50">
              {data.statementI && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-500/90">{isHindi ? 'कथन-I (Statement-I)' : 'Statement-I'}</span>
                  <p className="text-sm text-slate-300 leading-relaxed">{data.statementI}</p>
                </div>
              )}
              {data.statementII && (
                <div className="flex flex-col gap-1.5 pt-3 border-t border-slate-700/50">
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-500/90">{isHindi ? 'कथन-II (Statement-II)' : 'Statement-II'}</span>
                  <p className="text-sm text-slate-300 leading-relaxed">{data.statementII}</p>
                </div>
              )}
            </div>
          )}

          {/* Layout: Table / Pairs Matrix */}
          {(data.layoutType === 'table' || data.layoutType === 'pairs') && data.tableRows && data.tableRows.length > 0 && (
            <div className="overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
              <div className="min-w-[400px] flex flex-col rounded-xl border border-slate-700/50 bg-slate-900/30 overflow-hidden">
                
                {/* Headers */}
                {data.tableHeaders && data.tableHeaders.length > 0 && (
                  <div className="grid grid-cols-[auto_1fr] md:grid-cols-3 bg-slate-800/60 p-3 border-b border-slate-700/50">
                    {data.tableHeaders.map((head, idx) => (
                      <div key={idx} className={cn("text-xs font-bold uppercase tracking-wider text-slate-400", idx === 0 ? "col-span-1 pr-4" : "col-span-1")}>
                        {head}
                      </div>
                    ))}
                  </div>
                )}

                {/* Rows */}
                <div className="flex flex-col divide-y divide-slate-800/50">
                  {data.tableRows.map((row, rowIdx) => (
                    <div key={rowIdx} className="grid grid-cols-[auto_1fr] md:grid-cols-3 p-3 gap-y-2 items-center hover:bg-slate-800/30 transition-colors">
                      {row.map((cell, cellIdx) => (
                        <div key={cellIdx} className={cn("text-sm text-slate-300", cellIdx === 0 ? "font-medium pr-4 md:col-span-1" : "md:col-span-1")}>
                          {cell}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* The Question Prompt (e.g. "How many pairs are correctly matched?") */}
      {data.questionPrompt && (
        <p className={cn("text-sm font-semibold text-emerald-400 leading-relaxed", !isExpanded && "hidden")}>
          {data.questionPrompt}
        </p>
      )}

      {/* Fade out on collapsed state to indicate more content */}
      {!isExpanded && (
        <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-slate-900/50 to-transparent pointer-events-none" />
      )}
    </div>
  );
}

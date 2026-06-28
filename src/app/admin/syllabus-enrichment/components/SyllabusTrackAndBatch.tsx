import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Copy, Sparkles, CheckCircle2, Circle, Trash2 } from 'lucide-react';
import { copyToClipboard } from './utils';
import { toast } from 'sonner';

interface SyllabusTrackAndBatchProps {
  units: Record<string, any>;
  unitKeys: string[];
  expandedUnit: string | null;
  setExpandedUnit: (u: string | null) => void;
  totalGlobal: number;
  completedGlobal: number;
  masterPrompt: string;
  setTargetUnit: (u: string) => void;
  setTargetTopic: (t: string) => void;
  handleClearTopic: (id: string) => void;
  getUnitJson: (unitId: string) => string;
}

export function SyllabusTrackAndBatch({
  units,
  unitKeys,
  expandedUnit,
  setExpandedUnit,
  totalGlobal,
  completedGlobal,
  masterPrompt,
  setTargetUnit,
  setTargetTopic,
  handleClearTopic,
  getUnitJson,
}: SyllabusTrackAndBatchProps) {
  return (
    <section className="space-y-6 border-t border-slate-200 pt-8">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
            2
          </span>
          <h2 className="text-2xl font-bold text-slate-800">Track & Batch Export</h2>
        </div>
        
        {/* Global Progress */}
        <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="text-sm">
            <span className="font-bold text-slate-800">Global Progress: </span>
            <span className={completedGlobal === totalGlobal && totalGlobal > 0 ? 'text-emerald-600 font-bold' : 'text-slate-600'}>
              {completedGlobal} / {totalGlobal} Topics
            </span>
          </div>
          <div className="h-2 w-32 overflow-hidden rounded-full bg-slate-100">
            <div 
              className="h-full bg-blue-500 transition-all" 
              style={{ width: `${totalGlobal > 0 ? (completedGlobal / totalGlobal) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {unitKeys.map((unitId) => {
          const unit = units[unitId];
          const total = unit.topics.length;
          const completed = unit.topics.filter((t: any) => t.hasAiContent).length;
          const isExpanded = expandedUnit === unitId;
          
          // Group topics into fixed batches of 4
          const BATCH_SIZE = 4;
          const batches = [];
          for (let i = 0; i < unit.topics.length; i += BATCH_SIZE) {
            batches.push({
              batchNumber: Math.floor(i / BATCH_SIZE) + 1,
              topics: unit.topics.slice(i, i + BATCH_SIZE)
            });
          }

          // Identify the first batch that is not fully complete to highlight it
          const nextPendingBatch = batches.find(b => b.topics.some((t: any) => !t.hasAiContent))?.batchNumber;

          return (
            <div key={unitId} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              {/* Accordion Header */}
              <div 
                className="flex cursor-pointer flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 bg-slate-50 p-4 transition-colors hover:bg-slate-100 gap-4"
                onClick={() => setExpandedUnit(isExpanded ? null : unitId)}
              >
                <div className="flex items-center gap-4">
                  {isExpanded ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                  <div>
                    <h3 className="text-sm font-bold tracking-wide text-slate-800 uppercase">
                      {unitId.replace('_', ' ')}: {unit.title}
                    </h3>
                    <div className="mt-1 flex items-center gap-2 text-xs">
                      <span className={completed === total && total > 0 ? 'font-bold text-emerald-600' : 'text-slate-500'}>
                        {completed} / {total} Completed
                      </span>
                      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-200">
                        <div 
                          className="h-full bg-emerald-500 transition-all" 
                          style={{ width: `${total > 0 ? (completed / total) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(getUnitJson(unitId), `Full ${unitId}`);
                    }}
                    variant="outline"
                    size="sm"
                    className="gap-2 border-slate-200 hover:border-slate-300 h-8"
                  >
                    <Copy size={14} /> Copy Full Unit JSON
                  </Button>
                </div>
              </div>

              {/* Accordion Content (Batches) */}
              {isExpanded && (
                <div className="bg-white p-4 space-y-6">
                  {batches.map((batch) => {
                    const batchDone = batch.topics.filter((t: any) => t.hasAiContent).length;
                    const batchTotal = batch.topics.length;
                    const isComplete = batchDone === batchTotal;
                    const isNext = batch.batchNumber === nextPendingBatch;
                    
                    return (
                      <div key={batch.batchNumber} className={`border rounded-xl overflow-hidden ${isNext ? 'border-blue-300 ring-1 ring-blue-100' : 'border-slate-100'}`}>
                        {/* Batch Header */}
                        <div className={`flex items-center justify-between p-3 px-4 border-b ${isNext ? 'bg-blue-50 border-blue-100' : 'bg-slate-50 border-slate-100'}`}>
                          <div className="flex items-center gap-3">
                            <h4 className="font-bold text-slate-800 text-sm">Batch {batch.batchNumber}</h4>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                              {batchDone} / {batchTotal} Done
                            </span>
                            {isNext && <span className="text-[10px] uppercase tracking-wider font-bold text-white bg-blue-500 px-2 py-0.5 rounded-full">Next Pending</span>}
                          </div>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              
                              // If batch is complete, copy all topics in it. Otherwise copy only pending.
                              const topicsToCopy = isComplete 
                                ? batch.topics 
                                : batch.topics.filter((t:any) => !t.hasAiContent);
                                
                              const mapped = topicsToCopy.map((t:any) => ({
                                id: t.id,
                                unit: unit.title || unitId,
                                title_hindi: t.topic_title || '',
                                title_english: t.topic_title_en || '',
                              }));
                              
                              const combinedPrompt = `${masterPrompt}\n\n---\n\nHere are the next topics to process in strict JSON format:\n\n${JSON.stringify(mapped, null, 2)}`;
                              
                              copyToClipboard(combinedPrompt, `Prompt for Batch ${batch.batchNumber}`);
                            }}
                            variant={isNext ? "default" : "outline"}
                            size="sm"
                            className={`h-8 text-xs gap-2 ${isNext ? 'bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-500/20 text-white' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                          >
                            {isComplete ? <Copy size={12} /> : <Sparkles size={12} />} 
                            {isComplete ? 'Copy Batch JSON' : `Copy Full Prompt (${batchTotal - batchDone} Topics)`}
                          </Button>
                        </div>
                        
                        {/* Topics inside Batch */}
                        <div className="divide-y divide-slate-50">
                          {batch.topics.map((t: any) => (
                            <div key={t.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 px-4 hover:bg-slate-50 gap-4">
                              <div className="flex items-start sm:items-center gap-3">
                                <div className="mt-1 sm:mt-0">
                                  {t.hasAiContent ? (
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                  ) : (
                                    <Circle className="h-4 w-4 text-slate-300" />
                                  )}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-slate-800 leading-tight">{t.topic_title}</p>
                                  {t.topic_title_en && (
                                    <p className="text-xs font-medium text-slate-500">{t.topic_title_en}</p>
                                  )}
                                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {t.id}</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2 self-end sm:self-auto">
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const topicJson = JSON.stringify([{
                                      id: t.id,
                                      unit: unit.title || unitId,
                                      title_hindi: t.topic_title || '',
                                      title_english: t.topic_title_en || '',
                                    }], null, 2);
                                    
                                    const combinedTopicPrompt = `${masterPrompt}\n\n---\n\nHere is the topic to process in strict JSON format:\n\n${topicJson}`;
                                    
                                    copyToClipboard(combinedTopicPrompt, `Full Prompt for ${t.topic_title}`);
                                    setTargetUnit(unitId);
                                    setTargetTopic(t.id);
                                    toast.info("Topic selected for manual upload in Step 3");
                                  }}
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-[10px] px-2"
                                >
                                  <Copy size={10} className="mr-1" /> Copy JSON
                                </Button>

                                {t.hasAiContent ? (
                                  <Button
                                    onClick={() => handleClearTopic(t.id)}
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-rose-500 hover:bg-rose-50 hover:text-rose-600 rounded"
                                    title="Clear AI Content"
                                  >
                                    <Trash2 size={12} />
                                  </Button>
                                ) : (
                                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                                    Pending
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

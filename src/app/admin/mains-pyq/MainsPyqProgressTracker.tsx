'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMainsPyqDetailedOverview } from '@/actions/mains-pyq-actions';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  AlertCircle,
  ChevronDown,
  ChevronUp,
  CalendarDays,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type OverviewPaper = {
  examYear: number;
  paperNumber: number;
  progress: number;
  qCount: number;
  doneCount: number;
};

type OverviewMissing = {
  year: number;
  paper: number;
};

type OverviewSummary = {
  targetImported: number;
  targetPrepared: number;
  targetTotal: number;
  totalQuestions: number;
  totalDone: number;
  marksBreakdown: { marks: number; count: number }[];
};

type OverviewSuccess = {
  success: true;
  summary: OverviewSummary;
  data: OverviewPaper[];
  missing: OverviewMissing[];
};

type OverviewResponse = OverviewSuccess | { success: false; error: string };

export function MainsPyqProgressTracker({ refreshTrigger }: { refreshTrigger?: number }) {
  const [isOpen, setIsOpen] = useState(false);

  const { data, isLoading: loading, error: queryError } = useQuery({
    queryKey: ['admin-mains-pyq-progress', refreshTrigger],
    queryFn: async () => {
      const res = await getMainsPyqDetailedOverview();
      if (!res.success) {
        throw new Error(res.error || 'Failed to load PYQ progress');
      }
      return res as OverviewSuccess;
    },
    // Instead of loading on mount immediately if not needed, we can enable it always 
    // or keep it fetching as useQuery will cache it.
  });

  if (loading && !data) return null;
  if (queryError || !data) return null;

  const { summary, data: papers, missing } = data;

  // Group papers by year
  const years = [2025, 2024, 2023, 2022, 2021, 2020];
  const groupedByYear = years.map(year => {
    const yearPapers = papers.filter((p) => p.examYear === year);
    const yearMissing = missing.filter((m) => m.year === year);
    
    // Summary for the year
    const totalDone = yearPapers.filter((p) => p.progress === 100).length;
    const totalExpected = 6;
    const yearProgress = Math.round((totalDone / totalExpected) * 100);

    return {
      year,
      papers: yearPapers,
      missing: yearMissing,
      doneCount: totalDone,
      expectedCount: totalExpected,
      progress: yearProgress
    };
  });

  return (
    <Card className="overflow-hidden border-slate-200 bg-white shadow-sm transition-all duration-300">
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-violet-600 text-white shadow-lg shadow-violet-200">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Mains PYQ Yearly Mission Tracker</h2>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight flex items-center gap-2">
               Target: 2020-2025 · <span className="text-emerald-600">{summary.targetImported} Papers in DB</span> · <span className="text-violet-600">{summary.totalQuestions} Total Questions</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 font-black text-[10px]">
            {summary.targetPrepared} / {summary.targetTotal} Total Done
          </Badge>
          {isOpen ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-slate-100 bg-slate-50/30 overflow-hidden"
          >
            <div className="p-6 space-y-8">
              {/* Overall Database Stats Card */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl border border-indigo-100 bg-indigo-50/50">
                <div className="flex flex-col gap-1 border-r border-indigo-100 last:border-0 pr-4 last:pr-0">
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Total Stems</span>
                  <span className="text-xl font-black text-indigo-900">{summary.totalQuestions}</span>
                </div>
                <div className="flex flex-col gap-1 border-r border-indigo-100 last:border-0 px-4 last:px-0">
                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Done Answers</span>
                  <span className="text-xl font-black text-emerald-700">{summary.totalDone}</span>
                </div>
                <div className="flex flex-col gap-1 border-r border-indigo-100 last:border-0 px-4 last:px-0 col-span-2 md:col-span-2">
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Marks Distribution</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {summary.marksBreakdown?.map((m) => (
                      <Badge key={m.marks} variant="outline" className="bg-white border-indigo-200 text-indigo-700 font-bold text-[10px]">
                        {m.marks} Markers: {m.count}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Yearly Progress Cards */}
              <div className="space-y-6">
                {groupedByYear.map((yearData, idx) => (
                  <motion.div
                    key={yearData.year}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
                  >
                    {/* Year Header */}
                    <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="px-3 py-1 rounded-lg bg-slate-900 text-white font-black text-sm">
                          {yearData.year}
                        </div>
                        <div>
                          <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Exam Cycle Progress</h3>
                          <p className="text-[10px] font-bold text-slate-500 uppercase">{yearData.doneCount} of {yearData.expectedCount} papers fully prepared</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 min-w-[120px] sm:min-w-[200px]">
                        <div className="flex-1">
                          <Progress value={yearData.progress} className="h-2" indicatorClassName={yearData.progress === 100 ? "bg-emerald-500" : "bg-violet-500"} />
                        </div>
                        <span className="text-sm font-black text-slate-900 w-10 text-right">{yearData.progress}%</span>
                      </div>
                    </div>

                    {/* Paper Grid for this Year */}
                    <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                      {[1, 2, 3, 4, 5, 6].map(paperNum => {
                        const p = yearData.papers.find((x) => x.paperNumber === paperNum);
                        const isMissing = yearData.missing.some((m) => m.paper === paperNum);
                        
                        if (isMissing) {
                          return (
                            <div key={paperNum} className="p-3 rounded-xl border border-dashed border-red-200 bg-red-50/30 flex flex-col items-center justify-center text-center group">
                               <span className="text-[10px] font-black text-red-700 opacity-60">P{paperNum}</span>
                               <span className="text-[8px] font-black text-red-500 uppercase mt-1">Missing</span>
                               <AlertCircle className="h-3 w-3 text-red-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          );
                        }

                        if (!p) {
                           // Paper exists in DB but maybe not Paper 1-6 (e.g. extra papers)
                           return null;
                        }

                        return (
                          <div 
                            key={paperNum} 
                            className={`p-3 rounded-xl border transition-all flex flex-col items-center justify-center text-center ${
                              p.progress === 100 
                                ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
                                : 'bg-violet-50 border-violet-100 text-violet-800'
                            }`}
                          >
                             <span className="text-[10px] font-black">Paper {paperNum}</span>
                             <div className="mt-1 flex items-center gap-1">
                               {p.progress === 100 ? (
                                 <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                               ) : (
                                 <div className="text-[8px] font-black px-1 rounded bg-violet-200 text-violet-700">
                                   {p.progress}%
                                 </div>
                               )}
                             </div>
                             <p className="text-[8px] font-bold mt-1 opacity-70 uppercase tracking-tighter">
                               {p.doneCount}/{p.qCount} Stems
                             </p>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

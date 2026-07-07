'use client';

import { useState, useEffect, useCallback } from 'react';
import { getMainsDetailedProgressOverview } from '@/actions/mains-actions';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  Clock, 
  LayoutDashboard,
  Zap,
  ChevronDown,
  ChevronUp,
  Info,
  CheckCircle2,
  Circle
} from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

export function MainsSyllabusProgressTracker() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await getMainsDetailedProgressOverview();
    if (res.success) {
      setData(res.data);
    } else {
      setError(res.error || 'Failed to load progress data');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Refresh when opened to ensure latest data
  useEffect(() => {
    if (isOpen) {
      load();
    }
  }, [isOpen, load]);

  if (loading) return null;

  return (
    <Card className="overflow-hidden border-slate-200 bg-white shadow-sm transition-all duration-300">
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-600 text-white">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Syllabus Upload Tracker</h2>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Check unit-wise upload status for Paper 1-6</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 font-black text-[10px]">
            <Zap className="h-3 w-3 mr-1 fill-emerald-500" />
            Live Stats
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
              {error ? (
                <div className="p-4 bg-red-50 text-red-700 text-sm font-bold rounded-lg border border-red-100 flex items-center gap-2">
                  <Info className="h-4 w-4" /> {error}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {data.map((paper, idx) => (
                    <motion.div
                      key={paper.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-900 text-white font-black">
                            P{paper.paperNumber}
                          </div>
                          <div>
                            <h3 className="text-sm font-black text-slate-900 line-clamp-1">{paper.titleEn}</h3>
                            <p className="text-[10px] font-bold text-slate-500 uppercase">{paper.totalPublished}/{paper.totalTopics} Topics Done</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-lg font-black ${paper.progress === 100 ? 'text-emerald-600' : 'text-indigo-600'}`}>
                            {paper.progress}%
                          </span>
                        </div>
                      </div>

                      <Progress value={paper.progress} className="h-1.5 mb-6" indicatorClassName={paper.progress === 100 ? 'bg-emerald-500' : 'bg-indigo-500'} />

                      {/* Unit-wise dots/grid */}
                      <div className="space-y-4">
                        {['A', 'B'].map(part => {
                          const partUnits = paper.units.filter((u: any) => u.part === part);
                          if (partUnits.length === 0) return null;
                          return (
                            <div key={part} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Part {part}</span>
                              </div>
                              <div className="grid grid-cols-5 gap-2">
                                {partUnits.map((u: any) => (
                                  <div key={u.unitNumber} className="group relative">
                                    <div 
                                      className={`h-8 rounded-lg flex items-center justify-center text-[10px] font-black transition-all ${
                                        u.progress === 100 
                                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                                          : u.progress > 0 
                                            ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                            : 'bg-slate-100 text-slate-400 border border-slate-200'
                                      }`}
                                      title={`Unit ${u.unitNumber}: ${u.publishedTopics}/${u.totalTopics} topics`}
                                    >
                                      U{u.unitNumber}
                                    </div>
                                    {/* Tooltip on hover */}
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-32 bg-slate-900 text-white text-[9px] p-2 rounded shadow-xl z-50">
                                      <p className="font-black uppercase mb-1">Unit {u.unitNumber}</p>
                                      <p>{u.publishedTopics} / {u.totalTopics} topics uploaded</p>
                                      {u.lastUpdated && <p className="text-slate-400 mt-1">Last: {format(new Date(u.lastUpdated), 'dd MMM')}</p>}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                        {/* Single Part papers like P4, P5, P6 */}
                        {paper.units.every((u: any) => !u.part || u.part === 'NONE' || u.part === 'N/A') && (
                           <div className="grid grid-cols-5 gap-2">
                           {paper.units.map((u: any) => (
                             <div key={u.unitNumber} className="group relative">
                               <div 
                                 className={`h-8 rounded-lg flex items-center justify-center text-[10px] font-black transition-all ${
                                   u.progress === 100 
                                     ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                                     : u.progress > 0 
                                       ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                       : 'bg-slate-100 text-slate-400 border border-slate-200'
                                 }`}
                               >
                                 U{u.unitNumber}
                               </div>
                               <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-32 bg-slate-900 text-white text-[9px] p-2 rounded shadow-xl z-50">
                                  <p className="font-black uppercase mb-1">Unit {u.unitNumber}</p>
                                  <p>{u.publishedTopics} / {u.totalTopics} topics</p>
                               </div>
                             </div>
                           ))}
                         </div>
                        )}
                      </div>

                      <div className="mt-5 pt-4 border-t border-slate-50 flex items-center justify-between text-[9px] font-black text-slate-400 uppercase">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {paper.lastUpdated ? format(new Date(paper.lastUpdated), 'dd MMM, HH:mm') : 'No work'}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, 
  CheckCircle2, 
  Circle, 
  BookOpen, 
  ChevronRight,
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import type { MainsUnitPart } from '@/lib/mains-syllabus-unit-label';
import { mainsUnitShortBadge, mainsUnitSubtitle } from '@/lib/mains-syllabus-unit-label';
import { useParams, usePathname } from 'next/navigation';
import { useSettingsStore } from '@/store/useSettingsStore';
import { QuickFeedback } from '@/features/tests/components/QuickFeedback';
import { toast } from 'sonner';

/**
 * 📂 MAINS SYLLABUS SIDEBAR
 * 
 * Bhai, ye sidebar navigation ka engine h.
 * Fast, fluid aur smooth.
 */

interface Topic {
  id: string;
  titleHi: string;
  titleEn: string;
  status: string;
}

interface Unit {
  id: string;
  unitNumber: number;
  part: MainsUnitPart;
  titleHi: string;
  titleEn: string;
  topics: Topic[];
}

interface MainsSyllabusSidebarProps {
  paperId?: string;
  paperNumber: number;
  titleHi?: string | null;
  titleEn?: string | null;
  units: Unit[];
  language?: 'hi' | 'en';
  progressData?: Record<string, string>; // topicId -> status
  onTopicClick?: () => void;
  hideHeaderFooter?: boolean;
}

// Alternating premium theme configurations
const getAlternatingColors = (index: number) => {
  const list = [
    {
      name: 'emerald',
      expandedBg: "bg-emerald-50/80 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-400 border border-emerald-100/60 dark:border-emerald-900/30",
      hoverBg: "hover:bg-emerald-50/40 dark:hover:bg-emerald-950/10 text-slate-700 dark:text-slate-400 border border-transparent",
      badge: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300",
      activeTopic: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black border-l-2 border-emerald-500",
    },
    {
      name: 'amber',
      expandedBg: "bg-amber-50/80 dark:bg-amber-950/20 text-amber-900 dark:text-amber-400 border border-amber-100/60 dark:border-amber-900/30",
      hoverBg: "hover:bg-amber-50/40 dark:hover:bg-amber-950/10 text-slate-700 dark:text-slate-400 border border-transparent",
      badge: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300",
      activeTopic: "bg-amber-500/10 text-amber-600 dark:text-amber-400 font-black border-l-2 border-amber-500",
    },
    {
      name: 'sky',
      expandedBg: "bg-sky-50/80 dark:bg-sky-950/20 text-sky-900 dark:text-sky-400 border border-sky-100/60 dark:border-sky-900/30",
      hoverBg: "hover:bg-sky-50/40 dark:hover:bg-sky-950/10 text-slate-700 dark:text-slate-400 border border-transparent",
      badge: "bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300",
      activeTopic: "bg-sky-500/10 text-sky-600 dark:text-sky-400 font-black border-l-2 border-sky-500",
    },
    {
      name: 'pink',
      expandedBg: "bg-pink-50/80 dark:bg-pink-950/20 text-pink-900 dark:text-pink-400 border border-pink-100/60 dark:border-pink-900/30",
      hoverBg: "hover:bg-pink-50/40 dark:hover:bg-pink-950/10 text-slate-700 dark:text-slate-400 border border-transparent",
      badge: "bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300",
      activeTopic: "bg-pink-500/10 text-pink-600 dark:text-pink-400 font-black border-l-2 border-pink-500",
    },
  ];
  return list[index % list.length];
};

export function MainsSyllabusSidebar({ 
  paperId,
  paperNumber,
  titleHi,
  titleEn,
  units, 
  language,
  progressData = {},
  onTopicClick,
  hideHeaderFooter = false,
}: MainsSyllabusSidebarProps) {
  const [expandedUnits, setExpandedUnits] = useState<string[]>([]);
  const params = useParams();
  const activeTopicId = params.topicId as string | undefined;
  const activePaperId = paperId ?? (params.paperId as string | undefined);

  // React to client language state automatically
  const { language: storeLanguage } = useSettingsStore();
  const activeLanguage = language ?? storeLanguage ?? 'hi';
  const hi = activeLanguage === 'hi';

  useEffect(() => {
    if (!activeTopicId) return;
    const unitWithTopic = units.find((u) => u.topics.some((t) => t.id === activeTopicId));
    if (!unitWithTopic) return;
    setExpandedUnits((prev) => (prev.includes(unitWithTopic.id) ? prev : [...prev, unitWithTopic.id]));
  }, [activeTopicId, units]);

  const toggleUnit = (unitId: string) => {
    setExpandedUnits(prev => 
      prev.includes(unitId) ? prev.filter(id => id !== unitId) : [...prev, unitId]
    );
  };

  return (
    <div className={cn(
      "flex-1 min-h-0 flex flex-col w-full bg-white dark:bg-slate-950",
      !hideHeaderFooter && "border-r border-slate-200 dark:border-slate-800/50"
    )}>
      {/* ── Paper Info Header ── */}
      {!hideHeaderFooter && (
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/10">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border border-emerald-500/20 shadow-xs">
              🎯 {hi ? `पेपर ${paperNumber}` : `Paper ${paperNumber}`}
            </span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              {hi ? 'सिलेबस मेनू' : 'Syllabus Menu'}
            </span>
          </div>
          <h2 className="text-[15px] font-black tracking-tight text-slate-900 dark:text-white leading-snug break-words">
            {hi ? (titleHi || 'इतिहास + भूगोल') : (titleEn || 'History & Geography')}
          </h2>
        </div>
      )}

      {/* ── Scrollable List ── */}
      <div className={cn("flex-1 p-2 space-y-3", !hideHeaderFooter && "overflow-y-auto custom-scrollbar")}>
        {units.map((unit, unitIdx) => {
          const isExpanded = expandedUnits.includes(unit.id);
          const theme = getAlternatingColors(unitIdx);
          
          return (
            <div key={unit.id} className="space-y-1">
              {/* Unit Header */}
              <button
                onClick={() => toggleUnit(unit.id)}
                className={cn(
                  "flex flex-col w-full p-2.5 rounded-xl transition-all duration-200 group text-left gap-1.5",
                  isExpanded ? theme.expandedBg : theme.hoverBg
                )}
              >
                <div className="flex items-center justify-between gap-2 w-full pr-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={cn(
                        "flex min-w-[2.75rem] items-center justify-center rounded-lg px-1 py-0.5 text-[10px] font-black leading-tight transition-colors",
                        theme.badge
                      )}
                      title={mainsUnitSubtitle(paperNumber, unit.part, unit.unitNumber, hi ? 'hi' : 'en')}
                    >
                      {mainsUnitShortBadge(unit.part, unit.unitNumber)}
                    </span>
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 truncate">
                      {mainsUnitSubtitle(paperNumber, unit.part, unit.unitNumber, hi ? 'hi' : 'en')}
                    </p>
                  </div>
                  <ChevronDown className={cn("h-4 w-4 transition-transform shrink-0 text-slate-400", isExpanded ? "rotate-180" : "")} />
                </div>
                <p className="text-xs font-bold leading-snug whitespace-normal break-words w-full text-slate-800 dark:text-slate-200">
                  {hi ? unit.titleHi : unit.titleEn}
                </p>
              </button>

              {/* Topics List */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden pl-3 space-y-1 pr-2"
                  >
                    {unit.topics.map((topic) => {
                      const isActive = activeTopicId === topic.id;
                      const isDone = progressData[topic.id] === 'done';
                      const isPublished = topic.status === 'published';

                      const handleClick = (e: React.MouseEvent) => {
                        if (!isPublished) {
                          e.preventDefault();
                          toast.info(hi ? 'जल्द आ रहा है / Coming Soon' : 'Coming Soon / जल्द आ रहा है', {
                            description: hi 
                              ? 'इस सेक्शन का कंटेंट अभी तैयार हो रहा है, कृपया प्रतीक्षा करें।' 
                              : 'Content for this section is coming soon. Please stay tuned!',
                            icon: <Target className="h-4 w-4 text-amber-500" />
                          });
                          return;
                        }
                        if (onTopicClick) onTopicClick();
                      };
                      
                      return (
                        <Link
                          key={topic.id}
                          href={isPublished ? `/mains/syllabus/${activePaperId ?? ''}/${topic.id}` : '#'}
                          onClick={handleClick}
                          className={cn(
                            "flex items-center justify-between group p-2 rounded-lg text-sm transition-all text-left",
                            !isPublished && "opacity-60 grayscale-[0.5] pointer-events-auto cursor-not-allowed",
                            isActive 
                              ? theme.activeTopic
                              : "text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900/20"
                          )}
                        >
                          <span className="flex-1 pr-2 text-sm font-semibold leading-relaxed whitespace-normal break-words">
                            {hi ? topic.titleHi : topic.titleEn}
                          </span>
                          {!isPublished ? (
                            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tighter shrink-0">
                              {hi ? 'जल्द' : 'Soon'}
                            </span>
                          ) : isDone ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                          ) : isActive ? (
                            <ChevronRight className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 transition-transform translate-x-0.5 font-bold" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-slate-300 dark:text-slate-700 shrink-0 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-all group-hover:translate-x-0.5" />
                          )}
                        </Link>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

{/* ── Removed QuickFeedback from Sidebar for now ── */}
        {/* <div className="mt-8 border-t border-slate-100 dark:border-slate-800/50 pt-6 pb-4">
          <QuickFeedback 
            questionId={activePaperId || 'mains_syllabus'}
            questionText={hi ? `पेपर ${paperNumber}: ${titleHi || titleEn}` : `Paper ${paperNumber}: ${titleEn}`}
            source="mains_syllabus_paper"
            className="px-2"
          />
        </div> */}
      </div>

      {/* ── Progress Footer ── */}
      {!hideHeaderFooter && (
        <div className="p-4 border-t border-slate-200 dark:border-slate-800/50 bg-slate-50 dark:bg-slate-900/20">
          <div className="flex items-center justify-between text-xs font-black tracking-widest uppercase text-slate-500 mb-2">
            <span>Overall Progress</span>
            <span className="text-emerald-600 dark:text-emerald-400">32%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: '32%' }}
              className="h-full bg-emerald-500"
            />
          </div>
        </div>
      )}
    </div>
  );
}

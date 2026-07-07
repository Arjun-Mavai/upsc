'use client';

import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { MainsSyllabusSidebar } from '@/components/mains/MainsSyllabusSidebar';
import { Compass, BookOpen, XIcon } from 'lucide-react';
import { useSettingsStore } from '@/store/useSettingsStore';
import { getAllMainsPapersWithSyllabus } from '@/actions/mains-actions';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface MainsMobileSyllabusDrawerProps {
  paperNumber: number;
  language?: 'hi' | 'en';
}

/** Get matching vibrant light theme configurations & fitting emojis for each paper (P1 to P6) */
const getPaperThemeConfig = (paperNumber: number) => {
  const configs: Record<number, { bg: string; badge: string; emoji: string }> = {
    1: {
      bg: "bg-emerald-50/95 dark:bg-emerald-950/25 text-emerald-950 dark:text-emerald-300 border-emerald-100 dark:border-emerald-900/40",
      badge: "bg-emerald-600 text-white shadow-sm",
      emoji: "🏛️",
    },
    2: {
      bg: "bg-amber-50/95 dark:bg-amber-950/25 text-amber-950 dark:text-amber-300 border-amber-100 dark:border-amber-900/40",
      badge: "bg-amber-600 text-white shadow-sm",
      emoji: "⚖️",
    },
    3: {
      bg: "bg-sky-50/95 dark:bg-sky-950/25 text-sky-950 dark:text-sky-300 border-sky-100 dark:border-sky-900/40",
      badge: "bg-sky-600 text-white shadow-sm",
      emoji: "🚀",
    },
    4: {
      bg: "bg-rose-50/95 dark:bg-rose-950/25 text-rose-950 dark:text-rose-300 border-rose-100 dark:border-rose-900/40",
      badge: "bg-rose-600 text-white shadow-sm",
      emoji: "💡",
    },
    5: {
      bg: "bg-purple-50/95 dark:bg-purple-950/25 text-purple-950 dark:text-purple-300 border-purple-100 dark:border-purple-900/40",
      badge: "bg-purple-600 text-white shadow-sm",
      emoji: "✍️",
    },
    6: {
      bg: "bg-orange-50/95 dark:bg-orange-950/25 text-orange-950 dark:text-orange-300 border-orange-100 dark:border-orange-900/40",
      badge: "bg-orange-600 text-white shadow-sm",
      emoji: "🎯",
    },
    7: {
      bg: "bg-red-50/95 dark:bg-red-950/25 text-red-950 dark:text-red-300 border-red-100 dark:border-red-900/40",
      badge: "bg-red-600 text-white shadow-sm",
      emoji: "🧠",
    },
    8: {
      bg: "bg-indigo-50/95 dark:bg-indigo-950/25 text-indigo-950 dark:text-indigo-300 border-indigo-100 dark:border-indigo-900/40",
      badge: "bg-indigo-600 text-white shadow-sm",
      emoji: "📘",
    },
    9: {
      bg: "bg-pink-50/95 dark:bg-pink-950/25 text-pink-950 dark:text-pink-300 border-pink-100 dark:border-pink-900/40",
      badge: "bg-pink-600 text-white shadow-sm",
      emoji: "📕",
    },
  };
  return configs[paperNumber] ?? configs[1];
};

export function MainsMobileSyllabusDrawer({
  paperNumber,
  language,
}: MainsMobileSyllabusDrawerProps) {
  const [open, setOpen] = useState(false);
  const [allPapers, setAllPapers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { language: storeLanguage } = useSettingsStore();
  const activeLanguage = storeLanguage ?? language ?? 'hi';
  const hi = activeLanguage === 'hi';

  useEffect(() => {
    async function loadAllSyllabus() {
      setLoading(true);
      try {
        const res = await getAllMainsPapersWithSyllabus();
        if (res.success && res.data) {
          setAllPapers(res.data);
        }
      } catch (err) {
        console.error('Failed to load all mains papers syllabus:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAllSyllabus();
  }, []);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto h-8.5 gap-1.5 rounded-xl border-emerald-200 bg-emerald-50/80 px-3 text-xs font-black uppercase tracking-wide text-emerald-700 hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-400 dark:hover:bg-emerald-500/20 transition-all duration-200 shadow-sm shrink-0"
        >
          <Compass className="h-4 w-4 text-emerald-600 dark:text-emerald-400 animate-[spin_8s_linear_infinite]" />
          <span>{hi ? 'सिलेबस मेन्यू' : 'Syllabus Menu'}</span>
        </Button>
      </SheetTrigger>
      <SheetContent showCloseButton={false} side="right" className="w-[320px] p-0 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col h-full overflow-hidden">
        <SheetHeader className="relative p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/10 text-left">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(false)}
            className="absolute top-2 right-2 z-50 h-10 w-10 rounded-full border-2 border-emerald-100 bg-white p-2 text-emerald-600 shadow-sm transition-all hover:scale-110 hover:bg-emerald-50 active:scale-95 dark:border-emerald-500/30 dark:bg-slate-900 dark:text-emerald-400"
          >
            <XIcon className="h-6 w-6" strokeWidth={3} />
          </Button>
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border border-emerald-500/20 shadow-xs">
              🎯 {hi ? `पेपर ${paperNumber}` : `Paper ${paperNumber}`}
            </span>
          </div>
          <SheetTitle className="text-[15px] font-black tracking-tight text-slate-900 dark:text-white leading-snug break-words">
            {hi ? 'सभी 9 पेपर्स का संपूर्ण पाठ्यक्रम' : 'Comprehensive Syllabus P1-P9'}
          </SheetTitle>
        </SheetHeader>
        
        <div className="flex-1 min-h-0 h-full overflow-y-auto p-3 space-y-3 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500">
                {hi ? 'सिलेबस लोड हो रहा है...' : 'Loading syllabus tree...'}
              </p>
            </div>
          ) : (
            <Accordion type="single" collapsible defaultValue={`paper-${paperNumber}`} className="space-y-3">
              {allPapers.map((paper, paperIdx) => {
                const isCurrentPaper = paper.paperNumber === paperNumber;
                const theme = getPaperThemeConfig(paper.paperNumber);
                const hasPublished = paper.units.some((u: any) => u.topics.some((t: any) => t.status === 'published'));
                
                const handlePaperClick = (e: React.MouseEvent) => {
                  if (!hasPublished) {
                    e.preventDefault();
                    e.stopPropagation();
                    toast.info(hi ? `पेपर ${paper.paperNumber} जल्द आ रहा है` : `Paper ${paper.paperNumber} Coming Soon`, {
                      description: hi 
                        ? 'इस पेपर का सिलेबस और कंटेंट जल्द ही अपडेट किया जाएगा।' 
                        : `Syllabus and content for Paper ${paper.paperNumber} will be updated soon.`,
                      icon: <BookOpen className="h-4 w-4 text-amber-500" />
                    });
                  }
                };

                return (
                  <AccordionItem 
                    key={paper.id} 
                    value={`paper-${paper.paperNumber}`}
                    className={cn(
                      "border border-slate-200/60 dark:border-slate-800/60 rounded-2xl overflow-hidden shadow-sm",
                      !hasPublished && "opacity-60 grayscale-[0.5]"
                    )}
                  >
                    <AccordionTrigger 
                      onClickCapture={handlePaperClick}
                      className={cn(
                        "px-4 py-3 hover:no-underline [&[data-state=open]]:bg-white/40 transition-all duration-200", 
                        theme.bg,
                        !hasPublished && "cursor-not-allowed pointer-events-auto"
                      )}
                    >
                      <div className="flex items-center gap-2.5 text-left w-full pr-2">
                        <span className={cn(
                          "flex h-7 px-1.5 shrink-0 items-center justify-center rounded-lg text-[10px] font-black leading-none",
                          isCurrentPaper ? "bg-emerald-600 text-white shadow-sm" : theme.badge
                        )}>
                          P{paper.paperNumber}
                        </span>
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="text-xs font-black leading-snug whitespace-normal break-words">
                            {theme.emoji} {hi ? paper.titleHi : paper.titleEn}
                          </span>
                          {!hasPublished && (
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                              {hi ? 'जल्द आ रहा है' : 'Coming Soon'}
                            </span>
                          )}
                        </div>
                      </div>
                    </AccordionTrigger>
                    
                    <AccordionContent className="bg-white dark:bg-slate-950 px-1 py-2 border-t border-slate-100 dark:border-slate-900">
                      <MainsSyllabusSidebar 
                        paperId={paper.id}
                        paperNumber={paper.paperNumber}
                        units={paper.units}
                        language={activeLanguage}
                        hideHeaderFooter={true}
                        onTopicClick={() => setOpen(false)}
                      />
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Sparkles, Filter, MousePointer2, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSettingsStore } from '@/store/useSettingsStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';

const STEPS = [
  {
    id: 'paper',
    icon: Target,
    colorClass: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    title: { en: 'Year & Paper Filter', hi: 'वर्ष और पेपर फ़िल्टर' },
    desc: { 
      en: 'Click the target icon (top right) to switch between different exam years and papers seamlessly.', 
      hi: 'विभिन्न वर्षों और पेपर्स के बीच स्विच करने के लिए टारगेट आइकन (ऊपर दाएँ) पर क्लिक करें।' 
    }
  },
  {
    id: 'marks',
    icon: Filter,
    colorClass: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
    title: { en: 'Marks Filter', hi: 'मार्क्स फ़िल्टर' },
    desc: { 
      en: 'Focus your practice strictly on 10m, 15m, or 20m marker questions with a single tap.', 
      hi: 'एक टैप से केवल 10m, 15m, या 20m मार्कर प्रश्नों पर अपना फोकस सेट करें।' 
    }
  },
  {
    id: 'focus',
    icon: Sparkles,
    colorClass: 'text-sky-500 bg-sky-500/10 border-sky-500/20',
    title: { en: 'Focus Mode', hi: 'फोकस मोड (इमर्सिव)' },
    desc: { 
      en: 'Click the sparkles icon to hide all filters for a distraction-free, immersive reading experience.', 
      hi: 'सभी फ़िल्टर्स को छिपाने और बिना किसी रुकावट के पढ़ने के लिए स्पार्कल्स आइकन पर क्लिक करें।' 
    }
  }
];

export function PyqNavigationGuide({ themeDeep, triggerType = 'banner' }: { themeDeep: boolean, triggerType?: 'banner' | 'icon' }) {
  const { language } = useSettingsStore();
  const hi = language === 'hi';
  const [activeStep, setActiveStep] = useState(0);
  const [open, setOpen] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Auto-cycle through steps when open, unless user interacts
  useEffect(() => {
    if (!open || hasInteracted) return;
    const interval = setInterval(() => {
      setActiveStep((s) => (s + 1) % STEPS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [open, hasInteracted]);
  
  // Reset interaction state when modal closes
  useEffect(() => {
    if (!open) {
      setHasInteracted(false);
      setActiveStep(0);
    }
  }, [open]);

  return (
    <div className={cn("w-full", triggerType === 'banner' ? "flex justify-center mb-6" : "")}>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {triggerType === 'banner' ? (
            <button
              className={cn(
                "group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full border px-5 py-2.5 text-[12px] font-bold tracking-wide transition-all hover:scale-[1.02] active:scale-95 shadow-sm w-full sm:w-auto",
                themeDeep 
                  ? "border-sky-500/30 bg-sky-900/30 text-sky-300 hover:bg-sky-800/40" 
                  : "border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100"
              )}
            >
              <Sparkles className="h-4 w-4 text-sky-500 animate-pulse" />
              {hi ? 'गाइड: स्मार्ट फ़िल्टर्स कैसे उपयोग करें?' : 'Guide: How to use Smart Filters?'}
              <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-12deg)_translateX(-100%)] group-hover:duration-1000 group-hover:[transform:skew(-12deg)_translateX(100%)]">
                <div className="relative h-full w-8 bg-white/20" />
              </div>
            </button>
          ) : (
            <button
              className={cn(
                "relative flex h-10 w-10 items-center justify-center rounded-full transition-all hover:scale-105 active:scale-95 ml-1 group",
              )}
              title={hi ? "स्मार्ट नेविगेशन गाइड" : "Smart Navigation Guide"}
            >
              {/* Colorful animated border */}
              <div className="absolute inset-0 rounded-full bg-[conic-gradient(#ef4444,#ec4899,#22c55e,#eab308,#ef4444)] animate-[spin_4s_linear_infinite]" />
              {/* Inner background */}
              <div className={cn(
                "absolute inset-[2px] rounded-full flex items-center justify-center transition-colors",
                themeDeep ? "bg-slate-900 group-hover:bg-slate-800" : "bg-white group-hover:bg-slate-50"
              )}>
                <HelpCircle className={cn(
                  "h-5 w-5",
                  themeDeep ? "text-sky-400" : "text-sky-600"
                )} />
              </div>
            </button>
          )}
        </DialogTrigger>

        <DialogContent className={cn(
          "max-w-4xl md:w-[95vw] p-0 overflow-hidden border-0 gap-0",
          themeDeep ? "bg-slate-950 text-slate-200" : "bg-white text-slate-900"
        )}>
          <div className="flex flex-col md:flex-row h-[85vh] md:h-[600px] max-h-[800px]">
            
            {/* Left: Interactive Steps */}
            <div className={cn(
              "w-full md:w-[55%] p-6 md:p-8 lg:p-10 flex flex-col overflow-y-auto shrink-0",
              themeDeep ? "bg-slate-900" : "bg-slate-50"
            )}>
              <div className="mb-6">
                <DialogTitle className="text-xl md:text-2xl font-black tracking-tight mb-2">
                  {hi ? 'नेविगेशन कैसे उपयोग करें? 🚀' : 'How to use navigation 🚀'}
                </DialogTitle>
                <DialogDescription className={cn("text-sm", themeDeep ? "text-slate-400" : "text-slate-600")}>
                  {hi ? 'बेहतरीन अनुभव के लिए फ़िल्टर्स का उपयोग करना सीखें।' : 'Learn how to use filters for the best immersive experience.'}
                </DialogDescription>
              </div>

              <div className="space-y-3 flex-1">
                {STEPS.map((step, idx) => {
                  const isActive = activeStep === idx;
                  const Icon = step.icon;
                  return (
                    <button
                      key={step.id}
                      onClick={() => {
                        setActiveStep(idx);
                        setHasInteracted(true);
                      }}
                      className={cn(
                        "w-full text-left flex items-start gap-3 p-3 rounded-2xl transition-all border-2",
                        isActive 
                          ? cn("shadow-md scale-[1.02]", step.colorClass) 
                          : themeDeep 
                            ? "border-transparent hover:bg-slate-800" 
                            : "border-transparent hover:bg-white"
                      )}
                    >
                      <div className={cn(
                        "p-2.5 rounded-full shrink-0 flex items-center justify-center",
                        isActive ? "bg-white/80 dark:bg-black/20" : themeDeep ? "bg-slate-800" : "bg-white shadow-sm"
                      )}>
                        <Icon className={cn("h-5 w-5 md:h-6 md:w-6", isActive ? "" : "text-slate-500")} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={cn("font-bold text-[14px]", isActive ? "" : themeDeep ? "text-slate-300" : "text-slate-700")}>
                          {hi ? step.title.hi : step.title.en}
                        </h4>
                        <AnimatePresence>
                          {isActive && (
                            <motion.p
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="text-[12px] leading-relaxed mt-1 overflow-hidden font-medium opacity-90"
                            >
                              {hi ? step.desc.hi : step.desc.en}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right: Dynamic Interactive Mockup */}
            <div className={cn(
              "w-full md:w-[45%] shrink-0 p-6 flex flex-col items-center justify-center relative overflow-hidden",
              themeDeep ? "bg-slate-950" : "bg-slate-100"
            )}>
              <div className="absolute inset-0 bg-grid-slate-200/50 dark:bg-grid-slate-800/50 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))] -z-10" />
              
              {/* Dynamic App Mockup */}
              <motion.div 
                layout
                className={cn(
                  "w-full max-w-[260px] rounded-2xl p-4 border shadow-2xl relative",
                  themeDeep ? "bg-slate-900 border-slate-700 shadow-sky-900/20" : "bg-white border-slate-200 shadow-slate-200/50"
                )}
              >
                {/* Header (Sparkles & Target) */}
                <div className="flex justify-between items-center mb-4 z-20 relative">
                  <div className={cn("h-4 w-16 rounded", themeDeep ? "bg-slate-700" : "bg-slate-200")} />
                  <div className="flex gap-2 relative">
                    <div className={cn(
                      "h-6 w-6 rounded-full flex items-center justify-center transition-all",
                      activeStep === 2 ? "bg-sky-500 text-white shadow-[0_0_15px_rgba(14,165,233,0.5)] scale-110" : themeDeep ? "bg-slate-800 text-slate-500" : "bg-slate-100 text-slate-400"
                    )}>
                      <Sparkles className="h-3 w-3" />
                    </div>
                    
                    <div className={cn(
                      "h-6 w-6 rounded-full flex items-center justify-center transition-all",
                      activeStep === 0 ? "bg-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.5)] scale-110" : themeDeep ? "bg-slate-800 text-slate-500" : "bg-slate-100 text-slate-400"
                    )}>
                      <Target className="h-3 w-3" />
                    </div>

                    {/* Paper Dropdown Mockup (Step 0) */}
                    <AnimatePresence>
                      {activeStep === 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.9 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.9 }}
                          className={cn(
                            "absolute top-8 right-0 w-32 rounded-lg p-1.5 border shadow-lg z-30",
                            themeDeep ? "bg-slate-800 border-slate-600" : "bg-white border-slate-200"
                          )}
                        >
                          <div className={cn("text-[7px] font-bold px-1.5 py-1 rounded mb-1 flex items-center gap-1", themeDeep ? "bg-slate-700 text-amber-300" : "bg-amber-100 text-amber-700")}>
                            <Target className="h-2 w-2" /> 2024 | Paper 1
                          </div>
                          <div className={cn("text-[7px] font-medium px-1.5 py-1 rounded mb-1", themeDeep ? "text-slate-400" : "text-slate-500")}>2023 | Paper 1</div>
                          <div className={cn("text-[7px] font-medium px-1.5 py-1 rounded", themeDeep ? "text-slate-400" : "text-slate-500")}>2022 | Paper 1</div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Filters Area (Collapses on Step 2) */}
                <motion.div
                  animate={{ height: activeStep === 2 ? 0 : 'auto', opacity: activeStep === 2 ? 0 : 1 }}
                  className="overflow-hidden mb-4"
                >
                  <div className="space-y-3 pb-1">

                    {/* Marks (Step 1) */}
                    <div className={cn(
                      "p-2 rounded-xl border-2 transition-all flex gap-1",
                      activeStep === 1 ? "border-orange-400 bg-orange-500/10" : "border-transparent"
                    )}>
                       <div className={cn("h-5 px-2 rounded-full flex items-center justify-center text-[7px] font-black", activeStep === 1 ? "bg-orange-500 text-white" : themeDeep ? "bg-slate-800 text-slate-400" : "bg-slate-200 text-slate-500")}>ALL</div>
                       <div className={cn("h-5 px-1.5 rounded-full flex items-center justify-center text-[7px] font-bold", themeDeep ? "bg-slate-800 text-slate-500" : "bg-slate-100 text-slate-400")}>10m</div>
                       <div className={cn("h-5 px-1.5 rounded-full flex items-center justify-center text-[7px] font-bold", themeDeep ? "bg-slate-800 text-slate-500" : "bg-slate-100 text-slate-400")}>15m</div>
                       <div className={cn("h-5 px-1.5 rounded-full flex items-center justify-center text-[7px] font-bold", themeDeep ? "bg-slate-800 text-slate-500" : "bg-slate-100 text-slate-400")}>20m</div>
                    </div>
                  </div>
                </motion.div>

                {/* Dummy Question Content */}
                <motion.div layout className={cn(
                  "p-3 rounded-xl border shadow-sm",
                  themeDeep ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"
                )}>
                  <div className="flex gap-2 items-center mb-2">
                    <div className={cn("h-3 w-5 rounded", themeDeep ? "bg-slate-600" : "bg-slate-200")} />
                    <div className={cn("h-2 w-16 rounded", themeDeep ? "bg-slate-700" : "bg-slate-100")} />
                  </div>
                  <div className={cn("h-2.5 w-full rounded mb-1.5", themeDeep ? "bg-slate-700" : "bg-slate-200")} />
                  <div className={cn("h-2.5 w-3/4 rounded", themeDeep ? "bg-slate-700" : "bg-slate-200")} />
                </motion.div>

                {/* Animated Simulated Cursor Overlay */}
                <motion.div
                  className="absolute z-50 text-slate-800 dark:text-white drop-shadow-lg"
                  animate={
                    activeStep === 0 ? { top: 12, right: 12 } :
                    activeStep === 1 ? { top: 75, right: 150 } :
                    { top: 12, right: 45 }
                  }
                  transition={{ type: "spring", stiffness: 100, damping: 20 }}
                >
                  <MousePointer2 className="h-6 w-6 -rotate-12 fill-white dark:fill-slate-800 text-slate-800 dark:text-slate-200" />
                  <motion.div 
                    className={cn(
                      "absolute -top-2 -left-2 h-8 w-8 rounded-full border-4 opacity-0 scale-50",
                      activeStep === 0 ? "border-amber-400" :
                      activeStep === 1 ? "border-orange-400" :
                      "border-sky-400"
                    )}
                    animate={{ opacity: [0, 0.8, 0], scale: [0.5, 1.2, 1.5] }}
                    transition={{ repeat: Infinity, duration: 1.5, repeatDelay: 1 }}
                  />
                </motion.div>
              </motion.div>

            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

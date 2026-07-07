'use client';

import { memo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Lock, Moon, SlidersHorizontal, SunMedium } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSettingsStore } from '@/store/useSettingsStore';
import {
  isMainsPyqDemoPaper,
  MAINS_PYQ_DEMO_PAPER_NUMBER,
  MAINS_PYQ_DEMO_YEAR,
} from '@/lib/mains-vault-demo';

type Paper = {
  id: string;
  examYear: number;
  paperNumber: number;
};

type ReadingTheme = 'deep' | 'paper';

interface PyqDeskControlsProps {
  papers: Paper[];
  paperId: string;
  onPaperChange: (id: string) => void;
  onPaperHover?: (id: string) => void;
  readingTheme: ReadingTheme;
  onThemeChange: (theme: ReadingTheme) => void;
  deskControlsOpen: boolean;
  onControlsToggle: (open: boolean) => void;
  vaultUnlocked: boolean;
}

export const PyqDeskControls = memo(({
  papers,
  paperId,
  onPaperChange,
  onPaperHover,
  readingTheme,
  onThemeChange,
  deskControlsOpen,
  vaultUnlocked,
}: PyqDeskControlsProps) => {
  const { language } = useSettingsStore();
  const hi = language === 'hi';
  const themeDeep = readingTheme === 'deep';

  const showFreeBadge = !vaultUnlocked;

  return (
    <AnimatePresence initial={false}>
      {deskControlsOpen ? (
        <motion.div
          key="desk-controls"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.22 }}
          className="overflow-hidden"
        >
          <motion.div
            className={cn(
              'mb-5 space-y-5 rounded-3xl border p-5 sm:p-6 transition-all duration-300 shadow-xl',
              themeDeep ? 'border-slate-700 bg-slate-900/60 backdrop-blur-md shadow-black/40' : 'border-slate-200/80 bg-white/95 backdrop-blur-md shadow-slate-200/60'
            )}
          >
            {showFreeBadge ? (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  'flex flex-wrap items-center gap-2 rounded-2xl border px-3.5 py-2.5 text-xs font-bold',
                  themeDeep
                    ? 'border-emerald-500/30 bg-emerald-950/40 text-emerald-200'
                    : 'border-emerald-200 bg-emerald-50/90 text-emerald-900'
                )}
              >
                <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
                  {hi ? 'मुफ़्त' : 'Free'}
                </span>
                <span>
                  {hi
                    ? `${MAINS_PYQ_DEMO_YEAR} · पेपर ${MAINS_PYQ_DEMO_PAPER_NUMBER} — खंड A व B में नमूना`
                    : `${MAINS_PYQ_DEMO_YEAR} · Paper ${MAINS_PYQ_DEMO_PAPER_NUMBER} — samples in Part A & B`}
                </span>
              </motion.div>
            ) : null}

            <motion.div>
              <label
                className={cn(
                  'mb-2 flex items-center gap-1.5 text-xs font-black uppercase tracking-wider',
                  themeDeep ? 'text-emerald-400' : 'text-emerald-600'
                )}
              >
                <span>🎯</span>
                <span>{hi ? 'पेपर चुनें (Select Paper)' : 'Select Paper'}</span>
              </label>
              <div className="relative">
                <motion.div className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2">
                  <motion.div
                    className={cn(
                      'h-2 w-2 rounded-full animate-pulse',
                      themeDeep
                        ? 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.6)]'
                        : 'bg-emerald-600 shadow-[0_0_10px_rgba(5,150,105,0.4)]'
                    )}
                  />
                </motion.div>
                <Select value={paperId} onValueChange={onPaperChange}>
                  <SelectTrigger
                    className={cn(
                      'h-13 w-full rounded-2xl pl-10 pr-4 text-base font-black shadow-md ring-offset-0 transition-all focus:ring-0',
                      themeDeep
                        ? 'border-slate-700 bg-slate-950 text-slate-100 hover:border-emerald-500/50 hover:bg-slate-900/90 [&_svg]:text-slate-400'
                        : 'border-slate-200 bg-slate-50 text-slate-800 hover:border-emerald-500/40 hover:bg-white'
                    )}
                  >
                    <SelectValue placeholder={hi ? 'पेपर चुनें' : 'Select paper'} />
                  </SelectTrigger>
                  <SelectContent
                    position="popper"
                    sideOffset={5}
                    viewportClassName="max-h-[280px] overflow-y-auto py-1.5 no-scrollbar"
                    className={cn(
                      'z-[200] w-[min(100%,var(--radix-select-trigger-width))] min-w-[280px] max-w-[90vw] rounded-2xl shadow-2xl',
                      themeDeep
                        ? 'border border-slate-700 bg-slate-950 text-slate-100'
                        : 'border border-slate-200 bg-white text-slate-800'
                    )}
                  >
                    {papers.map((p) => {
                      const isFreePaper = isMainsPyqDemoPaper(p.examYear, p.paperNumber);
                      const paperLocked = !vaultUnlocked && !isFreePaper;
                      return (
                        <SelectItem
                          key={p.id}
                          value={p.id}
                          textValue={`${p.examYear} Paper ${p.paperNumber}`}
                          onPointerEnter={() => onPaperHover?.(p.id)}
                          className={cn(
                            'cursor-pointer py-3.5 px-4 text-sm font-bold md:text-[15px] transition-colors rounded-xl mx-1 my-0.5',
                            themeDeep
                              ? 'text-slate-300 focus:bg-slate-800 focus:text-white'
                              : 'text-slate-700 focus:bg-emerald-50 focus:text-emerald-950',
                            paperLocked && 'opacity-90'
                          )}
                        >
                          <span className="font-black tabular-nums flex items-center gap-2 w-full">
                            <span className="text-emerald-500">▪</span>
                            <span>{p.examYear}</span>
                            <span className="opacity-40">|</span>
                            <span className="flex-1">
                              {hi ? <>पेपर {p.paperNumber}</> : <>Paper {p.paperNumber}</>}
                            </span>
                            {paperLocked ? (
                              <span
                                className={cn(
                                  'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wide',
                                  themeDeep
                                    ? 'border-amber-500/40 bg-amber-950/50 text-amber-300'
                                    : 'border-amber-300 bg-amber-50 text-amber-800'
                                )}
                              >
                                <Lock className="h-3 w-3 shrink-0" aria-hidden />
                                {hi ? 'प्रीमियम' : 'Premium'}
                              </span>
                            ) : !vaultUnlocked ? (
                              <span
                                className={cn(
                                  'rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wide',
                                  themeDeep
                                    ? 'border-emerald-500/40 text-emerald-300'
                                    : 'border-emerald-300 text-emerald-700'
                                )}
                              >
                                {hi ? 'नमूना' : 'Sample'}
                              </span>
                            ) : null}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </motion.div>

            <div
              className={cn(
                'flex items-center justify-between gap-3 border-t pt-4',
                themeDeep ? 'border-slate-800' : 'border-slate-100'
              )}
            >
              <span
                className={cn(
                  'text-xs font-extrabold uppercase tracking-wider',
                  themeDeep ? 'text-slate-400' : 'text-slate-500'
                )}
              >
                {hi ? 'पठन थीम (Theme)' : 'Reading Theme'}
              </span>
              <motion.div
                className={cn(
                  'flex items-center gap-1.5 rounded-2xl border p-1.5',
                  themeDeep ? 'border-slate-700 bg-slate-950/80' : 'border-slate-200 bg-slate-100/80 shadow-inner'
                )}
              >
                <Button
                  type="button"
                  variant={!themeDeep ? 'default' : 'ghost'}
                  size="sm"
                  className={cn(
                    'rounded-xl font-black px-4 py-2 h-9 transition-all active:scale-95',
                    !themeDeep ? 'bg-amber-500 text-slate-950 shadow-md hover:bg-amber-400' : 'text-slate-400 hover:text-slate-200'
                  )}
                  onClick={() => onThemeChange('paper')}
                >
                  <SunMedium className="mr-1.5 h-4 w-4 shrink-0" />
                  {hi ? 'हल्का' : 'Light'}
                </Button>
                <Button
                  type="button"
                  variant={themeDeep ? 'default' : 'ghost'}
                  size="sm"
                  className={cn(
                    'rounded-xl font-black px-4 py-2 h-9 transition-all active:scale-95',
                    themeDeep ? 'bg-slate-800 text-white shadow-md border border-slate-700 hover:bg-slate-700' : 'text-slate-600 hover:text-slate-900'
                  )}
                  onClick={() => onThemeChange('deep')}
                >
                  <Moon className="mr-1.5 h-4 w-4 shrink-0" />
                  {hi ? 'गहरा' : 'Dark'}
                </Button>
              </motion.div>
            </div>

            <div
              className={cn(
                'rounded-2xl p-4 border transition-colors',
                themeDeep ? 'bg-slate-950/40 border-slate-800 text-slate-400' : 'bg-slate-50/80 border-slate-100 text-slate-600'
              )}
            >
              <div className="flex items-start gap-2.5">
                <SlidersHorizontal className={cn('h-4 w-4 mt-0.5 shrink-0', themeDeep ? 'text-amber-500' : 'text-amber-600')} />
                <p className="text-xs leading-relaxed font-semibold">
                  {hi
                    ? 'सभी वर्ष ब्राउज़ करें। मुफ़्त: 2024 पेपर 1 — खंड A और B में सीमित नमूना; बाकी तुरंत लाइब्रेरी अनलॉक।'
                    : 'Browse every year. Free: 2024 Paper 1 samples in Part A & B; other papers show unlock instantly.'}
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
});

PyqDeskControls.displayName = 'PyqDeskControls';

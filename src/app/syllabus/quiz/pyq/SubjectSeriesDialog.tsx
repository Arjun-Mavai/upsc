'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Play,
  BookOpen,
  Calendar,
  LayoutGrid,
  Layers,
  LucideIcon,
  Lock,
  Loader2,
  Leaf,
  Atom,
  Network,
  Library,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useSettingsStore } from '@/store/useSettingsStore';
import { getSubjectPartAccess } from './actions';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { FREE_SUBJECTS } from '@/lib/pyq-constants';

interface SubjectSeriesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  subject: string;
  totalQuestions: number;
  onSelectSeries: (limit: number, offset: number) => void;
  isPro?: boolean;
}

const VARIANTS = {
  blue: {
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    border: 'border-blue-100',
    button: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200',
    icon: 'text-blue-500',
  },
  pink: {
    bg: 'bg-pink-50',
    text: 'text-pink-600',
    border: 'border-pink-100',
    button: 'bg-pink-600 hover:bg-pink-700 text-white shadow-pink-200',
    icon: 'text-pink-500',
  },
  emerald: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    border: 'border-emerald-100',
    button: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200',
    icon: 'text-emerald-500',
  },
  amber: {
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    border: 'border-amber-100',
    button: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-200',
    icon: 'text-amber-500',
  },
};

// Match colors from PYQPageClient
const SUBJECT_CONFIG: Record<string, { color: keyof typeof VARIANTS; icon: LucideIcon }> = {
  'MP GK': { color: 'amber', icon: BookOpen },
  History: { color: 'pink', icon: Calendar },
  Geography: { color: 'emerald', icon: LayoutGrid },
  Polity: { color: 'blue', icon: Layers },
  Economy: { color: 'amber', icon: Layers },
  Science: { color: 'pink', icon: Atom },
  ICT: { color: 'emerald', icon: LayoutGrid },
  'Current Affairs': { color: 'blue', icon: Calendar },
  'Environment & Ecology': { color: 'emerald', icon: Leaf },
  'Science & Technology': { color: 'pink', icon: Atom },
  'Art & Culture': { color: 'pink', icon: Library },
  'History (Ancient, Medieval, Modern)': { color: 'pink', icon: Calendar },
  'Polity (Indian Constitution & Governance)': { color: 'blue', icon: Layers },
  'Economy (Basic Economics & Indian Economy)': { color: 'amber', icon: Layers },
  'Geography (India & World)': { color: 'emerald', icon: LayoutGrid },
};

export function SubjectSeriesDialog({
  isOpen,
  onClose,
  subject,
  totalQuestions,
  onSelectSeries,
  isPro = false,
}: SubjectSeriesDialogProps) {
  const router = useRouter();
  const { language } = useSettingsStore();
  const hi = language === 'hi';
  const CHUNK_SIZE = 30;

  // Local state to track which part is currently being "opened" (loading)
  const [loadingPart, setLoadingPart] = React.useState<number | null>(null);

  // Use React Query for caching
  const { data: accessMap = {}, isLoading: loading } = useQuery({
    queryKey: ['subject-access', subject],
    queryFn: () => getSubjectPartAccess(subject),
    enabled: isOpen, // Only fetch when dialog is open
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
  });

  const config = SUBJECT_CONFIG[subject] || { color: 'blue', icon: Layers };
  const style = VARIANTS[config.color];
  const Icon = config.icon;

  const totalParts = Math.ceil(totalQuestions / CHUNK_SIZE);
  const parts = Array.from({ length: totalParts }, (_, i) => ({
    part: i + 1,
    start: i * CHUNK_SIZE + 1,
    end: Math.min((i + 1) * CHUNK_SIZE, totalQuestions),
    offset: i * CHUNK_SIZE,
  }));

  const handlePartClick = (part: number, offset: number, isLocked: boolean) => {
    if (isLocked) {
      return;
    }
    // Set loading state for this specific part
    setLoadingPart(part);
    // Trigger navigation
    onSelectSeries(CHUNK_SIZE, offset);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            data-overlay-open="true"
            className="fixed inset-x-0 bottom-0 z-[101] mx-auto max-h-[85vh] min-h-[50vh] w-full max-w-lg overflow-hidden rounded-t-[2.5rem] bg-white shadow-2xl sm:top-1/2 sm:bottom-auto sm:-translate-y-1/2 sm:rounded-[2.5rem]"
          >
            {/* Header */}
            <div className={cn('relative border-b px-6 py-5', style.bg, style.border)}>
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm',
                    style.text
                  )}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900">{subject}</h2>
                  <p className={cn('text-xs font-bold tracking-wider uppercase', style.text)}>
                    {totalQuestions} {hi ? 'प्रश्न' : 'Questions'} • {totalParts}{' '}
                    {hi ? 'भाग' : 'Parts'}
                  </p>
                </div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={onClose}
                className="absolute top-4 right-4 h-8 w-8 rounded-full bg-white/50 text-slate-500 hover:bg-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="max-h-[60vh] overflow-y-auto p-6">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {loading
                  ? // Skeleton Loading State
                    Array.from({ length: totalParts || 6 }).map((_, i) => (
                      <div
                        key={`skeleton-${i}`}
                        className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4"
                      >
                        <div className="space-y-2">
                          <div className="h-3 w-16 animate-pulse rounded bg-slate-100" />
                          <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
                        </div>
                        <div className="h-10 w-10 animate-pulse rounded-full bg-slate-100" />
                      </div>
                    ))
                  : parts.map((item) => {
                      const status = accessMap[item.part];

                      const hasStatus = Object.prototype.hasOwnProperty.call(accessMap, item.part);
                      const userHasAccess = hasStatus && !status?.isLocked;
                      const isFree = status?.isFree || FREE_SUBJECTS.includes(subject);
                      // Default to LOCKED if status is missing or explicitly locked
                      // Also wait for loading to complete
                      const locked = !isPro && !isFree && (!loading && (!hasStatus || !userHasAccess));

                      const isItemLoading = loadingPart === item.part;

                      return (
                        <motion.button
                          key={item.part}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onMouseEnter={() => {
                            if (!locked) {
                            const url = `/syllabus/quiz/play?mode=pyq-subject&subject=${encodeURIComponent(subject)}&limit=${CHUNK_SIZE}&offset=${item.offset}`;
                            router.prefetch(url);
                            }
                          }}
                          onClick={() => handlePartClick(item.part, item.offset, !!locked)}
                          disabled={!!locked || isItemLoading || loadingPart !== null}
                          className={cn(
                            'group relative flex items-center justify-between rounded-2xl border p-4 transition-all hover:shadow-lg',
                            locked
                              ? 'border-slate-100 bg-slate-50 opacity-80'
                              : 'border-slate-100 bg-white hover:border-slate-200',
                            (isItemLoading || (loadingPart !== null && !isItemLoading)) &&
                              'cursor-not-allowed opacity-70'
                          )}
                        >
                          <div className="text-left">
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  'block text-xs font-black tracking-widest uppercase',
                                  locked ? 'text-slate-400' : style.text
                                )}
                              >
                                {hi ? 'भाग' : 'Part'} {item.part}
                              </span>
                              {/* Badges */}
                              {!loading && (
                                <>
                                  {isFree ? (
                                    <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                                      FREE
                                    </span>
                                  ) : locked ? (
                                    <Lock className="h-3 w-3 text-slate-400" />
                                  ) : (
                                    <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                                      OPEN
                                    </span>
                                  )}
                                </>
                              )}
                            </div>

                            <span className="text-sm font-medium text-slate-500">
                              Q.{item.start} - Q.{item.end}
                            </span>
                          </div>

                          <div
                            className={cn(
                              'flex h-10 w-10 items-center justify-center rounded-full shadow-lg transition-transform',
                              !isItemLoading && 'group-hover:scale-110',
                              locked ? 'bg-slate-200 text-slate-400' : style.button
                            )}
                          >
                            {isItemLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin text-white" />
                            ) : locked ? (
                              <Lock className="h-4 w-4" />
                            ) : (
                              <Play className="ml-0.5 h-4 w-4 fill-current" />
                            )}
                          </div>
                        </motion.button>
                      );
                    })}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

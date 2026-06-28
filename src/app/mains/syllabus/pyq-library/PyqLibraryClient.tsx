'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Target, Sparkles, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { listMainsPyqPapersLibrarySummary, getMainsPyqPaperPublic } from '@/actions/mains-pyq-prepared-actions';
import { useSettingsStore } from '@/store/useSettingsStore';
import { SyllabusLockMainsModal } from '@/features/mains/components/SyllabusLockMainsModal';
import { cn } from '@/lib/utils';
import { PyqDeskControls } from './PyqDeskControls';
import { PyqLibraryHeader } from './PyqLibraryHeader';
import { PyqQuestionList, type QRow } from './PyqQuestionList';
import { PyqLibraryErrorBoundary } from './PyqLibraryErrorBoundary';
import { PyqNavigationGuide } from '@/components/mains/PyqNavigationGuide';
import {
  isMainsPyqDemoPaper,
  MAINS_PYQ_DEMO_PAPER_NUMBER,
  MAINS_PYQ_DEMO_YEAR,
} from '@/lib/mains-vault-demo';
import { AnimatePresence, motion } from 'framer-motion';
import dynamic from 'next/dynamic';

type Paper = {
  id: string;
  examYear: number;
  paperNumber: number;
  questionCount: number;
};

type ReadingTheme = 'deep' | 'paper';

type MainsPyqPaperListResponse =
  | { success: true; data: Array<{ id: string; examYear: number; paperNumber: number; questionCount: number }> }
  | { success: false; error: 'fetch_failed'; detail?: string };

let pyqPaperListCache: Paper[] | null = null;
const pyqQuestionsCache = new Map<string, QRow[]>();
const pyqFetchPromises = new Map<string, Promise<any>>();

function seedModuleCaches(papers: Paper[], paperId: string, questions: QRow[]) {
  if (papers.length > 0) pyqPaperListCache = papers;
  if (paperId && questions.length > 0) pyqQuestionsCache.set(paperId, questions);
}

function isPremiumLockedPaper(paper: Paper | undefined, vaultUnlocked: boolean) {
  if (!paper || vaultUnlocked) return false;
  return !isMainsPyqDemoPaper(paper.examYear, paper.paperNumber);
}

const AdminInsightsPanel = dynamic(() => import('./AdminInsightsPanel'), { ssr: false });

export function PyqLibraryClient({
  vaultUnlocked,
  allowDemoAccess,
  initialPapers = [],
  initialPaperId = '',
  initialQuestions = [],
  isAdmin = false,
}: {
  vaultUnlocked: boolean;
  allowDemoAccess: boolean;
  initialPapers?: Paper[];
  initialPaperId?: string;
  initialQuestions?: QRow[];
  isAdmin?: boolean;
}) {
  const hasServerSeed = initialPapers.length > 0;
  const cacheSeeded = useRef(false);
  useEffect(() => {
    if (hasServerSeed && !cacheSeeded.current) {
      seedModuleCaches(initialPapers, initialPaperId, initialQuestions);
      cacheSeeded.current = true;
    }
  }, [hasServerSeed, initialPapers, initialPaperId, initialQuestions]);

  const { language } = useSettingsStore();
  const hi = language === 'hi';

  const [papers, setPapers] = useState<Paper[]>(() =>
    hasServerSeed ? initialPapers : (pyqPaperListCache ?? [])
  );
  const [paperId, setPaperId] = useState(() => {
    if (initialPaperId) return initialPaperId;
    const cached = pyqPaperListCache ?? [];
    if (!vaultUnlocked) {
      const demo = cached.find(
        (p) => p.examYear === MAINS_PYQ_DEMO_YEAR && p.paperNumber === MAINS_PYQ_DEMO_PAPER_NUMBER
      );
      if (demo) return demo.id;
    }
    return cached[0]?.id ?? '';
  });
  const [questions, setQuestions] = useState<QRow[]>(() => {
    if (initialQuestions.length > 0) return initialQuestions;
    return paperId ? (pyqQuestionsCache.get(paperId) ?? []) : [];
  });

  const [loadingList, setLoadingList] = useState(!hasServerSeed && (pyqPaperListCache?.length ?? 0) === 0);
  const [loadingQ, setLoadingQ] = useState(false);
  const [papersError, setPapersError] = useState(false);
  const [papersErrorDetail, setPapersErrorDetail] = useState<string | null>(null);
  const [questionsLoadIssue, setQuestionsLoadIssue] = useState<'none' | 'not_found' | 'fetch_failed'>('none');

  const [readingTheme, setReadingTheme] = useState<ReadingTheme>('paper');
  const [deskControlsOpen, setDeskControlsOpen] = useState(false);
  const [partFilter, setPartFilter] = useState<string>('ALL');
  const [vaultModalOpen, setVaultModalOpen] = useState(false);
  const [showGlobalFilters, setShowGlobalFilters] = useState(true);
  const [showAdminInsights, setShowAdminInsights] = useState(true);

  const selectedPaper = useMemo(() => papers.find((p) => p.id === paperId), [papers, paperId]);
  const premiumLockedView = isPremiumLockedPaper(selectedPaper, vaultUnlocked);

  const loadList = useCallback(async (showLoading: boolean) => {
    if (showLoading) setLoadingList(true);
    const r = (await listMainsPyqPapersLibrarySummary()) as MainsPyqPaperListResponse;
    setLoadingList(false);
    setPapersError(!r.success);
    setPapersErrorDetail(!r.success && 'detail' in r ? (r.detail ?? null) : null);
    if (!r.success) {
      setPapers([]);
      return;
    }
    const list = (r.data ?? []).map((p) => ({
      id: p.id,
      examYear: p.examYear,
      paperNumber: p.paperNumber,
      questionCount: p.questionCount ?? 0,
    }));
    pyqPaperListCache = list;
    setPapers(list);
    if (list.length === 0) {
      setPaperId('');
      return;
    }
    setPaperId((prev) => {
      if (prev && list.some((p) => p.id === prev)) return prev;
      if (!vaultUnlocked) {
        const demo = list.find(
          (p) => p.examYear === MAINS_PYQ_DEMO_YEAR && p.paperNumber === MAINS_PYQ_DEMO_PAPER_NUMBER
        );
        if (demo) return demo.id;
      }
      return list[0]!.id;
    });

    if (!vaultUnlocked) {
      const demo = list.find(
        (p) => p.examYear === MAINS_PYQ_DEMO_YEAR && p.paperNumber === MAINS_PYQ_DEMO_PAPER_NUMBER
      );
      if (demo && !pyqQuestionsCache.has(demo.id)) {
        let promise = pyqFetchPromises.get(demo.id);
        if (!promise) {
          promise = getMainsPyqPaperPublic(demo.id);
          pyqFetchPromises.set(demo.id, promise);
        }
        void promise.then((res) => {
          if (res.success && res.data) {
            pyqQuestionsCache.set(demo.id, res.data.questions as QRow[]);
          }
          pyqFetchPromises.delete(demo.id);
        });
      }
    }
  }, [vaultUnlocked]);

  const currentPaperIdRef = useRef(paperId);
  useEffect(() => {
    currentPaperIdRef.current = paperId;
  }, [paperId]);

  const fetchQuestions = useCallback(async (pid: string, showLoading: boolean) => {
    if (showLoading) setLoadingQ(true);
    
    let promise = pyqFetchPromises.get(pid);
    if (!promise) {
      promise = getMainsPyqPaperPublic(pid);
      pyqFetchPromises.set(pid, promise);
    }
    
    try {
      const r = await promise;
      
      if (r.success && r.data) {
        const next = r.data.questions as QRow[];
        pyqQuestionsCache.set(pid, next);
        
        // Only update active component state if the user is still on this paper
        if (currentPaperIdRef.current === pid) {
          if (showLoading) setLoadingQ(false);
          setQuestions(next);
          setQuestionsLoadIssue('none');
        }
      } else {
        if (currentPaperIdRef.current === pid) {
          setQuestions([]);
          if (r.success === false) {
            setQuestionsLoadIssue(r.error === 'not_found' ? 'not_found' : 'fetch_failed');
          }
          if (showLoading) setLoadingQ(false);
        }
      }
    } catch (err) {
      if (currentPaperIdRef.current === pid) {
        setQuestions([]);
        setQuestionsLoadIssue('fetch_failed');
        if (showLoading) setLoadingQ(false);
      }
    } finally {
      pyqFetchPromises.delete(pid);
    }
  }, []);

  const handlePaperHover = useCallback(
    (pid: string) => {
      if (pyqQuestionsCache.has(pid)) return;
      const targetPaper = papers.find((p) => p.id === pid);
      if (!targetPaper || isPremiumLockedPaper(targetPaper, vaultUnlocked)) return;

      // Silently pre-fetch in the background
      void fetchQuestions(pid, false);
    },
    [papers, vaultUnlocked, fetchQuestions]
  );

  const applyPremiumLockedPaper = useCallback(() => {
    setQuestions([]);
    setQuestionsLoadIssue('none');
    setLoadingQ(false);
  }, []);

  const loadQs = useCallback(
    async (pid: string, paper?: Paper) => {
      if (!pid) return;
      const meta = paper ?? papers.find((p) => p.id === pid);

      if (isPremiumLockedPaper(meta, vaultUnlocked)) {
        applyPremiumLockedPaper();
        return;
      }

      const cached = pyqQuestionsCache.get(pid);
      if (cached) {
        setQuestions(cached);
        setQuestionsLoadIssue('none');
        setLoadingQ(false);
        return;
      }

      setQuestionsLoadIssue('none');
      await fetchQuestions(pid, true);
    },
    [papers, vaultUnlocked, fetchQuestions, applyPremiumLockedPaper]
  );

  useEffect(() => {
    void Promise.resolve().then(() => loadList(!hasServerSeed && (pyqPaperListCache?.length ?? 0) === 0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!paperId || pyqQuestionsCache.has(paperId)) return;
    // Initial load for the first paper if not seeded from server
    void loadQs(paperId, selectedPaper);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount for the initial paper if needed

  // Prefetch all papers in background if vault is unlocked for instant switching
  // ⚡ Rate-limited to 3 concurrent requests to avoid network saturation
  useEffect(() => {
    if (!vaultUnlocked || papers.length === 0) return;

    let activeCount = 0;
    let nextIndex = 0; // Shared counter ensures each paper claimed exactly once
    const maxConcurrent = 3;
    const queue = papers.filter(p => !pyqQuestionsCache.has(p.id));

    const processPaper = async (): Promise<void> => {
      if (nextIndex >= queue.length) return;

      activeCount++;
      const idx = nextIndex++; // Atomic claim of next item in queue
      const p = queue[idx];

      try {
        let promise = pyqFetchPromises.get(p.id);
        if (!promise) {
          promise = getMainsPyqPaperPublic(p.id);
          pyqFetchPromises.set(p.id, promise);
        }
        const res = await promise;
        if (res.success && res.data) {
          pyqQuestionsCache.set(p.id, res.data.questions as QRow[]);
        }
      } catch {
        // Fail silently, user can manually load
      } finally {
        pyqFetchPromises.delete(p.id);
        activeCount--;
        // Schedule next if queue not exhausted and under concurrency limit
        if (nextIndex < queue.length && activeCount < maxConcurrent) {
          void processPaper();
        }
      }
    };

    // Start 3 workers (each will claim from nextIndex)
    for (let i = 0; i < Math.min(maxConcurrent, queue.length); i++) {
      void processPaper();
    }
  }, [papers, vaultUnlocked]);

  const handlePaperChange = useCallback(
    (nextId: string) => {
      setPartFilter('ALL');
      setPaperId(nextId);
      
      const nextPaper = papers.find((p) => p.id === nextId);
      if (isPremiumLockedPaper(nextPaper, vaultUnlocked)) {
        applyPremiumLockedPaper();
        return;
      }
      
      const cached = pyqQuestionsCache.get(nextId);
      if (cached) {
        setQuestions(cached);
        setQuestionsLoadIssue('none');
        setLoadingQ(false);
        return;
      }
      
      // Start fetch immediately, don't wait for useEffect
      void loadQs(nextId, nextPaper);
    },
    [papers, vaultUnlocked, applyPremiumLockedPaper, loadQs]
  );

  const themeDeep = readingTheme === 'deep';
  const shell = cn(
    'relative min-h-screen w-screen max-w-[100vw] overflow-x-hidden px-2 pb-24 pt-5 sm:px-2.5 sm:pb-28 sm:pt-6',
    themeDeep ? 'text-slate-100' : 'bg-[#fafbfc] text-slate-900'
  );
  const blobClass = 'pointer-events-none absolute rounded-full blur-[100px] opacity-40';

  return (
    <motion.div className={shell} style={{ marginLeft: 'calc(50% - 50vw)', marginRight: 'calc(50% - 50vw)' }}>
      {!themeDeep ? (
        <>
          <div className={`${blobClass} top-[-80px] right-[-120px] h-[420px] w-[420px] bg-pink-100`} />
          <div className={`${blobClass} top-[30%] left-[-100px] h-[380px] w-[380px] bg-emerald-100`} />
          <div className={`${blobClass} bottom-[10%] right-[10%] h-[320px] w-[320px] bg-amber-100`} />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-50/80 to-transparent" />
        </>
      ) : null}

      <div className="relative mx-auto max-w-3xl px-1 sm:px-1.5">
        <div className="relative mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              className={cn(
                'h-9 px-3',
                themeDeep ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              )}
              asChild
            >
              <Link href="/mains/syllabus">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {hi ? 'सिलेबस' : 'Syllabus'}
              </Link>
            </Button>
            <PyqNavigationGuide themeDeep={themeDeep} triggerType="icon" />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowGlobalFilters(!showGlobalFilters)}
              className={cn(
                'group flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 active:scale-90 shadow-md border-2',
                showGlobalFilters
                  ? themeDeep
                    ? 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                    : 'bg-white border-slate-100 text-slate-400 hover:text-slate-600 shadow-slate-200/40'
                  : themeDeep
                    ? 'bg-emerald-950 border-emerald-500 text-emerald-400 shadow-emerald-900/40 ring-4 ring-emerald-500/10'
                    : 'bg-pink-600 border-pink-500 text-white shadow-pink-200 ring-4 ring-pink-500/10'
              )}
              title={hi ? 'फोकस मोड: विवरण दिखाएं/छिपाएं' : 'Focus Mode: Show/Hide details'}
            >
              <Sparkles
                className={cn(
                  'h-[18px] w-[18px] transition-transform duration-500',
                  !showGlobalFilters && 'rotate-12 scale-110'
                )}
              />
            </button>

            {isAdmin && !showAdminInsights && (
              <button
                type="button"
                onClick={() => setShowAdminInsights(true)}
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 shadow-sm transition-transform hover:-translate-y-0.5 active:scale-95',
                  themeDeep
                    ? 'border-sky-500/20 bg-slate-900 text-sky-400 hover:border-sky-500/40 hover:text-sky-300 shadow-md shadow-sky-950/20'
                    : 'border-sky-200 bg-sky-50 text-sky-700 hover:border-sky-400 hover:bg-sky-100/50 shadow-md shadow-sky-100/30'
                )}
                title="Show Admin Insights"
              >
                <ShieldCheck className="h-[18px] w-[18px]" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setDeskControlsOpen(!deskControlsOpen)}
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 shadow-sm transition-transform hover:-translate-y-0.5 active:scale-95',
                deskControlsOpen
                  ? themeDeep
                    ? 'border-amber-400 bg-amber-950/60 text-amber-300 shadow-md shadow-amber-500/15'
                    : 'border-amber-500 bg-amber-500 text-white shadow-md shadow-amber-500/20'
                  : themeDeep
                    ? 'border-slate-700 bg-slate-900 text-slate-300 hover:border-amber-500/50 hover:text-amber-300'
                    : 'border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-400 hover:bg-amber-100/50'
              )}
              aria-expanded={deskControlsOpen}
              aria-label={hi ? 'पेपर, थीम व विवरण' : 'Paper, theme & description'}
            >
              <Target className="h-[18px] w-[18px]" aria-hidden />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showGlobalFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <PyqLibraryHeader readingTheme={readingTheme} />
            </motion.div>
          )}
        </AnimatePresence>

        <PyqDeskControls
          papers={papers}
          paperId={paperId}
          onPaperChange={handlePaperChange}
          onPaperHover={handlePaperHover}
          readingTheme={readingTheme}
          onThemeChange={setReadingTheme}
          deskControlsOpen={deskControlsOpen}
          onControlsToggle={setDeskControlsOpen}
          vaultUnlocked={vaultUnlocked}
        />

        {isAdmin && showAdminInsights && questions.length > 0 && (
          <AdminInsightsPanel
            questions={questions}
            selectedPaper={selectedPaper}
            themeDeep={themeDeep}
            onHide={() => setShowAdminInsights(false)}
          />
        )}

        <PyqLibraryErrorBoundary
          readingTheme={readingTheme}
          papersError={papersError}
          papersErrorDetail={papersErrorDetail}
          questionsLoadIssue={questionsLoadIssue}
          loadingList={loadingList}
          loadingQ={loadingQ && !premiumLockedView}
          papersCount={papers.length}
          onRetryPapers={() => loadList(true)}
        >
          <PyqQuestionList
            key={paperId}
            questions={questions}
            paperNumber={selectedPaper?.paperNumber ?? 1}
            examYear={selectedPaper?.examYear ?? 0}
            paperQuestionCount={selectedPaper?.questionCount ?? 0}
            partFilter={partFilter}
            onPartFilterChange={setPartFilter}
            readingTheme={readingTheme}
            vaultUnlocked={vaultUnlocked}
            allowDemoAccess={allowDemoAccess}
            onVaultModalOpen={() => setVaultModalOpen(true)}
            showGlobalFilters={showGlobalFilters}
          />
        </PyqLibraryErrorBoundary>
      </div>

      <SyllabusLockMainsModal open={vaultModalOpen} onOpenChange={setVaultModalOpen} />
    </motion.div>
  );
}

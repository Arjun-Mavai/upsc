'use client';

import { useState, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  adminGetPyqPrepOverview,
  adminGetPyqPaperPrepDetail,
  adminBuildPyqAnswersBatchPrompt,
  adminPastePyqAnswersBatchJson,
  purgeAllMainsPyqPreparedVariantsConfirm,
  purgeMainsPyqPreparedVariantsForPaper,
} from '@/actions/mains-pyq-prepared-actions';
import {
  adminGetQuestionStem,
  updateMainsPyqQuestionStemAdmin,
} from '@/actions/mains-pyq-actions';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Copy, Sparkles, Save, BarChart3, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { RecentPyqPrepActivity } from '@/app/admin/mains-pyq/RecentPyqPrepActivity';
import type { AdminMainsPyqPaperOption } from '@/app/admin/mains-pyq/MainsPyqAdminClient';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MAINS_PYQ_PREPARED_VARIANTS_PURGE_PHRASE } from '@/config/mains-pyq-admin';
import { useSettingsStore } from '@/store/useSettingsStore';

const BATCH_SLOTS = 4;

type BatchWorkspace = {
  paperId: string;
  promptPreview: string;
  pasteJson: string;
  targetQuestionId: string;
  editingQuestionHi: string;
  editingQuestionEn: string;
  loadingStem: boolean;
  savingStem: boolean;
};

function emptyWorkspaces(): BatchWorkspace[] {
  return Array.from({ length: BATCH_SLOTS }, () => ({
    paperId: '',
    promptPreview: '',
    pasteJson: '',
    targetQuestionId: '',
    editingQuestionHi: '',
    editingQuestionEn: '',
    loadingStem: false,
    savingStem: false,
  }));
}

export function MainsPyqPreparedAnswersSection({ papers }: { papers: AdminMainsPyqPaperOption[] }) {
  const [workspaces, setWorkspaces] = useState<BatchWorkspace[]>(emptyWorkspaces);
  const [activeWs, setActiveWs] = useState(0);
  const [loadingType, setLoadingType] = useState<'generate' | 'save' | null>(null);
  const [variantPurgeText, setVariantPurgeText] = useState('');
  const [variantPurging, setVariantPurging] = useState(false);
  const [purgeTargetId, setPurgeTargetId] = useState<string>('ALL');

  const lang = useSettingsStore((s) => s.language);
  const hi = lang === 'hi';

  const patchWorkspace = useCallback((index: number, patch: Partial<BatchWorkspace>) => {
    setWorkspaces((prev) => {
      const next = [...prev];
      if (next[index]) {
        next[index] = { ...next[index], ...patch };
      }
      return next;
    });
  }, []);

  const handleTargetQuestionChange = async (index: number, val: string) => {
    const qid = val === 'none' ? '' : val;
    patchWorkspace(index, { targetQuestionId: qid });
    
    if (qid) {
      patchWorkspace(index, { loadingStem: true });
      const r = await adminGetQuestionStem(qid);
      if (r.success && r.data) {
        patchWorkspace(index, { 
          editingQuestionHi: r.data.questionHi, 
          editingQuestionEn: r.data.questionEn || '',
          loadingStem: false 
        });
      } else {
        patchWorkspace(index, { loadingStem: false });
        toast.error('Failed to load question stem from DB');
      }
    } else {
      patchWorkspace(index, { 
        editingQuestionHi: '', 
        editingQuestionEn: '',
        loadingStem: false 
      });
    }
  };

  const handleSaveStem = async (index: number) => {
    const ws = workspaces[index];
    if (!ws?.targetQuestionId || !ws.editingQuestionHi.trim()) return;
    patchWorkspace(index, { savingStem: true });
    const r = await updateMainsPyqQuestionStemAdmin({
      questionId: ws.targetQuestionId,
      questionHi: ws.editingQuestionHi,
      questionEn: ws.editingQuestionEn || null,
    });
    patchWorkspace(index, { savingStem: false });
    if (r.success) {
      toast.success('Question stem updated successfully in DB');
      const pid = workspaces[index]?.paperId;
      if (pid) await loadDetail(pid);
    } else {
      toast.error(r.error || 'Failed to save question stem');
    }
  };

  const paperId = workspaces[activeWs]?.paperId ?? '';
  const { data: overview, refetch: loadOverview } = useQuery({
    queryKey: ['admin-pyq-prep-overview'],
    queryFn: async () => {
      const r = await adminGetPyqPrepOverview();
      if (!r.success) throw new Error(r.error || 'Failed to load overview');
      return r.data;
    }
  });

  const { data: detailRaw, isLoading: detailLoading, refetch: loadDetailQuery } = useQuery({
    queryKey: ['admin-pyq-prep-detail', paperId],
    queryFn: async () => {
      if (!paperId) return null;
      const r = await adminGetPyqPaperPrepDetail(paperId);
      if (!r.success) throw new Error((r as any).error || 'Detail load failed');
      return r.data;
    },
    enabled: !!paperId
  });

  const detail = detailRaw ? {
    progress: detailRaw.progress,
    questions: detailRaw.questions.map((q) => ({
      id: q.id,
      variantCount: q.variantCount,
      previewHi: q.previewHi,
      previewEn: q.previewEn,
      marks: q.marks,
      part: q.part,
    })),
  } : null;

  const loadDetail = async (pid: string) => {
    await loadDetailQuery();
  };

  useEffect(() => {
    if (papers.length === 0) {
      setWorkspaces(emptyWorkspaces());
      return;
    }
    setWorkspaces((prev) =>
      prev.map((w) =>
        w.paperId && papers.some((p) => p.id === w.paperId) ? w : { ...w, paperId: papers[0]!.id }
      )
    );
  }, [papers]);



  const pctBoth =
    overview && overview.totalQuestions > 0
      ? Math.round((overview.questionsWithTwoVariants / overview.totalQuestions) * 100)
      : 0;

  const anyVariant = overview?.questionsWithAnyVariant ?? overview?.questionsWithTwoVariants ?? 0;
  const pctAny =
    overview && overview.totalQuestions > 0 ? Math.round((anyVariant / overview.totalQuestions) * 100) : 0;

  const paperPct =
    detail && detail.progress.total > 0
      ? Math.round((detail.progress.done / detail.progress.total) * 100)
      : 0;

  const [showPrepGuide, setShowPrepGuide] = useState(false);
  const [showTracker, setShowTracker] = useState(true);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeStr = currentTime?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) ?? '';
  const dateStr = currentTime?.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) ?? '';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-xl font-black text-slate-900">
          <Sparkles className="h-6 w-6 text-amber-500" />
          Ready-to-write answers (2 variants × bilingual)
        </h2>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs font-bold text-slate-500 hover:text-indigo-600"
            onClick={() => setShowTracker(!showTracker)}
          >
            {showTracker ? 'Hide Tracker ↑' : 'Show Tracker ↓'}
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs font-bold text-slate-500 hover:text-amber-600"
            onClick={() => setShowPrepGuide(!showPrepGuide)}
          >
            {showPrepGuide ? 'Hide Help & Purge Tools ↑' : 'Show Help & Purge Tools ↓'}
          </Button>
        </div>
      </div>

      <Card className="border-amber-100 bg-gradient-to-r from-amber-50/80 to-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-[200px]">
            <BarChart3 className="h-8 w-8 text-amber-600" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black uppercase tracking-wider text-amber-900/70">Global tracker</p>
              <p className="text-sm font-bold text-slate-800">
                {overview ? (
                  <>
                    Both variants:{' '}
                    <span className="tabular-nums">
                      {overview.questionsWithTwoVariants} / {overview.totalQuestions}
                    </span>{' '}
                    ({pctBoth}%)
                  </>
                ) : (
                  'Loading…'
                )}
              </p>
              <Progress value={pctBoth} className="mt-2 h-2" />
            </div>
          </div>
        </div>
      </Card>

      <RecentPyqPrepActivity />

      <Card 
        className="border-indigo-100 bg-white shadow-sm overflow-hidden transition-all duration-300"
      >
        <div 
          className="bg-indigo-50/50 px-4 py-3 border-b border-indigo-100 flex items-center justify-between cursor-pointer hover:bg-indigo-100/50 transition-colors"
          onClick={() => setShowTracker(!showTracker)}
        >
           <div className="flex items-center gap-2">
             <div className="p-1.5 rounded-md bg-indigo-600">
               <BarChart3 className="h-4 w-4 text-white" />
             </div>
             <div>
               <div className="flex items-center gap-2">
                 <h3 className="text-sm font-black text-indigo-900 uppercase tracking-wider">Model Answers Tracker</h3>
                 {showTracker ? <ChevronUp className="h-4 w-4 text-indigo-400" /> : <ChevronDown className="h-4 w-4 text-indigo-400" />}
               </div>
               <p className="text-[10px] font-bold text-indigo-600/60 uppercase">Real-time completion status across all papers</p>
             </div>
           </div>
           <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 text-[10px] font-black uppercase">
             {papers.length} Papers Active
           </Badge>
        </div>
        {showTracker && (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
            {papers.map((p) => {
              const total = p.qCount ?? 0;
              const done = p.doneCount ?? 0;
              const missing = total - done;
              const isComplete = total > 0 && done === total;
              const pct = total > 0 ? Math.round((done / total) * 100) : 0;
              
              return (
                <div key={p.id} className={`p-4 rounded-2xl border transition-all hover:shadow-md ${isComplete ? 'border-emerald-200 bg-emerald-50/40' : 'border-slate-100 bg-slate-50/50'}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`h-1.5 w-1.5 rounded-full ${isComplete ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'}`} />
                        <p className="text-xs font-black text-slate-900 truncate">{p.examYear} · Paper {p.paperNumber}</p>
                      </div>
                      <p className="text-[9px] text-slate-500 font-bold uppercase truncate pl-3">{p.titleEn || p.slug.slice(0, 25)}</p>
                    </div>
                    {isComplete ? (
                      <div className="flex flex-col items-end gap-1">
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                        <span className="text-[8px] font-black text-emerald-600 uppercase">Success</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] font-black text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">{pct}%</span>
                        <span className="text-[8px] font-bold text-slate-400 uppercase">In Progress</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-end">
                      <div className="flex flex-col">
                         <span className="text-[10px] font-black text-slate-700">DONE: {done}</span>
                         <span className={`text-[9px] font-bold ${missing > 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                           MISSING: {missing}
                         </span>
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Total {total} Qs</span>
                    </div>
                    <div className="relative h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                       <div 
                         className={`absolute inset-y-0 left-0 transition-all duration-1000 ${isComplete ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                         style={{ width: `${pct}%` }}
                       />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {showPrepGuide && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <Card className="border-slate-200 bg-slate-50/90 p-4 text-sm leading-relaxed text-slate-700">
            <p className="font-black text-slate-900">Parallel batches (same 70-Q paper)</p>
            <p className="mt-2 text-xs">
              Use tabs <strong>Batch 1–4</strong>: each slot keeps its own prompt + pasted JSON — open four AI chats,
              paste four different prompts, paste results back without overwriting.{' '}
              <strong>Generate prompt</strong> picks stems <strong>9–16</strong> for Batch&nbsp;2, <strong>17–24</strong> for Batch&nbsp;3,
              etc. (after sorting incomplete-first), so parallel tabs no longer all request the same first eight questions.
              Same paper can be selected in every slot or mix papers.
            </p>
          </Card>

          <Card className="border-indigo-100 bg-indigo-50/70 p-4 text-sm leading-relaxed text-slate-700">
            <p className="font-black text-indigo-950">“Some rows skipped” / row-wise recovery — kya regenerate se phir aaenge?</p>
            <p className="mt-2 text-xs">
              <strong>Haan:</strong>{' '}
              <strong>Generate prompt</strong> pehle un stems ko prefer karta hai jin par abhi kam se kam ek bhi variant
              complete nahi (dono slots nahi bharne tak wo “incomplete” pool mein rahenge). Paste me jo row corrupt thi /
              skip hui wo DB par save{' '}
              <em>nahi</em> hoti — iska matlab us stem par kuch corrupt data add nahi hua.
            </p>
          </Card>

          <Card className="border-slate-200 bg-slate-50/90 p-4 text-sm leading-relaxed text-slate-700">
            <p className="font-black text-slate-900">Tables & connections (prepared answers)</p>
            <ol className="mt-2 list-decimal space-y-2 pl-5 text-xs">
              <li>
                <code className="rounded bg-white px-1 text-xs">mains_pyq_papers</code> — one row per imported exam year
                + paper number.
              </li>
              <li>
                <code className="rounded bg-white px-1 text-xs">mains_pyq_questions</code> — each stem;{' '}
                <code className="text-xs">paper_id</code> → that paper.
              </li>
              <li>
                <code className="rounded bg-white px-1 text-xs">mains_pyq_prepared_variants</code> — model answers only;
                each row has <code className="text-xs">pyq_question_id</code> → stem, plus <code className="text-xs">variant_slot</code> 1 or 2.
              </li>
            </ol>
          </Card>

          <Card className="border-rose-200 bg-rose-50/60 p-4">
            <p className="text-xs font-black uppercase tracking-wider text-rose-900/80">Reset prepared answers only</p>
            <p className="mt-1 text-xs text-slate-700">
              Type{' '}
              <code className="rounded bg-white px-1 font-mono text-xs text-rose-800">
                {MAINS_PYQ_PREPARED_VARIANTS_PURGE_PHRASE}
              </code>{' '}
              exactly, then confirm — wipes every row in <code className="text-xs">mains_pyq_prepared_variants</code>.
            </p>
            <div className="mt-3 flex flex-wrap items-end gap-2">
              <div className="min-w-[220px] flex-1">
                <Label className="text-[10px] font-bold text-slate-600 uppercase">Confirmation</Label>
                <Input
                  value={variantPurgeText}
                  onChange={(e) => setVariantPurgeText(e.target.value)}
                  placeholder={MAINS_PYQ_PREPARED_VARIANTS_PURGE_PHRASE}
                  className="mt-1 font-mono text-xs h-8"
                  autoComplete="off"
                />
              </div>
              <div className="min-w-[180px]">
                <Label className="text-[10px] font-bold text-slate-600 uppercase">Target Paper</Label>
                <Select value={purgeTargetId} onValueChange={setPurgeTargetId}>
                  <SelectTrigger className="mt-1 font-semibold text-xs h-8">
                    <SelectValue placeholder="All Papers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Papers (Global Wipe)</SelectItem>
                    {papers.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.examYear} · Paper {p.paperNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                variant="destructive"
                className="font-black text-xs h-8"
                disabled={variantPurging}
                onClick={async () => {
                  setVariantPurging(true);
                  let r;
                  if (purgeTargetId === 'ALL') {
                    r = await purgeAllMainsPyqPreparedVariantsConfirm(variantPurgeText);
                  } else {
                    if (variantPurgeText !== MAINS_PYQ_PREPARED_VARIANTS_PURGE_PHRASE) {
                      toast.error('Confirmation phrase does not match');
                      setVariantPurging(false);
                      return;
                    }
                    r = await purgeMainsPyqPreparedVariantsForPaper(purgeTargetId);
                  }
                  setVariantPurging(false);
                  if (!r.success) {
                    toast.error((r as { error?: string }).error ?? 'Clear failed');
                    return;
                  }
                  toast.success(purgeTargetId === 'ALL' ? 'All prepared answer variants removed' : 'Paper variants removed');
                  setVariantPurgeText('');
                  await loadOverview();
                  if (paperId) await loadDetail(paperId);
                }}
              >
                {variantPurging ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {purgeTargetId === 'ALL' ? 'Wipe All' : 'Wipe Paper'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {papers.length === 0 ? (
        <p className="text-slate-500">Import a PYQ paper first.</p>
      ) : (
        <Tabs value={String(activeWs)} onValueChange={(v) => setActiveWs(Number(v))} className="w-full space-y-4">
          <TabsList className="grid h-auto w-full grid-cols-2 gap-1 p-1 sm:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <TabsTrigger key={i} value={String(i)} className="text-xs font-black sm:text-sm">
                Batch {i + 1}
              </TabsTrigger>
            ))}
          </TabsList>

          {[0, 1, 2, 3].map((i) => (
            <TabsContent key={i} value={String(i)} className="space-y-4">
              <div className="flex flex-wrap items-end gap-3">
                <div className="min-w-[320px] flex-1 sm:max-w-[450px]">
                  <label className="mb-1 block text-xs font-bold text-slate-600">Imported paper</label>
                  <Select
                    value={workspaces[i]?.paperId ?? ''}
                    onValueChange={(v) => patchWorkspace(i, { paperId: v })}
                  >
                    <SelectTrigger className="font-semibold h-11 border-slate-300 shadow-sm">
                      <SelectValue placeholder="Pick paper" />
                    </SelectTrigger>
                    <SelectContent
                      position="popper"
                      sideOffset={5}
                      viewportClassName="max-h-[300px] overflow-y-auto"
                      className="w-[var(--radix-select-trigger-width)]"
                    >
                      {papers.map((p) => {
                        const total = p.qCount ?? 0;
                        const done = p.doneCount ?? 0;
                        const isComplete = total > 0 && done === total;
                        const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                        
                        return (
                          <SelectItem key={p.id} value={p.id} className="py-2 cursor-pointer">
                            <div className="flex items-center justify-between w-full gap-8">
                              <div className="flex flex-col">
                                <span className="font-bold text-sm">
                                  {p.examYear} · Paper {p.paperNumber}
                                </span>
                                <span className="text-[10px] text-slate-500 font-medium">
                                  {p.titleEn || p.slug.slice(0, 30)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className={`text-[11px] font-black tabular-nums ${isComplete ? 'text-emerald-600' : 'text-slate-500'}`}>
                                  {done}/{total} ({pct}%)
                                </span>
                                {isComplete ? (
                                  <CheckCircle2 className="h-4 w-4 text-emerald-500 fill-emerald-50" />
                                ) : (
                                  <div className="h-4 w-4 rounded-full border-2 border-slate-200 border-t-amber-400" />
                                )}
                              </div>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                {activeWs === i && detail && !detailLoading ? (
                  <Badge variant="outline" className="mb-2 font-black">
                    This paper: {detail.progress.done}/{detail.progress.total} both variants ({paperPct}%)
                  </Badge>
                ) : null}
              </div>

              {activeWs === i && detailLoading ? (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading paper progress…
                </div>
              ) : activeWs === i && detail ? (
                <div className="max-h-36 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs">
                  {detail.questions.slice(0, 40).map((q) => (
                    <div key={q.id} className="flex items-center gap-2 border-b border-slate-100 py-1 last:border-0">
                      <span
                        className={
                          q.variantCount >= 2 ? 'font-bold text-emerald-600' : 'font-bold text-amber-700'
                        }
                      >
                        {q.variantCount}/2
                      </span>
                      <span className="text-slate-500">
                        {q.marks}m · {q.part}
                      </span>
                      <span className="line-clamp-1 text-slate-700">
                        {hi ? q.previewHi : (q.previewEn || q.previewHi)}
                      </span>
                    </div>
                  ))}
                  {detail.questions.length > 40 ? (
                    <p className="py-1 text-slate-400">+ {detail.questions.length - 40} more…</p>
                  ) : null}
                </div>
              ) : null}

              {detail?.questions && detail.questions.length > 0 ? (
                <Card className="mt-4 border-slate-200 bg-white p-3">
                  <Label className="mb-1.5 block text-xs font-bold text-slate-700">Targeted Regeneration (Optional)</Label>
                  <Select
                    value={workspaces[i]?.targetQuestionId || ''}
                    onValueChange={(val) => handleTargetQuestionChange(i, val)}
                  >
                    <SelectTrigger className="h-9 w-full text-xs">
                      <SelectValue placeholder="Select a specific stem to regenerate..." />
                    </SelectTrigger>
                    <SelectContent
                      position="popper"
                      sideOffset={5}
                      viewportClassName="max-h-[300px] overflow-y-auto"
                      className="w-[var(--radix-select-trigger-width)]"
                    >
                      <SelectItem value="none" className="text-slate-400 italic text-xs cursor-pointer">-- Full Batch Mode --</SelectItem>
                      {detail.questions.map((q) => {
                        const text = hi ? q.previewHi : (q.previewEn || q.previewHi);
                        return (
                          <SelectItem key={q.id} value={q.id} className="text-xs cursor-pointer py-2" title={text}>
                            <span className="font-semibold text-slate-800">{q.marks}m · {q.part}</span> · {text.slice(0, 100)}{text.length > 100 ? '...' : ''}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>

                  {workspaces[i]?.targetQuestionId && (
                    <div className="mt-3.5 border-t border-dashed border-slate-200 pt-3.5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                          Stem Direct Editor
                        </span>
                        <span className="text-[9px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 dark:bg-amber-950/20 dark:border-amber-900/30">
                          Fix truncation or gaddhans here
                        </span>
                      </div>
                      
                      {workspaces[i]?.loadingStem ? (
                        <div className="flex items-center justify-center py-6 text-slate-400 text-xs gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                          Loading complete stem from database...
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div>
                            <Label className="mb-1 block text-[10px] font-bold text-slate-600">Hindi Question Stem (Passage / Gaddhans)</Label>
                            <Textarea
                              value={workspaces[i]?.editingQuestionHi ?? ''}
                              onChange={(e) => patchWorkspace(i, { editingQuestionHi: e.target.value })}
                              placeholder="Enter full Hindi passage or question stem word-for-word..."
                              className="text-xs font-bold font-[family-name:var(--font-pyq-dev)] leading-relaxed h-28"
                            />
                          </div>

                          <div>
                            <Label className="mb-1 block text-[10px] font-bold text-slate-600">English Question Stem (Optional / Translation)</Label>
                            <Textarea
                              value={workspaces[i]?.editingQuestionEn ?? ''}
                              onChange={(e) => patchWorkspace(i, { editingQuestionEn: e.target.value })}
                              placeholder="Enter English translation (if any)..."
                              className="text-xs font-medium h-16"
                            />
                          </div>

                          <Button
                            type="button"
                            size="sm"
                            disabled={workspaces[i]?.savingStem || !workspaces[i]?.editingQuestionHi?.trim()}
                            onClick={() => handleSaveStem(i)}
                            className="w-full text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 flex items-center justify-center h-8 cursor-pointer rounded-lg shadow-sm"
                          >
                            {workspaces[i]?.savingStem ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Save className="h-3.5 w-3.5" />
                            )}
                            Save Complete Stem to DB
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              ) : null}

              <Card className="p-4 mt-4">
                <h3 className="mb-2 font-black text-slate-900">
                  {(() => {
                    if (workspaces[i]?.targetQuestionId) {
                      return `① Build single prompt (Targeted Stem Only)`;
                    }
                    const pObj = papers.find(p => p.id === workspaces[i]?.paperId);
                    const bSize = pObj?.paperNumber === 6 ? 2 : 8;
                    return `① Build batch prompt (Batch ${i + 1} → stems ${i * bSize + 1}–${(i + 1) * bSize} in incomplete-first pool)`;
                  })()}
                </h3>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    className="font-black"
                    disabled={loadingType !== null || !(workspaces[i]?.paperId)}
                    onClick={async () => {
                      const pid = workspaces[i]?.paperId;
                      const targetId = workspaces[i]?.targetQuestionId;
                      if (!pid) return;
                      const pObj = papers.find(p => p.id === pid);
                      const bSize = pObj?.paperNumber === 6 ? 2 : 8;
                      setActiveWs(i);
                      setLoadingType('generate');
                      
                      try {
                        let r;
                        if (targetId) {
                          r = await adminBuildPyqAnswersBatchPrompt(pid, 1, 0, targetId);
                        } else {
                          r = await adminBuildPyqAnswersBatchPrompt(pid, bSize, i);
                        }
                        
                        if (!r.success) {
                          toast.error((r as { error?: string }).error ?? 'Prompt failed');
                          return;
                        }
                        patchWorkspace(i, { promptPreview: r.prompt });
                        if (targetId) {
                          toast.success(`Generated targeted prompt for 1 stem`);
                        } else {
                          toast.success(
                            `Batch ${i + 1}: ${r.meta.count} question(s) in prompt (pool order #${i * bSize + 1}–${i * bSize + r.meta.count})`
                          );
                        }
                      } catch (err: any) {
                        toast.error(err?.message || 'An unexpected error occurred while generating the prompt.');
                      } finally {
                        setLoadingType(null);
                      }
                    }}
                  >
                    {loadingType === 'generate' && activeWs === i ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    {workspaces[i]?.targetQuestionId ? 'Generate for selected stem' : 'Generate prompt'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!workspaces[i]?.promptPreview}
                    className="font-bold"
                    onClick={async () => {
                      const t = workspaces[i]?.promptPreview ?? '';
                      try {
                        await navigator.clipboard.writeText(t);
                        toast.success(`Batch ${i + 1} prompt copied`);
                      } catch {
                        toast.error('Clipboard failed');
                      }
                    }}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy prompt
                  </Button>
                </div>
                <Textarea
                  value={workspaces[i]?.promptPreview ?? ''}
                  readOnly
                  onFocus={() => setActiveWs(i)}
                  placeholder="Generate prompt — use in Gemini / ChatGPT as one user message."
                  className="mt-3 h-[120px] min-h-[100px] font-mono text-[11px]"
                />
              </Card>

              <Card className="p-4">
                <h3 className="mb-2 font-black text-slate-900">② Paste AI JSON → save variants</h3>
                <Textarea
                  value={workspaces[i]?.pasteJson ?? ''}
                  onChange={(e) => patchWorkspace(i, { pasteJson: e.target.value })}
                  onFocus={() => setActiveWs(i)}
                  placeholder='variants[]: variant_slot (1|2), style_label_hi + style_label_en, answer_hi, answer_en · legacy style_label=treated as EN'
                  className="h-[120px] min-h-[100px] font-mono text-[11px]"
                />
                <Button
                  type="button"
                  className="mt-3 bg-emerald-600 font-black hover:bg-emerald-700"
                  disabled={loadingType !== null || !(workspaces[i]?.pasteJson ?? '').trim() || !(workspaces[i]?.paperId)}
                  onClick={async () => {
                    const pid = workspaces[i]?.paperId;
                    const paste = workspaces[i]?.pasteJson ?? '';
                    if (!pid || !paste.trim()) return;
                    setActiveWs(i);
                    setLoadingType('save');
                    
                    try {
                      const r = await adminPastePyqAnswersBatchJson(pid, paste);
                      if (!r.success) {
                        const msg = (r as { error?: string }).error ?? 'Save failed';
                        toast.error(msg.length > 120 ? 'JSON / paste rejected — expand details ↓' : msg, {
                          description: msg.length > 120 ? msg : undefined,
                          duration: 28_000,
                        });
                        return;
                      }
                      const typed = r as {
                        variantsUpserted?: number;
                        insightQuestionsUpdated?: number;
                        warningCount?: number;
                        warnings?: string[];
                      };
                      toast.success(
                        `Batch ${i + 1} saved — ${typed.variantsUpserted ?? 0} variants, ${typed.insightQuestionsUpdated ?? 0} insights`
                      );
                      if (typed.warningCount && (typed.warnings?.length ?? 0) > 0) {
                        toast.message('Some rows were skipped', {
                          description: typed.warnings!.slice(0, 8).join('\n'),
                          duration: 12_000,
                        });
                      }
                      patchWorkspace(i, { pasteJson: '' });
                      await loadOverview();
                      await loadDetail(pid);
                    } catch (err: any) {
                      toast.error(err?.message || 'An unexpected error occurred while saving to database. Ensure your JSON is valid.');
                    } finally {
                      setLoadingType(null);
                    }
                  }}
                >
                  {loadingType === 'save' && activeWs === i ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  <Save className="mr-2 h-4 w-4" />
                  Save batch to database
                </Button>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}

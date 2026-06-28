'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  adminDeleteMainsContentForTopic,
  getMainsProgressOverview,
  getMainsSyllabusTree,
} from '@/actions/mains-actions';
import { adminApplyMainsContentJson } from '@/actions/mains-ai-actions';
import {
  getMainsFullAiPromptForTopic,
  buildMainsTopicAiUserBlock,
  adminListPyqCandidatesForTopic,
  adminLinkTopicPyq,
  adminUnlinkTopicPyq,
  type MainsFullPromptMeta,
  type PyqCandidateRow,
} from '@/actions/mains-pyq-actions';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import {
  Database,
  Copy,
  Save,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Loader2,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { MAINS_TOPIC_AI_SYSTEM_PROMPT, buildPaperLevelPromptForExternalAi } from '@/config/mains-topic-ai-prompt';
import { RecentMainsSyllabusActivity } from './RecentMainsSyllabusActivity';
import { MainsSyllabusProgressTracker } from './MainsSyllabusProgressTracker';

const WORKFLOW = `BACKEND (paper-wise storage)
• mains_papers → mains_units (paper + Part A/B + unit_number) → mains_topics (syllabus lines)
• mains_content = concept + strategy + modelAnswers columns + optional rich_payload (Expert-Rich JSON from AI)
• mains_pyq_papers + mains_pyq_questions = official PYQ import
• mains_topic_pyq_links = OPTIONAL fine map (topic ↔ exact PYQ stem) — LATEST prompt block me sabse upar context
• Unit bucket = same paper + Part + unit_number ke baaki imported stems

PROMPT PIPELINE (code)
• Scratch lenses: scratch/prompt-segregation-paper-1-3.txt (P1–P3) + paper-4-6.txt (P4–P6) — **only the slice for that paper + unit.part (A/B)**
• Slicer: src/lib/mains-prompt-scratch.ts → mainsPartAddonFromScratch(...)
• PYQ injection: src/actions/mains-pyq-actions.ts → **2023–2024 papers only**, merged linked + unit bucket, **max 2 stems per mark band** (short/mid/long) — src/lib/mains-pyq-prompt-curate.ts
• LATEST assembly: src/config/mains-topic-ai-prompt.ts → buildMainsTopicUserPrompt (Expert-Rich spec)
• Full admin paste: src/actions/mains-pyq-actions.ts → getMainsFullAiPromptForTopic (LATEST + micro tone)
• Save / validate: src/actions/mains-ai-actions.ts → adminApplyMainsContentJson + src/lib/mains-history-rich-normalize.ts

PYQ UPLOAD
1) /admin/mains-pyq — JSON paste (format: one root key → { paper_number, parts:[{ part, units:[{ unit_number, questions:[] }] }] })
2) Quick test: button "Load sample JSON" (public sample) → Save to database
3) Fir /admin/mains — topic select → NICHE poora prompt textarea me LOAD hota hai (sirf clipboard nahi)
4) "Unit PYQs" list se Link dabao → topic-anchor vault

AI → READY ANSWERS
• Full prompt = LATEST (scratch slice + curated 2023–24 PYQs + Expert-Rich schema) + short tone footer (no giant legacy JSON schema)
• External AI se ONE raw Expert-Rich JSON → yahan textarea → Save JSON to DB → rich_payload + flattened fields

FRONTEND (student)
6) /mains/syllabus — paper cards
7) /mains/syllabus/[paperId] — units + topics
8) /mains/syllabus/[paperId]/[topicId] — concept + strategy + model answers (needs access_grants mains)

CLI CHECK
• npm run mains:overview  (local DB)
• USE_PROD_DB=true npm run mains:overview  (Turso branch)

DB SETUP
• Local: npm run db:migrate → npm run db:seed:mains (.env loaded)
• Turso one-shot: npm run db:setup:mains:remote (migrate + cols fix + PYQ tables + syllabus seed)`;

/** Expert-Rich minimal skeleton (Paper IV: fill 11m/case18 per topic; P1–P9: longer Hindi variants). */
const JSON_REPLY_SHAPE_EXAMPLE_OBJECT = {
  schema_version: 'mains_history_rich_v1',
  pyq_trend_analysis_hi: '…',
  pyq_trend_analysis_en: '…',
  cognitive_intro_hi: '…',
  cognitive_intro_en: '…',
  desi_analogy_hi: '…',
  desi_analogy_en: '…',
  authentic_source_citation_hi: '…',
  authentic_source_citation_en: '…',
  dynamic_dimensions_hi: [{ dimension_name: '…', bullets: ['…'] }],
  dynamic_dimensions_en: [{ dimension_name: '…', bullets: ['…'] }],
  multidimensional_interlinking_hi: '↔ …',
  multidimensional_interlinking_en: '↔ …',
  psychological_memory_hook_hi: '…',
  psychological_memory_hook_en: '…',
  visual_infographic_cue_hi: '…',
  visual_infographic_cue_en: '…',
  examiner_trap_hi: '…',
  examiner_trap_en: '…',
  topper_x_factor_hi: '…',
  topper_x_factor_en: '…',
  model_answers_hi: {
    
    
    '10m': [{ text: '…' }, { text: '…' }],
    '15m': [{ text: '…' }, { text: '…' }],
    essay: [],
  },
  model_answers_en: {
    
    
    '10m': [{ text: '…' }, { text: '…' }],
    '15m': [{ text: '…' }, { text: '…' }],
    essay: [],
  },
  key_terms_hi: '- 🧭 …',
  key_terms_en: '- 🧭 …',
};

const jsonExampleString = () => JSON.stringify(JSON_REPLY_SHAPE_EXAMPLE_OBJECT, null, 2);

type TopicRow = {
  id: string;
  titleHi: string;
  titleEn: string;
  status?: string;
  content?: { id: string; updatedAt?: Date | null } | null;
};

type UnitRow = {
  id: string;
  unitNumber: number;
  titleHi: string;
  titleEn: string;
  /** mains_units.part — drives scratch slice P1A/P1B… */
  part?: string | null;
  topics: TopicRow[];
};

export function MainsAdminClient() {
  const [overview, setOverview] = useState<any[]>([]);
  const [migrationHint, setMigrationHint] = useState<string | null>(null);
  const [selectedPaper, setSelectedPaper] = useState<any>(null);
  const [syllabusTree, setSyllabusTree] = useState<UnitRow[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<{
    id: string;
    titleHi: string;
    titleEn: string;
    unit: UnitRow;
    content?: TopicRow['content'];
    status?: string;
  } | null>(null);
  const [jsonDraft, setJsonDraft] = useState('');
  /** Full Gemini-ready prompt — visible on screen, not clipboard-only */
  const [promptPreview, setPromptPreview] = useState('');
  const [promptMeta, setPromptMeta] = useState<MainsFullPromptMeta | null>(null);
  const [pyqCandidates, setPyqCandidates] = useState<PyqCandidateRow[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [promptLoading, setPromptLoading] = useState(false);
  const [promptError, setPromptError] = useState<string | null>(null);
  const [linkBusyId, setLinkBusyId] = useState<string | null>(null);
  const [deletingContent, setDeletingContent] = useState(false);
  /** In-page testing steps — open by default so new admins see how to verify. */
  const [showTestGuide, setShowTestGuide] = useState(false);
  /** Step 2 guide visibility */
  const [showStep2Guide, setShowStep2Guide] = useState(false);
  /** Truncation alert visibility */
  const [showTruncationAlert, setShowTruncationAlert] = useState(false);
  /** Admin syllabus accordion state */
  const [expandedUnits, setExpandedUnits] = useState<Record<string, boolean>>({});

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setMigrationHint(null);
    const res = await getMainsProgressOverview();
    if (res.success && res.data) {
      setOverview(res.data);
    } else if ((res as any).error === 'mains_tables_missing') {
      setOverview([]);
      setMigrationHint((res as any).hint ?? 'Run npm run db:migrate');
    } else {
      setOverview([]);
      const detail = (res as any).detail as string | undefined;
      toast.error(detail || (res as any).error || 'Could not load mains papers');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const loadPaperSyllabus = async (paperId: string) => {
    const paper = overview.find((p) => p.id === paperId);
    setSelectedPaper(paper ?? null);
    setSelectedTopic(null);
    setJsonDraft('');
    setPromptPreview('');
    setPromptMeta(null);
    setPyqCandidates([]);
    setPromptError(null);
    setMigrationHint(null);
    const res = await getMainsSyllabusTree(paperId);
    if (res.success && res.data) {
      const units = res.data as UnitRow[];
      setSyllabusTree(units);
      setSelectedTopic((prev) => {
        if (!prev) return prev;
        for (const u of units) {
          const t = u.topics.find((x) => x.id === prev.id);
          if (t) return { ...prev, ...t, unit: u };
        }
        return prev;
      });
      if (!units.length) {
        toast.error(
          'This paper has 0 units/topics in DB. Run: `npm run db:migrate` then `npm run db:seed:mains` (or remote equivalents).'
        );
        setMigrationHint('No units found. Seed mains syllabus: `npm run db:seed:mains` (remote: `npm run db:seed:mains:remote`).');
      }
    } else if ((res as any).error === 'mains_tables_missing') {
      setSyllabusTree([]);
      setMigrationHint((res as any).hint ?? null);
    } else if ((res as any).error === 'schema_outdated') {
      setSyllabusTree([]);
      setMigrationHint(
        (res as any).hint ??
          'Run `npm run db:migrate` so `mains_content` and related columns match the app schema.'
      );
    } else {
      setSyllabusTree([]);
      const msg = (res as any).error ?? 'Failed to fetch syllabus tree';
      const detail = (res as any).detail as string | undefined;
      toast.error(detail ? `${msg}: ${detail}` : String(msg));
    }
  };

  const selectTopic = (topic: TopicRow, unit: UnitRow) => {
    setSelectedTopic({ id: topic.id, titleHi: topic.titleHi, titleEn: topic.titleEn, status: topic.status, content: topic.content, unit });
    setJsonDraft('');
    setPromptPreview('');
    setPromptMeta(null);
    setPyqCandidates([]);
    setPromptError(null);
  };

  const reloadTopicAiContext = useCallback(async (topicId: string) => {
    setPromptLoading(true);
    setPromptError(null);
    try {
      const [pres, cres] = await Promise.all([
        getMainsFullAiPromptForTopic(topicId),
        adminListPyqCandidatesForTopic(topicId),
      ]);

      if (pres.success) {
        setPromptPreview(pres.prompt);
        setPromptMeta(pres.meta);
      } else {
        setPromptPreview('');
        setPromptMeta(null);
        const msg = (pres as any).error ?? 'Prompt build failed';
        setPromptError(msg);
        toast.error(msg);
      }

      if (cres.success && cres.data) {
        setPyqCandidates(cres.data);
      } else {
        setPyqCandidates([]);
        const cerr = (cres as any).error as string | undefined;
        if (cerr) toast.error(cerr);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setPromptPreview('');
      setPromptMeta(null);
      setPromptError(msg);
      toast.error(`Prompt load crash: ${msg}`);
    } finally {
      setPromptLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedTopic) return;
    reloadTopicAiContext(selectedTopic.id);
  }, [selectedTopic?.id, reloadTopicAiContext]);

  const copyLatestTopicBlock = async () => {
    if (!selectedTopic) return;
    const r = await buildMainsTopicAiUserBlock(selectedTopic.id);
    if (r.success) {
      await copy(r.topicBlock, 'LATEST topic block (scratch + schema)');
    } else {
      toast.error((r as { error?: string }).error ?? 'Topic block failed');
    }
  };

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied`);
    } catch {
      toast.error('Clipboard failed');
    }
  };

  const formatContentUpdated = (d?: Date | null) => {
    if (!d || Number.isNaN(d.getTime())) return null;
    try {
      return new Intl.DateTimeFormat('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(d);
    } catch {
      return d.toISOString().slice(0, 16);
    }
  };

  const clearTopicContent = async () => {
    if (!selectedTopic) return;
    const ok = window.confirm(
      'Delete expert content for this topic? The row in mains_content will be removed and status set to draft. Re-paste JSON any time (upsert).'
    );
    if (!ok) return;
    setDeletingContent(true);
    try {
      const res = await adminDeleteMainsContentForTopic(selectedTopic.id);
      if (res.success) {
        toast.success('mains_content cleared — topic is draft again');
        if (selectedPaper) await loadPaperSyllabus(selectedPaper.id);
        await loadOverview();
        setJsonDraft('');
      } else {
        toast.error((res as { error?: string }).error ?? 'Delete failed');
      }
    } finally {
      setDeletingContent(false);
    }
  };

  const saveJson = async () => {
    if (!selectedTopic) {
      toast.error('Select a topic first');
      return;
    }
    setSaving(true);
    const res = await adminApplyMainsContentJson(selectedTopic.id, jsonDraft);
    setSaving(false);
    if (res.success) {
      toast.success('Saved to mains_content');
      if (selectedPaper) await loadPaperSyllabus(selectedPaper.id);
      await loadOverview();
    } else {
      toast.error((res as any).error ?? 'Save failed');
    }
  };

  const togglePyqLink = async (row: PyqCandidateRow) => {
    if (!selectedTopic) return;
    setLinkBusyId(row.id);
    try {
      const res = row.linked
        ? await adminUnlinkTopicPyq(selectedTopic.id, row.id)
        : await adminLinkTopicPyq(selectedTopic.id, row.id);
      if (res.success) {
        toast.success(row.linked ? 'Unlinked' : 'Linked to topic');
        await reloadTopicAiContext(selectedTopic.id);
      } else {
        toast.error((res as any).error ?? 'Link failed');
      }
    } finally {
      setLinkBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-slate-500">
        <Loader2 className="h-6 w-6 animate-spin" /> Loading mains…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 bg-white p-6 text-slate-900 md:p-8">
      <div>
        <h1 className="flex items-center gap-3 text-3xl font-black tracking-tight md:text-4xl">
          <Database className="h-9 w-9 text-emerald-600" />
          Mains — copy prompt → AI → paste JSON → DB
        </h1>
        <p className="mt-1 text-slate-500">
          Koi API key app me nahi. Topic select karte hi <strong>niche wale box me pura prompt load</strong> ho jata hai — Gemini me copy-paste karo; jo JSON mile use neeche paste karke DB save karo (
          <code className="text-xs">mains_content</code>).
        </p>
      </div>

      <Card className="overflow-hidden border-violet-300 bg-violet-50/95 text-violet-950">
        <button
          type="button"
          onClick={() => setShowTestGuide((v) => !v)}
          className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-black text-violet-950 hover:bg-violet-100/80"
        >
          <span>Kaise test karu? (kahan jau, kya ensure karu)</span>
          {showTestGuide ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
        </button>
        {showTestGuide ? (
          <div className="space-y-3 border-t border-violet-200 bg-white/70 px-4 py-4 text-sm leading-relaxed text-slate-800">
            <p className="font-bold text-slate-900">Pehle yeh samjho: yeh page sirf DB + admin-login ke baad kaam karti hai.</p>
            <ol className="list-decimal space-y-3 pl-5">
              <li>
                <strong>App &amp; DB same hon</strong> — jo DB URL{' '}
                <code className="rounded bg-slate-100 px-1 text-xs">npm run dev</code> waale{' '}
                <code className="text-xs">.env</code>
                me hai, usi DB par syllabus seed ho. Turso check: terminal me{' '}
                <code className="rounded bg-slate-100 px-1 text-xs">
                  USE_PROD_DB=true npm run mains:overview
                </code>{' '}
                — chahiye: 9 papers, topics &gt; 0. Local file DB: sirf{' '}
                <code className="rounded bg-slate-100 px-1 text-xs">npm run mains:overview</code>.
              </li>
              <li>
                <strong>Browser me admin login</strong> — is site par wahi session jisme user ka{' '}
                <code className="rounded bg-slate-100 px-1 text-xs">role === &quot;admin&quot;</code> ho (
                <code className="text-xs">mppsc_token</code> cookie). Bina admin ke prompt load par error toast aayega.
              </li>
              <li>
                <strong>URL:</strong>{' '}
                <Link
                  href="/admin/mains"
                  className="font-bold text-violet-700 underline decoration-violet-400 underline-offset-2"
                >
                  /admin/mains
                </Link>{' '}
                (sidebar: &quot;Mains&quot;). Dev URL usually:{' '}
                <code className="rounded bg-slate-100 px-1 text-xs">http://127.0.0.1:3000/admin/mains</code>
              </li>
                    <li>
                      <strong>UI checklist (seed + admin OK hone par)</strong>: <strong>P1–P9</strong> → paper →{' '}
                      <strong>LEFT column</strong> me se <strong>topic line</strong> (ye zaroori) → <strong>RIGHT</strong> me
                      niche scroll: ① prompt → ② jamuni card → <strong>③</strong> wala bada <strong>editable</strong> grey
                      textarea + <strong>Save JSON to DB</strong> (yehi point 3). Jump:{' '}
                      <a
                        href="#admin-mains-step3-json"
                        className="font-bold text-violet-800 underline decoration-violet-400 underline-offset-2"
                      >
                        #admin-mains-step3-json
                      </a>{' '}
                      · Step 2:{' '}
                      <a
                        href="#admin-mains-step2-format"
                        className="font-bold text-violet-700 underline decoration-violet-400 underline-offset-2"
                      >
                        #admin-mains-step2-format
                      </a>
                    </li>
              <li>
                <strong>Agar sab blank / galat lag</strong>: upar{' '}
                <span className="text-amber-800">amber &quot;migration&quot;</span> ya{' '}
                <span className="text-blue-800">blue &quot;0 papers&quot;</span> card aaye → wahi commands chalani hongi (
                migrate + seed ya <code className="text-xs">db:setup:mains:remote</code> Turso).
              </li>
            </ol>
          </div>
        ) : null}
      </Card>

      {!loading && !migrationHint && overview.length === 0 && (
        <Card className="border-blue-200 bg-blue-50/90 p-4 text-blue-950">
          <div className="flex gap-2">
            <Database className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />
            <div className="space-y-2 text-sm">
              <p className="font-black">Mains papers DB me 0 — kuch dikhega hi nahi</p>
              <p className="leading-relaxed">
                <strong>Local:</strong> <code className="rounded bg-white px-1">npm run db:migrate</code> then{' '}
                <code className="rounded bg-white px-1">npm run db:seed:mains</code>
              </p>
              <p className="leading-relaxed">
                <strong>Turso / branch:</strong>{' '}
                <code className="rounded bg-white px-1">npm run db:setup:mains:remote</code> (migrate + tables + seed)
              </p>
            </div>
          </div>
        </Card>
      )}

      {migrationHint && (
        <Card className="border-amber-200 bg-amber-50 p-4 text-amber-950">
          <div className="flex gap-2">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="space-y-2 text-sm">
              <p className="font-bold">Mains tables missing in this database</p>
              <p className="whitespace-pre-wrap text-amber-900/90">{migrationHint}</p>
            </div>
          </div>
        </Card>
      )}

      <Card className="overflow-hidden border-slate-200">
        <button
          type="button"
          onClick={() => setShowHelp(!showHelp)}
          className="flex w-full items-center justify-between px-4 py-3 text-left font-bold text-slate-800 hover:bg-slate-50"
        >
          How it works (read once)
          {showHelp ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {showHelp && (
          <div className="space-y-3 border-t border-slate-100 bg-slate-50/80 px-4 py-4 text-sm text-slate-700">
            <p className="whitespace-pre-wrap font-medium leading-relaxed">{WORKFLOW}</p>
          </div>
        )}
      </Card>

      <MainsSyllabusProgressTracker />

      <RecentMainsSyllabusActivity />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
        {overview.map((paper) => (
          <Card
            key={paper.id}
            className={`border-2 p-0 transition-all ${
              selectedPaper?.id === paper.id
                ? 'border-emerald-600 shadow-lg'
                : 'border-slate-100 hover:border-slate-300'
            }`}
          >
            <button
              type="button"
              className="w-full cursor-pointer p-4 text-left"
              onClick={() => loadPaperSyllabus(paper.id)}
            >
              <div className="mb-3 flex items-start justify-between">
                <Badge className="bg-slate-900 font-black text-white">P{paper.paperNumber}</Badge>
                <span className="text-xs font-black text-emerald-600">{paper.progress ?? 0}%</span>
              </div>
              <h3 className="mb-3 line-clamp-3 text-sm font-bold leading-snug">{paper.titleEn}</h3>
              <Progress value={paper.progress ?? 0} className="h-1.5 bg-slate-100" />
            </button>
            <div className="flex justify-end border-t border-slate-100 px-2 py-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-[10px] font-black uppercase tracking-wide"
                onClick={() =>
                  copy(
                    buildPaperLevelPromptForExternalAi(paper.paperNumber, paper.titleEn),
                    `Paper ${paper.paperNumber} only`
                  )
                }
              >
                <Copy className="mr-1 h-3 w-3" />
                Paper-only prompt
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {selectedPaper && (
        <div className="grid grid-cols-1 gap-8 border-t border-slate-100 pt-8 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-4">
            <h2 className="text-xl font-black">{selectedPaper.titleEn}</h2>
            <div className="max-h-[560px] space-y-3 overflow-y-auto pr-1">
              {syllabusTree.length === 0 ? (
                <Card className="border-dashed p-4 text-sm text-slate-600">
                  <div className="space-y-2">
                    <div className="font-black text-slate-800">No units/topics found for this paper.</div>
                    <div className="whitespace-pre-wrap text-xs">
                      Fix (local):{'\n'}- npm run db:migrate{'\n'}- npm run db:seed:mains{'\n\n'}Fix (Turso/remote):{'\n'}- npm run db:migrate (with USE_PROD_DB=true) OR run one-shot:{'\n'}- npm run db:setup:mains:remote
                    </div>
                  </div>
                </Card>
              ) : (
                syllabusTree.map((unit) => {
                  const isOpen = !!expandedUnits[unit.id];
                  return (
                    <div key={unit.id} className="rounded-xl border border-slate-100 bg-slate-50/50 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setExpandedUnits(prev => ({ ...prev, [unit.id]: !isOpen }))}
                        className="flex w-full items-center justify-between gap-2 border-b border-slate-100 px-3 py-2 text-left hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-400">U{unit.unitNumber}</span>
                          <span className="truncate text-xs font-bold">{unit.titleEn}</span>
                        </div>
                        {isOpen ? <ChevronUp className="h-3.5 w-3.5 text-slate-400" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-400" />}
                      </button>
                      
                      {isOpen && (
                        <ul className="divide-y divide-slate-100 bg-white">
                          {unit.topics.map((topic) => {
                            const active = selectedTopic?.id === topic.id;
                            const has = !!topic.content;
                            const updatedLabel = has ? formatContentUpdated(topic.content?.updatedAt ?? null) : null;
                            return (
                              <li key={topic.id}>
                                <button
                                  type="button"
                                  onClick={() => selectTopic(topic, unit)}
                                  className={`flex w-full items-start gap-2 px-3 py-2 text-left text-sm transition-colors ${
                                    active ? 'bg-emerald-50 font-semibold text-emerald-900' : 'hover:bg-slate-50'
                                  }`}
                                >
                                  <span className="flex-1 text-slate-700">{topic.titleEn}</span>
                                  {has ? (
                                    <span className="flex shrink-0 flex-col items-end gap-0.5">
                                      <Badge variant="outline" className="border-emerald-300 text-[10px] text-emerald-700">
                                        Saved
                                      </Badge>
                                      {updatedLabel ? (
                                        <span className="text-[9px] font-medium text-slate-500">{updatedLabel}</span>
                                      ) : null}
                                    </span>
                                  ) : (
                                    <span className="shrink-0 text-[10px] text-slate-400">—</span>
                                  )}
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="space-y-4 lg:col-span-8">
            {!selectedTopic ? (
              <Card className="flex min-h-[320px] flex-col justify-center gap-4 border-dashed p-8 text-slate-600">
                <p className="text-center font-semibold text-slate-800">
                  Pehle <strong>LEFT</strong> column ki list me se ek <strong>topic line</strong> dabao — tabhi ① prompt, ②
                  jamuni format box, aur <strong className="text-emerald-800">③ AI JSON paste + Save JSON to DB</strong>{' '}
                  dikhega (bai / right panel me niche scroll karke dekhna).
                </p>
                <p className="text-center text-sm text-slate-500">
                  Sirf paper card tap karne par topic nahi banta → <strong>③ kabhi dikhegi hi nahi</strong>. Neeche: paper-only
                  prompt (topic ke bina).
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="font-bold"
                    onClick={() =>
                      selectedPaper &&
                      copy(
                        buildPaperLevelPromptForExternalAi(
                          selectedPaper.paperNumber,
                          selectedPaper.titleEn
                        ),
                        'Paper calibration'
                      )
                    }
                    disabled={!selectedPaper}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy paper-only prompt (P{selectedPaper?.paperNumber ?? '—'})
                  </Button>
                </div>
              </Card>
            ) : (
              <>
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-slate-300 font-bold"
                    asChild
                  >
                    <Link
                      href={`/mains/syllabus/${selectedPaper.id}/${selectedTopic.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Preview student page
                    </Link>
                  </Button>
                  <Button
                    type="button"
                    size="lg"
                    className="bg-indigo-600 font-black text-white hover:bg-indigo-700"
                    disabled={promptLoading || !promptPreview}
                    onClick={() => promptPreview && copy(promptPreview, 'Full prompt (visible box)')}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy full prompt
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="font-bold"
                    disabled={promptLoading || !selectedTopic}
                    onClick={() => selectedTopic && reloadTopicAiContext(selectedTopic.id)}
                  >
                    {promptLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Reload prompt
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="font-semibold"
                    onClick={() => copy(MAINS_TOPIC_AI_SYSTEM_PROMPT, 'Legacy rules (tone only)')}
                  >
                    <Copy className="mr-1 h-3.5 w-3.5" />
                    Copy legacy rules (tone)
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="font-semibold"
                    disabled={promptLoading || !selectedTopic}
                    onClick={() => copyLatestTopicBlock()}
                  >
                    <Copy className="mr-1 h-3.5 w-3.5" />
                    Copy LATEST block only
                  </Button>
                </div>

                <div className="rounded-lg border-2 border-emerald-600/80 bg-emerald-50 px-3 py-2.5 text-center text-xs font-bold leading-snug text-emerald-950 shadow-sm">
                  <span className="text-emerald-800">FLOW (bai / right column niche scroll):</span>{' '}
                  <span className="font-black">① Full AI prompt</span> →{' '}
                  <span className="font-black">② Jamuni skeleton box</span> →{' '}
                  <a
                    href="#admin-mains-step3-json"
                    className="inline-block font-black text-emerald-900 underline decoration-2 underline-offset-2 hover:text-emerald-950"
                  >
                    ③ YAHAN paste + Save DB
                  </a>{' '}
                  → optional PYQ sabse niche
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3 h-9 border-emerald-700 font-black text-emerald-950 hover:bg-emerald-100"
                    onClick={() =>
                      document
                        .getElementById('admin-mains-step3-json')
                        ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }
                  >
                    Seedha niche le jao → ③ paste box
                  </Button>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                  <span className="font-bold text-slate-800">Topic:</span> {selectedTopic.titleEn}
                  <span className="ml-2 text-slate-500">
                    · Save JSON = upsert same topic row in <code className="rounded bg-white px-1">mains_content</code>
                  </span>
                  {selectedTopic.content?.updatedAt ? (
                    <span className="mt-1 block text-[11px] font-semibold text-slate-700">
                      Last saved: {formatContentUpdated(selectedTopic.content.updatedAt) ?? '—'}
                    </span>
                  ) : null}
                  {promptMeta && (
                    <span className="ml-2 inline-flex flex-wrap gap-2">
                      <Badge variant="outline" className="text-[10px]">
                        PYQ linked: {promptMeta.linkedPyqCount}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        Unit pool (2023–24): {promptMeta.unitStemCount}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        In prompt: {promptMeta.pyqPromptStemCount} stems
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        Bands S/L: {promptMeta.pyqBandCounts.S}/{promptMeta.pyqBandCounts.L}
                      </Badge>
                      {!promptMeta.hadAnyImportedPyq && (
                        <Badge className="bg-amber-600 text-[10px] text-white">Expected-demo mode (prompt me likha hai)</Badge>
                      )}
                    </span>
                  )}
                </div>

                {promptError ? (
                  <Card className="border-red-200 bg-red-50 p-3 text-sm font-medium text-red-900">{promptError}</Card>
                ) : null}

                <div id="admin-mains-step1-prompt">
                  <label className="mb-1 block text-sm font-bold text-indigo-950">
                    ① Full AI prompt — yahi poora Gemini / ChatGPT user message me paste karo (upar{' '}
                    <strong>Copy full prompt</strong> bhi)
                  </label>
                  {promptLoading ? (
                    <div className="flex h-[140px] min-h-[120px] items-center justify-center rounded-lg border border-indigo-100 bg-indigo-50/40 text-sm font-medium text-indigo-900">
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Prompt bana rahe hain…
                    </div>
                  ) : (
                    <Textarea
                      readOnly
                      value={promptPreview}
                      placeholder="Topic select karte hi yahan pura prompt aa jayega."
                      className="h-[140px] min-h-[120px] resize-y border-2 border-indigo-200/90 font-mono text-[11px] leading-relaxed text-slate-800"
                    />
                  )}
                </div>

                <Card
                  id="admin-mains-step2-format"
                  className="overflow-hidden border-2 border-indigo-600 bg-indigo-50 text-slate-950 shadow-md transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setShowStep2Guide(!showStep2Guide)}
                    className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left hover:bg-indigo-100/50"
                  >
                    <div className="flex items-center gap-2">
                      <Badge className="shrink-0 bg-indigo-700 font-black text-white">Step 2</Badge>
                      <h3 className="text-sm font-black tracking-tight text-indigo-950">
                        ② Copy / paste format + JSON skeleton
                      </h3>
                    </div>
                    {showStep2Guide ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>

                  {showStep2Guide && (
                    <div className="space-y-3 border-t border-indigo-200 p-4">
                      <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-slate-900">
                        <li>
                          <strong>External AI:</strong> upar wale <em>① Full AI prompt</em> ka saara text copy karke ek
                          hi user-turn me paste karo.
                        </li>
                        <li>
                          <strong>Jawab:</strong> sirf <strong>ek Expert-Rich JSON</strong> (
                          <code className="rounded bg-white px-1 text-xs">schema_version</code>,{' '}
                          <code className="rounded bg-white px-1 text-xs">cognitive_intro_*</code>, nested{' '}
                          <code className="rounded bg-white px-1 text-xs">model_answers_hi/en</code>) —{' '}
                          <code className="rounded bg-white px-1.5 py-0.5 text-xs font-mono">{`\`\`\`json`}</code>{' '}
                          fence aur extra prose hata dena. Purana <code className="text-xs">concept_hi</code> wala shape
                          optional legacy hai, default target yahi rich schema hai.
                        </li>
                        <li>
                          <strong>Yahan:</strong> niche wale grey box (<em>③ AI se mila JSON</em>) me paste → phir{' '}
                          <strong className="text-emerald-800">Save JSON to DB</strong> dabao (uska button paste ke turant niche).
                        </li>
                      </ol>
                      <div className="flex flex-wrap items-center gap-2 border-t border-indigo-300 pt-3">
                        <p className="min-w-[200px] flex-1 text-sm font-bold leading-snug text-indigo-950">
                          Validator (nested <code className="text-xs">model_answers_hi</code> +{' '}
                          <code className="text-xs">model_answers_en</code>): P1–P3 →{' '}
                          <code className="rounded bg-white px-1 text-xs">2×2m+2×7m+2×10m</code> each · P4 →{' '}
                          <code className="rounded bg-white px-1 text-xs">2×11m</code> · P5–P6 → relaxed (min 2m)
                        </p>
                        <Button
                          type="button"
                          variant="default"
                          size="default"
                          className="h-10 shrink-0 bg-indigo-700 font-black text-white hover:bg-indigo-800"
                          onClick={() => copy(jsonExampleString(), 'Example JSON skeleton')}
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Copy example skeleton
                        </Button>
                      </div>
                      <p className="text-xs font-semibold text-indigo-900">Readable skeleton (preview):</p>
                      <pre className="max-h-[120px] overflow-auto rounded-lg border-2 border-indigo-300 bg-white p-3 font-mono text-[11px] leading-relaxed text-slate-900">
                        {jsonExampleString()}
                      </pre>
                    </div>
                  )}
                </Card>

                <Card
                  id="admin-mains-step3-json"
                  className="scroll-mt-24 space-y-3 border-4 border-emerald-600 bg-emerald-50/90 p-4 shadow-lg ring-2 ring-emerald-700/25"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2 border-b border-emerald-200 pb-2">
                    <div>
                      <Badge className="mb-2 bg-emerald-800 font-black text-white">Step 3 — YAHAN</Badge>
                      <label className="block text-lg font-black tracking-tight text-emerald-950">
                        AI se mila pure JSON ko is <strong>bade EDITABLE box</strong> me paste karo (code-fence hata kar)
                      </label>
                      <p className="mt-1 text-sm font-semibold text-emerald-950/90">
                        Ye wahi jagah hai jahan tum Gemini / ChatGPT ka raw JSON laa kar daaloge. Neeche wala{' '}
                        <strong>Hara Save</strong> dabate hi ye <code className="rounded bg-white px-1 text-xs">mains_content</code>{' '}
                        table me is topic ID ke liye save hota hai (student page pe dikhega).
                      </p>
                    </div>
                  </div>

                  {/* Truncation warning alert banner */}
                  <div className="overflow-hidden rounded-xl border-2 border-amber-300 bg-amber-50 shadow-sm transition-all">
                    <button
                      type="button"
                      onClick={() => setShowTruncationAlert(!showTruncationAlert)}
                      className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left hover:bg-amber-100/50"
                    >
                      <div className="flex items-center gap-2 text-amber-950">
                        <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 animate-pulse" />
                        <strong className="text-sm font-black">⚠️ AI Truncation Alert — READ THIS</strong>
                      </div>
                      {showTruncationAlert ? <ChevronUp className="h-4 w-4 text-amber-600" /> : <ChevronDown className="h-4 w-4 text-amber-600" />}
                    </button>

                    {showTruncationAlert && (
                      <div className="border-t border-amber-200 p-4">
                        <p className="text-sm font-semibold leading-relaxed text-amber-900">
                          Kyunki ye prompt bohot detailed aur premium bilingual content (Syllabus Grasp, 360° Dimensions, Model Answers for both Hindi & English) generate karta hai, <strong>Gemini/ChatGPT aksar likhte-likhte beech me ruk (truncate) jata hai!</strong>
                        </p>
                        <p className="mt-1 text-sm font-semibold leading-relaxed text-amber-850">
                          Aapka JSON me abhi <strong>model_answers_hi/en</strong>, <strong>key_terms_cards</strong>, etc. bilkul missing hain (yeh <code className="rounded bg-white px-1 text-xs">topper_x_factor_hi</code> par hi cut ho gaya hai aur hamara automatic repair engine ise aadhe par hi thik karke band kar de raha hai).
                        </p>
                        <p className="mt-2 text-sm font-extrabold text-indigo-950">
                          💡 Ise thik karne ka tareeqa (Dono blocks ko jodna):
                        </p>
                        <ol className="mt-1 list-decimal space-y-1.5 pl-5 text-sm font-semibold leading-relaxed text-slate-800">
                          <li>Gemini/ChatGPT me jab generation ruk jaye, to likhein: <strong>"continue writing the JSON from topper_x_factor_en key onwards, maintain proper JSON"</strong> or click the <strong>"Continue generating" (लिखना जारी रखें)</strong> button.</li>
                          <li>Jab wo baaki bacha JSON bhej de, to dono blocks ko aapas me jod (merge) kar dein (taaki ek hi closed curly braces <code className="rounded bg-white px-1 text-xs">{`{ ... }`}</code> ho aur bache hue keys jaise <code className="rounded bg-white px-1 text-xs">model_answers_hi</code> usme shamil ho sakein).</li>
                          <li>Combined complete JSON ko yahan paste karke save karein!</li>
                        </ol>
                      </div>
                    )}
                  </div>
                  <Textarea
                    value={jsonDraft}
                    onChange={(e) => setJsonDraft(e.target.value)}
                    placeholder='{ "schema_version": "mains_history_rich_v1", "cognitive_intro_hi": "...", "model_answers_hi": { "2m": [...] }, "model_answers_en": { ... } }'
                    className="h-[160px] min-h-[120px] border-4 border-emerald-500 bg-white font-mono text-sm shadow-inner text-slate-900"
                  />
                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      type="button"
                      size="lg"
                      className="border-2 border-emerald-800 bg-emerald-600 px-8 font-black text-white shadow-md hover:bg-emerald-700"
                      disabled={saving}
                      onClick={() => saveJson()}
                    >
                      {saving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                      Save JSON to DB
                    </Button>
                    <Button
                      type="button"
                      size="lg"
                      variant="outline"
                      className="border-rose-300 font-bold text-rose-800 hover:bg-rose-50"
                      disabled={deletingContent || !selectedTopic?.content}
                      onClick={() => clearTopicContent()}
                    >
                      {deletingContent ? (
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      ) : (
                        <Trash2 className="mr-2 h-5 w-5" />
                      )}
                      Delete content
                    </Button>
                    <span className="max-w-xs text-xs font-semibold leading-snug text-emerald-900">
                      Re-save overwrites the same topic row (upsert). Delete removes <code className="rounded bg-white px-0.5">mains_content</code> and sets topic to draft.
                    </span>
                  </div>
                </Card>

                <Card className="border-slate-300 bg-slate-50 p-4">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-black text-slate-900">Optional — Topic ↔ PYQ link</h3>
                    <Badge variant="outline" className="text-[10px] font-black">
                      Step 4 (optional)
                    </Badge>
                  </div>
                  <p className="mb-3 text-xs text-slate-700">
                    Is unit ke imported PYQs yahan list hain. <strong>Link</strong> dabao jab ye stem is topic line se
                    seedha match karta ho — prompt me &quot;TOPIC-LINKED&quot; section ban jata hai.
                  </p>
                  {pyqCandidates.length === 0 ? (
                    <p className="text-xs text-slate-600">
                      Koi imported PYQ nahi mila (paper/part/unit match).{' '}
                      <Link href="/admin/mains-pyq" className="font-bold text-indigo-700 underline">
                        Mains PYQ upload
                      </Link>
                    </p>
                  ) : (
                    <ul className="max-h-[220px] space-y-2 overflow-y-auto text-xs">
                      {pyqCandidates.map((row) => (
                        <li
                          key={row.id}
                          className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-2 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="min-w-0 flex-1">
                            <span className="font-black text-slate-800">
                              {row.examYear} · {row.marks}m · Pt {row.part}{' '}
                              {row.linked ? (
                                <Badge className="ml-1 bg-emerald-600 text-[9px] text-white">linked</Badge>
                              ) : null}
                            </span>
                            <p className="mt-0.5 text-[11px] leading-snug text-slate-600">{row.previewHi}</p>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant={row.linked ? 'outline' : 'default'}
                            className="shrink-0 text-[10px] font-black uppercase"
                            disabled={linkBusyId === row.id}
                            onClick={() => togglePyqLink(row)}
                          >
                            {linkBusyId === row.id ? <Loader2 className="h-3 w-3 animate-spin" /> : row.linked ? 'Unlink' : 'Link'}
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

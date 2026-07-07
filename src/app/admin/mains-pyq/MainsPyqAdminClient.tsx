'use client';

import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { importMainsPyqPaperJson, listMainsPyqPapers } from '@/actions/mains-pyq-actions';
import { MainsPyqPreparedAnswersSection } from '@/app/admin/mains-pyq/MainsPyqPreparedAnswersSection';
import { MainsPyqVaultGuideAndManage } from '@/app/admin/mains-pyq/MainsPyqVaultGuideAndManage';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Upload, Database, FileJson, Sparkles } from 'lucide-react';
import { MainsPyqInitialImportPromptGenerator } from '@/app/admin/mains-pyq/MainsPyqInitialImportPromptGenerator';
import { MainsPyqProgressTracker } from '@/app/admin/mains-pyq/MainsPyqProgressTracker';
import { toast } from 'sonner';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export type AdminMainsPyqPaperOption = {
  id: string;
  examYear: number;
  paperNumber: number;
  slug: string;
  titleEn: string | null;
  titleHi: string | null;
  examLabel?: string | null;
  rawJson?: string | null;
  isHidden?: boolean;
  qCount?: number;
  doneCount?: number;
};

export function MainsPyqAdminClient() {
  const [raw, setRaw] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const { data: papers = [], refetch: loadQuery } = useQuery({
    queryKey: ['admin-mains-pyq-papers'],
    queryFn: async () => {
      const res = await listMainsPyqPapers();
      if (!res.success) {
        toast.error('Failed to load papers');
        throw new Error('Failed to load papers');
      }
      return res.data ?? [];
    }
  });

  const load = useCallback(async () => {
    await loadQuery();
    setRefreshTrigger((prev) => prev + 1);
  }, [loadQuery]);

  const loadSampleJson = async () => {
    try {
      const res = await fetch('/samples/mains-pyq-minimal-example.json');
      if (!res.ok) throw new Error('Sample not found');
      setRaw(await res.text());
      toast.success('Sample loaded — Paper 1 · Part A · Unit 1 (click Save to DB)');
    } catch {
      toast.error('Could not load sample (is dev server running?)');
    }
  };

  const onImport = async () => {
    if (!raw.trim()) {
      toast.error('Paste JSON first');
      return;
    }
    setLoading(true);
    const res = await importMainsPyqPaperJson(raw);
    setLoading(false);
    if (!res.success) {
      toast.error(res.error ?? 'Import failed');
      return;
    }
    toast.success(
      `${res.count} stems · ${res.examYear} Paper ${res.paperNumber}: +${res.inserted} new, ${res.updated} updated, −${res.removed} removed${
        res.mergedDuplicatePapers ? ` · merged ${res.mergedDuplicatePapers} duplicate paper row(s)` : ''
      }`
    );
    setRaw('');
    await load();
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6 md:p-8">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-black">
          <Database className="h-8 w-8 text-indigo-600" />
          Mains — previous year papers (PYQ JSON)
        </h1>
        <p className="mt-2 text-slate-600">
          Paste one paper JSON (e.g. <code className="text-xs">upsc_mains_paper_2024</code> root). Upsert key:{' '}
          <strong>exam year + paper number</strong>. Stem match: <strong>part + unit + question #</strong>. Same stem =
          stable UUID so prepared variants & topic links survive re-import.
        </p>
      </div>

      <MainsPyqInitialImportPromptGenerator />

      <MainsPyqProgressTracker refreshTrigger={refreshTrigger} />

      <Card className="p-6 border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded bg-slate-100">
            <FileJson className="h-4 w-4 text-slate-600" />
          </div>
          <h2 className="text-lg font-black text-slate-900">Import JSON</h2>
        </div>
        <Textarea
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder='{ "upsc_mains_paper_2024": { "paper_number": 1, "parts": [...] } }'
          className="h-[150px] min-h-[120px] font-mono text-xs border-slate-200 focus:ring-indigo-500"
        />
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" variant="outline" className="font-bold text-slate-600 border-slate-200 hover:bg-slate-50" onClick={() => loadSampleJson()}>
            <FileJson className="mr-2 h-4 w-4" />
            Load sample (test)
          </Button>
          <Button className="font-black bg-indigo-600 hover:bg-indigo-700 shadow-sm" disabled={loading} onClick={() => onImport()}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Save to database
          </Button>
        </div>
      </Card>

      <Accordion type="multiple" className="w-full space-y-4 border-none" defaultValue={['vault']}>
        <AccordionItem value="vault" className="border rounded-xl px-2 bg-white/50 overflow-hidden shadow-sm">
          <AccordionTrigger className="hover:no-underline py-4 px-4 group">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-100 group-hover:bg-indigo-200 transition-colors">
                 <Database className="h-5 w-5 text-indigo-600" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-black tracking-tight">Paper Vault & Management</h3>
                <p className="text-xs font-medium text-slate-500">Manage imported papers, visibility, and data purging</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="p-4 pt-0 border-t border-slate-100 mt-2">
             <MainsPyqVaultGuideAndManage papers={papers} onRefresh={load} />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="prep" className="border rounded-xl px-2 bg-white/50 overflow-hidden shadow-sm">
          <AccordionTrigger className="hover:no-underline py-4 px-4 group">
            <div className="flex items-center gap-3">
               <div className="p-2 rounded-lg bg-amber-100 group-hover:bg-amber-200 transition-colors">
                 <Sparkles className="h-5 w-5 text-amber-600" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-black tracking-tight text-slate-900">Model Answer Preparation (Batch)</h3>
                <p className="text-xs font-medium text-slate-500">Generate AI prompts and save prepared variants</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="p-4 pt-0 border-t border-slate-100 mt-2">
            <MainsPyqPreparedAnswersSection papers={papers} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

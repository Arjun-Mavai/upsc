'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  deleteMainsPyqPaperAdmin,
  purgeAllMainsPyqVaultConfirm,
  updateMainsPyqPaperAdmin,
} from '@/actions/mains-pyq-actions';
import type { AdminMainsPyqPaperOption } from '@/app/admin/mains-pyq/MainsPyqAdminClient';
import { MAINS_PYQ_PURGE_CONFIRMATION_PHRASE } from '@/config/mains-pyq-admin';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export function MainsPyqVaultGuideAndManage({
  papers,
  onRefresh,
}: {
  papers: AdminMainsPyqPaperOption[];
  onRefresh: () => Promise<void>;
}) {
  const [purgeText, setPurgeText] = useState('');
  const [purging, setPurging] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editPaper, setEditPaper] = useState<AdminMainsPyqPaperOption | null>(null);
  const [titleHi, setTitleHi] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [examLabel, setExamLabel] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const openEdit = useCallback((p: AdminMainsPyqPaperOption) => {
    setEditPaper(p);
    setTitleHi(p.titleHi ?? '');
    setTitleEn(p.titleEn ?? '');
    setExamLabel(p.examLabel ?? '');
    setEditOpen(true);
  }, []);

  const saveEdit = useCallback(async () => {
    if (!editPaper) return;
    setSaving(true);
    const r = await updateMainsPyqPaperAdmin({
      paperId: editPaper.id,
      titleHi: titleHi.trim() || null,
      titleEn: titleEn.trim() || null,
      examLabel: examLabel.trim() || null,
    });
    setSaving(false);
    if (!r.success) {
      toast.error(r.error ?? 'Save failed');
      return;
    }
    toast.success('Paper updated');
    setEditOpen(false);
    await onRefresh();
  }, [editPaper, titleHi, titleEn, examLabel, onRefresh]);

  const onPurge = useCallback(async () => {
    setPurging(true);
    const r = await purgeAllMainsPyqVaultConfirm(purgeText);
    setPurging(false);
    if (!r.success) {
      toast.error(r.error ?? 'Purge failed');
      return;
    }
    toast.success('All mains PYQ import data cleared');
    setPurgeText('');
    await onRefresh();
  }, [purgeText, onRefresh]);

  const onDeletePaper = useCallback(
    async (id: string) => {
      if (!window.confirm('Delete this paper and all its questions, variants, and topic links?')) return;
      setDeletingId(id);
      const r = await deleteMainsPyqPaperAdmin(id);
      setDeletingId(null);
      if (!r.success) {
        toast.error(r.error ?? 'Delete failed');
        return;
      }
      toast.success('Paper deleted');
      await onRefresh();
    },
    [onRefresh]
  );

  const onToggleHidden = useCallback(
    async (p: AdminMainsPyqPaperOption, hidden: boolean) => {
      const r = await updateMainsPyqPaperAdmin({ paperId: p.id, isHidden: hidden });
      if (!r.success) {
        toast.error(r.error ?? 'Update failed');
        return;
      }
      toast.success(hidden ? 'Hidden from student PYQ desk' : 'Visible on student PYQ desk');
      await onRefresh();
    },
    [onRefresh]
  );

  const counts = useMemo(() => ({ n: papers.length }), [papers.length]);

  const [showGuide, setShowGuide] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-xs font-bold text-slate-500 hover:text-indigo-600"
          onClick={() => setShowGuide(!showGuide)}
        >
          {showGuide ? 'Hide Table Flow Guide ↑' : 'Show Table Flow Guide ↓'}
        </Button>
      </div>

      {showGuide && (
        <Card className="border-emerald-200/80 bg-gradient-to-br from-emerald-50/80 via-white to-slate-50 p-5 text-sm leading-relaxed text-slate-800 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
          <p className="text-base font-black text-emerald-950">Imported paper → konsi table mein kya jata hai (flow)</p>
          <ol className="mt-4 list-decimal space-y-3 pl-5 marker:font-black">
            <li>
              <strong>Admin → Paste JSON → Save:</strong>{' '}
              <code className="rounded bg-white px-1.5 py-0.5 text-xs shadow-sm">importMainsPyqPaperJson</code> eksath
              year + paper number se match karti hai.
            </li>
            <li>
              <strong className="text-emerald-900">mains_pyq_papers</strong> — ek row per imported paper (
              <code className="text-xs">exam_year</code>, <code className="text-xs">paper_number</code>, titles,{' '}
              <code className="text-xs">raw_json</code> backup). <strong>slug</strong> unique.
            </li>
            <li>
              <strong className="text-emerald-900">mains_pyq_questions</strong> — har sawal stems; FK{' '}
              <code className="text-xs">paper_id</code> → papers. Part / unit / question # se merge hota re-import par
              (UUID stable).
            </li>
            <li>
              <strong className="text-emerald-900">mains_pyq_prepared_variants</strong> — slot 1 &amp; 2 model answers; FK{' '}
              <code className="text-xs">pyq_question_id</code> → questions (admin “batch paste” se).
            </li>
            <li>
              <strong className="text-emerald-900">mains_topic_pyq_links</strong> — optional manual link{' '}
              <code className="text-xs">topic_id</code> + <code className="text-xs">pyq_question_id</code> (syllabus topic ↔
              official stem). Alag hai seed syllabus tables se.
            </li>
          </ol>
          <p className="mt-4 rounded-lg border border-slate-200 bg-white/80 p-3 text-xs text-slate-600">
            <strong className="text-slate-800">Nahi chhoota:</strong> <code>mains_papers</code>,{' '}
            <code>mains_units</code>, <code>mains_topics</code>, <code>mains_content</code> — yeh syllabus tree hai, PYQ
            import se alag.
          </p>
        </Card>
      )}

      <Card className="border-rose-200 bg-rose-50/50 p-5">
        <p className="font-black text-rose-950">Fresh start — saara mains PYQ vault khali</p>
        <p className="mt-2 text-sm text-rose-900/90">
          Neeche <strong>exact</strong> phrase likho, phir button dabao: papers · sawal · variants · topic-links sab ud
          jayega. Syllabus / users / pricing par asar nahin.
        </p>
        <code className="mt-2 inline-block rounded bg-white px-2 py-1 text-xs font-mono shadow-sm">
          {MAINS_PYQ_PURGE_CONFIRMATION_PHRASE}
        </code>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            value={purgeText}
            onChange={(e) => setPurgeText(e.target.value)}
            placeholder={MAINS_PYQ_PURGE_CONFIRMATION_PHRASE}
            className="font-mono text-sm"
          />
          <Button
            type="button"
            variant="destructive"
            disabled={purging || purgeText.trim() !== MAINS_PYQ_PURGE_CONFIRMATION_PHRASE}
            onClick={() => void onPurge()}
            className="shrink-0 font-black"
          >
            {purging ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Purge all mains PYQ data
          </Button>
        </div>
      </Card>

      <div>
        <h2 className="mb-1 text-lg font-black">Imported papers ({counts.n})</h2>
        <p className="mb-4 text-xs text-slate-500">
          Hide = student PYQ desk + prompt pools mein nahin dikhega. Admin linking / batches mein dikhte rahenge.
        </p>
        {papers.length === 0 ? (
          <p className="text-slate-500">No papers — import JSON above.</p>
        ) : (
          <ul className="space-y-2">
            {papers.map((p) => {
              const hidden = Boolean(p.isHidden);
              return (
                <li
                  key={p.id}
                  className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="font-black">
                        {p.examYear}
                      </Badge>
                      <span className="font-bold">Paper {p.paperNumber}</span>
                      {hidden ? (
                        <Badge className="bg-slate-800 text-[10px] text-white">Hidden from students</Badge>
                      ) : null}
                    </div>
                    <p className="mt-1 truncate text-sm text-slate-600">{p.titleEn ?? p.slug}</p>
                    <p className="text-xs font-bold text-emerald-700">{p.qCount ?? 0} questions</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3 sm:border-t-0 sm:pt-0">
                    <div className="flex items-center gap-2">
                      <Switch
                        id={`hide-${p.id}`}
                        checked={hidden}
                        onCheckedChange={(v) => void onToggleHidden(p, Boolean(v))}
                      />
                      <Label htmlFor={`hide-${p.id}`} className="cursor-pointer text-xs font-semibold">
                        Hide
                      </Label>
                    </div>
                    <Button type="button" size="sm" variant="outline" className="font-bold" onClick={() => openEdit(p)}>
                      <Pencil className="mr-1.5 h-3.5 w-3.5" />
                      Edit meta
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="font-bold text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                      disabled={deletingId === p.id}
                      onClick={() => void onDeletePaper(p.id)}
                    >
                      {deletingId === p.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit paper (same DB row)</DialogTitle>
          </DialogHeader>
          {editPaper ? (
            <div className="space-y-3 py-2">
              <p className="text-xs text-slate-500">
                Slug locked: <code className="rounded bg-slate-100 px-1">{editPaper.slug}</code>
              </p>
              <div>
                <Label htmlFor="title-hi">Title (HI)</Label>
                <Input id="title-hi" value={titleHi} onChange={(e) => setTitleHi(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="title-en">Title (EN)</Label>
                <Input id="title-en" value={titleEn} onChange={(e) => setTitleEn(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="exam-label">Exam label</Label>
                <Input id="exam-label" value={examLabel} onChange={(e) => setExamLabel(e.target.value)} className="mt-1" />
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={saving || !editPaper} onClick={() => void saveEdit()} className="font-bold">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

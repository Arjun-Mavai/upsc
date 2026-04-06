'use client';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎛️ BLOG ACCESS CLIENT — Admin se blog access flags toggle karo
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// Unit tabs se categorize → blog list → switches se toggle
// Bulk actions per unit — "Unit 1 ke sab free karo" type
// ScrollArea me wrap, mobile card layout
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Loader2, FileText, Zap, Search, EyeOff, Calendar, Trash2, Pencil, Upload } from 'lucide-react';
import { toast } from 'sonner';
import {
  toggleBlogAccess,
  bulkUpdateBlogAccess,
  toggleBlogHidden,
  deleteBlog,
  getBlogById,
  updateBlog,
  updateBlogExamType,
} from './actions';

interface BlogItem {
  id: string;
  slug: string;
  title: string;
  category: string;
  examType: string;
  unitId: string | null;
  isPremium: boolean | null;
  isFreeAccess: boolean | null;
  isLiteAccess: boolean | null;
  isProAccess: boolean | null;
  isPublished: boolean | null;
  isHidden: boolean | null;
  createdAt: Date | null;
}

export default function BlogAccessClient({ blogs: initialBlogs }: { blogs: BlogItem[] }) {
  const [blogs, setBlogs] = useState(initialBlogs);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeUnit, setActiveUnit] = useState('all');
  const [activeExamType, setActiveExamType] = useState('all');
  const [isPending, startTransition] = useTransition();

  // ── Unit tabs — blogs ko unit wise group karo ───────────────
  const unitIds = Array.from(new Set(blogs.map((b) => b.unitId || 'no_unit'))).sort((a, b) => {
    if (a === 'no_unit') return 1;
    if (b === 'no_unit') return -1;
    const numA = parseInt(a.replace('unit_', ''));
    const numB = parseInt(b.replace('unit_', ''));
    return numA - numB;
  });

  // ── Filter by unit + exam type + search ────────────────────
  let filteredBlogs = blogs;
  if (activeUnit !== 'all') {
    filteredBlogs = filteredBlogs.filter((b) =>
      activeUnit === 'no_unit' ? !b.unitId : b.unitId === activeUnit
    );
  }
  if (activeExamType !== 'all') {
    filteredBlogs = filteredBlogs.filter((b) => b.examType === activeExamType);
  }
  if (searchQuery) {
    filteredBlogs = filteredBlogs.filter(
      (b) =>
        b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  // ── Single toggle handler ───────────────────────────────────
  const handleToggle = async (
    blogId: string,
    field: 'isFreeAccess' | 'isLiteAccess' | 'isProAccess',
    value: boolean
  ) => {
    setBlogs((prev) => prev.map((b) => (b.id === blogId ? { ...b, [field]: value } : b)));

    startTransition(async () => {
      const result = await toggleBlogAccess(blogId, field, value);
      if (!result.success) {
        setBlogs((prev) => prev.map((b) => (b.id === blogId ? { ...b, [field]: !value } : b)));
        toast.error('Failed to update');
      } else {
        toast.success(`Updated: ${field} → ${value ? 'ON' : 'OFF'}`);
      }
    });
  };

  // ── Hidden toggle handler ───────────────────────────────────
  const handleToggleHidden = async (blogId: string, isHidden: boolean) => {
    setBlogs((prev) => prev.map((b) => (b.id === blogId ? { ...b, isHidden } : b)));

    startTransition(async () => {
      const result = await toggleBlogHidden(blogId, isHidden);
      if (!result.success) {
        setBlogs((prev) => prev.map((b) => (b.id === blogId ? { ...b, isHidden: !isHidden } : b)));
        toast.error('Failed to update');
      } else {
        toast.success(isHidden ? 'Blog hidden!' : 'Blog visible!');
      }
    });
  };

  // ── Delete handler ─────────────────────────────────────────
  const handleDelete = async (blogId: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) {
      return;
    }

    startTransition(async () => {
      const result = await deleteBlog(blogId);
      if (!result.success) {
        toast.error(result.error || 'Failed to delete blog');
      } else {
        setBlogs((prev) => prev.filter((b) => b.id !== blogId));
        toast.success('Blog deleted successfully');
      }
    });
  };

  // ── Exam Type handler ─────────────────────────────────────────
  const handleExamTypeChange = async (blogId: string, examType: 'upsc' | 'mppsc' | 'all') => {
    setBlogs((prev) => prev.map((b) => (b.id === blogId ? { ...b, examType } : b)));

    startTransition(async () => {
      const result = await updateBlogExamType(blogId, examType);
      if (!result.success) {
        // Revert on failure
        setBlogs((prev) => prev.map((b) => {
          if (b.id === blogId) {
            const oldExamType = b.examType === 'upsc' ? 'mppsc' : b.examType === 'mppsc' ? 'all' : 'upsc';
            return { ...b, examType: oldExamType };
          }
          return b;
        }));
        toast.error('Failed to update exam type');
      } else {
        toast.success(`Exam type updated to ${examType.toUpperCase()}`);
      }
    });
  };

  // ── Edit state — dialog open/close + form data ──────────────
  const [editOpen, setEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editBlogId, setEditBlogId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ imageUrl: '', contentJson: '' });

  // ── Edit click — blog ka poora data fetch karke dialog kholo ──
  const handleEditClick = async (blogId: string) => {
    setEditLoading(true);
    setEditBlogId(blogId);
    setEditOpen(true);
    setEditData({ imageUrl: '', contentJson: '' }); // Clear stale data

    try {
      const result = await getBlogById(blogId);
      if (!result.success || !result.blog) {
        toast.error(result.error || 'Blog fetch fail bhai');
        setEditOpen(false);
        return;
      }

      // Blog data → JSON format me convert (same structure as upload)
      const blog = result.blog;
      const jsonStructure = {
        metadata: {
          title: blog.title,
          slug: blog.slug,
          description: blog.description || '',
          category: blog.category,
          readingTime: blog.readingTime || 5,
          type: blog.contentType || 'blog',
          unit: blog.unitId || undefined,
          topic: blog.topicId || undefined,
        },
        content: blog.content,
      };

      setEditData({
        imageUrl: blog.imageUrl || '',
        contentJson: JSON.stringify(jsonStructure, null, 2),
      });
    } catch {
      toast.error('Blog fetch fail bhai');
      setEditOpen(false);
    } finally {
      setEditLoading(false);
    }
  };

  // ── Edit submit — updated data server pe bhejo ─────────────
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editBlogId) return;

    // Pehle JSON validate karo — galat JSON pe error dikhao
    try {
      const parsed = JSON.parse(editData.contentJson);
      if (!parsed.metadata || !parsed.content) {
        toast.error("JSON me 'metadata' aur 'content' dono chahiye bhai");
        return;
      }
      if (!parsed.metadata.title || !parsed.metadata.slug || !parsed.metadata.category) {
        toast.error('Title, slug, ya category missing h');
        return;
      }
    } catch {
      toast.error('JSON format galat h bhai — check karo');
      return;
    }

    setEditLoading(true);
    startTransition(async () => {
      try {
        const result = await updateBlog(editBlogId, editData);
        if (!result.success) {
          toast.error(result.error || 'Update fail ho gaya');
        } else {
          toast.success('Blog update ho gaya! 🎉');
          setEditOpen(false);

          // Local state me bhi title update karo — taki list me dikhne lage
          try {
            const parsed = JSON.parse(editData.contentJson);
            setBlogs((prev) =>
              prev.map((b) =>
                b.id === editBlogId
                  ? {
                      ...b,
                      title: parsed.metadata.title,
                      slug: parsed.metadata.slug,
                      category: parsed.metadata.category,
                    }
                  : b
              )
            );
          } catch {
            // JSON parse fail? koi nahi, page refresh pe sahi aa jayega
          }
        }
      } catch (error) {
        toast.error('Unexpected error while updating blog');
      } finally {
        setEditLoading(false);
      }
    });
  };

  // ── Bulk action — unit wise ─────────────────────────────────
  const handleBulk = async (
    field: 'isFreeAccess' | 'isLiteAccess' | 'isProAccess',
    value: boolean,
    unitId?: string
  ) => {
    const targetUnit = unitId || activeUnit;
    // Optimistic: update matching blogs
    setBlogs((prev) =>
      prev.map((b) => {
        if (targetUnit === 'all') return { ...b, [field]: value };
        if (targetUnit === 'no_unit' && !b.unitId) return { ...b, [field]: value };
        if (b.unitId === targetUnit) return { ...b, [field]: value };
        return b;
      })
    );

    startTransition(async () => {
      const result = await bulkUpdateBlogAccess(field, value, targetUnit);
      if (!result.success) {
        toast.error('Bulk update failed');
      } else {
        toast.success(
          `${targetUnit === 'all' ? 'All blogs' : targetUnit}: ${field} → ${value ? 'ON' : 'OFF'}`
        );
      }
    });
  };

  // ── Stats ───────────────────────────────────────────────────
  const stats = {
    total: filteredBlogs.length,
    free: filteredBlogs.filter((b) => b.isFreeAccess).length,
    lite: filteredBlogs.filter((b) => b.isLiteAccess).length,
    pro: filteredBlogs.filter((b) => b.isProAccess !== false).length,
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight md:text-2xl">
            <FileText className="h-5 w-5 text-indigo-600 md:h-6 md:w-6" />
            Blog Access Manager
          </h1>
          <p className="mt-1 text-xs text-slate-500 md:text-sm">
            Blog access control — Free/Lite/Pro flags toggle karo
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-bold">
          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
            Free: {stats.free}
          </Badge>
          <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
            Lite: {stats.lite}
          </Badge>
          <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
            Pro: {stats.pro}
          </Badge>
        </div>
      </div>

      {/* ── Unit Tabs ──────────────────────────────────────── */}
      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveUnit('all')}
          className={`rounded-full border px-3 py-2 text-xs font-bold whitespace-nowrap transition-all md:px-4 ${
            activeUnit === 'all'
              ? 'border-indigo-600 bg-indigo-600 text-white shadow-md'
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
          }`}
        >
          All ({blogs.length})
        </button>
        {unitIds.map((unit) => {
          const count = blogs.filter((b) =>
            unit === 'no_unit' ? !b.unitId : b.unitId === unit
          ).length;
          return (
            <button
              key={unit}
              onClick={() => setActiveUnit(unit)}
              className={`rounded-full border px-3 py-2 text-xs font-bold whitespace-nowrap transition-all md:px-4 ${
                activeUnit === unit
                  ? 'border-indigo-600 bg-indigo-600 text-white shadow-md'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              {unit === 'no_unit' ? 'General' : `U${unit.replace('unit_', '')}`} ({count})
            </button>
          );
        })}
      </div>

      {/* ── Search & Exam Type Filter ────────────────────────── */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by title, slug, category..."
            className="h-9 bg-white pl-9 text-sm md:h-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        {/* Exam Type Filter */}
        <select
          className="h-9 md:h-10 rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          value={activeExamType}
          onChange={(e) => setActiveExamType(e.target.value)}
        >
          <option value="all">All Exams</option>
          <option value="upsc">UPSC Only</option>
          <option value="mppsc">MPPSC Only</option>
          <option value="all">Common</option>
        </select>
      </div>

      {/* ── Bulk Actions ────────────────────────────────────── */}
      <Card className="border-dashed border-indigo-200 bg-indigo-50/30">
        <CardContent className="p-3 md:p-4">
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <Zap className="h-4 w-4 text-indigo-600" />
            <span className="text-xs font-bold text-indigo-700 md:text-sm">
              Bulk
              {activeUnit !== 'all'
                ? ` (${activeUnit === 'no_unit' ? 'General' : activeUnit.replace('unit_', 'Unit ')})`
                : ''}
              :
            </span>
            <div className="flex flex-wrap gap-1.5 md:gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2 text-[10px] md:h-8 md:px-3 md:text-xs"
                onClick={() => handleBulk('isFreeAccess', true)}
              >
                Free ✅
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2 text-[10px] md:h-8 md:px-3 md:text-xs"
                onClick={() => handleBulk('isFreeAccess', false)}
              >
                Free ❌
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2 text-[10px] md:h-8 md:px-3 md:text-xs"
                onClick={() => handleBulk('isLiteAccess', true)}
              >
                Lite ✅
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2 text-[10px] md:h-8 md:px-3 md:text-xs"
                onClick={() => handleBulk('isLiteAccess', false)}
              >
                Lite ❌
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2 text-[10px] md:h-8 md:px-3 md:text-xs"
                onClick={() => handleBulk('isProAccess', true)}
              >
                Pro ✅
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2 text-[10px] md:h-8 md:px-3 md:text-xs"
                onClick={() => handleBulk('isProAccess', false)}
              >
                Pro ❌
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Blog List (ScrollArea) ─────────────────────────── */}
      <Card className="relative border-slate-200 shadow-sm">
        {isPending && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/60">
            <Loader2 className="animate-spin text-indigo-600" />
          </div>
        )}
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-4 py-3">
          <CardTitle className="text-sm font-semibold text-slate-700 md:text-base">
            {activeUnit === 'all'
              ? 'All Blogs'
              : activeUnit === 'no_unit'
                ? 'General Blogs'
                : `Unit ${activeUnit.replace('unit_', '')} Blogs`}
            <span className="ml-2 font-normal text-slate-400">({filteredBlogs.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[60vh] md:h-[65vh]">
            <div className="divide-y divide-slate-100">
              {filteredBlogs.length === 0 ? (
                <div className="p-8 text-center text-slate-400">No blogs found</div>
              ) : (
                filteredBlogs.map((blog) => (
                  <div
                    key={blog.id}
                    className={cn(
                      'p-3 transition-colors hover:bg-slate-50/50 md:p-4',
                      blog.isHidden && 'bg-red-50/30 opacity-60'
                    )}
                  >
                    {/* Blog Info */}
                    <div className="mb-2 flex items-start gap-2">
                      <Badge variant="outline" className="mt-0.5 shrink-0 text-[10px] capitalize">
                        {blog.unitId
                          ? `U${blog.unitId.replace('unit_', '')}`
                          : blog.category.replace(/_/g, ' ')}
                      </Badge>
                      <div className="min-w-0 flex-1">
                        <span className="line-clamp-2 block text-xs font-medium text-slate-900 md:truncate md:text-sm">
                          {blog.title}
                        </span>
                        <p className="mt-0.5 truncate font-mono text-[10px] text-slate-500 md:text-xs">
                          /{blog.slug}
                        </p>
                        {blog.createdAt && (
                          <p className="mt-0.5 flex items-center gap-1 text-[10px] text-slate-400">
                            <Calendar className="h-3 w-3" />
                            {new Date(blog.createdAt).toLocaleDateString('en-IN', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                            ,{' '}
                            {new Date(blog.createdAt).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        )}
                      </div>
                      {blog.isHidden && (
                        <Badge
                          variant="outline"
                          className="shrink-0 border-red-200 bg-red-50 text-[10px] text-red-600"
                        >
                          <EyeOff className="mr-1 h-3 w-3" /> Hidden
                        </Badge>
                      )}

                      {/* Edit Button — pencil icon, click pe dialog khulega */}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 shrink-0 text-slate-300 hover:bg-indigo-50 hover:text-indigo-500"
                        onClick={() => handleEditClick(blog.id)}
                        disabled={isPending}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>

                      {/* Delete Button */}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 shrink-0 text-slate-300 hover:bg-red-50 hover:text-red-500"
                        onClick={() => handleDelete(blog.id, blog.title)}
                        disabled={isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Access Switches + Hidden */}
                    <div className="mt-2 ml-0 flex items-center gap-3 md:ml-16 md:gap-5">
                      <label className="flex cursor-pointer items-center gap-1.5">
                        <Switch
                          checked={!!blog.isHidden}
                          onCheckedChange={(v) => handleToggleHidden(blog.id, v)}
                          className="scale-90 data-[state=checked]:bg-red-500 md:scale-100"
                        />
                        <span
                          className={`text-[10px] font-bold md:text-xs ${blog.isHidden ? 'text-red-600' : 'text-slate-400'}`}
                        >
                          Hide
                        </span>
                      </label>

                      <div className="h-4 w-px bg-slate-200" />

                      {/* Exam Type Dropdown */}
                      <div className="flex items-center gap-1.5">
                        <select
                          value={blog.examType}
                          onChange={(e) => handleExamTypeChange(blog.id, e.target.value as 'upsc' | 'mppsc' | 'all')}
                          className="h-7 rounded border border-slate-200 bg-white px-2 text-[10px] font-bold text-slate-700 focus:border-indigo-400 focus:outline-none md:h-8 md:text-xs"
                          disabled={isPending}
                        >
                          <option value="upsc">UPSC</option>
                          <option value="mppsc">MPPSC</option>
                          <option value="all">Common</option>
                        </select>
                      </div>

                      <div className="h-4 w-px bg-slate-200" />

                      <label className="flex cursor-pointer items-center gap-1.5">
                        <Switch
                          checked={!!blog.isFreeAccess}
                          onCheckedChange={(v) => handleToggle(blog.id, 'isFreeAccess', v)}
                          className="scale-90 md:scale-100"
                        />
                        <span
                          className={`text-[10px] font-bold md:text-xs ${blog.isFreeAccess ? 'text-emerald-600' : 'text-slate-400'}`}
                        >
                          Free
                        </span>
                      </label>

                      <label className="flex cursor-pointer items-center gap-1.5">
                        <Switch
                          checked={!!blog.isLiteAccess}
                          onCheckedChange={(v) => handleToggle(blog.id, 'isLiteAccess', v)}
                          className="scale-90 md:scale-100"
                        />
                        <span
                          className={`text-[10px] font-bold md:text-xs ${blog.isLiteAccess ? 'text-blue-600' : 'text-slate-400'}`}
                        >
                          Lite
                        </span>
                      </label>

                      <label className="flex cursor-pointer items-center gap-1.5">
                        <Switch
                          checked={blog.isProAccess !== false}
                          onCheckedChange={(v) => handleToggle(blog.id, 'isProAccess', v)}
                          className="scale-90 md:scale-100"
                        />
                        <span
                          className={`text-[10px] font-bold md:text-xs ${blog.isProAccess !== false ? 'text-amber-600' : 'text-slate-400'}`}
                        >
                          Pro
                        </span>
                      </label>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
      {/* ── Edit Dialog — content-manager jaisa form ────────── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-indigo-900">
              <Pencil className="h-5 w-5 text-indigo-600" />
              Blog Edit Karo
            </DialogTitle>
            <DialogDescription>
              Image URL aur JSON content edit karo — same format jaise upload karte ho
            </DialogDescription>
          </DialogHeader>

          {editLoading && !editData.contentJson ? (
            // Loading state — jab tak data fetch ho raha h
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
          ) : (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              {/* Image URL — optional cover image */}
              <div className="space-y-2">
                <Label>Image URL (Optional)</Label>
                <Input
                  value={editData.imageUrl}
                  onChange={(e) => setEditData((p) => ({ ...p, imageUrl: e.target.value }))}
                  placeholder="https://example.com/image.jpg"
                />
                {/* Preview dikhao agar URL h */}
                {editData.imageUrl && (
                  // Use next/image if configured, else fallback to img for preview
                  // Admin panel me strict remotePatterns validation zaruri nahi h preview ke liye
                  // But we use NextImage where possible to catch config errors early
                  <div className="relative h-32 w-full overflow-hidden rounded-lg border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={editData.imageUrl}
                      alt="Preview"
                      className="h-full w-full object-cover"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                    <p className="absolute bottom-1 left-1 bg-black/50 px-1 text-[10px] text-white">
                      If this shows but site fails, check remotePatterns
                    </p>
                  </div>
                )}
              </div>

              {/* JSON Content — poora blog ka data yaha edit hoga */}
              <div className="space-y-2">
                <Label className="flex justify-between">
                  <span>Blog JSON (Metadata + Content)</span>
                  <span className="text-xs font-normal text-slate-400">
                    Format: <code>{`{ "metadata": {...}, "content": {...} }`}</code>
                  </span>
                </Label>
                <Textarea
                  value={editData.contentJson}
                  onChange={(e) => setEditData((p) => ({ ...p, contentJson: e.target.value }))}
                  className="h-[400px] bg-slate-50 font-mono text-xs"
                  placeholder='{ "metadata": { "title": "...", "slug": "..." }, "content": { "hi": [...], "en": [...] } }'
                  required
                />
              </div>

              {/* Submit button — save karo */}
              <Button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700"
                disabled={editLoading}
              >
                {editLoading ? (
                  <Loader2 className="mr-2 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                Save Changes
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

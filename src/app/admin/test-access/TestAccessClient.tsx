'use client';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎛️ TEST ACCESS MANAGER — Admin ka remote control
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// Ye page admin ko dikhata hai sab tests ka access status
// Toggle karo flags → DB update → cache bust → frontend pe turant change
//
// Kya control karta hai?
//   isFreeAccess → Free/Guest users ko test free me milega
//   isLiteAccess → Lite plan users ko access milega
//   isProAccess  → Pro plan users ko access milega
//
// Filter by type (FLT/UNIT/CSAT/PYQ/TOPIC) → easy management
// Bulk actions → ek click me sab FLT tests ko Lite access de do
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Shield,
  Zap,
  Crown,
  Users,
  Filter,
  EyeOff,
  Eye,
  Pencil,
  Check,
  X,
  Hash,
  Calendar,
  RotateCcw,
  Copy,
  Trash2,
  FileText,
  Upload,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import {
  toggleTestAccess,
  bulkUpdateTestAccess,
  toggleTestHidden,
  updateTestTitle,
  updateTestDisplayOrder,
  updateAttemptLimit,
  bulkUpdateMaxRetries,
  deleteTest,
  getTestWithQuestions,
  updateTestContent,
  toggleInstantMode,
} from './actions';
import { toast } from 'sonner';
import { revalidateSyllabus } from '@/actions/revalidate';
import { syncSubjectParts } from '@/app/admin/tests/sync-actions';

// Test type ka full form aur color — admin ko samajh aaye
const TYPE_CONFIG = {
  FLT: { label: 'Full Length Test', color: 'bg-violet-100 text-violet-700', emoji: '📝' },
  UNIT: { label: 'Unit Test', color: 'bg-blue-100 text-blue-700', emoji: '📚' },
  CSAT: { label: 'CSAT', color: 'bg-amber-100 text-amber-700', emoji: '🧠' },
  PYQ: { label: 'Previous Year', color: 'bg-emerald-100 text-emerald-700', emoji: '📜' },
  TOPIC: { label: 'Topic Test', color: 'bg-rose-100 text-rose-700', emoji: '🎯' },
  MISC: { label: 'Free Quiz', color: 'bg-teal-100 text-teal-700', emoji: '🆓' },
  UPSC_PYQ: { label: 'UPSC PYQ', color: 'bg-orange-100 text-orange-700', emoji: '🏛️' },
  UPSC_FLT: { label: 'UPSC FLT', color: 'bg-sky-100 text-sky-700', emoji: '🎓' },
} as const;

type TestType = keyof typeof TYPE_CONFIG;

interface AdminTest {
  id: string;
  title: string;
  titleEn: string | null;
  type: string;
  unitId: string | null;
  topicId: string | null;
  slug: string;
  totalQuestions: number | null;
  isPro: boolean | null;
  isFreeAccess: boolean | null;
  isLiteAccess: boolean | null;
  isProAccess: boolean | null;
  isHidden: boolean | null;
  maxRetries: number | null;
  displayOrder: number | null;
  tags: string[] | null; // JSON array — ['MISC', '2026', 'no-instant-mode'] etc.
  createdAt: Date | null;
  topicName: string | null;
  topicNameEn: string | null;
}

interface Props {
  initialTests: AdminTest[];
  initialAttemptLimits: Record<string, number | null>;
}

export default function TestAccessClient({ initialTests, initialAttemptLimits }: Props) {
  const router = useRouter();
  const [tests, setTests] = useState(initialTests);
  const [attemptLimits, setAttemptLimits] = useState(initialAttemptLimits);
  const [activeFilter, setActiveFilter] = useState<TestType | 'ALL'>('ALL');
  const [isPending, startTransition] = useTransition();
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [editTitleValue, setEditTitleValue] = useState('');
  const [editTitleEnValue, setEditTitleEnValue] = useState('');
  const [editingOrder, setEditingOrder] = useState<string | null>(null);
  const [editOrderValue, setEditOrderValue] = useState('');
  const [editingLimit, setEditingLimit] = useState<string | null>(null);
  const [editLimitValue, setEditLimitValue] = useState('');
  const [unitFilter, setUnitFilter] = useState<string | null>(null);
  const PAGE_SIZE = 30;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Filter tests by type + unit sub-filter
  const filteredTests = (() => {
    let result = activeFilter === 'ALL' ? tests : tests.filter((t) => t.type === activeFilter);

    if (unitFilter) {
      if (activeFilter === 'TOPIC') {
        result = result.filter((t) => t.unitId === unitFilter);
      } else if (activeFilter === 'PYQ' || activeFilter === 'UPSC_PYQ') {
        // Filter by subject slug part
        // Supports: pyq-{subject}-... OR upsc-pyq-{subject}-...
        result = result.filter((t) =>
          t.slug.includes(`pyq-${unitFilter}-`) || t.slug.includes(`upsc-pyq-${unitFilter}-`)
        );
      }
    }
    return result;
  })();

  // Get unique unitIds for TOPIC tests (for sub-filter)
  const topicUnitIds =
    activeFilter === 'TOPIC'
      ? [
          ...new Set(tests.filter((t) => t.type === 'TOPIC' && t.unitId).map((t) => t.unitId!)),
        ].sort()
      : [];

  const visibleTests = filteredTests.slice(0, visibleCount);
  const hasMore = visibleCount < filteredTests.length;

  // Count tests per type — filter badge me dikhta hai
  const typeCounts = tests.reduce(
    (acc, t) => {
      acc[t.type] = (acc[t.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // Single flag toggle — ek test ka ek flag
  const handleToggle = (
    testId: string,
    field: 'isFreeAccess' | 'isLiteAccess' | 'isProAccess',
    currentValue: boolean
  ) => {
    const newValue = !currentValue;

    setTests((prev) => prev.map((t) => (t.id === testId ? { ...t, [field]: newValue } : t)));

    startTransition(async () => {
      try {
        await toggleTestAccess(testId, field, newValue);
        await revalidateSyllabus();
        toast.success(`Access updated!`);
      } catch {
        setTests((prev) =>
          prev.map((t) => (t.id === testId ? { ...t, [field]: currentValue } : t))
        );
        toast.error('Update failed');
      }
    });
  };

  // Hidden toggle
  const handleToggleHidden = (testId: string, currentValue: boolean) => {
    const newValue = !currentValue;
    setTests((prev) => prev.map((t) => (t.id === testId ? { ...t, isHidden: newValue } : t)));
    startTransition(async () => {
      try {
        await toggleTestHidden(testId, newValue);
        toast.success(newValue ? 'Test hidden!' : 'Test visible!');
      } catch {
        setTests((prev) =>
          prev.map((t) => (t.id === testId ? { ...t, isHidden: currentValue } : t))
        );
        toast.error('Update failed');
      }
    });
  };

  // Instant Mode toggle — tags me 'no-instant-mode' add/remove karo
  const handleToggleInstantMode = (testId: string, currentlyDisabled: boolean) => {
    const newDisabled = !currentlyDisabled;
    // Optimistic update — tags array me 'no-instant-mode' add/remove
    setTests((prev) =>
      prev.map((t) => {
        if (t.id !== testId) return t;
        const currentTags = t.tags ?? [];
        const newTags = newDisabled
          ? [...new Set([...currentTags, 'no-instant-mode'])]
          : currentTags.filter((tag) => tag !== 'no-instant-mode');
        return { ...t, tags: newTags };
      })
    );
    startTransition(async () => {
      try {
        const result = await toggleInstantMode(testId, newDisabled);
        if (!result.success) throw new Error(result.error);
        toast.success(newDisabled ? 'Instant Mode disabled!' : 'Instant Mode enabled!');
      } catch {
        // Revert on failure
        setTests((prev) =>
          prev.map((t) => {
            if (t.id !== testId) return t;
            const currentTags = t.tags ?? [];
            const revertTags = currentlyDisabled
              ? [...new Set([...currentTags, 'no-instant-mode'])]
              : currentTags.filter((tag) => tag !== 'no-instant-mode');
            return { ...t, tags: revertTags };
          })
        );
        toast.error('Toggle fail');
      }
    });
  };

  // Delete test — confirm popup → server delete → list se hatao
  const handleDeleteTest = (testId: string, title: string) => {
    if (!window.confirm(`"${title}" permanently delete ho jayega.\nQuestions, attempts sab ud jayega. Sure ho?`)) {
      return;
    }
    startTransition(async () => {
      try {
        const result = await deleteTest(testId);
        if (result.success) {
          setTests((prev) => prev.filter((t) => t.id !== testId));
          toast.success('Test deleted!');
        } else {
          toast.error(result.error || 'Delete fail');
        }
      } catch {
        toast.error('Delete fail ho gaya');
      }
    });
  };

  // ── Edit Content state — blog-access jaisa pattern ──────────
  const [editOpen, setEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editTestId, setEditTestId] = useState<string | null>(null);
  const [editTestTitle, setEditTestTitle] = useState('');
  const [editQuestionsJson, setEditQuestionsJson] = useState('');

  // Edit click — test ka questions JSON fetch karke dialog kholo
  const handleEditContentClick = async (testId: string, title: string) => {
    setEditLoading(true);
    setEditTestId(testId);
    setEditTestTitle(title);
    setEditQuestionsJson(''); // Clear stale data
    setEditOpen(true);

    try {
      const result = await getTestWithQuestions(testId);
      if (!result.success || !result.questionsJson) {
        toast.error(result.error || 'Test fetch fail');
        setEditOpen(false);
        return;
      }
      setEditQuestionsJson(JSON.stringify(result.questionsJson, null, 2));
    } catch {
      toast.error('Test fetch fail ho gaya');
      setEditOpen(false);
    } finally {
      setEditLoading(false);
    }
  };

  // Edit submit — updated questions server pe bhejo
  const handleEditContentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTestId) return;

    // Validate JSON pehle
    try {
      const parsed = JSON.parse(editQuestionsJson);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        toast.error('Non-empty JSON array chahiye bhai');
        return;
      }
    } catch {
      toast.error('JSON format galat h — check karo');
      return;
    }

    setEditLoading(true);
    startTransition(async () => {
      try {
        const result = await updateTestContent(editTestId, { questionsJson: editQuestionsJson });
        if (!result.success) {
          toast.error(result.error || 'Update fail');
        } else {
          toast.success('Test content updated! 🎉');
          setEditOpen(false);

          // Local state me question count update karo
          try {
            const parsed = JSON.parse(editQuestionsJson);
            setTests((prev) =>
              prev.map((t) =>
                t.id === editTestId ? { ...t, totalQuestions: parsed.length } : t
              )
            );
          } catch { /* page refresh pe sahi aa jayega */ }
        }
      } catch {
        toast.error('Unexpected error');
      } finally {
        setEditLoading(false);
      }
    });
  };

  // Save title (Bilingual)
  const handleSaveTitle = (testId: string) => {
    if (!editTitleValue.trim()) return;

    setTests((prev) =>
      prev.map((t) =>
        t.id === testId
          ? {
              ...t,
              title: editTitleValue.trim(),
              titleEn: editTitleEnValue.trim() || null,
            }
          : t
      )
    );
    setEditingTitle(null);
    startTransition(async () => {
      try {
        await updateTestTitle(testId, editTitleValue.trim(), editTitleEnValue.trim() || null);
        toast.success('Title updated!');
      } catch {
        router.refresh();
        toast.error('Title update failed');
      }
    });
  };

  // Save display order
  const handleSaveOrder = (testId: string) => {
    const order = parseInt(editOrderValue);
    if (isNaN(order)) return;
    setTests((prev) => prev.map((t) => (t.id === testId ? { ...t, displayOrder: order } : t)));
    setEditingOrder(null);
    startTransition(async () => {
      try {
        await updateTestDisplayOrder(testId, order);
        toast.success('Order updated!');
      } catch {
        router.refresh();
        toast.error('Order update failed');
      }
    });
  };

  // Bulk action — ek type ke sab tests
  const handleBulkUpdate = (
    type: TestType,
    field: 'isFreeAccess' | 'isLiteAccess' | 'isProAccess',
    value: boolean
  ) => {
    // Optimistic update
    setTests((prev) => prev.map((t) => (t.type === type ? { ...t, [field]: value } : t)));

    startTransition(async () => {
      try {
        await bulkUpdateTestAccess(type, field, value);
        await revalidateSyllabus();
        toast.success(`All ${type} tests updated!`);
      } catch {
        // Reload fresh on failure
        router.refresh();
        toast.error('Bulk update failed');
      }
    });
  };

  // Bulk maxRetries update
  const [bulkRetriesValue, setBulkRetriesValue] = useState('5');
  const handleBulkMaxRetries = (type: TestType) => {
    const val = bulkRetriesValue.trim();
    const maxRetries = val === '' || val === '0' ? null : parseInt(val);
    if (val !== '' && val !== '0' && isNaN(maxRetries!)) return;

    setTests((prev) => prev.map((t) => (t.type === type ? { ...t, maxRetries } : t)));
    startTransition(async () => {
      try {
        await bulkUpdateMaxRetries(type, maxRetries);
        toast.success(`All ${type} tests maxRetries → ${maxRetries ?? '∞'}!`);
      } catch {
        router.refresh();
        toast.error('Bulk maxRetries update failed');
      }
    });
  };

  // Save attempt limit for a test type
  const handleSaveLimit = (type: string) => {
    const val = editLimitValue.trim().toLowerCase();
    const maxAttempts = val === '' || val === '0' ? null : parseInt(editLimitValue);
    if (val !== '' && val !== '0' && isNaN(maxAttempts!)) return;

    setAttemptLimits((prev) => ({ ...prev, [type]: maxAttempts }));
    setEditingLimit(null);
    startTransition(async () => {
      try {
        await updateAttemptLimit(type as TestType, maxAttempts);
        toast.success(`${type} attempt limit updated!`);
      } catch {
        router.refresh();
        toast.error('Update failed');
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <div className="mx-auto max-w-6xl space-y-6 p-6">
        {/* ── Header ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/admin/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
                <Shield className="h-6 w-6 text-slate-700" />
                Test Access Manager
              </h1>
              <p className="text-sm text-slate-500">
                Toggle karo kaun kaunsa test de sakta hai — turant reflect hoga
              </p>
            </div>
          </div>
          <Badge variant="outline" className="px-3 py-1 text-sm">
            {tests.length} Tests
          </Badge>
          <form
            action={async () => {
              try {
                // Use top-level import
                const res = await syncSubjectParts();
                if (res?.success) {
                  toast.success(`Synced ${res.createdCount} new subject parts!`);
                  router.refresh();
                } else {
                  toast.error('Sync failed');
                }
              } catch (err: any) {
                console.error('Sync error:', err);
                toast.error('Sync failed: ' + (err.message || 'Unknown error'));
              }
            }}
          >
            <Button
              size="sm"
              variant="outline"
              className="gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            >
              <RotateCcw className="h-4 w-4" />
              Sync PYQ Parts
            </Button>
          </form>
        </div>

        {/* ── Filter Tabs ────────────────────────────────────── */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={activeFilter === 'ALL' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setActiveFilter('ALL');
              setUnitFilter(null);
              setVisibleCount(PAGE_SIZE);
            }}
            className="gap-1"
          >
            <Filter className="h-3 w-3" /> All ({tests.length})
          </Button>
          {(Object.keys(TYPE_CONFIG) as TestType[]).map((type) => (
            <Button
              key={type}
              variant={activeFilter === type ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setActiveFilter(type);
                setUnitFilter(null);
                setVisibleCount(PAGE_SIZE);
              }}
            >
              {TYPE_CONFIG[type].emoji} {TYPE_CONFIG[type].label} ({typeCounts[type] || 0})
            </Button>
          ))}
        </div>

        {/* ── Unit Sub-Filter (TOPIC filter active hone par) ──── */}
        {topicUnitIds.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <Button
              variant={unitFilter === null ? 'default' : 'outline'}
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                setUnitFilter(null);
                setVisibleCount(PAGE_SIZE);
              }}
            >
              All Units ({tests.filter((t) => t.type === 'TOPIC').length})
            </Button>
            {topicUnitIds.map((uid) => {
              const count = tests.filter((t) => t.type === 'TOPIC' && t.unitId === uid).length;
              return (
                <Button
                  key={uid}
                  variant={unitFilter === uid ? 'default' : 'outline'}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => {
                    setUnitFilter(uid);
                    setVisibleCount(PAGE_SIZE);
                  }}
                >
                  {uid.replace('unit_', 'U')} ({count})
                </Button>
              );
            })}
          </div>
        )}

        {/* ── Subject Sub-Filter (PYQ filter active hone par) ──── */}
        {(activeFilter === 'PYQ' || activeFilter === 'UPSC_PYQ') && (
          <div className="animation-fade-in flex flex-wrap gap-1.5">
            <Button
              variant={unitFilter === null ? 'default' : 'outline'}
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                setUnitFilter(null);
                setVisibleCount(PAGE_SIZE);
              }}
            >
              All Subjects
            </Button>
            {Array.from(
              new Set(
                tests
                  .filter(
                    (t) =>
                      (t.type === 'PYQ' || t.type === 'UPSC_PYQ') &&
                      (t.slug.startsWith('pyq-') || t.slug.startsWith('upsc-pyq-'))
                  )
                  .map((t) => {
                    // pyq-history-part-1 -> history
                    // upsc-pyq-polity-part-1 -> polity
                    const parts = t.slug.split('-');
                    if (parts[0] === 'pyq' && parts.length >= 4) {
                      return parts[1]; // subject
                    }
                    if (parts[0] === 'upsc' && parts[1] === 'pyq' && parts.length >= 4) {
                      return parts[2]; // subject
                    }
                    return null;
                  })
                  .filter(Boolean) as string[]
              )
            )
              .sort()
              .map((subject) => {
                // Capitalize first letter
                const label = subject.charAt(0).toUpperCase() + subject.slice(1);
                // Count
                const count = tests.filter(
                  (t) =>
                    (t.type === 'PYQ' || t.type === 'UPSC_PYQ') &&
                    (t.slug.includes(`pyq-${subject}-`) || t.slug.includes(`upsc-pyq-${subject}-`))
                ).length;

                return (
                  <Button
                    key={subject}
                    variant={unitFilter === subject ? 'default' : 'outline'}
                    size="sm"
                    className="h-7 text-xs capitalize"
                    onClick={() => {
                      setUnitFilter(subject);
                      setVisibleCount(PAGE_SIZE);
                    }}
                  >
                    {label} ({count})
                  </Button>
                );
              })}
          </div>
        )}

        {/* ── Bulk Actions ────────────────────────────────────── */}
        {activeFilter !== 'ALL' && (
          <Card className="border-2 border-dashed border-slate-200">
            <CardContent className="p-4">
              <p className="mb-3 text-sm font-bold text-slate-600">
                ⚡ Bulk Action — All {TYPE_CONFIG[activeFilter].label} Tests:
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                  onClick={() => handleBulkUpdate(activeFilter, 'isFreeAccess', true)}
                >
                  <Users className="h-3 w-3" /> All Free ON
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 border-blue-200 text-blue-700 hover:bg-blue-50"
                  onClick={() => handleBulkUpdate(activeFilter, 'isLiteAccess', true)}
                >
                  <Zap className="h-3 w-3" /> All Lite ON
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 border-amber-200 text-amber-700 hover:bg-amber-50"
                  onClick={() => handleBulkUpdate(activeFilter, 'isProAccess', true)}
                >
                  <Crown className="h-3 w-3" /> All Pro ON
                </Button>
                <div className="mx-1 h-6 w-px self-center bg-slate-200" />
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 border-red-200 text-red-600 hover:bg-red-50"
                  onClick={() => {
                    handleBulkUpdate(activeFilter, 'isFreeAccess', false);
                    handleBulkUpdate(activeFilter, 'isLiteAccess', false);
                  }}
                >
                  Lock All (Pro Only)
                </Button>
                <div className="mx-1 h-6 w-px self-center bg-slate-200" />
                <div className="flex items-center gap-1.5">
                  <RotateCcw className="h-3 w-3 text-slate-500" />
                  <span className="text-xs text-slate-500">Max Retries:</span>
                  <Input
                    type="number"
                    min={0}
                    value={bulkRetriesValue}
                    onChange={(e) => setBulkRetriesValue(e.target.value)}
                    className="h-7 w-16 px-1 text-center text-sm font-bold"
                    placeholder="∞"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 gap-1 border-violet-200 text-violet-700 hover:bg-violet-50"
                    onClick={() => handleBulkMaxRetries(activeFilter)}
                  >
                    <Check className="h-3 w-3" /> Set All
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Legend ──────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-4 rounded-lg border bg-white p-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3 text-emerald-600" /> Free = Guest/Free users
          </span>
          <span className="flex items-center gap-1">
            <Zap className="h-3 w-3 text-blue-600" /> Lite = paid plan
          </span>
          <span className="flex items-center gap-1">
            <Crown className="h-3 w-3 text-amber-600" /> Pro = premium plan
          </span>
          <span className="flex items-center gap-1">
            <EyeOff className="h-3 w-3 text-red-500" /> Hidden = users ko nahi dikhega
          </span>
          <span className="text-slate-400">| ON = access hai, OFF = locked 🔒</span>
        </div>

        {/* ── Test Attempt Limits ─────────────────────────────── */}
        <Card className="border border-slate-200">
          <CardContent className="p-4">
            <p className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-600">
              <RotateCcw className="h-4 w-4" /> Test Attempt Limits
              <span className="text-[10px] font-normal text-slate-400">
                (0 or empty = unlimited)
              </span>
            </p>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
              {(Object.keys(TYPE_CONFIG) as TestType[]).map((type) => {
                const limit = attemptLimits[type];
                const isEditing = editingLimit === type;
                return (
                  <div
                    key={type}
                    className={cn(
                      'flex flex-col items-center gap-2 rounded-xl border p-3',
                      TYPE_CONFIG[type].color.replace('text-', 'border-').split(' ')[0],
                      'bg-white'
                    )}
                  >
                    <span className="text-xs font-bold">
                      {TYPE_CONFIG[type].emoji} {type}
                    </span>
                    {isEditing ? (
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          min={0}
                          value={editLimitValue}
                          onChange={(e) => setEditLimitValue(e.target.value)}
                          className="h-7 w-16 px-1 text-center text-sm font-bold"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveLimit(type);
                            if (e.key === 'Escape') setEditingLimit(null);
                          }}
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-emerald-600"
                          onClick={() => handleSaveLimit(type)}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingLimit(type);
                          setEditLimitValue(limit != null ? String(limit) : '');
                        }}
                        className="text-lg font-black text-slate-900 transition-colors hover:text-blue-600"
                      >
                        {limit != null ? limit : '∞'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* ── Test Cards ──────────────────────────────────────── */}
        <div className="space-y-3">
          {filteredTests.length === 0 ? (
            <div className="py-12 text-center text-slate-400">No tests found for this filter.</div>
          ) : (
            visibleTests.map((test) => {
              const typeConfig = TYPE_CONFIG[test.type as TestType] || TYPE_CONFIG.TOPIC;
              const isHidden = test.isHidden ?? false;

              return (
                <Card
                  key={test.id}
                  className={cn(
                    'border transition-all',
                    isPending && 'opacity-70',
                    isHidden && 'border-dashed border-red-200 bg-red-50/30 opacity-60'
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center">
                      {/* Test Info */}
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <Badge className={cn('text-xs', typeConfig.color)}>
                            {typeConfig.emoji} {test.type}
                          </Badge>
                          {test.unitId && (
                            <Badge variant="outline" className="text-xs">
                              {test.unitId.replace('unit_', 'U')}
                            </Badge>
                          )}
                          <span className="text-xs text-slate-400">
                            {test.totalQuestions || 0}Q
                          </span>
                          <span className="text-xs font-medium text-violet-500">
                            {test.maxRetries != null ? `${test.maxRetries} retries` : '∞ retries'}
                          </span>
                          {isHidden && (
                            <Badge
                              variant="outline"
                              className="border-red-200 bg-red-50 text-xs text-red-600"
                            >
                              <EyeOff className="mr-1 h-3 w-3" /> Hidden
                            </Badge>
                          )}
                        </div>

                        {/* Title — inline editable (Bilingual) */}
                        {editingTitle === test.id ? (
                          <div className="mt-1 flex w-full max-w-md flex-col gap-2">
                            <Input
                              value={editTitleValue}
                              onChange={(e) => setEditTitleValue(e.target.value)}
                              className="h-8 text-sm font-semibold"
                              placeholder="Hindi Title"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveTitle(test.id);
                                if (e.key === 'Escape') setEditingTitle(null);
                              }}
                            />
                            <Input
                              value={editTitleEnValue}
                              onChange={(e) => setEditTitleEnValue(e.target.value)}
                              className="h-8 text-sm font-medium"
                              placeholder="English Title"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveTitle(test.id);
                                if (e.key === 'Escape') setEditingTitle(null);
                              }}
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="default"
                                className="h-7 bg-emerald-600 px-3 hover:bg-emerald-700"
                                onClick={() => handleSaveTitle(test.id)}
                              >
                                <Check className="mr-1 h-3 w-3" /> Save
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-3 text-slate-500"
                                onClick={() => setEditingTitle(null)}
                              >
                                <X className="mr-1 h-3 w-3" /> Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="group">
                            <div className="flex items-start gap-2">
                              <div>
                                <h3 className="leading-snug font-semibold text-slate-900">
                                  {test.title}
                                </h3>
                                {test.titleEn && (
                                  <p className="text-sm font-medium text-slate-500">
                                    {test.titleEn}
                                  </p>
                                )}

                                {/* Show Linked Topic Name for Context (if available) */}
                                {test.type === 'TOPIC' && test.topicName && (
                                  <div className="mt-1 flex items-center gap-1.5">
                                    <Badge
                                      variant="outline"
                                      className="h-5 border-slate-200 px-1.5 py-0 text-[10px] font-normal text-slate-400"
                                    >
                                      Linked: {test.topicName}
                                    </Badge>
                                  </div>
                                )}
                              </div>

                              <button
                                onClick={() => {
                                  setEditingTitle(test.id);
                                  setEditTitleValue(test.title);
                                  setEditTitleEnValue(test.titleEn || '');
                                }}
                                className="p-1 text-slate-400 opacity-0 transition-opacity group-hover:opacity-100 hover:text-blue-600"
                                title="Rename Test"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Display Order — inline editable */}
                        <div className="mt-1 flex items-center gap-2">
                          <Hash className="h-3 w-3 text-slate-400" />
                          {editingOrder === test.id ? (
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                value={editOrderValue}
                                onChange={(e) => setEditOrderValue(e.target.value)}
                                className="h-6 w-16 px-1 text-xs"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveOrder(test.id);
                                  if (e.key === 'Escape') setEditingOrder(null);
                                }}
                              />
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-5 w-5 text-emerald-600"
                                onClick={() => handleSaveOrder(test.id)}
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-5 w-5 text-slate-400"
                                onClick={() => setEditingOrder(null)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingOrder(test.id);
                                setEditOrderValue(String(test.displayOrder ?? 0));
                              }}
                              className="text-xs text-slate-500 transition-colors hover:text-slate-800"
                            >
                              Order: {test.displayOrder ?? 0}
                            </button>
                          )}
                        </div>

                        {/* Created At timestamp */}
                        {test.createdAt && (
                          <div className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-400">
                            <Calendar className="h-3 w-3" />
                            {new Date(test.createdAt).toLocaleDateString('en-IN', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                            ,{' '}
                            {new Date(test.createdAt).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        )}

                        {/* Test ID with copy */}
                        <div className="group/id mt-1 flex items-center gap-1.5 text-[10px] text-slate-400">
                          <span className="font-mono select-all">{test.id}</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(test.id);
                              toast.success('ID copied!');
                            }}
                            className="text-slate-400 opacity-0 transition-opacity group-hover/id:opacity-100 hover:text-slate-700"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      </div>

                      {/* Controls: Hidden + Access Toggles */}
                      <div className="flex shrink-0 items-center gap-6">
                        {/* Hidden Toggle */}
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[10px] font-bold tracking-wider text-red-500 uppercase">
                            Hide
                          </span>
                          <Switch
                            checked={isHidden}
                            onCheckedChange={() => handleToggleHidden(test.id, isHidden)}
                            className="data-[state=checked]:bg-red-500"
                          />
                        </div>

                        <div className="h-8 w-px bg-slate-200" />

                        {/* Free Access */}
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[10px] font-bold tracking-wider text-emerald-600 uppercase">
                            Free
                          </span>
                          <Switch
                            checked={test.isFreeAccess ?? false}
                            onCheckedChange={() =>
                              handleToggle(test.id, 'isFreeAccess', test.isFreeAccess ?? false)
                            }
                            className="data-[state=checked]:bg-emerald-500"
                          />
                        </div>

                        {/* Lite Access */}
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[10px] font-bold tracking-wider text-blue-600 uppercase">
                            Lite
                          </span>
                          <Switch
                            checked={test.isLiteAccess ?? false}
                            onCheckedChange={() =>
                              handleToggle(test.id, 'isLiteAccess', test.isLiteAccess ?? false)
                            }
                            className="data-[state=checked]:bg-blue-500"
                          />
                        </div>

                        {/* Pro Access */}
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[10px] font-bold tracking-wider text-amber-600 uppercase">
                            Pro
                          </span>
                          <Switch
                            checked={test.isProAccess ?? true}
                            onCheckedChange={() =>
                              handleToggle(test.id, 'isProAccess', test.isProAccess ?? true)
                            }
                            className="data-[state=checked]:bg-amber-500"
                          />
                        </div>

                        {/* Instant Mode — 'no-instant-mode' tag toggle */}
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[10px] font-bold tracking-wider text-purple-600 uppercase">
                            Instant
                          </span>
                          <Switch
                            checked={
                              !(test.tags?.includes('no-instant-mode'))
                            }
                            onCheckedChange={() => {
                              const isDisabled = test.tags?.includes('no-instant-mode') ?? false;
                              handleToggleInstantMode(test.id, isDisabled);
                            }}
                            className="data-[state=checked]:bg-purple-500"
                          />
                        </div>

                        <div className="h-8 w-px bg-slate-200" />
                        <button
                          onClick={() => handleEditContentClick(test.id, test.title)}
                          disabled={isPending}
                          className="rounded-md p-1.5 text-slate-300 transition-colors hover:bg-indigo-50 hover:text-indigo-500 disabled:opacity-50"
                          title="Edit test questions"
                        >
                          <FileText className="h-4 w-4" />
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteTest(test.id, test.title)}
                          disabled={isPending}
                          className="rounded-md p-1.5 text-slate-300 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                          title="Delete test permanently"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
        {hasMore && (
          <div className="pt-2 text-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
            >
              Load More ({filteredTests.length - visibleCount} remaining)
            </Button>
          </div>
        )}
      </div>

      {/* ── Edit Content Dialog — blog-access jaisa pattern ──── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-900">
              <FileText className="h-5 w-5 text-emerald-600" />
              Edit Test Questions
            </DialogTitle>
            <DialogDescription>
              "{editTestTitle}" — Questions JSON edit karo, same format jaise upload karte ho
            </DialogDescription>
          </DialogHeader>

          {editLoading && !editQuestionsJson ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
          ) : (
            <form onSubmit={handleEditContentSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="flex justify-between">
                  <span>Questions JSON Array</span>
                  <span className="text-xs font-normal text-slate-400">
                    Format: <code>[{`{ "questionText": "...", "correctAnswer": 0 }`}]</code>
                  </span>
                </Label>
                <Textarea
                  value={editQuestionsJson}
                  onChange={(e) => setEditQuestionsJson(e.target.value)}
                  className="h-[400px] bg-slate-50 font-mono text-xs"
                  placeholder='[{ "questionText": "...", "options": [...], "correctAnswer": 0 }]'
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                disabled={editLoading}
              >
                {editLoading ? (
                  <Loader2 className="mr-2 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                Save Questions
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

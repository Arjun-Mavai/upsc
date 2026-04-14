'use client';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💰 ADMIN PRICING — UPSC Pro Plan Only
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, IndianRupee, Save, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { type PricingData, PRICING_DEFAULTS } from '@/config/pricing';
import { API } from '@/config/endpoints';

export default function AdminPricingPage() {
  const [activeExam, setActiveExam] = useState<'upsc' | 'mppsc' | 'mppolice'>('upsc');
  const [data, setData] = useState<PricingData>(PRICING_DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchPricing = async (exam: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API.PRICING}?examType=${exam}`, { cache: 'no-store' });
      const json = await res.json();
      if (json.pricing) setData(json.pricing);
    } catch {
      /* defaults stay */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPricing(activeExam);
  }, [activeExam]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(API.PRICING, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, examType: activeExam }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success(json.message || `Pricing updated for ${activeExam.toUpperCase()}!`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    'w-full h-10 px-3 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-sm bg-white';
  const labelClass = 'text-xs font-semibold text-slate-600 uppercase tracking-wider';

  const updateField = (key: keyof PricingData, value: string | number) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold md:text-2xl">
            <IndianRupee className="h-5 w-5 text-emerald-600" />
            Pricing Manager
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage pricing for UPSC, MPPSC, and MP Police platforms
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchPricing(activeExam)}
          disabled={loading}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* ── Exam Type Selector ───────────────────────────────── */}
      <div className="flex p-1 bg-slate-100 rounded-xl">
        {(['upsc', 'mppsc', 'mppolice'] as const).map((exam) => (
          <button
            key={exam}
            onClick={() => setActiveExam(exam)}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
              activeExam === exam
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {exam.toUpperCase()}
          </button>
        ))}
      </div>

      {/* ── Pro Plan Card ──────────────────────────────────── */}
      <div className="space-y-3 rounded-xl border-2 border-indigo-600 bg-white p-4 shadow-sm md:p-6">
        <h2 className="flex items-center gap-2 font-bold text-slate-800">👑 UPSC Pro Plan</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className={labelClass}>Current Price (₹)</label>
            <input
              type="number"
              value={data.proPrice}
              onChange={(e) => updateField('proPrice', Number(e.target.value))}
              className={inputClass}
            />
          </div>
          <div className="space-y-1">
            <label className={labelClass}>Original / Strike (₹)</label>
            <input
              type="number"
              value={data.proOriginalPrice}
              onChange={(e) => updateField('proOriginalPrice', Number(e.target.value))}
              className={inputClass}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className={labelClass}>Validity Text</label>
            <input
              type="text"
              value={data.proValidityText}
              onChange={(e) => updateField('proValidityText', e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="space-y-1">
            <label className={labelClass}>Duration (months)</label>
            <input
              type="number"
              value={data.proMonths}
              onChange={(e) => updateField('proMonths', Number(e.target.value))}
              className={inputClass}
            />
          </div>
        </div>
        <div className="rounded-lg bg-indigo-50 p-3 text-sm">
          <span className="text-slate-400 line-through">₹{data.proOriginalPrice}</span>
          <span className="ml-2 text-xl font-black text-slate-900">₹{data.proPrice}</span>
          <span className="ml-2 text-xs font-bold text-emerald-600">
            {Math.round((1 - data.proPrice / data.proOriginalPrice) * 100)}% OFF
          </span>
          <span className="ml-2 text-xs text-slate-400">
            ~ ₹{Math.round(data.proPrice / data.proMonths)}/mo • {data.proMonths} months
          </span>
        </div>
      </div>

      {/* ── Lite Plan Card ──────────────────────────────────── */}
      <div className="space-y-3 rounded-xl border-2 border-amber-500 bg-white p-4 shadow-sm md:p-6">
        <h2 className="flex items-center gap-2 font-bold text-slate-800">⚡ UPSC Lite Plan</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className={labelClass}>Current Price (₹)</label>
            <input
              type="number"
              value={data.litePrice}
              onChange={(e) => updateField('litePrice', Number(e.target.value))}
              className={inputClass}
            />
          </div>
          <div className="space-y-1">
            <label className={labelClass}>Original / Strike (₹)</label>
            <input
              type="number"
              value={data.liteOriginalPrice}
              onChange={(e) => updateField('liteOriginalPrice', Number(e.target.value))}
              className={inputClass}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className={labelClass}>Validity Text</label>
            <input
              type="text"
              value={data.liteValidityText}
              onChange={(e) => updateField('liteValidityText', e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="space-y-1">
            <label className={labelClass}>Duration (months)</label>
            <input
              type="number"
              value={data.liteMonths}
              onChange={(e) => updateField('liteMonths', Number(e.target.value))}
              className={inputClass}
            />
          </div>
        </div>
        <div className="rounded-lg bg-amber-50 p-3 text-sm">
          <span className="text-slate-400 line-through">₹{data.liteOriginalPrice}</span>
          <span className="ml-2 text-xl font-black text-slate-900">₹{data.litePrice}</span>
          <span className="ml-2 text-xs font-bold text-emerald-600">
            {Math.round((1 - data.litePrice / data.liteOriginalPrice) * 100)}% OFF
          </span>
        </div>
      </div>

      {/* ── Upgrade Pricing ──────────────────────────────────── */}
      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
        <h2 className="font-bold text-slate-800">🔄 Lite → Pro Upgrade</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className={labelClass}>Upgrade Price (₹)</label>
            <input
              type="number"
              value={data.upgradePrice}
              onChange={(e) => updateField('upgradePrice', Number(e.target.value))}
              className={inputClass}
            />
          </div>
          <div className="space-y-1">
            <label className={labelClass}>Original Price (₹)</label>
            <input
              type="number"
              value={data.upgradeOriginalPrice}
              onChange={(e) => updateField('upgradeOriginalPrice', Number(e.target.value))}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* ── Urgency Text ───────────────────────────────────── */}
      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
        <h2 className="font-bold text-slate-800">🔥 Urgency Banner</h2>
        <div className="space-y-1">
          <label className={labelClass}>Students Bought (FOMO Number)</label>
          <input
            type="number"
            value={data.studentsBought}
            onChange={(e) => updateField('studentsBought', Number(e.target.value))}
            className={inputClass}
          />
          <p className="text-[11px] text-slate-400">
            Shows on pricing page as "X+ joined" badge
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <label className={labelClass}>Urgency Text (English)</label>
            <input
              type="text"
              value={data.urgencyText}
              onChange={(e) => updateField('urgencyText', e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="space-y-1">
            <label className={labelClass}>Urgency Text (Hindi)</label>
            <input
              type="text"
              value={data.urgencyTextHi}
              onChange={(e) => updateField('urgencyTextHi', e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* ── Save Button ────────────────────────────────────── */}
      <Button onClick={handleSave} disabled={saving} className="w-full h-12 text-base font-bold">
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
        {saving ? 'Saving...' : 'Save Changes'}
      </Button>
    </div>
  );
}

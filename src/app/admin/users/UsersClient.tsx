'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Search,
  RefreshCw,
  Users,
  Crown,
  Zap,
  Clock,
  AlertTriangle,
  Shield,
  Pencil,
  Gift,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Key,
  Mail,
  HelpCircle,
  CreditCard,
  Info,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { generateManualPasswordLink, testResendEmail } from '@/actions/admin-actions';

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string | null;
  planTier: string | null;
  isSubscribed: boolean | null;
  isActive: boolean | null;
  createdAt: string | null;
  deletedAt: string | null;
  accessExpiresAt: string | null;
  phone: string | null;
  metadata: any;
  previousUserId: string | null;
  examType: 'upsc' | 'mppsc' | 'all' | 'mppolice';
}

interface Stats {
  total: number;
  active: number;
  expired: number;
  deleted: number;
  inactive: number;
  free: number;
  lite: number;
  pro: number;
  migrations: number;
}

interface ActivityLog {
  id: string;
  userId?: string; // Add this
  userEmail: string;
  userName: string | null;
  action: 'PLAN_CHANGE' | 'DELETE' | 'GRANT' | 'UPDATE' | 'LOGIN' | 'LOGOUT';
  details: string | null; // JSON string
  createdAt: string;
  adminId: string;
}

type TabFilter = 'all' | 'active' | 'expired' | 'inactive' | 'deleted' | 'logs';

export default function UsersClient() {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<TabFilter>('all');
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [showActionHelp, setShowActionHelp] = useState(false);

  const queryClient = useQueryClient();

  const { data: usersData, isLoading: loadingUsers } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const res = await fetch('/api/admin/users', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to load users');
        throw new Error(data.error || 'Failed to load users');
      }
      return data;
    },
    enabled: tab !== 'logs',
  });

  const { data: logsData, isLoading: loadingLogs } = useQuery({
    queryKey: ['admin-logs'],
    queryFn: async () => {
      const res = await fetch('/api/admin/user-activities', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch logs');
      return data;
    },
    enabled: tab === 'logs',
  });

  const users: User[] = usersData?.users || [];
  const stats: Stats | null = usersData?.stats || null;
  const logs: ActivityLog[] = logsData?.logs || [];
  const loading = tab === 'logs' ? loadingLogs : loadingUsers;

  const [showTechGuide, setShowTechGuide] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    password: '',
    planTier: '' as string,
    accessMonths: '',
  });
  const [saving, setSaving] = useState(false);
  const [showGrant, setShowGrant] = useState(false);
  const [grantForm, setGrantForm] = useState({
    name: '',
    email: '',
    phone: '',
    planTier: 'combo' as 'lite' | 'pro' | 'mains' | 'combo',
    password: '',
    reason: '',
    accessMonths: '',
  });

  // Per-user inline grant state (for existing users inside the edit panel)
  const [inlineGrant, setInlineGrant] = useState<Record<string, { planTier: string; accessMonths: string; saving: boolean }>>({});

  // Manual payment recording state
  const [showManualPay, setShowManualPay] = useState(false);
  const [showManualHelp, setShowManualHelp] = useState(false);
  const [manualPayForm, setManualPayForm] = useState({
    userSearch: '',
    selectedUserId: '',
    selectedUserName: '',
    transactionId: '',
    amountRupees: '',
    planTier: 'combo' as 'lite' | 'mains' | 'combo',
    notes: '',
  });

  const manualPayMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch('/api/admin/record-manual-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record payment');
      return data;
    },
    onSuccess: (data, variables) => {
      toast.success(data.message);
      setShowManualPay(false);
      const userId = variables.userId;
      const planTier = variables.planTier;
      
      // Auto-expand and pre-fill grant
      setExpandedUser(userId);
      setInlineGrant(prev => ({
        ...prev,
        [userId]: { planTier, accessMonths: '6', saving: false }
      }));
      
      setManualPayForm({ 
        userSearch: '', 
        selectedUserId: '', 
        selectedUserName: '', 
        transactionId: '', 
        amountRupees: '', 
        planTier: 'combo', 
        notes: '' 
      });
      
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Network error');
    }
  });

  const handleManualPay = async () => {
    if (!manualPayForm.selectedUserId) { toast.error('User select karo pehle'); return; }
    if (!manualPayForm.transactionId.trim()) { toast.error('Transaction ID / UTR required'); return; }
    if (!manualPayForm.amountRupees || Number(manualPayForm.amountRupees) <= 0) { toast.error('Valid amount enter karo'); return; }
    
    manualPayMutation.mutate({
      userId: manualPayForm.selectedUserId,
      transactionId: manualPayForm.transactionId.trim(),
      amountRupees: Number(manualPayForm.amountRupees),
      planTier: manualPayForm.planTier,
      notes: manualPayForm.notes || undefined,
    });
  };

  const manualPayMatches = manualPayForm.userSearch.length >= 2
    ? users.filter(u => {
        const q = manualPayForm.userSearch.toLowerCase();
        return u.name?.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.phone?.includes(manualPayForm.userSearch);
      }).slice(0, 6)
    : [];

  // ── Expand user card for editing ──
  const toggleExpand = (user: User) => {
    if (expandedUser === user.id) {
      setExpandedUser(null);
      return;
    }
    setExpandedUser(user.id);
    setEditForm({
      name: user.name || '',
      email: user.email,
      password: '',
      planTier: user.planTier || 'free',
      accessMonths: '',
    });
  };

  // ── Save user changes ──
  const handleSave = async (user: User) => {
    const body: Record<string, any> = { userId: user.id };
    const changes: string[] = [];

    // Only send changed fields
    if (editForm.name && editForm.name !== user.name) {
      body.name = editForm.name;
      changes.push('name');
    }
    if (editForm.email && editForm.email !== user.email) {
      body.email = editForm.email;
      changes.push('email');
    }
    if (editForm.password) {
      body.password = editForm.password;
      changes.push('password');
    }
    if (editForm.planTier && editForm.planTier !== user.planTier) {
      body.planTier = editForm.planTier;
      changes.push('plan');
    }
    if (editForm.accessMonths) {
      body.accessMonths = Number(editForm.accessMonths);
      changes.push('expiry');
    }

    if (changes.length === 0) {
      toast.info('No changes to save');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/admin/update-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        setExpandedUser(null);
        queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error('Failed to update');
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle Active ──
  const handleToggle = async (user: User) => {
    const newActive = user.isActive === false;
    try {
      const res = await fetch('/api/admin/update-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, isActive: newActive }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      } else toast.error(data.error);
    } catch {
      toast.error('Failed');
    }
  };

  // ── Quick Plan Change ──
  const handleQuickPlan = async (userId: string, planTier: string) => {
    try {
      const res = await fetch('/api/admin/update-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, planTier, isActive: true }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      } else toast.error(data.error);
    } catch {
      toast.error('Failed');
    }
  };

  // ── Force Logout ──
  const handleForceLogout = async (userId: string) => {
    if (!confirm('Are you sure you want to force logout this user from all devices?')) return;
    try {
      const res = await fetch('/api/admin/update-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, forceLogout: true }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('User forcefully logged out from all devices');
        queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      } else toast.error(data.error);
    } catch {
      toast.error('Failed to force logout');
    }
  };

  // ── Grant Plan ──
  const handleGrant = async () => {
    if (!grantForm.name || !grantForm.email || !grantForm.password) {
      toast.error('Name, email, and password are required');
      return;
    }
    try {
      const res = await fetch('/api/admin/grant-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...grantForm,
          accessMonths: grantForm.accessMonths ? Number(grantForm.accessMonths) : undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        setShowGrant(false);
        setGrantForm({
          name: '',
          email: '',
          phone: '',
          planTier: 'combo',
          password: '',
          reason: '',
          accessMonths: '',
        });
        queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      } else toast.error(data.error);
    } catch {
      toast.error('Failed to grant plan');
    }
  };

  // ── Delete User ──
  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure? This will delete the user but keep payment history.')) return;
    if (!confirm('Double check! This cannot be undone.')) return;

    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error('Failed to delete user');
    }
  };

  // ── Generate Manual Link ──
  const handleManualLink = async (userId: string) => {
    try {
      const res = await generateManualPasswordLink(userId);
      if (res.success && res.url) {
        if (!navigator.clipboard) {
          toast.error('Clipboard is unavailable. Copy the password link manually.');
          console.log('Manual URL:', res.url);
          return;
        }

        try {
          await navigator.clipboard.writeText(res.url);
          toast.success('Password link copied! Share it with the user.');
        } catch (err) {
          toast.error('Failed to copy password link');
          console.error('Clipboard error:', err);
        }
      } else {
        toast.error(res.error || 'Failed to generate link');
      }
    } catch (error) {
      toast.error('Error generating link');
      console.error('Action error:', error);
    }
  };

  // ── Test Resend ──
  const handleTestEmail = async () => {
    const email = prompt('Enter email to receive test message:');
    if (!email) return;

    const id = toast.loading('Sending test email via Resend...');
    try {
      const res = await testResendEmail(email);
      if (res.success) {
        toast.success('Test email sent! Check your inbox.', { id });
      } else {
        toast.error(`Error: ${res.error}`, { id, duration: 6000 });
        console.error('Email Debug Details:', res.details);
      }
    } catch (err: any) {
      toast.error('Failed to execute test', { id });
    }
  };

  // ── Filter ──
  const now = new Date();
  const filteredUsers = users.filter((user) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !search ||
      user.name?.toLowerCase().includes(q) ||
      user.email.toLowerCase().includes(q) ||
      user.phone?.includes(search);
    if (!matchesSearch) return false;

    if (tab === 'active')
      return (
        !user.deletedAt &&
        user.isActive !== false &&
        (!user.accessExpiresAt || new Date(user.accessExpiresAt) >= now)
      );
    if (tab === 'expired')
      return !user.deletedAt && user.accessExpiresAt && new Date(user.accessExpiresAt) < now;
    if (tab === 'inactive') return !user.deletedAt && user.isActive === false;
    if (tab === 'deleted') return !!user.deletedAt;
    return true;
  });

  const getStatus = (user: User) => {
    if (user.deletedAt) return { label: 'Deleted', cls: 'text-red-500 bg-red-50' };
    if (user.isActive === false) return { label: 'Inactive', cls: 'text-gray-500 bg-gray-50' };
    if (user.accessExpiresAt && new Date(user.accessExpiresAt) < now)
      return { label: 'Expired', cls: 'text-amber-600 bg-amber-50' };
    return { label: 'Active', cls: 'text-emerald-600 bg-emerald-50' };
  };

  const planBadge = (tier: string | null) => {
    if (tier === 'combo' || tier === 'pro') return 'bg-gradient-to-r from-amber-500 to-orange-500 text-white';
    if (tier === 'lite') return 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white';
    if (tier === 'mains') return 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white';
    return 'bg-slate-200 text-slate-700';
  };

  const formatExpiry = (exp: string | null) => {
    if (!exp) return 'No expiry';
    const date = new Date(exp);
    const d = Math.ceil((date.getTime() - now.getTime()) / 86400000);
    const dateStr = date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    return d < 0 ? `Expired (${dateStr})` : `${d}d left (${dateStr})`;
  };

  return (
    <div className="mx-auto max-w-7xl space-y-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold md:text-2xl">User Management</h1>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => { setShowManualPay(!showManualPay); setShowGrant(false); }}
            className={`text-xs font-bold ${showManualPay ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
          >
            <CreditCard className="mr-1 h-3.5 w-3.5" />
            {showManualPay ? 'Close' : 'Record Payment'}
          </Button>
          <Button
            size="sm"
            onClick={() => { setShowGrant(!showGrant); setShowManualPay(false); }}
            className={`text-xs font-bold ${showGrant ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' : 'bg-purple-600 text-white hover:bg-purple-700'}`}
          >
            <Gift className="mr-1 h-3.5 w-3.5" />
            {showGrant ? 'Close' : 'Grant Plan'}
          </Button>
        </div>
      </div>

      {/* Grant Form */}
      {showGrant && (
        <div className="space-y-3 rounded-lg border border-purple-200 bg-purple-50 p-4">
          <div className="flex items-center gap-2">
            <Gift className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-bold text-purple-800">Grant Lite/Pro — No Payment</span>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <input
              type="text"
              value={grantForm.name}
              placeholder="Full Name *"
              onChange={(e) => setGrantForm((f) => ({ ...f, name: e.target.value }))}
              className="h-9 rounded-lg border px-3 text-xs outline-none focus:border-purple-500"
            />
            <input
              type="email"
              value={grantForm.email}
              placeholder="Email *"
              onChange={(e) => setGrantForm((f) => ({ ...f, email: e.target.value }))}
              className="h-9 rounded-lg border px-3 text-xs outline-none focus:border-purple-500"
            />
            <input
              type="text"
              value={grantForm.phone}
              placeholder="Phone"
              onChange={(e) => setGrantForm((f) => ({ ...f, phone: e.target.value }))}
              className="h-9 rounded-lg border px-3 text-xs outline-none focus:border-purple-500"
            />
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <input
              type="text"
              value={grantForm.password}
              placeholder="Password (8+ chars, Aa1) *"
              onChange={(e) => setGrantForm((f) => ({ ...f, password: e.target.value }))}
              className="h-9 rounded-lg border px-3 text-xs outline-none focus:border-purple-500"
            />
            <select
              value={grantForm.planTier}
              onChange={(e) =>
                setGrantForm((f) => ({ ...f, planTier: e.target.value as any }))
              }
              className="h-9 rounded-lg border bg-white px-3 text-xs outline-none focus:border-purple-500"
            >
              <option value="lite">Pre (6 months)</option>
              <option value="mains">Mains (6 months)</option>
              <option value="combo">Combo (6 months)</option>
            </select>
            <input
              type="text"
              value={grantForm.reason}
              placeholder="Reason (optional)"
              onChange={(e) => setGrantForm((f) => ({ ...f, reason: e.target.value }))}
              className="h-9 rounded-lg border px-3 text-xs outline-none focus:border-purple-500"
            />
            <input
              type="number"
              min={1}
              max={24}
              value={grantForm.accessMonths}
              placeholder="Duration (Months - e.g. 5)"
              onChange={(e) => setGrantForm((f) => ({ ...f, accessMonths: e.target.value }))}
              className="h-9 rounded-lg border bg-white px-3 text-xs outline-none focus:border-purple-500"
            />
          </div>
          <Button
            size="sm"
            className="h-8 bg-purple-600 text-xs font-bold text-white hover:bg-purple-700"
            onClick={handleGrant}
          >
            <Gift className="mr-1 h-3 w-3" /> Create & Grant Plan
          </Button>
        </div>
      )}

      {/* ── Manual Payment Panel ── */}
      {showManualPay && (
        <div className="space-y-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          {/* Panel Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-emerald-700" />
              <span className="text-sm font-bold text-emerald-800">Record Manual Payment (UPI / NEFT / Cash)</span>
            </div>
            <button
              onClick={() => setShowManualHelp(!showManualHelp)}
              className="flex items-center gap-1 rounded-md border border-emerald-200 bg-white px-2 py-1 text-[10px] font-semibold text-emerald-700 hover:bg-emerald-100"
              title="Yeh kya karta hai?"
            >
              <HelpCircle className="h-3.5 w-3.5" />
              {showManualHelp ? 'Help band karo' : 'Kya hoga? Samjho'}
            </button>
          </div>

          {/* ── HELP SECTION ── */}
          {showManualHelp && (
            <div className="rounded-lg border border-emerald-300 bg-white p-4 text-xs leading-relaxed text-slate-700 space-y-3">
              <p className="font-bold text-emerald-800 text-[13px]">📘 Ye kya karta hai? Kab use karo?</p>

              <div className="rounded border border-amber-200 bg-amber-50 p-3">
                <p className="font-bold text-amber-800">⚠️ IMPORTANT — Ye sirf payment record karta hai!</p>
                <p className="mt-1 text-amber-700">
                  Is button se user ka <strong>plan/access UPDATE NAHI hoga</strong>. Ye sirf{' '}
                  <code className="bg-amber-100 px-1 rounded">payments</code> table mein entry daalta hai (audit trail).
                </p>
                <p className="mt-1 text-amber-700 font-semibold">
                  Access dene ke liye → User list → ✏️ Edit → &quot;Grant Access&quot; section use karo.
                </p>
              </div>

              <div className="space-y-1">
                <p className="font-semibold text-slate-800">🎯 Use Case — Kab use karo?</p>
                <p>Jab student ne UPI/NEFT/cash se payment ki ho (Razorpay se bahar), ya Razorpay page band ho gaya ho aur paise cut gaye — to us payment ka record rakhne ke liye. Books/accounting ke liye proof chahiye.</p>
              </div>

              <div className="space-y-1">
                <p className="font-semibold text-slate-800">✅ Pura 3-step admin workflow:</p>
                <ol className="list-decimal pl-4 space-y-1 text-slate-600">
                  <li><strong>Record Payment (yahan)</strong> → sirf <code className="bg-slate-100 px-1 rounded">payments</code> table mein entry. Audit trail banao.</li>
                  <li><strong>Grant Access</strong> → User dhundho → ✏️ Edit → &quot;Grant Access&quot; section → Plan + Duration set karo. Tab access milega.</li>
                  <li><strong>Password</strong> → Agar user ka password set nahi hua → 🔑 Link button → link copy karo → user ko bhejo.</li>
                </ol>
              </div>

              <div className="space-y-1">
                <p className="font-semibold text-slate-800">🗄️ DB mein kya hota hai?</p>
                <div className="rounded border border-slate-200 bg-slate-50 p-3 space-y-1">
                  <p className="font-bold text-slate-700">Table: <code className="bg-slate-200 px-1 rounded">payments</code> — sirf yahi touch hota hai</p>
                  <ul className="list-disc pl-4 text-slate-500 space-y-0.5 mt-1">
                    <li><code>paymentId</code> = tumhara Transaction/UTR ID</li>
                    <li><code>orderId</code> = <code>MANUAL-{'{UTR}'}</code></li>
                    <li><code>status</code> = <strong>captured</strong></li>
                    <li><code>amount</code> = paise mein (₹ × 100)</li>
                    <li><code>planTier</code> = jo select kiya (record ke liye)</li>
                    <li><code>notes</code> = source: admin_manual, adminId, tumhara note</li>
                  </ul>
                  <p className="mt-2 font-semibold text-red-500">mppsc_users table = TOUCH NAHI HOTA ❌</p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="font-semibold text-slate-800">🛡️ Safeguard</p>
                <p className="text-slate-600">Same Transaction ID dobara dalne par <strong>409 error</strong> aayega — duplicate entry block ho jaayegi.</p>
              </div>
            </div>
          )}

          {/* ── FORM ── */}

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {/* User search */}
            <div className="relative lg:col-span-1">
              <input
                type="text"
                value={manualPayForm.selectedUserId ? `✅ ${manualPayForm.selectedUserName}` : manualPayForm.userSearch}
                placeholder="User email/phone dhundho *"
                onChange={(e) => {
                  if (manualPayForm.selectedUserId) {
                    // Reset selection if user types again
                    setManualPayForm(f => ({ ...f, selectedUserId: '', selectedUserName: '', userSearch: e.target.value }));
                  } else {
                    setManualPayForm(f => ({ ...f, userSearch: e.target.value }));
                  }
                }}
                className={`h-9 w-full rounded-lg border px-3 text-xs outline-none focus:border-emerald-500 ${manualPayForm.selectedUserId ? 'bg-emerald-50 text-emerald-700 font-semibold' : ''}`}
              />
              {/* Dropdown suggestions */}
              {manualPayMatches.length > 0 && !manualPayForm.selectedUserId && (
                <div className="absolute top-10 left-0 right-0 z-20 rounded-lg border border-emerald-200 bg-white shadow-lg">
                  {manualPayMatches.map(u => (
                    <button
                      key={u.id}
                      onClick={() => setManualPayForm(f => ({ ...f, selectedUserId: u.id, selectedUserName: u.name || u.email, userSearch: '' }))}
                      className="flex w-full flex-col px-3 py-2 text-left text-xs hover:bg-emerald-50 border-b border-slate-100 last:border-0"
                    >
                      <span className="font-semibold text-slate-800">{u.name || '—'}</span>
                      <span className="text-slate-500">{u.email} {u.phone ? `· ${u.phone}` : ''} · <span className="font-medium">{u.planTier || 'free'}</span></span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <input
              type="text"
              value={manualPayForm.transactionId}
              placeholder="Transaction ID / UTR *"
              onChange={(e) => setManualPayForm(f => ({ ...f, transactionId: e.target.value }))}
              className="h-9 rounded-lg border px-3 text-xs outline-none focus:border-emerald-500"
            />
            <input
              type="number"
              min={1}
              value={manualPayForm.amountRupees}
              placeholder="Amount in ₹ (e.g. 1499) *"
              onChange={(e) => setManualPayForm(f => ({ ...f, amountRupees: e.target.value }))}
              className="h-9 rounded-lg border px-3 text-xs outline-none focus:border-emerald-500"
            />
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <select
              value={manualPayForm.planTier}
              onChange={(e) => setManualPayForm(f => ({ ...f, planTier: e.target.value as any }))}
              className="h-9 rounded-lg border bg-white px-3 text-xs outline-none focus:border-emerald-500"
            >
              <option value="lite">Pre — Prelims only</option>
              <option value="mains">Mains only</option>
              <option value="combo">Combo — Pre + Mains</option>
            </select>
            <input
              type="text"
              value={manualPayForm.notes}
              placeholder="Note for yourself (optional)"
              onChange={(e) => setManualPayForm(f => ({ ...f, notes: e.target.value }))}
              className="h-9 rounded-lg border px-3 text-xs outline-none focus:border-emerald-500"
            />
          </div>
          <Button
            size="sm"
            disabled={manualPayMutation.isPending}
            className="h-8 bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700"
            onClick={handleManualPay}
          >
            {manualPayMutation.isPending ? <RefreshCw className="mr-1 h-3 w-3 animate-spin" /> : <CreditCard className="mr-1 h-3 w-3" />}
            {manualPayMutation.isPending ? 'Recording...' : 'Record Payment (Audit Only)'}
          </Button>
        </div>
      )}


      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-9">
          {[
            { l: 'Total', v: stats.total, c: 'text-slate-600' },
            { l: 'Active', v: stats.active, c: 'text-emerald-600' },
            { l: 'Expired', v: stats.expired, c: 'text-amber-600' },
            { l: 'Inactive', v: stats.inactive, c: 'text-gray-500' },
            { l: 'Deleted', v: stats.deleted, c: 'text-red-500' },
            { l: 'Free', v: stats.free, c: 'text-slate-500' },
            { l: 'Lite', v: stats.lite, c: 'text-blue-500' },
            { l: 'Pro', v: stats.pro, c: 'text-amber-500' },
            { l: 'Upgrades', v: stats.migrations, c: 'text-purple-500' },
          ].map(({ l, v, c }) => (
            <div key={l} className="rounded-lg border bg-white p-2 text-center">
              <div className={`text-lg font-bold ${c}`}>{v}</div>
              <div className="text-[10px] text-slate-500">{l}</div>
            </div>
          ))}
        </div>
      )}

      {/* 🛠️ Debug Tools */}
      <div className="flex justify-end">
        <button
          onClick={handleTestEmail}
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:text-indigo-600"
        >
          <Mail className="h-3.5 w-3.5" />
          Test Mail Settings (Debug Resend)
        </button>
      </div>

      {/* Actions Explanation Box */}
      <div className="flex justify-end mb-2">
        <button
          onClick={() => setShowActionHelp(!showActionHelp)}
          className="flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-600 transition-colors hover:bg-indigo-100"
        >
          <Info className="h-3.5 w-3.5" />
          Kaunsa button kya karta hai? (Guide)
          {showActionHelp ? <ChevronUp className="h-3.5 w-3.5 ml-1" /> : <ChevronDown className="h-3.5 w-3.5 ml-1" />}
        </button>
      </div>

      {showActionHelp && (
        <div className="mb-4 rounded-lg border border-indigo-100 bg-indigo-50/50 p-4 text-sm text-indigo-800 space-y-4 shadow-sm">
            <div className="bg-white p-3 rounded-md border border-indigo-100">
              <strong className="flex items-center gap-1.5 text-indigo-900 mb-1"><CreditCard className="w-4 h-4"/> 1. Record Payment (Upar wala Green Button)</strong>
              <p>Sirf apne hisab kitab (Accounting) ke liye. Agar student ne PhonePe/GPay kiya hai, toh uski transaction ID yahan save karein. <b>Is se student ko app mein koi course access nahi milta.</b> Ye sirf hisab-kitab safe rakhne ke liye hai.</p>
            </div>

            <div className="bg-white p-3 rounded-md border border-indigo-100">
              <strong className="flex items-center gap-1.5 text-purple-900 mb-1"><Key className="w-4 h-4 text-purple-600"/> 2. Inline Grant Access (Edit click karne ke baad)</strong>
              <p>Jab aap kisiko course access dena chahein. &quot;Combo&quot; select karke 12 mahine likhein aur Grant karein. <b>Is se student ka account update ho jayega aur usko course mil jayega.</b> Par haan, payment record yahan se save nahi hogi.</p>
            </div>

            <div className="bg-white p-3 rounded-md border border-indigo-100">
              <strong className="flex items-center gap-1.5 text-blue-900 mb-1"><Pencil className="w-4 h-4 text-blue-600"/> 3. Edit (Basic Details & Password)</strong>
              <p>Agar kisi user ka Password change karna hai, toh &quot;Edit&quot; pe click karein. Naya password type karke save karein. Save karte hi ek message ready ho jayega jise aap direct copy karke student ko WhatsApp kar sakte hain.</p>
            </div>

            <div className="bg-indigo-100/50 p-3 rounded-md border border-indigo-200 mt-2 text-xs">
              <strong className="text-indigo-900">💡 Best Process:</strong> Agar student payment bhejta hai toh: Pehle <b>Record Payment</b> mein details dalein ➔ Phir user ko search karke usme <b>Grant Access</b> karein ➔ Phir <b>Edit</b> karke naya password set karke message copy karein aur WhatsApp par bhej dein.
            </div>
        </div>
      )}

      {/* Search + Tabs */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, phone..."
            className="h-9 w-full rounded-lg border pr-4 pl-9 text-sm outline-none focus:border-indigo-500"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {(['all', 'active', 'expired', 'inactive', 'deleted', 'logs'] as TabFilter[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold capitalize transition-all ${
                tab === t
                  ? 'bg-slate-900 text-white'
                  : 'border bg-white text-slate-500 hover:bg-slate-50'
              }`}
            >
              {t === 'logs' ? 'Activity Log' : t}
            </button>
          ))}
          <button
            onClick={() => (queryClient.invalidateQueries({ queryKey: [tab === 'logs' ? 'admin-logs' : 'admin-users'] }))}
            disabled={loading}
            className="rounded-md border bg-white px-2 py-1.5 text-slate-500 hover:bg-slate-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Results */}
      {tab === 'logs' ? (
        <div className="space-y-3">
          {logs.length === 0 ? (
            <div className="py-12 text-center text-slate-400">No activity logs found</div>
          ) : (
            logs.map((log) => {
              // Handle both string and object details
              let details: Record<string, any> = {};
              try {
                if (typeof log.details === 'string') {
                  details = JSON.parse(log.details);
                } else if (log.details && typeof log.details === 'object') {
                  details = log.details as Record<string, any>;
                }
              } catch {
                details = {};
              }
              const timeAgo = formatDistanceToNow(new Date(log.createdAt), { addSuffix: true });
              const logDate = new Date(log.createdAt);
              const exactTime = logDate.toLocaleString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              // Use log.userId as primary, fallback to details.userId
              const displayUserId = 'userId' in log ? (log as any).userId : details.userId;

              return (
                <div
                  key={log.id}
                  className="rounded-lg border bg-white p-4 text-sm shadow-sm transition-all hover:shadow-md"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase ${
                          log.action === 'DELETE'
                            ? 'bg-red-100 text-red-700'
                            : log.action === 'PLAN_CHANGE'
                              ? 'bg-amber-100 text-amber-700'
                              : log.action === 'GRANT'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {log.action}
                      </span>
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900">{log.userEmail}</span>
                        {log.userName && (
                          <span className="text-xs text-slate-500">{log.userName}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-medium text-slate-900" title={exactTime}>
                        {timeAgo}
                      </div>
                      <div className="text-[10px] text-slate-400">{exactTime}</div>
                    </div>
                  </div>

                  {/* ID Section & Deleted Date Override */}
                  <div className="mb-3 space-y-2">
                    <div className="flex w-fit items-center gap-2 rounded border border-slate-100 bg-slate-50 p-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        User ID:
                      </span>
                      <code className="font-mono text-xs text-slate-600 select-all">
                        {displayUserId || 'N/A'}
                      </code>
                      {displayUserId && (
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(displayUserId);
                            toast.success('ID copied');
                          }}
                          className="text-slate-400 transition-colors hover:text-indigo-600"
                          title="Copy ID"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                    {log.action === 'DELETE' && (
                      <div className="w-fit rounded border border-red-100 bg-red-50 p-2 text-xs font-medium text-red-600">
                        Deleted on: {exactTime}
                      </div>
                    )}
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 gap-x-4 gap-y-2 rounded-md bg-slate-50/50 p-3 text-xs text-slate-600 sm:grid-cols-2">
                    {Object.entries(details).map(([key, value]) => {
                      if (key === 'userId') return null; // Already shown
                      if (key === 'oldValues' || key === 'newValues' || key === 'changes') {
                        return (
                          <div key={key} className="col-span-full mt-1">
                            <span className="mb-1 block font-semibold text-slate-700 capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}:
                            </span>
                            <pre className="overflow-x-auto rounded border bg-white p-2 text-[10px]">
                              {JSON.stringify(value, null, 2)}
                            </pre>
                          </div>
                        );
                      }
                      return (
                        <div key={key} className="flex gap-2">
                          <span className="min-w-[80px] font-medium text-slate-500 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}:
                          </span>
                          <span className="truncate" title={String(value)}>
                            {String(value)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <>
          <p className="text-xs text-slate-400">{filteredUsers.length} users</p>
          <div className="space-y-2">
            {loading ? (
              <div className="py-12 text-center text-slate-400">Loading...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-12 text-center text-slate-400">No users found</div>
            ) : (
              filteredUsers.map((user) => {
                const status = getStatus(user);
                const isExpanded = expandedUser === user.id;

                return (
                  <div
                    key={user.id}
                    className={`rounded-lg border bg-white ${user.deletedAt ? 'opacity-50' : ''}`}
                  >
                    {/* Main row */}
                    <div className="p-3 sm:p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          {/* Name + badges */}
                          <div className="mb-1 flex flex-wrap items-center gap-1.5">
                            <span className="truncate text-sm font-semibold">
                              {user.name || '—'}
                            </span>
                            <span
                              className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase ${planBadge(user.planTier)}`}
                            >
                              {user.planTier === 'lite' ? 'pre' : user.planTier || 'free'}
                            </span>
                            <span
                              className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${status.cls}`}
                            >
                              {status.label}
                            </span>
                            {/* 🔑 Password Status */}
                            {user.deletedAt ? null : (
                              <span
                                className={`rounded-full border px-1.5 py-0.5 text-[10px] font-bold ${
                                  user.isActive
                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                    : user.planTier !== 'free'
                                      ? 'animate-pulse border-amber-200 bg-amber-50 text-amber-700'
                                      : 'border-slate-200 bg-slate-50 text-slate-500'
                                }`}
                              >
                                🔑{' '}
                                {user.isActive
                                  ? 'Password Set'
                                  : user.planTier !== 'free'
                                    ? 'Password PENDING'
                                    : 'No Password'}
                              </span>
                            )}
                            {user.role === 'admin' && (
                              <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700">
                                ADMIN
                              </span>
                            )}
                          </div>
                          {/* Info */}
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-slate-400">
                            <span>{user.email}</span>
                            {user.phone && <span>📱{user.phone}</span>}
                            <span className="flex items-center gap-0.5">
                              <Clock className="h-3 w-3" />
                              {formatExpiry(user.accessExpiresAt)}
                            </span>
                          </div>

                          {/* 🕒 Creation Proof & Metadata */}
                          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1.5 text-[10px] sm:text-[11px]">
                            <span className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-100/50 px-2 py-0.5 font-semibold text-slate-600">
                              <Clock className="h-3 w-3 text-indigo-500" />
                              {user.createdAt ? (
                                <span title={new Date(user.createdAt).toISOString()}>
                                  Created:{' '}
                                  {new Date(user.createdAt).toLocaleString('en-IN', {
                                    weekday: 'short',
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: true,
                                  })}
                                </span>
                              ) : (
                                'Created: N/A'
                              )}
                            </span>

                            <span className="flex items-center gap-1 text-slate-400">
                              <Shield className="h-3 w-3 text-slate-300" />
                              <code className="rounded border border-slate-100 bg-slate-50 px-1.5 py-0.5 font-mono text-[9px] select-all">
                                ID: {user.id}
                              </code>
                            </span>

                            {/* 🎯 Exam & Source Badges */}
                            <span className="flex items-center gap-1 rounded-full bg-slate-900 px-2 py-0.5 text-[9px] font-bold tracking-wider text-white uppercase">
                              Exam: {user.examType || 'mppsc'}
                            </span>

                            {user.metadata?.source && (
                              <span className="flex items-center gap-1 rounded-full border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-[9px] font-bold text-indigo-600 uppercase">
                                Source: {user.metadata.source}
                              </span>
                            )}

                            {user.metadata?.ip && (
                              <span className="flex items-center gap-1 border-l border-slate-200 pl-3 text-slate-400">
                                <span className="text-[9px] font-medium text-slate-300 uppercase">
                                  IP:
                                </span>
                                {user.metadata.ip}
                              </span>
                            )}
                          </div>
                        </div>
                        {/* Actions */}
                        {!user.deletedAt && (
                          <div className="flex shrink-0 items-center gap-1">
                            {/* Quick plan buttons */}
                            {user.planTier !== 'pro' && (
                              <button
                                onClick={() => handleQuickPlan(user.id, 'pro')}
                                className="flex h-7 items-center gap-0.5 rounded-md border border-amber-200 bg-amber-50 px-2 text-[10px] font-bold text-amber-600 hover:bg-amber-100"
                                title="Make Pro"
                              >
                                <Crown className="h-3 w-3" /> Pro
                              </button>
                            )}
                            {user.planTier !== 'lite' && user.planTier !== 'pro' && (
                              <button
                                onClick={() => handleQuickPlan(user.id, 'lite')}
                                className="flex h-7 items-center gap-0.5 rounded-md border border-blue-200 bg-blue-50 px-2 text-[10px] font-bold text-blue-600 hover:bg-blue-100"
                                title="Make Lite"
                              >
                                <Zap className="h-3 w-3" /> Lite
                              </button>
                            )}
                            {/* Toggle active */}
                            <button
                              onClick={() => handleToggle(user)}
                              className={`flex h-7 items-center gap-0.5 rounded-md border px-2 text-[10px] font-bold ${
                                user.isActive === false
                                  ? 'border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                  : 'border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100'
                              }`}
                            >
                              <Shield className="h-3 w-3" />
                              {user.isActive === false ? 'On' : 'Off'}
                            </button>
                            {/* Edit expand */}
                            <button
                              onClick={() => toggleExpand(user)}
                              className={`flex h-7 items-center gap-0.5 rounded-md border px-2 text-[10px] font-bold ${
                                isExpanded
                                  ? 'border-indigo-300 bg-indigo-100 text-indigo-700'
                                  : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                              }`}
                            >
                              <Pencil className="h-3 w-3" />
                              {isExpanded ? (
                                <ChevronUp className="h-3 w-3" />
                              ) : (
                                <ChevronDown className="h-3 w-3" />
                              )}
                            </button>
                            {/* Manual Password Link */}
                            {!user.isActive && !user.deletedAt && (
                              <button
                                onClick={() => handleManualLink(user.id)}
                                className="flex h-7 items-center gap-0.5 rounded-md border border-purple-200 bg-purple-50 px-2 text-[10px] font-bold text-purple-600 hover:bg-purple-100"
                                title="Copy Set Password Link"
                              >
                                <Key className="h-3 w-3" /> Link
                              </button>
                            )}
                            {/* Force Logout */}
                            <button
                              onClick={() => handleForceLogout(user.id)}
                              className="flex h-7 items-center gap-0.5 rounded-md border border-orange-200 bg-orange-50 px-2 text-[10px] font-bold text-orange-600 hover:bg-orange-100"
                              title="Force Logout All Devices"
                            >
                              <AlertTriangle className="h-3 w-3" /> Logout
                            </button>
                            {/* Delete Button */}
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="flex h-7 items-center gap-0.5 rounded-md border border-red-200 bg-red-50 px-2 text-[10px] font-bold text-red-600 hover:bg-red-100"
                              title="Delete User"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Expanded edit form */}
                    {isExpanded && !user.deletedAt && (
                      <div className="space-y-3 border-t bg-slate-50 p-3 sm:p-4">
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
                          <div>
                            <label className="mb-0.5 block text-[10px] font-bold text-slate-400 uppercase">
                              Name
                            </label>
                            <input
                              type="text"
                              value={editForm.name}
                              onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                              className="h-8 w-full rounded border px-2 text-xs outline-none focus:border-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="mb-0.5 block text-[10px] font-bold text-slate-400 uppercase">
                              Email
                            </label>
                            <input
                              type="email"
                              value={editForm.email}
                              onChange={(e) =>
                                setEditForm((f) => ({ ...f, email: e.target.value }))
                              }
                              className="h-8 w-full rounded border px-2 text-xs outline-none focus:border-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="mb-0.5 block text-[10px] font-bold text-slate-400 uppercase">
                              New Password
                            </label>
                            <input
                              type="text"
                              value={editForm.password}
                              onChange={(e) =>
                                setEditForm((f) => ({ ...f, password: e.target.value }))
                              }
                              className="h-8 w-full rounded border px-2 text-xs outline-none focus:border-indigo-500"
                              placeholder="Leave empty to keep"
                            />
                          </div>
                          <div>
                            <label className="mb-0.5 block text-[10px] font-bold text-slate-400 uppercase">
                              Plan
                            </label>
                            <select
                              value={editForm.planTier}
                              onChange={(e) =>
                                setEditForm((f) => ({ ...f, planTier: e.target.value }))
                              }
                              className="h-8 w-full rounded border bg-white px-2 text-xs outline-none focus:border-indigo-500"
                            >
                              <option value="free">Free</option>
                              <option value="lite">Pre</option>
                              <option value="mains">Mains</option>
                              <option value="combo">Combo</option>
                            </select>
                          </div>
                          <div>
                            <label className="mb-0.5 block text-[10px] font-bold text-slate-400 uppercase">
                              Set Expiry (Months from now)
                            </label>
                            <input
                              type="number"
                              min={1}
                              max={24}
                              value={editForm.accessMonths}
                              onChange={(e) =>
                                setEditForm((f) => ({ ...f, accessMonths: e.target.value }))
                              }
                              className="h-8 w-full rounded border px-2 text-xs outline-none focus:border-indigo-500"
                              placeholder="e.g. 3"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            disabled={saving}
                            className="h-7 bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-700"
                            onClick={() => handleSave(user)}
                          >
                            <Check className="mr-1 h-3 w-3" />{' '}
                            {saving ? 'Saving...' : 'Save Changes'}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs"
                            onClick={() => setExpandedUser(null)}
                          >
                            <X className="mr-1 h-3 w-3" /> Cancel
                          </Button>
                        </div>

                        {/* ── 📚 DEEP LEARNING GUIDE: Edit Password & Tables ── */}
                        <div className="mt-4 flex justify-end">
                          <button
                            onClick={() => setShowTechGuide(!showTechGuide)}
                            className="flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-100 px-3 py-1 text-[10px] font-bold text-indigo-600 transition-colors hover:bg-indigo-100"
                          >
                            <Info className="h-3.5 w-3.5" />
                            Technical Guide: DB Me Kya Hota Hai?
                            {showTechGuide ? <ChevronUp className="h-3.5 w-3.5 ml-1" /> : <ChevronDown className="h-3.5 w-3.5 ml-1" />}
                          </button>
                        </div>
                        
                        {showTechGuide && (
                          <div className="mt-2 rounded-lg border border-slate-200 bg-white p-4 shadow-sm text-[11px] leading-relaxed text-slate-600">
                            <p className="mb-3">Jab aap upar ka form bharkar <strong>&quot;Save Changes&quot;</strong> par click karte hain, toh database mein ye actions perform hote hain:</p>

                          <div className="space-y-3">
                            <div className="bg-slate-50 p-2 rounded border border-slate-100">
                              <strong className="text-slate-800">1. New Password:</strong> 
                              <ul className="list-disc ml-4 mt-1 space-y-1">
                                <li><strong>Target Table:</strong> <code className="bg-slate-200 px-1 rounded text-pink-600">mppsc_users</code></li>
                                <li><strong>Action:</strong> Aap jo naya password daalte hain, system usko <i>bcrypt</i> ya <i>scrypt</i> se encrypt karta hai (Hash banata hai). Normal text format mein kabhi save nahi hota.</li>
                                <li><strong>Impact:</strong> Jaise hi save hota hai, user turant is naye password se website par login kar payega. Puraana password invalid ho jayega. <strong>Password_hash</strong> field update hoti hai.</li>
                              </ul>
                            </div>

                            <div className="bg-slate-50 p-2 rounded border border-slate-100">
                              <strong className="text-slate-800">2. Plan & Expiry (Access):</strong> 
                              <ul className="list-disc ml-4 mt-1 space-y-1">
                                <li><strong>Target Table:</strong> <code className="bg-slate-200 px-1 rounded text-pink-600">mppsc_users</code></li>
                                <li><strong>Action:</strong> Ye system ka sabse critical hissa hai. <strong>plan_tier</strong> column (&apos;free&apos;, &apos;lite&apos;, &apos;mains&apos;, &apos;combo&apos;) update hota hai aur <strong>access_expires_at</strong> column mein aaj ki date + months (jaise 3 months) ka future timestamp save ho jata hai.</li>
                                <li><strong>Impact:</strong> Isi <i>plan_tier</i> ke basis par user ko Pre, Mains ya Combo ke videos/PDFs dikhte hain. Agar expiry date paas ho gayi, toh user automatically &apos;free&apos; tier mein switch ho jayega next login par.</li>
                              </ul>
                            </div>

                            <div className="bg-slate-50 p-2 rounded border border-slate-100">
                              <strong className="text-slate-800">3. Activity Logs (Audit Trail):</strong> 
                              <ul className="list-disc ml-4 mt-1 space-y-1">
                                <li><strong>Target Table:</strong> <code className="bg-slate-200 px-1 rounded text-pink-600">mppsc_activity_logs</code></li>
                                <li><strong>Action:</strong> Ek permanent record ban jata hai ki &quot;Admin (Aapne) is User ka password ya plan change kiya hai is exact time par&quot;.</li>
                                <li><strong>Impact:</strong> Agar kal ko koi dispute hota hai ki &quot;mera plan kisne change kiya?&quot;, toh Activity Log mein admin ki email aur time dono safe rahenge. Isse system secure and accountable banta hai.</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                        )}

                        {/* ── 📋 Message Generator ── */}
                        {editForm.password && (() => {
                          const plan = editForm.planTier || user.planTier || 'free';
                          const planLabel =
                            plan === 'combo' ? 'Pre + Mains (Combo)'
                            : plan === 'mains' ? 'Mains'
                            : plan === 'lite' ? 'Pre (Prelims)'
                            : 'Free';
                          const accessLine =
                            plan === 'combo' ? 'full access to Pre + Mains content and all exclusive features'
                            : plan === 'mains' ? 'full access to Mains content and all exclusive features'
                            : plan === 'lite' ? 'full access to Prelims (Pre) content and all exclusive features'
                            : 'access to the platform';
                          const msg =
`Congratulations ${user.name || 'Student'}! 🎉
Your UPSC Zen ${planLabel} subscription is now active!

You now have ${accessLine}.

Your Login Details:
📧 Email: ${user.email}
🔑 Password: ${editForm.password}

Website: https://upsc.zenscroll.app/login

Wish you all the best for your preparation! 👍`;

                          return (
                            <div className="mt-3 rounded-lg border border-sky-200 bg-sky-50/60 p-3">
                              <div className="mb-2 flex items-center justify-between">
                                <span className="text-[11px] font-bold text-sky-800 uppercase tracking-wide">
                                  📋 Copy Message — {planLabel}
                                </span>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(msg);
                                    toast.success('Message copied! Paste in WhatsApp/SMS.');
                                  }}
                                  className="flex items-center gap-1 rounded-md border border-sky-300 bg-white px-2 py-1 text-[10px] font-bold text-sky-700 hover:bg-sky-100"
                                >
                                  <Copy className="h-3 w-3" /> Copy
                                </button>
                              </div>
                              <pre className="whitespace-pre-wrap rounded border border-sky-100 bg-white p-2 text-[10px] leading-relaxed text-slate-700 select-all">
                                {msg}
                              </pre>
                              <p className="mt-1 text-[9px] text-sky-500">Password field mein jo likha hai woh yahan show ho raha hai. Save karne ke baad yeh hide ho jaayega.</p>
                            </div>
                          );
                        })()}

                        {/* ── Inline Grant Access ── */}

                        <div className="mt-3 rounded-lg border border-purple-200 bg-purple-50/60 p-3">
                          <div className="mb-2 flex items-center gap-1.5">
                            <Gift className="h-3.5 w-3.5 text-purple-600" />
                            <span className="text-[11px] font-bold text-purple-800 uppercase tracking-wide">Grant Access (No Payment)</span>
                          </div>
                          <div className="flex flex-wrap items-end gap-2">
                            <div>
                              <label className="mb-0.5 block text-[10px] font-bold text-purple-500 uppercase">Plan</label>
                              <select
                                value={inlineGrant[user.id]?.planTier ?? 'combo'}
                                onChange={(e) =>
                                  setInlineGrant((prev) => ({
                                    ...prev,
                                    [user.id]: { ...prev[user.id], planTier: e.target.value, accessMonths: prev[user.id]?.accessMonths ?? '', saving: false },
                                  }))
                                }
                                className="h-8 rounded border border-purple-200 bg-white px-2 text-xs outline-none focus:border-purple-500"
                              >
                                <option value="lite">Pre (Prelims)</option>
                                <option value="mains">Mains</option>
                                <option value="combo">Combo (Pre + Mains)</option>
                              </select>
                            </div>
                            <div>
                              <label className="mb-0.5 block text-[10px] font-bold text-purple-500 uppercase">Duration (months)</label>
                              <input
                                type="number"
                                min={1}
                                max={24}
                                value={inlineGrant[user.id]?.accessMonths ?? ''}
                                placeholder="e.g. 6"
                                onChange={(e) =>
                                  setInlineGrant((prev) => ({
                                    ...prev,
                                    [user.id]: { ...prev[user.id], planTier: prev[user.id]?.planTier ?? 'combo', accessMonths: e.target.value, saving: false },
                                  }))
                                }
                                className="h-8 w-24 rounded border border-purple-200 bg-white px-2 text-xs outline-none focus:border-purple-500"
                              />
                            </div>
                            <Button
                              size="sm"
                              disabled={inlineGrant[user.id]?.saving}
                              className="h-8 bg-purple-600 text-xs font-bold text-white hover:bg-purple-700"
                              onClick={async () => {
                                const g = inlineGrant[user.id];
                                const planTier = g?.planTier ?? 'combo';
                                const accessMonths = g?.accessMonths ? Number(g.accessMonths) : 6;
                                setInlineGrant((prev) => ({ ...prev, [user.id]: { ...prev[user.id], planTier, accessMonths: String(accessMonths), saving: true } }));
                                try {
                                  const res = await fetch('/api/admin/update-user', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ userId: user.id, planTier, accessMonths, isActive: true, isSubscribed: true }),
                                  });
                                  const data = await res.json();
                                  if (res.ok) {
                                    toast.success(`Granted ${planTier} for ${accessMonths}m to ${user.name || user.email}`);
                                    queryClient.invalidateQueries({ queryKey: ['admin-users'] });
                                  } else {
                                    toast.error(data.error || 'Grant failed');
                                  }
                                } catch {
                                  toast.error('Network error');
                                } finally {
                                  setInlineGrant((prev) => ({ ...prev, [user.id]: { ...prev[user.id], saving: false } }));
                                }
                              }}
                            >
                              <Gift className="mr-1 h-3 w-3" />
                              {inlineGrant[user.id]?.saving ? 'Granting...' : 'Grant'}
                            </Button>
                          </div>
                          <p className="mt-1.5 text-[10px] text-purple-500">
                            Current: <strong>{user.planTier === 'lite' ? 'Pre' : user.planTier || 'Free'}</strong> · Expiry: {user.accessExpiresAt ? new Date(user.accessExpiresAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'None'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}

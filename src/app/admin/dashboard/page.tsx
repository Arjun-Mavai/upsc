'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getAdminDashboardStats } from '@/actions/admin-actions';
import { 
  Loader2, 
  Activity, 
  FileText, 
  CheckCircle2, 
  ListChecks, 
  ChevronDown, 
  ChevronUp,
  MessageSquare,
  HelpCircle,
  TrendingUp,
  CreditCard
} from 'lucide-react';
import { AdminDashboardResponse } from '@/types/admin';
import dynamic from 'next/dynamic';

// Lazy Load Admin Components
const TopicCoverageMatrix = dynamic(
  () =>
    import('@/features/admin/components/TopicCoverageMatrix').then(
      (mod) => mod.TopicCoverageMatrix
    ),
  {
    loading: () => (
      <div className="flex h-[600px] items-center justify-center rounded-xl border text-slate-400">
        <Loader2 className="mr-2 animate-spin" /> Loading Matrix...
      </div>
    ),
    ssr: false,
  }
);

const PaymentExitAnalytics = dynamic(
  () =>
    import('@/features/admin/components/PaymentExitAnalytics').then(
      (mod) => mod.PaymentExitAnalytics
    ),
  {
    loading: () => <div className="text-sm text-slate-500">Loading analytics...</div>,
    ssr: false,
  }
);

const FeedbackTable = dynamic(
  () => import('@/features/admin/components/FeedbackTable').then((mod) => mod.FeedbackTable),
  {
    loading: () => <div className="text-sm text-slate-500">Loading feedbacks...</div>,
    ssr: false,
  }
);

const AdminTicketsList = dynamic(
  () => import('@/features/admin/components/AdminTicketsList').then((mod) => mod.AdminTicketsList),
  {
    loading: () => <div className="text-sm text-slate-500">Loading tickets...</div>,
    ssr: false,
  }
);

const GeneralFeedbackTable = dynamic(
  () => import('@/features/admin/components/GeneralFeedbackTable').then((mod) => mod.GeneralFeedbackTable),
  {
    loading: () => <div className="text-sm text-slate-500">Loading app feedbacks...</div>,
    ssr: false,
  }
);

const LiveActivityFeed = dynamic(
  () => import('@/features/admin/components/LiveActivityFeed').then((mod) => mod.LiveActivityFeed),
  {
    loading: () => <div className="text-sm text-slate-500">Loading activity...</div>,
    ssr: false,
  }
);

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({
    uploads: true,
    guests: true,
    matrix: true,
    feedback: true,
    tickets: true,
  });

  const toggle = (key: string) => setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));

  useEffect(() => {
    getAdminDashboardStats().then((res) => {
      if (res.success) {
        setStats(res);
      }
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!stats || !stats.stats) return <div>Error loading dashboard.</div>;

  const { stats: metrics, recentUploads = [], recentGuests = [] } = stats;
  const { typeCount } = metrics;

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 font-sans md:p-8 lg:p-12">
      <div className="mx-auto max-w-7xl space-y-6 md:space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 md:text-3xl">
              UPSC ZEN Admin
            </h1>
            <p className="text-sm font-medium text-slate-500">
              Overview of content ingestion and student activity.
            </p>
          </div>
          <Badge variant="outline" className="hidden md:flex items-center gap-1.5 bg-white px-3 py-1 text-[10px] font-bold text-emerald-600 border-emerald-100 ring-4 ring-emerald-50/50 animate-pulse">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Live System Active
          </Badge>
        </div>

        {/* Stats Grid — 2 cols on mobile, scales up */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4">
          <StatCard icon={<Activity />} title="Total Tests" value={metrics.totalTests} color="blue" />
          <StatCard icon={<ListChecks />} title="Total Questions" value={metrics.totalQuestions} color="indigo" />
          <StatCard icon={<FileText />} title="Total Blogs" value={metrics.totalBlogs} color="violet" />
          <StatCard icon={<FileText />} title="Topic Tests" value={typeCount?.TOPIC || 0} color="emerald" />
          <StatCard icon={<CheckCircle2 />} title="Unit Tests" value={typeCount?.UNIT || 0} color="orange" />
          <StatCard icon={<CheckCircle2 />} title="FLTs" value={typeCount?.FLT || 0} color="rose" />
          <StatCard icon={<ListChecks />} title="CSAT" value={typeCount?.CSAT || 0} color="cyan" />
          <StatCard icon={<ListChecks />} title="PYQs" value={typeCount?.PYQ || 0} color="slate" />
        </div>

        <div className="grid grid-cols-1 gap-6 md:gap-8 lg:grid-cols-3">
          {/* Column 1: Live Feed & Compact Lists */}
          <div className="space-y-6 lg:col-span-1">
            <LiveActivityFeed />

            {/* Collapsible Recent Uploads */}
            <Card className="border-slate-200 shadow-sm overflow-hidden">
              <CardHeader className="cursor-pointer hover:bg-slate-50 transition-colors py-4" onClick={() => toggle('uploads')}>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-slate-400" />
                    Recent Uploads
                  </CardTitle>
                  {collapsed.uploads ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                </div>
              </CardHeader>
              {!collapsed.uploads && (
                <CardContent className="space-y-4 pt-0">
                  {recentUploads.length === 0 ? (
                    <p className="text-xs text-slate-400">No uploads yet.</p>
                  ) : (
                    recentUploads.map((t: any) => (
                      <div key={t.id} className="flex items-start justify-between border-b border-slate-50 pb-3 last:border-0">
                        <div className="space-y-1">
                          <p className="line-clamp-1 text-xs font-semibold text-slate-800">{t.title}</p>
                          <div className="flex gap-2">
                            <Badge variant="secondary" className="h-4 text-[9px]">{t.type}</Badge>
                            <span className="text-[9px] text-slate-400">{new Date(t.updatedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">{t.totalQuestions} Q</span>
                      </div>
                    ))
                  )}
                </CardContent>
              )}
            </Card>

            {/* Collapsible Guest Users */}
            <Card className="border-slate-200 shadow-sm overflow-hidden">
              <CardHeader className="cursor-pointer hover:bg-slate-50 transition-colors py-4" onClick={() => toggle('guests')}>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Activity className="h-4 w-4 text-slate-400" />
                    Guest Users ({recentGuests.length})
                  </CardTitle>
                  {collapsed.guests ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                </div>
              </CardHeader>
              {!collapsed.guests && (
                <CardContent className="max-h-[400px] space-y-4 overflow-y-auto pr-2 pt-0 scrollbar-hide">
                  {recentGuests.length === 0 ? (
                    <p className="text-xs text-slate-400">No guests yet.</p>
                  ) : (
                    recentGuests.map((g) => (
                      <div key={g.id} className="flex items-start justify-between border-b border-slate-50 pb-3 last:border-0">
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-slate-800">{g.name}</p>
                          <div className="flex gap-2 text-[9px] text-slate-400">
                            <span className="max-w-[100px] truncate">{g.email || 'No Email'}</span>
                            <span>•</span>
                            <span>{g.mobile || 'No Mobile'}</span>
                          </div>
                        </div>
                        <span className="text-[9px] font-bold text-slate-500">{new Date(g.createdAt!).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                      </div>
                    ))
                  )}
                </CardContent>
              )}
            </Card>
          </div>

          {/* Topic Coverage Matrix - Takes remaining 2 columns */}
          <div className="lg:col-span-2">
            <Card className="border-slate-200 shadow-sm overflow-hidden h-fit">
               <CardHeader className="cursor-pointer hover:bg-slate-50 transition-colors py-4 border-b border-slate-50" onClick={() => toggle('matrix')}>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    Topic Coverage Matrix
                  </CardTitle>
                  {collapsed.matrix ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                </div>
               </CardHeader>
               {!collapsed.matrix && (
                 <div className="bg-white">
                   <TopicCoverageMatrix />
                 </div>
               )}
            </Card>
          </div>
        </div>

        {/* Support Tickets & Feedback Section */}
        <div className="grid grid-cols-1 gap-6 md:gap-8 lg:grid-cols-2">
          {/* Feedbacks Column */}
          <div className="w-full">
            <Card className="border-slate-200 shadow-sm overflow-hidden">
               <CardHeader className="cursor-pointer hover:bg-slate-50 transition-colors py-4 border-b border-slate-100" onClick={() => toggle('feedback')}>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-indigo-500" />
                    Student Feedback & Analytics
                  </CardTitle>
                  {collapsed.feedback ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                </div>
               </CardHeader>
               {!collapsed.feedback && (
                 <CardContent className="p-0 bg-white">
                    <div className="p-2">
                      <GeneralFeedbackTable />
                    </div>
                    <div className="p-2 border-t border-slate-50">
                      <FeedbackTable />
                    </div>
                    <div className="p-2 border-t border-slate-50 bg-slate-50/30">
                      <PaymentExitAnalytics />
                    </div>
                 </CardContent>
               )}
            </Card>
          </div>

          {/* Tickets Column */}
          <div className="w-full">
            <Card className="border-slate-200 shadow-sm overflow-hidden">
               <CardHeader className="cursor-pointer hover:bg-slate-50 transition-colors py-4 border-b border-slate-100" onClick={() => toggle('tickets')}>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-rose-500" />
                    Support Tickets
                  </CardTitle>
                  {collapsed.tickets ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                </div>
               </CardHeader>
               {!collapsed.tickets && (
                 <CardContent className="p-4 bg-white">
                    <AdminTicketsList />
                 </CardContent>
               )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, title, value, color }: any) {
  const colors: any = {
    blue: 'bg-blue-50 text-blue-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    rose: 'bg-rose-50 text-rose-600',
    orange: 'bg-orange-50 text-orange-600',
    cyan: 'bg-cyan-50 text-cyan-600',
    slate: 'bg-slate-50 text-slate-600',
    violet: 'bg-violet-50 text-violet-600',
    teal: 'bg-teal-50 text-teal-600',
  };
  return (
    <Card className="border-slate-100 shadow-sm">
      <CardContent className="flex items-center gap-3 p-3 md:p-5">
        <div className={`shrink-0 rounded-full p-2 md:p-3 ${colors[color] || colors.blue}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="truncate text-[10px] font-bold tracking-wider text-slate-500 uppercase md:text-xs">
            {title}
          </p>
          <p className="text-xl font-black text-slate-900 md:text-2xl">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

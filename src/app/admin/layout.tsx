'use client';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🏢 ADMIN LAYOUT — Sidebar + Content Area
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// Mobile-first: hamburger menu → slide-out sidebar
// Desktop: fixed sidebar left + content right
// Sidebar links: sab admin routes ek jagah
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Shield,
  BookOpen,
  FileText,
  Upload,
  Brain,
  HelpCircle,
  Menu,
  X,
  ChevronLeft,
  UserPlus,
  KeyRound,
  Users,
  IndianRupee,
  CreditCard,
  BarChart3,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// ── Admin routes — sidebar me ye dikhenge ───────────────────
const ADMIN_ROUTES = [
  {
    href: '/admin/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    description: 'Overview & stats',
  },
  {
    href: '/admin/user-dashboard',
    label: 'User Dashboard',
    icon: BarChart3,
    description: 'User activity & test history',
  },
  {
    href: '/admin/test-access',
    label: 'Test Access',
    icon: Shield,
    description: 'FLT/PYQ/CSAT access flags',
  },
  {
    href: '/admin/topic-access',
    label: 'Topic Access',
    icon: BookOpen,
    description: 'Syllabus topic access flags',
  },
  {
    href: '/admin/blog-access',
    label: 'Blog Access',
    icon: FileText,
    description: 'Blog tier access flags',
  },
  {
    href: '/admin/blogs',
    label: 'Blog Management',
    icon: FileText,
    description: 'Create, edit, delete blogs',
  },
  {
    href: '/admin/content-manager',
    label: 'Content Upload',
    icon: Upload,
    description: 'Upload test content',
  },
  {
    href: '/admin/syllabus-upload',
    label: 'Prelims Syllabus',
    icon: BookOpen,
    description: 'Upload prelims syllabus data',
  },
  {
    href: '/admin/mains-syllabus-upload',
    label: 'Mains Syllabus',
    icon: BookOpen,
    description: 'Auto-decode & upload mains JSON',
  },
  {
    href: '/admin/mains',
    label: 'Mains Content & AI',
    icon: Brain,
    description: 'Enrich Mains topics with AI & PYQ',
  },
  {
    href: '/admin/mains-pyq',
    label: 'Mains PYQ Upload',
    icon: Upload,
    description: 'Upload & link Mains PYQ JSON',
  },
  {
    href: '/admin/pyq-insights',
    label: 'PYQ Insights',
    icon: Brain,
    description: 'Import/publish PYQ facts & trends',
  },
  {
    href: '/admin/bulk-question-upload',
    label: 'Bulk Questions',
    icon: HelpCircle,
    description: 'Bulk upload questions',
  },
  {
    href: '/admin/create-user',
    label: 'Create User',
    icon: UserPlus,
    description: 'Admin signup — new user banao',
  },
  {
    href: '/admin/users',
    label: 'User Manager',
    icon: Users,
    description: 'Users, extend access, upgrade tier',
  },
  {
    href: '/admin/payments',
    label: 'Payments',
    icon: CreditCard,
    description: 'Revenue analytics & orders',
  },
  {
    href: '/admin/pricing',
    label: 'Pricing',
    icon: IndianRupee,
    description: 'Update prices — no deploy needed',
  },
  {
    href: '/admin/reset-password',
    label: 'Reset Password',
    icon: KeyRound,
    description: 'Direct password reset',
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Mobile Header ────────────────────────────────── */}
      <div className="fixed top-0 right-0 left-0 z-50 flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
          <Menu className="h-5 w-5" />
        </Button>
        <Link href="/admin/dashboard" className="text-sm font-bold text-slate-900">
          Admin Panel
        </Link>
        <div className="ml-auto">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/" className="text-xs text-slate-500">
              <ChevronLeft className="mr-1 h-3 w-3" /> Back to Site
            </Link>
          </Button>
        </div>
      </div>

      {/* ── Mobile Sidebar Overlay ───────────────────────── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          {/* Sidebar panel */}
          <div className="animate-in slide-in-from-left absolute top-0 bottom-0 left-0 w-72 bg-white shadow-2xl duration-300">
            <SidebarContent pathname={pathname} onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* ── Desktop Layout: Sidebar + Content ────────────── */}
      <div className="flex">
        {/* Desktop Sidebar — fixed left */}
        <div className="hidden w-64 shrink-0 lg:block">
          <div className="fixed top-0 bottom-0 left-0 w-64 overflow-y-auto border-r border-slate-200 bg-white">
            <SidebarContent pathname={pathname} />
          </div>
        </div>

        {/* Content Area */}
        <main className="min-h-screen flex-1 pt-14 lg:pt-0">{children}</main>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📋 SIDEBAR CONTENT — Reusable for mobile + desktop
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function SidebarContent({ pathname, onClose }: { pathname: string; onClose?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      {/* ── Logo/Header ─────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-slate-100 p-5">
        <Link href="/admin/dashboard" className="flex items-center gap-2" onClick={onClose}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-700">
            <Shield className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Admin Panel</h2>
            <p className="text-[10px] text-slate-500">UPSC 2026</p>
          </div>
        </Link>
        {/* Close button (mobile only) */}
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="lg:hidden">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* ── Navigation Links ─────────────────────────────── */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {ADMIN_ROUTES.map((route) => {
          const isActive = pathname === route.href;
          const Icon = route.icon;
          return (
            <Link
              key={route.href}
              href={route.href}
              onClick={onClose}
              className={cn(
                'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all',
                isActive
                  ? 'border border-indigo-100 bg-indigo-50 font-semibold text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <Icon
                className={cn(
                  'h-4 w-4 shrink-0',
                  isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'
                )}
              />
              <div className="min-w-0">
                <div className="truncate">{route.label}</div>
                <div
                  className={cn(
                    'truncate text-[10px]',
                    isActive ? 'text-indigo-500' : 'text-slate-400'
                  )}
                >
                  {route.description}
                </div>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* ── Footer ──────────────────────────────────────── */}
      <div className="border-t border-slate-100 p-4">
        <Link
          href="/"
          onClick={onClose}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Site
        </Link>
      </div>
    </div>
  );
}

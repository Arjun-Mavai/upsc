'use client';

import { useEffect, useMemo, useTransition } from 'react';
import { motion } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useSettingsStore } from '@/store/useSettingsStore';

import { Album, BookOpen, Layers, Clock, BrainCircuit } from 'lucide-react';

const NAV_ITEMS = [
  {
    id: 'pyq',
    label: { en: 'PYQ', hi: 'PYQ' },
    icon: Clock,
    href: '/syllabus/quiz/pyq',
    color: 'bg-slate-900 border-slate-900',
    activeText: 'text-slate-900',
  },
  {
    id: 'full-length',
    label: { en: 'FLT', hi: 'FLT' },
    icon: Album,
    href: '/syllabus/quiz/full-length',
    color: 'bg-amber-500 border-amber-500',
    activeText: 'text-amber-600',
  },
  {
    id: 'csat',
    label: { en: 'CSAT', hi: 'CSAT' },
    icon: BrainCircuit,
    href: '/syllabus/quiz/csat',
    color: 'bg-pink-500 border-pink-500',
    activeText: 'text-pink-600',
  },
  {
    id: 'topic',
    label: { en: 'Topics', hi: 'टॉपिक' },
    icon: Layers,
    href: '/syllabus/quiz/topic',
    color: 'bg-indigo-600 border-indigo-600',
    activeText: 'text-indigo-600',
  },
  {
    id: 'units',
    label: { en: 'Units', hi: 'यूनिट' },
    icon: BookOpen,
    href: '/syllabus/quiz/units',
    color: 'bg-emerald-500 border-emerald-500',
    activeText: 'text-emerald-600',
  },
];

// Pages where bottom nav should be hidden (PYQ sub-pages)
const HIDDEN_BOTTOM_NAV_PATHS = [
  '/syllabus/quiz/pyq/intelligence',
  '/syllabus/quiz/pyq/facts',
  '/syllabus/quiz/pyq/analysis',
  '/syllabus/quiz/pyq/repeated',
  '/syllabus/quiz/pyq/question',
];

export function QuizSubNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { language } = useSettingsStore();
  const hi = language === 'hi';
  const [isPending] = useTransition();

  const activeHref = useMemo(
    () =>
      NAV_ITEMS.find((item) => pathname === item.href)?.href ||
      (pathname.startsWith('/syllabus/quiz/pyq') ? '/syllabus/quiz/pyq' : pathname),
    [pathname]
  );

  const springConfig: any = { type: 'spring', stiffness: 400, damping: 40 };

  // Check if bottom nav should be hidden
  const shouldHideBottomNav = HIDDEN_BOTTOM_NAV_PATHS.some(path => pathname.startsWith(path));

  // ⚡ LIGHT SPEED PREFETCH: All categories on mount
  useEffect(() => {
    NAV_ITEMS.forEach((item) => {
      if (item.href !== pathname) {
        router.prefetch(item.href);
      }
    });
  }, [router, pathname]);

  return null;
}

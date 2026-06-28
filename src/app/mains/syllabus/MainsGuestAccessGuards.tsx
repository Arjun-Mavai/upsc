'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useSettingsStore } from '@/store/useSettingsStore';
import dynamic from 'next/dynamic';

const MainsGuestEntryDialog = dynamic(
  () => import('./MainsGuestEntryDialog').then((mod) => mod.MainsGuestEntryDialog),
  { ssr: false }
);

const isProtectionEnabled = process.env.NEXT_PUBLIC_DISABLE_CONTENT_PROTECTION !== 'true';

/**
 * Enforces guest protections across /mains/syllabus subtree:
 * 1) Disables selection/copy for guests
 * 2) Captures guest lead before browsing content
 */
export function MainsGuestAccessGuards() {
  const pathname = usePathname();
  const { user } = useSettingsStore();
  const isLoggedIn = !!user;

  useEffect(() => {
    // 🛡️ CRITICAL: If protection is disabled (local dev) or user is logged in, DO NOTHING
    if (!isProtectionEnabled || isLoggedIn) return;

    const block = (e: Event) => {
      e.preventDefault();
    };
    const keyBlock = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toLowerCase().includes('mac');
      const mod = isMac ? e.metaKey : e.ctrlKey;
      if (!mod) return;
      const key = e.key.toLowerCase();
      // Block common copy/select shortcuts
      if (key === 'c' || key === 'x' || key === 'v' || key === 'a') {
        e.preventDefault();
      }
    };

    // Apply global body protections for guests
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';

    document.addEventListener('selectstart', block, true);
    document.addEventListener('copy', block, true);
    document.addEventListener('cut', block, true);
    document.addEventListener('contextmenu', block, true); // Blocks right-click
    document.addEventListener('keydown', keyBlock, true);

    return () => {
      document.body.style.removeProperty('user-select');
      document.body.style.removeProperty('-webkit-user-select');
      document.body.style.removeProperty('-moz-user-select');
      document.body.style.removeProperty('-ms-user-select');

      document.removeEventListener('selectstart', block, true);
      document.removeEventListener('copy', block, true);
      document.removeEventListener('cut', block, true);
      document.removeEventListener('paste', block, true);
      document.removeEventListener('contextmenu', block, true);
      document.removeEventListener('dragstart', block, true);
      document.removeEventListener('keydown', keyBlock, true);
    };
  }, [isLoggedIn]);

  if (isLoggedIn) return null;

  return <MainsGuestEntryDialog />;
}


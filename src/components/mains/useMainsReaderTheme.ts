'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

function readBrowserDark(): boolean {
  if (typeof document === 'undefined') return false;
  if (document.documentElement.classList.contains('dark')) return true;
  return window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ?? false;
}

/** Map site light/dark to PyqAnswerProse / coaching surfaces (ThemeProvider optional). */
export function useMainsReaderProseTheme(): 'deep' | 'paper' {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [browserDark, setBrowserDark] = useState(false);

  useEffect(() => {
    setMounted(true);
    setBrowserDark(readBrowserDark());
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setBrowserDark(readBrowserDark());
    mq.addEventListener?.('change', onChange);
    const obs = new MutationObserver(onChange);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => {
      mq.removeEventListener?.('change', onChange);
      obs.disconnect();
    };
  }, []);

  if (!mounted) return 'paper';
  if (resolvedTheme === 'dark') return 'deep';
  if (resolvedTheme === 'light') return 'paper';
  return browserDark ? 'deep' : 'paper';
}

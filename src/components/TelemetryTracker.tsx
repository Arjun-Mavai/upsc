'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { trackAction } from '@/lib/analytics/track';

export function TelemetryTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname) return;
    
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
    
    // Track page view
    const viewTimeoutId = setTimeout(() => {
      trackAction('Page View', { type: 'page_view', path: url });
    }, 1000);
    
    // Track dwell time
    const startTime = Date.now();
    return () => {
      clearTimeout(viewTimeoutId);
      const duration = Math.floor((Date.now() - startTime) / 1000);
      if (duration > 2) { // Only track if stayed longer than 2 seconds
        trackAction('Page Dwell', { type: 'page_dwell', path: url, duration });
      }
    };
  }, [pathname, searchParams]);

  // 🖨️ Track when user tries to Print or Export to PDF (Cmd+P / Ctrl+P / Print Button)
  useEffect(() => {
    const handleBeforePrint = () => {
      const url = window.location.pathname + window.location.search;
      trackAction('🖨️ Page Print / PDF Export', {
        type: 'action',
        path: url,
        actionDetails: `User triggered Print / PDF Export on: ${url}`,
      });
    };

    window.addEventListener('beforeprint', handleBeforePrint);
    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
    };
  }, []);

  return null;
}

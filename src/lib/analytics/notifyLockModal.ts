import { useSettingsStore } from '@/store/useSettingsStore';
import { safeGetSessionStorage, safeSetSessionStorage } from '@/lib/safe-session-storage';

/**
 * Fires a Telegram notification to the admin channel when a premium lock modal opens.
 * Uses a dedicated API route (NOT the telemetry system) so it is never silently dropped
 * by the `telemetry_enabled` DB toggle.
 *
 * Includes client-side deduplication (60s window) to prevent spam on rapid re-opens.
 */
export function notifyLockModalOpen(modalType: 'prelims' | 'mains') {
  if (typeof window === 'undefined') return;

  try {
    // 60-second deduplication per modal type
    const cacheKey = `mppsc_lock_notify_${modalType}`;
    const lastSent = safeGetSessionStorage(cacheKey);
    if (lastSent && Date.now() - parseInt(lastSent, 10) < 60 * 1000) {
      return; // Skip — already notified within the last 60 seconds
    }
    safeSetSessionStorage(cacheKey, Date.now().toString());

    const { user, guestLead } = useSettingsStore.getState();
    const guestName = localStorage.getItem('upsc_guest_name');

    const getDeviceType = (): string => {
      const width = window.innerWidth;
      if (width < 768) return 'Mobile';
      if (width < 1024) return 'Tablet';
      return 'Desktop';
    };

    const payload = {
      modalType,
      path: window.location.pathname + window.location.search,
      user: user
        ? {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            planTier: user.planTier,
          }
        : null,
      guestName: guestName || (guestLead?.name ?? null),
      device: getDeviceType(),
      userAgent: navigator.userAgent,
    };

    const body = JSON.stringify(payload);
    const url = '/api/notify/lock-modal';

    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }));
    } else {
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // Completely silent — never break the UI for analytics
  }
}

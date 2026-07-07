import { NextResponse, after } from 'next/server';
import { sendTelegramEventNotification, escapeHTML } from '@/lib/telegram';

/**
 * POST /api/notify/lock-modal
 *
 * Sends a Telegram notification to the admin channel whenever a premium
 * lock modal (Prelims or Mains) is opened by a user.
 *
 * This is intentionally independent of the telemetry toggle system so that
 * high-intent purchase signals are NEVER silently dropped.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { modalType, path, user, guestName, device, userAgent } = body as {
      modalType: 'prelims' | 'mains';
      path: string;
      user?: {
        id?: string;
        name?: string;
        email?: string;
        phone?: string | null;
        planTier?: string;
        role?: string;
      } | null;
      guestName?: string | null;
      device?: string;
      userAgent?: string;
    };

    if (!modalType || !path) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // --- Build user display string ---
    let userDisplay = '👤 <b>Guest (Anonymous)</b>';
    if (user && (user.email || user.phone || user.name)) {
      const tier = user.planTier ? ` (${user.planTier.toUpperCase()})` : '';
      const namePart = user.name ? `<b>${escapeHTML(user.name)}</b>` : 'Registered User';
      const emailPart = user.email ? ` | 📧 ${escapeHTML(user.email)}` : '';
      const phonePart = user.phone ? ` | 📞 <code>${escapeHTML(user.phone)}</code>` : '';
      userDisplay = `👤 ${namePart}${tier}${emailPart}${phonePart}`;
    } else if (guestName) {
      userDisplay = `👤 <b>${escapeHTML(guestName)}</b> (Guest)`;
    }

    // --- Device info ---
    const deviceStr = device ? `[${device}]` : '';
    let browserOs = 'Unknown';
    if (userAgent) {
      const ua = userAgent.toLowerCase();
      let browser = 'Unknown';
      let os = 'Unknown';
      if (ua.includes('firefox')) browser = 'Firefox';
      else if (ua.includes('edg/') || ua.includes('edge')) browser = 'Edge';
      else if (ua.includes('chrome')) browser = 'Chrome';
      else if (ua.includes('safari')) browser = 'Safari';
      if (ua.includes('iphone')) os = 'iPhone';
      else if (ua.includes('ipad')) os = 'iPad';
      else if (ua.includes('android')) os = 'Android';
      else if (ua.includes('macintosh') || ua.includes('mac os')) os = 'macOS';
      else if (ua.includes('windows')) os = 'Windows';
      else if (ua.includes('linux')) os = 'Linux';
      browserOs = `${browser} on ${os}`;
    }

    // --- Timestamp in IST ---
    const dateObj = new Date();
    const dayName = dateObj.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short' });
    const dateStr = dateObj.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const timeStr = dateObj.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
    const timestamp = `${dayName}, ${dateStr} | ${timeStr} IST`;

    // --- Build message ---
    const isPreLims = modalType === 'prelims';
    const emoji = isPreLims ? '🔓' : '🔒';
    const label = isPreLims ? 'PRELIMS PREMIUM MODAL' : 'MAINS PREMIUM MODAL';
    const tag = isPreLims ? '#PrelimsLock' : '#MainsLock';

    const message =
      `💰 <b>${emoji} ${label} OPENED</b>\n` +
      `🚀 <b>HIGH PURCHASE INTENT!</b> User tried to access locked content.\n\n` +
      `📍 <b>Page:</b> <code>${escapeHTML(path.substring(0, 255))}</code>\n\n` +
      `${userDisplay}\n` +
      `📱 <b>${escapeHTML(browserOs)}</b> ${deviceStr}\n` +
      `📅 <b>Date &amp; Time:</b> ${timestamp}\n\n` +
      `${tag} #PurchaseIntent #LockModal`;

    // Fire-and-forget — don't let Telegram latency affect the API response
    after(async () => {
      try {
        await sendTelegramEventNotification(message);
      } catch (e) {
        // Silent fail inside background task
      }
    });

    return NextResponse.json({ success: true });
  } catch {
    // Silent fail — locking should never break the UI
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

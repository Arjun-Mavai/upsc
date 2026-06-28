import { getTelemetryEnabled } from './system-settings';
import { escapeHTML } from './telegram';

export interface TelemetryEvent {
  type: 'page_view' | 'page_dwell' | 'action';
  path: string;
  previousPath?: string;
  duration?: number; // in seconds (current page)
  sessionDuration?: number; // in seconds (total tab session)
  user?: {
    id?: string;
    name?: string;
    email?: string;
    phone?: string | null;
    role?: string;
    planTier?: string;
  } | null;
  guestName?: string | null;
  guestLead?: {
    name: string;
    phone: string;
    email?: string;
  } | null;
  device?: string;
  userAgent?: string;
  referrer?: string;
  actionDetails?: string;
  ip?: string;
  location?: string;
}

/**
 * Normalizes user agents into readable formats
 */
function parseReadableUserAgent(ua: string): string {
  if (!ua) return 'Unknown Browser';
  const lowercaseUa = ua.toLowerCase();
  
  let browser = 'Unknown Browser';
  let os = 'Unknown OS';

  // Check Edge before Chrome because Edge includes "Chrome" in its UA
  if (lowercaseUa.includes('firefox')) browser = 'Firefox';
  else if (lowercaseUa.includes('edg/') || lowercaseUa.includes('edge')) browser = 'Edge';
  else if (lowercaseUa.includes('chrome')) browser = 'Chrome';
  else if (lowercaseUa.includes('safari')) browser = 'Safari';

  if (lowercaseUa.includes('iphone')) os = 'iPhone';
  else if (lowercaseUa.includes('ipad')) os = 'iPad';
  else if (lowercaseUa.includes('android')) os = 'Android';
  else if (lowercaseUa.includes('macintosh') || lowercaseUa.includes('mac os')) os = 'macOS';
  else if (lowercaseUa.includes('windows')) os = 'Windows';
  else if (lowercaseUa.includes('linux')) os = 'Linux';

  return `${browser} on ${os}`;
}

/**
 * Formats seconds into a highly readable duration string
 */
function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0s';
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

/**
 * Formats a single telemetry event into standard beautiful HTML for Telegram
 */
function formatTelemetryMessage(event: TelemetryEvent): string {
  // Identify payment funnel
  const isPaymentPath = 
    event.path.startsWith('/pricing') || 
    event.path.startsWith('/payment') || 
    event.path.startsWith('/upgrade') || 
    event.path.startsWith('/thank-you');

  // Identify Mains path
  const isMainsPath = event.path.startsWith('/mains');

  // Normalize User info with name and phone
  let userDisplay = '👤 <b>Guest (Anonymous)</b>';
  if (event.user && (event.user.email || event.user.phone || event.user.name)) {
    const tier = event.user.planTier ? ` (${event.user.planTier.toUpperCase()})` : '';
    const namePart = event.user.name ? `<b>${escapeHTML(event.user.name)}</b>` : 'Registered User';
    const emailPart = event.user.email ? ` | 📧 ${escapeHTML(event.user.email)}` : '';
    const phonePart = event.user.phone ? ` | 📞 <code>${escapeHTML(event.user.phone)}</code>` : '';
    userDisplay = `👤 ${namePart}${tier}${emailPart}${phonePart}`;
  } else if (event.guestLead) {
    const namePart = `<b>${escapeHTML(event.guestLead.name)}</b> (Guest Lead)`;
    const phonePart = ` | 📞 <code>${escapeHTML(event.guestLead.phone)}</code>`;
    const emailPart = event.guestLead.email ? ` | 📧 ${escapeHTML(event.guestLead.email)}` : '';
    userDisplay = `👤 ${namePart}${phonePart}${emailPart}`;
  } else if (event.guestName) {
    userDisplay = `👤 <b>${escapeHTML(event.guestName)}</b> (Guest)`;
  }

  // Device & browser details
  const deviceType = event.device ? `[${event.device}]` : '';
  const browserOs = event.userAgent ? parseReadableUserAgent(event.userAgent) : 'Unknown Browser';
  const connectionDisplay = `📱 ${escapeHTML(browserOs)} ${deviceType}`;
  const locationDisplay = event.location ? `🌍 <b>Location:</b> ${escapeHTML(event.location)}` : '';
  const ipDisplay = event.ip && event.ip !== 'Unknown IP' ? `🖥️ <code>${escapeHTML(event.ip)}</code>` : '';

  let networkInfo = '';
  if (locationDisplay && ipDisplay) {
    networkInfo = `${locationDisplay} | ${ipDisplay}\n`;
  } else if (locationDisplay) {
    networkInfo = `${locationDisplay}\n`;
  } else if (ipDisplay) {
    networkInfo = `${ipDisplay}\n`;
  }


  // Time in IST (Day, Date, and Time format)
  const dateObj = new Date();
  const dayName = dateObj.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short' }); // Wed, Thu, etc.
  const dateStr = dateObj.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric' }); // 27 May 2026
  const timeStr = dateObj.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }); // 08:41:24 AM
  const timestamp = `${dayName}, ${dateStr} | ${timeStr} IST`;

  let title = '📊 <b>UPSC ZEN TELEMETRY ALERT</b>';
  let body = '';
  let tags = '#telemetry #UPSC';

  if (isPaymentPath) {
    title = '💰 <b>UPSC PAYMENT FUNNEL EVENT</b>';
    tags = '#PaymentFunnel #conversion #UPSC';
  } else if (isMainsPath) {
    title = '📘 <b>UPSC MAINS TELEMETRY ALERT</b>';
    tags = '#MainsPlatform #UPSC';
  }

  if (event.type === 'page_view') {
    title = isPaymentPath ? `💰 <b>PAYMENT LANDING ALERT</b>` : title;
    
    // Highlight if payment landing (very high intent)
    const landingBadge = isPaymentPath ? '\n🚀 <b>HIGH PURCHASE INTENT!</b> Landed on checkout funnel.' : '';
    
    body = 
      `${title}\n` +
      `👀 <b>Page Visited:</b> <code>${escapeHTML(event.path)}</code>${landingBadge}\n\n` +
      `${userDisplay}\n` +
      `${connectionDisplay}\n` +
      networkInfo +
      (event.referrer ? `🔍 <b>Referrer:</b> <code>${escapeHTML(event.referrer)}</code>\n` : '') +
      `📅 <b>Date & Time:</b> ${timestamp}\n\n` +
      `${tags} #PageView`;
  } else if (event.type === 'page_dwell') {
    title = isPaymentPath ? `⏱️ <b>PAYMENT FUNNEL EXIT SURVEY</b>` : title;
    
    const stayTime = event.duration ? formatDuration(event.duration) : '0s';
    const totalSessionTime = event.sessionDuration ? formatDuration(event.sessionDuration) : null;
    
    body = 
      `${title}\n` +
      `⏱️ <b>Time on Page:</b> <b>${stayTime}</b> (<code>${escapeHTML(event.path)}</code>)\n` +
      (totalSessionTime ? `🕒 <b>Total Tab Session:</b> <b>${totalSessionTime}</b> (Open to Close/Switch)\n` : '') +
      (event.previousPath ? `➡️ <b>Navigated to:</b> <code>${escapeHTML(event.previousPath)}</code>\n\n` : '\n') +
      `${userDisplay}\n` +
      `${connectionDisplay}\n` +
      networkInfo +
      `📅 <b>Date & Time:</b> ${timestamp}\n\n` +
      `${tags} #DwellTime`;
  } else {
    // Action / Custom Clicks
    body = 
      `${title}\n` +
      `🎯 <b>User Interaction:</b> <code>${escapeHTML(event.actionDetails || 'Clicked element')}</code>\n` +
      `📍 <b>Active Page:</b> <code>${escapeHTML(event.path)}</code>\n\n` +
      `${userDisplay}\n` +
      `${connectionDisplay}\n` +
      networkInfo +
      `📅 <b>Date & Time:</b> ${timestamp}\n\n` +
      `${tags} #UserAction`;
  }

  return body;
}

/**
 * 🚀 Dispatches a structured user event to the Telegram events bot asynchronously.
 * Fully isolated, resilient, and checks active telemetry dynamic toggle state before shipping.
 */
export async function sendTelemetryEvent(event: TelemetryEvent) {
  // 4. Dispatch fetch asynchronously with strict AbortController timeout (3 seconds)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);

  try {
    // 1. Check Dynamic Toggle Switch State (SQLite settings table)
    const isEnabled = await getTelemetryEnabled();
    if (!isEnabled) {
      return; // Dynamic switch is OFF -> Silently ignore
    }

    // 2. Load Tokens and fallback config
    const BOT_TOKEN = process.env.TELEGRAM_EVENTS_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_EVENTS_CHAT_ID || process.env.TELEGRAM_CHAT_ID;

    if (!BOT_TOKEN || !CHAT_ID) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Telemetry] Missing event bot token or chat ID configuration; alert skipped.');
      }
      return;
    }

    // 3. Prevent flood of minor detailed logs if TELEGRAM_EVENTS_DETAILED is false
    const isDetailed = process.env.TELEGRAM_EVENTS_DETAILED !== 'false';
    const isPaymentPath = 
      event.path.startsWith('/pricing') || 
      event.path.startsWith('/payment') || 
      event.path.startsWith('/upgrade') || 
      event.path.startsWith('/thank-you');
    const isMainsPath = event.path.startsWith('/mains');

    // If not detailed tracking, skip normal PageViews and DwellTimes on non-payment and non-mains routes
    if (!isDetailed && !isPaymentPath && !isMainsPath && event.type !== 'action') {
      return;
    }

    const message = formatTelemetryMessage(event);

    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: 'HTML',
      }),
      signal: controller.signal,
    });

    if (!response.ok && process.env.NODE_ENV === 'development') {
      console.error('[Telemetry] Telegram API Error:', await response.text());
    }
  } catch (error: any) {
    // 🔒 Silent failure: Telemetry should never affect client runtime or slow down anything
    if (process.env.NODE_ENV === 'development') {
      if (error.name === 'AbortError') {
        console.error('[Telemetry] Telegram notification timed out (3s limit reached)');
      } else {
        console.error('[Telemetry] Failed to dispatch event:', error);
      }
    }
  } finally {
    clearTimeout(timeoutId);
  }
}



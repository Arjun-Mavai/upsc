import { logger } from './logger';

/**
 * Simple HTML escape for Telegram messages
 * Agar user name mein '<' ya '&' ho, Telegram API error de deta hai.
 */
export function escapeHTML(str: string | null | undefined): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export async function sendTelegramNotification(message: string) {
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  if (!BOT_TOKEN || !CHAT_ID) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '[Telegram] TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID missing; notification skipped'
      );
    }
    return;
  }

  // ⏱️ AbortController — 5s timeout, Telegram slow pe hang nahi karega
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: 'HTML', // <b>, <code>, <i> work
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Telegram API Error', new Error(errorText), { category: 'telegram' });
    }
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') {
      logger.error('Telegram notification timed out', error, { category: 'telegram' });
    } else {
      logger.error('Failed to send Telegram notification', error, { category: 'telegram' });
    }
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function sendHumanRequestTelegramNotification(message: string) {
  const BOT_TOKEN = process.env.TELEGRAM_HUMAN_REQUEST_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_HUMAN_REQUEST_CHAT_ID || process.env.TELEGRAM_CHAT_ID;

  if (!BOT_TOKEN || !CHAT_ID) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '[Telegram] TELEGRAM_HUMAN_REQUEST_BOT_TOKEN or TELEGRAM_HUMAN_REQUEST_CHAT_ID missing; human request notification skipped'
      );
    }
    return;
  }

  // ⏱️ AbortController to prevent hanging (5s timeout)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: 'Markdown', // Using Markdown here since webhook routes format human alerts in Markdown
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Telegram Human Request API Error', new Error(errorText), { category: 'telegram' });
    }
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') {
      logger.error('Telegram human request notification timed out', error, { category: 'telegram' });
    } else {
      logger.error('Failed to send Telegram human request notification', error, { category: 'telegram' });
    }
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function sendTelegramEventNotification(message: string) {
  const BOT_TOKEN = process.env.TELEGRAM_EVENTS_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_EVENTS_CHAT_ID || process.env.TELEGRAM_CHAT_ID;

  if (!BOT_TOKEN || !CHAT_ID) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '[Telegram Events] TELEGRAM_EVENTS_BOT_TOKEN or TELEGRAM_EVENTS_CHAT_ID missing; event notification skipped'
      );
    }
    return;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
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

    if (!response.ok) {
      console.error('Telegram Events API Error:', await response.text());
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error('Telegram events notification timed out');
    } else {
      console.error('Failed to send Telegram events notification:', error);
    }
  } finally {
    clearTimeout(timeoutId);
  }
}

interface LeadNotificationInput {
  type: 'New Lead' | 'Returning Lead' | 'Registration' | 'Admin Grant';
  name: string | null | undefined;
  email: string;
  phone?: string | null | undefined;
  plan?: string;
  exam?: string;
  source?: string;
  attemptCount?: number;
  status?: string;
}

/**
 * Premium Lead Formatter
 * Bhai, formatting ek hi jagah rakhenge to consistency bani rahegi.
 */
export async function sendLeadNotification(input: LeadNotificationInput) {
  const { type, name, email, phone, plan, exam, source, attemptCount, status } = input;

  const planEmoji: Record<string, string> = {
    lite: '⚡', pro: '👑', upgrade: '🚀', mains: '🏛️', combo: '💎',
  };

  const formattedTime = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const message =
    `👮 <b>UPSC ZEN</b>\n` +
    `📝 <b>${type} — ${status || 'Processed'}</b>\n\n` +
    `👤 Name: ${escapeHTML(name || 'Unknown User')}\n` +
    `📧 Email: ${escapeHTML(email)}\n` +
    (phone ? `📞 Phone: <code>${escapeHTML(phone)}</code>\n` : '') +
    (plan ? `${planEmoji[plan.toLowerCase()] || '🎯'} Plan: <b>${plan.toUpperCase()}</b>\n` : '') +
    (exam ? `📋 Exam: <b>${exam.toUpperCase()}</b>\n` : '') +
    (source ? `🔍 Source: <code>${escapeHTML(source)}</code>\n` : '') +
    (attemptCount && attemptCount > 1 ? `🔄 Attempt: #${attemptCount}\n` : '') +
    `⏱️ Time: ${formattedTime} IST\n\n` +
    `⚠️ <i>Status: ${status || 'System Logged'}</i>`;

  return sendTelegramNotification(message);
}

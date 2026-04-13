/**
 * Simple HTML escape for Telegram messages
 * Bhai, agar user name mein '<' ya '&' ho, to Telegram API error de deta hai.
 * Isliye humein isse escape karna padega.
 */
export function escapeHTML(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export async function sendTelegramNotification(message: string) {
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  if (!BOT_TOKEN || !CHAT_ID) {
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
        text: message, // Message should be escaped by the caller where appropriate
        parse_mode: 'HTML',
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      console.error('Telegram API Error:', await response.text());
    }
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('Telegram notification timed out');
    } else {
      console.error('Failed to send Telegram notification:', error);
    }
  } finally {
    clearTimeout(timeoutId);
  }
}

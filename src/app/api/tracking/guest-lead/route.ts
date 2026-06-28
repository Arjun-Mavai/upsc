/**
 * API: Track guest leads (name, phone, email, page visited)
 * Endpoint: POST /api/tracking/guest-lead
 * 
 * Logs all guest access attempts for lead generation + analytics
 */

import { logger } from '@/lib/logger';
import { sendTelegramEventNotification, sendLeadNotification, escapeHTML } from '@/lib/telegram';
import { createGuestEntry } from '@/actions/guest-actions';
import { after } from 'next/server';

export interface GuestLeadPayload {
  name: string;
  phone: string;
  email?: string;
  page: string;
  timestamp: string;
  referrer?: string;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as GuestLeadPayload;

    // Validate
    if (!body.name || !body.phone || !body.page) {
      return Response.json(
        { error: 'Missing required fields: name, phone, page' },
        { status: 400 }
      );
    }

    // Save to DB (Drizzle guests table upsert)
    try {
      await createGuestEntry({
        name: body.name,
        mobile: body.phone,
        email: body.email,
        leadSource: body.page,
        referrer: body.referrer,
      });
    } catch (dbError) {
      logger.error('Failed to save guest lead to DB (non-blocking)', dbError as Error, {
        category: 'admin',
      });
    }

    // Log guest lead
    logger.info('Guest lead captured', {
      category: 'admin',
      metadata: {
        name: body.name,
        phone: body.phone,
        email: body.email || 'not-provided',
        page: body.page,
        timestamp: body.timestamp,
        userAgent: req.headers.get('user-agent') || 'unknown',
      },
    });

    // 🚀 TELEGRAM NOTIFICATION FOR GUEST LEAD (MPPSC ZEN Admin Alert)
    after(async () => {
      try {
        const displayCategory =
          body.page === 'mains-pyq-library'
            ? '📚 Mains PYQ Library'
            : (body.page === 'mains-syllabus' || body.page === 'upsc-mains')
              ? '📘 Mains Syllabus Library'
              : `🔍 ${body.page}`;

        const isMains = body.page.includes('mains');
        const tags = isMains ? '#GuestLead #mainslead #UPSC' : '#GuestLead #UPSC';

        const telegramMessage =
          `👮 <b>UPSC ZEN ADMIN ALERT</b>\n` +
          `🔓 <b>Free Content Unlocked! (Guest Lead)</b>\n\n` +
          `👤 <b>Name:</b> ${escapeHTML(body.name)}\n` +
          `📞 <b>Phone:</b> ${escapeHTML(body.phone)}\n` +
          (body.email ? `📧 <b>Email:</b> ${escapeHTML(body.email)}\n` : '') +
          `🎯 <b>Module Access:</b> <code>${displayCategory}</code>\n` +
          (body.referrer ? `🔗 <b>Referrer:</b> <code>${escapeHTML(body.referrer)}</code>\n` : '') +
          `⏱️ <b>Time:</b> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} IST\n\n` +
          `${tags}`;

        await sendTelegramEventNotification(telegramMessage);
      } catch (telegramError) {
        logger.error('Telegram guest lead notification failed (non-blocking)', telegramError, {
          category: 'telegram',
        });
      }
    });

    return Response.json({
      success: true,
      message: 'Lead captured',
    });
  } catch (error) {
    logger.error('Failed to track guest lead', error as Error, {
      category: 'admin',
    });

    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

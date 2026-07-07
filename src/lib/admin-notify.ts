'use server';

import { Resend } from 'resend';
import { logger } from '@/lib/logger';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { sendTelegramNotification, escapeHTML } from '@/lib/tg-notify';
import { sendHumanRequestTelegramNotification, sendTelegramEventNotification } from '@/lib/telegram';

/**
 * 📧 ADMIN NOTIFICATION SYSTEM
 * 
 * Sends email notifications to admin for important events:
 * - New payments
 * - Plan upgrades
 * - Failed email attempts (so admin knows to manually contact user!)
 * 
 * Admin email is configured via ADMIN_EMAIL env variable.
 * Falls back to RESEND_FROM_EMAIL if not set.
 */

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.RESEND_FROM_EMAIL || 'upsc@zenscroll.app';

interface PaymentNotification {
  type: 'new_payment' | 'upgrade' | 'failed';
  userName: string;
  userEmail: string;
  planTier: 'lite' | 'pro';
  amountInRupees: number;
  orderId: string;
  paymentId: string;
  isUpgrade?: boolean;
  phone?: string | null;
  source?: string | null;
  attemptCount?: number;
}

interface EmailFailureNotification {
  userName: string;
  userEmail: string;
  errorMessage: string;
  paymentId: string;
}

/**
 * 💰 Notify Admin on Payment
 * 
 * Sends a concise email to admin when a payment is captured.
 * Non-blocking: Errors are logged but don't break the flow.
 */
export async function notifyAdminOnPayment(data: PaymentNotification) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      logger.warn('RESEND_API_KEY not set, skipping admin notification', { category: 'email' });
      return;
    }

    const resend = new Resend(apiKey);

    const fromName = process.env.EMAIL_FROM_NAME || 'UPSC Zen';
    const fromAddress = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    const fromEmail = `${fromName} <${fromAddress}>`;

    const { type, userName, userEmail, planTier, amountInRupees, orderId, paymentId, isUpgrade, phone, source, attemptCount } = data;

    // 📧 Different subject lines based on event type
    const subjects: Record<string, string> = {
      new_payment: `💰 New Payment: ₹${amountInRupees} — ${userName}`,
      upgrade: `🚀 Plan Upgrade: ${userName} → Pro`,
      failed: `⚠️ Failed Payment Attempt: ${userName}`,
    };

    const subject = subjects[type] || `Payment Event: ${userName}`;

    // 📝 Simple HTML email for admin (UPSC Zen product)
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
        <p style="font-size: 11px; color: #6366f1; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; margin: 0 0 8px 0;">UPSC Zen · Payments</p>
        <h2 style="color: #111; margin-bottom: 8px;">
          ${type === 'new_payment' ? '💰 New Payment Received' : type === 'upgrade' ? '🚀 Plan Upgrade' : '⚠️ Payment Failed'}
        </h2>
        
        <div style="background: #f8f9fa; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 6px 0; color: #666;">User</td>
              <td style="padding: 6px 0; font-weight: 600;">${userName}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #666;">Email</td>
              <td style="padding: 6px 0;"><a href="mailto:${userEmail}" style="color: #0066cc;">${userEmail}</a></td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #666;">Plan</td>
              <td style="padding: 6px 0;">
                <span style="background: ${planTier === 'pro' ? '#dcfce7' : '#e0f2fe'}; color: ${planTier === 'pro' ? '#166534' : '#0369a1'}; padding: 2px 8px; border-radius: 4px; font-weight: 600; text-transform: uppercase; font-size: 12px;">
                  ${planTier}${isUpgrade ? ' (Upgraded)' : ''}
                </span>
              </td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #666;">Amount</td>
              <td style="padding: 6px 0; font-weight: 700; color: #16a34a; font-size: 16px;">₹${amountInRupees}</td>
            </tr>
          </table>
        </div>
        
        <div style="font-size: 12px; color: #888; border-top: 1px solid #eee; padding-top: 12px; margin-top: 16px;">
          <p style="margin: 4px 0;"><strong>Order ID:</strong> ${orderId}</p>
          <p style="margin: 4px 0;"><strong>Payment ID:</strong> ${paymentId}</p>
          <p style="margin: 4px 0;"><strong>Time:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</p>
        </div>
      </div>
    `;

    const { error } = await resend.emails.send({
      from: fromEmail,
      to: [ADMIN_EMAIL],
      subject,
      html,
    });

    if (error) {
      logger.error('Failed to send admin notification email', error, { category: 'email' });
    } else {
      logger.info('Admin notified of payment', { category: 'email', metadata: { type, userEmail, amount: amountInRupees } });
    }

    // 🚀 NEW: Notify via Telegram (UPSC ZEN Branding)
    try {
      let tgStatus = '';
      let tgEmoji = '';
      
      if (type === 'new_payment') {
        tgStatus = '<b>UPSC ZEN: NEW SUCCESSFUL PAYMENT</b>';
        tgEmoji = '💰 ✅';
      } else if (type === 'upgrade') {
        tgStatus = '<b>UPSC ZEN: PLAN UPGRADE</b>';
        tgEmoji = '🚀 💎';
      } else {
        tgStatus = '<b>UPSC ZEN: PAYMENT FAILED</b>';
        tgEmoji = '⚠️ ❌';
      }

      const tgMessage = `${tgEmoji} ${tgStatus}\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `👤 <b>User:</b> ${escapeHTML(userName)}\n` +
        `📧 <b>Email:</b> ${escapeHTML(userEmail)}\n` +
        (phone ? `📞 <b>Phone:</b> <code>${escapeHTML(phone)}</code>\n` : '') +
        `💵 <b>Amount:</b> <code>₹${amountInRupees}</code>\n` +
        `🎟️ <b>Plan:</b> <code>${planTier.toUpperCase()}</code>${isUpgrade ? ' (Upgrade)' : ''}\n` +
        `📋 <b>Exam:</b> <code>UPSC</code>\n` +
        (source ? `🔍 <b>Source:</b> <code>${escapeHTML(source)}</code>\n` : '') +
        (attemptCount && attemptCount > 1 ? `🔄 <b>Payment Attempt:</b> #${attemptCount}\n` : '') +
        `🆔 <b>Order ID:</b> <code>${orderId}</code>\n` +
        `🆔 <b>Payment ID:</b> <code>${paymentId}</code>\n\n` +
        `⚡ <b>Status:</b> <i>${type === 'failed' ? 'Failed Attempt' : 'Automated access granted'}</i>`;

      await sendHumanRequestTelegramNotification(tgMessage);
    } catch (tgErr) {
      logger.error('Failed to send admin Telegram notification', tgErr, { category: 'email' });
    }

  } catch (error) {
    // Non-blocking: Don't let email failure break payment flow
    logger.error('Admin notification error (non-blocking)', error, { category: 'email' });
  }
}

/**
 * 🚨 Notify Admin When User Email Fails
 * 
 * CRITICAL: Jab user ko welcome email fail ho, admin ko pata chalna chahiye
 * taaki manually contact kar sake!
 */
export async function notifyAdminOnEmailFailure(data: EmailFailureNotification) {
  const { userName, userEmail, errorMessage, paymentId } = data;

  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      const resend = new Resend(apiKey);
      const fromName = process.env.EMAIL_FROM_NAME || 'UPSC Zen';
      const fromAddress = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
      const fromEmail = `${fromName} <${fromAddress}>`;

      const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #dc2626; margin-bottom: 8px;">🚨 User Email Failed — Manual Action Required!</h2>
          
          <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0 0 8px; font-weight: 600;">Payment succeeded but the welcome email to the user failed.</p>
            <p style="margin: 0; color: #666;">Send them the password setup link manually (UPSC Zen).</p>
          </div>
          
          <div style="background: #f8f9fa; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr>
                <td style="padding: 6px 0; color: #666;">User</td>
                <td style="padding: 6px 0; font-weight: 600;">${userName}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #666;">Email</td>
                <td style="padding: 6px 0;"><a href="mailto:${userEmail}" style="color: #0066cc; font-weight: 600;">${userEmail}</a></td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #666;">Payment ID</td>
                <td style="padding: 6px 0; font-family: monospace;">${paymentId}</td>
              </tr>
            </table>
          </div>
          
          <div style="background: #fef3c7; border-radius: 6px; padding: 12px; margin: 16px 0;">
            <p style="margin: 0; font-size: 13px; color: #92400e;">
              <strong>Error:</strong> ${errorMessage}
            </p>
          </div>
          
          <p style="font-size: 13px; color: #666;">
            <strong>Action:</strong> Admin → User management → find by email → send password / magic link.
          </p>
        </div>
      `;

      await resend.emails.send({
        from: fromEmail,
        to: [ADMIN_EMAIL],
        subject: `🚨 EMAIL FAILED: ${userName} (${userEmail}) — Payment ID: ${paymentId}`,
        html,
      });
    } else {
      logger.warn('RESEND_API_KEY missing, skipping admin failure email', { category: 'email' });
    }


    // 🚀 NEW: Notify via Telegram (UPSC ZEN Branding - Critical)
    try {
      const tgMessage = `🚨 <b>UPSC ZEN: USER EMAIL FAILED</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `Payment was successful but <b>Welcome Email</b> (Resend) failed.\n\n` +
        `👤 <b>User:</b> ${escapeHTML(userName)}\n` +
        `📧 <b>Email:</b> ${escapeHTML(userEmail)}\n` +
        `🆔 <b>Payment ID:</b> <code>${paymentId}</code>\n\n` +
        `❌ <b>Error:</b> <i>${escapeHTML(errorMessage)}</i>\n\n` +
        `⚠️ <b>Bhai, manual action lo:</b> Send setup link from admin panel ASAP!`;

      await sendHumanRequestTelegramNotification(tgMessage);
    } catch (tgErr) {
      logger.error('Failed to send admin failure Telegram notification', tgErr, { category: 'email' });
    }


  } catch (error) {
    // Last resort: Log to DB if even this fails
    logger.error('CRITICAL: Even admin notification failed!', error, { 
      category: 'email',
      metadata: { userEmail: data.userEmail, paymentId: data.paymentId }
    });
  }
}

/**
 * 📊 Log email attempt to database for tracking
 */
export async function logEmailAttempt(data: {
  userId: string;
  userEmail: string;
  type: 'welcome' | 'upgrade' | 'password_reset';
  status: 'sent' | 'failed';
  error?: string;
}) {
  try {
    // Log to a simple tracking table (create if needed)
    await db.run(sql`
      INSERT INTO email_logs (user_id, user_email, email_type, status, error_message, created_at)
      VALUES (${data.userId}, ${data.userEmail}, ${data.type}, ${data.status}, ${data.error || null}, datetime('now'))
    `);
  } catch {
    // Table might not exist, that's okay - just log
    logger.info('Email attempt logged', { category: 'email', metadata: data });
  }
}

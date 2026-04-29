import { NextResponse } from 'next/server';
import { db } from '@/db';
import { mppscUsers, verificationTokens } from '@/db/schema';
import { eq, isNull, and, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/lib/logger';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import ForgotPasswordEmail from '@/components/emails/ForgotPasswordEmail';
import { appPath } from '@/lib/app-url';

export async function POST(request: Request) {
  try {
    // ── Rate Limiting ───────────────────────────────────────────
    const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1';
    const { resetLimiter, checkRateLimit } = await import('@/lib/rate-limit');
    const { success } = await checkRateLimit(resetLimiter, ip);
    if (!success) {
      return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 });
    }

    // ── Parse Input ─────────────────────────────────────────────
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // ── Find Active User ────────────────────────────────────────
    // Note: We return generic success even if user not found to avoid enumeration
    const users = await db
      .select({ id: mppscUsers.id, name: mppscUsers.name, email: mppscUsers.email })
      .from(mppscUsers)
      .where(and(eq(mppscUsers.email, normalizedEmail), isNull(mppscUsers.deletedAt)))
      .limit(1);

    const user = users[0];

    if (user) {
      // ── Generate Token ──────────────────────────────────────────
      const token = uuidv4();
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await db.insert(verificationTokens).values({
        identifier: user.id,
        token,
        expires,
      });

      // ── Send Email ──────────────────────────────────────────────
      const actionUrl = appPath(`auth/set-password?token=${token}`);
      const emailHtml = await render(
        ForgotPasswordEmail({
          name: user.name || 'Aspirant',
          actionUrl,
        })
      );

      const resendApiKey = process.env.RESEND_API_KEY;
      if (resendApiKey) {
        const resend = new Resend(resendApiKey);
        const fromName = process.env.EMAIL_FROM_NAME || 'UPSC Zen';
        const fromAddress = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

        const { error: emailError } = await resend.emails.send({
          from: `${fromName} <${fromAddress}>`,
          to: [user.email],
          subject: 'Password Reset Request — UPSC Zen',
          html: emailHtml,
        });

        if (emailError) {
          logger.error('Forgot password email failed', emailError, {
            category: 'email',
            userId: user.id,
            metadata: { to: user.email },
          });
        }
      } else {
        logger.error('RESEND_API_KEY missing, cannot send forgot password email', undefined, {
          category: 'email',
          userId: user.id,
          metadata: { to: user.email },
        });
      }
    }

    // Always return generic success
    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, you will receive reset instructions shortly.',
    });
  } catch (error: any) {
    logger.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

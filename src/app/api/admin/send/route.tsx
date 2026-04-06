import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import EmailTemplate from '../../../../components/email-template';
import { cookies } from 'next/headers';
import { db } from '@/db';
import { appPath } from '@/lib/app-url';
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    // Admin auth check
    const cookieStore = await cookies();
    const token = cookieStore.get('mppsc_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { verifyToken } = await import('@/lib/jwt');

    interface SessionPayload {
      userId: string;
      iat?: number;
      exp?: number;
    }

    const decoded = verifyToken(token) as SessionPayload | null;

    if (!decoded?.userId) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }
    const adminUser = await db.query.mppscUsers.findFirst({
      where: (users, { eq }) => eq(users.id, decoded.userId), // Type safe now
    });
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = (await request.json().catch(() => ({}))) as { to?: string };
    const to = body.to || adminUser.email;

    const fromName = process.env.EMAIL_FROM_NAME || 'UPSC 2026';
    const fromAddress =
      process.env.RESEND_FROM_EMAIL || process.env.EMAIL_FROM_ADDRESS || 'onboarding@resend.dev';
    const fromEmail = `${fromName} <${fromAddress}>`;

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [to],
      subject: 'Test Email — UPSC ZEN',
      react: (
        <EmailTemplate
          name={adminUser.name || 'Admin'}
          actionUrl={appPath('/')}
          planName="Admin Test"
        />
      ),
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to send email';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { db } from '@/db';
import { mppscUsers } from '@/db/schema';
import { eq, isNull, and } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { logger } from '@/lib/logger';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔑 ADMIN PASSWORD RESET — Email + New Password → Direct DB update
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// No email sending, no token — admin directly resets password
// Flow: Admin auth → Find user by email → Hash new password → Update DB
//
// Simple aur seedha — admin ko email bhejne ki zaroorat nahi,
// wo directly new password set kar deta h user ke liye
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function POST(request: Request) {
  try {
    // ── Rate Limiting ───────────────────────────────────────────
    const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1';
    const { resetLimiter, checkRateLimit } = await import('@/lib/rate-limit');
    const { success } = await checkRateLimit(resetLimiter, ip);
    if (!success) {
      return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 });
    }

    // ── Admin Auth Check ────────────────────────────────────────
    const cookieStore = await cookies();
    const token = cookieStore.get('mppsc_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: Admin session required' }, { status: 401 });
    }

    const { verifyToken } = await import('@/lib/jwt');
    const decoded: any = verifyToken(token);
    if (!decoded?.userId) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const adminUser = await db.query.mppscUsers.findFirst({
      where: (users, { eq }) => eq(users.id, decoded.userId),
    });
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // ── Parse Input ─────────────────────────────────────────────
    const { email, newPassword } = await request.json();

    if (!email || !newPassword) {
      return NextResponse.json({ error: 'Email and new password required' }, { status: 400 });
    }

    // Password strength check
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return NextResponse.json(
        {
          error: 'Password weak! Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char.',
        },
        { status: 400 }
      );
    }

    // ── Find Active User ────────────────────────────────────────
    const users = await db
      .select({ id: mppscUsers.id, name: mppscUsers.name })
      .from(mppscUsers)
      .where(and(eq(mppscUsers.email, email.toLowerCase().trim()), isNull(mppscUsers.deletedAt)))
      .limit(1);

    const user = users[0];
    if (!user) {
      return NextResponse.json({ error: 'No active user found with this email' }, { status: 404 });
    }

    // ── Hash + Update Password ──────────────────────────────────
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.update(mppscUsers).set({ password: hashedPassword }).where(eq(mppscUsers.id, user.id));

    logger.info(`Password reset by admin for: ${email} (${user.id})`);

    return NextResponse.json({
      success: true,
      message: `Password reset for ${user.name || email}. User can login with new password.`,
    });
  } catch (error: any) {
    logger.error('Password reset error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

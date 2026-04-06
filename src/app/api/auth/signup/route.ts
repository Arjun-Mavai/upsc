import { NextResponse } from 'next/server';
import { db } from '@/db';
import { mppscUsers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { logger } from '@/lib/logger';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔐 ADMIN SIGNUP API — Sirf admin hi naya user bana sakta h
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// Flow: Admin auth check → Validate input → Hash password →
//       Calculate accessExpiresAt → Insert user → Return success
//
// Accepts: name, email, password, role, planTier, accessMonths, phone, metadata
// Default: role=guest, planTier=free, accessMonths=6
//
// Scalability: Rate limited, bcrypt(10), proper error codes
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const DEFAULT_ACCESS_MONTHS = 6;
// Plan-specific defaults — lite=4 months (till Prelims), pro=7 months (till Mains)
const PLAN_DEFAULT_MONTHS: Record<string, number> = { free: 0, lite: 4, pro: 7 };

export async function POST(request: Request) {
  try {
    // ── Rate Limiting — brute force se bachao ───────────────────
    const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1';
    const { signupLimiter, checkRateLimit } = await import('@/lib/rate-limit');

    const { success, limit, remaining, reset } = await checkRateLimit(signupLimiter, ip);

    if (!success) {
      return NextResponse.json(
        {
          error: 'Too many signup attempts. Please try again later.',
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
          },
        }
      );
    }

    // ── Admin Auth Check — sirf admin bana sakta h user ─────────
    const cookieStore = await cookies();
    const token = cookieStore.get('mppsc_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: Admin session required' }, { status: 401 });
    }

    const { verifyToken } = await import('@/lib/jwt');
    const decoded: any = verifyToken(token);

    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Unauthorized: Invalid session' }, { status: 401 });
    }

    const adminUser = await db.query.mppscUsers.findFirst({
      where: (users, { eq }) => eq(users.id, decoded.userId),
    });

    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Only admins can create accounts.' },
        { status: 403 }
      );
    }

    // ── Parse Request Body ──────────────────────────────────────
    const {
      email,
      password,
      name,
      role = 'guest', // 'guest' | 'admin'
      planTier = 'free', // 'free' | 'lite' | 'pro'
      accessMonths, // if not provided, auto-calculated from planTier
      phone = null,
      metadata = null,
    } = await request.json();

    // Auto-calculate duration: lite=4mo, pro=7mo, free=0(unlimited)
    const finalAccessMonths =
      accessMonths ?? PLAN_DEFAULT_MONTHS[planTier] ?? DEFAULT_ACCESS_MONTHS;

    // ── Input Validation ────────────────────────────────────────
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    if (!['guest', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role. Must be guest or admin.' }, { status: 400 });
    }

    if (!['free', 'lite', 'pro'].includes(planTier)) {
      return NextResponse.json(
        { error: 'Invalid plan tier. Must be free, lite, or pro.' },
        { status: 400 }
      );
    }

    // Password strength — 8+ chars, uppercase, lowercase, digit, special char
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return NextResponse.json(
        {
          error:
            'Password weak! Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char (@$!%*?&).',
        },
        { status: 400 }
      );
    }

    // ── Check if active user already exists ─────────────────────
    // Soft deleted wale ignore — only active accounts block signup
    const existingUsers = await db.select().from(mppscUsers).where(eq(mppscUsers.email, email));
    const activeUser = existingUsers.find((u) => !u.deletedAt);
    if (activeUser) {
      return NextResponse.json(
        { error: 'User with this email already exists (active account)' },
        { status: 409 }
      );
    }

    // ── Hash Password (bcrypt 10 rounds) ────────────────────────
    const hashedPassword = await bcrypt.hash(password, 10);

    // ── Calculate Access Expiry ─────────────────────────────────
    // finalAccessMonths=0 → unlimited (free/admin accounts)
    let accessExpiresAt: Date | null = null;
    if (finalAccessMonths > 0) {
      accessExpiresAt = new Date();
      accessExpiresAt.setMonth(accessExpiresAt.getMonth() + finalAccessMonths);
    }

    // ── Insert User ─────────────────────────────────────────────
    const userId = randomUUID();
    const isSubscribed = planTier !== 'free';

    await db.insert(mppscUsers).values({
      id: userId,
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      name: name.trim(),
      role,
      planTier,
      isSubscribed,
      isActive: true, // New users are always active
      accessExpiresAt,
      phone: phone?.trim() || null,
      metadata: metadata || null,
      examType: 'upsc' as const, // UPSC-only repo
    });

    logger.info(
      `User created by admin: ${email} | tier: ${planTier} | expires: ${accessExpiresAt?.toISOString() || 'never'}`
    );

    return NextResponse.json({
      success: true,
      message: `Account created: ${name} (${planTier}) — access ${finalAccessMonths > 0 ? `${finalAccessMonths} months` : 'unlimited'}`,
      user: { id: userId, email, name, planTier, role, accessExpiresAt },
    });
  } catch (error: any) {
    logger.error('Signup error:', error);
    if (error.code === 'SQLITE_CONSTRAINT' || error.message?.includes('UNIQUE')) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

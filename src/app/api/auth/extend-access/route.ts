import { NextResponse } from 'next/server';
import { db } from '@/db';
import { mppscUsers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { logger } from '@/lib/logger';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⏳ EXTEND ACCESS API — Admin extends user's access duration
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// Use case: Exam delay → admin extends access for specific users
// Takes userId + additionalMonths → extends accessExpiresAt
//
// If user already expired → extends from NOW (not from old expired date)
// If user not expired → extends from current expiry date
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function POST(request: Request) {
  try {
    // ── Admin Auth ──────────────────────────────────────────────
    const cookieStore = await cookies();
    const token = cookieStore.get('mppsc_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    // ── Parse Request ───────────────────────────────────────────
    const { userId, additionalMonths } = await request.json();

    if (!userId || !additionalMonths || additionalMonths < 1) {
      return NextResponse.json(
        { error: 'userId and additionalMonths (>= 1) required' },
        { status: 400 }
      );
    }

    // ── Find User ───────────────────────────────────────────────
    const users = await db.select().from(mppscUsers).where(eq(mppscUsers.id, userId)).limit(1);
    const user = users[0];

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.deletedAt) {
      return NextResponse.json(
        { error: 'Cannot extend access for deactivated user' },
        { status: 400 }
      );
    }

    // ── Calculate New Expiry ────────────────────────────────────
    const now = new Date();
    let baseDate: Date;

    if (user.accessExpiresAt) {
      const currentExpiry = new Date(user.accessExpiresAt);
      // If already expired, extend from now. If not expired, extend from current expiry.
      baseDate = currentExpiry < now ? now : currentExpiry;
    } else {
      // No expiry set (unlimited) — set from now
      baseDate = now;
    }

    const newExpiry = new Date(baseDate);
    newExpiry.setMonth(newExpiry.getMonth() + additionalMonths);

    // ── Update DB ───────────────────────────────────────────────
    await db
      .update(mppscUsers)
      .set({ accessExpiresAt: newExpiry })
      .where(eq(mppscUsers.id, userId));

    logger.info(
      `Access extended: ${user.email} | +${additionalMonths} months | new expiry: ${newExpiry.toISOString()}`
    );

    return NextResponse.json({
      success: true,
      message: `Access extended by ${additionalMonths} months for ${user.name}`,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        oldExpiry: user.accessExpiresAt,
        newExpiry,
      },
    });
  } catch (error: any) {
    logger.error('Extend access error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

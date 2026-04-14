import { NextResponse } from 'next/server';
import { db } from '@/db';
import { mppscUsers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { logger } from '@/lib/logger';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔄 UPGRADE API — Lite → Pro (In-place update)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// Flow: Admin auth → Find user → Update planTier to Pro
//       → Extend accessExpiresAt → Optional new password
//
// Previous approach (soft-delete + recreate) caused
// UNIQUE constraint failure on email column because
// soft-deleted rows still hold the email.
// Now we update in-place — simpler, no constraint issues.
//
// Admin-only endpoint.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function POST(request: Request) {
  try {
    // ── Admin Auth Check ────────────────────────────────────────
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
    const { userId, newPassword, accessMonths = 7 } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // ── Find Current User ───────────────────────────────────────
    const users = await db.select().from(mppscUsers).where(eq(mppscUsers.id, userId)).limit(1);
    const user = users[0];

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.deletedAt) {
      return NextResponse.json({ error: 'User is soft-deleted' }, { status: 400 });
    }

    if (user.planTier === 'pro') {
      return NextResponse.json({ error: 'User is already Pro tier' }, { status: 400 });
    }

    // ── Update in-place ─────────────────────────────────────────
    const oldTier = user.planTier || 'free';
    const accessExpiresAt = new Date();
    accessExpiresAt.setMonth(accessExpiresAt.getMonth() + accessMonths);

    const updates: Record<string, any> = {
      planTier: 'pro',
      isSubscribed: true,
      isActive: true,
      accessExpiresAt,
      metadata: {
        ...((user.metadata as Record<string, unknown>) || {}),
        upgradedFrom: oldTier,
        upgradedAt: new Date().toISOString(),
        upgradedBy: decoded.userId,
      },
    };

    if (newPassword) {
      updates.password = await bcrypt.hash(newPassword, 10);
    }

    await db.update(mppscUsers).set(updates).where(eq(mppscUsers.id, userId));

    logger.info(`User upgraded: ${user.email} | ${oldTier} → pro | by admin ${decoded.userId}`);

    return NextResponse.json({
      success: true,
      message: `${user.name || user.email} upgraded from ${oldTier} to Pro (${accessMonths} months)`,
      user: { id: userId, planTier: 'pro', accessExpiresAt },
    });
  } catch (error: any) {
    logger.error('Upgrade error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

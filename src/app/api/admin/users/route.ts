import { NextResponse } from 'next/server';
import { db } from '@/db';
import { mppscUsers } from '@/db/schema';
import { cookies } from 'next/headers';
import { sql, eq, and } from 'drizzle-orm';
import { logger } from '@/lib/logger';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 👥 ADMIN USERS LIST API — Saare users with stats
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// Returns: All users (active + deleted) with their status
// + Stats: total, active, expired, free/lite/pro counts, migrations
//
// Admin-only. Used by /admin/users page.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const dynamic = 'force-dynamic';

export async function GET() {
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

    // ── Fetch All UPSC Users (password excluded for security) ────────
    const allUsers = await db
      .select({
        id: mppscUsers.id,
        name: mppscUsers.name,
        email: mppscUsers.email,
        role: mppscUsers.role,
        planTier: mppscUsers.planTier,
        isSubscribed: mppscUsers.isSubscribed,
        isActive: mppscUsers.isActive,
        createdAt: mppscUsers.createdAt,
        deletedAt: mppscUsers.deletedAt,
        accessExpiresAt: mppscUsers.accessExpiresAt,
        phone: mppscUsers.phone,
        metadata: mppscUsers.metadata,
        previousUserId: mppscUsers.previousUserId,
      })
      .from(mppscUsers)
      .where(eq(mppscUsers.examType, 'upsc')) // Show only UPSC users
      .orderBy(sql`created_at DESC`);

    // ── Calculate Stats ─────────────────────────────────────────
    const now = new Date();
    const stats = {
      total: allUsers.length,
      active: 0,
      expired: 0,
      deleted: 0,
      inactive: 0,
      free: 0,
      lite: 0,
      pro: 0,
      migrations: 0, // lite→pro upgrades (users with previousUserId)
    };

    for (const user of allUsers) {
      if (user.deletedAt) {
        stats.deleted++;
      } else if (user.isActive === false) {
        stats.inactive++;
      } else if (user.accessExpiresAt && new Date(user.accessExpiresAt) < now) {
        stats.expired++;
      } else {
        stats.active++;
      }

      // Count plan tiers (only active users)
      if (!user.deletedAt) {
        if (user.planTier === 'free') stats.free++;
        else if (user.planTier === 'lite') stats.lite++;
        else if (user.planTier === 'pro') stats.pro++;
      }

      // Migration tracking
      if (user.previousUserId) stats.migrations++;
    }

    return NextResponse.json(
      { users: allUsers, stats },
      {
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  } catch (error: any) {
    logger.error('Admin users list error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// ── DELETE User ──────────────────────────────────────────────
export async function DELETE(req: Request) {
  try {
    const { userId } = await req.json();

    // ── Admin Auth ──────────────────────────────────────────────
    const cookieStore = await cookies();
    const token = cookieStore.get('mppsc_token')?.value;

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { verifyToken } = await import('@/lib/jwt');
    const decoded: any = verifyToken(token);

    if (!decoded?.userId) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

    const adminUser = await db.query.mppscUsers.findFirst({
      where: (users, { eq }) => eq(users.id, decoded.userId),
    });

    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (!userId) return NextResponse.json({ error: 'User ID required' }, { status: 400 });

    // 1. Get user details for logging before delete
    const targetUser = await db.query.mppscUsers.findFirst({
      where: (u, { eq }) => eq(u.id, userId),
    });

    if (!targetUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // 2. Log access delete activity
    const { logUserActivity } = await import('@/app/actions/user-activity');
    await logUserActivity({
      userId: targetUser.id,
      userEmail: targetUser.email,
      userName: targetUser.name,
      adminId: adminUser.id,
      action: 'DELETE',
      details: {
        reason: 'Admin deleted user',
        previousPlan: targetUser.planTier,
        joinedAt: targetUser.createdAt,
      },
    });

    // 3. Delete user (Cascades attempts/revisions, Set Null payments)
    await db.delete(mppscUsers).where(sql`id = ${userId}`);

    return NextResponse.json({ message: 'User deleted safely' });
  } catch (error: any) {
    logger.error('Delete user error:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}

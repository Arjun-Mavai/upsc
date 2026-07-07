import { cookies } from 'next/headers';
import { db } from '@/db';
import { mppscUsers } from '@/db/schema';
import { eq, isNull, and } from 'drizzle-orm';
import { cache } from 'react';
import { logger } from '@/lib/logger';
import type { AuthenticatedUser, UserRole, PlanTier } from '@/types/auth';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔐 AUTH VERIFICATION — har server component me use hota h
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// React cache() wrapper — ek request me multiple baar call
// hone par bhi DB query sirf EK baar chalega (dedup magic!)
//
// Checks:
//   1. Cookie exists? → nahi to null (not logged in)
//   2. JWT valid? → nahi to null (tampered/expired token)
//   3. User exists in DB? → nahi to null
//   4. User soft-deleted? → haan to null (deactivated account)
//
// Note: Expiry check is NOT done here — it's done at login time.
// Once logged in, user stays logged in until cookie expires (30 days).
// This prevents mid-session kicks which is bad UX.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const verifyAuthInternal = cache(async (): Promise<AuthenticatedUser | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get('mppsc_token');

  if (!token) {
    return null;
  }

  const { verifyToken } = await import('@/lib/jwt');
  const decoded = verifyToken(token.value);

  if (!decoded || typeof decoded === 'string' || !('userId' in decoded) || !decoded.userId) {
    return null;
  }

  const userId = decoded.userId as string;
  const tokenVersion = decoded.sessionVersion as number | null;

  try {
    // ⚡ Optimization: Only fetch columns needed for verification
    const users = await db
      .select({
        id: mppscUsers.id,
        email: mppscUsers.email,
        name: mppscUsers.name,
        role: mppscUsers.role,
        planTier: mppscUsers.planTier,
        isSubscribed: mppscUsers.isSubscribed,
        accessExpiresAt: mppscUsers.accessExpiresAt,
        accessGrants: mppscUsers.accessGrants,
        sessionVersion: mppscUsers.sessionVersion,
        isActive: mppscUsers.isActive,
        deletedAt: mppscUsers.deletedAt,
        examType: mppscUsers.examType,
        createdAt: mppscUsers.createdAt,
      })
      .from(mppscUsers)
      .where(
        and(
          eq(mppscUsers.id, userId),
          eq(mppscUsers.examType, 'upsc'),
          isNull(mppscUsers.deletedAt),
          eq(mppscUsers.isActive, true)
        )
      )
      .limit(1);
    
    const dbUser = users[0];
    if (!dbUser) return null;

    // Map to AuthenticatedUser type
    const user: AuthenticatedUser = {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: (dbUser.role as UserRole) || 'guest',
      planTier: (dbUser.planTier as PlanTier) || 'free',
      isSubscribed: !!dbUser.isSubscribed,
      accessExpiresAt: dbUser.accessExpiresAt,
      accessGrants: dbUser.accessGrants ? JSON.parse(dbUser.accessGrants) : ['upsc_pre'],
      sessionVersion: dbUser.sessionVersion,
      examType: dbUser.examType,
      createdAt: dbUser.createdAt,
    };

    // 🛡️ Single-Device Login Check
    if (user.sessionVersion !== tokenVersion) {
      logger.warn('Session version mismatch — remote logout triggered', {
        category: 'auth',
        userId,
        tokenVersion,
        dbVersion: user.sessionVersion,
      });
      return { ...user, _mismatch: true };
    }

    return user;
  } catch (error) {
    // DB errors → null (graceful degradation, user redirected to login)
    logger.error('Database error during auth verification:', error, {
      category: 'auth',
      userId,
    });
    return null;
  }
});

/**
 * 🔐 Standard Auth Verification
 * Returns user if valid, null if not (including session mismatch).
 */
export const verifyAuth = cache(async (): Promise<AuthenticatedUser | null> => {
  const user = await verifyAuthInternal();
  if (user && user._mismatch) {
    return null;
  }
  return user;
});

/**
 * 🛡️ ASSERT ADMIN — Server Action protection
 * Verifies user is logged in AND has 'admin' role.
 * Throws error if not authorized.
 */
export async function assertAdmin() {
  const user = await verifyAuth();
  if (!user || user.role !== 'admin') {
    throw new Error('Unauthorized: Admin access required');
  }
  return user;
}

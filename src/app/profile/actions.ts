'use server';

import { db } from '@/db';
import { mppscUsers, mppscUserActivities } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyAuth } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/lib/logger';
import {
  profileUpdateLimiter,
  passwordChangeLimiter,
  checkRateLimit,
} from '@/lib/rate-limit';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔒 PROFILE ACTIONS — Rate limited & validated
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface UpdateNameResult {
  success: boolean;
  message: string;
}

interface UpdatePasswordResult {
  success: boolean;
  message: string;
}

// Allowed characters: letters (any language), numbers, spaces, hyphens, periods
const NAME_PATTERN = /^[\p{L}\p{N}\s\-_.]+$/u;
const MIN_PASSWORD_LENGTH = 8;

/**
 * Update user's display name
 * Rate limited: 5 per 15 minutes
 */
export async function updateUserName(newName: string): Promise<UpdateNameResult> {
  const authUser = await verifyAuth();
  if (!authUser) {
    return { success: false, message: 'Not authenticated' };
  }

  // Rate limit check
  const { success: allowed } = await checkRateLimit(profileUpdateLimiter, authUser.id);
  if (!allowed) {
    logger.warn('Profile update rate limited', {
      category: 'auth',
      userId: authUser.id,
      metadata: { action: 'NAME_CHANGE' },
    });
    return { success: false, message: 'Too many updates. Please try again in 15 minutes.' };
  }

  // Validate name
  const trimmedName = newName.trim().normalize('NFC');
  if (!trimmedName || trimmedName.length < 2) {
    return { success: false, message: 'Name must be at least 2 characters' };
  }

  if (trimmedName.length > 50) {
    return { success: false, message: 'Name must be 50 characters or less' };
  }

  if (!NAME_PATTERN.test(trimmedName)) {
    return { success: false, message: 'Name contains invalid characters' };
  }

  try {
    const oldName = authUser.name;

    await db
      .update(mppscUsers)
      .set({ name: trimmedName })
      .where(eq(mppscUsers.id, authUser.id));

    await db.insert(mppscUserActivities).values({
      id: uuidv4(),
      userId: authUser.id,
      userEmail: authUser.email || '',
      userName: trimmedName,
      action: 'UPDATE',
      details: {
        type: 'NAME_CHANGE',
        oldName: oldName || null,
        newName: trimmedName,
        changedBy: 'self',
      },
    });

    logger.info('User name updated', {
      category: 'auth',
      userId: authUser.id,
      metadata: { oldName, newName: trimmedName },
    });

    return { success: true, message: 'Name updated successfully' };
  } catch (error) {
    logger.error('Update name error', error, {
      category: 'auth',
      userId: authUser.id,
    });
    return { success: false, message: 'Failed to update name' };
  }
}

/**
 * Update user's password
 * Rate limited: 3 per 15 minutes (strict - brute force protection)
 */
export async function updateUserPassword(
  currentPassword: string,
  newPassword: string
): Promise<UpdatePasswordResult> {
  const authUser = await verifyAuth();
  if (!authUser) {
    return { success: false, message: 'Not authenticated' };
  }

  // Rate limit check (stricter for password changes)
  const { success: allowed } = await checkRateLimit(passwordChangeLimiter, authUser.id);
  if (!allowed) {
    logger.warn('Password change rate limited', {
      category: 'auth',
      userId: authUser.id,
    });
    return {
      success: false,
      message: 'Too many password attempts. Please try again in 15 minutes.',
    };
  }

  if (!currentPassword || !newPassword) {
    return { success: false, message: 'Please fill all fields' };
  }

  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return {
      success: false,
      message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
    };
  }

  if (newPassword.length > 100) {
    return { success: false, message: 'Password too long' };
  }

  // Check password complexity
  const hasUpperCase = /[A-Z]/.test(newPassword);
  const hasLowerCase = /[a-z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);
  if (!hasUpperCase || !hasLowerCase || !hasNumber) {
    return {
      success: false,
      message: 'Password must contain uppercase, lowercase, and a number',
    };
  }

  try {
    const [user] = await db
      .select({ password: mppscUsers.password })
      .from(mppscUsers)
      .where(eq(mppscUsers.id, authUser.id));

    if (!user) {
      return { success: false, message: 'User not found' };
    }

    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      logger.warn('Failed password change attempt - wrong current password', {
        category: 'auth',
        userId: authUser.id,
      });
      return { success: false, message: 'Current password is incorrect' };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db
      .update(mppscUsers)
      .set({ password: hashedPassword })
      .where(eq(mppscUsers.id, authUser.id));

    await db.insert(mppscUserActivities).values({
      id: uuidv4(),
      userId: authUser.id,
      userEmail: authUser.email || '',
      userName: authUser.name,
      action: 'UPDATE',
      details: {
        type: 'PASSWORD_CHANGE',
        changedBy: 'self',
        timestamp: new Date().toISOString(),
      },
    });

    logger.info('Password changed successfully', {
      category: 'auth',
      userId: authUser.id,
    });

    return { success: true, message: 'Password updated successfully' };
  } catch (error) {
    logger.error('Update password error', error, {
      category: 'auth',
      userId: authUser.id,
    });
    return { success: false, message: 'Failed to update password' };
  }
}

/**
 * Get current user profile data
 */
export async function getUserProfile() {
  const authUser = await verifyAuth();
  if (!authUser) {
    return null;
  }

  return {
    id: authUser.id,
    name: authUser.name,
    email: authUser.email,
    planTier: authUser.planTier,
    createdAt: authUser.createdAt,
  };
}

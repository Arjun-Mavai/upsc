'use server';

import { db } from '@/db';
import {
  freeQuizAttempts,
  tests,
  feedbacks,
  supportTickets,
  mppscUsers,
  userAttempts,
  guests,
  payments,
} from '@/db/schema';
import { desc, eq, and, or, isNull, ne } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth-admin';

export interface ActivityEvent {
  id: string;
  type: 'TEST_SUBMIT' | 'GUEST_TEST' | 'FEEDBACK' | 'SUPPORT' | 'PAYMENT';
  user: string;
  detail: string;
  timestamp: Date;
  meta?: any;
}

export async function getLiveActivity(): Promise<ActivityEvent[]> {
  await requireAdmin();

  try {
    /**
     * UPSC-only admin dashboard.
     * - Guest: `tests.exam_type = 'upsc'` (guest attempt rows may not set exam_type yet).
     * - Logged-in: `tests` + `user_attempts.exam_type = 'upsc'` (set on submit from test).
     */
    const upscTest = eq(tests.examType, 'upsc');
    const upscAttempt = eq(userAttempts.examType, 'upsc');
    const userNotMppscAccount = or(isNull(mppscUsers.examType), ne(mppscUsers.examType, 'mppsc'));

    // 1. Guest attempts: UPSC tests only
    const guestTests = await db
      .select({
        id: freeQuizAttempts.id,
        testTitle: tests.title,
        guestId: freeQuizAttempts.guestId,
        score: freeQuizAttempts.score,
        timestamp: freeQuizAttempts.completedAt,
        guestName: guests.name,
      })
      .from(freeQuizAttempts)
      .innerJoin(tests, eq(freeQuizAttempts.testId, tests.id))
      .leftJoin(guests, eq(freeQuizAttempts.guestId, guests.id))
      .where(upscTest)
      .orderBy(desc(freeQuizAttempts.completedAt))
      .limit(10);

    // 2. Logged-in: UPSC test + UPSC attempt row + not an MPPSC-only account
    const userTests = await db
      .select({
        id: userAttempts.id,
        testTitle: tests.title,
        userName: mppscUsers.name,
        score: userAttempts.score,
        timestamp: userAttempts.endTime,
      })
      .from(userAttempts)
      .innerJoin(tests, eq(userAttempts.testId, tests.id))
      .innerJoin(mppscUsers, eq(userAttempts.userId, mppscUsers.id))
      .where(
        and(
          eq(userAttempts.isCompleted, true),
          upscTest,
          upscAttempt,
          userNotMppscAccount
        )
      )
      .orderBy(desc(userAttempts.endTime))
      .limit(10);

    // 2b. Recent captured payments (UPSC product only)
    const recentPayments = await db
      .select({
        id: payments.id,
        amount: payments.amount,
        planTier: payments.planTier,
        timestamp: payments.createdAt,
        userName: mppscUsers.name,
        userEmail: mppscUsers.email,
      })
      .from(payments)
      .innerJoin(mppscUsers, eq(payments.userId, mppscUsers.id))
      .where(and(eq(payments.status, 'captured'), eq(payments.examType, 'upsc')))
      .orderBy(desc(payments.createdAt))
      .limit(10);

    // 3. Fetch Feedbacks (UPSC only)
    const recentFeedbacks = await db
      .select({
        id: feedbacks.id,
        name: feedbacks.name,
        rating: feedbacks.rating,
        message: feedbacks.message,
        timestamp: feedbacks.createdAt,
      })
      .from(feedbacks)
      .where(eq(feedbacks.examType, 'upsc'))
      .orderBy(desc(feedbacks.createdAt))
      .limit(10);

    // 4. Fetch Support Tickets (UPSC only)
    const recentTickets = await db
      .select({
        id: supportTickets.id,
        name: supportTickets.name,
        category: supportTickets.category,
        timestamp: supportTickets.createdAt,
      })
      .from(supportTickets)
      .where(eq(supportTickets.examType, 'upsc'))
      .orderBy(desc(supportTickets.createdAt))
      .limit(10);

    // Combine and Sort
    const events: ActivityEvent[] = [];

    guestTests.forEach(t => {
      events.push({
        id: t.id,
        type: 'GUEST_TEST',
        user: t.guestName || 'Guest User',
        detail: `Attempted "${t.testTitle}" (Score: ${t.score})`,
        timestamp: t.timestamp || new Date(),
      });
    });

    userTests.forEach(t => {
      events.push({
        id: t.id,
        type: 'TEST_SUBMIT',
        user: t.userName || 'Student',
        detail: `Completed "${t.testTitle}" (Score: ${t.score})`,
        timestamp: t.timestamp || new Date(),
      });
    });

    recentFeedbacks.forEach(f => {
      events.push({
        id: f.id,
        type: 'FEEDBACK',
        user: f.name,
        detail: `Gave ${f.rating}⭐ feedback: "${f.message.substring(0, 50)}..."`,
        timestamp: f.timestamp || new Date(),
      });
    });

    recentTickets.forEach(s => {
      events.push({
        id: s.id,
        type: 'SUPPORT',
        user: s.name,
        detail: `Raised support ticket for ${s.category}`,
        timestamp: s.timestamp || new Date(),
      });
    });

    recentPayments.forEach((p) => {
      const rupees = (p.amount ?? 0) / 100;
      const label = p.planTier === 'pro' ? 'Pro' : p.planTier === 'lite' ? 'Lite' : 'Plan';
      events.push({
        id: p.id,
        type: 'PAYMENT',
        user: p.userName || p.userEmail || 'Student',
        detail: `Payment received — ${label} · ₹${rupees.toFixed(0)}`,
        timestamp: p.timestamp || new Date(),
      });
    });

    return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 20);
  } catch (error) {
    console.error('Activity Feed Error:', error);
    return [];
  }
}

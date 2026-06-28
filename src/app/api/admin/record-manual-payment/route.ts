import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { db } from '@/db';
import { payments, mppscUsers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💳 RECORD MANUAL PAYMENT — Audit trail ONLY
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Use case: User ne UPI/NEFT se payment ki, Razorpay flow complete
// nahi hua — admin payment entry daalta hai for records/audit.
//
// ⚠️  yah route SIRF `payments` table mein entry daalta hai.
//     mppsc_users table TOUCH NAHI HOTA.
//     Plan/access dene ke liye → Edit panel → "Grant Access" use karo.
//     Password set karne ke liye → 🔑 Link button use karo.
//
// Idempotency: Same transactionId dobara → 409 error (no duplicates).
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const schema = z.object({
  userId: z.string().min(1),
  transactionId: z.string().min(3, 'Transaction ID / UTR required (min 3 chars)'),
  amountRupees: z.number().min(1, 'Amount must be > 0'),
  planTier: z.enum(['lite', 'pro']),
  notes: z.string().max(500).optional(),
});

export async function POST(request: Request) {
  let adminId: string | undefined;
  let targetUserId: string | undefined;
  try {
    // ── Admin Auth ────────────────────────────────────────────
    const cookieStore = await cookies();
    const token = cookieStore.get('mppsc_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { verifyToken } = await import('@/lib/jwt');
    const decoded = verifyToken(token) as { userId?: string } | string | null;
    if (typeof decoded === 'string' || !decoded?.userId) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    adminId = decoded.userId;

    const adminUser = await db.query.mppscUsers.findFirst({
      where: eq(mppscUsers.id, adminId),
      columns: { role: true, id: true },
    });
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // ── Parse + Validate ─────────────────────────────────────
    const body = await request.json();
    const parsed = schema.parse(body);
    targetUserId = parsed.userId;
    const { userId, transactionId, amountRupees, planTier, notes } = parsed;

    // ── User Exists? (just for name/email in log) ─────────────
    const user = await db.query.mppscUsers.findFirst({
      where: eq(mppscUsers.id, userId),
      columns: { id: true, email: true, name: true, planTier: true },
    });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // ── Idempotency: duplicate transaction ID check ───────────
    const existing = await db
      .select({ id: payments.id })
      .from(payments)
      .where(eq(payments.paymentId, transactionId))
      .limit(1);
    if (existing.length > 0) {
      return NextResponse.json(
        { error: `Transaction ID "${transactionId}" already recorded. Duplicate entry blocked.` },
        { status: 409 }
      );
    }

    // ── Insert ONLY into payments table ───────────────────────
    await db.insert(payments).values({
      id: `mpay_${uuidv4()}`,
      userId,
      orderId: `MANUAL-${transactionId}`,
      paymentId: transactionId,
      signature: null,
      amount: Math.round(amountRupees * 100), // ₹ → paise
      planTier,
      status: 'captured',
      currency: 'INR',
      receipt: `manual_${userId.slice(0, 8)}`,
      notes: JSON.stringify({
        source: 'admin_manual',
        adminId,
        adminNote: notes || null,
        recordedAt: new Date().toISOString(),
        warning: 'User plan NOT auto-updated. Use Grant Access to give plan.',
      }),
      examType: 'upsc',
    });

    // ── Activity Log (GRANT action — no plan change) ──────────
    const { logUserActivity } = await import('@/app/actions/user-activity');
    await logUserActivity({
      userId,
      userEmail: user.email,
      userName: user.name,
      adminId,
      action: 'GRANT',
      details: {
        source: 'manual_payment_record',
        transactionId,
        amountRupees,
        planTier,
        adminNote: notes || null,
        note: 'Payment entry only — user plan updated separately via Grant Access',
      },
    });

    return NextResponse.json({
      success: true,
      message: `Payment recorded for ${user.name || user.email} (₹${amountRupees}, ${planTier}). Ab Grant Access se plan do, aur 🔑 Link se password set karwao.`,
      transactionId,
      userId,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || 'Invalid input' }, { status: 400 });
    }
    logger.error('Record manual payment error:', error, {
      category: 'system',
      userId: adminId,
      metadata: { targetUserId },
    });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

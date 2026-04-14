'use server';

import { db } from '@/db';
import { mppscUsers, pricingConfig, payments } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { PRICING_DEFAULTS } from '@/config/pricing';
import { verifyAuth } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import Razorpay from 'razorpay';
import { logger } from '@/lib/logger';
import crypto from 'crypto';
import { z } from 'zod';
import { sendTelegramNotification, escapeHTML } from '@/lib/tg-notify';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💳 START PAYMENT (Register + Create Order)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const startPaymentSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone must be at least 10 digits').max(20),
  source: z.string().optional(),
  planType: z.enum(['pro', 'upgrade']),
  examId: z.string().default('upsc'), // Added examId
});

interface StartPaymentInput extends z.infer<typeof startPaymentSchema> {}

/**
 * 💳 Start Payment (Server Action)
 *
 * Combined: Register User + Create Razorpay Order in ONE call
 */
export async function startPayment(input: StartPaymentInput) {
  try {
    // ── PHASE 0: Validate Input
    const validatedInput = startPaymentSchema.safeParse(input);
    if (!validatedInput.success) {
      return {
        success: false,
        error: validatedInput.error.issues[0]?.message || 'Invalid input data',
      };
    }

    const { name, email, phone, source, planType, examId } = validatedInput.data;
    const normalizedEmail = email.toLowerCase().trim();

    // ── PHASE 1: Find existing user by email
    const existingUser = await db.query.mppscUsers.findFirst({
      where: sql`LOWER(${mppscUsers.email}) = ${normalizedEmail}`,
    });

    const currentSession = await verifyAuth();

    // If this email already has a paid plan (pro) — block unless same user is logged in
    if (existingUser) {
      const tier = String(existingUser.planTier ?? 'free').toLowerCase();
      const isSubscribed = Boolean(existingUser.isSubscribed);
      const hasPaidPlan = tier === 'pro' || isSubscribed;

      if (hasPaidPlan) {
        if (!currentSession || currentSession.id !== existingUser.id) {
          return {
            error: 'You are already a Pro member. Please log in to your account!',
          };
        }
      }
    }

    let userId: string;
    if (existingUser) {
      let existingMeta: Record<string, unknown> = {};
      const raw = existingUser.metadata;
      if (raw) {
        if (typeof raw === 'string') {
          try {
            existingMeta = JSON.parse(raw);
          } catch {
            existingMeta = {};
          }
        } else if (typeof raw === 'object' && raw !== null && !Array.isArray(raw)) {
          existingMeta = raw as Record<string, unknown>;
        }
      }

      await db
        .update(mppscUsers)
        .set({
          name: name.trim(),
          phone: phone.trim(),
          metadata: JSON.stringify({ ...existingMeta, source }),
        })
        .where(eq(mppscUsers.id, existingUser.id));
      userId = existingUser.id;
    } else {
      userId = uuidv4();
      const tempPassword = await bcrypt.hash(uuidv4(), 10);
      await db.insert(mppscUsers).values({
        id: userId,
        email: normalizedEmail,
        name: name.trim(),
        phone: phone.trim(),
        password: tempPassword,
        isActive: false,
        role: 'user',
        metadata: JSON.stringify({ source }),
        planTier: 'free',
        examType: examId as 'upsc' | 'mppsc' | 'all',
      });
    }

    // ── PHASE 2: Create Razorpay Order (Server-Side Pricing)
    if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return { error: 'Razorpay keys not configured' };
    }

    const rows = await db
      .select()
      .from(pricingConfig)
      .where(eq(pricingConfig.id, examId))
      .limit(1);
    const p = rows[0] || PRICING_DEFAULTS;

    const PLAN_AMOUNTS: Record<string, number> = {
      pro: (p.proPrice ?? PRICING_DEFAULTS.proPrice) * 100,
      upgrade: (p.upgradePrice ?? PRICING_DEFAULTS.upgradePrice) * 100,
    };

    const amount = PLAN_AMOUNTS[planType];
    if (!amount || amount < 100) {
      return { error: 'Invalid plan configuration' };
    }

    const instance = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const order = await instance.orders.create({
      amount,
      currency: 'INR',
      notes: { planType, userId, examId }, // Added examId to notes
    });

    return {
      success: true,
      data: {
        userId,
        order: { ...order, planType },
      },
    };
  } catch (error: unknown) {
    logger.error('Payment start error:', error, {
      category: 'payment',
      metadata: { planType: input.planType },
    });
    const message = error instanceof Error ? error.message : 'Failed to start payment';
    return { success: false, error: message };
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ✅ VERIFY PAYMENT (Signature + IDOR + Transaction)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface VerifyPaymentInput {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  userId?: string;
}

/**
 * ✅ Verify Payment (Server Action)
 */
export async function verifyPayment(input: VerifyPaymentInput) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = input;

    const session = await verifyAuth();
    const userId = session?.id || input.userId;
    if (!userId) {
      return { error: 'Unauthorized — no session or userId provided' };
    }

    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const isValidHex = /^[a-f0-9]+$/i.test(razorpay_signature);
    if (!isValidHex || razorpay_signature.length !== generated_signature.length) {
      return { error: 'Invalid signature format' };
    }

    const isValidSignature = crypto.timingSafeEqual(
      Buffer.from(generated_signature, 'hex'),
      Buffer.from(razorpay_signature, 'hex')
    );

    if (!isValidSignature) {
      return { error: 'Invalid signature' };
    }

    const existingPayment = await db.query.payments.findFirst({
      where: eq(payments.orderId, razorpay_order_id),
    });

    if (existingPayment) {
      return {
        message: 'Payment already verified',
        planTier: existingPayment.planTier,
      };
    }

    const instance = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    const order = await instance.orders.fetch(razorpay_order_id);
    const orderUserId = order.notes?.userId;
    const purchasedExamId = (order.notes?.examId as string) || 'upsc'; // Extract examId

    if (orderUserId && orderUserId !== userId) {
      return { error: 'Order does not belong to this user' };
    }

    const amountInPaise = Number(order.amount);
    const rows = await db
      .select()
      .from(pricingConfig)
      .where(eq(pricingConfig.id, purchasedExamId))
      .limit(1);
    const p = rows[0] || PRICING_DEFAULTS;

    const proPaise = (p.proPrice ?? PRICING_DEFAULTS.proPrice) * 100;
    const upgradePaise = (p.upgradePrice ?? PRICING_DEFAULTS.upgradePrice) * 100;

    let planTier: 'pro';
    if (amountInPaise === proPaise || amountInPaise === upgradePaise) {
      planTier = 'pro';
    } else {
      return { error: 'Payment amount does not match any valid plan' };
    }

    // 🔄 Logical ExamType Calculation
    // If user is already subscribed and buying a DIFFERENT exam -> set to 'all'
    const currentUser = await db.query.mppscUsers.findFirst({
      where: eq(mppscUsers.id, userId),
    });

    let nextExamType: 'upsc' | 'mppsc' | 'all' = purchasedExamId as any;
    if (currentUser?.isSubscribed) {
      const currentType = currentUser.examType;
      if (currentType !== purchasedExamId && currentType !== 'all') {
        nextExamType = 'all';
      } else {
        nextExamType = currentType as any;
      }
    }

    await db.transaction(async (tx) => {
      await tx.insert(payments).values({
        id: uuidv4(),
        userId,
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        signature: razorpay_signature,
        amount: amountInPaise,
        planTier,
        status: 'captured',
        examType: purchasedExamId as any,
      });

      await tx
        .update(mppscUsers)
        .set({
          planTier,
          isSubscribed: true,
          isActive: true,
          examType: nextExamType,
        })
        .where(eq(mppscUsers.id, userId));
    });

    // 🚀 Step 6: Notify via Telegram (Bina kisi secure info ke)
    try {
      const amountInRupees = amountInPaise / 100;
      const message = `💰 <b>Payment Successful!</b>\n\n` +
        `👤 User: ${escapeHTML(currentUser?.name || 'Unknown')}\n` +
        `📧 Email: ${escapeHTML(currentUser?.email || 'N/A')}\n` +
        `📞 Phone: ${escapeHTML(currentUser?.phone || 'N/A')}\n` +
        `🎟️ Plan: ${planTier.toUpperCase()}\n` +
        `💵 Amount: ₹${amountInRupees}\n` +
        `🆔 Payment ID: ${razorpay_payment_id.slice(-6)} (Masked)\n` +
        `✅ Access granted instantly.`;

      await sendTelegramNotification(message);
    } catch (err) {
      logger.error('Telegram notification failed for payment', { err });
    }

    return { success: true, planTier };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Verification failed';
    return { error: message };
  }
}

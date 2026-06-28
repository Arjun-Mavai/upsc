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
import { notifyAdminOnPayment, notifyAdminOnEmailFailure } from '@/lib/admin-notify';
import { verificationTokens } from '@/db/schema';
import { render } from '@react-email/render';
import WelcomeSetPasswordEmail from '@/components/emails/WelcomeSetPasswordEmail';
import { appPath } from '@/lib/app-url';
import { Resend } from 'resend';
import { serializeAccessGrants } from '@/lib/access-grants';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💳 START PAYMENT (Register + Create Order)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const startPaymentSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone must be at least 10 digits').max(20),
  source: z.string().optional(),
  planType: z.enum(['pro', 'upgrade', 'combo', 'mains']),
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
      const hasPaidPlan = tier === 'pro' || tier === 'combo' || isSubscribed;

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
      const existingMeta = (existingUser.metadata as Record<string, unknown>) || {};

      await db
        .update(mppscUsers)
        .set({
          name: name.trim(),
          phone: phone.trim(),
          metadata: { ...existingMeta, source },
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
        metadata: { source },
        planTier: 'free',
        examType: 'upsc', // UPSC platform forces upsc type
      });
    }

    // ── PHASE 2: Create Razorpay Order (Server-Side Pricing)
    if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return { error: 'Razorpay keys not configured' };
    }

    const rows = await db
      .select()
      .from(pricingConfig)
      .where(eq(pricingConfig.examType, 'upsc'))
      .limit(1);
    const p = rows[0] || PRICING_DEFAULTS;

    const PLAN_AMOUNTS: Record<string, number> = {
      pro: (p.proPrice ?? PRICING_DEFAULTS.proPrice) * 100,
      upgrade: (p.upgradePrice ?? PRICING_DEFAULTS.upgradePrice) * 100,
      combo: ((p as any).comboPrice ?? PRICING_DEFAULTS.comboPrice) * 100,
      mains: ((p as any).mainsPrice ?? PRICING_DEFAULTS.mainsPrice) * 100,
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
      // 🚨 Notify Admin: Failed Signature (Potential Fraud or System Error)
      const user = await db.query.mppscUsers.findFirst({
        where: eq(mppscUsers.id, userId),
      });

      notifyAdminOnPayment({
        type: 'failed',
        userName: user?.name || 'Unknown',
        userEmail: user?.email || 'N/A',
        planTier: 'pro', // Default for UPSC
        amountInRupees: 0,
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
      }).catch(() => {});

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
      // 🚨 Notify Admin: Potential IDOR attempt
      const user = await db.query.mppscUsers.findFirst({
        where: eq(mppscUsers.id, userId),
      });

      notifyAdminOnPayment({
        type: 'failed',
        userName: user?.name || 'Unknown (Fraud)',
        userEmail: user?.email || 'N/A',
        planTier: 'pro',
        amountInRupees: Number(order.amount) / 100,
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
      }).catch(() => {});

      return { error: 'Order does not belong to this user' };
    }

    const amountInPaise = Number(order.amount);
    const rows = await db
      .select()
      .from(pricingConfig)
      .where(eq(pricingConfig.examType, 'upsc'))
      .limit(1);
    const p = rows[0] || PRICING_DEFAULTS;

    const proPaise = (p.proPrice ?? PRICING_DEFAULTS.proPrice) * 100;
    const upgradePaise = (p.upgradePrice ?? PRICING_DEFAULTS.upgradePrice) * 100;
    const comboPaise = ((p as any).comboPrice ?? PRICING_DEFAULTS.comboPrice) * 100;
    const mainsPaise = ((p as any).mainsPrice ?? PRICING_DEFAULTS.mainsPrice) * 100;

    let planTier: 'pro';
    if (amountInPaise === proPaise || amountInPaise === upgradePaise || amountInPaise === comboPaise || amountInPaise === mainsPaise) {
      planTier = 'pro';
    } else {
      // 🚨 Notify Admin: Amount Mismatch
      const user = await db.query.mppscUsers.findFirst({
        where: eq(mppscUsers.id, userId),
      });

      notifyAdminOnPayment({
        type: 'failed',
        userName: user?.name || 'Unknown',
        userEmail: user?.email || 'N/A',
        planTier: 'pro',
        amountInRupees: amountInPaise / 100,
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
      }).catch(() => {});

      return { error: 'Payment amount does not match any valid plan' };
    }

    // 🔄 Platform Isolation
    // On the UPSC platform, we always set the user's examType to 'upsc'
    // This prevents cross-platform access if the database is shared.
    const nextExamType: 'upsc' | 'mppsc' | 'mppolice' = 'upsc';

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
        examType: 'upsc', // Log as UPSC payment
      });

      await tx
        .update(mppscUsers)
        .set({
          planTier,
          isSubscribed: true,
          isActive: true,
          examType: nextExamType,
          accessGrants: serializeAccessGrants(['upsc_pre', 'upsc_mains']),
        })
        .where(eq(mppscUsers.id, userId));
    });

    // 🚀 Step 6: Notify via Centralized Admin System (Email + Telegram)
    try {
      const user = await db.query.mppscUsers.findFirst({
        where: eq(mppscUsers.id, userId),
      });

      await notifyAdminOnPayment({
        type: 'new_payment',
        userName: user?.name || 'Unknown',
        userEmail: user?.email || 'N/A',
        planTier: planTier,
        amountInRupees: amountInPaise / 100,
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
      });

      // 📧 Step 7: Send Welcome Email + Set Password Link (For New Users)
      const isUpgrade = order.notes?.planType === 'upgrade';
      if (!isUpgrade && user) {
        const token = uuidv4();
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Store token
        await db.insert(verificationTokens).values({
          identifier: userId,
          token,
          expires,
        });

        const actionUrl = appPath(`auth/set-password?token=${token}`);
        const emailHtml = await render(
          WelcomeSetPasswordEmail({
            name: user.name || 'Aspirant',
            actionUrl,
            planTier,
          })
        );

        const resendApiKey = process.env.RESEND_API_KEY;
        if (!resendApiKey) {
          logger.error('RESEND_API_KEY missing, cannot send welcome email', undefined, {
            category: 'email',
            userId,
            metadata: { to: user.email },
          });
          
          // Notify admin so they can manually handle it
          await notifyAdminOnEmailFailure({
            userName: user.name || 'Unknown',
            userEmail: user.email,
            errorMessage: 'RESEND_API_KEY is missing in environment variables',
            paymentId: razorpay_payment_id,
          });
        } else {
          const resend = new Resend(resendApiKey);
          const fromName = process.env.EMAIL_FROM_NAME || 'UPSC Zen';
          const fromAddress = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
          
          const { error: emailError } = await resend.emails.send({
            from: `${fromName} <${fromAddress}>`,
            to: [user.email],
            subject: 'Welcome to UPSC Zen Premium! 🚀',
            html: emailHtml,
          });

          if (emailError) {
            logger.error('Welcome email failed', emailError, {
              category: 'email',
              userId,
              metadata: { to: user.email },
            });

            await notifyAdminOnEmailFailure({
              userName: user.name || 'Unknown',
              userEmail: user.email,
              errorMessage: emailError.message,
              paymentId: razorpay_payment_id,
            });
          }
        }
      }
    } catch (err) {
      logger.error('Post-payment notification/email flow failed', err, { category: 'email' });
    }

    return { success: true, planTier };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Verification failed';
    
    // 🚨 Notify Admin: Unexpected Verification Failure
    notifyAdminOnPayment({
      type: 'failed',
      userName: 'System Error / Unexpected',
      userEmail: 'N/A',
      planTier: 'pro',
      amountInRupees: 0,
      orderId: input.razorpay_order_id,
      paymentId: input.razorpay_payment_id,
    }).catch(() => {});

    return { error: message };
  }
}

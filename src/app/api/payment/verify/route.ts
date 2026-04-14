import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { db } from '@/db';
import { payments, verificationTokens, mppscUsers, pricingConfig } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { Resend } from 'resend';
import EmailTemplate from '@/components/email-template';
import { v4 as uuidv4 } from 'uuid';
import { addHours } from 'date-fns';
import { checkRateLimit } from '@/lib/rate-limit';
import { appPath } from '@/lib/app-url';
import { PRICING_DEFAULTS } from '@/config/pricing';
import { notifyAdminOnPayment, notifyAdminOnEmailFailure } from '@/lib/admin-notify';

/**
 * Payment Verification API - The Trust Center 🏦
 *
 * Bhai, ye route sabse heavy lifting karta h. Jab user pay karke wapas aata h,
 * humein verify karna padta h ki sach me pay kiya ya bas fake request bhej di.
 *
 * Key Pillars of Trust:
 * 1. **HMAC Signature Check**: Cryptographic proof ki data Razorpay se hi aaya h.
 * 2. **Razorpay Server Cross-Check**: Hum Razorpay se order fetch karke amount re-verify karte h.
 * 3. **Idempotency**: Agar user page refresh kare, to double entry nahi honi chahiye.
 * 4. **Transactional Data**: Payment record karo, User ko assign karo, aur Email bhejo.
 */
export async function POST(req: Request) {
  let requestUserId: string | undefined;
  let requestOrderId: string | undefined;
  let requestPaymentId: string | undefined;
  try {
    // 🛑 Rate Limit: Protect verification endpoint
    const ip = req.headers.get('x-forwarded-for') ?? '127.0.0.1';
    const { paymentLimiter } = await import('@/lib/rate-limit');
    const { success } = await checkRateLimit(paymentLimiter, ip);
    if (!success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId } = body;
    requestUserId = userId;
    requestOrderId = razorpay_order_id;
    requestPaymentId = razorpay_payment_id;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 👤 Step 0: Identify User (for notifications)
    const user = await db.query.mppscUsers.findFirst({
      where: eq(mppscUsers.id, userId),
    });
    if (!user || user.email === null) {
      return NextResponse.json({ error: 'User not found' }, { status: 400 });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) throw new Error('Razorpay secret not configured');

    // 🔒 Step 1: Signature Verification (Cryptography Magic)
    // Formula: HMAC_SHA256(order_id + "|" + payment_id, secret)
    // Agar ye match nahi hua, to pakka koi fraud karne ki koshish kar raha h.
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(razorpay_order_id + '|' + razorpay_payment_id);
    const generated_signature = hmac.digest('hex');

    // 🛡️ CRASH PREVENTION: Validate signature format BEFORE timingSafeEqual
    // timingSafeEqual THROWS if buffer lengths differ! Attacker could crash server
    // with garbage signature like "abc" (odd hex → different buffer length)
    const isValidHex = /^[a-f0-9]+$/i.test(razorpay_signature);
    if (!isValidHex || razorpay_signature.length !== generated_signature.length) {
      return NextResponse.json({ error: 'Invalid payment signature format' }, { status: 400 });
    }

    // 🛡️ Timing-Safe Comparison (Prevents timing attacks)
    const isValidSignature = crypto.timingSafeEqual(
      Buffer.from(generated_signature, 'hex'),
      Buffer.from(razorpay_signature, 'hex')
    );

    if (!isValidSignature) {
      // 🚨 Notify Admin: Failed Signature
      notifyAdminOnPayment({
        type: 'failed',
        userName: user?.name || 'Unknown',
        userEmail: user?.email || 'N/A',
        planTier: 'pro',
        amountInRupees: 0,
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
      }).catch(() => {});

      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
    }

    // 🔄 Step 2: Idempotency Check (Double-Spending Prevention)
    // Check karo ki ye payment ID pehle se DB me to nahi h?
    const existingPayment = await db
      .select({ id: payments.id })
      .from(payments)
      .where(eq(payments.paymentId, razorpay_payment_id))
      .limit(1);
    if (existingPayment.length > 0) {
      return NextResponse.json({ success: true, message: 'Payment already verified' });
    }

    // 🕵️ Step 4: Cross-Check with Razorpay API (Trust but Verify)
    // Hamesha 'captured' amount check karo. Signature sahi ho sakti h par amount galat ho sakta h
    // (rare but possible via specialized attacks). Fetch real data from source.
    const instance = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
      key_secret: secret,
    });
    const order = await instance.orders.fetch(razorpay_order_id);
    const paidAmount = order.amount as number; // amount in paise

    // 🛡️ CRITICAL FIX: Order Ownership Verification (IDOR Prevention)
    const orderUserId = order.notes?.userId;
    const examId = 'upsc'; // UPSC-only platform

    if (orderUserId && orderUserId !== userId) {
      logger.warn('Payment verification failed: Order ownership mismatch', {
        category: 'payment',
        metadata: {
          orderUserId,
          requestUserId: userId,
          orderId: razorpay_order_id,
        },
      });

      // 🚨 Notify Admin: IDOR Attempt
      notifyAdminOnPayment({
        type: 'failed',
        userName: user?.name || 'Unknown (Fraud)',
        userEmail: user?.email || 'N/A',
        planTier: 'pro',
        amountInRupees: paidAmount / 100,
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
      }).catch(() => {});

      return NextResponse.json({ error: 'Order does not belong to this user' }, { status: 403 });
    }

    // 🏷️ Step 5: Logic to assign Plan based on Amount
    const pricingRows = await db
      .select()
      .from(pricingConfig)
      .where(eq(pricingConfig.examType, examId))
      .limit(1);

    let p = pricingRows[0];
    if (!p) {
      const defaultRows = await db
        .select()
        .from(pricingConfig)
        .where(eq(pricingConfig.examType, 'upsc'))
        .limit(1);
      p = defaultRows[0] || PRICING_DEFAULTS;
    }

    const proAmountPaise = (p.proPrice ?? PRICING_DEFAULTS.proPrice) * 100;
    const planTier = 'pro' as const; // UPSC only has Pro plan

    // 📅 Calculate Expiry Date
    const months = p.proMonths ?? PRICING_DEFAULTS.proMonths;
    const accessExpiresAt = new Date();
    accessExpiresAt.setMonth(accessExpiresAt.getMonth() + months);

    // 💾 Step 6: Persist Payment in DB + Update User Plan (ATOMIC TRANSACTION)
    await db.transaction(async (tx) => {
      await tx.insert(payments).values({
        id: `pay_${uuidv4()}`,
        userId,
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        signature: razorpay_signature,
        amount: paidAmount,
        planTier,
        status: 'captured',
        currency: 'INR',
        examType: 'upsc' as const, // UPSC-only repo
      });

      await tx
        .update(mppscUsers)
        .set({
          planTier: planTier as 'lite' | 'pro',
          isSubscribed: true,
          accessExpiresAt,
        })
        .where(eq(mppscUsers.id, userId));
    });

    // 🎫 Step 7: Generate 'Magic Link' Token
    // User ko ab password set karna h. Hum ek secure, temporary token banate h.
    const token = uuidv4();
    const expires = addHours(new Date(), 1); // Token valid for 1 hour

    await db.insert(verificationTokens).values({
      identifier: userId,
      token,
      expires,
    });

    // 📧 Step 8: Send Welcome Email (The "Wow" Moment)
    // Resend API se beautiful email bhejo jisme Magic Link ho.
    const resend = new Resend(process.env.RESEND_API_KEY);

    const fromName = 'UPSC Zen'; // UPSC platform sender name
    const fromAddress =
      process.env.RESEND_FROM_EMAIL || process.env.EMAIL_FROM_ADDRESS || 'onboarding@resend.dev';
    const fromEmail = `${fromName} <${fromAddress}>`;

    const actionUrl = `${appPath('auth/set-password')}?token=${token}`;

    const planLabel = 'Pro Plan';

    const { error: emailError } = await resend.emails.send({
      from: fromEmail,
      to: [user.email],
      subject: `🎉 Welcome to UPSC Zen — Set Your Password`,
      react: EmailTemplate({ name: user.name || 'Student', actionUrl, planName: planLabel }),
    });

    if (emailError) {
      // 🚨 User email failed! Log error + notify admin immediately
      logger.error('Failed to send welcome email via Resend', emailError, {
        category: 'email',
        userId,
        metadata: { to: user.email },
      });

      // 📧 CRITICAL: Admin ko batao ki user ko email nahi gaya
      // Taaki manually contact kar sake!
      notifyAdminOnEmailFailure({
        userName: user.name || 'Unknown',
        userEmail: user.email,
        errorMessage:
          typeof emailError === 'object' && emailError !== null && 'message' in emailError
            ? String(emailError.message)
            : JSON.stringify(emailError),
        paymentId: razorpay_payment_id,
      }).catch(() => {});
    }

    // 📧 Step 9: Notify Admin (Non-blocking)
    // Admin ko bhi email bhejo ki naya payment aaya hai
    notifyAdminOnPayment({
      type: 'new_payment',
      userName: user.name || 'Unknown',
      userEmail: user.email,
      planTier,
      amountInRupees: paidAmount / 100,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
    }).catch(() => {}); // Fire and forget, don't block response

    // ── Log Activity ──────────────────────────────────────────────
    try {
      const { logUserActivity } = await import('@/app/actions/user-activity');
      await logUserActivity({
        userId,
        userEmail: user.email,
        userName: user.name,
        adminId: 'system', // System triggered
        action: 'PLAN_CHANGE',
        details: {
          plan: planTier,
          amount: paidAmount / 100,
          orderId: razorpay_order_id,
          paymentId: razorpay_payment_id,
          reason: 'Initial Payment',
          isNew: true,
        },
      });
    } catch (err) {
      logger.warn('Failed to log activity:', {
        category: 'payment',
        metadata: { error: err, userId },
      });
    }

    return NextResponse.json({ success: true, planTier });
  } catch (error) {
    logger.error('Payment verification error:', error, {
      category: 'payment',
      userId: requestUserId,
      metadata: { razorpay_order_id: requestOrderId, razorpay_payment_id: requestPaymentId },
    });
    return NextResponse.json({ error: 'Payment verification failed' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import Razorpay from 'razorpay';
import { verifyAuth } from '@/lib/auth';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rate-limit';
import { getPricingConfigRow, pricingRowToData } from '@/lib/pricing-db';

const createOrderSchema = z.object({
  planType: z.enum(['pro', 'upgrade']), // UPSC only has Pro plan
  examId: z.string().optional(),
});

/**
 * Razorpay Order Creation API - The Security Gate 🛡️
 *
 * Bhai, ye route sabse critical h. Yaha hum 'Order' create karte h.
 *
 * 🔥 Why Server-Side?
 * Agar hum frontend se amount bhejte, to koi bhi right-click karke inspect element se
 * amount ko 999 se 1 kar sakta tha! 😱
 * Isliye hum sirf 'planType' lete h aur amount DB/Config se uthate h.
 *
 * Best Practices:
 * 1. Zod Validation: Incoming data ko sanitize karo.
 * 2. Rate Limiting: Spam bots ko roko.
 * 3. Environment Variables: Keys code me hardcode nahi, .env me rakho.
 */
export async function POST(req: Request) {
  let planType: string | undefined;
  try {
    // 🚦 Rate Limit Check: 10 requests / 15 mins
    // Bhai, ye zaroori h taaki koi script lagakar hazaro fake orders na banaye.
    const ip = req.headers.get('x-forwarded-for') ?? '127.0.0.1';
    const host = req.headers.get('host') ?? '';
    const { paymentLimiter } = await import('@/lib/rate-limit');
    const { success } = await checkRateLimit(paymentLimiter, ip);
    if (!success) {
      return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 });
    }

    const { getExamFromHost } = await import('@/lib/exam-context');
    const body = await req.json();
    const parsed = createOrderSchema.parse(body);
    planType = parsed.planType;
    const examId = parsed.examId || getExamFromHost(host);

    if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay keys not configured');
    }

    // 💰 Amount Calculation: DB `default` row (admin) + optional per-exam row
    const p = pricingRowToData(await getPricingConfigRow(examId));

    const PLAN_AMOUNTS: Record<string, number> = {
      pro: p.proPrice * 100,
      upgrade: p.upgradePrice * 100,
    };

    const amount = PLAN_AMOUNTS[planType];
    if (!amount || amount < 100) {
      // Min 1 Rupee (100 paise)
      return NextResponse.json({ error: 'Invalid plan configuration' }, { status: 500 });
    }

    const instance = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // � Metadata: Add UserId for verification later
    const session = await verifyAuth();

    // �📝 Creating Order on Razorpay
    // Ye ID (order_xxx) frontend par jayegi. Payment isi ID ke against hoga.
    const order = await instance.orders.create({
      amount,
      currency: 'INR',
      notes: { 
        planType, 
        userId: session?.id ?? '',
        examId: examId 
      },
    });
    return NextResponse.json({ ...(order as any), planType });
  } catch (error: any) {
    logger.error('Razorpay order creation error:', error, {
      category: 'payment',
      metadata: { planType },
    });
    // 🛡️ SECURITY FIX: Don't expose internal error.message to client!
    // Bhai, error.message mein sensitive info ho sakta hai (stack trace,
    // DB connection string, etc.). Attacker isse exploit kar sakta hai.
    // Generic message bhejo, details sirf server logs mein rakhho.
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}

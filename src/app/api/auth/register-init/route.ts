import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { db } from '@/db';
import { mppscUsers } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { checkRateLimit } from '@/lib/rate-limit';

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().max(255),
  phone: z.string().min(10).max(15),
  source: z.string().optional(),
});

/**
 * Register Init API - The Lead Magnet 🧲
 *
 * Bhai, ye payment flow ka 'EntryPoint' h.
 * Hum user se payment lene se PEHLE uska account create karte h.
 *
 * 🤔 Why?
 * 1. Data Capture: Agar user payment page par drop ho gaya, tab bhi humare paas uska
 *    name/email h. Hum use follow-up kar sakte h ("Hey, you forgot to unlock Pro!").
 * 2. Identity: Payment gateway ko pre-fill karne ke liye user data chahiye.
 *
 * State:
 * User 'Guest' role aur 'isActive: false' ke saath banega.
 * Sirf Payment success hone par hi 'isActive: true' hoga.
 */
export async function POST(req: Request) {
  let requestEmail: string | undefined;
  let requestSource: string | undefined;
  try {
    // 🚦 Strict Rate Limit: 10 signups / hour
    // Prevent abuse of database storage by bots creating junk accounts.
    const ip = req.headers.get('x-forwarded-for') ?? '127.0.0.1';
    const { signupLimiter } = await import('@/lib/rate-limit');
    const { success } = await checkRateLimit(signupLimiter, ip);
    if (!success) {
      return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
    }

    const body = await req.json();
    const { name, email, phone, source } = registerSchema.parse(body);
    requestEmail = email;
    requestSource = source;
    const normalizedEmail = email.toLowerCase().trim();

    // 🔍 Check Existing User
    // Kya ye banda pehle aaya tha?
    // 🛡️ FIX: Use LOWER() for case-insensitive email match
    // Bhai, pehle eq(mppscUsers.email, normalizedEmail) tha —
    // agar DB mein "Arjun@Email.com" stored hai aur user "arjun@email.com"
    // bhejta hai, to match nahi hota! Duplicate account ban jaata!
    // Ab LOWER() dono side pe apply hota hai → consistent matching.
    const existingUser = await db.query.mppscUsers.findFirst({
      where: sql`LOWER(${mppscUsers.email}) = ${normalizedEmail}`,
    });

    if (existingUser) {
      if (existingUser.isActive) {
        // Bhai, ye already active user h. Ise login karne bolo.
        return NextResponse.json(
          { error: 'Account already exists. Please login to upgrade.' },
          { status: 400 }
        );
      }

      // Update existing inactive user (re-attempting payment)
      // Purane lead ko refresh kar rahe h latest details ke saath.
      await db
        .update(mppscUsers)
        .set({
          name,
          phone,
          metadata: JSON.stringify({ source }),
        })
        .where(eq(mppscUsers.id, existingUser.id));

      return NextResponse.json({ userId: existingUser.id, isNew: false });
    }

    // 🆕 Create New Inactive User
    // Random password set karte h kyunki password user baad me set karega payment ke baad.
    const userId = uuidv4();
    const tempPassword = await bcrypt.hash(uuidv4(), 10);

    await db.insert(mppscUsers).values({
      id: userId,
      email: normalizedEmail,
      name: name.trim(),
      phone: phone.trim(),
      password: tempPassword,
      isActive: false, // 👈 Key: Inactive until paid
      role: 'guest',
      metadata: JSON.stringify({ source }),
      planTier: 'free',
      examType: 'upsc' as const, // UPSC-only repo
    });

    return NextResponse.json({ userId, isNew: true });
  } catch (error: any) {
    logger.error('Registration init error:', error, {
      category: 'auth',
      metadata: { email: requestEmail, source: requestSource },
    });
    return NextResponse.json(
      { error: error.message || 'Failed to initialize registration' },
      { status: 500 }
    );
  }
}

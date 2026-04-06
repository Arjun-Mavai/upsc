import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/db';
import { mppscUsers } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('mppsc_token');

    if (!token) {
      return NextResponse.json({ authenticated: false });
    }

    // CRITICAL FIX: Decode the JWT to get the actual user ID
    const { verifyToken } = await import('@/lib/jwt');
    const decoded: any = verifyToken(token.value);

    if (!decoded || !decoded.userId) {
      return NextResponse.json({ authenticated: false });
    }

    // Verify user exists and is subscribed
    const users = await db
      .select({
        id: mppscUsers.id,
        name: mppscUsers.name,
        email: mppscUsers.email,
        isSubscribed: mppscUsers.isSubscribed,
        role: mppscUsers.role,
        plan_tier: mppscUsers.planTier,
      })
      .from(mppscUsers)
      .where(eq(mppscUsers.id, decoded.userId)) // Use decoded userId, not token string
      .limit(1);

    const user = users[0];

    if (!user) {
      return NextResponse.json({ authenticated: false });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        name: user.name,
        email: user.email,
        is_subscribed: user.isSubscribed,
        role: user.role,
        plan_tier: user.plan_tier,
      },
    });
  } catch (error) {
    return NextResponse.json({ authenticated: false });
  }
}

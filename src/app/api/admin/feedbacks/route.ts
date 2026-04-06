import { NextResponse } from 'next/server';
import { db } from '@/db';
import { feedbacks, mppscUsers } from '@/db/schema';
import { cookies } from 'next/headers';
import { desc, eq } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    // Verify Admin
    const cookieStore = await cookies();
    const token = cookieStore.get('mppsc_token')?.value;

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { verifyToken } = await import('@/lib/jwt');
    const decoded: any = verifyToken(token);

    if (!decoded?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Check role
    const user = await db.query.mppscUsers.findFirst({
      where: (users, { eq }) => eq(users.id, decoded.userId),
      columns: { role: true },
    });

    if (user?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch UPSC Feedbacks only
    const data = await db
      .select()
      .from(feedbacks)
      .where(eq(feedbacks.examType, 'upsc'))
      .orderBy(desc(feedbacks.createdAt));

    return NextResponse.json({ feedbacks: data });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

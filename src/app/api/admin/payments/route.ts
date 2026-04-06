import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';
import { db } from '@/db';
import { payments, mppscUsers } from '@/db/schema';
import { desc, eq, and } from 'drizzle-orm';

export async function GET(req: Request) {
  let payload: any;
  try {
    // Auth check — admin only
    const cookieStore = await cookies();
    const token = cookieStore.get('mppsc_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    payload = (await verifyToken(token)) as any;
    if (!payload?.userId) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const [admin] = await db
      .select({ role: mppscUsers.role })
      .from(mppscUsers)
      .where(and(eq(mppscUsers.id, payload.userId as string), eq(mppscUsers.examType, 'upsc')))
      .limit(1);
    if (!admin || admin.role !== 'admin')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Parse query params
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter') || 'all'; // all | today | week | month
    const search = searchParams.get('search') || '';

    // Date filters
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(todayStart);
    monthStart.setDate(monthStart.getDate() - 30);

    // ── Fetch all captured UPSC payments with user info ──
    const allPayments = await db
      .select({
        id: payments.id,
        orderId: payments.orderId,
        paymentId: payments.paymentId,
        amount: payments.amount,
        planTier: payments.planTier,
        status: payments.status,
        currency: payments.currency,
        createdAt: payments.createdAt,
        userName: mppscUsers.name,
        userEmail: mppscUsers.email,
        userPhone: mppscUsers.phone,
      })
      .from(payments)
      .leftJoin(mppscUsers, eq(payments.userId, mppscUsers.id))
      .where(and(eq(payments.status, 'captured'), eq(payments.examType, 'upsc'))) // UPSC-only
      .orderBy(desc(payments.createdAt));

    // ── Stats ──
    const totalRevenue = allPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const liteCount = allPayments.filter((p) => p.planTier === 'lite').length;
    const proCount = allPayments.filter((p) => p.planTier === 'pro').length;
    const liteRevenue = allPayments
      .filter((p) => p.planTier === 'lite')
      .reduce((s, p) => s + (p.amount || 0), 0);
    const proRevenue = allPayments
      .filter((p) => p.planTier === 'pro')
      .reduce((s, p) => s + (p.amount || 0), 0);

    const todayPayments = allPayments.filter((p) => p.createdAt && p.createdAt >= todayStart);
    const weekPayments = allPayments.filter((p) => p.createdAt && p.createdAt >= weekStart);
    const monthPayments = allPayments.filter((p) => p.createdAt && p.createdAt >= monthStart);

    // ── Daily chart data (last 30 days) ──
    const dailyMap = new Map<
      string,
      { count: number; revenue: number; lite: number; pro: number }
    >();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(todayStart);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      dailyMap.set(key, { count: 0, revenue: 0, lite: 0, pro: 0 });
    }
    for (const p of allPayments) {
      if (!p.createdAt) continue;
      const key = p.createdAt.toISOString().split('T')[0];
      const entry = dailyMap.get(key);
      if (entry) {
        entry.count++;
        entry.revenue += p.amount || 0;
        if (p.planTier === 'lite') entry.lite++;
        if (p.planTier === 'pro') entry.pro++;
      }
    }
    const dailyChart = Array.from(dailyMap.entries()).map(([date, data]) => ({
      date,
      label: new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      ...data,
    }));

    // ── Filter payments for table ──
    let filtered = allPayments;
    if (filter === 'today') filtered = todayPayments;
    else if (filter === 'week') filtered = weekPayments;
    else if (filter === 'month') filtered = monthPayments;

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          (p.userName || '').toLowerCase().includes(q) ||
          (p.userEmail || '').toLowerCase().includes(q) ||
          (p.userPhone || '').includes(q) ||
          (p.paymentId || '').toLowerCase().includes(q) ||
          (p.orderId || '').toLowerCase().includes(q)
      );
    }

    return NextResponse.json({
      stats: {
        total: allPayments.length,
        totalRevenue,
        liteCount,
        proCount,
        liteRevenue,
        proRevenue,
        today: todayPayments.length,
        todayRevenue: todayPayments.reduce((s, p) => s + (p.amount || 0), 0),
        week: weekPayments.length,
        weekRevenue: weekPayments.reduce((s, p) => s + (p.amount || 0), 0),
        month: monthPayments.length,
        monthRevenue: monthPayments.reduce((s, p) => s + (p.amount || 0), 0),
      },
      dailyChart,
      payments: filtered.map((p) => ({
        ...p,
        amount: p.amount / 100, // paise → rupees for display
        createdAt: p.createdAt?.toISOString(),
      })),
    });
  } catch (error) {
    logger.error('Admin payments error:', error, {
      category: 'system',
      userId: payload?.userId,
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

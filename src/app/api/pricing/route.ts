import { NextResponse } from 'next/server';
import { db } from '@/db';
import { pricingConfig } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { revalidateTag } from 'next/cache';
import { logger } from '@/lib/logger';
import { PRICING_DEFAULTS } from '@/config/pricing';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💰 PRICING API — GET (public) + PUT (admin-only)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// GET: Anyone can fetch current pricing (cached with tag 'pricing')
// PUT: Admin updates pricing → cache busted → frontend reflects immediately
//
// Single-row table pattern: id='default' always
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Default pricing values from centralized config
const DEFAULTS = (examType: string) => ({ examType, ...PRICING_DEFAULTS });

// ── GET — Public, cached ────────────────────────────────────
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const examType = (searchParams.get('examType') || 'upsc') as 'upsc' | 'mppsc' | 'mppolice';

    const rows = await db
      .select()
      .from(pricingConfig)
      .where(eq(pricingConfig.examType, examType))
      .limit(1);
    const pricing = rows[0] || DEFAULTS(examType);

    return NextResponse.json(
      { pricing },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error) {
    logger.error('Pricing GET error:', error);
    return NextResponse.json({ pricing: DEFAULTS('upsc') });
  }
}

// ── PUT — Admin-only, updates pricing + busts cache ─────────
export async function PUT(request: Request) {
  try {
    // Admin auth check (simplified check, usually handled by middleware/verifyAuth)
    // Here we maintain the existing logic but update it for multi-exam
    const cookieStore = await cookies();
    const token = cookieStore.get('mppsc_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { verifyToken } = await import('@/lib/jwt');
    const decoded: any = verifyToken(token);
    if (!decoded?.userId) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const adminUser = await db.query.mppscUsers.findFirst({
      where: (users, { eq }) => eq(users.id, decoded.userId),
    });
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { examType, ...data } = body;

    if (!examType) {
      return NextResponse.json({ error: 'examType is required' }, { status: 400 });
    }

    // Upsert — insert if not exists, update if exists
    const existing = await db
      .select()
      .from(pricingConfig)
      .where(eq(pricingConfig.examType, examType))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(pricingConfig).values({ examType, ...data, updatedAt: new Date() });
    } else {
      await db
        .update(pricingConfig)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(pricingConfig.examType, examType));
    }

    // Bust pricing cache — pricing page reloads with fresh data
    revalidateTag('pricing', { expire: 0 } as any);

    logger.info(`Pricing updated by admin: ${JSON.stringify(body)}`);

    return NextResponse.json({
      success: true,
      message: 'Pricing updated! Changes will reflect immediately.',
    });
  } catch (error) {
    logger.error('Pricing PUT error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

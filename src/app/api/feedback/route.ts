import { NextResponse } from 'next/server';
import { db } from '@/db';
import { feedbacks } from '@/db/schema';
import { randomUUID } from 'crypto';
import { logger } from '@/lib/logger';
import { feedbackLimiter, checkRateLimit } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    // 1. Rate Limiting Check
    const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1';
    const { success, limit, remaining, reset } = await checkRateLimit(feedbackLimiter, ip);

    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
          },
        }
      );
    }

    // 2. Parse & Validate Body
    const body = await request.json();
    const { name, email, phone, message, rating, category, userId, role, location } = body;

    // Strict Validation
    if (!name || name.length < 2) {
      return NextResponse.json({ error: 'Name is required (min 2 chars)' }, { status: 400 });
    }
    if (!message || message.length < 10) {
      return NextResponse.json({ error: 'Message is too short (min 10 chars)' }, { status: 400 });
    }
    const numRating = parseInt(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    const validCategories = ['bug', 'content', 'ui', 'feature_request', 'other'];
    const safeCategory = validCategories.includes(category) ? category : 'other';

    // 3. Save to DB
    await db.insert(feedbacks).values({
      id: randomUUID(),
      userId: userId || null,
      name: name.trim(),
      email: email || null,
      phone: phone || null,
      message: message.trim(),
      rating: numRating,
      category: safeCategory,
      role: role || null,
      location: location || null,
      examType: 'upsc' as const, // UPSC-only repo
    });

    logger.info('Feedback received from:', name);

    return NextResponse.json({ success: true, message: 'Feedback submitted successfully' });
  } catch (error) {
    logger.error('Feedback submission error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

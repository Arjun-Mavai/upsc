import { NextResponse } from 'next/server';
import { db } from '@/db';
import { testFeedback, tests, mppscUsers } from '@/db/schema';
import { cookies } from 'next/headers';
import { desc, eq, sql, and } from 'drizzle-orm';

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

    // Extract pagination params
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100); // Max 100
    const offset = (page - 1) * limit;

    // Fetch Test Feedbacks joined with Test Titles (with pagination)
    const data = await db
      .select({
        id: testFeedback.id,
        testId: testFeedback.testId,
        testTitle: tests.title,
        testName: testFeedback.testName, // Fallback title stored with feedback
        userName: testFeedback.userName,
        userEmail: testFeedback.userEmail,
        overallRating: testFeedback.overallRating,
        difficultyLevel: testFeedback.difficultyLevel,
        questionQuality: testFeedback.questionQuality,
        wouldRecommend: testFeedback.wouldRecommend,
        comments: testFeedback.comments,
        createdAt: testFeedback.createdAt,
      })
      .from(testFeedback)
      .leftJoin(tests, eq(testFeedback.testId, tests.id))
      .where(eq(testFeedback.examType, 'upsc')) // UPSC-only test feedback
      .orderBy(desc(testFeedback.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination with UPSC filter
    const totalCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(testFeedback)
      .where(eq(testFeedback.examType, 'upsc'));

    // Use testName as fallback when testTitle is null (for practice tests without real test IDs)
    const transformedData = data.map(item => ({
      ...item,
      testTitle: item.testTitle || item.testName || 'Unknown Test'
    }));

    return NextResponse.json({ 
      feedbacks: transformedData,
      pagination: {
        page,
        limit,
        total: totalCount[0].count,
        pages: Math.ceil(totalCount[0].count / limit)
      }
    });
  } catch (error) {
    console.error('Test Feedback API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

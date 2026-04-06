'use server';

import { db } from '@/db';
import { testFeedback, mppscUsers } from '@/db/schema';
import { type FeedbackFormType, feedbackFormSchema } from '@/lib/schemas/feedback';
import { randomUUID } from 'crypto';
import { verifyAuth } from '@/lib/auth';
import { eq } from 'drizzle-orm';

interface SubmitFeedbackParams {
  testId: string;
  testType: 'free' | 'premium' | 'pyq';
  testName?: string | null; // The title of the test (e.g., 'Modern History')
  data: FeedbackFormType;
  userName?: string | null;
  userEmail?: string | null;
}

export async function submitTestFeedback(params: SubmitFeedbackParams) {
  try {
    const { testId, testType, testName, data, userName, userEmail } = params;
    
    // ✅ Input validation for security
    if (!testId || testId.length > 100) {
      return { success: false, error: 'Invalid testId' };
    }
    
    if (!['free', 'premium', 'pyq'].includes(testType)) {
      return { success: false, error: 'Invalid testType' };
    }
    
    // Validate feedback data using Zod schema
    const validationResult = feedbackFormSchema.safeParse(data);
    if (!validationResult.success) {
      return { success: false, error: 'Invalid feedback data' };
    }
    
    const authUser = await verifyAuth();
    
    let effectiveName = userName?.slice(0, 100) || null; // Limit name length
    let effectiveEmail = userEmail?.slice(0, 100) || null; // Limit email length

    if (authUser) {
      const user = await db.query.mppscUsers.findFirst({
        where: eq(mppscUsers.id, authUser.id),
      });
      if (user) {
        effectiveName = effectiveName || user.name;
        effectiveEmail = effectiveEmail || user.email;
      }
    }

    // Convert to DB format with proper types
    const dbRecommend = data.wouldRecommend === 'yes' ? 'definitely' : 'no';

    const newFeedback = {
      id: randomUUID(),
      testId,
      testName, // Save the identifiable test name
      userId: authUser?.id || null,
      testType,
      overallRating: data.overallRating,
      difficultyLevel: data.difficultyLevel,
      questionQuality: 'good' as const, // Not collected in UI yet
      wouldRecommend: dbRecommend as 'definitely' | 'no',
      comments: data.comment,
      userName: effectiveName,
      userEmail: effectiveEmail,
      examType: 'upsc' as const, // UPSC-only repo
    };

    await db.insert(testFeedback).values(newFeedback);

    return { success: true };
  } catch (error) {
    console.error('Error in submitTestFeedback:', error);
    return { success: false, error: 'Failed to save feedback' };
  }
}

export async function hasUserSubmittedFeedback() {
  try {
    const authUser = await verifyAuth();
    if (!authUser) return false;

    const existingFeedback = await db
      .select({ id: testFeedback.id })
      .from(testFeedback)
      .where(eq(testFeedback.userId, authUser.id))
      .limit(1);

    return existingFeedback.length > 0;
  } catch (error) {
    console.error('Error in hasUserSubmittedFeedback:', error);
    return false;
  }
}

import { redirect } from 'next/navigation';
import { getTestWithQuestions, getUserAttempts } from '@/features/tests/actions/submission';
import { getQuestionsBySubject } from '@/features/tests/actions/pyq-analytics'; // Back to original
import { QuizPlayClient } from './QuizPlayClient';
import { verifyAuth } from '@/lib/auth';
import { Question } from '@/types/quiz';
import { logger } from '@/lib/logger';
import { SCORING_CONFIG, getExamScoring } from '@/lib/quiz-scoring';
import { getCachedAttemptLimits } from '@/app/admin/test-access/actions';
import { getSubjectPartAccess } from '@/app/syllabus/quiz/pyq/actions';
import { canAccessTest, getUserTier } from '@/lib/access-control';
import { getCurrentExam } from '@/config/exams';

interface PageProps {
  searchParams: Promise<{
    testId?: string;
    mode?: string;
    subject?: string;
    limit?: string;
    offset?: string;
    completed?: string;
  }>;
}

export default async function QuizPlayPage({ searchParams }: PageProps) {
  const params = await searchParams;
  logger.debug('params', { params, category: 'system' });
  const { testId, mode, subject, completed } = params;

  if (completed === 'true') {
    redirect('/syllabus/quiz/pyq');
  }

  // 📝 0. Validate Subject Whiteslist for Security
  const ALLOWED_SUBJECTS = [
    'MP GK',
    'History',
    'Geography',
    'Polity',
    'Economy',
    'Science',
    'ICT',
    'Current Affairs',
    'Environment & Ecology',
    'Science & Technology',
    'Art & Culture',
    'International Relations',
    'History (Ancient, Medieval, Modern)',
    'Geography (India & World)',
    'Polity (Indian Constitution & Governance)',
    'Economy (Basic Economics & Indian Economy)',
    'Quantitative Aptitude',
    'Reasoning',
    'Agriculture',
    'Economy / Agriculture',
    'Defence',
    'Defence / IR',
    'Geography / IR',
    'Environment / IR',
    'Governance / Economy',
    'Governance / Social Issues',
    'Misc',
    'General Studies',
    'General Studies (GS)',
  ];
  if (subject && !ALLOWED_SUBJECTS.includes(subject)) {
    // Prevent arbitrary subject injection
    redirect('/syllabus/quiz/pyq');
  }

  const exam = getCurrentExam();

  // 1. Handle Subject Practice Mode (Mixed PYQ)
  if (mode === 'pyq-subject' && subject) {
    const user = await verifyAuth();

    // Validate Pagination First (to calculate Part Access)
    const rawLimit = Number(params.limit);
    const limitDefault = 30; // Changed from 1000 to match CHUNK_SIZE default if not specified
    const limit = Math.min(
      Math.max(Number.isFinite(rawLimit) && rawLimit > 0 ? rawLimit : limitDefault, 1),
      limitDefault
    );

    const rawOffset = Number(params.offset);
    const offset = Math.max(Number.isFinite(rawOffset) && rawOffset >= 0 ? rawOffset : 0, 0);

    // Determine Part Number using fixed CHUNK_SIZE
    const CHUNK_SIZE = 30;
    const partNum = Math.floor(offset / CHUNK_SIZE) + 1;

    // 🔒 Granular Access Control (Check if this Part is Free/Unlocked)
    const accessMap = await getSubjectPartAccess(subject);
    const partAccess = accessMap?.[partNum];

    // Status: Locked if explicitly locked in DB, OR if generic practice (no part found) and user is Free tier
    let isLocked = false;

    if (partAccess) {
      // Test exists for this part -> Respect its flags (free/paid/user-owned)
      isLocked = partAccess.isLocked; // getSubjectPartAccess logic handles user/guest checks
    } else {
      // No specific part found -> Treat as generic Premium Practice
      const tier = user ? getUserTier(user) : 'free';
      isLocked = tier === 'free';
    }

    if (isLocked) {
      redirect('/pricing');
    }

    // ✅ Access Granted - Fetch Questions
    const rawQuestions = await getQuestionsBySubject(subject, exam.id);

    // Slice questions for pagination (Chunking)
    const questionsSlice = rawQuestions.slice(offset, offset + limit);

    if (!questionsSlice || questionsSlice.length === 0) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 pt-[80px]">
          <div className="space-y-4 text-center">
            <h1 className="text-2xl font-bold text-slate-900">No Questions Found</h1>
            <p className="text-slate-500">No questions available for this selection.</p>
          </div>
        </div>
      );
    }

    const scoring = getExamScoring(exam, 'PYQ'); // Subject practice is usually GS/PYQ style

    const questions: Question[] = questionsSlice.map((q: typeof questionsSlice[0]) => {
      const parsedOptions = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
      let ext = (q as any).extendedData;
      if (typeof ext === 'string') {
        try {
          ext = JSON.parse(ext);
        } catch {
          ext = undefined;
        }
      }
      return {
        id: q.id,
        question: q.questionText,
        questionEn: q.questionTextEn || undefined,
        correctAnswer: q.correctAnswer,
        options: parsedOptions as string[],
        explanation: q.explanation || undefined,
        explanationEn: q.explanationEn || undefined,
        // 🏷️ INJECT YEAR INTO SUBJECT FIELD FOR DISPLAY
        subject: `PYQ ${q.year}`,
        type: q.type || 'standard',
        matchPairs: (q.matchPairs as any) || undefined,
        extendedData: ext,
        negativeMarks: scoring.negativeMarking,
        marks: scoring.marksPerQuestion,
      };
    });

    const userAttempts = 0; // No attempts tracking for practice mode yet
    const hasPaidPlan = user ? getUserTier(user) !== 'free' : false;

    const seriesTitle = limit < 1000 ? `${subject} Part ${partNum}` : `${subject} Practice`;
    // For free guests, show free mode UI
    const isProUI = hasPaidPlan || (partAccess && partAccess.isFree);

    return (
      <QuizPlayClient
        questions={questions}
        mode="pyq" // Reuse 'pyq' mode for UI styling
        testId={`practice-${subject}-${offset}`}
        title={seriesTitle}
        userId={user?.id || null}
        userName={user?.name || undefined}
        maxRetries={null} // Unlimited
        userAttempts={userAttempts}
        isPro={!!isProUI}
        shouldShowPaywall={false}
      />
    );
  }

  // 2. Standard Test Mode
  if (!testId) {
    redirect('/syllabus/quiz/pyq');
  }

  // Fetch Initial Data in Parallel (Reduces waterfall)
  const [testData, user, attemptLimits] = await Promise.all([
    getTestWithQuestions(testId),
    verifyAuth(),
    getCachedAttemptLimits(),
  ]);

  // Only fetch attempts if user exists to avoid redundant DB call for guests
  const attemptsMap = user
    ? await getUserAttempts([testId], user.id)
    : ({} as Record<string, number>);

  if (!testData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 pt-[80px]">
        <div className="space-y-4 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Test Not Found</h1>
          <p className="text-slate-500">The requested test could not be found.</p>
        </div>
      </div>
    );
  }

  const guestDenied = !user && !testData.isFreeAccess;
  const loggedInDenied = user && !canAccessTest(testData, user);
  
  if (guestDenied || loggedInDenied) {
    redirect('/pricing');
  }

  const userId = user?.id;
  const isTestingUser = user?.role === 'admin';

  const scoring = getExamScoring(exam, testData.type);

  // Map Questions
  const questions: Question[] = testData.questions.map((q: typeof testData.questions[0]) => {
    // Ensure options are parsed if they come as a stringified array
    const parsedOptions = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;

    let ext = q.extendedData;
    if (typeof ext === 'string') {
      try {
        ext = JSON.parse(ext);
      } catch {
        ext = undefined;
      }
    }

    return {
      id: q.id,
      question: q.questionText,
      questionEn:
        testData.type === 'CSAT' &&
        (!q.questionTextEn ||
          q.questionTextEn.trim().toLowerCase() === 'n/a' ||
          q.questionTextEn.trim().toLowerCase() === 'na')
          ? q.questionText
          : q.questionTextEn || undefined,
      correctAnswer: q.correctAnswer,
      options: parsedOptions as string[], // Cast assumes standard string[] options for now
      explanation: q.explanation || undefined,
      explanationEn: q.explanationEn || undefined,
      subject: q.subject || undefined,
      type: (q.type as 'standard' | 'matching') || 'standard',
      matchPairs: (q.matchPairs as any) || undefined,
      extendedData: ext,
      negativeMarks: q.negativeMarks ?? scoring.negativeMarking,
      marks: q.marks ?? scoring.marksPerQuestion,
    };
  });

  const userAttemptsCount = user ? ((attemptsMap as any)[testId] || 0) : 0;
  
  // Override maxRetries for testing user
  let maxRetries = attemptLimits[testData.type] ?? null;
  if (isTestingUser) {
    maxRetries = null; // Unlimited attempts for testing user
  }

  const tier = user ? getUserTier(user) : 'free';
  const hasPaidPlan = tier === 'pro' || tier === 'lite';
  const shouldShowPaywall = false;

  return (
    <QuizPlayClient
      questions={questions}
      mode={(mode as 'topic' | 'full' | 'pyq') || 'topic'}
      testId={testId}
      title={testData.title}
      userId={user?.id || null}
      userName={user?.name || undefined}
      maxRetries={maxRetries}
      userAttempts={userAttemptsCount}
      isPro={hasPaidPlan}
      shouldShowPaywall={shouldShowPaywall}
    />
  );
}

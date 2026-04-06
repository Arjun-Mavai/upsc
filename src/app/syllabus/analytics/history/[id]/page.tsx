import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getAttemptDetails } from '@/features/analytics/actions';
import { QuizResult } from '@/features/tests/components/QuizResult';
import { Question } from '@/types/quiz';
import { SCORING_CONFIG } from '@/lib/quiz-scoring';
import Loading from './loading';

export default async function AttemptReviewPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;

  return (
    <Suspense fallback={<Loading />}>
      <AttemptContent attemptId={params.id} />
    </Suspense>
  );
}

async function AttemptContent({ attemptId }: { attemptId: string }) {
  const attempt = await getAttemptDetails(attemptId);

  if (!attempt) {
    return notFound();
  }

  const { meta, answers } = attempt;

  // 1. Reconstruct Questions Array
  const questions: Question[] = answers.map((ans: any) => {
    // Ensure options are parsed (should be already parsed by getAttemptDetails, but double-check)
    const parsedOptions = typeof ans.options === 'string' ? JSON.parse(ans.options) : ans.options;
    
    return {
      id: ans.questionId || ans.id, // Fallback to id if questionId missing
      question: ans.questionText,
      questionEn: ans.questionTextEn || undefined,
      correctAnswer: ans.correctAnswer,
      options: parsedOptions,
      explanation: ans.explanation || undefined,
      explanationEn: ans.explanationEn || undefined,
      type: ans.type || 'standard',
      matchPairs: ans.matchPairs,
      negativeMarks: ans.negativeMarks || SCORING_CONFIG.NEGATIVE_MARKING,
      marks: ans.marks || SCORING_CONFIG.MARKS_PER_QUESTION,
      subject: ans.subject
    };
  });

  // 2. Reconstruct Answers Record (questionId -> selectedOptionIndex)
  const answersRecord: Record<string, number> = {};
  const questionTimesRecord: Record<string, number> = {};
  
  answers.forEach((ans: any) => {
    // Only set if user answered (not null/undefined)
    if (ans.userAnswer !== null && ans.userAnswer !== undefined) {
       const qId = ans.questionId || ans.id;
       answersRecord[qId] = ans.userAnswer;
       if (ans.timeTaken !== undefined) {
         questionTimesRecord[qId] = ans.timeTaken;
       }
    }
  });

  // 3. Calculate Time Taken
  let timeTaken = 0;
  if (meta.startTime && meta.endTime) {
    timeTaken = Math.round(
      (new Date(meta.endTime).getTime() - new Date(meta.startTime).getTime()) / 1000
    );
  }

  // 4. Determine Mode
  let mode: 'topic' | 'full' | 'pyq' = 'topic';
  if (meta.type === 'PYQ') mode = 'pyq';
  else if (meta.type === 'FLT' || meta.type === 'CSAT') mode = 'full';
  
  // Also check title if type is missing (legacy data)
  if (!meta.type && meta.testTitle) {
      if (meta.testTitle.includes('PYQ') || meta.testTitle.includes('Paper 1')) mode = 'pyq';
      else if (meta.testTitle.includes('Full Length')) mode = 'full';
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <QuizResult
        questions={questions}
        answers={answersRecord}
        mode={mode}
        timeTaken={timeTaken}
        questionTimes={questionTimesRecord}
        title={meta.testTitle ?? undefined}
        testId={meta.testId ?? undefined}
        userId={meta.userId ?? undefined}
        disableRetry={true}
        showFeedbackModal={false}
      />
    </div>
  );
}

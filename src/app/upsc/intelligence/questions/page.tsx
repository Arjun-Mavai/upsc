import { redirect } from 'next/navigation';
import { verifyAuth } from '@/lib/auth';
import { db } from '@/db';
import { questions, tests } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';
import ViewAllQuestionsClient from '@/app/syllabus/quiz/pyq/intelligence/questions/ViewAllQuestionsClient';
import type { PyqQuestionListItem } from '@/app/syllabus/quiz/pyq/intelligence/questions/pyqQuestionListItem';
import { getUnitDistributionStats, getUserAccess } from '@/actions/pyq-analytics';

// Cache for 1 hour
export const revalidate = 3600;

const EXAM_ID = 'upsc';

interface PageProps {
  searchParams: Promise<{
    unit?: string;
    year?: string;
    topic?: string;
    source?: string;
    subject?: string;
    pdf_mode?: string;
  }>;
}

// Cached function to get full question details by IDs
const getQuestionsWithDetails = unstable_cache(
  async (questionIds: string[]) => {
    if (questionIds.length === 0) return [];
    
    const questionData = await db
      .select({
        id: questions.id,
        text: questions.questionText,
        textEn: questions.questionTextEn,
        options: questions.options,
        type: questions.type,
        matchPairs: questions.matchPairs,
        correctAnswer: questions.correctAnswer,
        explanation: questions.explanation,
        explanationEn: questions.explanationEn,
        testId: questions.testId,
        testTitle: tests.title,
        order: questions.order,
        subject: questions.subject,
        extendedData: questions.extendedData,
      })
      .from(questions)
      .innerJoin(tests, eq(questions.testId, tests.id))
      .where(inArray(questions.id, questionIds));

    return questionData.map((q) => {
      const yearMatch = q.testTitle?.match(/\b(20\d{2}|1[5-9]|2[0-5])\b/);
      const yearStr = yearMatch ? yearMatch[1] : '2020';
      const year = yearStr.length === 2 ? 2000 + parseInt(yearStr, 10) : parseInt(yearStr, 10);
      return {
        id: q.id,
        text: q.text,
        textEn: q.textEn,
        options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
        type: q.type || 'standard',
        matchPairs: typeof q.matchPairs === 'string' ? JSON.parse(q.matchPairs) : q.matchPairs,
        correctAnswer: q.correctAnswer !== null ? q.correctAnswer : undefined,
        explanation: q.explanation,
        explanationEn: q.explanationEn,
        year,
        qNo: q.order,
        subject: q.subject,
        extendedData: typeof q.extendedData === 'string' ? JSON.parse(q.extendedData) : q.extendedData,
      };
    });
  },
    [`pyq-questions-details-${EXAM_ID}-v5`],
    { revalidate: 3600, tags: ['pyq-questions'] }
  );

export default async function UPSCViewAllQuestionsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const isPdfMode = params.pdf_mode === 'true';
  const { isPro } = await getUserAccess();
  
  if (!isPdfMode) {
    const user = await verifyAuth();
    if (!user) redirect('/pricing');
  }

  const subject = params.subject;
  const unitId = params.subject || params.unit || 'History'; // Unit or Subject parameter for UPSC
  const year = params.year ? parseInt(params.year) : undefined;
  const topicSlug = params.topic;
  const source = (params.source as 'paper' | 'overall' | 'topic' | 'subject') || 'overall';

  let questionList: PyqQuestionListItem[] = [];
  let unitTitle = unitId; // For UPSC, unitId is the subject name
  let topicTitle: string | undefined;

  if (topicSlug) {
    // Topic-based query (requires similar logic but scoped to UPSC questions)
  } else if (subject && source === 'subject') {
    const { getOverallWeightageSubjectData } = await import('@/actions/pyq-analytics');
    const subjectData = await getOverallWeightageSubjectData(undefined, EXAM_ID, isPro);
    
    if (subject === 'All') {
      const allQuestionIds = subjectData.flatMap(data => data.questions.map(q => q.id));
      questionList = await getQuestionsWithDetails(allQuestionIds);
      unitTitle = `All Subjects Questions (UPSC)`;
    } else {
      const matchingSubject = subjectData.find(data => data.subject === subject);
      if (matchingSubject) {
        questionList = await getQuestionsWithDetails(matchingSubject.questions.map(q => q.id));
        unitTitle = `${subject} Questions (UPSC)`;
      }
    }
  } else {
    // Unit/Subject-based query (for 'paper' or 'overall' source)
    const stats = await getUnitDistributionStats(undefined, EXAM_ID, isPro);
    
    // For UPSC, unitId in stats IS the subject name
    const relevantStats = stats.filter(s => {
      if (s.unitId.toLowerCase() !== unitId.toLowerCase()) return false;
      if (year && s.year !== year) return false;
      return true;
    });
    
    const questionIds = relevantStats.flatMap(s => s.questions.map(q => q.id));
    if (questionIds.length > 0) {
      questionList = await getQuestionsWithDetails(questionIds);
    }
    
    if (relevantStats.length > 0) {
      unitTitle = relevantStats[0].unitTitle;
    } else {
      unitTitle = unitId;
    }
  }

  return (
    <ViewAllQuestionsClient
      examId={EXAM_ID}
      unitId={unitId}
      unitTitle={unitTitle}
      questions={questionList}
      source={source}
      topicTitle={topicTitle}
      year={year}
      subject={subject}
      isPro={isPro}
    />
  );
}

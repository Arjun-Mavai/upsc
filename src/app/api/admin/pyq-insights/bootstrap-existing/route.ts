import { NextResponse } from 'next/server';
import { and, eq, isNotNull } from 'drizzle-orm';
import { db } from '@/db';
import { questions, tests } from '@/db/schema';
import {
  getScopedStateServiceYear,
  PYQ_SCOPE_END_YEAR,
  PYQ_SCOPE_START_YEAR,
} from '@/features/tests/utils/pyq-scope';
import { normalizeSubject } from '@/features/tests/utils/pyq-subject';
import { getAdminUserFromRequest } from '../_lib';

export const dynamic = 'force-dynamic';

type TopicBucket = {
  topic: string;
  count: number;
  sampleQuestionIds: string[];
  sampleExplanations: string[];
};

type SourceQuestion = {
  questionId: string;
  testId: string;
  testTitle: string;
  year: number;
  subject: string;
  questionText: string;
  explanation: string | null;
};

const getYearFromTitle = (title: string, createdAt: Date | null): number => {
  const titleYear = title.match(/\b(19|20)\d{2}\b/)?.[0];
  if (titleYear) return Number(titleYear);
  return createdAt ? new Date(createdAt).getFullYear() : new Date().getFullYear();
};

const cleanExplanation = (text: string | null): string | null => {
  if (!text) return null;
  return text.replace(/\s+/g, ' ').trim().slice(0, 240);
};

const parsePositiveInt = (value: string | null, fallback: number): number => {
  if (!value) return fallback;
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.floor(n);
};

export async function GET(request: Request) {
  const adminUser = await getAdminUserFromRequest();
  if (!adminUser) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

  const url = new URL(request.url);
  const fromYear = parsePositiveInt(url.searchParams.get('fromYear'), 2020);
  const toYear = parsePositiveInt(url.searchParams.get('toYear'), new Date().getFullYear());
  const chunkSize = Math.min(parsePositiveInt(url.searchParams.get('chunkSize'), 120), 300);
  const chunkIndex = parsePositiveInt(url.searchParams.get('chunkIndex'), 1);
  const topicsPerSubject = Math.min(parsePositiveInt(url.searchParams.get('topicsPerSubject'), 20), 40);

  const rows = await db
    .select({
      questionId: questions.id,
      rawSubject: questions.subject,
      questionText: questions.questionText,
      explanation: questions.explanation,
      testTitle: tests.title,
      testId: tests.id,
      testCreatedAt: tests.createdAt,
    })
    .from(questions)
    .innerJoin(tests, eq(questions.testId, tests.id))
    .where(and(eq(tests.type, 'PYQ'), eq(tests.isHidden, false), isNotNull(questions.explanation)));

  const scopedFromYear = Math.max(fromYear, PYQ_SCOPE_START_YEAR);
  const scopedToYear = Math.min(toYear, PYQ_SCOPE_END_YEAR);

  const candidates = rows
    .map((row) => {
      const scopedYear = getScopedStateServiceYear(row.testTitle);
      return { ...row, scopedYear };
    })
    .filter((row) => row.scopedYear !== null && row.scopedYear >= scopedFromYear && row.scopedYear <= scopedToYear);

  const testCounts = new Map<string, number>();
  candidates.forEach((row) => {
    testCounts.set(row.testId, (testCounts.get(row.testId) ?? 0) + 1);
  });

  const bestTestByYear = new Map<number, { testId: string; count: number }>();
  candidates.forEach((row) => {
    const year = row.scopedYear as number;
    const count = testCounts.get(row.testId) ?? 0;
    const existing = bestTestByYear.get(year);
    if (!existing || count > existing.count) {
      bestTestByYear.set(year, { testId: row.testId, count });
    }
  });

  const selectedTestIds = new Set([...bestTestByYear.values()].map((item) => item.testId));

  const yearFilteredRows = candidates.filter((row) => selectedTestIds.has(row.testId));
  const sortedRows = [...yearFilteredRows].sort((a, b) => {
    const ay = getYearFromTitle(a.testTitle, a.testCreatedAt);
    const by = getYearFromTitle(b.testTitle, b.testCreatedAt);
    return by - ay;
  });

  const totalChunks = Math.max(1, Math.ceil(sortedRows.length / chunkSize));
  const safeChunkIndex = Math.min(chunkIndex, totalChunks);
  const start = (safeChunkIndex - 1) * chunkSize;
  const chunkRows = sortedRows.slice(start, start + chunkSize);

  const bySubject = new Map<string, Map<string, TopicBucket>>();
  let withExplanation = 0;

  for (const row of chunkRows) {
    const subject = normalizeSubject(row.rawSubject);
    const topic = row.rawSubject?.trim() || 'General PYQ';
    const explanation = cleanExplanation(row.explanation);
    const year = getYearFromTitle(row.testTitle, row.testCreatedAt);

    const topicMap = bySubject.get(subject) ?? new Map<string, TopicBucket>();
    if (!bySubject.has(subject)) bySubject.set(subject, topicMap);

    const bucket = topicMap.get(topic) ?? {
      topic,
      count: 0,
      sampleQuestionIds: [],
      sampleExplanations: [],
    };

    bucket.count += 1;
    if (bucket.sampleQuestionIds.length < 5) {
      bucket.sampleQuestionIds.push(row.questionId);
    }
    if (explanation && bucket.sampleExplanations.length < 3) {
      bucket.sampleExplanations.push(`[${year}] ${explanation}`);
    }

    topicMap.set(topic, bucket);
    if (explanation) withExplanation += 1;
  }

  const subjectTopicContext = [...bySubject.entries()]
    .map(([subject, topicMap]) => ({
      subject,
      topicCandidates: [...topicMap.values()]
        .sort((a, b) => b.count - a.count)
        .slice(0, topicsPerSubject),
    }))
    .sort(
      (a, b) =>
        b.topicCandidates.reduce((acc, t) => acc + t.count, 0) -
        a.topicCandidates.reduce((acc, t) => acc + t.count, 0)
    );

  const aiInputTemplate = subjectTopicContext.flatMap((subjectBlock) =>
    subjectBlock.topicCandidates.slice(0, 10).map((topicBlock) => ({
      subject: subjectBlock.subject,
      topic: topicBlock.topic,
      topic_en: '',
      description: '',
      questions: topicBlock.sampleQuestionIds.slice(0, 5),
      facts: [
        {
          fact_text: '',
          fact_text_en: '',
          memory_tip: '',
          memory_tip_en: '',
          scam_alert: '',
          scam_alert_en: '',
          importance_score: 0.8,
          frequency_score: 0.7,
          pyq_refs: topicBlock.sampleQuestionIds.slice(0, 3).map((questionId) => ({
            question_id: questionId,
          })),
        },
      ],
      deep_learning: {
        must_know_lists: [
          {
            list_title: '',
            list_title_en: '',
            items: [''],
            items_en: [''],
            memory_hook: '',
            memory_hook_en: '',
          },
        ],
        concept_capsule: '',
        concept_capsule_en: '',
        practice_prompts: [''],
        practice_prompts_en: [''],
      },
    }))
  );

  const sourceQuestions: SourceQuestion[] = chunkRows.map((row) => ({
    questionId: row.questionId,
    testId: row.testId,
    testTitle: row.testTitle,
    year: getYearFromTitle(row.testTitle, row.testCreatedAt),
    subject: normalizeSubject(row.rawSubject),
    questionText: row.questionText,
    explanation: cleanExplanation(row.explanation),
  }));

  const suggestedPrompt = `You are an elite UPSC PYQ pattern analyst.
Analyze ONLY the provided chunk: years ${scopedFromYear}-${scopedToYear}, chunk ${safeChunkIndex}/${totalChunks}.

Output STRICT JSON ARRAY ONLY (no markdown, no prose) with this shape:
[
  {
    "subject": "History | Geography | Polity | Economy | Science | Environment | Current Affairs | Ethics | Misc",
    "topic": "Specific micro-topic name",
    "topic_en": "English topic title",
    "description": "2-3 line focused summary for students",
    "questions": ["question_id_1", "question_id_2"],
    "facts": [
      {
        "fact_text": "exam-specific fact or compact list text",
        "fact_text_en": "accurate English version of fact_text",
        "memory_tip": "mnemonic / chunking trick",
        "memory_tip_en": "accurate English version of memory_tip",
        "scam_alert": "common trap/wrong confusion",
        "scam_alert_en": "accurate English version of scam_alert",
        "importance_score": 0.0,
        "frequency_score": 0.0,
        "tags": ["articles","list","high-yield"],
        "pyq_refs": [{ "question_id": "..." }]
      }
    ],
    "deep_learning": {
      "must_know_lists": [
        {
          "list_title": "e.g., Important Articles",
          "list_title_en": "English heading",
          "items": ["Art 14 - Equality", "Art 19 - Freedom"],
          "items_en": ["Article 14 - Equality", "Article 19 - Freedom"],
          "memory_hook": "mnemonic for quick recall",
          "memory_hook_en": "English mnemonic"
        }
      ],
      "concept_capsule": "fast concept revision paragraph",
      "concept_capsule_en": "English concept revision paragraph",
      "practice_prompts": ["Try 5 similar PYQs on this micro-topic"],
      "practice_prompts_en": ["Try 5 similar PYQs on this micro-topic"]
    }
  }
]

Rules:
- Group by REAL PYQ patterns only.
- Use ONLY scoped exams: "UPSC Civil Services Prelims YYYY (Paper 1 - General Studies)" for 2020-2025.
- Always attempt Current Affairs classification where questions are about awards, schemes, reports, indices, sports, summits, defence, appointments, national/international events.
- Prefer compact learning chunks students can revise in 2-3 minutes.
- Use the question IDs exactly as provided.
- Keep facts accurate, exam-focused, and high-yield.`;

  return NextResponse.json({
    success: true,
    generatedAt: new Date().toISOString(),
    chunk: {
      fromYear: scopedFromYear,
      toYear: scopedToYear,
      chunkSize,
      chunkIndex: safeChunkIndex,
      totalChunks,
      totalQuestionsInRange: sortedRows.length,
      questionsInChunk: chunkRows.length,
      topicsPerSubject,
    },
    summary: {
      totalPyqQuestionsScanned: chunkRows.length,
      questionsWithExplanation: withExplanation,
      subjectsFound: subjectTopicContext.length,
    },
    sourceQuestions,
    subjectTopicContext,
    aiInputTemplate,
    suggestedPrompt,
  });
}

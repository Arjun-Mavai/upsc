'use server';

import { eq, inArray, and } from 'drizzle-orm';
import { db } from '@/db';
import { questions, pyqQuestionTopics, pyqTopics, tests } from '@/db/schema';
import { unstable_cache } from 'next/cache';
import { syllabusData } from '@/data/syllabusData';
import { normalizeSubject } from '@/features/tests/utils/pyq-subject';
import { getCanonicalTestIds, getYearFromTestId } from '@/lib/pyq-constants';
import { getCurrentExam } from '@/config/exams';
import { getCurrentUser } from './auth-actions';
import { logger } from '@/lib/logger';

// ============================================
// Types
// ============================================

export interface RepeatedQuestion {
  questionId: string;
  text: string;
  textEn?: string | null;
  occurrences: { year: number; qNo: number }[];
  count: number;
  topics: { id: string; name: string; nameEn?: string | null }[];
  unit?: { id: string; title: string };
}

export interface OverallWeightageSubjectData {
  subject: string;
  questions: {
    id: string;
    text: string;
    textEn?: string | null;
    year: number;
    qNo: number;
    testTitle: string;
    testId: string;
    subject?: string;
    options?: any;
    correctAnswer?: string;
    extendedData?: any;
  }[];
}

export interface UnitDistributionStats {
  year: number;
  unitId: string;
  unitTitle: string;
  count: number;
  questions: { 
    id: string; 
    text: string; 
    textEn?: string | null; 
    year: number; 
    qNo: number; 
    subject?: string;
    options?: any;
    correctAnswer?: string;
    extendedData?: any;
  }[];
}

export interface TopicStat {
  unitId: string;
  topicId: string;
  topicSlug: string;
  topicTitle: string;
  topicTitleEn?: string | null;
  count: number;
  years: number[];
  questions: { id: string; text: string; textEn?: string | null; year: number; qNo: number; subject?: string }[];
}

// ── LOCKING CONSTANTS ──────────────────────────────────────────
const FREE_YEAR = 2025;
const FREE_SUBJECT = 'History';
const FREE_QUESTION_LIMIT = 5;

// Helper to check access
export async function getUserAccess() {
  const me = await getCurrentUser();
  const isPro = !!(me?.user?.isSubscribed || me?.user?.planTier === 'pro' || me?.user?.role === 'admin');
  return {
    isPro,
    isAdmin: me?.user?.role === 'admin'
  };
}

// ============================================
// Stop Words for text processing
// ============================================

const STOP_WORDS = new Set([
  'the', 'is', 'at', 'of', 'on', 'and', 'a', 'an', 'in', 'to', 'for', 'with', 'by', 'from', 'which', 'correct', 'incorrect', 'following', 'statements', 'regarding', 'consider', 'match', 'option', 'question', 'answer', 'not', 'none', 'all', 'above', 'below', 'true', 'false', 'ka', 'ki', 'ke', 'hai', 'tha', 'thi', 'the', 'ko', 'se', 'me', 'mein', 'par', 'aur', 'evam', 'tatha', 'kya', 'kaun', 'kis', 'nimn', 'likhit', 'nimnalikhit', 'kathan', 'sahi', 'galat', 'h', 'nahi', 'है', 'हैं', 'था', 'थी', 'थे', 'का', 'की', 'के', 'को', 'से', 'में', 'पर', 'और', 'एवं', 'तथा', 'क्या', 'कौन', 'किस', 'निम्नलिखित', 'कथनों', 'कथन', 'विचार', 'कीजिए', 'सही', 'गलत', 'उत्तर', 'दी दीजिए', 'विकल्प', 'सुमेलित', 'कौनसा', 'नहीं', 'एक', 'यह', 'वह', 'वे', 'करते', 'होता', 'होती', 'होते', 'दिया', 'गया',
]);

// ============================================
// Analytical Functions
// ============================================

export async function getOverallWeightageSubjectData(limit?: number, examId?: string, isPro: boolean = false): Promise<OverallWeightageSubjectData[]> {
  const cacheKey = `overall-weightage-subject-data-${examId || 'mppsc'}-${limit || 'all'}-pro-${isPro}`;

  return unstable_cache(
    async () => {
      let testIdsToQuery: string[] = [];
      const testYearMap: Record<string, number> = {};

      if (examId === 'upsc') {
        const upscTests = await db.select({ id: tests.id, title: tests.title }).from(tests).where(and(eq(tests.type, 'UPSC_PYQ'), eq(tests.isHidden, false)));
        testIdsToQuery = upscTests.map(t => t.id);
        upscTests.forEach(t => {
          const match = t.title.match(/\b(20\d{2}|1[5-9]|2[0-5])\b/);
          const yearStr = match ? match[1] : '2020';
          testYearMap[t.id] = yearStr.length === 2 ? 2000 + parseInt(yearStr, 10) : parseInt(yearStr, 10);
        });
      } else {
        testIdsToQuery = getCanonicalTestIds(examId);
      }

      if (testIdsToQuery.length === 0) return [];

      const allQuestions = await db
        .select({
          id: questions.id,
          text: questions.questionText,
          textEn: questions.questionTextEn,
          subject: questions.subject,
          testId: questions.testId,
          order: questions.order,
          options: questions.options,
          correctAnswer: questions.correctAnswer,
          extendedData: questions.extendedData,
        })
        .from(questions)
        .where(inArray(questions.testId, testIdsToQuery));

      const subjectGroups: Record<string, any[]> = {};
      const exam = getCurrentExam(examId);
      
      for (const q of allQuestions) {
        const rawSubject = q.subject || 'General Studies';
        const groupKey = normalizeSubject(rawSubject);
        if (!subjectGroups[groupKey]) subjectGroups[groupKey] = [];
        subjectGroups[groupKey].push(q);
      }

      return Object.entries(subjectGroups).map(([subject, questions]) => {
        let resultQuestions = questions
          .map(q => {
            const year = examId === 'upsc' ? testYearMap[q.testId] : getYearFromTestId(q.testId, examId);
            return {
              id: q.id,
              text: q.text || '',
              textEn: q.textEn,
              year,
              qNo: q.order,
              testTitle: `${exam.id.toUpperCase()} Prelims ${year}`,
              testId: q.testId,
              options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
              correctAnswer: q.correctAnswer,
              extendedData: typeof q.extendedData === 'string' ? JSON.parse(q.extendedData) : q.extendedData,
              subject: q.subject || undefined,
            };
          })
          .sort((a, b) => b.year - a.year || a.qNo - b.qNo);

        // 🔒 LOCKING LOGIC
        if (!isPro) {
          const isFreeSubject = subject === FREE_SUBJECT;
          resultQuestions = isFreeSubject ? resultQuestions.slice(0, FREE_QUESTION_LIMIT) : [];
        } else if (limit) {
          resultQuestions = resultQuestions.slice(0, limit);
        }

        return { subject, questions: resultQuestions };
      }).sort((a, b) => b.questions.length - a.questions.length || a.subject.localeCompare(b.subject));
    },
    [cacheKey, 'v4'],
    { revalidate: 3600, tags: ['pyq-stats'] }
  )();
}

export async function getUnitDistributionStats(limit?: number, examId?: string, isPro: boolean = false): Promise<UnitDistributionStats[]> {
  const cacheKey = `unit-distribution-stats-${examId || 'mppsc'}-${limit || 'all'}-pro-${isPro}`;

  return unstable_cache(
    async () => {
      try {
        let testIdsToQuery: string[] = [];
        const testYearMap: Record<string, number> = {};

        if (examId === 'upsc') {
          const upscTests = await db.select({ id: tests.id, title: tests.title }).from(tests).where(and(eq(tests.type, 'UPSC_PYQ'), eq(tests.isHidden, false)));
          testIdsToQuery = upscTests.map(t => t.id);
          upscTests.forEach(t => {
            const match = t.title.match(/\b(20\d{2}|1[5-9]|2[0-5])\b/);
            const yearStr = match ? match[1] : '2020';
            testYearMap[t.id] = yearStr.length === 2 ? 2000 + parseInt(yearStr, 10) : parseInt(yearStr, 10);
          });
        } else {
          testIdsToQuery = getCanonicalTestIds(examId);
        }

        if (testIdsToQuery.length === 0) return [];

        const allQuestions = await db
          .select({
            id: questions.id,
            testId: questions.testId,
            text: questions.questionText,
            textEn: questions.questionTextEn,
            subject: questions.subject,
            order: questions.order,
            options: questions.options,
            correctAnswer: questions.correctAnswer,
            extendedData: questions.extendedData,
          })
          .from(questions)
          .where(inArray(questions.testId, testIdsToQuery));

        const stats: Record<string, UnitDistributionStats> = {};
        
        for (const q of allQuestions) {
          const year = examId === 'upsc' ? testYearMap[q.testId] : getYearFromTestId(q.testId, examId);
          const unitId = normalizeSubject(q.subject || 'General Studies');
          const unitTitle = unitId;
          const key = `${year}-${unitId}`;

          // 🔒 LOCKING LOGIC
          const isYearFree = year === FREE_YEAR;
          const isSubjectFree = unitId === FREE_SUBJECT;
          const hasAccess = isPro || (isYearFree && isSubjectFree);

          if (!stats[key]) {
            stats[key] = { year, unitId, unitTitle, count: 0, questions: [] };
          }
          stats[key].count++;
          
          const currentLimit = isPro ? (limit || 9999) : (hasAccess ? FREE_QUESTION_LIMIT : 0);
          if (stats[key].questions.length < currentLimit) {
            stats[key].questions.push({
              id: q.id,
              text: q.text || '',
              textEn: q.textEn,
              year,
              qNo: q.order,
              subject: q.subject || undefined,
              options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
              correctAnswer: q.correctAnswer,
              extendedData: typeof q.extendedData === 'string' ? JSON.parse(q.extendedData) : q.extendedData,
            });
          }
        }

        return Object.values(stats).sort((a, b) => b.year - a.year || b.count - a.count);
      } catch (error) {
        console.error('Error in Unit Distribution Analysis:', error);
        return [];
      }
    },
    [cacheKey, 'v4'],
    { revalidate: 3600, tags: ['pyq-stats'] }
  )();
}

export interface SubjectDistributionStats {
  year: number;
  subjectId: string;
  subjectTitle: string;
  count: number;
  questions: Array<{ id: string; text: string; textEn?: string | null; order: number; }>;
}

export async function getSubjectDistributionStats(examId?: string): Promise<SubjectDistributionStats[]> {
  try {
    const unifiedStats = await getUnifiedSubjectStats(examId);
    const subjectDistributionStats: SubjectDistributionStats[] = [];
    for (const stats of unifiedStats) {
      for (const [year, count] of Object.entries(stats.yearBreakdown)) {
        subjectDistributionStats.push({
          year: Number(year),
          subjectId: stats.subject.toLowerCase().replace(/\s+/g, '-'),
          subjectTitle: stats.subject,
          count: count,
          questions: stats.questionsByYear[Number(year)] || [],
        });
      }
    }
    return subjectDistributionStats.sort((a, b) => a.year !== b.year ? a.year - b.year : a.subjectTitle.localeCompare(b.subjectTitle));
  } catch (error) {
    console.error('Error in Subject Distribution Analysis:', error);
    return [];
  }
}

export interface UnifiedSubjectStats {
  subject: string;
  totalQuestions: number;
  yearBreakdown: Record<number, number>;
  questionsByYear: Record<number, Array<{ id: string; text: string; textEn?: string | null; order: number; }>>;
}

export async function getUnifiedSubjectStats(examId?: string): Promise<UnifiedSubjectStats[]> {
  try {
    const testIds = getCanonicalTestIds(examId);
    if (testIds.length === 0) return [];

    const questionTopics = await db
      .select({
        questionId: pyqQuestionTopics.questionId,
        testId: questions.testId,
        topicTitle: pyqTopics.topicTitle,
        questionText: questions.questionText,
        questionTextEn: questions.questionTextEn,
        questionOrder: questions.order,
      })
      .from(pyqQuestionTopics)
      .leftJoin(questions, eq(pyqQuestionTopics.questionId, questions.id))
      .leftJoin(pyqTopics, eq(pyqQuestionTopics.topicId, pyqTopics.id))
      .where(inArray(questions.testId, testIds));

    const subjectGroups: Record<string, UnifiedSubjectStats> = {};
    for (const mapping of questionTopics) {
      if (!mapping.testId || !mapping.topicTitle) continue;
      const year = getYearFromTestId(mapping.testId, examId);
      if (!year) continue;
      const normalizedSubject = normalizeSubject(mapping.topicTitle);
      if (!subjectGroups[normalizedSubject]) {
        subjectGroups[normalizedSubject] = { subject: normalizedSubject, totalQuestions: 0, yearBreakdown: {}, questionsByYear: {} };
      }
      const stats = subjectGroups[normalizedSubject];
      stats.totalQuestions += 1;
      stats.yearBreakdown[year] = (stats.yearBreakdown[year] || 0) + 1;
      if (!stats.questionsByYear[year]) stats.questionsByYear[year] = [];
      stats.questionsByYear[year].push({ id: mapping.questionId, text: mapping.questionText || '', textEn: mapping.questionTextEn, order: mapping.questionOrder || 0 });
    }
    for (const stats of Object.values(subjectGroups)) {
      for (const year of Object.keys(stats.questionsByYear)) {
        stats.questionsByYear[Number(year)].sort((a, b) => a.order - b.order);
      }
    }
    return Object.values(subjectGroups).sort((a, b) => b.totalQuestions - a.totalQuestions);
  } catch (error) {
    console.error('Error in Unified Subject Stats:', error);
    return [];
  }
}

export async function getMostRepeatedTopics(examId?: string): Promise<Record<string, TopicStat[]>> {
  const cacheKey = `most-repeated-topics-${examId || 'mppsc'}`;

  return unstable_cache(
    async () => {
      try {
        const testIds = getCanonicalTestIds(examId);
        if (testIds.length === 0) return {};

        const topicData = await db
          .select({
            testId: questions.testId,
            questionId: questions.id,
            questionText: questions.questionText,
            questionTextEn: questions.questionTextEn,
            questionOrder: questions.order,
            questionSubject: questions.subject,
            topicId: pyqTopics.id,
            topicSlug: pyqTopics.topicSlug,
            topicTitle: pyqTopics.topicTitle,
            topicTitleEn: pyqTopics.topicTitleEn,
          })
          .from(questions)
          .innerJoin(pyqQuestionTopics, eq(questions.id, pyqQuestionTopics.questionId))
          .innerJoin(pyqTopics, eq(pyqQuestionTopics.topicId, pyqTopics.id))
          .where(inArray(questions.testId, testIds));

        const unitTopics: Record<string, Map<string, TopicStat>> = {};
        for (const row of topicData) {
          const year = getYearFromTestId(row.testId, examId);
          const unitId = normalizeSubject(row.questionSubject || 'General Studies');
          if (!unitTopics[unitId]) unitTopics[unitId] = new Map();
          if (!unitTopics[unitId].has(row.topicId)) {
            unitTopics[unitId].set(row.topicId, { unitId, topicId: row.topicId, topicSlug: row.topicSlug, topicTitle: row.topicTitle, topicTitleEn: row.topicTitleEn, count: 0, years: [], questions: [] });
          }
          const stat = unitTopics[unitId].get(row.topicId)!;
          stat.count++;
          if (!stat.years.includes(year)) stat.years.push(year);
          if (!stat.questions.some((q) => q.id === row.questionId)) {
            stat.questions.push({ id: row.questionId, text: row.questionText || '', textEn: row.questionTextEn, year, qNo: row.questionOrder, subject: row.questionSubject || undefined });
          }
        }
        const result: Record<string, TopicStat[]> = {};
        for (const [unitId, map] of Object.entries(unitTopics)) {
          result[unitId] = Array.from(map.values()).sort((a, b) => b.count - a.count).slice(0, 10);
        }
        return result;
      } catch (error) {
        console.error('Error in Most Repeated Topics Analysis:', error);
        return {};
      }
    },
    [cacheKey, 'v2'],
    { revalidate: 3600, tags: ['pyq-stats'] }
  )();
}

export async function getQuestionsBySubjectUnified(subject: string, examId?: string) {
  try {
    const unifiedStats = await getUnifiedSubjectStats(examId);
    const subjectData = unifiedStats.find(s => s.subject === subject);
    if (!subjectData) return [];
    const allQuestions: any[] = [];
    for (const [year, questionsList] of Object.entries(subjectData.questionsByYear)) {
      questionsList.forEach(q => {
        allQuestions.push({ id: q.id, questionText: q.text, questionTextEn: q.textEn, order: q.order, year: Number(year) });
      });
    }
    if (allQuestions.length === 0) return [];
    const fullQuestions = await db.select().from(questions).where(inArray(questions.id, allQuestions.map(q => q.id)));
    const yearMap = new Map(allQuestions.map(q => [q.id, q.year]));
    return fullQuestions.sort((a, b) => {
      const yearA = yearMap.get(a.id) || 0;
      const yearB = yearMap.get(b.id) || 0;
      if (yearA !== yearB) return yearB - yearA;
      return (a.order || 0) - (b.order || 0);
    });
  } catch (error) {
    console.error('Error in getQuestionsBySubjectUnified:', error);
    return [];
  }
}

export async function getRepeatedQuestions(examId?: string): Promise<RepeatedQuestion[]> {
  const cacheKey = `repeated-questions-${examId || 'mppsc'}`;
  return unstable_cache(
    async () => {
      const testIds = getCanonicalTestIds(examId);
      if (testIds.length === 0) return [];

      const rawQuestions = await db
        .select({
          id: questions.id,
          text: questions.questionText,
          textEn: questions.questionTextEn,
          subject: questions.subject,
          testId: questions.testId,
          order: questions.order,
        })
        .from(questions)
        .where(inArray(questions.testId, testIds));

      const processedQuestions = rawQuestions.map((q) => ({
        ...q,
        normalizedText: (q.text || '').toLowerCase().replace(/[^\w\s]/g, '').split(' ').filter((w) => w.length > 2 && !STOP_WORDS.has(w)).join(' '),
      })).filter((q) => q.normalizedText.length > 20);

      const groups: Record<string, typeof processedQuestions> = {};
      processedQuestions.forEach((q) => {
        const key = q.normalizedText;
        if (!groups[key]) groups[key] = [];
        groups[key].push(q);
      });

      const repeated = Object.values(groups).filter((g) => g.length > 1).map((g) => {
        const first = g[0];
        const occurrences = g.map((q) => ({
          year: getYearFromTestId(q.testId, examId),
          qNo: q.order || 0,
        })).sort((a, b) => b.year - a.year);

        return {
          questionId: first.id,
          text: first.text || '',
          textEn: first.textEn,
          occurrences,
          count: g.length,
          topics: [],
        };
      }).sort((a, b) => b.count - a.count);

      return repeated;
    },
    [cacheKey, 'v2'],
    { revalidate: 3600, tags: ['pyq-stats'] }
  )();
}

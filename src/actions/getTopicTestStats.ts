'use server';

import { db } from '@/db';
import { tests, syllabusTopics } from '@/db/schema';
import { eq, sql, and } from 'drizzle-orm';
import { logger } from '@/lib/logger';

export interface TopicStat {
  topicId: string; // the string ID from syllabus_topics
  unitId: string;
  topicTitle: string;
  testId: string | null;
  questionCount: number;
  lastUpdated: Date | null;
}

import { cachedData, CACHE } from '@/lib/cache';

export const getTopicTestStats = cachedData(
  async () => {
    try {
      // 1. Fetch all Syllabus Topics (Source of Truth)
      const allTopics = await db
        .select()
        .from(syllabusTopics)
        .where(eq(syllabusTopics.examType, 'upsc'));

      // 2. Fetch all Topic Tests
      const allTests = await db
        .select({
          id: tests.id,
          topicId: tests.topicId,
          unitId: tests.unitId,
          totalQuestions: tests.totalQuestions,
          updatedAt: tests.updatedAt,
        })
        .from(tests)
        .where(and(eq(tests.type, 'TOPIC'), eq(tests.examType, 'upsc')));

      // 3. Merge Data
      const stats: Record<string, TopicStat[]> = {};

      // Sort topics by DB order first
      allTopics.sort((a, b) => a.order - b.order);

      for (const topic of allTopics) {
        const linkedTest = allTests.find(
          (t) => t.topicId === topic.id && t.unitId === topic.unitId
        );

        const stat: TopicStat = {
          topicId: topic.id,
          unitId: topic.unitId,
          topicTitle: topic.title,
          testId: linkedTest?.id || null,
          questionCount: linkedTest?.totalQuestions || 0,
          lastUpdated: linkedTest?.updatedAt || null,
        };

        if (!stats[topic.unitId]) {
          stats[topic.unitId] = [];
        }
        stats[topic.unitId].push(stat);
      }

      return { success: true, data: stats };
    } catch (error) {
      logger.error('Error fetching topic stats:', error);
      return { success: false, error: 'Failed to load stats' };
    }
  },
  ['topic-test-stats'],
  [CACHE.SYLLABUS.TAGS.ALL, CACHE.TESTS.TAGS.ALL] // Invalidate if either changes
);

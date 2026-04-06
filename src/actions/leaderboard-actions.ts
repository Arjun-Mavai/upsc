'use server';

import { db } from '@/db';
import { testLeaderboard } from '@/db/schema';
import { eq, desc, asc, sql, and } from 'drizzle-orm';
import { FAKE_USERS, FIRST_NAMES, LAST_NAMES } from '@/data/fakeUsers';
import { questions, tests } from '@/db/schema';
import { SCORING_CONFIG, getExamScoring } from '@/lib/quiz-scoring';
import { getExamContext } from '@/lib/exam-context';

type LeaderboardEntry = typeof testLeaderboard.$inferSelect;

/**
 * 🎲 Seeded Random Number Generator (Mulberry32)
 * Same seed = same sequence, different seed = different sequence
 * Bhai, isse har test me alag users aayenge but same test me consistent rahenge!
 */
function seededRandom(seed: number): () => number {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/**
 * Generate hash from string (testId) for seeding
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Fisher-Yates shuffle with seeded random
 */
function shuffleArray<T>(array: T[], random: () => number): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Bhai, ye function ekdum raapchik hai via optimization!
// Top 10 uthayega aur user ka rank count karega bina DB ko load diye via N+1 logic.
export async function getTestLeaderboard(testId: string, userId?: string) {
  // 1. Pehle check karlo ki koi entries hain bhi ya nahi (Full scan bachane ke liye)
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(testLeaderboard)
    .where(eq(testLeaderboard.testId, testId));

  const totalParticipants = countResult[0]?.count || 0;

  // 2. Agar koi nahi hai (ya kam log hain), toh nakli public (Fake Users) bhar do - Maahol banane ke liye!
  // Bhai, kam se kam 10 log hone chahiye competition feel karane ke liye.
  if (totalParticipants < 10) {
    await generateFakeLeaderboard(testId);
    return getTestLeaderboard(testId, userId); // Vaapas bulao function ko
  }

  // 3. Sirf Top 10 Khiladis ko uthao - Efficiency ka Mamla hai bhai!
  const topTenEntries = await db
    .select()
    .from(testLeaderboard)
    .where(eq(testLeaderboard.testId, testId))
    .orderBy(desc(testLeaderboard.score), asc(testLeaderboard.timeTakenSeconds))
    .limit(10);

  // Unko rank assign karo (1 se 10 taak)
  const rankedTopTen = topTenEntries.map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));

  // 4. Ab User ka hisaab lagate hain (Agar user ID diya hai toh)
  let userRank = null;
  let userEntry: LeaderboardEntry | null = null;

  if (userId) {
    // Pehle dekho user Top 10 mein hai kya?
    const userIndexInTop10 = rankedTopTen.findIndex((e) => e.userId === userId);

    if (userIndexInTop10 !== -1) {
      // Agar Top 10 mein hai, toh wahi se data utha lo - DB Query bacha li bhai!
      userRank = userIndexInTop10 + 1;
      userEntry = rankedTopTen[userIndexInTop10];
    } else {
      // Top 10 mein nahi hai, toh alag se dhoondo
      const specificUserEntry = await db.query.testLeaderboard.findFirst({
        where: (leaderboard, { and, eq }) =>
          and(eq(leaderboard.testId, testId), eq(leaderboard.userId, userId)),
      });

      if (specificUserEntry) {
        userEntry = specificUserEntry;

        // Ab Count Query maar kar Rank nikaalo - Sabse Optimized tareeka!
        // Rank = (Users with more score) + (Users with same score but less time) + 1
        const rankQuery = await db
          .select({ count: sql<number>`count(*)` })
          .from(testLeaderboard)
          .where(
            and(
              eq(testLeaderboard.testId, testId),
              sql`(${testLeaderboard.score} > ${specificUserEntry.score} OR (${testLeaderboard.score} = ${specificUserEntry.score} AND ${testLeaderboard.timeTakenSeconds} < ${specificUserEntry.timeTakenSeconds}))`
            )
          );

        userRank = (rankQuery[0]?.count || 0) + 1;

        // Bhai, userEntry mein rank manually daal do ab
        userEntry = { ...userEntry, rank: userRank };
      }
    }
  }

  return {
    leaderboard: rankedTopTen, // Sirf cream layer (Top 10)
    fullLeaderboard: [], // Iski zarurat nahi hai ab, load mat lo
    userRank,
    userEntry,
    totalParticipants,
  };
}

/**
 * 🎯 Randomized Fake Leaderboard Generator
 * 
 * Bhai, ye naya algorithm hai jo har test me different users dikhata hai:
 * 1. testId se seed banta hai → same test = same users (consistency)
 * 2. Different test = completely different set of users
 * 3. Scores bhi randomized with variance
 * 4. Names dynamically generated (not just cycling through same 52)
 */
async function generateFakeLeaderboard(testId: string) {
  // Generate deterministic seed from testId
  const seed = hashString(testId);
  const random = seededRandom(seed);

  // Get accurate total marks based on question count
  const test = await db.query.tests.findFirst({ where: eq(tests.id, testId) });
  const exam = await getExamContext();
  const scoring = getExamScoring(exam, test?.type);

  const qCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(questions)
    .where(eq(questions.testId, testId));

  const totalQuestions = qCount[0]?.count || 0;
  const totalMarks = totalQuestions > 0 ? totalQuestions * scoring.marksPerQuestion : 60;

  // 🎲 Randomize count with more variation (25-70, never more than 70)
  // Bhai ne bola: kisi test me 30, 40, 50 aise random aaye
  const countOptions = [25, 28, 32, 35, 38, 42, 45, 48, 52, 55, 58, 62, 65, 68, 70];
  const targetCount = countOptions[Math.floor(random() * countOptions.length)];

  // 🔀 Shuffle and select users from pool
  const shuffledUsers = shuffleArray(FAKE_USERS, random);
  
  // Generate fake entries
  const fakeEntries = [];
  const usedNames = new Set<string>();

  for (let i = 0; i < targetCount; i++) {
    // 🎭 Generate unique name for this entry
    let displayName: string;
    
    if (i < shuffledUsers.length) {
      // Use shuffled preset users first
      displayName = shuffledUsers[i].name;
    } else {
      // Generate dynamic names for additional users
      // Pick random first name + last name combination
      const firstName = FIRST_NAMES[Math.floor(random() * FIRST_NAMES.length)];
      const lastName = LAST_NAMES[Math.floor(random() * LAST_NAMES.length)];
      displayName = `${firstName} ${lastName}`;
      
      // Ensure uniqueness
      let attempts = 0;
      while (usedNames.has(displayName) && attempts < 10) {
        const newFirst = FIRST_NAMES[Math.floor(random() * FIRST_NAMES.length)];
        const newLast = LAST_NAMES[Math.floor(random() * LAST_NAMES.length)];
        displayName = `${newFirst} ${newLast}`;
        attempts++;
      }
    }
    
    usedNames.add(displayName);

    // 🎲 Randomized score distribution with variance
    // Not fixed percentages - adds realism!
    let percentage: number;
    const roll = random(); // 0-1 random number
    
    // Bell curve-ish distribution with test-specific variance
    const variance = (random() - 0.5) * 10; // -5 to +5 variance
    
    if (roll < 0.08) {
      // ~8% Toppers (78-96%)
      percentage = 78 + random() * 18 + variance;
    } else if (roll < 0.15) {
      // ~7% Very Good (70-82%)
      percentage = 70 + random() * 12 + variance;
    } else if (roll < 0.35) {
      // ~20% Good (55-72%)
      percentage = 55 + random() * 17 + variance;
    } else if (roll < 0.65) {
      // ~30% Average (40-58%)
      percentage = 40 + random() * 18 + variance;
    } else if (roll < 0.85) {
      // ~20% Below Average (25-42%)
      percentage = 25 + random() * 17 + variance;
    } else {
      // ~15% Low (12-28%)
      percentage = 12 + random() * 16 + variance;
    }
    
    // Clamp percentage to valid range
    percentage = Math.max(8, Math.min(98, percentage));

    // Calculate raw score based on percentage
    let rawScore = (percentage / 100) * totalMarks;
    rawScore = Math.round(rawScore);

    // Cap at totalMarks (Safety check)
    if (rawScore > totalMarks) rawScore = totalMarks;

    // Ensure accurate percentage based on rounds
    const finalPercentage = (rawScore / totalMarks) * 100;

    // Dynamic Time Calculation with seeded random
    // Better time distribution based on score (toppers usually faster)
    const estTimeSeconds = totalQuestions * 60; // 1 min per question avg
    const minSeconds = Math.floor(estTimeSeconds * 0.35);
    const maxSeconds = Math.floor(estTimeSeconds * 0.95);
    
    // Higher scorers tend to be faster (but not always - adds realism)
    const speedFactor = percentage > 70 ? 0.6 : percentage > 50 ? 0.75 : 0.9;
    const timeRange = maxSeconds - minSeconds;
    const baseTime = minSeconds + (random() * timeRange * speedFactor);
    const timeTaken = Math.floor(baseTime + (random() * timeRange * 0.2)); // Add some variance

    fakeEntries.push({
      id: `fake_${testId}_${i}_${seed}`, // Use seed instead of Date.now() for consistency
      testId,
      userId: null,
      displayName,
      score: rawScore,
      percentage: finalPercentage,
      timeTakenSeconds: Math.min(timeTaken, maxSeconds), // Cap at max
      rank: 0,
      isFake: 1,
      createdAt: new Date(),
    });
  }

  // Bulk insert with ON CONFLICT IGNORE to handle race conditions
  // (Multiple users viewing same new test simultaneously)
  if (fakeEntries.length > 0) {
    await db.insert(testLeaderboard).values(fakeEntries).onConflictDoNothing();
  }
}

export async function insertUserToLeaderboard(data: {
  testId: string;
  userId: string;
  displayName: string;
  score: number;
  timeTaken: number;
  totalMarks?: number;
}) {
  const { testId, userId, displayName, score, timeTaken, totalMarks = 20 } = data;

  const percentage = (score / totalMarks) * 100;

  // Check if user already exists in leaderboard for this test
  const existingEntry = await db.query.testLeaderboard.findFirst({
    where: (leaderboard, { and, eq }) =>
      and(eq(leaderboard.testId, testId), eq(leaderboard.userId, userId)),
  });

  if (existingEntry) {
    // Update existing entry if score is higher
    if (score > existingEntry.score) {
      await db
        .update(testLeaderboard)
        .set({
          score,
          percentage,
          timeTakenSeconds: timeTaken,
          createdAt: new Date(), // Update timestamp to show recent activity
        })
        .where(eq(testLeaderboard.id, existingEntry.id));
    }
    // If score is same but time is better? Optional.
  } else {
    // Insert new entry
    await db.insert(testLeaderboard).values({
      id: crypto.randomUUID(),
      testId,
      userId,
      displayName,
      score,
      percentage,
      timeTakenSeconds: timeTaken,
      rank: 0, // Calculated on read
      isFake: 0,
      createdAt: new Date(),
    });
  }
}

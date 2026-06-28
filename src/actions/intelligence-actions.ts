'use server';

import { db } from '@/db';
import { intelligenceFeedback } from '@/db/schema';
import { logger } from '@/lib/logger';
import { sendTelegramNotification, sendTelegramEventNotification, escapeHTML } from '@/lib/telegram';
import { randomUUID } from 'crypto';

import { assertAdmin } from '@/lib/auth';

export type IntelligenceReaction = 'helpful' | 'insightful' | 'unhelpful' | 'doubt';

export interface IntelligenceFeedbackData {
  guestMobile?: string;
  questionId: string;
  questionText: string;
  testId?: string;
  reaction: IntelligenceReaction;
  message?: string;
  isPro?: boolean;
  source?: string; // 'expert_analysis', 'open_paper_view', etc.
  userId?: string;
  userName?: string;
  userEmail?: string;
  unitInfo?: string;
  userGrants?: string;
}

export async function submitIntelligenceFeedback(data: IntelligenceFeedbackData) {
  const { 
    guestMobile, 
    questionId, 
    questionText, 
    testId, 
    reaction, 
    message, 
    isPro, 
    source,
    userId,
    userName,
    userEmail,
    unitInfo,
    userGrants,
  } = data;

  try {
    let guestId: string | null = null;
    const finalMobile = guestMobile;

    if (finalMobile) {
      const normalizedMobile = finalMobile.replace(/\D/g, '').slice(-10);
      const guest = await db.query.guests.findFirst({
        where: (g, { and: andOp, eq: eqOp }) => andOp(eqOp(g.mobile, normalizedMobile), eqOp(g.examType, 'upsc')),
      });
      if (guest) {
        guestId = guest.id;
      }
    }

    const feedbackId = randomUUID();
    await db.insert(intelligenceFeedback).values({
      id: feedbackId,
      guestId,
      questionId,
      questionText: questionText || null,
      testId: testId || null,
      reaction,
      message: message || null,
      isPro: isPro || false,
      source: source || null,
      userId: userId || null,
      userName: userName || null,
      userMobile: finalMobile || null,
      userEmail: userEmail || null,
      examType: 'upsc',
    });

    // Notify via Telegram for ALL interactions (Like, Dislike, Doubt, etc.)
    const emojiMap = { helpful: '👍 Helpful', insightful: '💡 Insightful', unhelpful: '👎 Unhelpful', doubt: '❓ Doubt' };
    const reactionLabel = emojiMap[reaction as keyof typeof emojiMap] || reaction;
    
    // Build Display Name & Details
    let studentInfo = '';
    if (userName) {
      const escapedName = escapeHTML(userName);
      studentInfo = `<b>Name:</b> ${escapedName}\n` + 
                   (finalMobile ? `<b>Mobile:</b> <code>${finalMobile}</code>\n` : '') +
                   (userEmail ? `<b>Email:</b> ${userEmail}` : '');
    } else if (guestId) {
      // Fallback: Lookup from database if we have guestId
      const guest = await db.query.guests.findFirst({
        where: (g, { eq: eqOp }) => eqOp(g.id, guestId!),
        columns: { name: true }
      });
      const displayName = guest?.name || finalMobile || 'Anonymous Guest';
      studentInfo = `<b>Student:</b> ${escapeHTML(displayName)}${finalMobile ? ` (<code>${finalMobile}</code>)` : ''}`;
    } else {
      // Final fallback: Just phone if available
      studentInfo = `<b>Student:</b> ${finalMobile || 'Anonymous Guest'}`;
    }

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    const dayStr = now.toLocaleDateString('en-US', { weekday: 'long' });

    const studentLabel = isPro ? '💎 Subscribed Pro User' : '👤 Guest Student';
    const sourceLabel = source === 'expert_analysis' ? '🧠 Intelligence Analysis' : 
                       source === 'open_paper_view' ? '📄 Paper Solutions' : 
                       source === 'mains_pyq' ? '📝 Mains PYQ Library' :
                       source === 'mains_syllabus_paper' ? '📚 Mains Syllabus Hub' :
                       source === 'prelims_syllabus_topic' ? '🧭 Prelims Syllabus Hub' :
                       source || 'Generic Page';

    await sendTelegramEventNotification(
      `${isPro ? '💎' : '🧠'} <b>UPSC ZEN: Solution Interaction</b>\n` +
      `━━━━━━━━━━━━━━━━\n` +
      `<b>Action:</b> ${reactionLabel}\n` +
      `<b>Source:</b> <code>${sourceLabel}</code>\n` +
      `<b>Status:</b> ${studentLabel}\n` +
      (unitInfo ? `<b>Unit:</b> <code>${escapeHTML(unitInfo)}</code>\n` : '') +
      (userGrants ? `<b>Grants:</b> <code>${escapeHTML(userGrants)}</code>\n` : '') +
      `${studentInfo}\n` +
      `<b>When:</b> ${dayStr}, ${dateStr} at ${timeStr}\n` +
      `<b>Question ID:</b> <code>${questionId}</code>\n` +
      `<b>Content:</b> <i>"${escapeHTML(questionText).slice(0, 150)}${questionText.length > 150 ? '...' : ''}"</i>\n` +
      (message ? `\n<b>Feedback:</b> ${escapeHTML(message)}\n` : '') +
      `━━━━━━━━━━━━━━━━\n` +
      `#SolutionIntelligence ${source === 'mains_pyq' ? '#MainsPYQ' : source === 'prelims_syllabus_topic' ? '#PrelimsSyllabus' : '#UPSC2026'} ${isPro ? '#ProUser' : ''}`
    );

    return { success: true };
  } catch (error) {
    logger.error('Failed to submit intelligence feedback', error);
    return { error: 'Failed to save feedback' };
  }
}

export async function getIntelligenceFeedback() {
  await assertAdmin();

  try {
    const results = await db.query.intelligenceFeedback.findMany({
      where: (f, { eq: eqOp }) => eqOp(f.examType, 'upsc'),
      with: {
        guest: true,
        question: {
          columns: {
            subject: true,
          }
        },
      },
      orderBy: (f, { desc }) => [desc(f.createdAt)],
    });

    return results;
  } catch (error) {
    logger.error('Failed to fetch intelligence feedback', error);
    return [];
  }
}

export async function submitZenFeedback(params: {
  guestMobile?: string;
  testId?: string;
  rating: number;
  tags: string[];
  comment?: string;
  isPro?: boolean;
  leadSource?: string;
}) {
  const { guestMobile, testId, rating, tags, comment, isPro, leadSource } = params;

  try {
    let guestId: string | null = null;
    let guestName = '';
    if (guestMobile) {
      const normalizedMobile = guestMobile.replace(/\D/g, '').slice(-10);
      const guest = await db.query.guests.findFirst({
        where: (g, { and: andOp, eq: eqOp }) => andOp(eqOp(g.mobile, normalizedMobile), eqOp(g.examType, 'upsc')),
      });
      if (guest) {
        guestId = guest.id;
        guestName = guest.name;
      }
    }

    const feedbackId = randomUUID();
    const proLabel = isPro ? ' [PRO USER]' : '';
    const finalMessage = `[Rating: ${rating}/5]${proLabel} Tags: ${tags.join(', ')} ${comment ? `\nComment: ${comment}` : ''}`;

    await db.insert(intelligenceFeedback).values({
      id: feedbackId,
      guestId,
      questionId: 'ZEN_COMPLETION',
      testId: testId || null,
      reaction: rating >= 4 ? 'insightful' : 'doubt',
      message: finalMessage,
      examType: 'upsc',
    });

    const priorityEmoji = isPro ? '🔴 PRIORITY: ' : '';
    const studentLabel = isPro ? '💎 Subscribed Pro User' : '👤 Guest Student';

    await sendTelegramEventNotification(
      `${isPro ? '💎' : '🏆'} <b>Zen Completion Feedback</b>\n` +
      `━━━━━━━━━━━━━━━━\n` +
      `<b>${priorityEmoji}Rating:</b> ${'⭐️'.repeat(rating)}\n` +
      `<b>Status:</b> ${studentLabel}\n` +
      `<b>Tags:</b> ${tags.join(', ')}\n` +
      (guestName ? `<b>Name:</b> ${escapeHTML(guestName)}\n` : '') +
      (guestMobile ? `<b>Mobile:</b> <code>${guestMobile}</code>\n` : '') +
      (leadSource ? `<b>Source:</b> <code>${leadSource}</code>\n` : '') +
      (comment ? `\n<b>Comment:</b> ${escapeHTML(comment)}\n` : '') +
      `━━━━━━━━━━━━━━━━\n` +
      `#ZenFeedback #UPSC2026 ${isPro ? '#ProUser' : ''}`
    );

    return { success: true };
  } catch (error) {
    logger.error('Failed to submit zen feedback', error);
    return { error: 'Failed to save feedback' };
  }
}

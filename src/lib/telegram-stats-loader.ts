import { db } from '@/db';
import { guests, testFeedback } from '@/db/schema';
import { count, avg, eq } from 'drizzle-orm';

/**
 * 📊 TELEGRAM STATS LOADER
 * 
 * Fetches global metrics to show growth and quality in Telegram notifications.
 * Includes:
 * 1. Total Unique Leads (from guests table)
 * 2. Feedback metrics (total and average rating)
 * 3. Rating distribution (1-5 stars)
 */
export async function getTelegramStatsSummary() {
  try {
    // 1. Total unique guest leads
    const [leadsCount] = await db.select({ value: count() }).from(guests);
    
    // 2. Total feedback count and avg rating
    const [feedbackStats] = await db
      .select({ 
        total: count(),
        average: avg(testFeedback.overallRating)
      })
      .from(testFeedback);
      
    // 3. Star distribution
    const stars = [5, 4, 3, 2, 1];
    const distribution: Record<number, number> = {};
    
    // Performance Note: We could do this in one query with group by, but for 5 values this is fine
    for (const star of stars) {
      const [res] = await db
        .select({ value: count() })
        .from(testFeedback)
        .where(eq(testFeedback.overallRating, star));
      distribution[star] = res.value;
    }

    const totalF = feedbackStats.total || 0;
    const avgR = feedbackStats.average ? parseFloat(String(feedbackStats.average)).toFixed(1) : '0';

    // Format the distribution into a visual bar chart for Telegram
    const distributionStr = stars.map(star => {
      const countVal = distribution[star] || 0;
      const percentage = totalF > 0 ? (countVal / totalF) * 10 : 0;
      // Using solid and light blocks for the bar
      const bar = '█'.repeat(Math.round(percentage)).padEnd(10, '░');
      return `${star} ⭐: ${String(countVal).padEnd(3)} [${bar}]`;
    }).join('\n');

    return (
      `📈 <b>GLOBAL PLATFORM STATS</b>\n` +
      `━━━━━━━━━━━━━━━━\n` +
      `👥 <b>Total Guest Leads:</b> ${leadsCount.value}\n` +
      `📝 <b>Total Feedbacks:</b> ${totalF}\n` +
      `🌟 <b>Avg Rating:</b> ${avgR} / 5\n\n` +
      `<b>Rating Distribution:</b>\n` +
      `<pre>${distributionStr}</pre>\n` +
      `━━━━━━━━━━━━━━━━`
    );
  } catch (error) {
    console.error('Error loading telegram stats:', error);
    return ''; // Return empty so it doesn't crash the main notification
  }
}

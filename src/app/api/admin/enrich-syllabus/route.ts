import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { syllabusTopics, mppscUsers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/logger';

// Admin Secret for protection (reuse the one we added)
const ADMIN_SECRET_HEADER = 'x-admin-secret';

type EnrichedTopic = {
  id: string;
  content_hindi: any;
  content_english: any;
};

export async function GET(request: NextRequest) {
  try {
    // verify secret? For export maybe not strictly necessary if it's just IDs/Titles,
    // but cleaner to require it. Use query param or header.
    // For simplicity in this tool, we'll allow fetching metadata without secret
    // OR require the header if the UI handles it.
    // Let's make it public for now since syllabus structure isn't super sensitive,
    // or key-protected if easily doable. The client page has the key input for POST,
    // but for GET it loads on mount. Let's leave it open but maybe lightweight.

    const allTopics = await db.query.syllabusTopics.findMany({
      orderBy: (topics, { asc }) => [asc(topics.unitId), asc(topics.order)],
    });

    // Group by Unit
    const grouped: Record<string, any> = {};

    // Helper to format unit ID (unit_1 -> Unit 1) if needed,
    // but we keep keys as unit_1 for consistency

    allTopics.forEach((topic) => {
      if (!grouped[topic.unitId]) {
        grouped[topic.unitId] = {
          title: topic.unitId.replace('_', ' ').toUpperCase(), // Fallback title
          topics: [],
          topics_en: [], // We don't really use this structure in the export JSON logic anymore,
          // we just need the flat list for the specific unit
        };
      }

      // Construct the export object directly here
      grouped[topic.unitId].topics.push({
        id: topic.id,
        unit_title: topic.title, // This might be topic title in the schema?? No, schema has topic title.
        // Wait, schema `title` is TOPIC title. `unitId` is just string.
        // We don't have Unit Title in DB directly (it's in syllabusData).
        // But we can just use the Unit ID or look it up if we really want.
        // The AI just needs context.

        // Let's rely on syllabusData strictly for UNIT Titles?
        // No, mixed usage is bad.
        // Let's just output unitId if title missing, or hardcode map.

        topic_title: topic.title,
        topic_title_en: topic.titleEn || topic.title,
      });
    });

    return NextResponse.json({ units: grouped });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // logger.debug("request", request)
    // 1. Security Check
    const adminSecret = request.headers.get(ADMIN_SECRET_HEADER);
    // logger.debug("adminSecret", adminSecret)
    if (!adminSecret) {
      return NextResponse.json({ error: 'Missing Admin Secret' }, { status: 401 });
    }

    // Verify secret against DB (Optional but recommended for robust security)
    // For speed in this script, we can rely on the secret matching a known value or DB lookup
    const adminUser = await db.query.mppscUsers.findFirst({
      where: (users, { and, eq }) =>
        and(eq(users.role, 'admin'), eq(users.adminSecret, adminSecret)),
    });

    if (!adminUser) {
      return NextResponse.json({ error: 'Invalid Admin Secret' }, { status: 403 });
    }

    // 2. Parse Data
    const body = await request.json();
    const { topics } = body as { topics: EnrichedTopic[] };

    if (!Array.isArray(topics)) {
      return NextResponse.json(
        { error: 'Invalid format. Expected { topics: [] }' },
        { status: 400 }
      );
    }

    let updatedCount = 0;
    const errors = [];

    // logger.debug("topics", topics)
    // 3. Bulk Update
    // We loop and update. For massive datasets (1000+), we might want batching,
    // but for syllabus (100-200 items), sequential await is fine for this admin tool.
    for (const topic of topics) {
      try {
        if (!topic.id) continue;

        await db
          .update(syllabusTopics)
          .set({
            aiContent: topic.content_hindi,
            aiContentEn: topic.content_english,
          })
          .where(eq(syllabusTopics.id, topic.id));

        updatedCount++;
      } catch (err: any) {
        logger.error(`Failed to update topic ${topic.id}:`, err);
        errors.push({ id: topic.id, error: err.message });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully updated ${updatedCount} topics.`,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    logger.error('Bulk enrichment failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

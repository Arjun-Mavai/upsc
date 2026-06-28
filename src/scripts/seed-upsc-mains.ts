import { config } from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const cwd = process.cwd();
config({ path: path.join(cwd, '.env') });
config({ path: path.join(cwd, '.env.local'), override: true });

async function seedMains() {
  const { db } = await import('../db');
  const { mainsPapers, mainsUnits, mainsTopics } = await import('../db/schema');

  console.log('🚀 Starting Full UPSC Mains Syllabus Seeding...');

  const dataPath = path.join(cwd, 'src/scripts/upsc_syllabus_data.json');
  if (!fs.existsSync(dataPath)) {
    console.error('❌ Error: upsc_syllabus_data.json not found in src/scripts/');
    console.error('Please paste the AI-generated JSON into src/scripts/upsc_syllabus_data.json first.');
    process.exit(1);
  }

  const rawData = fs.readFileSync(dataPath, 'utf8');
  let parsedData;
  try {
    parsedData = JSON.parse(rawData);
  } catch(e) {
    console.error('❌ Error: Invalid JSON in upsc_syllabus_data.json');
    process.exit(1);
  }

  const { papers } = parsedData;

  for (const paperData of papers) {
    console.log(`📄 Seeding Paper ${paperData.paper_number}: ${paperData.paper_title_en}`);
    const paperId = uuidv4();

    await db.insert(mainsPapers).values({
      id: paperId,
      paperNumber: paperData.paper_number,
      titleHi: paperData.paper_title_hi,
      titleEn: paperData.paper_title_en,
      totalMarks: paperData.total_marks || 250,
      durationMinutes: paperData.duration_minutes || 180,
      displayOrder: paperData.paper_number,
      examType: 'upsc',
    }).onConflictDoNothing();

    for (const partData of paperData.parts || []) {
      for (const unitData of partData.units || []) {
        const unitId = uuidv4();
        await db.insert(mainsUnits).values({
          id: unitId,
          paperId,
          part: partData.part || 'NONE',
          unitNumber: unitData.unit_number,
          titleHi: unitData.unit_title_hi || '',
          titleEn: unitData.unit_title_en || '',
          displayOrder: unitData.unit_number,
          examType: 'upsc',
        }).onConflictDoNothing();

        const topics = [];
        for (let i = 0; i < (unitData.topics_hi || []).length; i++) {
          topics.push({
            id: uuidv4(),
            unitId,
            titleHi: unitData.topics_hi[i],
            titleEn: unitData.topics_en[i] || '',
            displayOrder: i + 1,
            status: 'published' as const,
            examType: 'upsc' as const,
          });
        }

        if (topics.length > 0) {
          await db.insert(mainsTopics).values(topics).onConflictDoNothing();
        }
      }
    }
  }

  console.log('✅ Seeding Complete! Syllabus is successfully loaded.');
}

seedMains()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('❌ Seeding Failed:', e);
    process.exit(1);
  });

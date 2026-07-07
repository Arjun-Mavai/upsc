const fs = require('fs');
const path = 'src/actions/mains-actions.ts';
let content = fs.readFileSync(path, 'utf8');

const newCode = `
/**
 * 📦 BULK SYLLABUS UPLOAD (Admin Automation)
 * Takes JSON from the Decoder Prompt and inserts Papers, Units, and Topics into the DB automatically.
 */
export async function adminApplyMainsSyllabusJson(jsonString: string) {
  try {
    await assertAdmin();
    const parsed = JSON.parse(jsonString);
    if (!parsed.papers || !Array.isArray(parsed.papers)) {
      return { success: false as const, error: 'Invalid JSON: Missing papers array' };
    }

    let totalPapers = 0;
    let totalUnits = 0;
    let totalTopics = 0;

    for (const paperData of parsed.papers) {
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
      totalPapers++;

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
          totalUnits++;

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
            totalTopics++;
          }

          if (topics.length > 0) {
            await db.insert(mainsTopics).values(topics).onConflictDoNothing();
          }
        }
      }
    }

    revalidatePath('/admin/mains');
    revalidatePath('/mains/syllabus');
    revalidateTag('mains_syllabus', { expire: 0 });

    return { 
      success: true as const, 
      message: \`Successfully uploaded \${totalPapers} papers, \${totalUnits} macro-themes, and \${totalTopics} micro-topics.\` 
    };
  } catch (error: any) {
    console.error('adminApplyMainsSyllabusJson error:', error);
    return { success: false as const, error: blobFromError(error) };
  }
}
`;

if (!content.includes('adminApplyMainsSyllabusJson')) {
  fs.writeFileSync(path, content + newCode);
  console.log('Action added to mains-actions.ts');
} else {
  console.log('Action already exists.');
}

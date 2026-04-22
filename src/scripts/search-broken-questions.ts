import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

async function main() {
  const { db } = await import('../db/index');
  const { questions, tests } = await import('../db/schema');
  const { eq, and } = await import('drizzle-orm');

  const upscTests = await db.select().from(tests).where(eq(tests.type, 'UPSC_PYQ'));
  const test2024 = upscTests.find(t => t.title.includes('2024'));

  if (!test2024) return;

  const q2024 = await db.select().from(questions).where(eq(questions.testId, test2024.id));
  
  console.log('Searching for potential duplicates/rendering issues in 2024...');

  q2024.forEach(q => {
    const ext = typeof q.extendedData === 'string' ? JSON.parse(q.extendedData) : q.extendedData;
    const textEn = q.questionTextEn || '';
    
    // Check for "double" - text contains "Statement" markers but we also have structured data
    const hasStructured = ext?.listItems?.length > 0 || ext?.statementI;
    const hasMarkersInText = /(?:Statement|कथन)\s*(?:I|1)/i.test(textEn) || /(?:Statement|कथन)\s*(?:I|1)/i.test(q.questionText || '');

    if (hasStructured && hasMarkersInText) {
        console.log(`\n[DOUBLE CANDIDATE] ID: ${q.id} | QNo: ${q.order}`);
        console.log(`TEXT (EN): ${textEn.substring(0, 200)}...`);
        console.log(`EXTENDED DATA: ${JSON.stringify(ext, null, 1)}`);
    }

    // Check for "missing items" - structured data exists but items might be empty or layout is broken
    if (ext?.layoutType === 'statements' && (!ext.listItems || ext.listItems.length === 0) && !ext.statementI && !ext.statement_i) {
        console.log(`\n[MISSING ITEMS CANDIDATE] ID: ${q.id} | QNo: ${q.order}`);
        console.log(`TEXT (EN): ${textEn.substring(0, 200)}...`);
        console.log(`EXTENDED DATA: ${JSON.stringify(ext, null, 1)}`);
    }
  });
}

main().catch(console.error);

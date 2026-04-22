import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

async function main() {
  const { db } = await import('../db/index');
  const { questions, tests } = await import('../db/schema');
  const { eq, and, sql, like } = await import('drizzle-orm');

  console.log('Fetching UPSC 2024 tests...');

  // Find UPSC 2024 test
  const upscTests = await db.select().from(tests).where(eq(tests.type, 'UPSC_PYQ'));
  const test2024 = upscTests.find(t => t.title.includes('2024'));

  if (!test2024) {
    console.log('UPSC 2024 test not found');
    return;
  }

  console.log(`Found test: ${test2024.title} (ID: ${test2024.id})`);

  const q2024 = await db.select().from(questions).where(eq(questions.testId, test2024.id));
  console.log(`Found ${q2024.length} questions in 2024`);

  const tables = q2024.filter(q => {
    const ext = typeof q.extendedData === 'string' ? JSON.parse(q.extendedData) : q.extendedData;
    return (ext?.layoutType === 'table' || ext?.tableRows || ext?.tableRowsEn) || (q.questionText?.includes('तालिका') || q.questionTextEn?.includes('Table'));
  });

  console.log(`\n--- TABLE QUESTIONS (${tables.length}) ---`);
  tables.forEach(q => {
    const ext = typeof q.extendedData === 'string' ? JSON.parse(q.extendedData) : q.extendedData;
    console.log(`\nID: ${q.id} | QNo: ${q.order}`);
    console.log(`Question (HI): ${q.questionText?.substring(0, 100)}...`);
    console.log(`Question (EN): ${q.questionTextEn?.substring(0, 100)}...`);
    
    const rowsEn = ext?.tableRowsEn || ext?.table_rows_en || ext?.i18n?.en?.tableRows;
    const rowsHi = ext?.tableRowsHi || ext?.table_rows_hi || ext?.tableRows || ext?.table_rows;

    console.log(`TableRowsEn: ${rowsEn ? 'Found' : 'MISSING'}`);
    console.log(`TableRowsHi: ${rowsHi ? 'Found' : 'MISSING'}`);
    
    if (!rowsEn && rowsHi) {
        console.log('WARNING: Missing English rows for this table question');
        console.log('EXTENDED DATA KEYS:', Object.keys(ext || {}));
        console.log('HINDI ROWS SAMPLE:', JSON.stringify(rowsHi?.[0]));
    }
  });

  const statements = q2024.filter(q => {
      const text = q.questionText || '';
      return text.includes('कथन') || text.includes('Statement');
  });

  console.log(`\n--- STATEMENT QUESTIONS (Sample 5) ---`);
  statements.slice(0, 5).forEach(q => {
      console.log(`\nID: ${q.id} | QNo: ${q.order}`);
      const ext = typeof q.extendedData === 'string' ? JSON.parse(q.extendedData) : q.extendedData;
      console.log(`LAYOUT: ${ext?.layoutType}`);
      console.log(`TEXT (HI): ${q.questionText?.substring(0, 200)}...`);
      console.log(`TEXT (EN): ${q.questionTextEn?.substring(0, 200)}...`);
  });
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

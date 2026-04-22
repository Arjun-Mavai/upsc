import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

async function run() {
  const { db } = await import('./src/db/index');
  const { questions, tests } = await import('./src/db/schema');
  const { eq, and } = await import('drizzle-orm');

  const testId = '_wfy3mo9T1KfsFNqwB4KV';
  
  const qs = await db
    .select({
      id: questions.id,
      order: questions.order,
      text: questions.questionText,
      textEn: questions.questionTextEn,
      ext: questions.extendedData,
      explanationEn: questions.explanationEn
    })
    .from(questions)
    .where(eq(questions.testId, testId))
    .orderBy(questions.order);

  console.log(`Checking Test ID: ${testId}`);
  console.log(`Found ${qs.length} questions.`);

  const tableQuestions = qs.filter(q => {
    const ext = typeof q.ext === 'string' ? JSON.parse(q.ext) : q.ext;
    return ext && ext.tableRows && ext.tableRows.length > 0;
  });

  console.log(`Found ${tableQuestions.length} questions with tables.`);

  tableQuestions.forEach(q => {
    const ext = typeof q.ext === 'string' ? JSON.parse(q.ext) : q.ext;
    console.log(`\n--- Q${q.order} (${q.id}) ---`);
    console.log(`Table Rows (HI):`, JSON.stringify(ext.tableRows));
    console.log(`Table Rows En (Existing):`, JSON.stringify(ext.tableRowsEn || 'None'));
  });
}

run().catch(console.error);

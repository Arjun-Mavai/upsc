import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

async function main() {
  const { db } = await import('../db/index');
  const { questions, tests } = await import('../db/schema');
  const { eq, like, and } = await import('drizzle-orm');

  const upscTests = await db.select().from(tests).where(eq(tests.type, 'UPSC_PYQ'));
  const test2024 = upscTests.find(t => t.title.includes('2024'));

  if (!test2024) return;

  const qs = await db.select().from(questions).where(
    and(
      eq(questions.testId, test2024.id),
      like(questions.questionTextEn, '%Statement-I%')
    )
  );

  console.log(`Found ${qs.length} questions with "Statement-I" in text.`);

  qs.forEach(q => {
    const ext = typeof q.extendedData === 'string' ? JSON.parse(q.extendedData) : (q.extendedData || {});
    const hasStructured = ext.statementI || ext.statement_i || ext.listItems?.length > 0;
    
    // Check if statements are in the text but not structured
    const textHasS1 = q.questionTextEn?.includes('Statement-I') && q.questionTextEn?.length < 150; // Short prompt only?
    
    if (!hasStructured) {
        console.log(`\nID: ${q.id} | QNo: ${q.order}`);
        console.log(`Subject: ${q.subject}`);
        console.log(`Text: ${q.questionTextEn}`);
        console.log(`Ext: ${JSON.stringify(ext)}`);
    }
  });
}

main().catch(console.error);

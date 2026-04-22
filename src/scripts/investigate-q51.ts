import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

async function main() {
  const { db } = await import('../db/index');
  const { questions, tests } = await import('../db/schema');
  const { eq, and } = await import('drizzle-orm');

  const upscTests = await db.select().from(tests).where(eq(tests.type, 'UPSC_PYQ'));
  const test2024 = upscTests.find(t => t.title.includes('2024'));

  if (!test2024) {
    console.log('Test 2024 not found');
    return;
  }

  const q51 = await db.select().from(questions).where(
    and(
      eq(questions.testId, test2024.id),
      eq(questions.order, 51)
    )
  ).then(res => res[0]);

  if (q51) {
    console.log(`\n--- INVESTIGATING Q#51 (${q51.id}) ---`);
    console.log(`SUBJECT: ${q51.subject}`);
    console.log(`HI TEXT: ${q51.questionText}`);
    console.log(`EN TEXT: ${q51.questionTextEn}`);
    const ext = typeof q51.extendedData === 'string' ? JSON.parse(q51.extendedData) : q51.extendedData;
    console.log(`EXTENDED DATA: ${JSON.stringify(ext || {}, null, 2)}`);
  } else {
    console.log('Q51 not found');
  }
}

main().catch(console.error);

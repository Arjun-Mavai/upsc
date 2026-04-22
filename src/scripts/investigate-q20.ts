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

  const q20 = await db.select().from(questions).where(
    and(
      eq(questions.testId, test2024.id),
      eq(questions.order, 20)
    )
  ).then(res => res[0]);

  if (q20) {
    console.log(`\n--- INVESTIGATING Q#20 (${q20.id}) ---`);
    console.log(`SUBJECT: ${q20.subject}`);
    console.log(`HI TEXT: ${q20.questionText}`);
    console.log(`EN TEXT: ${q20.questionTextEn}`);
    console.log(`EXTENDED DATA: ${JSON.stringify(JSON.parse(q20.extendedData || '{}'), null, 2)}`);
  }
}

main().catch(console.error);

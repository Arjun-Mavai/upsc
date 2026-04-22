import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

async function main() {
  const { db } = await import('../db/index');
  const { questions, tests } = await import('../db/schema');
  const { eq, and } = await import('drizzle-orm');

  const upscTests = await db.select().from(tests).where(eq(tests.type, 'UPSC_PYQ'));
  const test2022 = upscTests.find(t => t.title.includes('2022'));

  if (!test2022) {
    console.log('Test 2022 not found');
    return;
  }

  const qIds = [36, 54, 67];
  for (const qNo of qIds) {
    const q = await db.select().from(questions).where(
        and(
            eq(questions.testId, test2022.id),
            eq(questions.order, qNo)
        )
    ).then(res => res[0]);

    if (q) {
      console.log(`\n--- Q#${qNo} (${q.id}) ---`);
      console.log(`Text: ${q.questionTextEn}`);
      const ext = typeof q.extendedData === 'string' ? JSON.parse(q.extendedData) : q.extendedData;
      console.log(`Ext: ${JSON.stringify(ext || {})}`);
    } else {
      console.log(`Q#${qNo} not found`);
    }
  }
}

main().catch(console.error);

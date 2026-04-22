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

  const q22 = await db.select().from(questions).where(
    and(
      eq(questions.testId, test2024.id),
      eq(questions.order, 22)
    )
  ).then(res => res[0]);

  if (q22) {
    console.log(`Q#22 ID: ${q22.id}`);
  }
}

main().catch(console.error);

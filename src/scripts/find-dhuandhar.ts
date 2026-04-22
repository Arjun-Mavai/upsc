import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

async function main() {
  const { db } = await import('../db/index');
  const { questions } = await import('../db/schema');
  const { like } = await import('drizzle-orm');

  const qs = await db
    .select({
      id: questions.id,
      testId: questions.testId,
      text: questions.questionText,
      ext: questions.extendedData
    })
    .from(questions)
    .where(like(questions.extendedData, '%धुआंधार%'));

  console.log(JSON.stringify(qs, null, 2));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

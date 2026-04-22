import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

async function run() {
  const { db } = await import('./src/db/index');
  const { questions, tests } = await import('./src/db/schema');
  const { eq, and, like } = await import('drizzle-orm');

  const res = await db
    .select({
      id: questions.id,
      order: questions.order,
      text: questions.questionText,
      ext: questions.extendedData,
      test: tests.title
    })
    .from(questions)
    .innerJoin(tests, eq(questions.testId, tests.id))
    .where(and(
      eq(tests.examType, 'upsc'),
      and(
        like(tests.title, '%2024%'),
        eq(questions.order, 55)
      )
    ));

  console.log("Q55 2024 Check:");
  console.log(JSON.stringify(res, null, 2));
}
run();

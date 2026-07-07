import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

async function run() {
  const { db } = await import('./src/db/index');
  const { questions, tests } = await import('./src/db/schema');
  const { eq, and } = await import('drizzle-orm');

  const qs = await db
    .select({
      id: questions.id, 
      order: questions.order, 
      type: questions.type, 
      matchPairs: questions.matchPairs,
      questionText: questions.questionText, 
      options: questions.options, 
    })
    .from(questions)
    .innerJoin(tests, eq(questions.testId, tests.id))
    .where(and(eq(tests.examType, 'upsc'), and(eq(questions.order, 9), eq(tests.title, 'सिविल सेवा (प्रारंभिक) परीक्षा, 2024'))));

  console.log("Q9s:");
  console.log(JSON.stringify(qs, null, 2));

  const qs67 = await db
    .select({
      id: questions.id, 
      order: questions.order, 
      type: questions.type, 
      matchPairs: questions.matchPairs,
      questionText: questions.questionText, 
      options: questions.options, 
    })
    .from(questions)
    .innerJoin(tests, eq(questions.testId, tests.id))
    .where(and(eq(tests.examType, 'upsc'), and(eq(questions.order, 67), eq(tests.title, 'सिविल सेवा (प्रारंभिक) परीक्षा, 2024'))));
  
  console.log("Q67s:");
  console.log(JSON.stringify(qs67, null, 2));
}
run();

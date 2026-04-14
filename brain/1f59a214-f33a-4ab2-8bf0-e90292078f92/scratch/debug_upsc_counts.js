
const { db } = require('./src/db');
const { questions, tests } = require('./src/db/schema');
const { eq, and, inArray } = require('drizzle-orm');

async function debug() {
  const upscTests = await db
    .select({ id: tests.id, title: tests.title, type: tests.type })
    .from(tests)
    .where(and(eq(tests.type, 'UPSC_PYQ'), eq(tests.isHidden, false)));
    
  console.log('UPSC Tests found:', upscTests.length);
  upscTests.forEach(t => console.log(`- ${t.id}: ${t.title} (${t.type})`));
  
  if (upscTests.length > 0) {
    const testIds = upscTests.map(t => t.id);
    const allQuestions = await db
      .select({ id: questions.id, subject: questions.subject })
      .from(questions)
      .where(inArray(questions.testId, testIds));
    
    console.log('Total Questions found:', allQuestions.length);
    
    const subjectCounts = {};
    allQuestions.forEach(q => {
      const s = q.subject || 'NULL';
      subjectCounts[s] = (subjectCounts[s] || 0) + 1;
    });
    console.log('Subject counts (raw):', subjectCounts);
  }
}

debug().catch(console.error);

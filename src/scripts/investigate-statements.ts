import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

async function main() {
  const { db } = await import('../db/index');
  const { questions, tests } = await import('../db/schema');
  const { eq } = await import('drizzle-orm');

  // QNo 177 from previous run
  const qId = 'ngmF36QmLtUB4br32EArw'; 
  const q = await db.select().from(questions).where(eq(questions.id, qId)).then(res => res[0]);

  if (q) {
      console.log(`\n--- INVESTIGATING Q#177 (${q.id}) ---`);
      console.log(`HI TEXT: ${q.questionText}`);
      console.log(`EN TEXT: ${q.questionTextEn}`);
      console.log(`EXTENDED DATA: ${JSON.stringify(JSON.parse(q.extendedData || '{}'), null, 2)}`);
  }

  // Find another one that might be "double"
  // Usually double happens when the text has the statements AND they are also parsed items.
  const allQs = await db.select().from(questions).limit(500);
  const potentialDouble = allQs.find(q => {
      const textEn = q.questionTextEn || '';
      return textEn.includes('Statement-I') && textEn.includes('Statement-II');
  });

  if (potentialDouble) {
      console.log(`\n--- INVESTIGATING POTENTIAL DOUBLE (${potentialDouble.id}) ---`);
      console.log(`EN TEXT: ${potentialDouble.questionTextEn}`);
      console.log(`EXTENDED DATA: ${JSON.stringify(JSON.parse(potentialDouble.extendedData || '{}'), null, 2)}`);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

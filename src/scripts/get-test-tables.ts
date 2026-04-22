import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

// We must import the database AFTER loading env variables
async function main() {
  const { db } = await import('../db/index');
  const { questions } = await import('../db/schema');
  const { eq } = await import('drizzle-orm');

  const testId = '_wfy3mo9T1KfsFNqwB4KV';
  
  const qs = await db
    .select({
      id: questions.id,
      order: questions.order,
      ext: questions.extendedData
    })
    .from(questions)
    .where(eq(questions.testId, testId))
    .orderBy(questions.order);

  const tables = qs.filter(q => {
    const ext = typeof q.ext === 'string' ? JSON.parse(q.ext) : q.ext;
    return ext && ext.tableRows;
  });

  console.log(JSON.stringify(tables, null, 2));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

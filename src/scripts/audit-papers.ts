import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

async function run() {
  const { db } = await import('../db/index');
  const { questions, tests } = await import('../db/schema');
  const { eq } = await import('drizzle-orm');

  console.log("Starting UPSC Paper-wise Audit (2020-2025)...");

  const qs = await db
    .select({
      id: questions.id,
      text: questions.questionText,
      ext: questions.extendedData,
      testId: tests.id,
      testTitle: tests.title
    })
    .from(questions)
    .innerJoin(tests, eq(questions.testId, tests.id))
    .where(eq(tests.examType, 'upsc'));

  const paperStats: Record<string, { total: number; broken: number; brokenIds: string[] }> = {};

  for (const q of qs) {
    const title = q.testTitle || 'Unknown Test';
    if (!paperStats[title]) {
      paperStats[title] = { total: 0, broken: 0, brokenIds: [] };
    }
    paperStats[title].total++;

    const text = q.text || '';
    const ext = typeof q.ext === 'string' ? JSON.parse(q.ext) : q.ext;
    
    const hasTableKeywords = /पंक्ति|जोड़े|युग्म|matched|table|row/i.test(text);
    const hasStatementKeywords = /कथन|Statement|1\.|I\./i.test(text);
    
    const isMissingTable = hasTableKeywords && (!ext || (!ext.tableRows && !ext.matchPairs));
    const isMissingStatements = hasStatementKeywords && (!ext || (!ext.listItems && !ext.statementI));
    const isTruncated = text.length < 120 && (hasTableKeywords || hasStatementKeywords);

    if (isMissingTable || isMissingStatements || isTruncated) {
      paperStats[title].broken++;
      paperStats[title].brokenIds.push(q.id);
    }
  }

  console.log("\nPaper-wise Audit Results:");
  const results = Object.entries(paperStats)
    .map(([title, stats]) => ({
      Paper: title,
      Total_Qs: stats.total,
      Broken_Qs: stats.broken,
      Percentage: ((stats.broken / stats.total) * 100).toFixed(1) + "%"
    }))
    .filter(r => r.Broken_Qs > 0)
    .sort((a, b) => b.Broken_Qs - a.Broken_Qs);

  console.table(results);
}

run().catch(console.error);

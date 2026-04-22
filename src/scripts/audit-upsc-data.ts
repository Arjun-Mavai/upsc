import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

async function run() {
  const { db } = await import('../db/index');
  const { questions, tests } = await import('../db/schema');
  const { eq, and, like, or, sql } = await import('drizzle-orm');

  console.log("Starting UPSC Data Audit (2020-2025)...");

  const qs = await db
    .select({
      id: questions.id,
      order: questions.order,
      text: questions.questionText,
      ext: questions.extendedData,
      testTitle: tests.title,
      year: tests.createdAt // Approximating year if not in title
    })
    .from(questions)
    .innerJoin(tests, eq(questions.testId, tests.id))
    .where(eq(tests.examType, 'upsc'));

  console.log(`Auditing ${qs.length} questions...`);

  const broken: any[] = [];

  for (const q of qs) {
    const text = q.text || '';
    const ext = typeof q.ext === 'string' ? JSON.parse(q.ext) : q.ext;
    
    const hasTableKeywords = /पंक्ति|जोड़े|युग्म|matched|table|row/i.test(text);
    const hasStatementKeywords = /कथन|Statement|1\.|I\./i.test(text);
    
    const isMissingTable = hasTableKeywords && (!ext || (!ext.tableRows && !ext.matchPairs));
    const isMissingStatements = hasStatementKeywords && (!ext || (!ext.listItems && !ext.statementI));
    
    // Check for severe truncation (less than 100 chars but mentions rows/statements)
    const isTruncated = text.length < 120 && (hasTableKeywords || hasStatementKeywords);

    if (isMissingTable || isMissingStatements || isTruncated) {
      broken.push({
        id: q.id,
        order: q.order,
        year: q.testTitle?.match(/\d{4}/)?.[0] || 'Unknown',
        issue: isTruncated ? 'Truncated Text' : (isMissingTable ? 'Missing Table Data' : 'Missing Statements'),
        textSnippet: text.substring(0, 100)
      });
    }
  }

  console.log(`Audit Complete. Found ${broken.length} potentially broken questions.`);
  
  // Output summary by year
  const summary: Record<string, number> = {};
  broken.forEach(b => {
    summary[b.year] = (summary[b.year] || 0) + 1;
  });
  
  console.log("\nSummary by Year:");
  console.table(summary);

  if (broken.length > 0) {
    console.log("\nSample Broken Questions (First 5):");
    console.table(broken.slice(0, 5));
  }
}

run().catch(console.error);

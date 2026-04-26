import 'dotenv/config';
import { db } from '../src/db';
import { questions, tests } from '../src/db/schema';
import { eq, sql, or } from 'drizzle-orm';

async function main() {
  const rs = await db.select({
    testId: tests.id,
    title: tests.title,
    count: sql<number>`count(${questions.id})`,
    subjects: sql<string>`group_concat(distinct ${questions.subject})`
  })
  .from(tests)
  .leftJoin(questions, eq(tests.id, questions.testId))
  .where(or(eq(tests.examType, 'upsc'), eq(tests.id, 'ix0FnJV496Rgvw0YHOEFj')))
  .groupBy(tests.id);

  console.table(rs);
  process.exit(0);
}
main();

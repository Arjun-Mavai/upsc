import dotenv from 'dotenv';
import * as nodePath from 'node:path';

const cwd = process.cwd();
dotenv.config({ path: nodePath.join(cwd, '.env.local') });
dotenv.config({ path: nodePath.join(cwd, '.env') });

const IDS = process.argv.slice(2);
if (IDS.length === 0) {
  console.error('Usage: NODE_ENV=production npx tsx src/scripts/dump-extended-for-ids.ts <id> ...');
  process.exit(1);
}

async function main() {
  const { db } = await import('../db');
  const { questions } = await import('../db/schema');
  const { inArray } = await import('drizzle-orm');

  const rows = await db
    .select({ id: questions.id, extendedData: questions.extendedData })
    .from(questions)
    .where(inArray(questions.id, IDS));

  for (const r of rows) {
    console.log('\n===', r.id, '===');
    console.log(JSON.stringify(r.extendedData, null, 2));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

import 'dotenv/config';
import { db } from '../src/db';
import { sql } from 'drizzle-orm';

async function main() {
  const tableInfo = await db.all(sql`PRAGMA table_info(questions)`);
  console.log(tableInfo);
  process.exit(0);
}
main();

import 'dotenv/config';
import { db } from './src/db/index';
import { mainsPyqPapers } from './src/db/schema';
import { eq } from 'drizzle-orm';
async function main() {
  const rows = await db.select().from(mainsPyqPapers);
  console.log("Current papers in DB:");
  for (const r of rows) {
    console.log(`ID: ${r.id}, Year: ${r.examYear}, PaperNumber: ${r.paperNumber}, TitleEn: ${r.titleEn}, TitleHi: ${r.titleHi}`);
  }
  process.exit(0);
}
main();

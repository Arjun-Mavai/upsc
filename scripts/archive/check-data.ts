import { db } from './src/db';
import { syllabusTopics, mainsUnits, mainsPyqPapers } from './src/db/schema';
import { eq, count } from 'drizzle-orm';

async function main() {
  try {
    const units = await db.select({ value: count() }).from(mainsUnits).where(eq(mainsUnits.examType, 'upsc'));
    const topics = await db.select({ value: count() }).from(syllabusTopics).where(eq(syllabusTopics.examType, 'upsc'));
    const pyq = await db.select({ value: count() }).from(mainsPyqPapers); // examType not present in schema for this table
    
    console.log(`UPSC Stats:`);
    console.log(`- Units: ${units[0].value}`);
    console.log(`- Topics: ${topics[0].value}`);
    console.log(`- PYQ Papers: ${pyq[0].value}`);
    
    // Check if the UUID is a unit
    const unitCheck = await db.select().from(mainsUnits).where(eq(mainsUnits.id, '38e3570d-f921-4ee1-89ae-924e0ad98688'));
    console.log(`Unit search for 38e3570d: found ${unitCheck.length}`);
  } catch (err) {
    console.error("Error:", err);
  }
  process.exit(0);
}
main();

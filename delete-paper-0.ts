import { config } from "dotenv";
config();
import { db } from "./src/db";
import { mainsPyqPapers, mainsPyqQuestions, mainsPyqPreparedVariants } from "./src/db/schema";
import { eq } from "drizzle-orm";

async function run() {
  console.log("Fetching papers with paperNumber = 0...");
  const papers = await db.select().from(mainsPyqPapers).where(eq(mainsPyqPapers.paperNumber, 0));
  
  if (papers.length === 0) {
    console.log("No Paper 0 found.");
    process.exit(0);
  }

  for (const paper of papers) {
    console.log(`Deleting Paper 0 with ID: ${paper.id}`);
    
    const qs = await db.select().from(mainsPyqQuestions).where(eq(mainsPyqQuestions.paperId, paper.id));
    for (const q of qs) {
        await db.delete(mainsPyqPreparedVariants).where(eq(mainsPyqPreparedVariants.pyqQuestionId, q.id));
    }
    
    await db.delete(mainsPyqQuestions).where(eq(mainsPyqQuestions.paperId, paper.id));
    await db.delete(mainsPyqPapers).where(eq(mainsPyqPapers.id, paper.id));
  }
  
  console.log("Deleted successfully.");
  process.exit(0);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { db } from '../src/db';
import { questions, tests } from '../src/db/schema';
import { eq, isNotNull } from 'drizzle-orm';
import fs from 'fs';

async function main() {
  const upscTests = await db
    .select({ id: tests.id, title: tests.title })
    .from(tests)
    .where(eq(tests.type, 'UPSC_PYQ'));
  
  const testIds = upscTests.map(t => t.id);

  if (testIds.length === 0) {
    console.log("No UPSC_PYQ tests found.");
    process.exit(0);
  }

  const distinctSubjects = await db.selectDistinct({ subject: questions.subject })
    .from(questions)
    .where(isNotNull(questions.subject));
  
  const allUPSCQuestions = await db.select({ subject: questions.subject })
    .from(questions)
    .where(isNotNull(questions.subject));
    
  // Let's filter to only those inside UPSC tests in JS to be safe
  const upscQuestions = await db.select({ subject: questions.subject }).from(questions);
  const upscSet = new Set(upscQuestions.map(q => q.subject));

  console.log("Distinct subjects in DB:");
  for (const s of distinctSubjects) {
     console.log(`- ${s.subject}`);
  }
}

main().catch(console.error);

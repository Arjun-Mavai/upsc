// Add dummy env vars before importing DB
process.env.RESEND_API_KEY = process.env.RESEND_API_KEY || 're_dummy_key_1234567890';
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'sk-dummy-key';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'dummy-secret-at-least-32-chars-long';
process.env.ADMIN_PHONE_NUMBERS = process.env.ADMIN_PHONE_NUMBERS || '9999999999';

import { db } from './src/db';
import { mainsPapers, mainsPyqPapers } from './src/db/schema';
import { like, or } from 'drizzle-orm';
import * as dotenv from 'dotenv';
dotenv.config();

async function fixProdDb() {
  console.log('Fixing paper numbers in Turso (Prod DB)...');
  
  console.log('Updating GS I -> 4...');
  await db.update(mainsPapers)
    .set({ paperNumber: 4 })
    .where(like(mainsPapers.titleEn, '%General Studies I (Paper II)%'));
    
  console.log('Updating GS II -> 5...');
  await db.update(mainsPapers)
    .set({ paperNumber: 5 })
    .where(like(mainsPapers.titleEn, '%General Studies II (Paper III)%'));
    
  console.log('Updating GS III -> 6...');
  await db.update(mainsPapers)
    .set({ paperNumber: 6 })
    .where(like(mainsPapers.titleEn, '%General Studies III (Paper IV)%'));
    
  console.log('Updating GS IV -> 7...');
  await db.update(mainsPapers)
    .set({ paperNumber: 7 })
    .where(like(mainsPapers.titleEn, '%General Studies IV (Paper V)%'));

  console.log('Updating PYQ Essay -> 3...');
  await db.update(mainsPyqPapers)
    .set({ paperNumber: 3 })
    .where(like(mainsPyqPapers.titleEn, '%Essay%'));

  console.log('Updating PYQ GS1 -> 4...');
  await db.update(mainsPyqPapers)
    .set({ paperNumber: 4 })
    .where(or(
      like(mainsPyqPapers.titleEn, '%General Studies (Question Paper I)%'),
      like(mainsPyqPapers.titleEn, '%General Studies (Question Paper-I)%')
    ));

  console.log('Updating PYQ GS2 -> 5...');
  await db.update(mainsPyqPapers)
    .set({ paperNumber: 5 })
    .where(or(
      like(mainsPyqPapers.titleEn, '%General Studies (Question Paper II)%'),
      like(mainsPyqPapers.titleEn, '%General Studies (Question Paper-II)%')
    ));

  console.log('Updating PYQ GS3 -> 6...');
  await db.update(mainsPyqPapers)
    .set({ paperNumber: 6 })
    .where(or(
      like(mainsPyqPapers.titleEn, '%General Studies (Question Paper III)%'),
      like(mainsPyqPapers.titleEn, '%General Studies (Question Paper-III)%')
    ));

  console.log('Updating PYQ GS4 -> 7...');
  await db.update(mainsPyqPapers)
    .set({ paperNumber: 7 })
    .where(or(
      like(mainsPyqPapers.titleEn, '%General Studies (Question Paper IV)%'),
      like(mainsPyqPapers.titleEn, '%General Studies (Question Paper-IV)%')
    ));
    
  console.log('All Done!');
}

fixProdDb().catch(console.error);

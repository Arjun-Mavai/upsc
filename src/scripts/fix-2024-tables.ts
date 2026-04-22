import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

async function main() {
  const { db } = await import('../db/index');
  const { questions } = await import('../db/schema');
  const { eq, inArray } = await import('drizzle-orm');

  const questionIds = [
    'KCjjyCNqOx_oJMKiOsWl0', // Q145
    'qOzuuGfw9YCbKVgxlJAu6', // Q147
    'rrEYyqV7nFBvgbHq3NJ3O', // Q123
    'ye1F380ORQsVpIbelD8II', // Q110
    '-n5D0MzNanBw0uXRBsKGS', // Q155
    'f9zh8NmeLLMceIIf8cjd2', // Q173
    'sldNhpDl9xd20t0qGqxW4', // Q187
    'qWLyVvvXy1SWYcGa3fHVY', // Q169
  ];

  console.log('Fetching questions for translation...');
  const qs = await db.select().from(questions).where(inArray(questions.id, questionIds));

  const translations: Record<string, { headersEn: string[], rowsEn: string[][] }> = {
    'KCjjyCNqOx_oJMKiOsWl0': {
      headersEn: ['Economic Activity', 'Sector'],
      rowsEn: [
        ['1. Storage of agricultural produce', 'Secondary'],
        ['2. Dairy', 'Primary'],
        ['3. Transport', 'Tertiary']
      ]
    },
    'qOzuuGfw9YCbKVgxlJAu6': {
      headersEn: ['Example', 'Type of Physical Capital'],
      rowsEn: [
        ["1. Farmer's plough", 'Working Capital'],
        ['2. Raw materials and cash', 'Working Capital'],
        ['3. Computer', 'Fixed Capital']
      ]
    },
    'rrEYyqV7nFBvgbHq3NJ3O': {
        headersEn: ['Country', 'Habitat/Species'],
        rowsEn: [
            ['1. Brazil', 'Indri'],
            ['2. Indonesia', 'Elk'],
            ['3. Madagascar', 'Bonobo']
        ]
    },
    'ye1F380ORQsVpIbelD8II': {
      headersEn: ['Region', 'Mountain', 'Type'],
      rowsEn: [
        ['1. Central Asia', 'Vosges', 'Fold Mountain'],
        ['2. North America', 'Appalachians', 'Fold Mountain'],
        ['3. South America', 'Andes', 'Block Mountain']
      ]
    },
    '-n5D0MzNanBw0uXRBsKGS': {
      headersEn: ['Archaeological Site', 'Current State', 'Main Feature'],
      rowsEn: [
        ['1. Chandraketugarh', 'Odisha', 'Trade Port City'],
        ['2. Inamgaon', 'Maharashtra', 'Chalcolithic Site'],
        ['3. Mangadu', 'Tamil Nadu', 'Iron Age Burial Site']
      ]
    },
    'f9zh8NmeLLMceIIf8cjd2': {
      headersEn: ['Political Party', 'Leader'],
      rowsEn: [
        ['1. Bharatiya Jana Sangh', 'Dr. Syama Prasad Mukherjee'],
        ['2. Swatantra Party', 'C. Rajagopalachari'],
        ['3. Praja Socialist Party', 'Acharya Narendra Dev']
      ]
    },
    'sldNhpDl9xd20t0qGqxW4': {
      headersEn: ['Country', 'Reason for News'],
      rowsEn: [
        ['1. Argentina', 'Worst economic crisis'],
        ['2. Sudan', 'Civil war'],
        ['3. Turkey', 'Major earthquake']
      ]
    },
    'qWLyVvvXy1SWYcGa3fHVY': {
      headersEn: ['Army', 'Air Force', 'Navy'],
      rowsEn: [
        ['1. Brigadier', 'Air Commodore', 'Commodore'],
        ['2. Major General', 'Air Vice Marshal', 'Rear Admiral'],
        ['3. Lieutenant General', 'Air Marshal', 'Vice Admiral']
      ]
    }
  };

  console.log('Updating questions in DB...');
  for (const q of qs) {
    const trans = translations[q.id];
    if (trans) {
      const ext = typeof q.extendedData === 'string' ? JSON.parse(q.extendedData) : (q.extendedData || {});
      ext.tableRowsEn = trans.rowsEn;
      ext.tableHeadersEn = trans.headersEn;
      
      await db.update(questions)
        .set({ extendedData: JSON.stringify(ext) })
        .where(eq(questions.id, q.id));
      
      console.log(`Updated QNo ${q.order} (${q.id})`);
    }
  }

  console.log('All updates completed!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

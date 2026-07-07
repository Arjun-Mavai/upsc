import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '.env') });

async function fixTursoDb() {
  console.log('Connecting to Turso DB...');
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url || !authToken) {
    console.error('TURSO_DATABASE_URL or TURSO_AUTH_TOKEN is missing!');
    process.exit(1);
  }

  const client = createClient({
    url: url,
    authToken: authToken,
  });

  try {
    console.log('Fixing mains_papers...');
    await client.execute(`UPDATE mains_papers SET paper_number = 4 WHERE title_en LIKE '%General Studies I (Paper II)%';`);
    await client.execute(`UPDATE mains_papers SET paper_number = 5 WHERE title_en LIKE '%General Studies II (Paper III)%';`);
    await client.execute(`UPDATE mains_papers SET paper_number = 6 WHERE title_en LIKE '%General Studies III (Paper IV)%';`);
    await client.execute(`UPDATE mains_papers SET paper_number = 7 WHERE title_en LIKE '%General Studies IV (Paper V)%';`);
    
    console.log('Fixing mains_pyq_papers...');
    await client.execute(`UPDATE mains_pyq_papers SET paper_number = 3 WHERE title_en LIKE '%Essay%';`);
    await client.execute(`UPDATE mains_pyq_papers SET paper_number = 4 WHERE title_en LIKE '%Question Paper I)%' OR title_en LIKE '%Question Paper-I)%';`);
    await client.execute(`UPDATE mains_pyq_papers SET paper_number = 5 WHERE title_en LIKE '%Question Paper II)%' OR title_en LIKE '%Question Paper-II)%';`);
    await client.execute(`UPDATE mains_pyq_papers SET paper_number = 6 WHERE title_en LIKE '%Question Paper III)%' OR title_en LIKE '%Question Paper-III)%';`);
    await client.execute(`UPDATE mains_pyq_papers SET paper_number = 7 WHERE title_en LIKE '%Question Paper IV)%' OR title_en LIKE '%Question Paper-IV)%';`);

    console.log('All Done!');
  } catch (error) {
    console.error('Error executing queries:', error);
  }
}

fixTursoDb();

import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

async function runSafeMigration() {
  console.log('Starting safe migration for extendedData...');
  
  if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
    console.error('Missing Turso credentials in .env.local');
    process.exit(1);
  }

  const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  try {
    // We execute raw SQL to bypass drizzle-kit push
    await client.execute(`ALTER TABLE questions ADD COLUMN extended_data text;`);
    console.log('✅ Successfully added extended_data column to questions table.');
  } catch (error: any) {
    if (error.message?.includes('duplicate column name')) {
      console.log('⚠️ Column extended_data already exists. No action needed.');
    } else {
      console.error('❌ Migration failed:', error);
    }
  } finally {
    client.close();
    process.exit(0);
  }
}

runSafeMigration();

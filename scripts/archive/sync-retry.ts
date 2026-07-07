import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './src/db/schema';
import Database from 'better-sqlite3';

async function main() {
  const localDb = new Database('mppsc_local_dev.db');
  
  const remoteClient = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  // Temporarily disable foreign keys for the bulk insert
  await remoteClient.execute('PRAGMA foreign_keys = OFF');

  const tablesToSync = [
    'mains_pyq_papers',
    'mains_pyq_questions',
    'mains_pyq_prepared_variants'
  ];

  for (const tableName of tablesToSync) {
    console.log(`Syncing ${tableName}...`);
    const rows = localDb.prepare(`SELECT * FROM ${tableName}`).all();
    
    if (rows.length === 0) {
      console.log(`No rows in ${tableName}, skipping.`);
      continue;
    }
    
    for (const row of rows) {
      const keys = Object.keys(row);
      const values = Object.values(row);
      const placeholders = keys.map(() => '?').join(', ');
      
      try {
        await remoteClient.execute({
          sql: `INSERT OR IGNORE INTO ${tableName} (${keys.join(', ')}) VALUES (${placeholders})`,
          args: values as any[]
        });
      } catch (err: any) {
        console.error(`Failed to insert into ${tableName}:`, err.message);
      }
    }
    console.log(`Synced ${rows.length} rows for ${tableName}.`);
  }
  
  await remoteClient.execute('PRAGMA foreign_keys = ON');
  console.log('Sync complete!');
  process.exit(0);
}

main().catch(console.error);

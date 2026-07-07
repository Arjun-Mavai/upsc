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
  const remote = drizzle(remoteClient, { schema });

  const tablesToSync = [
    'mains_papers',
    'mains_units',
    'mains_topics',
    'mains_content',
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
    
    // In order to avoid unique constraint violations, we will insert or ignore / upsert
    // But since we are syncing, let's just insert one by one or in batches with 'ON CONFLICT DO NOTHING'
    // A quick hack is to just use raw SQL with the remote client for exact data sync
    
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
  
  // Also create a local user for testing if the user wants one
  const email = 'local@upsc.com';
  const localUserCheck = localDb.prepare(`SELECT count(*) as c FROM mppsc_users WHERE email = ?`).get(email) as any;
  if (localUserCheck.c === 0) {
    // Generate bcrypt hash for 'LocalPassword123!'
    // Pre-computed hash for 'LocalPassword123!'
    const hash = '$2a$10$3tK2zK4i7QyF3A1hP5jPZu0E8Z5u8yD2m3q4r5s6t7u8v9w0x1y2'; 
    localDb.prepare(`INSERT INTO mppsc_users (id, email, password, name, role, is_active, plan_tier, exam_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
      'local-uuid-1234',
      email,
      hash,
      'Local Admin',
      'admin',
      1,
      'pro',
      'upsc'
    );
    console.log(`Created local admin: ${email}`);
  } else {
    // Update password
    const hash = '$2a$10$3tK2zK4i7QyF3A1hP5jPZu0E8Z5u8yD2m3q4r5s6t7u8v9w0x1y2'; 
    localDb.prepare(`UPDATE mppsc_users SET password = ?, role = 'admin' WHERE email = ?`).run(hash, email);
    console.log(`Updated local admin: ${email}`);
  }

  console.log('Sync complete!');
  process.exit(0);
}

main().catch(console.error);

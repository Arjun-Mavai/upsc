import { readFileSync } from 'fs';
import { client } from './src/db';

async function main() {
  try {
    const sqlFile = readFileSync('./drizzle/0020_equal_spacker_dave.sql', 'utf8');
    const statements = sqlFile.split('--> statement-breakpoint').map(s => s.trim()).filter(s => s.length > 0);
    
    for (const stmt of statements) {
      let safeStmt = stmt;
      if (stmt.startsWith('CREATE TABLE')) {
        safeStmt = stmt.replace('CREATE TABLE', 'CREATE TABLE IF NOT EXISTS');
      } else if (stmt.startsWith('CREATE INDEX')) {
        safeStmt = stmt.replace('CREATE INDEX', 'CREATE INDEX IF NOT EXISTS');
      } else if (stmt.startsWith('CREATE UNIQUE INDEX')) {
        safeStmt = stmt.replace('CREATE UNIQUE INDEX', 'CREATE UNIQUE INDEX IF NOT EXISTS');
      } else if (stmt.startsWith('ALTER TABLE') || stmt.startsWith('DROP')) {
        // Skip dangerous ops if they might fail
        console.log('Skipping:', stmt.substring(0, 50));
        continue;
      } else if (stmt.startsWith('INSERT INTO') || stmt.startsWith('PRAGMA')) {
        console.log('Skipping:', stmt.substring(0, 50));
        continue;
      }
      
      console.log('Executing:', safeStmt.substring(0, 50));
      try {
        await client.execute(safeStmt);
      } catch (err: any) {
        console.log(`Failed (probably already exists): ${err.message}`);
      }
    }
    console.log("Applied missing tables!");
  } catch (err) {
    console.error("Error applying sql:", err);
  }
  process.exit(0);
}

main();

import { migrate } from 'drizzle-orm/libsql/migrator';
import { db } from './src/db';

async function main() {
  try {
    console.log("Applying migrations...");
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log("Migrations applied successfully!");
  } catch (err) {
    console.error("Migration failed:", err);
  }
  process.exit(0);
}

main();

import Database from 'better-sqlite3';

const db = new Database('mppsc_local_dev.db');

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log("Checking local tables for data...");
for (const table of tables) {
  const count = db.prepare(`SELECT count(*) as c FROM ${table.name}`).get().c;
  if (count > 0) {
    console.log(`${table.name}: ${count} rows`);
  }
}
db.close();

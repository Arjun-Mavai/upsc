import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

async function main() {
  const localDb = new Database('mppsc_local_dev.db');
  
  const email = 'local@upsc.com';
  const password = 'LocalPassword123!';
  
  // Generate a REAL bcrypt hash
  const hash = await bcrypt.hash(password, 10);
  
  localDb.prepare(`UPDATE mppsc_users SET password = ?, role = 'admin', is_active = 1 WHERE email = ?`).run(hash, email);
  
  console.log(`Successfully updated hash for ${email} with password: ${password}`);
  localDb.close();
  process.exit(0);
}

main().catch(console.error);

import Database from 'better-sqlite3';

async function main() {
  const localDb = new Database('mppsc_local_dev.db');
  
  const emails = ['local@upsc.com', 'admin@upsc.com'];
  
  const grants = JSON.stringify(["upsc_pre", "upsc_mains", "mppsc_pre", "mppsc_mains"]);

  for (const email of emails) {
    const info = localDb.prepare(`
      UPDATE mppsc_users 
      SET is_subscribed = 1, 
          plan_tier = 'pro', 
          access_grants = ? 
      WHERE email = ?
    `).run(grants, email);
    
    console.log(`Updated grants for ${email}: ${info.changes} rows changed.`);
  }
  
  localDb.close();
  process.exit(0);
}

main().catch(console.error);

import { config } from 'dotenv';
config({ path: '.env' });
config({ path: '.env.local', override: true });

import { db } from '../src/db/index';
import { mppscUsers as users } from '../src/db/schema';
import { hash } from 'bcryptjs';

async function run() {
  const passwordHash = await hash('ZenAdmin@123', 10);
  await db.insert(users).values({
    id: 'local_admin_2026',
    name: 'Zen Admin',
    email: 'admin@zenscroll.app',
    phone: '9999999999',
    password: passwordHash,
    role: 'admin',
    planTier: 'combo',
    isSubscribed: true,
    accessGrants: '["upsc_pre", "upsc_mains"]',
  }).onConflictDoUpdate({
    target: users.email,
    set: {
      password: passwordHash,
      role: 'admin',
      planTier: 'combo',
      accessGrants: '["upsc_pre", "upsc_mains"]'
    }
  });
  console.log('✅ Admin user created/updated in local DB with Mains Access!');
  process.exit(0);
}
run().catch(console.error);

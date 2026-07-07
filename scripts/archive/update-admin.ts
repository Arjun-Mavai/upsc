import { db } from './src/db';
import { mppscUsers } from './src/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

async function main() {
  const email = 'admin@upsc.com';
  const password = 'AdminPassword123!';
  const hashedPassword = await bcrypt.hash(password, 10);
  
  await db.update(mppscUsers)
    .set({ password: hashedPassword })
    .where(eq(mppscUsers.email, email));
  
  console.log(`Updated admin ${email} password to: ${password}`);
  process.exit(0);
}

main().catch(console.error);

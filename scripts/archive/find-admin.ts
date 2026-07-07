import { db } from './src/db';
import { mppscUsers } from './src/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

async function main() {
  const admins = await db.select({ email: mppscUsers.email, name: mppscUsers.name }).from(mppscUsers).where(eq(mppscUsers.role, 'admin'));
  if (admins.length > 0) {
    console.log("Admin users found:", admins);
  } else {
    console.log("No admin users found. Creating one...");
    const email = 'admin@zenscroll.app';
    const password = 'AdminPassword123!';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    await db.insert(mppscUsers).values({
      id: uuidv4(),
      name: 'Super Admin',
      email: email,
      password: hashedPassword,
      role: 'admin',
      isActive: true,
      planTier: 'pro',
      examType: 'upsc',
    });
    
    console.log(`Created new admin: Email: ${email} | Password: ${password}`);
  }
  process.exit(0);
}

main().catch(console.error);

import { db } from '../src/db';
import { mppscUsers } from '../src/db/schema';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

async function main() {
  const email = 'arju@gmail.com';
  const passwordStr = 'Arjun@123';
  
  // Check if user exists
  const existing = await db.select().from(mppscUsers).where(eq(mppscUsers.email, email)).limit(1);
  
  const hashedPassword = await bcrypt.hash(passwordStr, 10);

  if (existing.length > 0) {
    console.log(`User ${email} already exists. Updating to admin + upsc...`);
    await db.update(mppscUsers).set({
      role: 'admin',
      examType: 'upsc',
      password: hashedPassword, // Reset password
      isActive: true,
      deletedAt: null
    }).where(eq(mppscUsers.email, email));
    console.log('Updated successfully!');
  } else {
    console.log(`Creating new user ${email}...`);
    await db.insert(mppscUsers).values({
      id: uuidv4(),
      email,
      name: 'Arjun',
      password: hashedPassword,
      role: 'admin',
      examType: 'upsc',
      isActive: true
    });
    console.log('Created successfully!');
  }
}

main().catch(console.error);

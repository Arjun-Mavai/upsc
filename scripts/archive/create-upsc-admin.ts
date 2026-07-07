import 'dotenv/config';
import { db } from './src/db';
import { mppscUsers } from './src/db/schema';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

async function createAdmin() {
  const email = 'admin@upsc.com';
  const password = 'Admin@123456'; // Strong password
  const name = 'UPSC Admin';
  
  console.log(`Checking if user ${email} exists...`);
  
  const existingUsers = await db.select().from(mppscUsers).where(
    eq(mppscUsers.email, email)
  );

  const hashedPassword = await bcrypt.hash(password, 10);
  const now = new Date();
  const expiresAt = new Date();
  expiresAt.setMonth(now.getMonth() + 6); // 6 months access

  if (existingUsers.length > 0) {
    console.log('User already exists, updating to PRO with admin access...');
    await db.update(mppscUsers)
      .set({
        role: 'admin',
        planTier: 'pro',
        isActive: true,
        examType: 'upsc',
        accessGrants: JSON.stringify(["upsc_pre", "upsc_mains"]),
        accessExpiresAt: expiresAt,
        password: hashedPassword, // Reset password to be sure
      })
      .where(eq(mppscUsers.email, email));
    
    console.log('User updated successfully.');
  } else {
    console.log('Creating new admin user...');
    await db.insert(mppscUsers).values({
      id: uuidv4(),
      email: email,
      password: hashedPassword,
      name: name,
      role: 'admin',
      planTier: 'pro',
      isSubscribed: true,
      isActive: true,
      examType: 'upsc',
      accessGrants: JSON.stringify(["upsc_pre", "upsc_mains"]),
      accessExpiresAt: expiresAt,
    });
    console.log('User created successfully.');
  }
  
  console.log(`
  =========================================
  ADMIN USER DETAILS:
  Email: ${email}
  Password: ${password}
  Plan: pro
  Role: admin
  Grants: ["upsc_pre", "upsc_mains"]
  Expiry: 6 Months
  =========================================
  `);
}

createAdmin()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

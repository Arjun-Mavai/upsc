import 'dotenv/config';
import { db } from './src/db/index';
import { mppscUsers } from './src/db/schema';
async function main() {
  const users = await db.select().from(mppscUsers);
  console.log("Users in DB:");
  for (const u of users) {
    console.log(`ID: ${u.id}, Email: ${u.email}, Role: ${u.role}, ExamType: ${u.examType}, IsActive: ${u.isActive}`);
  }
  process.exit(0);
}
main();

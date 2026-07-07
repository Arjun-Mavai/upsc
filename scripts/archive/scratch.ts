import 'dotenv/config';
import { db } from './src/db/index';
import { mppscUsers } from './src/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
  try {
    const user = await db.query.mppscUsers.findFirst({
      where: eq(mppscUsers.email, 'admin@upsc.com'),
    });
    console.log("Admin user in DB:", {
      id: user?.id,
      email: user?.email,
      sessionVersion: user?.sessionVersion,
    });
  } catch (error) {
    console.error("Error querying DB:", error);
  }
  process.exit(0);
}
main();

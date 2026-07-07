import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env' });
loadEnv({ path: '.env.local', override: true });
import { createClient } from '@libsql/client';

async function main() {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  console.log('Creating table directly...');
  try {
    await client.execute(`CREATE TABLE IF NOT EXISTS \`intelligence_feedback\` (
      \`id\` text PRIMARY KEY NOT NULL,
      \`guest_id\` text,
      \`question_id\` text NOT NULL,
      \`question_text\` text,
      \`test_id\` text,
      \`reaction\` text NOT NULL,
      \`message\` text,
      \`is_pro\` integer DEFAULT false,
      \`source\` text,
      \`user_id\` text,
      \`user_name\` text,
      \`user_mobile\` text,
      \`user_email\` text,
      \`created_at\` integer DEFAULT (strftime('%s', 'now')),
      \`exam_type\` text DEFAULT 'upsc' NOT NULL,
      FOREIGN KEY (\`guest_id\`) REFERENCES \`guests\`(\`id\`) ON UPDATE no action ON DELETE no action
    );`);
    console.log('Table intelligence_feedback created.');
    
    // Also run the alter table
    try {
      await client.execute(`ALTER TABLE \`guests\` ADD \`lead_source\` text;`);
      console.log('Column lead_source added to guests.');
    } catch(e) {
      console.log('lead_source already exists or error:', e.message);
    }
  } catch (err) {
    console.error('Failed:', err);
  }
}
main();

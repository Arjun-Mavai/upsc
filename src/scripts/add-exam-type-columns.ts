import { config } from 'dotenv';
import * as path from 'path';

const cwd = process.cwd();
config({ path: path.join(cwd, '.env') });
config({ path: path.join(cwd, '.env.local'), override: true });

async function addColumns() {
  const { db } = await import('../db');
  
  const alters = [
    `ALTER TABLE feedbacks ADD COLUMN exam_type text DEFAULT 'upsc' NOT NULL;`,
    `ALTER TABLE free_quiz_attempts ADD COLUMN exam_type text DEFAULT 'upsc' NOT NULL;`,
    `ALTER TABLE guests ADD COLUMN exam_type text DEFAULT 'upsc' NOT NULL;`,
    `ALTER TABLE mppsc_users ADD COLUMN exam_type text DEFAULT 'upsc' NOT NULL;`,
    `ALTER TABLE mppsc_users ADD COLUMN access_grants text DEFAULT '["upsc_pre"]';`,
    `ALTER TABLE mppsc_users ADD COLUMN session_version integer DEFAULT 1;`,
    `ALTER TABLE payments ADD COLUMN exam_type text DEFAULT 'upsc' NOT NULL;`,
    `ALTER TABLE questions ADD COLUMN exam_type text DEFAULT 'upsc' NOT NULL;`,
    `ALTER TABLE test_feedback ADD COLUMN exam_type text DEFAULT 'upsc' NOT NULL;`,
    `ALTER TABLE tests ADD COLUMN exam_type text DEFAULT 'upsc' NOT NULL;`,
    `ALTER TABLE user_attempts ADD COLUMN exam_type text DEFAULT 'upsc' NOT NULL;`,
    `ALTER TABLE payment_exit_reasons ADD COLUMN exam_type text DEFAULT 'upsc' NOT NULL;`,
    `ALTER TABLE support_tickets ADD COLUMN exam_type text DEFAULT 'upsc' NOT NULL;`,
    `ALTER TABLE syllabus_topics ADD COLUMN exam_type text DEFAULT 'upsc' NOT NULL;`,
    `ALTER TABLE content_blogs ADD COLUMN exam_type text DEFAULT 'upsc' NOT NULL;`,
    `ALTER TABLE mains_content ADD COLUMN exam_type text DEFAULT 'upsc' NOT NULL;`,
    `ALTER TABLE mains_papers ADD COLUMN exam_type text DEFAULT 'upsc' NOT NULL;`,
    `ALTER TABLE mains_topic_expected_questions ADD COLUMN exam_type text DEFAULT 'upsc' NOT NULL;`,
    `ALTER TABLE mains_topic_theory_structured ADD COLUMN exam_type text DEFAULT 'upsc' NOT NULL;`,
    `ALTER TABLE mains_topics ADD COLUMN exam_type text DEFAULT 'upsc' NOT NULL;`,
    `ALTER TABLE mains_units ADD COLUMN exam_type text DEFAULT 'upsc' NOT NULL;`
  ];

  console.log('🚀 Running manual ALTER TABLE migrations for exam_type...');

  for (const q of alters) {
    try {
      await db.run(q);
      console.log('✅ Success:', q);
    } catch (e: any) {
      if (e.message && e.message.includes('duplicate column name')) {
        console.log('⏭️ Column already exists, skipping:', q);
      } else {
        console.error('❌ Failed:', q, e.message);
      }
    }
  }
  console.log('🎉 Done adding columns!');
}

addColumns()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('Fatal:', e);
    process.exit(1);
  });

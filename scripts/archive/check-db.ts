import { db, client } from './src/db';

async function main() {
  try {
    const res = await client.execute("PRAGMA table_info(mains_pyq_papers);");
    console.log("mains_pyq_papers schema:", res.rows);
    
    // Also check mains_papers schema for exam_type
    const res2 = await client.execute("PRAGMA table_info(mains_papers);");
    console.log("mains_papers schema:", res2.rows);

    const res3 = await client.execute("PRAGMA table_info(syllabus_topics);");
    console.log("syllabus_topics schema:", res3.rows.filter((r: any) => r.name === 'exam_type' || r.name === 'is_hidden'));
  } catch (err) {
    console.error("Error querying db:", err);
  }
  process.exit(0);
}

main();

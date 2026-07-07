import { client } from './src/db';

async function main() {
  try {
    const res = await client.execute("PRAGMA table_info(mains_pyq_papers);");
    console.log("mains_pyq_papers columns:", res.rows.map((r: any) => r.name));
    
  } catch (err) {
    console.error("Error querying db:", err);
  }
  process.exit(0);
}

main();

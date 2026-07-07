import { client } from './src/db';

async function main() {
  try {
    await client.execute('ALTER TABLE mains_pyq_questions ADD current_affairs_data text;');
    console.log("Added column successfully");
  } catch (err: any) {
    console.log("Error or already exists:", err.message);
  }
  process.exit(0);
}
main();

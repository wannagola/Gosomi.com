
import { pool } from "../src/db.js";

async function main() {
  try {
    const [rows] = await pool.query("SELECT id, nickname FROM users LIMIT 5");
    console.log("Users:", rows);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

main();

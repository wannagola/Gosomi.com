
import { pool } from "../src/db.js";

async function main() {
  try {
    const [rows] = await pool.query("SELECT id, status, penalty_choice, penalty_selected FROM cases WHERE id = 7");
    console.log(JSON.stringify(rows[0], null, 2));
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

main();

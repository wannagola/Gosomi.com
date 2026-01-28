
import { pool } from "./src/db.js";

async function check() {
  try {
    const [cases] = await pool.query("SELECT id, status FROM cases ORDER BY id DESC LIMIT 1");
    if (cases.length === 0) { console.log("NONE"); process.exit(0); }
    
    const c = cases[0];
    console.log(`CASE_ID:${c.id} STATUS:${c.status}`);

    const [defenses] = await pool.query("SELECT id FROM defenses WHERE case_id = ?", [c.id]);
    console.log(`DEFENSE_COUNT:${defenses.length}`);

  } catch (e) {
    console.error(e);
  } finally {
      process.exit();
  }
}
check();

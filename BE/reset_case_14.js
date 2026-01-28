
import { pool } from "./src/db.js";

async function reset() {
  try {
    const caseId = 14; 
    console.log(`Resetting case ${caseId}...`);

    await pool.query("DELETE FROM defenses WHERE case_id = ?", [caseId]);
    await pool.query("UPDATE cases SET status='SUMMONED' WHERE id = ?", [caseId]);
    
    console.log("DONE");
  } catch (e) {
    console.error(e);
  } finally {
      process.exit();
  }
}
reset();

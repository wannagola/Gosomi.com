
import { pool } from "./src/db.js";

async function check() {
  try {
    // Get latest case
    const [cases] = await pool.query("SELECT * FROM cases ORDER BY id DESC LIMIT 1");
    if (cases.length === 0) {
      console.log("No cases found.");
      process.exit(0);
    }
    const c = cases[0];
    console.log("Latest Case:", { 
        id: c.id, 
        title: c.title, 
        status: c.status, 
        plaintiff: c.plaintiff_id, 
        defendant: c.defendant_id 
    });

    // Check defense
    const [defenses] = await pool.query("SELECT * FROM defenses WHERE case_id = ?", [c.id]);
    console.log("Defenses:", defenses);

    // Check notifications for this case
    const [notifs] = await pool.query("SELECT * FROM notifications WHERE case_id = ? ORDER BY id DESC", [c.id]);
    console.log("Notifications:", notifs);

  } catch (e) {
    console.error(e);
  } finally {
      process.exit();
  }
}

check();

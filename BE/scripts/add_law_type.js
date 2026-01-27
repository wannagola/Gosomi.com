import { pool } from '../src/db.js';

async function migrate() {
  try {
    console.log("Adding law_type column to cases table...");
    await pool.query("ALTER TABLE cases ADD COLUMN law_type VARCHAR(50)");
    console.log("Migration successful!");
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME') {
      console.log("Column law_type already exists.");
    } else {
      console.error("Migration failed:", e);
    }
  } finally {
    process.exit();
  }
}

migrate();

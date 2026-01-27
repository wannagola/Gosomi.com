
import { pool } from "../src/db.js";

async function main() {
  console.log("Checking DB Schema...");
  try {
    // 1. Create jurors table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS jurors (
        id INT AUTO_INCREMENT PRIMARY KEY,
        case_id INT NOT NULL,
        user_id INT NOT NULL,
        status VARCHAR(50) DEFAULT 'INVITED',
        vote VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (case_id) REFERENCES cases(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);
    console.log("jurors table checked.");

    // 2. Add columns to cases if not exists
    // Helper function to add column safely
    const addColumn = async (table, column, definition) => {
      try {
        await pool.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
        console.log(`Added column ${column} to ${table}`);
      } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') {
          console.log(`Column ${column} already exists in ${table}`);
        } else {
          console.error(`Error adding ${column} to ${table}:`, e.message);
        }
      }
    };

    await addColumn('cases', 'jury_enabled', 'BOOLEAN DEFAULT FALSE');
    await addColumn('cases', 'jury_mode', 'VARCHAR(50)');
    await addColumn('cases', 'jury_invite_token', 'VARCHAR(255)');
    
    console.log("Schema update completed.");
    process.exit(0);
  } catch (e) {
    console.error("Schema update failed:", e);
    process.exit(1);
  }
}

main();

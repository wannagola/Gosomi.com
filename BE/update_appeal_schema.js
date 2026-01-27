
import { pool } from "./src/db.js";

async function updateSchemaForAppeal() {
    try {
        console.log("Updating schema for Appeal Feature...");

        // 1. Update cases table
        console.log("Adding columns to cases table...");
        try {
            await pool.query(`
        ALTER TABLE cases
        ADD COLUMN appeal_status ENUM('NONE', 'REQUESTED', 'RESPONDED', 'DONE') DEFAULT 'NONE',
        ADD COLUMN appellant_id INT DEFAULT NULL,
        ADD COLUMN appeal_reason TEXT DEFAULT NULL,
        ADD COLUMN appeal_response TEXT DEFAULT NULL
        `);
            console.log("cases table updated.");
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log("cases table columns already exist.");
            else throw e;
        }

        // 2. Update evidences table
        console.log("Adding stage column to evidences table...");
        try {
            await pool.query(`
        ALTER TABLE evidences
        ADD COLUMN stage ENUM('INITIAL', 'APPEAL') DEFAULT 'INITIAL'
        `);
            console.log("evidences table updated.");
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log("evidences table column already exists.");
            else throw e;
        }

        console.log("Schema update complete!");

    } catch (e) {
        console.error("Schema update failed:", e);
    } finally {
        await pool.end();
    }
}

updateSchemaForAppeal();

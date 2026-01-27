import { pool } from "./src/db.js";

async function checkDatabase() {
    try {
        console.log("Checking DB connection...");
        const [tables] = await pool.query("SHOW TABLES");
        console.log("TABLES FOUND:", tables.map(t => Object.values(t)[0]).join(", "));

        const tableNames = [
            "users", "cases", "evidences", "defenses",
            "jurors", "notifications", "friend_requests", "friends"
        ];

        console.log("\n--- TABLE STATUS ---");
        for (const table of tableNames) {
            const [[{ count }]] = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
            console.log(`${table.padEnd(20)}: ${count} rows`);
        }

        process.exit(0);
    } catch (e) {
        console.error("DB ERROR:", e.message);
        process.exit(1);
    }
}

checkDatabase();

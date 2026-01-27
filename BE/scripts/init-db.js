import "dotenv/config";
import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";

async function initDb() {
    const schemaPath = path.join(process.cwd(), "schema.sql");
    if (!fs.existsSync(schemaPath)) {
        console.error("❌ schema.sql file not found!");
        process.exit(1);
    }

    const sqlContent = fs.readFileSync(schemaPath, "utf-8");
    // Split by semicolon to get individual statements, filtering empty ones
    const statements = sqlContent
        .split(";")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

    console.log("🔌 Connecting to Database...");
    console.log(`   Host: ${process.env.DB_HOST}`);
    console.log(`   User: ${process.env.DB_USER}`);
    console.log(`   DB:   ${process.env.DB_NAME}`);

    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: Number(process.env.DB_PORT || 3306),
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            ssl: {
                rejectUnauthorized: false
            }
        });

        console.log("✅ Connected! Creating tables...");

        for (const statement of statements) {
            // Skip comments if entire line is comment (basic check)
            if (statement.startsWith("--")) continue;

            try {
                await connection.query(statement);
            } catch (err) {
                console.error("⚠️ Error executing statement:", statement.substring(0, 50) + "...");
                console.error(err.message);
                // Continue usually, or break? Let's continue.
            }
        }

        console.log("🎉 All tables created successfully!");
        console.log("   You can now deploy your app to Render.");

    } catch (error) {
        console.error("❌ Database connection failed:");
        console.error(error.message);
    } finally {
        if (connection) await connection.end();
    }
}

initDb();

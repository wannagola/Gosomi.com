
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const config = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: { rejectUnauthorized: false }
};

const pool = mysql.createPool(config);

async function runTest() {
    let conn;
    try {
        conn = await pool.getConnection();
        console.log('Connected.');
        
        const [rows] = await conn.query("DESCRIBE users");
        console.log('Users Table Schema:');
        rows.forEach(row => console.log(`${row.Field} (${row.Type})`));

    } catch (err) {
        console.error('Error:', err);
    } finally {
        if (conn) conn.release();
        await pool.end();
    }
}

runTest();

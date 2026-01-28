
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
        
        const [desc] = await conn.query("DESCRIBE users");
        console.log('Columns:', desc.map(d => d.Field).join(', '));
        
        // Check for 'email' specifically
        const emailCol = desc.find(d => d.Field === 'email');
        if (emailCol) {
            console.log('Email column details:', JSON.stringify(emailCol));
        } else {
            console.log('Email column NOT found.');
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        if (conn) conn.release();
        await pool.end();
    }
}

runTest();

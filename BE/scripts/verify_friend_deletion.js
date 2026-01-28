
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
        console.log('Connecting to database...');
        conn = await pool.getConnection();
        console.log('Connected.');

        // 1. Create two test users
        console.log('Creating test users...');
        const ts = Date.now();
        const kakaoId1 = `test_k_1_${ts}`;
        const kakaoId2 = `test_k_2_${ts}`;
        const username1 = `test_user_1_${ts}`;
        const username2 = `test_user_2_${ts}`;

        // Schema requires: username, password, nickname, kakao_id, profile_image
        const [u1] = await conn.query(
            "INSERT INTO users (username, password, nickname, kakao_id, profile_image) VALUES (?, 'DUMMY_PW', 'TestUser1', ?, '')", 
            [username1, kakaoId1]
        );
        const userId1 = u1.insertId;

        const [u2] = await conn.query(
            "INSERT INTO users (username, password, nickname, kakao_id, profile_image) VALUES (?, 'DUMMY_PW', 'TestUser2', ?, '')", 
            [username2, kakaoId2]
        );
        const userId2 = u2.insertId;

        console.log(`Created users: ${userId1}, ${userId2}`);

        // 2. Create mutual friendship
        console.log('Creating mutual friendship...');
        await conn.query("INSERT INTO friends (user_id, friend_id) VALUES (?, ?)", [userId1, userId2]);
        await conn.query("INSERT INTO friends (user_id, friend_id) VALUES (?, ?)", [userId2, userId1]);

        // Verify friendship exists
        const [rowsBefore] = await conn.query("SELECT * FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)", [userId1, userId2, userId2, userId1]);
        if (rowsBefore.length !== 2) {
            throw new Error(`Setup failed: Expected 2 friendship rows, found ${rowsBefore.length}`);
        }
        console.log('Friendship established (2 rows verified).');

        // 3. Execute Deletion Logic
        console.log('Executing mutual deletion...');
        await conn.beginTransaction();
        const [deleteResult] = await conn.query(
            "DELETE FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)",
            [userId1, userId2, userId2, userId1]
        );
        await conn.commit();
        
        console.log(`Deleted rows reported: ${deleteResult.affectedRows}`);

        // 4. Verify Deletion
        const [rowsAfter] = await conn.query("SELECT * FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)", [userId1, userId2, userId2, userId1]);
        
        if (rowsAfter.length === 0) {
            console.log('SUCCESS: All friendship rows deleted.');
        } else {
            console.error(`FAILURE: Found ${rowsAfter.length} rows remaining.`);
        }

        // Cleanup
        console.log('Cleaning up test users...');
        await conn.query("DELETE FROM users WHERE id IN (?, ?)", [userId1, userId2]);
        console.log('Cleanup complete.');

    } catch (err) {
        console.error('Test Failed:', err);
        if (conn) await conn.rollback();
    } finally {
        if (conn) conn.release();
        await pool.end();
        process.exit(0);
    }
}

runTest();

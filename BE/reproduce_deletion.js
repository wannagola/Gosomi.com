import { pool } from "./src/db.js";

async function run() {
    console.log("Start reproduction...");

    // 1. Create User A and User B
    const rand = Math.floor(Math.random() * 10000);
    const userA = `UserA_${rand}`;
    const userB = `UserB_${rand}`;

    try {
        const [resA] = await pool.query("INSERT INTO users (kakao_id, nickname, profile_image, username, password) VALUES (?, ?, ?, ?, ?)", [`K${rand}A`, userA, 'imgA', `usernameA_${rand}`, 'dummy']);
        const idA = resA.insertId;

        const [resB] = await pool.query("INSERT INTO users (kakao_id, nickname, profile_image, username, password) VALUES (?, ?, ?, ?, ?)", [`K${rand}B`, userB, 'imgB', `usernameB_${rand}`, 'dummy']);
        const idB = resB.insertId;

        console.log(`Created Users: ${idA} (${userA}), ${idB} (${userB})`);

        // 2. Make them friends (Insert both ways)
        await pool.query("INSERT INTO friends (user_id, friend_id) VALUES (?, ?)", [idA, idB]);
        await pool.query("INSERT INTO friends (user_id, friend_id) VALUES (?, ?)", [idB, idA]);
        console.log("Friendship established.");

        // Verify
        const [check1] = await pool.query("SELECT * FROM friends WHERE (user_id=? AND friend_id=?) OR (user_id=? AND friend_id=?)", [idA, idB, idB, idA]);
        console.log("Before Delete Count:", check1.length); // Should be 2

        // 3. Execute Delete Query (Same as Router)
        // "DELETE FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)"
        // logic: if A deletes B, we remove A->B and B->A
        const userId = idA;
        const friendId = idB;

        console.log(`Deleting friendship between ${userId} and ${friendId}...`);
        const [delRes] = await pool.query(
            "DELETE FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)",
            [userId, friendId, friendId, userId]
        );
        console.log("Deleted Rows:", delRes.affectedRows);

        // 4. Verify
        const [check2] = await pool.query("SELECT * FROM friends WHERE (user_id=? AND friend_id=?) OR (user_id=? AND friend_id=?)", [idA, idB, idB, idA]);
        console.log("After Delete Count:", check2.length); // Should be 0

        if (check2.length === 0) {
            console.log("SUCCESS: Backend logic is correct.");
        } else {
            console.log("FAILURE: Backend logic failed to delete mutual friendship.");
        }

    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

run();

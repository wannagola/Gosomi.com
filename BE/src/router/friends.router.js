import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

// GET /api/friends/search?q=nickname&userId=123
router.get("/search", async (req, res) => {
    try {
        const { q, userId } = req.query;
        if (!q) return res.status(400).json({ error: "query required" });

        const searchPattern = `%${q}%`;
        let query = "SELECT id, nickname, profile_image FROM users WHERE nickname LIKE ? LIMIT 20";
        let params = [searchPattern];

        if (userId) {
            query = "SELECT id, nickname, profile_image FROM users WHERE nickname LIKE ? AND id != ? LIMIT 20";
            params = [searchPattern, userId];
        }

        const [rows] = await pool.query(query, params);

        // Check friendship status for each result could be nice, but simple search first.
        return res.json({ ok: true, data: rows });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
});

// GET /api/friends?userId=123
router.get("/", async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) return res.status(400).json({ error: "userId required" });

        const [rows] = await pool.query(
            `SELECT 
                u.id, 
                u.nickname, 
                u.kakao_id, 
                u.profile_image,
                u.win_rate,
                (
                    SELECT COUNT(*) FROM cases 
                    WHERE (plaintiff_id = u.id OR defendant_id = u.id) AND status = 'COMPLETED'
                ) AS total_resolved,
                (
                    SELECT COUNT(*) FROM cases 
                    WHERE status = 'COMPLETED' AND (
                        (plaintiff_id = u.id AND CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(fault_ratio, ':', -1), '}', 1) AS UNSIGNED) > CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(fault_ratio, ':', 2), ',', -1) AS UNSIGNED))
                        OR 
                        (defendant_id = u.id AND CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(fault_ratio, ':', 2), ',', -1) AS UNSIGNED) > CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(fault_ratio, ':', -1), '}', 1) AS UNSIGNED))
                    )
                ) AS wins
            FROM friends f
            JOIN users u ON f.friend_id = u.id
            WHERE f.user_id = ?`,
            [userId]
        );

        // Map data for response
        const data = rows.map(r => ({
            id: r.id,
            nickname: r.nickname,
            profileImage: r.profile_image,
            total_resolved: r.total_resolved,
            wins: r.wins,
            winRate: r.win_rate || 50 // Use database value
        }));

        return res.json({ ok: true, data });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
});

// POST /api/friends/request : Send Friend Request
router.post("/request", async (req, res) => {
    try {
        const { userId, friendId } = req.body;
        if (!userId || !friendId) return res.status(400).json({ error: "userId and friendId required" });

        // Self check
        if (Number(userId) === Number(friendId)) return res.status(400).json({ error: "cannot add yourself" });

        // Check existing friendship
        const [friends] = await pool.query(
            "SELECT id FROM friends WHERE user_id = ? AND friend_id = ?",
            [userId, friendId]
        );
        if (friends.length > 0) return res.status(409).json({ error: "already friends" });

        // Check existing request
        const [requests] = await pool.query(
            "SELECT id, status FROM friend_requests WHERE from_user_id = ? AND to_user_id = ? AND status='PENDING'",
            [userId, friendId]
        );
        if (requests.length > 0) return res.status(409).json({ error: "request already sent" });

        await pool.query(
            "INSERT INTO friend_requests (from_user_id, to_user_id) VALUES (?, ?)",
            [userId, friendId]
        );

        // Notify Target
        await pool.query(
            `INSERT INTO notifications (user_id, type, message, case_id) VALUES (?, 'FRIEND_REQUEST', 'You have a new friend request.', 0)`, // Use 0 for case_id as friend request
            [friendId]
        );

        return res.status(201).json({ ok: true });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
});

// GET /api/friends/requests?userId=123 : List incoming requests
router.get("/requests", async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) return res.status(400).json({ error: "userId required" });

        const [rows] = await pool.query(
            `SELECT r.id, r.from_user_id, u.nickname, u.profile_image, r.created_at
       FROM friend_requests r
       JOIN users u ON r.from_user_id = u.id
       WHERE r.to_user_id = ? AND r.status = 'PENDING'
       ORDER BY r.created_at DESC`,
            [userId]
        );

        return res.json({ ok: true, data: rows });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
});

// POST /api/friends/accept : Accept Request
router.post("/accept", async (req, res) => {
    try {
        const { requestId } = req.body;
        if (!requestId) return res.status(400).json({ error: "requestId required" });

        // Get Request info
        const [rows] = await pool.query("SELECT * FROM friend_requests WHERE id = ?", [requestId]);
        if (rows.length === 0) return res.status(404).json({ error: "request not found" });
        const reqRow = rows[0];

        if (reqRow.status !== 'PENDING') return res.status(400).json({ error: "request not pending" });

        const client = await pool.getConnection();
        try {
            await client.beginTransaction();

            // Update Request Status
            await client.query("UPDATE friend_requests SET status='ACCEPTED' WHERE id=?", [requestId]);

            // Insert Friends (Both ways)
            await client.query("INSERT INTO friends (user_id, friend_id) VALUES (?, ?)", [reqRow.from_user_id, reqRow.to_user_id]);
            await client.query("INSERT INTO friends (user_id, friend_id) VALUES (?, ?)", [reqRow.to_user_id, reqRow.from_user_id]);

            // Notify Sender
            await client.query(
                `INSERT INTO notifications (user_id, type, message, case_id) VALUES (?, 'FRIEND_REQUEST', 'Your friend request was accepted.', 0)`,
                [reqRow.from_user_id]
            );

            await client.commit();
            res.json({ ok: true });
        } catch (err) {
            await client.rollback();
            throw err;
        } finally {
            client.release();
        }
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
});

// DELETE /api/friends : Mutual Friend Deletion
router.delete("/", async (req, res) => {
    try {
        // userId and friendId can be in body or query
        const body = req.body || {};
        const userId = body.userId || req.query.userId;
        const friendId = body.friendId || req.query.friendId;

        console.log('DELETE /api/friends called with:', { userId, friendId, body: req.body, query: req.query });

        if (!userId || !friendId) return res.status(400).json({ error: "userId and friendId required" });

        const client = await pool.getConnection();
        try {
            await client.beginTransaction();

            // 1. Delete friendship (Both ways)
            const [deleteResult] = await client.query(
                "DELETE FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)",
                [userId, friendId, friendId, userId]
            );
            console.log('Deleted friendships:', deleteResult.affectedRows, 'rows');

            // 2. Delete related friend requests (to allow re-requesting later)
            const [requestResult] = await client.query(
                "DELETE FROM friend_requests WHERE (from_user_id = ? AND to_user_id = ?) OR (from_user_id = ? AND to_user_id = ?)",
                [userId, friendId, friendId, userId]
            );
            console.log('Deleted friend requests:', requestResult.affectedRows, 'rows');

            await client.commit();
            console.log('Friend deletion successful');
            return res.json({ ok: true, message: "Friendship deleted mutually." });
        } catch (err) {
            await client.rollback();
            console.error('Transaction error:', err);
            throw err;
        } finally {
            client.release();
        }
    } catch (e) {
        console.error('DELETE /api/friends error:', e.message);
        return res.status(500).json({ error: e.message });
    }
});

export default router;

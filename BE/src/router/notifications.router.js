import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

// GET /api/notifications?userId=123
router.get("/", async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) return res.status(400).json({ error: "userId required" });

        const [rows] = await pool.query(
            `SELECT n.*, c.case_number, c.title AS case_title 
       FROM notifications n
       LEFT JOIN cases c ON n.case_id = c.id
       WHERE n.user_id = ?
       ORDER BY n.created_at DESC`,
            [userId]
        );

        return res.json({ ok: true, data: rows });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
});

// POST /api/notifications/:id/read
router.post("/:id/read", async (req, res) => {
    try {
        const id = Number(req.params.id);
        await pool.query("UPDATE notifications SET is_read = TRUE WHERE id = ?", [id]);
        return res.json({ ok: true });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
});

export default router;

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

        // Map is_read to read for frontend compatibility AND generate links
        const notifications = rows.map(row => {
            let link = null;
            if (row.case_id) {
                switch (row.type) {
                    case 'SUMMON': link = `/case/${row.case_id}`; break;
                    case 'DEFENSE_SUBMITTED': link = `/case/${row.case_id}`; break;
                    case 'VERDICT_COMPLETED': link = `/case/${row.case_id}/verdict`; break;
                    case 'JUROR_INVITED': link = `/case/${row.case_id}/jury`; break;
                    case 'APPEAL_REQUESTED': link = `/case/${row.case_id}/appeal`; break;
                    case 'APPEAL_VERDICT_READY': link = `/case/${row.case_id}/verdict`; break;
                    default: link = `/case/${row.case_id}`;
                }
            } else if (row.type === 'FRIEND_REQUEST') {
                link = '/mypage';
            }

            return {
                ...row,
                read: Boolean(row.is_read),
                link
            };
        });

        return res.json({ ok: true, data: notifications });
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

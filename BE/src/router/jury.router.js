import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

// GET /api/jury/cases?userId=X : 특정 유저가 배심원으로 초대받은 사건 목록
router.get("/cases", async (req, res) => {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({ error: "userId is required" });
        }

        // 배심원으로 등록된 사건만 조회 (단, 원고/피고인 경우는 제외)
        const [rows] = await pool.query(
            `SELECT c.id, c.case_number, c.title, c.content, c.status, c.created_at,
              c.plaintiff_id, c.defendant_id,
              p.nickname AS plaintiff_name,
              d.nickname AS defendant_name,
              j.status AS jury_status, j.vote AS jury_vote
       FROM jurors j
       JOIN cases c ON j.case_id = c.id
       JOIN users p ON c.plaintiff_id = p.id
       JOIN users d ON c.defendant_id = d.id
       WHERE j.user_id = ?
       AND c.plaintiff_id != ?
       AND c.defendant_id != ?
       AND c.status NOT IN ('COMPLETED', 'EXPIRED')
       ORDER BY c.created_at DESC`,
            [userId, userId, userId]
        );

        const cases = rows.map(r => ({
            id: r.id,
            caseNumber: r.case_number,
            title: r.title,
            description: r.content, // Using content as description
            content: r.content,
            status: r.status,
            createdAt: r.created_at,
            plaintiff: r.plaintiff_name,
            defendant: r.defendant_name,
            plaintiffId: r.plaintiff_id,
            defendantId: r.defendant_id,
            juryEnabled: true, // Always true for jury cases
            juryStatus: r.jury_status, // INVITED, VOTED
            juryVote: r.jury_vote // PLAINTIFF, DEFENDANT, or null
        }));

        return res.json({
            ok: true,
            data: cases
        });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
});

export default router;

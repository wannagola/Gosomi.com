
import { Router } from "express";
import { pool } from "../db.js";
import { generateVerdictWithGemini } from "../services/verdict.service.js";

const router = Router();

// 1. Appeal Request (항소 신청)
// POST /api/cases/:id/appeal
router.post("/cases/:id/appeal", async (req, res) => {
    try {
        const caseId = Number(req.params.id);
        const { appellantId, reason } = req.body;

        if (!appellantId || !reason) {
            return res.status(400).json({ error: "appellantId and reason are required" });
        }

        // Check case existence and status
        const [rows] = await pool.query("SELECT * FROM cases WHERE id=?", [caseId]);
        if (rows.length === 0) return res.status(404).json({ error: "case not found" });
        const caseRow = rows[0];

        if (caseRow.status !== 'VERDICT_READY' && caseRow.status !== 'VERDICT_DONE') {
            return res.status(400).json({ error: "case must be VERDICT_READY to appeal" });
        }
        if (caseRow.appeal_status !== 'NONE') {
            return res.status(400).json({ error: "appeal already requested or done" });
        }

        await pool.query(
            "UPDATE cases SET appeal_status='REQUESTED', appellant_id=?, appeal_reason=?, status='UNDER_APPEAL' WHERE id=?",
            [appellantId, reason, caseId]
        );

        // 🔔 Notification: Notify Opponent
        // If appellant is plaintiff(plaintiff_id), notify defendant(defendant_id).
        // If appellant is defendant(defendant_id), notify plaintiff(plaintiff_id).
        // Note: ids from DB are numbers, appellantId from body might be string/number. Compare safely.
        const opponentId = (Number(appellantId) === caseRow.plaintiff_id)
            ? caseRow.defendant_id
            : caseRow.plaintiff_id;

        await pool.query(
            `INSERT INTO notifications (user_id, type, message, case_id) VALUES (?, 'APPEAL', 'An appeal has been requested.', ?)`,
            [opponentId, caseId]
        );

        return res.json({ ok: true, caseId, status: 'REQUESTED' });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
});

// 2. Appeal Defense (항소 답변/변론)
// POST /api/cases/:id/appeal/defense
router.post("/cases/:id/appeal/defense", async (req, res) => {
    try {
        const caseId = Number(req.params.id);
        // In a real app we might check who is submitting, but here we assume the opponent.
        const { content } = req.body;

        if (!content) return res.status(400).json({ error: "content is required" });

        const [rows] = await pool.query("SELECT * FROM cases WHERE id=?", [caseId]);
        if (rows.length === 0) return res.status(404).json({ error: "case not found" });
        const caseRow = rows[0];

        if (caseRow.appeal_status !== 'REQUESTED') {
            return res.status(400).json({ error: "appeal must be REQUESTED state" });
        }

        await pool.query(
            "UPDATE cases SET appeal_status='RESPONDED', appeal_response=? WHERE id=?",
            [content, caseId]
        );

        // 🔔 Notification: Notify Appellant (The one who requested appeal)
        if (caseRow.appellant_id) {
            await pool.query(
                "INSERT INTO notifications (user_id, type, message, case_id) VALUES (?, 'APPEAL', 'Opponent has responded to your appeal.', ?)",
                [caseRow.appellant_id, caseId]
            );
        }

        return res.json({ ok: true, caseId, status: 'RESPONDED' });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
});

// 3. Appeal Verdict (재심 판결)
// POST /api/cases/:id/appeal/verdict
router.post("/cases/:id/appeal/verdict", async (req, res) => {
    try {
        const caseId = Number(req.params.id);

        // Use true for isAppeal flag
        const result = await generateVerdictWithGemini(caseId, true);

        if (!result.ok) return res.status(result.status || 500).json({ error: result.error });

        // Update status to DONE and main status to VERDICT_READY (so penalty can be selected if needed, or just COMPLETED if appeal is final)
        // Here, we'll set it to COMPLETED as per Gosomi rules (appeal is final).
        await pool.query("UPDATE cases SET appeal_status='DONE', status='COMPLETED' WHERE id=?", [caseId]);

        // 🔔 Notification: Notify Both (Final Verdict)
        const [caseRows] = await pool.query("SELECT plaintiff_id, defendant_id FROM cases WHERE id=?", [caseId]);
        if (caseRows.length > 0) {
            const { plaintiff_id, defendant_id } = caseRows[0];
            const message = 'Final appeal verdict has been reached.';
            await pool.query("INSERT INTO notifications (user_id, type, message, case_id) VALUES (?, 'VERDICT', ?, ?), (?, 'VERDICT', ?, ?)",
                [plaintiff_id, message, caseId, defendant_id, message, caseId]);
        }

        return res.json(result);
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
});

export default router;

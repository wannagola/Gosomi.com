import { Router } from "express";
import { generateVerdictWithGemini } from "../services/verdict.service.js";
import { pool } from "../db.js";

const router = Router();

// POST /api/cases/:id/verdict
router.post("/cases/:id/verdict", async (req, res) => {
  try {
    const caseId = Number(req.params.id);
    const result = await generateVerdictWithGemini(caseId); // penaltyMode 안씀

    if (!result.ok) return res.status(result.status || 500).json({ error: result.error });

    // 🔔 Notification: Notify Both
    const [caseRows] = await pool.query("SELECT plaintiff_id, defendant_id FROM cases WHERE id=?", [caseId]);
    if (caseRows.length > 0) {
      const { plaintiff_id, defendant_id } = caseRows[0];
      const message = 'The verdict has been reached.';
      await pool.query("INSERT INTO notifications (user_id, type, message, case_id) VALUES (?, 'VERDICT_COMPLETED', ?, ?), (?, 'VERDICT_COMPLETED', ?, ?)",
        [plaintiff_id, message, caseId, defendant_id, message, caseId]);
    }

    return res.json(result);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// POST /api/cases/:id/appeal/verdict
router.post("/cases/:id/appeal/verdict", async (req, res) => {
  try {
    const caseId = Number(req.params.id);
    const result = await generateVerdictWithGemini(caseId, true); // isAppeal = true

    if (!result.ok) return res.status(result.status || 500).json({ error: result.error });

    // 🔔 Notification
    const [caseRows] = await pool.query("SELECT plaintiff_id, defendant_id FROM cases WHERE id=?", [caseId]);
    if (caseRows.length > 0) {
      const { plaintiff_id, defendant_id } = caseRows[0];
      const message = 'The appeal verdict has been reached.';
      await pool.query("INSERT INTO notifications (user_id, type, message, case_id) VALUES (?, 'VERDICT_COMPLETED', ?, ?), (?, 'VERDICT_COMPLETED', ?, ?)",
        [plaintiff_id, message, caseId, defendant_id, message, caseId]);
    }

    return res.json(result);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

export default router;
import { Router } from "express";
import crypto from "crypto";
import { pool } from "../db.js";

const router = Router();

// ✅ POST /api/cases/:id/summon
router.post("/cases/:id/summon", async (req, res) => {
  try {
    const caseId = Number(req.params.id);

    const [caseRows] = await pool.query("SELECT id, defendant_id FROM cases WHERE id = ?", [caseId]);
    if (caseRows.length === 0) return res.status(404).json({ error: "case not found" });
    const defendantId = caseRows[0].defendant_id;

    // 이미 소환장 있으면 그대로 반환
    const [existing] = await pool.query(
      "SELECT token, expires_at FROM summons WHERE case_id = ?",
      [caseId]
    );

    let token, expiresAt;

    if (existing.length > 0) {
      token = existing[0].token;
      expiresAt = existing[0].expires_at;
    } else {
      token = crypto.randomBytes(24).toString("hex");
      expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await pool.query(
        "INSERT INTO summons (case_id, token, expires_at) VALUES (?, ?, ?)",
        [caseId, token, expiresAt]
      );

      await pool.query("UPDATE cases SET status='SUMMONED' WHERE id=?", [caseId]);

      // 🔔 Notification: Notify Defendant
      await pool.query(
        `INSERT INTO notifications (user_id, type, message, case_id) VALUES (?, 'SUMMON', 'You have been summoned.', ?)`,
        [defendantId, caseId]
      );
    }

    return res.status(201).json({ ok: true, caseId, token, expiresAt });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// ✅ POST /api/summons/:token/defense
router.post("/summons/:token/defense", async (req, res) => {
  try {
    const { token } = req.params;
    const { content } = req.body;

    if (!content) return res.status(400).json({ error: "content is required" });

    const [sRows] = await pool.query(
      "SELECT case_id, expires_at FROM summons WHERE token = ?",
      [token]
    );
    if (sRows.length === 0) return res.status(404).json({ error: "invalid token" });

    const { case_id, expires_at } = sRows[0];
    if (new Date(expires_at).getTime() < Date.now()) {
      await pool.query("UPDATE cases SET status='EXPIRED' WHERE id=?", [case_id]);
      return res.status(410).json({ error: "summon expired" });
    }

    const [existingDefense] = await pool.query(
      "SELECT id FROM defenses WHERE case_id = ?",
      [case_id]
    );
    if (existingDefense.length > 0) {
      return res.status(409).json({ error: "defense already submitted" });
    }

    await pool.query("INSERT INTO defenses (case_id, content) VALUES (?, ?)", [case_id, content]);
    await pool.query("UPDATE cases SET status='DEFENSE_SUBMITTED' WHERE id=?", [case_id]);

    // 🔔 Notification: Notify Plaintiff
    const [caseRows] = await pool.query("SELECT plaintiff_id FROM cases WHERE id=?", [case_id]);
    if (caseRows.length > 0) {
      await pool.query(
        "INSERT INTO notifications (user_id, type, message, case_id) VALUES (?, 'VERDICT', 'Defendant has submitted defense.', ?)",
        [caseRows[0].plaintiff_id, case_id]
      );
    }

    return res.status(201).json({ ok: true, caseId: case_id });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// ✅ POST /api/cases/:id/defense
// Direct defense submission (for logged-in defendants)
router.post("/cases/:id/defense", async (req, res) => {
  try {
    const caseId = Number(req.params.id);
    const { content } = req.body;

    if (!content) return res.status(400).json({ error: "content is required" });

    // Check case existence and status
    const [caseRows] = await pool.query("SELECT status, plaintiff_id FROM cases WHERE id = ?", [caseId]);
    if (caseRows.length === 0) return res.status(404).json({ error: "case not found" });

    const c = caseRows[0];
    if (c.status !== 'SUMMONED' && c.status !== 'FILED') {
      return res.status(400).json({ error: "case status must be FILED or SUMMONED to submit defense" });
    }

    // Check existing defense
    const [existing] = await pool.query("SELECT id FROM defenses WHERE case_id = ?", [caseId]);
    if (existing.length > 0) return res.status(409).json({ error: "defense already submitted" });

    await pool.query("INSERT INTO defenses (case_id, content) VALUES (?, ?)", [caseId, content]);
    await pool.query("UPDATE cases SET status='DEFENSE_SUBMITTED' WHERE id=?", [caseId]);

    // 🔔 Notification: Notify Plaintiff
    await pool.query(
      "INSERT INTO notifications (user_id, type, message, case_id) VALUES (?, 'VERDICT', 'Defendant has submitted defense.', ?)",
      [c.plaintiff_id, caseId]
    );

    return res.json({ ok: true, caseId });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

export default router;

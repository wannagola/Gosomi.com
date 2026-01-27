import { Router } from "express";
import { pool } from "../db.js";
import { updateWinRatesForCase } from "../services/winRate.service.js";

const router = Router();

function parseJsonMaybe(x) {
  if (!x) return null;
  if (typeof x === "object") return x;
  try {
    return JSON.parse(x);
  } catch {
    return null;
  }
}

function pickOneStable(list, caseId) {
  const idx = Math.abs(Number(caseId)) % list.length;
  return list[idx];
}

// POST /api/cases/:id/penalty
// body: { "choice": "SERIOUS" | "FUNNY" }
router.post("/cases/:id/penalty", async (req, res) => {
  try {
    const caseId = Number(req.params.id);
    const choiceRaw = String(req.body?.choice || "").toUpperCase(); // SERIOUS | FUNNY

    if (!caseId || !["SERIOUS", "FUNNY"].includes(choiceRaw)) {
      return res.status(400).json({ error: "choice must be SERIOUS or FUNNY" });
    }

    const [rows] = await pool.query(
      `SELECT id, status, penalties_json, penalty_choice, penalty_selected
       FROM cases
       WHERE id=?`,
      [caseId]
    );

    if (!rows[0]) return res.status(404).json({ error: "case not found" });

    const c = rows[0];


    // 이미 선택되어 있으면: (새로고침/중복 클릭/다른 버튼 클릭 대비)
    if (c.penalty_choice && c.penalty_selected) {
      if (
        choiceRaw !== "UNDEFINED" &&
        String(c.penalty_choice).toUpperCase() !== choiceRaw
      ) {
        return res.status(409).json({
          error: "penalty already selected",
          caseId,
          lockedChoice: c.penalty_choice,
          penaltySelected: c.penalty_selected,
        });
      }

      return res.json({
        ok: true,
        caseId,
        choice: c.penalty_choice,
        penaltySelected: c.penalty_selected,
        cached: true,
      });
    }

    // 판결 전이면 선택 불가
    if (c.status !== "VERDICT_READY" || !c.penalties_json) {
      return res.status(400).json({ error: "verdict not ready" });
    }

    const penalties = parseJsonMaybe(c.penalties_json);
    const list = choiceRaw === "SERIOUS" ? penalties?.serious : penalties?.funny;

    if (!Array.isArray(list) || list.length === 0) {
      return res.status(400).json({ error: "no penalties available" });
    }

    const selected = pickOneStable(list, caseId);

    await pool.query(
      `UPDATE cases
       SET penalty_choice=?,
           penalty_selected=?,
           status='COMPLETED'
       WHERE id=?`,
      [choiceRaw, selected, caseId]
    );

    // Update win rates for both plaintiff and defendant
    try {
      await updateWinRatesForCase(caseId);
    } catch (e) {
      console.error('Failed to update win rates:', e);
      // Don't fail the request if win rate update fails
    }

    return res.json({
      ok: true,
      caseId,
      choice: choiceRaw,
      penaltySelected: selected,
      cached: false,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

export default router;
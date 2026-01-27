import { Router } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { pool } from "../db.js";

const router = Router();

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "");
    const name = `${Date.now()}-${Math.random().toString(16).slice(2)}${ext}`;
    cb(null, name);
  },
});

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// 공통: 케이스 존재 확인
async function ensureCase(caseId) {
  const [rows] = await pool.query("SELECT id FROM cases WHERE id=?", [caseId]);
  return rows.length > 0;
}

/**
 * POST /api/cases/:id/evidence/plaintiff
 * -F textEvidence=...
 * -F image=@file.png
 */
router.post("/cases/:id/evidence/plaintiff", upload.single("image"), async (req, res) => {
  try {
    const caseId = Number(req.params.id);
    if (!(await ensureCase(caseId))) return res.status(404).json({ error: "case not found" });

    const stage = req.body.stage === 'APPEAL' ? 'APPEAL' : 'INITIAL';
    const created = [];

    const textEvidence = (req.body?.textEvidence ?? "").trim();
    if (textEvidence) {
      const [r] = await pool.query(
        "INSERT INTO evidences (case_id, type, text_content, submitted_by, stage) VALUES (?, 'text', ?, 'PLAINTIFF', ?)",
        [caseId, textEvidence, stage]
      );
      created.push({ id: r.insertId, type: "text", submittedBy: "PLAINTIFF", stage });
    }

    if (req.file) {
      const relPath = `uploads/${req.file.filename}`;
      const [r] = await pool.query(
        "INSERT INTO evidences (case_id, type, mime_type, file_path, submitted_by, stage) VALUES (?, 'image', ?, ?, 'PLAINTIFF', ?)",
        [caseId, req.file.mimetype, relPath, stage]
      );
      created.push({ id: r.insertId, type: "image", submittedBy: "PLAINTIFF", filePath: relPath, stage });
    }

    if (created.length === 0) return res.status(400).json({ error: "textEvidence or image is required" });
    return res.json({ ok: true, caseId, created });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
});

/**
 * POST /api/summons/:token/evidence
 * -F textEvidence=...
 * -F image=@file.png
 *
 * ※ summons 테이블 컬럼: token, case_id, expires_at 를 기준으로 작성
 */
router.post("/summons/:token/evidence", upload.single("image"), async (req, res) => {
  try {
    const token = req.params.token;

    const [sRows] = await pool.query(
      "SELECT case_id, expires_at FROM summons WHERE token=? LIMIT 1",
      [token]
    );
    if (sRows.length === 0) return res.status(404).json({ error: "summon not found" });

    const { case_id: caseId, expires_at: expiresAt } = sRows[0];
    if (expiresAt && new Date(expiresAt).getTime() < Date.now()) {
      return res.status(410).json({ error: "summon expired" });
    }

    const stage = req.body.stage === 'APPEAL' ? 'APPEAL' : 'INITIAL';
    const created = [];

    const textEvidence = (req.body?.textEvidence ?? "").trim();
    if (textEvidence) {
      const [r] = await pool.query(
        "INSERT INTO evidences (case_id, type, text_content, submitted_by, stage) VALUES (?, 'text', ?, 'DEFENDANT', ?)",
        [caseId, textEvidence, stage]
      );
      created.push({ id: r.insertId, type: "text", submittedBy: "DEFENDANT", stage });
    }

    if (req.file) {
      const relPath = `uploads/${req.file.filename}`;
      const [r] = await pool.query(
        "INSERT INTO evidences (case_id, type, mime_type, file_path, submitted_by, stage) VALUES (?, 'image', ?, ?, 'DEFENDANT', ?)",
        [caseId, req.file.mimetype, relPath, stage]
      );
      created.push({ id: r.insertId, type: "image", submittedBy: "DEFENDANT", filePath: relPath, stage });
    }

    if (created.length === 0) return res.status(400).json({ error: "textEvidence or image is required" });
    return res.json({ ok: true, caseId, created });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
});

export default router;
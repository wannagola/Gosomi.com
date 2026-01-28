import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

// POST /api/cases : 사건 생성(고발 접수)
// POST /api/cases : 사건 생성(고발 접수)
router.post("/", async (req, res) => {
  try {
    const { title, content, plaintiffId, defendantId, juryEnabled, juryMode, juryInvitedUserIds, lawType } = req.body;

    if (!title || !content || !plaintiffId || !defendantId) {
      return res.status(400).json({
        error: "title, content, plaintiffId, defendantId are required",
      });
    }

    // 유저 존재 확인
    const [pRows] = await pool.query("SELECT id FROM users WHERE id = ?", [plaintiffId]);
    const [dRows] = await pool.query("SELECT id FROM users WHERE id = ?", [defendantId]);
    if (pRows.length === 0) return res.status(400).json({ error: "plaintiffId not found" });
    if (dRows.length === 0) return res.status(400).json({ error: "defendantId not found" });

    // 사건번호 생성
    const [[countRow]] = await pool.query("SELECT COUNT(*) AS cnt FROM cases");
    const seq = Number(countRow.cnt) + 1;
    const year = new Date().getFullYear();
    const caseNumber = `${year}-GOSOMI-${String(seq).padStart(3, "0")}`;

    // Invite Token? (Still generate token even if selecting friends, for external sharing if needed)
    const inviteToken = (juryEnabled && juryMode === 'INVITE')
      ? Math.random().toString(36).substring(2, 15)
      : null;

    const [result] = await pool.query(
      `INSERT INTO cases (case_number, title, content, plaintiff_id, defendant_id, jury_enabled, jury_mode, jury_invite_token, status, law_type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'SUMMONED', ?)`,
      [caseNumber, title, content, plaintiffId, defendantId, juryEnabled ? 1 : 0, juryMode, inviteToken, lawType || null]
    );

    const newId = result.insertId;

    // 🔔 Notify Defendant immediately
    await pool.query(
      `INSERT INTO notifications (user_id, type, message, case_id) VALUES (?, 'SUMMON', 'You have been summoned.', ?)`,
      [defendantId, newId]
    );

    // Jury Logic
    if (juryEnabled) {
      if (juryMode === 'RANDOM') {
        // Select 5 random users (excluding plaintiff/defendant)
        const [randomUsers] = await pool.query(
          `SELECT id FROM users 
                 WHERE id NOT IN (?, ?) 
                 ORDER BY RAND() LIMIT 5`,
          [plaintiffId, defendantId]
        );

        if (randomUsers.length > 0) {
          const values = randomUsers.map(u => [newId, u.id, 'INVITED']);
          await pool.query(
            `INSERT INTO jurors (case_id, user_id, status) VALUES ?`,
            [values]
          );
          for (const u of randomUsers) {
            await pool.query(
              `INSERT INTO notifications (user_id, type, message, case_id) VALUES (?, 'SUMMON', 'You have been selected as a juror.', ?)`,
              [u.id, newId]
            );
          }
        }
      } else if (juryMode === 'INVITE' && juryInvitedUserIds && Array.isArray(juryInvitedUserIds)) {
        // Invite specific friends
        // Filter out plaintiff/defendant just in case, and limit to 5
        const targets = juryInvitedUserIds
          .filter(id => Number(id) !== Number(plaintiffId) && Number(id) !== Number(defendantId))
          .slice(0, 5);

        if (targets.length > 0) {
          const values = targets.map(uid => [newId, uid, 'INVITED']);
          await pool.query(
            `INSERT INTO jurors (case_id, user_id, status) VALUES ?`,
            [values]
          );
          for (const uid of targets) {
            await pool.query(
              `INSERT INTO notifications (user_id, type, message, case_id) VALUES (?, 'SUMMON', 'Your friend invited you as a juror.', ?)`,
              [uid, newId]
            );
          }
        }
      }
    }

    const [rows] = await pool.query(
      `SELECT * FROM cases WHERE id = ?`,
      [newId]
    );

    const c = rows[0];
    return res.status(201).json({
      ok: true,
      caseId: c.id,
      caseNumber: c.case_number,
      title: c.title,
      status: c.status
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// GET /api/cases : 사건 목록 조회 (검색 + 내 사건 필터)
router.get("/", async (req, res) => {
  try {
    const { q, userId, status } = req.query; // 검색어, 사용자ID(필터용), 상태(ONGOING 등)

    let sql = `
      SELECT c.id, c.case_number, c.title, c.status, c.appeal_status, c.created_at,
             p.nickname AS plaintiff_name,
             d.nickname AS defendant_name
      FROM cases c
      JOIN users p ON c.plaintiff_id = p.id
      JOIN users d ON c.defendant_id = d.id
    `;

    const params = [];
    const conditions = [];

    if (q) {
      conditions.push(`(c.case_number LIKE ? OR c.title LIKE ? OR p.nickname LIKE ? OR d.nickname LIKE ?)`);
      const like = `%${q}%`;
      params.push(like, like, like, like);
    }

    if (userId) {
      conditions.push(`(c.plaintiff_id = ? OR c.defendant_id = ?)`);
      params.push(userId, userId);
    }

    if (status) {
      if (status === 'ONGOING') {
        conditions.push(`c.status NOT IN ('COMPLETED', 'EXPIRED')`);
      } else if (status === 'COMPLETED') {
        conditions.push(`c.status = 'COMPLETED'`);
      } else {
        conditions.push(`c.status = ?`);
        params.push(status);
      }
    }

    if (conditions.length > 0) {
      sql += " WHERE " + conditions.join(" AND ");
    }

    sql += " ORDER BY c.id DESC";

    const [rows] = await pool.query(sql, params);

    // Status Mapping
    const results = rows.map(r => {
      let displayStatus = "접수됨";
      if (r.status === 'SUMMONED') displayStatus = "접수 완료";
      else if (r.status === 'DEFENSE_SUBMITTED') displayStatus = "판결 대기";
      else if (r.status === 'VERDICT_READY' || r.status === 'VERDICT_DONE' || r.status === 'COMPLETED') {
        if (r.appeal_status === 'REQUESTED' || r.appeal_status === 'RESPONDED') displayStatus = "항소됨";
        else if (r.appeal_status === 'DONE') displayStatus = "재심 완료";
        else displayStatus = "선고 완료";
      }
      else if (r.status === 'EXPIRED') displayStatus = "만료됨";

      return {
        id: r.id,
        caseNumber: r.case_number,
        title: r.title,
        status: r.status,
        appealStatus: r.appeal_status,
        displayStatus,
        createdAt: r.created_at,
        plaintiff: r.plaintiff_name,
        defendant: r.defendant_name,
      };
    });

    return res.json({
      ok: true,
      data: results
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// GET /api/cases/:id : 사건 조회
// GET /api/cases/stats : 홈 화면 전체 통계
router.get("/stats", async (req, res) => {
  try {
    // 1. 전체 접수된 사건 수
    const [[{ total }]] = await pool.query("SELECT COUNT(*) AS total FROM cases");

    // 2. 오늘의 판결 개수 (verdict_text가 오늘 생성된 것)
    // Note: verdict_text가 있고, created_at이 오늘인 경우를 근사치로 사용
    // 더 정확하려면 verdict_updated_at 필드를 추가해야 함
    const [[{ todayVerdict }]] = await pool.query(`
      SELECT COUNT(*) AS todayVerdict 
      FROM cases 
      WHERE verdict_text IS NOT NULL 
      AND DATE(created_at) = CURDATE()
    `);

    // 3. 진행 중인 사건 개수 (verdict_text가 없는 모든 사건 = 접수 완료 이후 판결 전)
    const [[{ ongoing }]] = await pool.query(`
      SELECT COUNT(*) AS ongoing 
      FROM cases 
      WHERE verdict_text IS NULL 
      AND status NOT IN ('EXPIRED', 'COMPLETED')
    `);

    return res.json({
      ok: true,
      stats: { total, todayVerdict, ongoing }
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// GET /api/cases/:id : 사건 조회 (프론트 친화 응답)
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "invalid case id" });

    const [rows] = await pool.query(
      `SELECT c.id, c.case_number, c.title, c.content, c.status,
              c.plaintiff_id, c.defendant_id, c.created_at,
              c.verdict_text, c.penalties_json, c.fault_ratio,
              c.penalty_choice, c.penalty_selected,
              c.appeal_status,
              c.law_type,
              p.nickname AS plaintiff_name,
              d.nickname AS defendant_name
       FROM cases c
       JOIN users p ON c.plaintiff_id = p.id
       JOIN users d ON c.defendant_id = d.id
       WHERE c.id=?`,
      [id]
    );

    const c = rows[0];
    if (!c) return res.status(404).json({ error: "case not found" });

    //프론트에 필요한 형태만 내려줌
    // Fetch Defense Content if available (for Jury View)
    const [dRows] = await pool.query("SELECT content FROM defenses WHERE case_id=? ORDER BY created_at DESC LIMIT 1", [id]);
    const defenseContent = dRows[0]?.content || null;

    // Fetch evidences - always return array (empty if none)
    const [evRows] = await pool.query(
      "SELECT id, type, text_content, file_path, submitted_by FROM evidences WHERE case_id=? ORDER BY created_at", 
      [id]
    );
    const evidences = evRows.map(e => ({
      id: String(e.id),
      type: e.type,
      content: e.text_content || e.file_path || '', // Use text_content or file_path
      isKeyEvidence: false // Default to false since column doesn't exist in schema
    }));

    // Fetch Jury Votes
    const [voteRows] = await pool.query(
      "SELECT vote, COUNT(*) as cnt FROM jurors WHERE case_id=? AND status='VOTED' GROUP BY vote",
      [id]
    );
    
    const juryVotes = {
      plaintiffWins: 0,
      defendantWins: 0,
      bothGuilty: 0
    };

    voteRows.forEach(r => {
      if (r.vote === 'PLAINTIFF') juryVotes.plaintiffWins = Number(r.cnt);
      else if (r.vote === 'DEFENDANT') juryVotes.defendantWins = Number(r.cnt);
    });

    return res.json({
      id: c.id,
      caseNumber: c.case_number,
      title: c.title,
      content: c.content,
      evidences, // Always an array
      defenseContent, // Added for Jury
      status: c.status,
      plaintiffId: c.plaintiff_id,
      defendantId: c.defendant_id,
      plaintiff: c.plaintiff_name,
      defendant: c.defendant_name,
      createdAt: c.created_at,

      verdictText: c.verdict_text,
      penalties: c.penalties_json,   // { serious:[], funny:[] }
      faultRatio: c.fault_ratio,     // { plaintiff:40, defendant:60 }
      lawType: c.law_type,

      penaltyChoice: c.penalty_choice,
      penaltySelected: c.penalty_selected,
      appealStatus: c.appeal_status,
      juryVotes, // Added jury votes stats
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// Jury Vote (POST /api/cases/:id/jury/vote)
router.post("/:id/jury/vote", async (req, res) => {
  try {
    const caseId = Number(req.params.id);
    const { userId, vote } = req.body;

    if (!userId || !["PLAINTIFF", "DEFENDANT"].includes(vote)) {
      return res.status(400).json({ error: "userId and valid vote (PLAINTIFF/DEFENDANT) required" });
    }

    // Check Case Status (No voting during appeal)
    const [cRows] = await pool.query("SELECT appeal_status FROM cases WHERE id=?", [caseId]);
    if (cRows.length === 0) return res.status(404).json({ error: "case not found" });
    if (cRows[0].appeal_status !== 'NONE') {
      return res.status(403).json({ error: "Jury voting is disabled during appeal" });
    }

    // Check if user is a juror for this case
    const [jRows] = await pool.query(
      "SELECT id, status FROM jurors WHERE case_id=? AND user_id=?",
      [caseId, userId]
    );
    if (jRows.length === 0) return res.status(403).json({ error: "not a juror" });

    const juror = jRows[0];
    if (juror.status === 'VOTED') return res.status(409).json({ error: "already voted" });

    // Update Vote
    await pool.query(
      "UPDATE jurors SET status='VOTED', vote=? WHERE id=?",
      [vote, juror.id]
    );

    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});


// GET /api/cases/user/:userId/stats : 유저 승소율 통계
router.get("/user/:userId/stats", async (req, res) => {
  try {
    const { userId } = req.params;

    // Get user's win_rate from database
    const [[user]] = await pool.query(
      'SELECT win_rate FROM users WHERE id = ?',
      [userId]
    );

    // 완료된 재판 중 해당 유저가 원고/피고로 참여한 건 조회
    const [cases] = await pool.query(
      `SELECT id, plaintiff_id, defendant_id, fault_ratio FROM cases 
       WHERE (plaintiff_id = ? OR defendant_id = ?) AND status = 'COMPLETED'`,
      [userId, userId]
    );

    let totalResolved = cases.length;
    let wins = 0;
    let losses = 0;
    let ties = 0;

    cases.forEach(c => {
      let ratios;
      try {
        ratios = typeof c.fault_ratio === 'string' ? JSON.parse(c.fault_ratio) : c.fault_ratio;
      } catch (e) {
        return; // 과실 비율 데이터 오류 시 건너뜀
      }

      if (!ratios) return;

      const pFault = Number(ratios.plaintiff || 0);
      const dFault = Number(ratios.defendant || 0);
      const isPlaintiff = Number(c.plaintiff_id) === Number(userId);

      if (isPlaintiff) {
        // 원고일 때: 피고 과실이 더 크면 승리
        if (dFault > pFault) wins++;
        else if (pFault > dFault) losses++;
        else ties++;
      } else {
        // 피고일 때: 원고 과실이 더 크면 승리 (방어 성공)
        if (pFault > dFault) wins++;
        else if (dFault > pFault) losses++;
        else ties++;
      }
    });

    // Use database win_rate if available, otherwise use calculated value
    const winningRate = user?.win_rate || (totalResolved > 0 ? ((wins / totalResolved) * 100).toFixed(1) : 0);

    res.json({
      ok: true,
      stats: {
        totalResolved,
        wins,
        losses,
        ties,
        winningRate: Number(winningRate)
      }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;

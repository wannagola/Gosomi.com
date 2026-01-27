import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { pool } from "../db.js";
import { loadLegalCode } from "../utils/loadLegalCode.js";

const MAX_IMG_PER_SIDE = 3;
const MIN_IMAGE_BYTES = 5 * 1024; // 5KB 미만 이미지 스킵(1x1 같은 거 방지)
const ALLOWED_IMAGE_MIMES = new Set(["image/png", "image/jpeg", "image/webp"]);

// Gemini 응답 스키마 (DB 저장용)
const VerdictSchema = z.object({
  result: z.enum(["GUILTY", "NOT_GUILTY", "BOTH_AT_FAULT", "SETTLEMENT"]),
  intensity: z.enum(["low", "mid", "high"]),
  lawRefs: z.array(z.object({ id: z.string(), category: z.string() })).min(1),
  oneLine: z.string(),
  reasoning: z.string(),
  penalties: z.object({
    serious: z.array(z.string()).min(0).max(3),
    funny: z.array(z.string()).min(0).max(3),
  }),
  faultRatio: z.object({
    plaintiff: z.number().int().min(0).max(100),
    defendant: z.number().int().min(0).max(100),
  }),
});

async function getCase(caseId) {
  const [rows] = await pool.query(
    `SELECT id, case_number, title, content, status, plaintiff_id, defendant_id,
            verdict_text, penalties_json, fault_ratio,
            penalty_choice, penalty_selected
     FROM cases
     WHERE id=?`,
    [caseId]
  );
  return rows[0] ?? null;
}

async function getLatestDefense(caseId) {
  try {
    const [rows] = await pool.query(
      `SELECT id, content, created_at
       FROM defenses
       WHERE case_id=?
       ORDER BY id DESC
       LIMIT 1`,
      [caseId]
    );
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

async function getEvidences(caseId) {
  const [rows] = await pool.query(
    `SELECT id, type, mime_type, file_path, text_content, submitted_by, created_at
     FROM evidences
     WHERE case_id=?
     ORDER BY id ASC`,
    [caseId]
  );
  const plaintiff = rows.filter((e) => e.submitted_by === "PLAINTIFF");
  const defendant = rows.filter((e) => e.submitted_by === "DEFENDANT");
  return { plaintiff, defendant };
}

function splitEvidence(eList) {
  const text = eList
    .filter((e) => e.type === "text" && e.text_content)
    .map((e) => e.text_content);

  const images = eList.filter((e) => e.type === "image" && e.file_path);
  return { text, images };
}

// file_path를 "프로젝트 루트 기준 상대경로"로 저장하고 있다는 전제
async function safeFileToInlineData(filePathRel, mimeType) {
  const abs = path.join(process.cwd(), filePathRel);

  const stat = await fs.stat(abs).catch(() => null);
  if (!stat) return { ok: false, reason: "missing_file" };
  if (stat.size < MIN_IMAGE_BYTES) return { ok: false, reason: `too_small(${stat.size})` };

  const mt = mimeType || "image/png";
  if (!ALLOWED_IMAGE_MIMES.has(mt)) return { ok: false, reason: `bad_mime(${mt})` };

  const buf = await fs.readFile(abs);
  return {
    ok: true,
    part: {
      inlineData: {
        mimeType: mt,
        data: buf.toString("base64"),
      },
    },
  };
}

function buildPrompt({ legalCode, caseRow, defenseRow, plaintiffTextEvs, defendantTextEvs, isAppeal, appealData, juryStats }) {
  let prompt = `
너는 '고소미닷컴'의 엄격하고 근엄한 AI 판사다. 그러나 MZ 가치관을 반영해 재치있게 판단한다.
아래의 "법전(JSON)"과 "원고 주장/증거", "피고 변론/증거"만을 근거로 판결하라.
추측은 최소화하고, 근거가 부족하면 그 사실을 reasoning에 명시하라.

[출력 규칙]
- 반드시 JSON으로만 출력
- 아래 스키마를 정확히 지켜라:
{
  "result": "GUILTY" | "NOT_GUILTY" | "BOTH_AT_FAULT" | "SETTLEMENT",
  "intensity": "low" | "mid" | "high",
  "lawRefs": [{"id": "...", "category": "..."}],
  "oneLine": "한 줄 판결",
  "reasoning": "판결 이유",
  "penalties": {
    "serious": ["진지한 벌칙 1개 이상(최대 3개)"],
    "funny": ["재미있는 벌칙 1개 이상(최대 3개)"]
  },
  "faultRatio": {"plaintiff": 0~100 정수, "defendant": 0~100 정수}
}
- "GUILTY" (유죄): 원고 승소. 피고에게 벌칙을 부과.
- "NOT_GUILTY" (기각/무죄): 피고 승소. 원고에게 벌칙을 부과(무고 등).
- "BOTH_AT_FAULT" (쌍방 과실): **둘 다 잘못함.** 이 경우 "penalties"는 **반드시 빈 배열**이어야 함. 아무도 벌칙을 받지 않음.
- faultRatio는 plaintiff+defendant=100이 되도록 해라. (쌍방 과실이면 50:50에 가깝게)
- penalties의 각 항목은 법전(JSON)의 penalties에서 intensity에 맞는 것만 고른다. 단, 쌍방 과실이면 빈 배열.
- **[중요]** 판결 이유(reasoning)를 작성할 때, 반드시 해당 법 조항(제N조 제M항)을 인용하여 법리적 근거를 명확히 제시하라. (예: '카톡매너법 제2조 제1항에 의거하여...')

[법전(JSON)]
${JSON.stringify(legalCode, null, 2)}

[원고 입력]
- 사건 제목: ${caseRow.title}
- 사건 내용: ${caseRow.content}

[원고 텍스트 증거 (1심)]
${plaintiffTextEvs.length ? plaintiffTextEvs.map((t, i) => `(${i + 1}) ${t}`).join("\n") : "- 없음"}

[피고 변론 (1심)]
${defenseRow?.content ? defenseRow.content : "- 변론 없음"}

[피고 텍스트 증거 (1심)]
${defendantTextEvs.length ? defendantTextEvs.map((t, i) => `(${i + 1}) ${t}`).join("\n") : "- 없음"}
`;

  if (isAppeal && appealData) {
    prompt += `
[항소(2심) 진행]
이 사건은 1심 판결에 불복하여 항소되었습니다. 아래 추가 정보를 고려하여 **최종 판결**을 내려주세요.

[항소 이유 (원고/피고 중 신청자)]
- 항소 신청자 ID: ${appealData.appellantId}
- 항소 이유: ${appealData.reason}

[항소 텍스트 증거 (원고 측)]
${appealData.plaintiffEvs.length ? appealData.plaintiffEvs.map((t, i) => `(${i + 1}) ${t}`).join("\n") : "- 없음"}

[항소 답변 (상대방)]
- 답변 내용: ${appealData.response || "- 답변 없음"}

[항소 텍스트 증거 (피고 측)]
${appealData.defendantEvs.length ? appealData.defendantEvs.map((t, i) => `(${i + 1}) ${t}`).join("\n") : "- 없음"}

이전 판결을 뒤집을만한 충분한 사유가 있는지 신중히 검토하여 최종 판결을 내려라.
`;
  }

  // Add Jury Stats if available
  if (juryStats && juryStats.total > 0) {
    prompt += `
[배심원 투표 결과 (참고용)]
배심원 총 ${juryStats.total}명 투표 결과:
- 원고 잘못 (Plaintiff Fault): ${juryStats.plaintiff}표
- 피고 잘못 (Defendant Fault): ${juryStats.defendant}표

이 여론을 참고하되, 맹신하지 말고 너의 법리적 판단을 최우선으로 하여 최종 판결을 내려라.
(만약 여론이 압도적이라면 그 이유를 한번 더 고려해볼 것)
`;
  }

  prompt += `\n이제 판결을 내려라.`;
  return prompt.trim();
}

function normalizeJson(field, fallback) {
  if (field == null) return fallback;
  if (typeof field === "object") return field;
  if (typeof field === "string") {
    try {
      return JSON.parse(field);
    } catch {
      return fallback;
    }
  }
  return fallback;
}

function extractJson(text) {
  const cleaned = String(text)
    .replace(/```json/gi, "```")
    .replace(/```/g, "")
    .trim();

  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) return cleaned.slice(first, last + 1);
  return cleaned;
}

export async function generateVerdictWithGemini(caseId, isAppeal = false) {
  try {
    const caseRow = await getCase(caseId);
    if (!caseRow) return { ok: false, status: 404, error: "case not found" };

    // ✅ 캐시: 판결 저장돼 있으면... (단, 항소 판결 요청(isAppeal=true)이면 무시하고 새로 생성)
    if (!isAppeal && caseRow.status === "VERDICT_DONE" && caseRow.verdict_text) {
      // 1심 판결 캐시 반환 (기존 로직)
      if (caseRow.appeal_status === 'NONE' || caseRow.appeal_status === 'REQUESTED') {
        return {
          ok: true,
          cached: true,
          caseId,
          verdictText: caseRow.verdict_text,
          faultRatio: normalizeJson(caseRow.fault_ratio, null),
          penaltyChoice: caseRow.penalty_choice,
          penaltySelected: caseRow.penalty_selected,
        };
      }
      // 항소 완료된 상태면 항소 판결 반환? (여기서는 그냥 새로 생성 로직 따름)
    }

    // 2. Fetch Evidence (Text) & Defense
    // Initial Evidences
    const [pEvs] = await pool.query(
      "SELECT text_content FROM evidences WHERE case_id=? AND type='text' AND submitted_by='PLAINTIFF' AND stage='INITIAL'",
      [caseId]
    );
    const [dEvs] = await pool.query(
      "SELECT text_content FROM evidences WHERE case_id=? AND type='text' AND submitted_by='DEFENDANT' AND stage='INITIAL'",
      [caseId]
    );

    const [defRows] = await pool.query(
      "SELECT * FROM defenses WHERE case_id=? ORDER BY created_at DESC LIMIT 1",
      [caseId]
    );
    const defenseRow = defRows[0]; // Can be undefined

    // Appeal Data (if applicable)
    let appealData = null;
    if (isAppeal) {
      const [pAppealEvs] = await pool.query(
        "SELECT text_content FROM evidences WHERE case_id=? AND type='text' AND submitted_by='PLAINTIFF' AND stage='APPEAL'",
        [caseId]
      );
      const [dAppealEvs] = await pool.query(
        "SELECT text_content FROM evidences WHERE case_id=? AND type='text' AND submitted_by='DEFENDANT' AND stage='APPEAL'",
        [caseId]
      );

      appealData = {
        status: caseRow.appeal_status,
        appellantId: caseRow.appellant_id,
        reason: caseRow.appeal_reason,
        response: caseRow.appeal_response,
        plaintiffEvs: pAppealEvs.map(r => r.text_content),
        defendantEvs: dAppealEvs.map(r => r.text_content)
      };
    }

    // 2.5 Fetch Jury Votes (Only for Initial Verdict)
    let juryStats = null;
    if (!isAppeal) {
      const [juryRows] = await pool.query(
        "SELECT vote, COUNT(*) as cnt FROM jurors WHERE case_id=? AND status='VOTED' GROUP BY vote",
        [caseId]
      );
      juryStats = { plaintiff: 0, defendant: 0, total: 0 };
      juryRows.forEach(r => {
        if (r.vote === 'PLAINTIFF') juryStats.plaintiff = Number(r.cnt);
        if (r.vote === 'DEFENDANT') juryStats.defendant = Number(r.cnt);
      });
      juryStats.total = juryStats.plaintiff + juryStats.defendant;
    }

    const legalCode = loadLegalCode();

    // 3. Build Prompt
    const prompt = buildPrompt({
      legalCode,
      caseRow,
      defenseRow,
      plaintiffTextEvs: pEvs.map((r) => r.text_content),
      defendantTextEvs: dEvs.map((r) => r.text_content),
      isAppeal,
      appealData,
      juryStats
    });

    // 4. Image Handling (If Appeal, allow Appeal images too? For simplicity, keeping to initial or adding appeal images)
    // Let's gather correct images based on stage.
    const stageFilter = isAppeal ? ['INITIAL', 'APPEAL'] : ['INITIAL'];
    // Actually, prompt has all text, but images?
    // Let's just collect ALL images for the case regardless of stage, max N per side?
    // Or respect stage. Let's simplify and get ALL images for context.

    const ev = await getEvidences(caseId);
    // getEvidences returns all. Let's filter if needed, or just use all.
    // Given the "Strict AI Judge" persona, seeing all evidence is good.
    const { images: plaintiffImages } = splitEvidence(ev.plaintiff);
    const { images: defendantImages } = splitEvidence(ev.defendant);

    const pImgs = plaintiffImages.slice(0, MAX_IMG_PER_SIDE);
    const dImgs = defendantImages.slice(0, MAX_IMG_PER_SIDE);

    const imageParts = [];
    const skippedImages = [];

    for (const img of pImgs) {
      const r = await safeFileToInlineData(img.file_path, img.mime_type);
      if (r.ok) imageParts.push(r.part);
      else skippedImages.push({ evidenceId: img.id, file: img.file_path, reason: r.reason });
    }
    for (const img of dImgs) {
      const r = await safeFileToInlineData(img.file_path, img.mime_type);
      if (r.ok) imageParts.push(r.part);
      else skippedImages.push({ evidenceId: img.id, file: img.file_path, reason: r.reason });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return { ok: false, status: 500, error: "GEMINI_API_KEY is missing" };

    const modelName = process.env.GEMINI_MODEL || "models/gemini-2.5-flash"; // updated model name check
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

    const usedImages = imageParts.length > 0;
    let imagesIgnored = false;

    let resp;
    try {
      resp = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }, ...imageParts] }],
        generationConfig: { temperature: 0.4 },
      });
    } catch (e) {
      const msg = String(e?.message || e);

      if (usedImages && msg.includes("Unable to process input image")) {
        imagesIgnored = true;
        resp = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.4 },
        });
      } else {
        throw e;
      }
    }

    const rawText = resp.response.text();
    const jsonText = extractJson(rawText);

    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      return {
        ok: false,
        status: 500,
        error: `Gemini returned non-JSON. raw=${rawText}`,
      };
    }

    const verdict = VerdictSchema.parse(parsed);

    // 5. Save Result
    // If appeal, we overwrite verdict_text.
    await pool.query(
      `UPDATE cases
       SET status='VERDICT_READY',
           verdict_text=?,
           penalties_json=?,
           fault_ratio=?,
           penalty_choice=NULL,
           penalty_selected=NULL
       WHERE id=?`,
      [
        verdict.oneLine + "\n\n" + verdict.reasoning,
        JSON.stringify(verdict.penalties),
        JSON.stringify(verdict.faultRatio),
        caseId,
      ]
    );

    return {
      ok: true,
      cached: false,
      caseId,
      verdictText: verdict.oneLine + "\n\n" + verdict.reasoning,
      faultRatio: verdict.faultRatio,
      usedImages,
      imagesIgnored,
      skippedImages,
    };
  } catch (e) {
    console.error(e);
    return { ok: false, status: 500, error: e.message };
  }
}
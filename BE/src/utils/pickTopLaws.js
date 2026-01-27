import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// src/utils/pickTopLaws.js 기준으로 ../laws/legalCode.json
const lawsPath = path.join(__dirname, "..", "laws", "legalCode.json");
const legal = JSON.parse(fs.readFileSync(lawsPath, "utf-8"));

function norm(s = "") {
  return String(s).toLowerCase().replace(/\s+/g, " ");
}

export function pickTopLaws({ title, content, defenseText = "", evidenceTexts = [] }, topN = 3) {
  const hay = norm([title, content, defenseText, ...evidenceTexts].filter(Boolean).join(" "));

  const scored = legal.legal_code.map((law) => {
    let score = 0;

    // 1) keywords 매칭(있으면 강력)
    const kws = law.keywords ?? [];
    for (const kw of kws) {
      const k = norm(kw);
      if (k && hay.includes(k)) score += 3;
    }

    // 2) category 직접 언급
    if (hay.includes(norm(law.category))) score += 2;

    return { law, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .filter((x) => x.score > 0)
    .slice(0, topN)
    .map((x) => x.law);
}
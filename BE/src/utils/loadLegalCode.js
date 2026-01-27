import fs from "node:fs";
import path from "node:path";

export function loadLegalCode() {
  const filePath = path.join(process.cwd(), "src", "laws", "legalCode.json");
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw);
}
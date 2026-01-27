import "dotenv/config";
import express from "express";
import apiRouter from "./router/api.js";
import testRouter from "./router/test.router.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());
app.use("/api", apiRouter);
app.use("/test", testRouter); // Mount test router
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// FE 정적 파일 서빙 (React 빌드 파일)
// 배포 환경: /usr/src/app/public
// 로컬 환경: ../FE/build
const publicPath = path.resolve(__dirname, "../../public");
const localBuildPath = path.resolve(__dirname, "../../FE/build");
const frontendPath = existsSync(publicPath) ? publicPath : localBuildPath;

console.log("Frontend path:", frontendPath);
app.use(express.static(frontendPath));

// SPA를 위한 fallback - 모든 경로를 index.html로 라우팅
// API 라우트는 위에서 먼저 처리되므로 영향 없음
app.get(/.*/,  (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});


app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
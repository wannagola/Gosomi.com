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
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));
app.use("/api", apiRouter);
app.use("/test", testRouter); // Mount test router
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

console.log("Current working directory:", process.cwd());
console.log("__dirname:", __dirname);

// FE 정적 파일 서빙 (React 빌드 파일)
// 배포 환경 (Root Directory=BE): ../public
// 로컬 환경: ../../FE/build
const deployPath = path.resolve(__dirname, "../public");
const localBuildPath = path.resolve(__dirname, "../../FE/build");
const frontendPath = existsSync(deployPath) ? deployPath : localBuildPath;

console.log("Frontend path resolved to:", frontendPath);
console.log("Does index.html exist?", existsSync(path.join(frontendPath, "index.html")));

// Serve static files with specific options
app.use(express.static(frontendPath, {
  index: false, // Disable auto-serving index.html for root, let the fallback handle it or handle explicitly
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
  }
}));

// Explicitly serve index.html on root
app.get("/", (req, res) => {
  const indexPath = path.join(frontendPath, "index.html");
  if (existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send("Frontend build not found. Please run build script.");
  }
});

// SPA를 위한 fallback - 모든 경로를 index.html로 라우팅 (API 제외)
app.get(/.*/, (req, res) => {
  if (req.path === '/') return; // Handled above
  res.sendFile(path.join(frontendPath, "index.html"));
});


app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
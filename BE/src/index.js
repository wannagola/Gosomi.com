import "dotenv/config";
import express from "express";
import apiRouter from "./router/api.js";
import testRouter from "./router/test.router.js";
import path from "node:path";

const app = express();
const PORT = 3000;

app.use(express.json());
app.use("/api", apiRouter);
app.use("/test", testRouter); // Mount test router
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.get("/", (req, res) => {
  res.send("<h1>⚖️ 고소미닷컴 백엔드 서버가 정상 작동 중입니다!</h1><p>API 명세는 <b>/api</b> 경로를 참고하세요.</p>");
});


app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
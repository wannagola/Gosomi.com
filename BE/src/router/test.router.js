import { Router } from "express";
import path from "path";
import axios from "axios";
import fs from "fs";
import { pool } from "../db.js";

const router = Router();

// 1. Serve the test page
router.get("/kakao/login", (req, res) => {
  const filePath = path.join(process.cwd(), "test_kakao_login.html");
  let content = fs.readFileSync(filePath, "utf-8");

  // Inject API KEY
  const apiKey = process.env.KAKAO_REST_API_KEY || "";
  content = content.replace(
    'const apiKey = prompt("Please enter your Kakao REST API Key:");',
    `const apiKey = "${apiKey}";`
  );

  // Inject Redirect URI
  const redirectUri = process.env.KAKAO_REDIRECT_URI || "http://localhost:3000/test/kakao/callback";
  content = content.replace(
    "const REDIRECT_URI = 'http://localhost:3000/test/kakao/callback';",
    `const REDIRECT_URI = "${redirectUri}";`
  );

  res.send(content);
});

// 2. Handle Callback (Broker to our API)
router.get("/kakao/callback", async (req, res) => {
  const { code } = req.query;
  if (!code) return res.send("No code provided from Kakao");

  try {
    // Pass the auth code to our actual backend API (Dynamic URL)
    const host = req.get('host');
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const apiUrl = `${protocol}://${host}/api/auth/kakao`;
    const response = await axios.post(apiUrl, { code });

    // Show the result (JWT Token, User Info) clearly in browser
    res.send(`
      <h1>Login Success!</h1>
      <pre>${JSON.stringify(response.data, null, 2)}</pre>
      <a href="/test/kakao/login">Go back</a>
    `);
  } catch (e) {
    res.status(500).send(`
      <h1>Login Failed</h1>
      <pre>${JSON.stringify(e.response?.data || e.message, null, 2)}</pre>
    `);
  }
});

// 3. Serve Flow Test Page
router.get("/flow", (req, res) => {
  const filePath = path.join(process.cwd(), "test_flow.html");
  res.sendFile(filePath);
});

// 4. Create Dummy Users for Testing
router.get("/create-dummy-users", async (req, res) => {
  try {
    const pName = `plaintiff_${Date.now()}`;
    const dName = `defendant_${Date.now()}`;

    const [r1] = await pool.query("INSERT INTO users (username, password, nickname) VALUES (?, 'pass', 'Test Plaintiff')", [pName]);
    const [r2] = await pool.query("INSERT INTO users (username, password, nickname) VALUES (?, 'pass', 'Test Defendant')", [dName]);

    const additionalUsers = [];
    const count = Number(req.query.count);
    if (count > 2) {
      const extra = count - 2;
      for (let i = 0; i < extra; i++) {
        const uName = `juror_${i}_${Date.now()}`;
        const nick = `Juror ${i + 1}`;
        const [r] = await pool.query("INSERT INTO users (username, password, nickname) VALUES (?, 'pass', ?)", [uName, nick]);
        additionalUsers.push({ id: r.insertId, username: uName, nickname: nick });
      }
    }

    res.json({
      plaintiff: { id: r1.insertId, username: pName, nickname: 'Test Plaintiff' },
      defendant: { id: r2.insertId, username: dName, nickname: 'Test Defendant' },
      jurors: additionalUsers
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;

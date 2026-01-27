
import { Router } from "express";
import axios from "axios";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";

const router = Router();

router.post("/kakao", async (req, res) => {
    try {
        const { code } = req.body;
        if (!code) return res.status(400).json({ error: "code is required" });

        // 1. Get Access Token
        const tokenParams = new URLSearchParams({
            grant_type: "authorization_code",
            client_id: process.env.KAKAO_REST_API_KEY,
            redirect_uri: process.env.KAKAO_REDIRECT_URI,
            client_secret: process.env.KAKAO_CLIENT_SECRET, // Added for Client Secret
            code,
        });

        const tokenRes = await axios.post(
            "https://kauth.kakao.com/oauth/token",
            tokenParams.toString(),
            {
                headers: {
                    "Content-type": "application/x-www-form-urlencoded;charset=utf-8",
                },
            }
        );

        const { access_token } = tokenRes.data;

        // 2. Get User Info
        const userRes = await axios.get("https://kapi.kakao.com/v2/user/me", {
            headers: {
                Authorization: `Bearer ${access_token}`,
                "Content-type": "application/x-www-form-urlencoded;charset=utf-8",
            },
        });

        const kakaoId = String(userRes.data.id);
        const nickname = userRes.data.properties?.nickname;
        const profileImage = userRes.data.properties?.profile_image;

        // 3. Find or Create User
        const [rows] = await pool.query("SELECT * FROM users WHERE kakao_id = ?", [kakaoId]);
        let user = rows[0];

        if (!user) {
            // Create new user (Generate dummy password/username for compatibility)
            const username = `kakao_${kakaoId}`;
            const dummyPassword = "KAKAO_LOGIN_USER"; // Not used for login

            const [result] = await pool.query(
                "INSERT INTO users (username, password, nickname, kakao_id, profile_image) VALUES (?, ?, ?, ?, ?)",
                [username, dummyPassword, nickname, kakaoId, profileImage]
            );

            const [newUser] = await pool.query("SELECT * FROM users WHERE id = ?", [result.insertId]);
            user = newUser[0];
        } else {
            // Update profile info if changed
            await pool.query("UPDATE users SET nickname=?, profile_image=? WHERE id=?", [nickname, profileImage, user.id]);
            user.nickname = nickname;
            user.profile_image = profileImage;
        }

        // 4. Issue JWT
        const jwtSecret = process.env.JWT_SECRET || "default_secret";
        const token = jwt.sign(
            {
                id: user.id,
                username: user.username,
                nickname: user.nickname,
            },
            jwtSecret,
            { expiresIn: "7d" }
        );

        return res.json({
            ok: true,
            token,
            user: {
                id: user.id,
                username: user.username,
                nickname: user.nickname,
                profileImage: user.profile_image,
            },
        });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: e.response?.data || e.message });
    }
});

export default router;

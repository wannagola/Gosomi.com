
import { Router } from "express";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";

const router = Router();

// Pure "Trust Frontend" Login - as requested to simplify
router.post("/kakao", async (req, res) => {
    try {
        const { kakaoId, nickname, profileImage } = req.body;
        
        if (!kakaoId) {
            return res.status(400).json({ error: "kakaoId is required" });
        }

        console.log("Login request from frontend:", { kakaoId, nickname });

        // 1. Find or Create User directly from provided data
        const [rows] = await pool.query("SELECT * FROM users WHERE kakao_id = ?", [kakaoId]);
        let user = rows[0];

        if (!user) {
            // Create new user
            const username = `kakao_${kakaoId}`;
            const dummyPassword = "KAKAO_LOGIN_USER"; 

            const [result] = await pool.query(
                "INSERT INTO users (username, password, nickname, kakao_id, profile_image) VALUES (?, ?, ?, ?, ?)",
                [username, dummyPassword, nickname || 'User', kakaoId, profileImage || '']
            );

            const [newUser] = await pool.query("SELECT * FROM users WHERE id = ?", [result.insertId]);
            user = newUser[0];
        } else {
            // Update profile info
            if (nickname || profileImage) {
                 await pool.query("UPDATE users SET nickname=?, profile_image=? WHERE id=?", 
                    [nickname || user.nickname, profileImage || user.profile_image, user.id]);
                 user.nickname = nickname || user.nickname;
                 user.profile_image = profileImage || user.profile_image;
            }
        }

        // 2. Issue JWT for our app
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
        return res.status(500).json({ error: e.message });
    }
});

export default router;

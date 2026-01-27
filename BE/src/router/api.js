import { Router } from "express";
import { pool } from "../db.js";
import casesRouter from "./cases.router.js";
import summonsRouter from "./summons.router.js";
import evidenceRouter from "./evidence.router.js";
import verdictRouter from "./verdict.router.js";
import penaltyRouter from "./penalty.router.js";
import authRouter from "./auth.router.js";
import appealsRouter from "./appeals.router.js";
import notificationsRouter from "./notifications.router.js";
import friendsRouter from "./friends.router.js";

const router = Router();

router.get("/health", (req, res) => res.json({ ok: true }));

router.get("/db-ping", async (req, res) => {
  const [rows] = await pool.query("SELECT 1 AS ok");
  res.json({ ok: true, rows });
});

router.use("/notifications", notificationsRouter); // /api/notifications
router.use("/friends", friendsRouter); // /api/friends
router.use("/cases", casesRouter);
router.use("/auth", authRouter);
router.use("/", appealsRouter); // Mount on root so /cases/:id/appeal works
router.use("/", summonsRouter);
router.use("/", evidenceRouter);
router.use("/", verdictRouter);
router.use("/", penaltyRouter);

export default router;
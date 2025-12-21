// src/routes/auth.ts
import { Router } from "express";
import argon2 from "argon2";
import {
  signAccessToken,
  createRefreshTokenValue,
  hashRefreshToken,
  refreshCookieOptions,
} from "../auth/tokens";

const router = Router();

const COOKIE_NAME = process.env.COOKIE_NAME || "refresh_token";

function okEmail(x: string) { return typeof x === "string" && x.includes("@") && x.length <= 255; }
function okPassword(x: string) { return typeof x === "string" && x.length >= 8 && x.length <= 200; }

/** POST /api/auth/signup */
router.post("/signup", async (req, res) => {
  const db = (req as any).db; // injected in server, should be authDb
  const { email, password, full_name = null } = req.body || {};
  if (!okEmail(email) || !okPassword(password)) return res.status(400).json({ error: "Invalid input" });
  const normalized = String(email).toLowerCase();

  try {
    const exists = await db.query("SELECT user_id FROM auth.users WHERE email=$1", [normalized]);
    if (exists.rows.length) return res.status(409).json({ error: "Email already in use" });

    const password_hash = await argon2.hash(password, { type: argon2.argon2id });

    const ins = await db.query(
      `INSERT INTO auth.users (email, password_hash, full_name, role)
       VALUES ($1,$2,$3,'student')
       RETURNING user_id, email, role, full_name`,
      [normalized, password_hash, full_name]
    );
    const user = ins.rows[0];

    const refreshValue = createRefreshTokenValue();
    const refreshHash = hashRefreshToken(refreshValue);
    await db.query(
      `INSERT INTO auth.refresh_tokens (user_id, token_hash) VALUES ($1,$2)`,
      [user.user_id, refreshHash]
    );

    res.cookie(COOKIE_NAME, refreshValue, refreshCookieOptions());
    const accessToken = signAccessToken(user.user_id, user.role);

    res.status(201).json({ accessToken, user });
  } catch (err: any) {
    if (err?.code === "23505") return res.status(409).json({ error: "Email already in use" });
    console.error("SIGNUP ERR:", err?.code, err?.message, err?.detail);
    res.status(500).json({ error: "Server error" });
  }
});

/** POST /api/auth/login */
router.post("/login", async (req, res) => {
  const db = (req as any).db; // authDb
  const { email, password } = req.body || {};
  if (!okEmail(email) || !okPassword(password)) return res.status(400).json({ error: "Invalid input" });

  const { rows } = await db.query(
    `SELECT user_id, email, role, password_hash, full_name
     FROM auth.users WHERE email=$1`,
    [String(email).toLowerCase()]
  );
  const user = rows[0];
  if (!user) return res.status(401).json({ error: "Email or password is incorrect" });

  const ok = await argon2.verify(user.password_hash, password);
  if (!ok) return res.status(401).json({ error: "Email or password is incorrect" });

  // Rotate existing refresh if present
  const oldRefresh = req.cookies?.[COOKIE_NAME] as string | undefined;
  if (oldRefresh) {
    await db.query(
      `UPDATE auth.refresh_tokens
         SET revoked_at=now(), last_used_at=now()
       WHERE token_hash=$1 AND revoked_at IS NULL`,
      [hashRefreshToken(oldRefresh)]
    );
  }

  const newValue = createRefreshTokenValue();
  await db.query(
    `INSERT INTO auth.refresh_tokens (user_id, token_hash) VALUES ($1,$2)`,
    [user.user_id, hashRefreshToken(newValue)]
  );

  res.cookie(COOKIE_NAME, newValue, refreshCookieOptions());
  const accessToken = signAccessToken(user.user_id, user.role);

  res.json({
    accessToken,
    user: {
      user_id: user.user_id,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
    },
  });
});

/** POST /api/auth/refresh */
router.post("/refresh", async (req, res) => {
  const db = (req as any).db; // authDb
  const refreshValue = req.cookies?.[COOKIE_NAME] as string | undefined;
  if (!refreshValue) return res.status(401).json({ error: "No refresh token" });

  const hash = hashRefreshToken(refreshValue);
  const { rows } = await db.query(
    `SELECT rt.user_id, u.role
       FROM auth.refresh_tokens rt
       JOIN auth.users u ON u.user_id = rt.user_id
      WHERE rt.token_hash=$1 AND rt.revoked_at IS NULL`,
    [hash]
  );

  const row = rows[0];
  if (!row) {
    res.clearCookie(COOKIE_NAME, refreshCookieOptions());
    return res.status(401).json({ error: "Invalid refresh token" });
  }

  const client = await db.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `UPDATE auth.refresh_tokens
          SET revoked_at=now(), last_used_at=now()
        WHERE token_hash=$1 AND revoked_at IS NULL`,
      [hash]
    );
    const newValue = createRefreshTokenValue();
    await client.query(
      `INSERT INTO auth.refresh_tokens (user_id, token_hash) VALUES ($1,$2)`,
      [row.user_id, hashRefreshToken(newValue)]
    );
    await client.query("COMMIT");

    res.cookie(COOKIE_NAME, newValue, refreshCookieOptions());
    const accessToken = signAccessToken(row.user_id, row.role);
    res.json({ accessToken, user: { user_id: row.user_id, email: row.email, role: row.role, full_name: row.full_name } });
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("REFRESH ERR:", (e as any)?.code, (e as any)?.message, (e as any)?.detail);
    res.status(500).json({ error: "Server error" });
  } finally {
    client.release();
  }
});

/** POST /api/auth/logout */
router.post("/logout", async (req, res) => {
  const db = (req as any).db; // authDb
  const refreshValue = req.cookies?.[COOKIE_NAME] as string | undefined;
  if (refreshValue) {
    await db.query(
      `UPDATE auth.refresh_tokens
          SET revoked_at=now()
        WHERE token_hash=$1 AND revoked_at IS NULL`,
      [hashRefreshToken(refreshValue)]
    );
  }
  res.clearCookie(COOKIE_NAME, refreshCookieOptions());
  res.json({ ok: true });
});

export default router;

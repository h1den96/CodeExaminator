// src/controllers/authController.ts
import { Request, Response } from "express";
import argon2 from "argon2";
import { Pool } from "pg";

import {
  signAccessToken,
  createRefreshTokenValue,
  hashRefreshToken,
  refreshCookieOptions,
} from "../auth/tokens";

interface ExtendedRequest extends Request {
  db: Pool;
}
const getDb = (req: ExtendedRequest): Pool => req.db || (req as any).db;

const COOKIE_NAME = process.env.COOKIE_NAME || "refresh_token";
// Ίδιο παράθυρο με το maxAge στο refreshCookieOptions() — server-side enforcement
// της λήξης, αφού το auth.refresh_tokens δεν έχει στήλη expires_at.
const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

// --- Shared rotation helper (χρησιμοποιείται από login() και refresh()) ---
async function issueRefreshToken(
  db: Pool,
  userId: number,
  oldRefreshValue?: string,
): Promise<string> {
  if (oldRefreshValue) {
    await db.query(
      `UPDATE auth.refresh_tokens SET revoked_at = now() WHERE token_hash = $1`,
      [hashRefreshToken(oldRefreshValue)],
    );
  }
  const newValue = createRefreshTokenValue();
  await db.query(
    `INSERT INTO auth.refresh_tokens (user_id, token_hash) VALUES ($1, $2)`,
    [userId, hashRefreshToken(newValue)],
  );
  return newValue;
}

// --- REGISTER (Matches /api/auth/register) ---
export const register = async (req: Request, res: Response) => {
  const { first_name, last_name, semester, email, password } = req.body || {};
  const db = getDb(req as ExtendedRequest);

  if (!email || !password || !first_name || !last_name) {
    return res.status(400).json({ error: "Invalid input or missing fields" });
  }

  const normalizedEmail = String(email).toLowerCase();
  const fullName = `${first_name} ${last_name}`.trim();

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    // 1. Check Email
    const exists = await client.query(
      "SELECT user_id FROM auth.users WHERE email=$1",
      [normalizedEmail],
    );
    if (exists.rows.length) {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "Email already in use" });
    }

    // 2. Hash Password
    const password_hash = await argon2.hash(password, {
      type: argon2.argon2id,
    });

    // 3. Create User
    const userRes = await client.query(
      `INSERT INTO auth.users (email, password_hash, full_name, role)
       VALUES ($1, $2, $3, 'student')
       RETURNING user_id, email, role, full_name`,
      [normalizedEmail, password_hash, fullName],
    );
    const user = userRes.rows[0];

    // 4. Create Student Profile (Crucial Step!)
    await client.query(
      `INSERT INTO exam.students (student_id, first_name, last_name, semester)
       VALUES ($1, $2, $3, $4)`,
      [user.user_id, first_name, last_name, semester || 1],
    );

    // 5. Refresh Token
    const refreshValue = createRefreshTokenValue();
    const refreshHash = hashRefreshToken(refreshValue);
    await client.query(
      `INSERT INTO auth.refresh_tokens (user_id, token_hash) VALUES ($1,$2)`,
      [user.user_id, refreshHash],
    );

    await client.query("COMMIT");

    res.cookie(COOKIE_NAME, refreshValue, refreshCookieOptions());
    const accessToken = signAccessToken(user.user_id, user.role);

    res.status(201).json({ accessToken, user });
  } catch (err: any) {
    await client.query("ROLLBACK");
    console.error("REGISTER ERR:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    client.release();
  }
};

// --- LOGIN ---
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body || {};
  const db = getDb(req as ExtendedRequest);
  const normalizedEmail = String(email).toLowerCase();

  try {
    const { rows } = await db.query(
      `SELECT user_id, email, role, password_hash, full_name
         FROM auth.users WHERE email=$1`,
      [normalizedEmail],
    );
    const user = rows[0];
    if (!user)
      return res.status(401).json({ error: "Email or password is incorrect" });

    const ok = await argon2.verify(user.password_hash, password);
    if (!ok)
      return res.status(401).json({ error: "Email or password is incorrect" });

    // Token Rotation (revoke παλιό αν υπάρχει, έκδοση νέου)
    const oldRefresh = req.cookies?.[COOKIE_NAME];
    const newValue = await issueRefreshToken(db, user.user_id, oldRefresh);

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
  } catch (err) {
    console.error("LOGIN ERR:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// --- REFRESH (rotation: επικυρώνει το cookie, ανακαλεί το παλιό, εκδίδει νέο ζεύγος) ---
export const refresh = async (req: Request, res: Response) => {
  const db = getDb(req as ExtendedRequest);
  const oldRefresh = req.cookies?.[COOKIE_NAME];

  if (!oldRefresh) {
    return res.status(401).json({ error: "No refresh token" });
  }

  try {
    const tokenHash = hashRefreshToken(oldRefresh);
    const { rows } = await db.query(
      `SELECT rt.id, rt.user_id, rt.revoked_at, rt.created_at, u.role
         FROM auth.refresh_tokens rt
         JOIN auth.users u ON u.user_id = rt.user_id
        WHERE rt.token_hash = $1`,
      [tokenHash],
    );
    const record = rows[0];

    if (!record || record.revoked_at) {
      res.clearCookie(COOKIE_NAME, refreshCookieOptions());
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    const ageMs = Date.now() - new Date(record.created_at).getTime();
    if (ageMs > REFRESH_TOKEN_MAX_AGE_MS) {
      await db.query(
        `UPDATE auth.refresh_tokens SET revoked_at = now() WHERE id = $1`,
        [record.id],
      );
      res.clearCookie(COOKIE_NAME, refreshCookieOptions());
      return res.status(401).json({ error: "Refresh token expired" });
    }

    const newValue = await issueRefreshToken(db, record.user_id, oldRefresh);
    res.cookie(COOKIE_NAME, newValue, refreshCookieOptions());

    const accessToken = signAccessToken(record.user_id, record.role);
    res.json({ accessToken });
  } catch (err) {
    console.error("REFRESH ERR:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// --- LOGOUT ---
export const logout = async (req: Request, res: Response) => {
  res.clearCookie(COOKIE_NAME, refreshCookieOptions());
  res.json({ ok: true });
};
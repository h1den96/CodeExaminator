// src/controllers/authController.ts
import { Request, Response } from "express";
import argon2 from "argon2";
import { examDb } from "../db/db";
import {
  signAccessToken,
  createRefreshTokenValue,
  hashRefreshToken,
  refreshCookieOptions,
} from "../auth/tokens";

const COOKIE_NAME = process.env.COOKIE_NAME || "refresh_token";

// --- REGISTER (Matches /api/auth/register) ---
export const register = async (req: Request, res: Response) => {
  const { first_name, last_name, semester, email, password } = req.body || {};

  if (!email || !password || !first_name || !last_name) {
    return res.status(400).json({ error: "Invalid input or missing fields" });
  }

  const normalizedEmail = String(email).toLowerCase();
  const fullName = `${first_name} ${last_name}`.trim();

  const client = await examDb.connect();

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
  const normalizedEmail = String(email).toLowerCase();

  try {
    const { rows } = await examDb.query(
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

    // Handle Token Refresh Logic...
    const oldRefresh = req.cookies?.[COOKIE_NAME];
    if (oldRefresh) {
      await examDb.query(
        `UPDATE auth.refresh_tokens SET revoked_at=now() WHERE token_hash=$1`,
        [hashRefreshToken(oldRefresh)],
      );
    }
    const newValue = createRefreshTokenValue();
    await examDb.query(
      `INSERT INTO auth.refresh_tokens (user_id, token_hash) VALUES ($1,$2)`,
      [user.user_id, hashRefreshToken(newValue)],
    );

    res.cookie(COOKIE_NAME, newValue, refreshCookieOptions());
    const accessToken = signAccessToken(user.user_id, user.role);

    res.json({
      accessToken,
      user: { user_id: user.user_id, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error("LOGIN ERR:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ... (refresh and logout can stay same or be imported)
export const refresh = async (req: Request, res: Response) => {
  /* ... reuse logic ... */
};
export const logout = async (req: Request, res: Response) => {
  res.clearCookie(COOKIE_NAME, refreshCookieOptions());
  res.json({ ok: true });
};

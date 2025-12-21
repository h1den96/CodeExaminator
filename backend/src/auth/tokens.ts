// src/auth/tokens.ts
import jwt from "jsonwebtoken";
import crypto from "crypto";
import type { CookieOptions } from "express";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "dev-access-secret";
const REFRESH_TTL_DAYS = Number(process.env.REFRESH_TOKEN_TTL_DAYS || 7);

export function signAccessToken(user_id: number, role: string) {
  const ttl = Number(process.env.ACCESS_TOKEN_TTL || 900); // 900s default
  console.log("[signAccessToken] using secret:", ACCESS_SECRET);
  return jwt.sign({ user_id, role }, ACCESS_SECRET, { expiresIn: ttl });
}

export function verifyAccessToken(token: string) {
  console.log("[verifyAccessToken] token starts with:", token.slice(0, 20));
  console.log("[verifyAccessToken] using secret:", ACCESS_SECRET);

  return jwt.verify(token, ACCESS_SECRET) as {
    user_id: number;
    role: string;
    iat: number;
    exp: number;
  };
}

export function createRefreshTokenValue(): string {
  return crypto.randomBytes(48).toString("hex");
}

export function hashRefreshToken(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function refreshCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 1000 * 60 * 60 * 24 * REFRESH_TTL_DAYS,
  };
}

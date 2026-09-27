import jwt from "jsonwebtoken";
import crypto from "crypto";

const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET as string;

const rawTTL = process.env.ACCESS_TOKEN_TTL || "24h";
const ACCESS_TOKEN_TTL = !isNaN(Number(rawTTL)) ? Number(rawTTL) : rawTTL;

export const signAccessToken = (user_id: number, role: string) => {
  if (!ACCESS_TOKEN_SECRET) {
    console.error("CRITICAL ERROR: JWT_ACCESS_SECRET is missing!");
    throw new Error("secretOrPrivateKey must have a value");
  }

  return jwt.sign(
    { user_id, role },
    ACCESS_TOKEN_SECRET,
    { expiresIn: ACCESS_TOKEN_TTL } as jwt.SignOptions
  );
};

export const verifyAccessToken = (token: string) => {
  if (!ACCESS_TOKEN_SECRET) throw new Error("JWT_ACCESS_SECRET is missing");

  return jwt.verify(token, ACCESS_TOKEN_SECRET) as {
    user_id: number;
    role: string;
  };
};

export const createRefreshTokenValue = () => crypto.randomBytes(40).toString("hex");

export const hashRefreshToken = (token: string) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

export const refreshCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
});
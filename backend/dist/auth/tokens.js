"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshCookieOptions = exports.hashRefreshToken = exports.createRefreshTokenValue = exports.verifyAccessToken = exports.signAccessToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
// 1. Φόρτωση και σιγουριά για το Secret
const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET;
// 2. Μετατροπή του TTL σε νούμερο αν είναι ψηφία, αλλιώς κράτημα ως string (π.χ. "24h")
const rawTTL = process.env.ACCESS_TOKEN_TTL || "24h";
const ACCESS_TOKEN_TTL = !isNaN(Number(rawTTL)) ? Number(rawTTL) : rawTTL;
const signAccessToken = (user_id, role) => {
    if (!ACCESS_TOKEN_SECRET) {
        console.error("CRITICAL ERROR: JWT_ACCESS_SECRET is missing!");
        throw new Error("secretOrPrivateKey must have a value");
    }
    // Χρησιμοποιούμε Type Assertion (as any) στο αντικείμενο αν συνεχίζει να χτυπάει, 
    // αλλά κανονικά με το σωστό secret θα αναγνωρίσει το σωστό overload.
    return jsonwebtoken_1.default.sign({ user_id, role }, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
};
exports.signAccessToken = signAccessToken;
const verifyAccessToken = (token) => {
    if (!ACCESS_TOKEN_SECRET)
        throw new Error("JWT_ACCESS_SECRET is missing");
    return jsonwebtoken_1.default.verify(token, ACCESS_TOKEN_SECRET);
};
exports.verifyAccessToken = verifyAccessToken;
// --- Refresh Token Helpers ---
const createRefreshTokenValue = () => crypto_1.default.randomBytes(40).toString("hex");
exports.createRefreshTokenValue = createRefreshTokenValue;
const hashRefreshToken = (token) => {
    return crypto_1.default.createHash("sha256").update(token).digest("hex");
};
exports.hashRefreshToken = hashRefreshToken;
const refreshCookieOptions = () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
});
exports.refreshCookieOptions = refreshCookieOptions;

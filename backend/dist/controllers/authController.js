"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.refresh = exports.login = exports.register = void 0;
const argon2_1 = __importDefault(require("argon2"));
const db_1 = require("../db/db");
const tokens_1 = require("../auth/tokens");
const COOKIE_NAME = process.env.COOKIE_NAME || "refresh_token";
// --- REGISTER (Matches /api/auth/register) ---
const register = async (req, res) => {
    const { first_name, last_name, semester, email, password } = req.body || {};
    if (!email || !password || !first_name || !last_name) {
        return res.status(400).json({ error: "Invalid input or missing fields" });
    }
    const normalizedEmail = String(email).toLowerCase();
    const fullName = `${first_name} ${last_name}`.trim();
    const client = await db_1.examDb.connect();
    try {
        await client.query("BEGIN");
        // 1. Check Email
        const exists = await client.query("SELECT user_id FROM auth.users WHERE email=$1", [normalizedEmail]);
        if (exists.rows.length) {
            await client.query("ROLLBACK");
            return res.status(409).json({ error: "Email already in use" });
        }
        // 2. Hash Password
        const password_hash = await argon2_1.default.hash(password, {
            type: argon2_1.default.argon2id,
        });
        // 3. Create User
        const userRes = await client.query(`INSERT INTO auth.users (email, password_hash, full_name, role)
       VALUES ($1, $2, $3, 'student')
       RETURNING user_id, email, role, full_name`, [normalizedEmail, password_hash, fullName]);
        const user = userRes.rows[0];
        // 4. Create Student Profile (Crucial Step!)
        await client.query(`INSERT INTO exam.students (student_id, first_name, last_name, semester)
       VALUES ($1, $2, $3, $4)`, [user.user_id, first_name, last_name, semester || 1]);
        // 5. Refresh Token
        const refreshValue = (0, tokens_1.createRefreshTokenValue)();
        const refreshHash = (0, tokens_1.hashRefreshToken)(refreshValue);
        await client.query(`INSERT INTO auth.refresh_tokens (user_id, token_hash) VALUES ($1,$2)`, [user.user_id, refreshHash]);
        await client.query("COMMIT");
        res.cookie(COOKIE_NAME, refreshValue, (0, tokens_1.refreshCookieOptions)());
        const accessToken = (0, tokens_1.signAccessToken)(user.user_id, user.role);
        res.status(201).json({ accessToken, user });
    }
    catch (err) {
        await client.query("ROLLBACK");
        console.error("REGISTER ERR:", err);
        res.status(500).json({ error: "Server error" });
    }
    finally {
        client.release();
    }
};
exports.register = register;
// --- LOGIN ---
const login = async (req, res) => {
    const { email, password } = req.body || {};
    const normalizedEmail = String(email).toLowerCase();
    try {
        const { rows } = await db_1.examDb.query(`SELECT user_id, email, role, password_hash, full_name
         FROM auth.users WHERE email=$1`, [normalizedEmail]);
        const user = rows[0];
        if (!user)
            return res.status(401).json({ error: "Email or password is incorrect" });
        const ok = await argon2_1.default.verify(user.password_hash, password);
        if (!ok)
            return res.status(401).json({ error: "Email or password is incorrect" });
        // Handle Token Refresh Logic...
        const oldRefresh = req.cookies?.[COOKIE_NAME];
        if (oldRefresh) {
            await db_1.examDb.query(`UPDATE auth.refresh_tokens SET revoked_at=now() WHERE token_hash=$1`, [(0, tokens_1.hashRefreshToken)(oldRefresh)]);
        }
        const newValue = (0, tokens_1.createRefreshTokenValue)();
        await db_1.examDb.query(`INSERT INTO auth.refresh_tokens (user_id, token_hash) VALUES ($1,$2)`, [user.user_id, (0, tokens_1.hashRefreshToken)(newValue)]);
        res.cookie(COOKIE_NAME, newValue, (0, tokens_1.refreshCookieOptions)());
        const accessToken = (0, tokens_1.signAccessToken)(user.user_id, user.role);
        res.json({
            accessToken,
            user: {
                user_id: user.user_id,
                email: user.email,
                role: user.role,
                full_name: user.full_name // 🔥 Προσθήκη ονόματος
            },
        });
    }
    catch (err) {
        console.error("LOGIN ERR:", err);
        res.status(500).json({ error: "Server error" });
    }
};
exports.login = login;
// ... (refresh and logout can stay same or be imported)
const refresh = async (req, res) => {
    /* ... reuse logic ... */
};
exports.refresh = refresh;
const logout = async (req, res) => {
    res.clearCookie(COOKIE_NAME, (0, tokens_1.refreshCookieOptions)());
    res.json({ ok: true });
};
exports.logout = logout;

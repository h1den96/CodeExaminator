"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
exports.requireTeacher = requireTeacher;
const tokens_1 = require("../auth/tokens");
function requireAuth(req, res, next) {
    console.log("[requireAuth] called for", req.method, req.originalUrl);
    const authHeader = req.headers.authorization;
    console.log("[requireAuth] Incoming Authorization header:", authHeader);
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        console.log("[requireAuth] Missing or malformed Authorization header");
        return res.status(401).json({ error: "Unauthorized" });
    }
    const token = authHeader.slice("Bearer ".length);
    try {
        const payload = (0, tokens_1.verifyAccessToken)(token);
        console.log("[requireAuth] JWT payload:", payload);
        req.user = {
            user_id: payload.user_id,
            role: payload.role,
        };
        return next();
    }
    catch (err) {
        console.error("[requireAuth] JWT verification failed:", err);
        return res.status(401).json({ error: "Unauthorized" });
    }
}
function requireTeacher(req, res, next) {
    const user = req.user;
    // Safety check: if requireAuth wasn't called or failed silently
    if (!user) {
        console.error("[requireTeacher] No user found on request. Did you forget requireAuth?");
        return res.status(401).json({ error: "Unauthorized" });
    }
    console.log(`[requireTeacher] Checking role for user ${user.user_id}: ${user.role}`);
    if (user.role !== "teacher") {
        console.warn(`[requireTeacher] Access denied. User ${user.user_id} is not a teacher.`);
        return res.status(403).json({ error: "Access Denied: Teachers only" });
    }
    next();
}

// src/middleware/requireAuth.ts
import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../auth/tokens";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  console.log("[requireAuth] called for", req.method, req.originalUrl);

  const authHeader = req.headers.authorization;
  console.log("[requireAuth] Incoming Authorization header:", authHeader);

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("[requireAuth] Missing or malformed Authorization header");
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.slice("Bearer ".length);

  try {
    const payload = verifyAccessToken(token);
    console.log("[requireAuth] JWT payload:", payload);

    (req as any).user = {
      user_id: payload.user_id,
      role: payload.role,
    };

    return next();
  } catch (err) {
    console.error("[requireAuth] JWT verification failed:", err);
    return res.status(401).json({ error: "Unauthorized" });
  }
}

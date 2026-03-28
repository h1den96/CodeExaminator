// src/db/db.ts
import { Pool } from "pg";

function makeUrlForUser(base: string, user: string, password: string) {
  const u = new URL(base);
  // Override credentials
  u.username = encodeURIComponent(user);
  u.password = encodeURIComponent(password);
  // Ensure TCP (avoid unix socket surprises) and IPv4 loopback
  if (u.hostname === "localhost") u.hostname = "127.0.0.1";
  return u.toString();
}

const BASE_URL = process.env.DATABASE_URL!;
if (!BASE_URL) {
  throw new Error("DATABASE_URL is not set in .env");
}

const AUTH_URL = makeUrlForUser(
  BASE_URL,
  process.env.APP_AUTH_DB_USER || "app_auth",
  process.env.APP_AUTH_DB_PASSWORD || "",
);

const EXAM_URL = makeUrlForUser(
  BASE_URL,
  process.env.APP_EXAM_DB_USER || "app_exam",
  process.env.APP_EXAM_DB_PASSWORD || "",
);

export const authDb = new Pool({ connectionString: AUTH_URL });
export const examDb = new Pool({ connectionString: EXAM_URL });

// Set schema search_path on every new connection
authDb.on("connect", (c) => c.query("SET search_path TO auth, public"));
examDb.on("connect", (c) => c.query("SET search_path TO exam, public"));

// Optional health logs (nice to keep)
authDb
  .query("select current_user, current_setting('search_path') as sp")
  .then((r) => console.log("authDb:", r.rows[0]))
  .catch((e) => console.error("authDb connect error:", e));

examDb
  .query("select current_user, current_setting('search_path') as sp")
  .then((r) => console.log("examDb:", r.rows[0]))
  .catch((e) => console.error("examDb connect error:", e));

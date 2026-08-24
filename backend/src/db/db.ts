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

// search_path περνάει ως libpq startup option, ώστε η Postgres να το θέτει
// στο ίδιο το handshake κάθε νέου connection, χωρίς ξεχωριστό client.query()
// μετά τη σύνδεση (που προκαλούσε το "client already executing a query"
// deprecation warning λόγω race με τα queries πιο κάτω).
export const authDb = new Pool({
  connectionString: AUTH_URL,
  options: "-c search_path=auth,public",
});
export const examDb = new Pool({
  connectionString: EXAM_URL,
  options: "-c search_path=exam,public",
});

// Optional health logs (nice to keep)
authDb
  .query("select current_user, current_setting('search_path') as sp")
  .then((r) => console.log("authDb:", r.rows[0]))
  .catch((e) => console.error("authDb connect error:", e));

examDb
  .query("select current_user, current_setting('search_path') as sp")
  .then((r) => console.log("examDb:", r.rows[0]))
  .catch((e) => console.error("examDb connect error:", e));
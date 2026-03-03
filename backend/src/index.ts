// src/index.ts
import "dotenv/config";
import express from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import cors from "cors";
import cookieParser from "cookie-parser";

import { authDb, examDb } from "./db/db";
import authRouter from "./routes/auth";
import routes from "./routes/routes";
import testRouter from "./routes/testStart";
import submissionRouter from "./routes/submissions";

const app = express();
const PgStore = connectPg(session);

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.use(
  session({
    store: new PgStore({
      pool: authDb,
      tableName: "session",
      schemaName: "auth",
    }),
    name: "sid",
    secret: process.env.SESSION_SECRET || "dev-only-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  })
);

// ---------- AUTH ----------
app.use(
  "/api/auth",
  (req, _res, next) => {
    (req as any).db = authDb;
    next();
  },
  authRouter
);

// ---------- TESTS (start / submit / available) ----------
app.use(
  "/api/test",
  (req, _res, next) => {
    console.log("[/api/test] hit", req.method, req.path);
    (req as any).db = examDb;
    next();
  },
  testRouter
);

// ---------- SUBMISSIONS (Moved ABOVE the generic /api routes!) ----------
app.use(
  "/api/submissions",
  (req, _res, next) => {
    (req as any).db = examDb;
    next();
  },
  submissionRouter
);

// ---------- OTHER EXAM ROUTES ----------
app.use(
  "/api",
  (req, _res, next) => {
    (req as any).db = examDb;
    next();
  },
  routes
);

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});
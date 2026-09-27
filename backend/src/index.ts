
import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import { authDb, examDb } from "./db/db";
import authRouter from "./routes/auth";
import routes from "./routes/routes";
import testRouter from "./routes/testStart";
import submissionRouter from "./routes/submissions";
import "./jobs/autoSubmitJob";
import teacherReviewRouter from "./routes/teacherReviewRoute";
import { requireAuth, requireTeacher } from "./middleware/requireAuth";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

app.use(
  "/api/auth",
  (req, _res, next) => {
    (req as any).db = authDb;
    next();
  },
  authRouter,
);

app.use(
  "/api/test",
  (req, _res, next) => {
    console.log("[/api/test] hit", req.method, req.path);
    (req as any).db = examDb;
    next();
  },
  testRouter,
);

app.use(
  "/api/submissions",
  (req, _res, next) => {
    console.log("[/api/submissions] hit", req.method, req.path);
    (req as any).db = examDb;
    next();
  },
  submissionRouter,
);

app.use(
  "/api/teacher",
  requireAuth,
  requireTeacher,
  (req, _res, next) => {
    (req as any).db = examDb;
    next();
  },
  teacherReviewRouter
);

app.use(
  "/api",
  (req, _res, next) => {
    (req as any).db = examDb;
    next();
  },
  routes,
);

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});
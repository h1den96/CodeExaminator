"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/index.ts
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const express_session_1 = __importDefault(require("express-session"));
const connect_pg_simple_1 = __importDefault(require("connect-pg-simple"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const db_1 = require("./db/db");
const auth_1 = __importDefault(require("./routes/auth"));
const routes_1 = __importDefault(require("./routes/routes"));
const testStart_1 = __importDefault(require("./routes/testStart"));
const submissions_1 = __importDefault(require("./routes/submissions"));
require("./jobs/autoSubmitJob");
const app = (0, express_1.default)();
const PgStore = (0, connect_pg_simple_1.default)(express_session_1.default);
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
}));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use((0, express_session_1.default)({
    store: new PgStore({
        pool: db_1.authDb,
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
}));
// ---------- AUTH ----------
app.use("/api/auth", (req, _res, next) => {
    req.db = db_1.authDb;
    next();
}, auth_1.default);
// ---------- TESTS (start / submit / available) ----------
app.use("/api/test", (req, _res, next) => {
    console.log("[/api/test] hit", req.method, req.path);
    req.db = db_1.examDb;
    next();
}, testStart_1.default);
// ---------- SUBMISSIONS (Moved ABOVE the generic /api routes!) ----------
app.use("/api/submissions", (req, _res, next) => {
    console.log("[/api/submissions] hit", req.method, req.path); // 🎯 ΠΡΟΣΘΕΣΕ ΑΥΤΟ
    req.db = db_1.examDb;
    next();
}, submissions_1.default);
// ---------- OTHER EXAM ROUTES ----------
app.use("/api", (req, _res, next) => {
    req.db = db_1.examDb;
    next();
}, routes_1.default);
const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
    console.log(`Backend listening on http://localhost:${port}`);
});

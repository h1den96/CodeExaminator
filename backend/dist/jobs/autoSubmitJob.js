"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_cron_1 = __importDefault(require("node-cron"));
const db_1 = require("../db/db");
const submissionService_1 = require("../services/submissionService");
node_cron_1.default.schedule("* * * * *", async () => {
    try {
        const query = `
        SELECT s.submission_id 
        FROM exam.submissions s
        JOIN exam.tests t ON s.test_id = t.test_id
        WHERE s.status = 'in_progress' 
        AND NOW() > (s.started_at + (t.duration_minutes * interval '1 minute'))
    `;
        const expiredSubmissions = await db_1.examDb.query(query);
        if (expiredSubmissions.rows.length === 0)
            return;
        console.log(`[CRON] Found ${expiredSubmissions.rows.length} expired test(s).`);
        for (const sub of expiredSubmissions.rows) {
            try {
                await submissionService_1.SubmissionService.submitAndGrade(sub.submission_id, "SYSTEM_CRON", db_1.examDb);
                console.log(`[CRON] Auto-Submitted ID: ${sub.submission_id}`);
            }
            catch (err) {
                const errorMsg = err instanceof Error ? err.message : String(err);
                console.error(`[CRON] Error on ID ${sub.submission_id}:`, errorMsg);
            }
        }
    }
    catch (error) {
        console.error("[CRON] Fatal Error:", error);
    }
});

import cron from "node-cron";
import { examDb } from "../db/db";
import { SubmissionService } from "../services/submissionService";

cron.schedule("* * * * *", async () => {
  try {
    const query = `
        SELECT s.submission_id 
        FROM exam.submissions s
        JOIN exam.tests t ON s.test_id = t.test_id
        WHERE s.status = 'in_progress' 
        AND NOW() > (s.started_at + (t.duration_minutes * interval '1 minute'))
    `;
    
    const expiredSubmissions = await examDb.query(query);
    if (expiredSubmissions.rows.length === 0) return;

    console.log(`[CRON] Found ${expiredSubmissions.rows.length} expired test(s).`);

    for (const sub of expiredSubmissions.rows) {
        try {
            await SubmissionService.submitAndGrade(sub.submission_id, "SYSTEM_CRON", examDb);
            console.log(`[CRON] Auto-Submitted ID: ${sub.submission_id}`);
        } catch (err: any) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            console.error(`[CRON] Error on ID ${sub.submission_id}:`, errorMsg);
        }
    }
  } catch (error) {
    console.error("[CRON] Fatal Error:", error);
  }
});
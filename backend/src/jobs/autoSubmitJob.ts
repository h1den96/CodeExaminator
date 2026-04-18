// src/jobs/autoSubmitJob.ts
import cron from "node-cron";
import { examDb } from "../db/db";
import { SubmissionService } from "../services/submissionService";

// Τα 5 αστεράκια σημαίνουν: "Τρέξε κάθε 1 λεπτό"
cron.schedule("* * * * *", async () => {
  // Uncomment την παρακάτω γραμμή αν θέλεις να βλέπεις ότι τρέχει κάθε λεπτό (συνήθως το κρύβουμε για να μη γεμίζει το terminal)
  // console.log("[CRON] Sweeping for expired tests...");
  
  try {
    // 1. Βρες όλα τα submissions που είναι 'started' αλλά ο χρόνος τους έχει περάσει
    const query = `
        SELECT s.submission_id, s.student_id 
        FROM exam.submissions s
        JOIN exam.tests t ON s.test_id = t.test_id
        WHERE s.status = 'started' 
        AND NOW() > (s.started_at + (t.duration_minutes * interval '1 minute'))
    `;
    
    const expiredSubmissions = await examDb.query(query);

    if (expiredSubmissions.rows.length === 0) {
        return; // Δεν βρέθηκε κανένα ληγμένο τεστ
    }

    console.log(`[CRON] Found ${expiredSubmissions.rows.length} expired test(s). Starting Auto-Submit...`);

    // 2. Κάνε auto-submit για το καθένα χρησιμοποιώντας το TEACHER_BYPASS
    for (const sub of expiredSubmissions.rows) {
        try {
            console.log(`[CRON] Processing Submission ID: ${sub.submission_id}`);
            await SubmissionService.submitAndGrade(sub.submission_id, "TEACHER_BYPASS", examDb);
            console.log(`[CRON] Successfully Auto-Submitted ID: ${sub.submission_id}`);
        } catch (err) {
            console.error(`[CRON] Failed to grade Submission ID: ${sub.submission_id}`, err);
        }
    }
  } catch (error) {
    console.error("[CRON] Critical error during auto-submit sweep:", error);
  }
});
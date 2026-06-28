import type { Pool } from "pg";

export class SecurityAuditService {
  /**
   * Καταγράφει μια απόπειρα παραβίασης ασφαλείας
   */
  static async logViolation(
    studentId: string, 
    questionId: string, 
    code: string, 
    reason: string,
    db?: Pool
  ) {
    // 1. Άμεση ειδοποίηση στο τερματικό του Backend
    console.error("--------------------------------------------------");
    console.error("!!! SECURITY ALERT !!!");
    console.error(`Student ID: ${studentId}`);
    console.error(`Question ID: ${questionId}`);
    console.error(`Violation: ${reason}`);
    console.error("Attempted Code Snapshot:");
    console.error(code.substring(0, 200) + "...");
    console.error("--------------------------------------------------");

    // 2. Αποθήκευση στη βάση (αν υπάρχει διαθέσιμο το db pool)
    if (db) {
      try {
        const query = `
          INSERT INTO exam.security_alerts (
            student_id, 
            question_id, 
            attempted_code, 
            violation_type, 
            detected_at
          ) VALUES ($1, $2, $3, $4, NOW())
        `;
        await db.query(query, [studentId, questionId, code, reason]);
      } catch (err) {
        console.error("Failed to save security alert to database:", err);
      }
    }
  }
}
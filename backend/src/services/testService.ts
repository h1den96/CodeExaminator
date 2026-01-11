// src/services/testService.ts
import { Pool } from "pg";

export class TestService {
  
  /**
   * Fetches the Test Template and its Questions.
   * Useful for previewing a static test.
   */
  static async getTestWithQuestions(testId: number, db: Pool) {
    // 1. Get Test Details
    const tRes = await db.query(`SELECT * FROM exam.tests WHERE test_id = $1`, [testId]);
    const test = tRes.rows[0];
    if (!test) throw new Error("Test not found");

    // 2. Get Questions
    const qRes = await db.query(`
      SELECT q.*, tq.points 
      FROM exam.questions q
      JOIN exam.test_questions tq ON q.question_id = tq.question_id
      WHERE tq.test_id = $1
      ORDER BY tq.position ASC
    `, [testId]);

    test.questions = qRes.rows;

    // 3. Attach Options (SAFE MODE: Returns both formats)
    for (const q of test.questions) {
      if (q.question_type === 'mcq') {
        const optRes = await db.query(
          `SELECT 
              option_id, option_text,             -- Legacy keys (keeps old mappers working)
              option_id as id, option_text as text -- New keys (for clean frontend)
           FROM exam.mcq_options 
           WHERE question_id = $1 
           ORDER BY option_id`, 
          [q.question_id]
        );
        q.options = optRes.rows;
      }
    }

    return test;
  }

  /**
   * Reconstructs a test exactly as it was generated for a specific student.
   * CRITICAL for resuming "Random" tests.
   */
  static async reconstructTestFromSubmission(submissionId: number, db: Pool) {
    // 1. Get Submission & Test Details
    const subRes = await db.query(`
        SELECT s.submission_id, t.* FROM exam.submissions s
        JOIN exam.tests t ON s.test_id = t.test_id
        WHERE s.submission_id = $1
    `, [submissionId]);
    
    const test = subRes.rows[0];
    if (!test) throw new Error("Submission not found");

    // 2. Get Questions from SUBMISSION_QUESTIONS
    // Added q.allow_multiple so checkboxes render correctly on resume
    const qRes = await db.query(`
      SELECT q.*, sq.points, sq.q_order, q.allow_multiple 
      FROM exam.questions q
      JOIN exam.submission_questions sq ON q.question_id = sq.question_id
      WHERE sq.submission_id = $1
      ORDER BY sq.q_order ASC
    `, [submissionId]);

    test.questions = qRes.rows;

    // 3. Attach Options (SAFE MODE: Returns both formats)
    for (const q of test.questions) {
      if (q.question_type === 'mcq') {
        const optRes = await db.query(
          `SELECT 
              option_id, option_text,             -- Legacy keys
              option_id as id, option_text as text -- New keys
           FROM exam.mcq_options 
           WHERE question_id = $1 
           ORDER BY option_id`, 
          [q.question_id]
        );
        q.options = optRes.rows;
      }
    }

    return test;
  }
}
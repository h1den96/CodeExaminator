import { Pool } from "pg";

export class TestService {
  
  /**
   * Fetches the Test Template and its Questions.
   */
  static async getTestWithQuestions(testId: number, db: Pool) {
    const tRes = await db.query(`SELECT * FROM exam.tests WHERE test_id = $1`, [testId]);
    const test = tRes.rows[0];
    if (!test) throw new Error("Test not found");

    const qRes = await db.query(`
      SELECT q.*, tq.points 
      FROM exam.questions q
      JOIN exam.test_questions tq ON q.question_id = tq.question_id
      WHERE tq.test_id = $1
      ORDER BY tq.position ASC
    `, [testId]);

    test.questions = qRes.rows;

    for (const q of test.questions) {
      if (q.question_type === 'mcq') {
        const optRes = await db.query(
          `SELECT option_id, option_text, option_id as id, option_text as text
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
   * Reconstructs a test AND includes saved student answers for hydration.
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

    // 2. Updated Query to JOIN student_answers
    const qRes = await db.query(`
      SELECT 
        q.*, 
        sq.points, 
        sq.q_order, 
        q.allow_multiple,
        sa.mcq_option_ids as student_mcq, -- Saved MCQ selections
        sa.tf_answer as student_tf,      -- Saved True/False choice
        sa.code_answer as student_code   -- Saved Code
      FROM exam.questions q
      JOIN exam.submission_questions sq ON q.question_id = sq.question_id
      LEFT JOIN exam.student_answers sa ON sq.submission_question_id = sa.submission_question_id
      WHERE sq.submission_id = $1
      ORDER BY sq.q_order ASC
    `, [submissionId]);

    test.questions = qRes.rows;

    // 3. Attach Options
    for (const q of test.questions) {
      if (q.question_type === 'mcq') {
        const optRes = await db.query(
          `SELECT option_id, option_text, option_id as id, option_text as text
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
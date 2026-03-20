import { Pool } from "pg";

export class TestService {
  
  static async getTestWithQuestions(testId: number, db: Pool) {
    const tRes = await db.query(`SELECT * FROM exam.tests WHERE test_id = $1`, [testId]);
    const test = tRes.rows[0];
    if (!test) throw new Error("Test not found");

    const qRes = await db.query(`
      SELECT q.*, tq.points, pq.starter_code 
      FROM exam.questions q
      JOIN exam.test_questions tq ON q.question_id = tq.question_id
      LEFT JOIN exam.programming_questions pq ON q.question_id = pq.question_id
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

  static async reconstructTestFromSubmission(submissionId: number, db: Pool) {
    const subRes = await db.query(`
        SELECT s.submission_id, t.* FROM exam.submissions s
        JOIN exam.tests t ON s.test_id = t.test_id
        WHERE s.submission_id = $1
    `, [submissionId]);
    
    const test = subRes.rows[0];
    if (!test) throw new Error("Submission not found");

    const qRes = await db.query(`
      SELECT 
        q.question_id, 
        q.title, 
        q.body, 
        q.question_type,
        sq.points, 
        pq.starter_code,
        sa.code_answer as student_code
      FROM exam.questions q
      JOIN exam.submission_questions sq ON q.question_id = sq.question_id
      LEFT JOIN exam.programming_questions pq ON q.question_id = pq.question_id
      LEFT JOIN exam.student_answers sa ON sq.submission_question_id = sa.submission_question_id
      WHERE sq.submission_id = $1
    `, [submissionId]);
        
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
}
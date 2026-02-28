/*import type { Pool } from "pg";
import { ExamDiscoveryService } from "./ExamDiscoveryService";
import { GradingService } from "./gradingService"; 
import { TestService } from "./testService"; 
import type { TestTemplateRow, RandomizerSpec, TestDTO, SubmitAnswerDto } from "../types/examTypes";

export class SubmissionService {

  static async startTestForStudent(
    testId: number,
    studentId: string,
    db: Pool
  ): Promise<{ submissionId: number; dto: TestDTO }> {
    
    // 1. Fetch Template
    const tRes = await db.query<TestTemplateRow>(
      `SELECT * FROM exam.tests WHERE test_id = $1`,
      [testId]
    );
    const t = tRes.rows[0];
    if (!t) throw new Error(`Test template with id=${testId} not found`);

    // 2. Check for existing 'in_progress' submission
    const existingRes = await db.query(
      `SELECT submission_id, status, started_at FROM exam.submissions
       WHERE student_id = $1 AND test_id = $2
       ORDER BY started_at DESC LIMIT 1`,
      [studentId, testId]
    );

    const existingSubmission = existingRes.rows[0];

    // --- RESUME LOGIC START ---
    if (existingSubmission) {
       // A. If already finished, block restart
       if (existingSubmission.status === 'completed' || existingSubmission.status === 'graded' || existingSubmission.status === 'submitted') {
           throw new Error("You have already submitted this test.");
       }

       // B. Resume In-Progress Test
       const fullTest = await TestService.reconstructTestFromSubmission(existingSubmission.submission_id, db);
       
       return { 
           submissionId: existingSubmission.submission_id,
           dto: {
               ...fullTest,
               started_at: existingSubmission.started_at,
               duration_minutes: t.duration_minutes,
               available_until: t.available_until,
               strict_deadline: t.strict_deadline
           }
       };
    }
    // --- RESUME LOGIC END ---

    // 3. Create NEW Submission
    const spec: RandomizerSpec = {
      counts: {
        tf: t.tf_count,
        mcq: t.mcq_count,
        prog: t.prog_count,
      },
      config: t.generation_config || {} 
    };

    // Use Discovery Service to get questions
    const rows = await ExamDiscoveryService.generateRandomTest(spec, db);

    // 4. Save Submission
    const sRes = await db.query(
      `INSERT INTO exam.submissions (student_id, test_id, status, started_at)
       VALUES ($1, $2, 'in_progress', NOW()) 
       RETURNING submission_id, started_at`,
      [studentId, t.test_id]
    );
    
    const submissionId: number = sRes.rows[0].submission_id;
    const startedAt: string = sRes.rows[0].started_at;

    // 5. Save Questions
    let order = 1;
    for (const q of rows) {
      const qt: string = q.question_type;
      
      const points =
        qt === "true_false" ? t.tf_points
        : qt === "mcq" ? t.mcq_points
        : t.prog_points;

      await db.query(
        `INSERT INTO exam.submission_questions
           (submission_id, question_id, q_order, points)
         VALUES ($1, $2, $3, $4)`,
        [submissionId, q.question_id, order, points]
      );
      
      (q as any).points = points; 

      order++;
    }

    return { 
      submissionId, 
      dto: { 
        test_id: t.test_id, 
        title: t.title, 
        description: t.description, 
        questions: rows,
        duration_minutes: t.duration_minutes,
        available_until: t.available_until,
        strict_deadline: t.strict_deadline,
        started_at: startedAt
      } 
    };
  }

  static async saveSingleAnswer(
    submissionId: number,
    studentId: string,
    dto: SubmitAnswerDto,
    db: Pool
  ): Promise<void> {
    const subCheck = await db.query(
      `SELECT submission_id FROM exam.submissions 
       WHERE submission_id = $1 AND student_id = $2 AND status = 'in_progress'`,
      [submissionId, studentId]
    );
    if (subCheck.rowCount === 0) throw new Error("Submission not found or not active");

    const sqRes = await db.query(
      `SELECT submission_question_id FROM exam.submission_questions 
       WHERE submission_id = $1 AND question_id = $2`,
      [submissionId, dto.question_id]
    );
    if (sqRes.rowCount === 0) throw new Error("Question not found in this submission");

    const submissionQuestionId = sqRes.rows[0].submission_question_id;

    const mcqVal = dto.mcq_option_ids || null;
    const tfVal = dto.tf_answer ?? null;
    const codeVal = dto.code_answer || null;

    const existingAns = await db.query(
      `SELECT answer_id FROM exam.student_answers WHERE submission_question_id = $1`,
      [submissionQuestionId]
    );

    if (existingAns.rowCount && existingAns.rowCount > 0) {
      await db.query(
        `UPDATE exam.student_answers
         SET mcq_option_ids = $1, tf_answer = $2, code_answer = $3, answered_at = now()
         WHERE submission_question_id = $4`,
        [mcqVal, tfVal, codeVal, submissionQuestionId]
      );
    } else {
      await db.query(
        `INSERT INTO exam.student_answers (submission_question_id, mcq_option_ids, tf_answer, code_answer)
         VALUES ($1, $2, $3, $4)`,
        [submissionQuestionId, mcqVal, tfVal, codeVal]
      );
    }
  }

  // 👇 UPDATED: Contains Static Analysis + Final Grade Calculation
  static async submitAndGrade(
    submissionId: number,
    studentId: string,
    db: Pool
  ) {
    const client = await db.connect();
    try {
      await client.query("BEGIN");

      // 1. Lock & Check Status
      const subRes = await client.query(
        `SELECT s.status, t.enable_negative_grading
         FROM exam.submissions s
         JOIN exam.tests t ON s.test_id = t.test_id
         WHERE s.submission_id = $1 AND s.student_id = $2
         FOR UPDATE`,
        [submissionId, studentId]
      );

      if ((subRes.rowCount ?? 0) === 0) throw new Error("submission_not_found");
      const { status, enable_negative_grading } = subRes.rows[0];

      if (status !== 'in_progress') throw new Error("already_submitted");

      // 2. Fetch Data for Grading (Including Static Analysis Rules)
      const dataQuery = `
        SELECT 
          sa.answer_id,
          sa.submission_question_id,
          sa.mcq_option_ids,
          sa.tf_answer,
          sa.code_answer, -- Needed for static analysis
          sa.question_grade, 
          q.question_type,
          sq.points as question_points,
          tf.correct_answer as tf_correct,
          (
            SELECT json_agg(json_build_object('id', mo.option_id, 'weight', mo.score_weight))
            FROM exam.mcq_options mo
            WHERE mo.question_id = q.question_id
          ) as mcq_options_data,
          -- 👇 Get Forbidden/Required Keywords
          pq.forbidden_keywords, 
          pq.required_keywords
        FROM exam.student_answers sa
        JOIN exam.submission_questions sq ON sa.submission_question_id = sq.submission_question_id
        JOIN exam.questions q ON sq.question_id = q.question_id
        LEFT JOIN exam.true_false_answers tf ON q.question_id = tf.question_id
        LEFT JOIN exam.programming_questions pq ON q.question_id = pq.question_id
        WHERE sq.submission_id = $1
      `;
      
      const { rows: answers } = await client.query(dataQuery, [submissionId]);
      let totalScore = 0;

      // 3. Calculate Grades
      for (const ans of answers) {
        let earnedPoints = 0;

        if (ans.question_type === 'mcq') {
          earnedPoints = GradingService.calculateMCQ(
            Number(ans.question_points),
            ans.mcq_options_data || [],
            ans.mcq_option_ids || [],
            enable_negative_grading
          );
        } else if (ans.question_type === 'true_false') {
          earnedPoints = GradingService.calculateTrueFalse(
            Number(ans.question_points),
            ans.tf_answer,
            ans.tf_correct
          );
        } else if (ans.question_type === 'programming') {
           // A. Start with Grade from "Run Code" button (stored in DB)
           earnedPoints = Number(ans.question_grade) || 0;

           // B. Run Static Analysis (Security/Cheating Check)
           const staticCheck = GradingService.performStaticAnalysis(
               ans.code_answer || "", 
               ans.forbidden_keywords || [], 
               ans.required_keywords || []
           );

           if (!staticCheck.passed) {
               // ❌ Violation Detected -> 0 Points
               console.log(`Question ${ans.submission_question_id} failed static analysis: ${staticCheck.error}`);
               earnedPoints = 0; 
           }
        }

        // Save confirmed grade for this question
        await client.query(
          `UPDATE exam.student_answers SET question_grade = $1 WHERE answer_id = $2`,
          [earnedPoints, ans.answer_id]
        );

        totalScore += earnedPoints;
      }

      // 4. Update Main Submission Record (Finish Exam)
      await client.query(
        `UPDATE exam.submissions
         SET status = 'submitted', submitted_at = now(), total_grade = $2
         WHERE submission_id = $1`,
        [submissionId, totalScore]
      );

      await client.query("COMMIT");
      return { submission_id: submissionId, status: 'submitted', final_score: totalScore };

    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }
  
  static async getAvailableTestsForStudent(studentId: number | string, db: Pool) {
      return ExamDiscoveryService.getAvailableTestsForStudent(studentId, db);
  }
}*/

import type { Pool } from "pg";
import { ExamDiscoveryService } from "./ExamDiscoveryService";
import { GradingService } from "./gradingService"; 
import { TestService } from "./testService"; 
import type { TestTemplateRow, RandomizerSpec, TestDTO, SubmitAnswerDto } from "../types/examTypes";

export class SubmissionService {

  static async startTestForStudent(
    testId: number,
    studentId: string,
    db: Pool
  ): Promise<{ submissionId: number; dto: TestDTO }> {
    
    // 1. Fetch Template
    const tRes = await db.query<TestTemplateRow>(
      `SELECT * FROM exam.tests WHERE test_id = $1`,
      [testId]
    );
    const t = tRes.rows[0];
    if (!t) throw new Error(`Test template with id=${testId} not found`);

    // 2. Check for existing 'in_progress' submission
    const existingRes = await db.query(
      `SELECT submission_id, status, started_at FROM exam.submissions
       WHERE student_id = $1 AND test_id = $2
       ORDER BY started_at DESC LIMIT 1`,
      [studentId, testId]
    );

    const existingSubmission = existingRes.rows[0];

    // --- RESUME LOGIC ---
    if (existingSubmission) {
       if (['completed', 'graded', 'submitted'].includes(existingSubmission.status)) {
           throw new Error("You have already submitted this test.");
       }

       // ✅ This works perfectly for resume, so we will reuse it for new tests too!
       const fullTest = await TestService.reconstructTestFromSubmission(existingSubmission.submission_id, db);
       
       return { 
           submissionId: existingSubmission.submission_id,
           dto: {
               ...fullTest,
               started_at: existingSubmission.started_at,
               duration_minutes: t.duration_minutes,
               available_until: t.available_until,
               strict_deadline: t.strict_deadline
           }
       };
    }

    // 3. Create NEW Submission
    const spec: RandomizerSpec = {
      counts: {
        tf: t.tf_count,
        mcq: t.mcq_count,
        prog: t.prog_count,
      },
      config: t.generation_config || {} 
    };

    // Use Discovery Service to get questions
    const rows = await ExamDiscoveryService.generateRandomTest(spec, db);

    // 4. Save Submission Record
    const sRes = await db.query(
      `INSERT INTO exam.submissions (student_id, test_id, status, started_at)
       VALUES ($1, $2, 'in_progress', NOW()) 
       RETURNING submission_id, started_at`,
      [studentId, t.test_id]
    );
    
    const submissionId: number = sRes.rows[0].submission_id;
    const startedAt: string = sRes.rows[0].started_at;

    // 5. Save Questions to DB
    let order = 1;
    for (const q of rows) {
      const qt: string = q.question_type;
      
      const points =
        qt === "true_false" ? t.tf_points
        : qt === "mcq" ? t.mcq_points
        : t.prog_points;

      await db.query(
        `INSERT INTO exam.submission_questions
           (submission_id, question_id, q_order, points)
         VALUES ($1, $2, $3, $4)`,
        [submissionId, q.question_id, order, points]
      );
      
      order++;
    }

    // 👇 FIX: Re-fetch the fully constructed test from the DB.
    // This ensures we get the exact same structure (with options joined) as the resume logic.
    const freshTest = await TestService.reconstructTestFromSubmission(submissionId, db);

    return { 
      submissionId, 
      dto: { 
        ...freshTest, // This now includes 'questions' with all options attached
        test_id: t.test_id, 
        title: t.title, 
        description: t.description, 
        duration_minutes: t.duration_minutes,
        available_until: t.available_until,
        strict_deadline: t.strict_deadline,
        started_at: startedAt
      } 
    };
  }

  static async saveSingleAnswer(
    submissionId: number,
    studentId: string,
    dto: SubmitAnswerDto,
    db: Pool
  ): Promise<void> {
    const subCheck = await db.query(
      `SELECT submission_id FROM exam.submissions 
       WHERE submission_id = $1 AND student_id = $2 AND status = 'in_progress'`,
      [submissionId, studentId]
    );
    if (subCheck.rowCount === 0) throw new Error("Submission not found or not active");

    const sqRes = await db.query(
      `SELECT submission_question_id FROM exam.submission_questions 
       WHERE submission_id = $1 AND question_id = $2`,
      [submissionId, dto.question_id]
    );
    if (sqRes.rowCount === 0) throw new Error("Question not found in this submission");

    const submissionQuestionId = sqRes.rows[0].submission_question_id;

    const mcqVal = dto.mcq_option_ids || null;
    const tfVal = dto.tf_answer ?? null;
    const codeVal = dto.code_answer || null;

    const existingAns = await db.query(
      `SELECT answer_id FROM exam.student_answers WHERE submission_question_id = $1`,
      [submissionQuestionId]
    );

    if (existingAns.rowCount && existingAns.rowCount > 0) {
      await db.query(
        `UPDATE exam.student_answers
         SET mcq_option_ids = $1, tf_answer = $2, code_answer = $3, answered_at = now()
         WHERE submission_question_id = $4`,
        [mcqVal, tfVal, codeVal, submissionQuestionId]
      );
    } else {
      await db.query(
        `INSERT INTO exam.student_answers (submission_question_id, mcq_option_ids, tf_answer, code_answer)
         VALUES ($1, $2, $3, $4)`,
        [submissionQuestionId, mcqVal, tfVal, codeVal]
      );
    }
  }

  static async submitAndGrade(
    submissionId: number,
    studentId: string,
    db: Pool
  ) {
    const client = await db.connect();
    try {
      await client.query("BEGIN");

      // 1. Lock & Check Status
      const subRes = await client.query(
        `SELECT s.status, t.enable_negative_grading
         FROM exam.submissions s
         JOIN exam.tests t ON s.test_id = t.test_id
         WHERE s.submission_id = $1 AND s.student_id = $2
         FOR UPDATE`,
        [submissionId, studentId]
      );

      if ((subRes.rowCount ?? 0) === 0) throw new Error("submission_not_found");
      const { status, enable_negative_grading } = subRes.rows[0];

      if (status !== 'in_progress') throw new Error("already_submitted");

      // 2. Fetch Data for Grading
      const dataQuery = `
        SELECT 
          sa.answer_id,
          sa.submission_question_id,
          sa.mcq_option_ids,
          sa.tf_answer,
          sa.code_answer, 
          sa.question_grade, 
          q.question_type,
          sq.points as question_points,
          tf.correct_answer as tf_correct,
          (
            SELECT json_agg(json_build_object('id', mo.option_id, 'weight', mo.score_weight))
            FROM exam.mcq_options mo
            WHERE mo.question_id = q.question_id
          ) as mcq_options_data,
          pq.forbidden_keywords, 
          pq.required_keywords
        FROM exam.student_answers sa
        JOIN exam.submission_questions sq ON sa.submission_question_id = sq.submission_question_id
        JOIN exam.questions q ON sq.question_id = q.question_id
        LEFT JOIN exam.true_false_answers tf ON q.question_id = tf.question_id
        LEFT JOIN exam.programming_questions pq ON q.question_id = pq.question_id
        WHERE sq.submission_id = $1
      `;
      
      const { rows: answers } = await client.query(dataQuery, [submissionId]);
      let totalScore = 0;

      // 3. Calculate Grades
      for (const ans of answers) {
        let earnedPoints = 0;

        if (ans.question_type === 'mcq') {
          earnedPoints = GradingService.calculateMCQ(
            Number(ans.question_points),
            ans.mcq_options_data || [],
            ans.mcq_option_ids || [],
            enable_negative_grading
          );
        } else if (ans.question_type === 'true_false') {
          earnedPoints = GradingService.calculateTrueFalse(
            Number(ans.question_points),
            ans.tf_answer,
            ans.tf_correct
          );
        } else if (ans.question_type === 'programming') {
           earnedPoints = Number(ans.question_grade) || 0;

           const staticCheck = GradingService.performStaticAnalysis(
               ans.code_answer || "", 
               ans.forbidden_keywords || [], 
               ans.required_keywords || []
           );

           if (!staticCheck.passed) {
               console.log(`Question ${ans.submission_question_id} failed static analysis: ${staticCheck.error}`);
               earnedPoints = 0; 
           }
        }

        await client.query(
          `UPDATE exam.student_answers SET question_grade = $1 WHERE answer_id = $2`,
          [earnedPoints, ans.answer_id]
        );

        totalScore += earnedPoints;
      }

      // 4. Update Main Submission Record
      await client.query(
        `UPDATE exam.submissions
         SET status = 'submitted', submitted_at = now(), total_grade = $2
         WHERE submission_id = $1`,
        [submissionId, totalScore]
      );

      await client.query("COMMIT");
      return { submission_id: submissionId, status: 'submitted', final_score: totalScore };

    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }
  
  static async getAvailableTestsForStudent(studentId: number | string, db: Pool) {
      return ExamDiscoveryService.getAvailableTestsForStudent(studentId, db);
  }
}
// src/services/SubmissionService.ts
import type { Pool } from "pg";
import { ExamDiscoveryService } from "./ExamDiscoveryService";
import { GradingService } from "./gradingService";
import type { TestTemplateRow, Spec, TestDTO, SubmitAnswerDto, AnswersPayload, AvailableTestDto } from "../types/examTypes";

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
      `SELECT submission_id FROM exam.submissions
       WHERE student_id = $1 AND test_id = $2 AND status = 'in_progress'
       ORDER BY started_at DESC LIMIT 1`,
      [studentId, testId]
    );

    if ((existingRes.rowCount ?? 0) > 0) {
      // Resume existing test logic...
      // (For brevity, I assume you copy the 'Resume' logic here from your original file.
      //  It just fetches questions for that submission_id)
      const submissionId = existingRes.rows[0].submission_id;
      // ... fetch existing questions ...
      // return { submissionId, dto: ... };
       // NOTE: You can paste the "Resume" logic block from your old file here.
       throw new Error("Resume Logic needed here (copy from old file)"); 
    }

    // 3. Create NEW Submission
    const spec: Spec = {
      tf: t.tf_count,
      mcq: t.mcq_count,
      prog: t.prog_count,
    };

    // Use Discovery Service to get questions
    const rows = await ExamDiscoveryService.generateRandomTest(spec, db);

    const sRes = await db.query(
      `INSERT INTO exam.submissions (student_id, test_id, status)
       VALUES ($1, $2, 'in_progress') RETURNING submission_id`,
      [studentId, t.test_id]
    );
    const submissionId: number = sRes.rows[0].submission_id;

    // 4. Save generated questions to submission_questions table
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

    return { 
      submissionId, 
      dto: { test_id: t.test_id, title: t.title, description: t.description, questions: rows } 
    };
  }

  static async saveSingleAnswer(
    submissionId: number,
    studentId: string,
    dto: SubmitAnswerDto,
    db: Pool
  ): Promise<void> {
    // 1. Verify Submission Ownership
    const subCheck = await db.query(
      `SELECT submission_id FROM exam.submissions 
       WHERE submission_id = $1 AND student_id = $2 AND status = 'in_progress'`,
      [submissionId, studentId]
    );
    if (subCheck.rowCount === 0) throw new Error("Submission not found or not active");

    // 2. Find specific question record
    const sqRes = await db.query(
      `SELECT submission_question_id FROM exam.submission_questions 
       WHERE submission_id = $1 AND question_id = $2`,
      [submissionId, dto.question_id]
    );
    if (sqRes.rowCount === 0) throw new Error("Question not found in this submission");

    const submissionQuestionId = sqRes.rows[0].submission_question_id;

    // 3. Upsert Answer
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

      // 1. Lock Submission & Fetch Test Settings
      const subRes = await client.query(
        `SELECT s.status, t.enable_negative_grading
         FROM exam.submissions s
         JOIN exam.tests t ON s.test_id = t.test_id
         WHERE s.submission_id = $1 AND s.student_id = $2
         FOR UPDATE`,
        [submissionId, studentId]
      );

      // FIX: Check for existence FIRST, then destructure
      if ((subRes.rowCount ?? 0) === 0) {
        throw new Error("submission_not_found");
      }
      
      const { status, enable_negative_grading } = subRes.rows[0];

      if (status !== 'in_progress') throw new Error("already_submitted");

      // 2. Fetch Data for Grading
      const dataQuery = `
        SELECT 
          sa.answer_id,
          sa.submission_question_id,
          sa.mcq_option_ids,
          sa.tf_answer,
          q.question_type,
          sq.points as question_points,
          tf.correct_answer as tf_correct,
          (
            SELECT json_agg(json_build_object('id', mo.option_id, 'weight', mo.score_weight))
            FROM exam.mcq_options mo
            WHERE mo.question_id = q.question_id
          ) as mcq_options_data
        FROM exam.student_answers sa
        JOIN exam.submission_questions sq ON sa.submission_question_id = sq.submission_question_id
        JOIN exam.questions q ON sq.question_id = q.question_id
        LEFT JOIN exam.true_false_answers tf ON q.question_id = tf.question_id
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
            enable_negative_grading // <--- Now correctly defined
          );
        } else if (ans.question_type === 'true_false') {
          earnedPoints = GradingService.calculateTrueFalse(
            Number(ans.question_points),
            ans.tf_answer,
            ans.tf_correct
          );
        }

        // Save individual question grade
        await client.query(
          `UPDATE exam.student_answers SET question_grade = $1 WHERE answer_id = $2`,
          [earnedPoints, ans.answer_id]
        );

        totalScore += earnedPoints;
      }

      // 4. Close Submission
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

  static async getAvailableTestsForStudent(
    studentId: number | string,
    db: Pool
  ): Promise<AvailableTestDto[]> {
    const sql = `
        SELECT
        test_id,
        title,
        description,
        available_from,
        available_until,
        (
            tf_count * tf_points +
            mcq_count * mcq_points +
            prog_count * prog_points
        )::double precision AS total_points
        FROM exam.tests
        WHERE
        (available_from IS NULL OR available_from <= now())
        AND (available_until IS NULL OR available_until >= now())
        ORDER BY created_at DESC, test_id;
    `;
    const result = await db.query(sql);
    return result.rows as AvailableTestDto[];
  }
}
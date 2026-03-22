import axios from "axios";
import type { Pool } from "pg";
import { ExamDiscoveryService } from "./ExamDiscoveryService";
import { GradingService } from "./gradingService"; 
import { TestService } from "./testService"; 
import type { TestTemplateRow, RandomizerSpec, TestDTO, SubmitAnswerDto } from "../types/examTypes";

const JUDGE0_URL = process.env.JUDGE0_URL || "http://localhost:2358";

export class SubmissionService {

  // 🛡️ POINT 3: FUZZY MATCHING HELPER
  private static normalizeOutput(str: string): string {
    if (!str) return "";
    return str
      .trim()
      .toLowerCase()
      .replace(/\r\n/g, "\n")    // Standardize line breaks
      .replace(/\s+/g, " ");     // Collapse all whitespace into single spaces
  }

  // 🛡️ POINT 2 & 4: THE EXAMINATOR (STITCHING + SANDBOXING)
  private static async runJudge0Assessment(
    questionId: number, 
    studentCode: string, 
    db: Pool
  ): Promise<{ scoreWeight: number; feedback: string }> {
    
    // Fetch rules, boilerplate, and limits
    const qRes = await db.query(
      `SELECT boilerplate_code, test_cases, cpu_time_limit, memory_limit 
       FROM exam.programming_questions WHERE question_id = $1`,
      [questionId]
    );
    
    const q = qRes.rows[0];
    if (!q) return { scoreWeight: 0, feedback: "Question data not found." };

    // Stitching logic: Wrap the student code if a boilerplate exists
    const finalSource = q.boilerplate_code 
      ? q.boilerplate_code.replace("// {{STUDENT_CODE}}", studentCode)
      : studentCode;

    // Use the first test case as the target for the boilerplate harness
    const masterCase = q.test_cases?.[0] || { input: "", output: "" };

    const payload = {
      source_code: Buffer.from(finalSource).toString("base64"),
      language_id: 54, // C++ (GCC 9.2.0)
      stdin: Buffer.from(masterCase.input || "").toString("base64"),
      expected_output: Buffer.from(masterCase.output || "").toString("base64"),
      cpu_time_limit: q.cpu_time_limit || 2.0,
      memory_limit: q.memory_limit || 128000,
    };

    try {
      const res = await axios.post(`${JUDGE0_URL}/submissions?base64_encoded=true&wait=true`, payload);
      const { status, stdout } = res.data;

      // If status > 4, it's a system error (TLE, Compile Error, etc.)
      if (status.id > 4) { 
        return { scoreWeight: 0, feedback: status.description }; 
      }

      // If status is 3 (Accepted) or 4 (Wrong Answer), we run our FUZZY MATCH
      const actualOutput = stdout ? Buffer.from(stdout, "base64").toString() : "";
      const isCorrect = this.normalizeOutput(actualOutput) === this.normalizeOutput(masterCase.output);

      return { 
        scoreWeight: isCorrect ? 1.0 : 0, 
        feedback: isCorrect ? "Passed" : "Wrong Answer" 
      };

    } catch (error) {
      console.error("Judge0 Error:", error);
      return { scoreWeight: 0, feedback: "Judge0 Service Unavailable" };
    }
  }

  // --- START TEST & SAVE ANSWER (REMAIN UNCHANGED) ---

  static async startTestForStudent(testId: number, studentId: string, db: Pool) {
    // ... logic from your previous snippet ...
    const tRes = await db.query<TestTemplateRow>(`SELECT * FROM exam.tests WHERE test_id = $1`, [testId]);
    const t = tRes.rows[0];
    if (!t) throw new Error(`Test template with id=${testId} not found`);

    const existingRes = await db.query(
      `SELECT submission_id, status, started_at FROM exam.submissions WHERE student_id = $1 AND test_id = $2 ORDER BY started_at DESC LIMIT 1`,
      [studentId, testId]
    );

    const existingSubmission = existingRes.rows[0];
    if (existingSubmission) {
       if (['completed', 'graded', 'submitted'].includes(existingSubmission.status)) throw new Error("Already submitted.");
       const fullTest = await TestService.reconstructTestFromSubmission(existingSubmission.submission_id, db);
       return { submissionId: existingSubmission.submission_id, dto: { ...fullTest, started_at: existingSubmission.started_at, duration_minutes: t.duration_minutes, available_until: t.available_until, strict_deadline: t.strict_deadline } };
    }

    const rows = await ExamDiscoveryService.generateRandomTest({ counts: { tf: t.tf_count, mcq: t.mcq_count, prog: t.prog_count }, config: t.generation_config || {} }, db);
    const uniqueQuestions = rows.filter((q, index, self) => index === self.findIndex((t) => t.question_id === q.question_id));

    const client = await db.connect();
    try {
      await client.query("BEGIN");
      const sRes = await client.query(`INSERT INTO exam.submissions (student_id, test_id, status, started_at) VALUES ($1, $2, 'in_progress', NOW()) RETURNING submission_id, started_at`, [studentId, t.test_id]);
      const submissionId = sRes.rows[0].submission_id;
      for (let i = 0; i < uniqueQuestions.length; i++) {
        const q = uniqueQuestions[i];
        const pts = q.question_type === "true_false" ? t.tf_points : q.question_type === "mcq" ? t.mcq_points : t.prog_points;
        await client.query(`INSERT INTO exam.submission_questions (submission_id, question_id, q_order, points) VALUES ($1, $2, $3, $4)`, [submissionId, q.question_id, i + 1, pts]);
      }
      await client.query("COMMIT");
      const freshTest = await TestService.reconstructTestFromSubmission(submissionId, db);
      return { submissionId, dto: { ...freshTest, test_id: t.test_id, title: t.title, started_at: sRes.rows[0].started_at } };
    } catch (e) { await client.query("ROLLBACK"); throw e; } finally { client.release(); }
  }

static async getAvailableTestsForStudent(userId: number, db: Pool) {
  const query = `
    SELECT 
      test_id, 
      title, 
      description,
      available_from,
      available_until, 
      duration_minutes
    FROM exam.tests 
    WHERE is_published = true 
      AND (available_until IS NULL OR available_until > NOW())
    ORDER BY created_at DESC
  `;
  
  const res = await db.query(query);
  return res.rows;
}

  static async saveSingleAnswer(submissionId: number, studentId: string, dto: SubmitAnswerDto, db: Pool) {
    const subCheck = await db.query(`SELECT submission_id FROM exam.submissions WHERE submission_id = $1 AND student_id = $2 AND status = 'in_progress'`, [submissionId, studentId]);
    if (subCheck.rowCount === 0) throw new Error("Submission not found");
    const sqRes = await db.query(`SELECT submission_question_id FROM exam.submission_questions WHERE submission_id = $1 AND question_id = $2`, [submissionId, dto.question_id]);
    if (sqRes.rowCount === 0) throw new Error("Question not found");
    const sqId = sqRes.rows[0].submission_question_id;
    const existingAns = await db.query(`SELECT answer_id FROM exam.student_answers WHERE submission_question_id = $1`, [sqId]);
    if (existingAns.rowCount && existingAns.rowCount > 0) {
      await db.query(`UPDATE exam.student_answers SET mcq_option_ids = $1, tf_answer = $2, code_answer = $3, answered_at = now() WHERE submission_question_id = $4`, [dto.mcq_option_ids || null, dto.tf_answer ?? null, dto.code_answer || null, sqId]);
    } else {
      await db.query(`INSERT INTO exam.student_answers (submission_question_id, mcq_option_ids, tf_answer, code_answer) VALUES ($1, $2, $3, $4)`, [sqId, dto.mcq_option_ids || null, dto.tf_answer ?? null, dto.code_answer || null]);
    }
  }
  
static async getSubmissionResult(submissionId: number, studentId: string, db: any) {
  const query = `
    SELECT 
      s.submission_id,
      s.total_grade,
      s.status,
      s.submitted_at,
      t.title as test_title,
      (
        SELECT json_agg(json_build_object(
          'question_id', q.question_id,
          'type', q.question_type,
          'title', q.title,
          'body', q.body,
          'points', sq.points_earned,
          'max_points', sq.points,
          'code_results', sq.code_execution_results,
          -- 🚀 Handle MCQ Array: string_agg requires a join on the ANY operator
          'student_answer', (
             SELECT string_agg(o.option_text, ', ') 
             FROM exam.mcq_options o 
             WHERE o.option_id = ANY(sa.mcq_option_ids)
          ),
          'correct_answer', (
             SELECT string_agg(o.option_text, ', ') 
             FROM exam.mcq_options o 
             WHERE o.question_id = q.question_id AND o.is_correct = true
          ),
          -- 🚀 T/F logic using sa (student_answers)
          'tf_student_answer', sa.tf_answer,
          'tf_correct_answer', (
             SELECT tfa.correct_answer 
             FROM exam.true_false_answers tfa 
             WHERE tfa.question_id = q.question_id
          )
        ) ORDER BY sq.q_order)
        FROM exam.submission_questions sq
        JOIN exam.questions q ON sq.question_id = q.question_id
        LEFT JOIN exam.student_answers sa ON sa.submission_question_id = sq.submission_question_id
        WHERE sq.submission_id = s.submission_id
      ) as questions
    FROM exam.submissions s
    JOIN exam.tests t ON s.test_id = t.test_id
    WHERE s.submission_id = $1 AND s.student_id = $2
  `;

  try {
    const result = await db.query(query, [submissionId, studentId]);
    
    if (result.rows.length === 0) {
      console.error(`[Service] No result found for Sub ID: ${submissionId}, Student: ${studentId}`);
      throw new Error("No submission found matching these credentials.");
    }

    return result.rows[0];
  } catch (dbError: any) {
    // 🚀 THIS LOG WILL TELL US EXACTLY WHAT IS WRONG
    console.error("--- DATABASE QUERY CRASHED ---");
    console.error("Error Message:", dbError.message);
    console.error("SQL State:", dbError.code);
    throw dbError; // Re-throw so the controller can send the 500
  }
}
  // --- OPTIMIZED SUBMIT AND GRADE ---
  static async submitAndGrade(submissionId: number, studentId: string, db: Pool) {
    // 1. Fetch data outside the transaction
    const dataQuery = `
      SELECT sa.answer_id, sq.submission_question_id, sa.mcq_option_ids, sa.tf_answer, sa.code_answer,
        q.question_id, q.question_type, sq.points as question_points,
        tf.correct_answer as tf_correct,
        t.enable_negative_grading,
        (SELECT json_agg(json_build_object('id', mo.option_id, 'weight', mo.score_weight))
         FROM exam.mcq_options mo WHERE mo.question_id = q.question_id) as mcq_options_data
      FROM exam.submission_questions sq
      JOIN exam.submissions s ON sq.submission_id = s.submission_id
      JOIN exam.tests t ON s.test_id = t.test_id
      JOIN exam.questions q ON sq.question_id = q.question_id
      LEFT JOIN exam.student_answers sa ON sq.submission_question_id = sa.submission_question_id
      LEFT JOIN exam.true_false_answers tf ON q.question_id = tf.question_id
      WHERE sq.submission_id = $1 AND s.student_id = $2 AND s.status = 'in_progress'
    `;
    
    const { rows: questionsToGrade } = await db.query(dataQuery, [submissionId, studentId]);
    if (questionsToGrade.length === 0) throw new Error("Already submitted or not found.");

    const enable_negative_grading = questionsToGrade[0].enable_negative_grading;
    const gradingResults: { answerId: number | null; score: number }[] = [];
    let totalScore = 0;

    // 2. Loop and Grade (Judge0 calls happen here, NO DB LOCKS active)
    for (const ans of questionsToGrade) {
      let earnedPoints = 0;
      
      if (ans.answer_id) {
        if (ans.question_type === 'mcq') {
          earnedPoints = GradingService.calculateMCQ(Number(ans.question_points), ans.mcq_options_data || [], ans.mcq_option_ids || [], enable_negative_grading);
        } 
        else if (ans.question_type === 'true_false') {
          earnedPoints = GradingService.calculateTrueFalse(Number(ans.question_points), ans.tf_answer, ans.tf_correct);
        } 
        else if (ans.question_type === 'programming' && ans.code_answer) {
          const result = await this.runJudge0Assessment(ans.question_id, ans.code_answer, db);
          earnedPoints = Number(ans.question_points) * result.scoreWeight;
        }
      }
      
      gradingResults.push({ answerId: ans.answer_id, score: earnedPoints });
      totalScore += earnedPoints;
    }

    // 3. Open a fast transaction to save results
    const client = await db.connect();
    try {
      await client.query("BEGIN");
      
      for (const res of gradingResults) {
        if (res.answerId) {
          await client.query(`UPDATE exam.student_answers SET question_grade = $1 WHERE answer_id = $2`, [res.score, res.answerId]);
        }
      }

      await client.query(
        `UPDATE exam.submissions SET status = 'submitted', submitted_at = now(), total_grade = $2 WHERE submission_id = $1`, 
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
}
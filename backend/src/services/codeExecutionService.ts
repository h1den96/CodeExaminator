import { Pool } from "pg";
import axios from "axios";
import dotenv from "dotenv";
import { StructuralAnalysisService } from "./structuralAnalysisService"; // 🚀 New Import

dotenv.config();

const JUDGE0_URL = process.env.JUDGE0_URL || "http://localhost:2358";
const structuralService = new StructuralAnalysisService(); // 🚀 Initialize

export class CodeExecutionService {
  private static sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  private static safeDecode(str: string | null): string {
    if (!str) return "";
    try {
      return Buffer.from(str, "base64").toString("utf-8");
    } catch (e) {
      return str;
    }
  }

  private static safeEncode(str: string | null): string {
    if (!str) return "";
    return Buffer.from(str).toString("base64");
  }

  static async executeAndGrade(
    submissionQuestionId: number,
    studentCode: string,
    db: Pool,
  ) {
    const HARDCODED_LANG_ID = 54; // C++

    try {
      console.log(
        `🚨 DEBUG: Starting Hybrid Grading for SQ_ID: ${submissionQuestionId}`,
      );

      // 1. GET DATA
      const questionQuery = `
                SELECT pq.test_cases, sq.points as max_points, q.question_type
                FROM exam.submission_questions sq
                JOIN exam.questions q ON sq.question_id = q.question_id
                JOIN exam.programming_questions pq ON sq.question_id = pq.question_id
                WHERE sq.submission_question_id = $1
            `;
      const qRes = await db.query(questionQuery, [submissionQuestionId]);
      if (qRes.rows.length === 0) throw new Error("Question not found");

      const testCases = qRes.rows[0].test_cases;
      const maxPoints = Number(qRes.rows[0].max_points);

      // --- 🏗️ STEP 2: WHITE-BOX (STRUCTURAL) ANALYSIS ---
      // Let's allocate 20% of points to "Structure" (e.g., 2 pts out of 10)
      const structuralMaxPoints = maxPoints * 0.2;
      const blackBoxMaxPoints = maxPoints - structuralMaxPoints;

      let structuralPointsAwarded = 0;
      const hasLoop = structuralService.hasLoop(studentCode);

      if (hasLoop) {
        structuralPointsAwarded = structuralMaxPoints;
        console.log(
          `✅ Structural Check Passed: +${structuralPointsAwarded} pts`,
        );
      } else {
        console.log(`❌ Structural Check Failed: No loop detected.`);
      }

      // --- 🧪 STEP 3: BLACK-BOX (JUDGE0) ANALYSIS ---
      if (!testCases || testCases.length === 0)
        throw new Error("No test cases");

      const submissions = testCases.map((tc: any) => ({
        source_code: CodeExecutionService.safeEncode(studentCode),
        language_id: HARDCODED_LANG_ID,
        stdin: CodeExecutionService.safeEncode(tc.input),
        expected_output: CodeExecutionService.safeEncode(tc.expected),
        cpu_time_limit: 2.0,
      }));

      const submitResponse = await axios.post(
        `${JUDGE0_URL}/submissions/batch?base64_encoded=true&wait=false`,
        { submissions },
      );

      let results = submitResponse.data;
      if (!Array.isArray(results)) results = [results];
      const tokens = results.map((r: any) => r.token).join(",");

      let attempts = 0;
      let isDone = false;
      while (attempts < 10 && !isDone) {
        if (results[0].status && results[0].status.id > 2) {
          isDone = true;
        } else {
          attempts++;
          await CodeExecutionService.sleep(1000 + attempts * 500);
          const checkResponse = await axios.get(
            `${JUDGE0_URL}/submissions/batch?tokens=${tokens}&base64_encoded=true&fields=token,stdout,stderr,status,compile_output`,
          );
          results = checkResponse.data.submissions;
        }
      }

      if (!isDone) throw new Error("Grading timed out.");

      // 4. CALCULATE FINAL HYBRID SCORE
      let passedCount = 0;
      const cleanDetails = results.map((r: any) => {
        if (r.status.id === 3) passedCount++;
        return {
          status: r.status.description,
          stdout: CodeExecutionService.safeDecode(r.stdout),
          stderr: CodeExecutionService.safeDecode(r.stderr),
          compile_output: CodeExecutionService.safeDecode(r.compile_output),
        };
      });

      // Math: (TestsPassed / TotalTests) * BlackBoxWeight + StructuralPoints
      const testScore = (passedCount / testCases.length) * blackBoxMaxPoints;
      const finalScore = testScore + structuralPointsAwarded;

      // 5. UPSERT RESULT
      const checkQuery = `SELECT answer_id FROM exam.student_answers WHERE submission_question_id = $1`;
      const checkRes = await db.query(checkQuery, [submissionQuestionId]);

      const finalMeta = {
        test_results: cleanDetails,
        structural_analysis: {
          loop_detected: hasLoop,
          points_awarded: structuralPointsAwarded,
        },
      };

      if (checkRes.rowCount && checkRes.rowCount > 0) {
        const updateQuery = `
                    UPDATE exam.student_answers
                    SET code_answer = $1, eval_result = $2, question_grade = $3, answered_at = NOW()
                    WHERE submission_question_id = $4
                    RETURNING answer_id, question_grade
                `;
        await db.query(updateQuery, [
          studentCode,
          JSON.stringify(finalMeta),
          finalScore,
          submissionQuestionId,
        ]);
      } else {
        const insertQuery = `
                    INSERT INTO exam.student_answers 
                    (submission_question_id, code_answer, eval_result, question_grade, answered_at)
                    VALUES ($1, $2, $3, $4, NOW())
                    RETURNING answer_id, question_grade
                `;
        await db.query(insertQuery, [
          submissionQuestionId,
          studentCode,
          JSON.stringify(finalMeta),
          finalScore,
        ]);
      }

      return {
        question_grade: finalScore,
        details: finalMeta,
      };
    } catch (err) {
      console.error("❌ Hybrid Grading Failed:", err);
      throw err;
    }
  }
}

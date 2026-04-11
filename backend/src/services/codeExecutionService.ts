import { Pool } from "pg";
import axios from "axios";
import dotenv from "dotenv";
import { StructuralAnalysisService } from "./structuralAnalysisService";
import { GradingService } from "./gradingService"; // ✅ Added

dotenv.config();

const JUDGE0_URL = process.env.JUDGE0_URL || "http://localhost:2358";

export class CodeExecutionService {
  private static structuralService = new StructuralAnalysisService();

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
      console.log(`🚨 DEBUG: Starting Hybrid Grading for SQ_ID: ${submissionQuestionId}`);

      // --- 🛡️ STEP 0: SECURITY & STATIC ANALYSIS ---
      // This prevents malicious code like system("rm -rf")
      const analysis = GradingService.performStaticAnalysis(studentCode);
      if (!analysis.passed) {
        return {
          question_grade: 0,
          details: [{
            status: "Security Violation",
            passed: false,
            compile_output: analysis.error
          }]
        };
      }

      // --- 1. GET DATA ---
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
      const structuralMaxPoints = maxPoints * 0.2;
      const blackBoxMaxPoints = maxPoints - structuralMaxPoints;

      let structuralPointsAwarded = 0;
      const hasLoop = this.structuralService.hasLoop(studentCode);

      if (hasLoop) {
        structuralPointsAwarded = structuralMaxPoints;
        console.log(`✅ Structural Check Passed: +${structuralPointsAwarded} pts`);
      } else {
        console.log(`❌ Structural Check Failed: No loop detected.`);
      }

      // --- 🧪 STEP 3: BLACK-BOX (JUDGE0) ANALYSIS ---
      if (!testCases || testCases.length === 0) throw new Error("No test cases");

      const submissions = testCases.map((tc: any) => ({
        source_code: this.safeEncode(studentCode),
        language_id: HARDCODED_LANG_ID,
        stdin: this.safeEncode(tc.input || ""),
        expected_output: this.safeEncode(tc.expected_output || tc.expected || ""),
        cpu_time_limit: 2.0,
      }));

      const submitResponse = await axios.post(
        `${JUDGE0_URL}/submissions/batch?base64_encoded=true&wait=false`,
        { submissions }
      );

      let results = submitResponse.data;
      if (!Array.isArray(results)) results = [results];
      const tokens = results.map((r: any) => r.token).join(",");

      // Polling for results
      let attempts = 0;
      let isDone = false;
      while (attempts < 10 && !isDone) {
        const checkResponse = await axios.get(
          `${JUDGE0_URL}/submissions/batch?tokens=${tokens}&base64_encoded=true&fields=token,stdout,stderr,status,compile_output`
        );
        results = checkResponse.data.submissions;

        if (results.every((r: any) => r.status && r.status.id > 2)) {
          isDone = true;
        } else {
          attempts++;
          await this.sleep(1000 + attempts * 500);
        }
      }

      if (!isDone) throw new Error("Grading timed out.");

      // --- 📊 STEP 4: CALCULATE FINAL HYBRID SCORE ---
      let passedCount = 0;
      const cleanDetails = results.map((r: any, idx: number) => {
        const actualOutput = this.safeDecode(r.stdout);
        const expectedOutput = testCases[idx].expected_output || testCases[idx].expected || "";

        // ✅ SMART COMPARE: Fixes the "\n" or trailing space issues
        const isPassed = GradingService.smartCompare(actualOutput, expectedOutput);
        
        if (isPassed) passedCount++;

        return {
          status: isPassed ? "Accepted" : (r.status?.description || "Wrong Answer"),
          passed: isPassed,
          stdout: actualOutput,
          expected: expectedOutput, // Useful for debugging
          stderr: this.safeDecode(r.stderr),
          compile_output: this.safeDecode(r.compile_output),
          input: testCases[idx].input,
          is_public: testCases[idx].is_public ?? true
        };
      });

      const testScore = (passedCount / testCases.length) * blackBoxMaxPoints;
      const finalScore = parseFloat((testScore + structuralPointsAwarded).toFixed(2));

      // --- 💾 STEP 5: UPSERT RESULT ---
      const finalMeta = {
        test_results: cleanDetails,
        structural_analysis: {
          loop_detected: hasLoop,
          points_awarded: structuralPointsAwarded,
        },
      };

      const upsertQuery = `
        INSERT INTO exam.student_answers 
        (submission_question_id, code_answer, eval_result, question_grade, answered_at)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (submission_question_id) 
        DO UPDATE SET 
          code_answer = EXCLUDED.code_answer, 
          eval_result = EXCLUDED.eval_result, 
          question_grade = EXCLUDED.question_grade, 
          answered_at = NOW()
        RETURNING answer_id, question_grade
      `;

      await db.query(upsertQuery, [
        submissionQuestionId,
        studentCode,
        JSON.stringify(finalMeta),
        finalScore,
      ]);

      console.log("📦 [CodeExecutionService] Final Data Package:", {
        grade: finalScore,
        detailsCount: cleanDetails.length
      });

      return {
        question_grade: finalScore,
        details: cleanDetails,
      };

    } catch (err) {
      console.error("❌ Hybrid Grading Failed:", err);
      throw err;
    }
  }
}
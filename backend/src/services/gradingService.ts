/*import { Pool } from 'pg';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const JUDGE0_URL = process.env.JUDGE0_URL || 'http://localhost:2358';

const pool = new Pool({
    user: process.env.DB_USER || process.env.PGUSER || 'postgres',
    host: process.env.DB_HOST || process.env.PGHOST || 'localhost',
    database: process.env.DB_NAME || process.env.PGDATABASE || 'exam_system',
    password: process.env.DB_PASSWORD || process.env.PGPASSWORD,
    port: Number(process.env.DB_PORT) || Number(process.env.PGPORT) || 5432,
});

// Helper: Sleep function to pause between checks
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export const gradeSubmission = async (
    submissionQuestionId: number,
    studentCode: string
) => {
    const client = await pool.connect();
    const HARDCODED_LANG_ID = 54; // C++ (GCC 9.2.0)

    try {
        // 1. GET TEST CASES
        const questionQuery = `
            SELECT pq.test_cases, sq.points as max_points
            FROM exam.submission_questions sq
            JOIN exam.programming_questions pq ON sq.question_id = pq.question_id
            WHERE sq.submission_question_id = $1
        `;

        const qRes = await client.query(questionQuery, [submissionQuestionId]);
        if (qRes.rows.length === 0) throw new Error("Question not found");

        const testCases = qRes.rows[0].test_cases;
        const maxPoints = Number(qRes.rows[0].max_points);

        // 2. PREPARE JUDGE0 BATCH
        const submissions = testCases.map((tc: any) => ({
            source_code: studentCode,
            language_id: HARDCODED_LANG_ID,
            stdin: tc.input,
            expected_output: tc.expected,
            cpu_time_limit: 2.0
        }));

        // 3. SUBMIT JOB (wait=false returns tokens immediately)
        console.log("Submitting job to Judge0...");
        const submitResponse = await axios.post(
            `${JUDGE0_URL}/submissions/batch?base64_encoded=false&wait=false`, 
            { submissions }
        );

        // 4. POLLING LOOP
        // We get an array of tokens, e.g., [{token: "abc..."}, {token: "def..."}]
        let results = submitResponse.data;
        const tokens = results.map((r: any) => r.token).join(',');
        
        let attempts = 0;
        let isDone = false;

        // Poll up to 10 times (approx 20-30 seconds max wait)
        while (attempts < 10 && !isDone) {
            // Check if the first result has a status_id > 2 (Accepted/Rejected/Error)
            // Status 1 = In Queue, 2 = Processing
            if (results[0].status && results[0].status.id > 2) {
                isDone = true;
            } else {
                attempts++;
                // Backoff: Wait 1s, then 1.5s, then 2s... to be gentle on the server
                const waitTime = 1000 + (attempts * 500); 
                console.log(`[Attempt ${attempts}] Results not ready. Waiting ${waitTime}ms...`);
                await sleep(waitTime);

                // Ask Judge0 for the status of these tokens
                const checkResponse = await axios.get(
                    `${JUDGE0_URL}/submissions/batch?tokens=${tokens}&base64_encoded=false&fields=token,stdout,stderr,status,compile_output`
                );
                results = checkResponse.data.submissions;
            }
        }

        if (!isDone) {
            throw new Error("Grading timed out. The worker might be stuck or overloaded.");
        }

        // 5. CALCULATE SCORE
        let passedCount = 0;
        const cleanDetails = results.map((r: any) => {
            // 3 = Accepted (Pass)
            if (r.status.id === 3) passedCount++;
            return {
                status: r.status.description,
                stdout: r.stdout,
                compile_output: r.compile_output
            };
        });

        const finalScore = (passedCount / testCases.length) * maxPoints;

        // 6. SAVE RESULT
        const insertQuery = `
            INSERT INTO exam.student_answers 
            (submission_question_id, code_answer, eval_result, question_grade, answered_at)
            VALUES ($1, $2, $3, $4, NOW())
            RETURNING answer_id, question_grade
        `;

        const savedAnswer = await client.query(insertQuery, [
            submissionQuestionId,
            studentCode,
            JSON.stringify(cleanDetails),
            finalScore
        ]);

        console.log("Grading complete. Score saved.");
        return savedAnswer.rows[0];

    } catch (err) {
        console.error("Grading Failed:", err);
        throw err;
    } finally {
        client.release();
    }
};*/

// src/services/GradingService.ts

interface Option {
  id: number;
  weight: number;
}

export class GradingService {
  
  /**
   * Calculates the weighted score for an MCQ question.
   * Logic: Sum(Weights of Selected) * QuestionPoints.
   * Handles "Safe Mode" (No negative grading) via the switch.
   */
  static calculateMCQ(
    questionPoints: number,
    options: Option[],
    selectedIds: number[],
    enableNegativeGrading: boolean
  ): number {
    let totalWeight = 0.0;

    selectedIds.forEach((sid) => {
      const opt = options.find((o) => o.id === sid);
      if (opt) {
        let w = Number(opt.weight);

        // SAFE MODE: If penalties are disabled, treat negative weight as 0.
        if (!enableNegativeGrading && w < 0) {
          w = 0;
        }
        totalWeight += w;
      }
    });

    // Clamp Factor: Student cannot get < 0% or > 100%
    const factor = Math.min(1, Math.max(0, totalWeight));

    // Return Points (rounded to 2 decimals)
    return Number((factor * questionPoints).toFixed(2));
  }

  static calculateTrueFalse(
    questionPoints: number,
    studentAnswer: boolean | null,
    correctAnswer: boolean
  ): number {
    if (studentAnswer === correctAnswer) {
      return Number(questionPoints);
    }
    return 0;
  }
}
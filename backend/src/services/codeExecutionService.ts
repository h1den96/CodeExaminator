// src/services/CodeExecutionService.ts
import { Pool } from 'pg';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const JUDGE0_URL = process.env.JUDGE0_URL || 'http://localhost:2358';

export class CodeExecutionService {

    private static sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

    static async executeAndGrade(
        submissionQuestionId: number,
        studentCode: string,
        db: Pool
    ) {
        const HARDCODED_LANG_ID = 54; 

        try {
            console.log(`🚨 DEBUG: Starting Grading for SQ_ID: ${submissionQuestionId}`);

            // --- DIAGNOSTIC CHECK ---
            // 1. Check if the submission_question row exists AT ALL
            const checkSQ = await db.query(
                `SELECT question_id FROM exam.submission_questions WHERE submission_question_id = $1`,
                [submissionQuestionId]
            );
            
            if (checkSQ.rows.length === 0) {
                console.error(`🚨 DEBUG ERROR: SQ_ID ${submissionQuestionId} does not exist in exam.submission_questions!`);
                throw new Error(`Critical Data Mismatch: SQ_ID ${submissionQuestionId} not found`);
            }

            const qId = checkSQ.rows[0].question_id;
            console.log(`🚨 DEBUG: Found SQ_ID ${submissionQuestionId}. It links to Question ID: ${qId}`);

            // 2. Check if that Question ID exists in programming_questions
            const checkPQ = await db.query(
                `SELECT question_id FROM exam.programming_questions WHERE question_id = $1`,
                [qId]
            );

            if (checkPQ.rows.length === 0) {
                console.error(`🚨 DEBUG ERROR: Question ID ${qId} is missing from exam.programming_questions!`);
                throw new Error(`Data Integrity Error: Question ${qId} is not in programming table`);
            }
            // ------------------------

            // 1. GET TEST CASES (The Original Query)
            const questionQuery = `
                SELECT pq.test_cases, sq.points as max_points
                FROM exam.submission_questions sq
                JOIN exam.programming_questions pq ON sq.question_id = pq.question_id
                WHERE sq.submission_question_id = $1
            `;

            const qRes = await db.query(questionQuery, [submissionQuestionId]);
            
            // This should not happen if diagnostic checks pass
            if (qRes.rows.length === 0) {
                console.error("🚨 DEBUG: Join Query Failed despite separate tables existing.");
                throw new Error("Question not found (Join Failed)");
            }

            const testCases = qRes.rows[0].test_cases;
            const maxPoints = Number(qRes.rows[0].max_points);

            console.log(`🚨 DEBUG: Data loaded. Test Cases: ${testCases?.length}, Max Points: ${maxPoints}`);

            // 2. PREPARE JUDGE0 BATCH
            if (!testCases || testCases.length === 0) {
                 throw new Error("No test cases defined for this question");
            }

            const submissions = testCases.map((tc: any) => ({
                source_code: studentCode,
                language_id: HARDCODED_LANG_ID,
                stdin: tc.input,
                expected_output: tc.expected,
                cpu_time_limit: 2.0
            }));

            // 3. SUBMIT JOB
            console.log("Submitting job to Judge0...");
            const submitResponse = await axios.post(
                `${JUDGE0_URL}/submissions/batch?base64_encoded=false&wait=false`, 
                { submissions }
            );

            // 4. POLLING LOOP
            let results = submitResponse.data;
            if (!Array.isArray(results)) results = [results];
            
            const tokens = results.map((r: any) => r.token).join(',');
            
            let attempts = 0;
            let isDone = false;

            while (attempts < 10 && !isDone) {
                if (results[0].status && results[0].status.id > 2) {
                    isDone = true;
                } else {
                    attempts++;
                    const waitTime = 1000 + (attempts * 500); 
                    console.log(`[Attempt ${attempts}] Results not ready. Waiting...`);
                    await CodeExecutionService.sleep(waitTime);

                    const checkResponse = await axios.get(
                        `${JUDGE0_URL}/submissions/batch?tokens=${tokens}&base64_encoded=false&fields=token,stdout,stderr,status,compile_output`
                    );
                    results = checkResponse.data.submissions;
                }
            }

            if (!isDone) throw new Error("Grading timed out.");

            // 5. CALCULATE SCORE
            let passedCount = 0;
            const cleanDetails = results.map((r: any) => {
                if (r.status.id === 3) passedCount++;
                return {
                    status: r.status.description,
                    stdout: r.stdout,
                    compile_output: r.compile_output
                };
            });

            const finalScore = (passedCount / testCases.length) * maxPoints;

            // 6. UPSERT RESULT
            const checkQuery = `SELECT answer_id FROM exam.student_answers WHERE submission_question_id = $1`;
            const checkRes = await db.query(checkQuery, [submissionQuestionId]);

            let savedAnswer;
            if (checkRes.rowCount && checkRes.rowCount > 0) {
                const updateQuery = `
                    UPDATE exam.student_answers
                    SET code_answer = $1, eval_result = $2, question_grade = $3, answered_at = NOW()
                    WHERE submission_question_id = $4
                    RETURNING answer_id, question_grade
                `;
                savedAnswer = await db.query(updateQuery, [studentCode, JSON.stringify(cleanDetails), finalScore, submissionQuestionId]);
            } else {
                const insertQuery = `
                    INSERT INTO exam.student_answers 
                    (submission_question_id, code_answer, eval_result, question_grade, answered_at)
                    VALUES ($1, $2, $3, $4, NOW())
                    RETURNING answer_id, question_grade
                `;
                savedAnswer = await db.query(insertQuery, [submissionQuestionId, studentCode, JSON.stringify(cleanDetails), finalScore]);
            }

            console.log("✅ Grading complete. Score saved.");
            return {
                question_grade: finalScore,
                details: cleanDetails,
                ...savedAnswer.rows[0]
            };

        } catch (err) {
            console.error("❌ Grading Failed inside Service:", err);
            throw err;
        }
    }
}
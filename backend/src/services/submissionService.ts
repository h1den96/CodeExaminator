import axios from "axios";
import type { Pool } from "pg";
import { ExamDiscoveryService } from "./ExamDiscoveryService";
import { GradingService } from "./gradingService";
import { TestService } from "./testService";
import type { TestTemplateRow, SubmitAnswerDto } from "../types/examTypes";
import { StructuralAnalysisService } from "./structuralAnalysisService";
import { BoilerplateFactory, QuestionCategory } from "./boilerplateFactory";
import { assertNever } from "zod/v4/core/util.cjs";

const JUDGE0_URL = process.env.JUDGE0_URL || "http://localhost:2358";

export class SubmissionService {
    private static normalizeOutput(val: any): string {
        if (val === null || val === undefined) return "";
        const str = String(val).trim();
        return str.toLowerCase()
                  .replace(/[ \t]+/g, " ")
                  .split("\n")
                  .map(l => l.trim())
                  .filter(l => l !== "")
                  .join("\n");
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

    static async getSubmissionResult(
        submissionId: number,
        studentId: string,
        db: Pool,
    ) {
        const query = `
      SELECT 
        s.submission_id,
        s.test_id,
        t.title as test_title,
        s.total_grade,
        s.status,
        s.submitted_at,
        (
          SELECT json_agg(json_build_object(
            'question_id', q.question_id,
            'question_text', q.body,
            'type', q.question_type,
            'points_earned', sa.question_grade,
            'points_possible', sq.points,
            'eval_details', sa.eval_result,
            'student_code', sa.code_answer
          ))
          FROM exam.submission_questions sq
          JOIN exam.questions q ON sq.question_id = q.question_id
          LEFT JOIN exam.student_answers sa ON sq.submission_question_id = sa.submission_question_id
          WHERE sq.submission_id = s.submission_id
        ) as questions
      FROM exam.submissions s
      JOIN exam.tests t ON s.test_id = t.test_id
      WHERE s.submission_id = $1 AND s.student_id = $2
    `;

        const res = await db.query(query, [submissionId, studentId]);
        return res.rows[0];
    }

    private static async runJudge0Assessment(
        studentCode: string,
        testCases: any,
        boilerplate: string | null,
        limits: { cpu?: number; memory?: number } = {},
        languageId: number
    ): Promise<{ scoreWeight: number; feedback: string; details: any[] }> {
        
        // FIX 1: Μετατροπή των test cases από JSONB/String σε Array
        const actualTestCases = typeof testCases === 'string' ? JSON.parse(testCases) : testCases;
        
        const finalSource = boilerplate
            ? boilerplate.replace("// {{STUDENT_CODE}}", studentCode)
            : studentCode;
        

        console.log("--- [DEBUG] FINAL CODE SENT TO JUDGE0 ---");
        console.log(finalSource);
        console.log("-----------------------------------------");

        const results: any[] = [];
        let passedCount = 0;

        // FIX 2: Loop πάνω στο actualTestCases (όχι στο testCases)
        for (const tCase of actualTestCases) {

            const inputStr = (tCase.input !== undefined && tCase.input !== null) 
                ? String(tCase.input) 
                : "";
            const expectedStr = (tCase.expected_output !== undefined && tCase.expected_output !== null) 
                ? String(tCase.expected_output) 
                : "";

            const payload = {
                source_code: Buffer.from(finalSource).toString("base64"),
                language_id: languageId || 54,
                stdin: Buffer.from(inputStr).toString("base64"),
                cpu_time_limit: limits.cpu ? Number(limits.cpu) : 2.0, 
                memory_limit: limits.memory ? Number(limits.memory) : 128000,
                base64_encoded: true,
                wait: true
            };

            const res = await axios.post(
                `${JUDGE0_URL}/submissions?base64_encoded=true&wait=true`,
                payload,
            );

            // --- ΠΡΟΣΘΕΣΕ ΑΥΤΟ ΤΟ LOG ---
            console.log(`[DEBUG] Judge0 Response (Status ID: ${res.data.status?.id}):`, {
                stdout: res.data.stdout,
                stderr: res.data.stderr,
                compile_output: res.data.compile_output
            });

            const { status, stdout, stderr, compile_output } = res.data;
            const actualOutput = stdout ? Buffer.from(stdout, "base64").toString() : "";

            const normalizedActual = this.normalizeOutput(actualOutput);
            const normalizedExpected = this.normalizeOutput(expectedStr);

            const logicMatches = GradingService.smartCompare(normalizedActual, normalizedExpected);
            const isCorrect = (status.id === 3) && logicMatches;
            
            if (isCorrect) passedCount++;

                results.push({
                    status: status.description,
                    is_public: !!tCase.is_public,
                    input: tCase.is_public ? inputStr : "Hidden",
                    expected: tCase.is_public ? expectedStr : "REDACTED",
                    actual: tCase.is_public ? actualOutput : "REDACTED",
                    passed: isCorrect,
                    error: stderr || compile_output
                        ? Buffer.from(stderr || compile_output, "base64").toString()
                        : null,
                });
            }

        // FIX 3: Υπολογισμός με βάση το πραγματικό μήκος του Array
        const total = actualTestCases.length || 1;
        const scoreWeight = passedCount / total;

        
        return {
            scoreWeight,
            feedback: `Passed ${passedCount}/${total} functional tests (${(scoreWeight * 100).toFixed(0)}%).`,
            details: results,
        };
    }

    static async startTestForStudent(testId: number, studentId: string, db: Pool) {
        const tRes = await db.query(`SELECT * FROM exam.tests WHERE test_id = $1`, [testId]);
        const t = tRes.rows[0];
        if (!t) throw new Error(`Test template with id=${testId} not found`);

        const existingRes = await db.query(
            `SELECT submission_id, status, started_at FROM exam.submissions 
             WHERE student_id = $1 AND test_id = $2 
             ORDER BY started_at DESC LIMIT 1`,
            [studentId, testId],
        );

        const existingSubmission = existingRes.rows[0];
        if (existingSubmission) {
            if (["completed", "graded", "submitted"].includes(existingSubmission.status)) {
                throw new Error("Already submitted.");
            }
            const fullTest = await TestService.reconstructTestFromSubmission(existingSubmission.submission_id, db);
            return {
                submissionId: existingSubmission.submission_id,
                dto: {
                    ...fullTest,
                    started_at: existingSubmission.started_at,
                    duration_minutes: t.duration_minutes,
                },
            };
        }

        const client = await db.connect();
        try {
            await client.query("BEGIN");
            const sRes = await client.query(
                `INSERT INTO exam.submissions (student_id, test_id, status, started_at) 
                 VALUES ($1, $2, 'in_progress', NOW()) 
                 RETURNING submission_id, started_at`,
                [studentId, t.test_id],
            );
            const submissionId = sRes.rows[0].submission_id;

            const drawQuery = `
                INSERT INTO exam.submission_questions (submission_id, question_id, q_order, points)
                SELECT 
                  $1 as submission_id,
                  q_pool.question_id,
                  ts.slot_order,
                  ts.points
                FROM exam.test_slots ts
                CROSS JOIN LATERAL (
                  SELECT q.question_id
                  FROM exam.questions q
                  JOIN exam.question_topics qt ON q.question_id = qt.question_id
                  LEFT JOIN exam.programming_questions pq ON q.question_id = pq.question_id
                  WHERE q.difficulty = ts.difficulty
                  AND qt.topic_id = ts.topic_id
                  AND q.question_type = ts.question_type
                  AND (q.question_type != 'programming' OR pq.category = ts.category)
                  ORDER BY RANDOM()
                  LIMIT 1
                ) AS q_pool
                WHERE ts.test_id = $2
                ORDER BY ts.slot_order ASC;
            `;

            const drawResult = await client.query(drawQuery, [submissionId, t.test_id]);
            if (drawResult.rowCount === 0) throw new Error("No matching questions found.");

            await client.query("COMMIT");
            const freshTest = await TestService.reconstructTestFromSubmission(submissionId, db);
            return {
                submissionId,
                dto: { ...freshTest, test_id: t.test_id, title: t.title, started_at: sRes.rows[0].started_at },
            };
        } catch (e) {
            await client.query("ROLLBACK");
            throw e;
        } finally {
            client.release();
        }
    }

    static async saveSingleAnswer(submissionId: number, studentId: string, dto: SubmitAnswerDto, db: Pool) {
        const subCheck = await db.query(
            `SELECT submission_id FROM exam.submissions WHERE submission_id = $1 AND student_id = $2 AND status = 'in_progress'`,
            [submissionId, studentId],
        );
        if (subCheck.rowCount === 0) throw new Error("Submission not found or closed");

        const sqRes = await db.query(
            `SELECT submission_question_id FROM exam.submission_questions WHERE submission_id = $1 AND question_id = $2`,
            [submissionId, dto.question_id],
        );
        if (sqRes.rowCount === 0) throw new Error("Question not found in this test");

        const sqId = sqRes.rows[0].submission_question_id;

        await db.query(
            `INSERT INTO exam.student_answers (submission_question_id, mcq_option_ids, tf_answer, code_answer, answered_at)
             VALUES ($1, $2, $3, $4, NOW())
             ON CONFLICT (submission_question_id) DO UPDATE SET 
             mcq_option_ids = EXCLUDED.mcq_option_ids, tf_answer = EXCLUDED.tf_answer, code_answer = EXCLUDED.code_answer, answered_at = NOW()`,
            [sqId, dto.mcq_option_ids || null, dto.tf_answer ?? null, dto.code_answer || null],
        );
    }

    private static validateSecurity(code: string) {
        const forbiddenPatterns = ["/*", "*/"]; // Μπλοκάρουμε τα block comments για να μην κλείνουν το template
        for (const pattern of forbiddenPatterns) {
            if (code.includes(pattern)) {
                throw new Error(`SECURITY_VIOLATION: Forbidden pattern detected: ${pattern}`);
            }
        }
    }

    static async submitAndGrade(submissionId: number, studentId: string, db: Pool, codeOverride?: string) {
        // FIX 4: Προσθήκη pq.language_id στο Query
        const dataQuery = `
      SELECT 
        sa.answer_id, sq.submission_question_id, sa.mcq_option_ids, sa.tf_answer, sa.code_answer,
        q.question_id, q.question_type, sq.points as question_points,
        q.structural_rules, q.weight_wb, q.weight_bb,
        pq.test_cases, 
        pq.language_id, -- <--- ΚΡΙΣΙΜΟ!
        pq.category,
        pq.function_signature,
        pq.boilerplate_code, 
        pq.cpu_time_limit, 
        pq.memory_limit,
        tf.correct_answer as tf_correct,
        t.enable_negative_grading,
        s.started_at,
        t.duration_minutes,
        s.status as current_status,
        (SELECT json_agg(json_build_object('id', mo.option_id, 'weight', mo.score_weight))
         FROM exam.mcq_options mo WHERE mo.question_id = q.question_id) as mcq_options_data
      FROM exam.submission_questions sq
      JOIN exam.submissions s ON sq.submission_id = s.submission_id
      JOIN exam.tests t ON s.test_id = t.test_id
      JOIN exam.questions q ON sq.question_id = q.question_id
      LEFT JOIN exam.programming_questions pq ON q.question_id = pq.question_id 
      LEFT JOIN exam.student_answers sa ON sq.submission_question_id = sa.submission_question_id
      LEFT JOIN exam.true_false_answers tf ON q.question_id = tf.question_id
      WHERE sq.submission_id = $1 AND s.student_id = $2
    `;

        const { rows: questionsToGrade } = await db.query(dataQuery, [submissionId, studentId]);
        if (questionsToGrade.length === 0) throw new Error("Submission not found.");

        const firstRow = questionsToGrade[0];
        if (firstRow.current_status !== 'in_progress') throw new Error("SUBMISSION_CLOSED");

        const startTime = new Date(firstRow.started_at).getTime();
        const durationMs = (Number(firstRow.duration_minutes) || 0) * 60 * 1000;
        const now = Date.now();
        const gracePeriod = 2 * 60 * 1000;

        if (now > (startTime + durationMs + gracePeriod)) {
            throw new Error("TIME_EXPIRED");
        }

        const gradingResults: any[] = [];
        let totalScore = 0;

        for (const ans of questionsToGrade) {
            let earnedPoints = 0;
            let evalResult: any = {};
            const points = Number(ans.question_points);

            if (ans.answer_id) {
                if (ans.question_type === 'mcq') {
                    earnedPoints = GradingService.calculateMCQ(points, ans.mcq_options_data || [], ans.mcq_option_ids || [], firstRow.enable_negative_grading);
                    evalResult = { type: 'mcq', selected: ans.mcq_option_ids };
                } else if (ans.question_type === 'true_false') {
                    earnedPoints = GradingService.calculateTrueFalse(points, ans.tf_answer, ans.tf_correct);
                    evalResult = { type: 'tf', student_ans: ans.tf_answer, correct_ans: ans.tf_correct };
                } else if (ans.question_type === 'programming') {
                    const codeToGrade = codeOverride || ans.code_answer;
                    if (codeToGrade) {

                        const forbiddenKeywords = [
                            "system(", 
                            "fork(", 
                            "fstream", 
                            "ifstream", 
                            "ofstream", 
                            "<filesystem>", 
                            "bits/stdc++.h"
                        ];

                        const securityCheck = GradingService.performStaticAnalysis(codeToGrade, forbiddenKeywords, []);
                        
                        if (!securityCheck.passed) {
                            earnedPoints = 0;
                            evalResult = {
                                type: 'programming',
                                status: 'SECURITY_ERROR',
                                feedback: securityCheck.error,
                                details: []
                            };
                            gradingResults.push({ answerId: ans.answer_id, score: 0, evalResult });
                            continue;
                        }

                        const finalHarness = (ans.category === 'CUSTOM' && ans.boilerplate_code)
                            ? ans.boilerplate_code
                            : BoilerplateFactory.createFullHarness(ans.category, ans.function_signature);

                        const wbResult = await StructuralAnalysisService.analyze(codeToGrade, ans.structural_rules || []);
                        
                        const securityViolation = wbResult.details.find((d: any) => d.weight === 0 && !d.passed);
                        
                        if (securityViolation) {
                            console.error(`[SECURITY] Violation detected: ${securityViolation.description}`);
                            
                            earnedPoints = 0; // Μηδενισμός βαθμού
                            evalResult = {
                                type: 'programming',
                                status: 'SECURITY_ERROR',
                                feedback: `Submission denied: ${securityViolation.description}`,
                                details: wbResult.details
                            };
                            
                            // Με το 'continue' σταματάμε εδώ και δεν στέλνουμε καν τον κώδικα στον Judge0
                            gradingResults.push({ answerId: ans.answer_id, score: 0, evalResult });
                            continue; 
                        }

                        // FIX 5: Πέρασμα του σωστού language_id από τη βάση
                        const bbResult = await this.runJudge0Assessment(
                            codeToGrade,
                            ans.test_cases || [],
                            finalHarness,
                            { cpu: Number(ans.cpu_time_limit), memory: Number(ans.memory_limit) },
                            ans.language_id || 54
                        );

                        const wWB = Number(ans.weight_wb) || 0.2;
                        const wBB = Number(ans.weight_bb) || 0.8;
                        earnedPoints = (points * wWB * wbResult.score) + (points * wBB * bbResult.scoreWeight);

                        evalResult = {
                            summary: { final_score_ratio: (earnedPoints / points).toFixed(4), points_earned: earnedPoints },
                            white_box: { ratio: wbResult.score, details: wbResult.details },
                            black_box: { ratio: bbResult.scoreWeight, feedback: bbResult.feedback, test_results: bbResult.details }
                        };
                    }
                }
            }
            gradingResults.push({ answerId: ans.answer_id, score: earnedPoints, evalResult });
            totalScore += earnedPoints;
        }

        const client = await db.connect();
        try {
            await client.query("BEGIN");
            for (const res of gradingResults) {
                if (res.answerId) {
                    await client.query(
                        `UPDATE exam.student_answers SET question_grade = $1, eval_result = $2, is_submitted = true WHERE answer_id = $3`,
                        [res.score, res.evalResult, res.answerId]
                    );
                }
            }
            await client.query(
                `UPDATE exam.submissions SET status = 'submitted', submitted_at = NOW(), total_grade = $2 WHERE submission_id = $1`,
                [submissionId, totalScore]
            );
            await client.query("COMMIT");
            return { 
                submission_id: submissionId, 
                status: 'submitted', 
                final_score: totalScore,
                questions: gradingResults // <--- ΠΡΟΣΘΕΣΕ ΑΥΤΟ
            };
        } catch (e) {
            await client.query("ROLLBACK");
            throw e;
        } finally {
            client.release();
        }
    }
}
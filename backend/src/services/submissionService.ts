import axios from "axios";
import type { Pool } from "pg";
import { ExamDiscoveryService } from "./ExamDiscoveryService";
import { GradingService } from "./gradingService";
import { TestService } from "./testService";
import type { TestTemplateRow, SubmitAnswerDto } from "../types/examTypes";
import { StructuralAnalysisService } from "./structuralAnalysisService";
import { BoilerplateFactory, QuestionCategory } from "./boilerplateFactory";

const JUDGE0_URL = process.env.JUDGE0_URL || "http://localhost:2358";

export class SubmissionService {
    private static normalizeOutput(str: string | null | undefined): string {
        if (!str) return "";
        return str
            .toLowerCase()
            .replace(/\r\n/g, "\n")
            .replace(/[ \t]+/g, " ")
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line !== "")
            .join("\n")
            .trim();
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
        testCases: any[],
        boilerplate: string | null,
        limits: { cpu?: number; memory?: number } = {},
    ): Promise<{ scoreWeight: number; feedback: string; details: any[] }> {
        // The "Code Sandwich": Injecting student logic into the generated harness
        const finalSource = boilerplate
            ? boilerplate.replace("// {{STUDENT_CODE}}", studentCode)
            : studentCode;

        const results: any[] = [];
        let passedCount = 0;

        for (const tCase of testCases) {
            const payload = {
                source_code: Buffer.from(finalSource).toString("base64"),
                language_id: 54, // C++
                stdin: Buffer.from(tCase.input || "").toString("base64"),
                expected_output: Buffer.from(tCase.expected_output || "").toString(
                    "base64",
                ),
                cpu_time_limit: limits.cpu || 2.0,
                memory_limit: limits.memory || 128000,
            };

            const res = await axios.post(
                `${JUDGE0_URL}/submissions?base64_encoded=true&wait=true`,
                payload,
            );
            const { status, stdout, stderr, compile_output } = res.data;

            const actualOutput = stdout
                ? Buffer.from(stdout, "base64").toString()
                : "";

            // THESIS UPGRADE: Using the Robust Normalizer
            const isCorrect =
                status.id === 3 &&
                this.normalizeOutput(actualOutput) ===
                this.normalizeOutput(tCase.expected_output);

            if (isCorrect) passedCount++;

            results.push({
                status: status.description,
                is_public: !!tCase.is_public,
                input: tCase.is_public ? tCase.input : "Hidden Case",
                expected: tCase.is_public ? tCase.expected_output : "REDACTED",
                actual: tCase.is_public ? actualOutput : "REDACTED",
                passed: isCorrect,
                error:
                    stderr || compile_output
                        ? Buffer.from(stderr || compile_output, "base64").toString()
                        : null,
            });
        }

        const total = testCases.length || 1;
        const scoreWeight = passedCount / total;

        return {
            scoreWeight,
            feedback: `Passed ${passedCount}/${total} functional tests (${(scoreWeight * 100).toFixed(0)}%).`,
            details: results,
        };
    }

    static async startTestForStudent(
        testId: number,
        studentId: string,
        db: Pool,
    ) {
        const tRes = await db.query(`SELECT * FROM exam.tests WHERE test_id = $1`, [
            testId,
        ]);
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
            if (
                ["completed", "graded", "submitted"].includes(existingSubmission.status)
            ) {
                throw new Error("Already submitted.");
            }
            const fullTest = await TestService.reconstructTestFromSubmission(
                existingSubmission.submission_id,
                db,
            );
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
                  -- 🏗️ JOIN with programming_questions to check the technical shape
                  LEFT JOIN exam.programming_questions pq ON q.question_id = pq.question_id
                  WHERE q.difficulty = ts.difficulty
                  AND qt.topic_id = ts.topic_id
                  AND q.question_type = ts.question_type
                  -- 🏗️ THE CRITICAL GUARDRAIL:
                  -- If it's a programming question, the category MUST match the slot.
                  AND (q.question_type != 'programming' OR pq.category = ts.category)
                  ORDER BY RANDOM()
                  LIMIT 1
                ) AS q_pool
                WHERE ts.test_id = $2
                ORDER BY ts.slot_order ASC;
            `;

            const drawResult = await client.query(drawQuery, [
                submissionId,
                t.test_id,
            ]);
            if (drawResult.rowCount === 0)
                throw new Error("No slots defined or no matching questions found.");

            await client.query("COMMIT");

            const freshTest = await TestService.reconstructTestFromSubmission(
                submissionId,
                db,
            );
            return {
                submissionId,
                dto: {
                    ...freshTest,
                    test_id: t.test_id,
                    title: t.title,
                    started_at: sRes.rows[0].started_at,
                },
            };
        } catch (e) {
            await client.query("ROLLBACK");
            throw e;
        } finally {
            client.release();
        }
    }

    static async saveSingleAnswer(
        submissionId: number,
        studentId: string,
        dto: SubmitAnswerDto,
        db: Pool,
    ) {
        const subCheck = await db.query(
            `SELECT submission_id FROM exam.submissions WHERE submission_id = $1 AND student_id = $2 AND status = 'in_progress'`,
            [submissionId, studentId],
        );
        if (subCheck.rowCount === 0)
            throw new Error("Submission not found or closed");

        const sqRes = await db.query(
            `SELECT submission_question_id FROM exam.submission_questions WHERE submission_id = $1 AND question_id = $2`,
            [submissionId, dto.question_id],
        );
        if (sqRes.rowCount === 0)
            throw new Error("Question not found in this test");

        const sqId = sqRes.rows[0].submission_question_id;

        await db.query(
            `
            INSERT INTO exam.student_answers (submission_question_id, mcq_option_ids, tf_answer, code_answer, answered_at)
            VALUES ($1, $2, $3, $4, NOW())
            ON CONFLICT (submission_question_id) 
            DO UPDATE SET 
                mcq_option_ids = EXCLUDED.mcq_option_ids, 
                tf_answer = EXCLUDED.tf_answer, 
                code_answer = EXCLUDED.code_answer, 
                answered_at = NOW()`,
            [
                sqId,
                dto.mcq_option_ids || null,
                dto.tf_answer ?? null,
                dto.code_answer || null,
            ],
        );
    }

    static async submitAndGrade(submissionId: number, studentId: string, db: Pool) {
        // 1. Fetch data including timing and status metadata
        const dataQuery = `
      SELECT 
        sa.answer_id, sq.submission_question_id, sa.mcq_option_ids, sa.tf_answer, sa.code_answer,
        q.question_id, q.question_type, sq.points as question_points,
        q.structural_rules, q.weight_wb, q.weight_bb,
        pq.test_cases, 
        pq.category,
        pq.function_signature,
        pq.boilerplate_code, 
        pq.cpu_time_limit, 
        pq.memory_limit,
        tf.correct_answer as tf_correct,
        t.enable_negative_grading,
        -- 🕒 TIME ENFORCEMENT DATA
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

        if (questionsToGrade.length === 0) {
            throw new Error("Submission not found.");
        }

        const firstRow = questionsToGrade[0];

        // 2. CHECK: Is the submission already closed?
        if (firstRow.current_status !== 'in_progress') {
            throw new Error("SUBMISSION_CLOSED: This exam has already been submitted or graded.");
        }

        // 3. CHECK: Has the time limit expired? (Server-side validation)
        const startTime = new Date(firstRow.started_at).getTime();
        const durationMs = firstRow.duration_minutes * 60 * 1000;
        const now = Date.now();
        const gracePeriod = 2 * 60 * 1000; // 2-minute buffer for network latency

        if (now > (startTime + durationMs + gracePeriod)) {
            throw new Error("TIME_EXPIRED: The time limit for this exam has passed. Submission rejected.");
        }

        const enable_negative_grading = firstRow.enable_negative_grading;
        const gradingResults: { answerId: number | null; score: number; evalResult: any }[] = [];
        let totalScore = 0;

        // 4. Grading Loop
        for (const ans of questionsToGrade) {
            let earnedPoints = 0;
            let evalResult: any = {};
            const points = Number(ans.question_points);

            if (ans.answer_id) {
                if (ans.question_type === 'mcq') {
                    earnedPoints = GradingService.calculateMCQ(
                        points,
                        ans.mcq_options_data || [],
                        ans.mcq_option_ids || [],
                        enable_negative_grading
                    );
                    evalResult = { type: 'mcq', selected: ans.mcq_option_ids };
                }
                else if (ans.question_type === 'true_false') {
                    earnedPoints = GradingService.calculateTrueFalse(
                        points,
                        ans.tf_answer,
                        ans.tf_correct
                    );
                    evalResult = { type: 'tf', student_ans: ans.tf_answer, correct_ans: ans.tf_correct };
                }
                else if (ans.question_type === 'programming' && ans.code_answer) {
                    // A. Determine Harness (Boilerplate)
                    const finalHarness = (ans.category === 'CUSTOM' && ans.boilerplate_code)
                        ? ans.boilerplate_code
                        : BoilerplateFactory.createFullHarness(ans.category, ans.function_signature);

                    // B. White-Box (Structural DNA)
                    const wbResult = await StructuralAnalysisService.analyze(
                        ans.code_answer,
                        ans.structural_rules || []
                    );

                    // C. Black-Box (Functional Behavior)
                    const bbResult = await this.runJudge0Assessment(
                        ans.code_answer,
                        ans.test_cases || [],
                        finalHarness,
                        { cpu: Number(ans.cpu_time_limit), memory: Number(ans.memory_limit) }
                    );

                    const wWB = Number(ans.weight_wb) || 0.2;
                    const wBB = Number(ans.weight_bb) || 0.8;

                    // D. Calculation (Ratio-based 0.0 to 1.0)
                    earnedPoints = (points * wWB * wbResult.score) + (points * wBB * bbResult.scoreWeight);

                    // E. Construct Detailed JSON Report
                    evalResult = {
                        summary: {
                            final_score_ratio: (earnedPoints / points).toFixed(4),
                            points_earned: earnedPoints,
                            points_possible: points,
                            weights: { white_box: wWB, black_box: wBB }
                        },
                        white_box: {
                            ratio: wbResult.score,
                            details: wbResult.details
                        },
                        black_box: {
                            ratio: bbResult.scoreWeight,
                            feedback: bbResult.feedback,
                            test_results: bbResult.details
                        },
                        meta: {
                            category: ans.category,
                            signature: ans.function_signature,
                            timestamp: new Date().toISOString()
                        }
                    };
                }
            }

            gradingResults.push({ answerId: ans.answer_id, score: earnedPoints, evalResult });
            totalScore += earnedPoints;
        }

        // 5. Atomic Persistence (Transaction)
        const client = await db.connect();
        try {
            await client.query("BEGIN");
            for (const res of gradingResults) {
                if (res.answerId) {
                    await client.query(
                        `UPDATE exam.student_answers 
                     SET question_grade = $1, eval_result = $2, is_submitted = true 
                     WHERE answer_id = $3`,
                        [res.score, res.evalResult, res.answerId]
                    );
                }
            }

            // Finalize submission
            await client.query(
                `UPDATE exam.submissions 
             SET status = 'submitted', submitted_at = NOW(), total_grade = $2 
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
}

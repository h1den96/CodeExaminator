import axios from "axios";
import type { Pool } from "pg";
import { ExamDiscoveryService } from "./ExamDiscoveryService";
import { GradingService } from "./gradingService";
import { TestService } from "./testService";
import type { TestTemplateRow, SubmitAnswerDto } from "../types/examTypes";
import { StructuralAnalysisService } from "./structuralAnalysisService";
import { BoilerplateFactory, QuestionCategory } from "./boilerplateFactory";
import { SecurityAuditService } from "./securityAuditService";

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

    /**
     * Καθαρίζει τον κώδικα του μαθητή από directives που παρέχει το boilerplate
     */
    private static cleanStudentCode(code: string): string {
        if (!code) return "";
        return code
            .replace(/^\s*#include\s*[<|"].*[>|"]/gm, '// removed header')
            .replace(/^\s*using\s+namespace\s+std\s*;/gm, '// removed namespace')
            .trim();
    }

    static async getAvailableTestsForStudent(userId: number, db: Pool) {
        const query = `
            SELECT test_id, title, description, available_from, available_until, duration_minutes
            FROM exam.tests 
            WHERE is_published = true 
            AND (available_until IS NULL OR available_until > NOW())
            ORDER BY created_at DESC
        `;
        const res = await db.query(query);
        return res.rows;
    }

    static async getSubmissionResult(submissionId: number, studentId: string, db: Pool) {
        const query = `
            SELECT s.submission_id, s.test_id, t.title as test_title, s.total_grade, s.status, s.submitted_at,
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
        
        const actualTestCases = typeof testCases === 'string' ? JSON.parse(testCases) : testCases;
        const marker = "// [[STUDENT_CODE_ZONE]]";
        let finalSource = "";

        const cleanedCode = this.cleanStudentCode(studentCode);

        if (boilerplate && boilerplate.includes(marker)) {
            finalSource = boilerplate.replace(marker, cleanedCode);
        } else if (boilerplate) {
            finalSource = boilerplate + "\n\n" + cleanedCode;
        } else {
            finalSource = `#include <iostream>\n#include <vector>\nusing namespace std;\n\n${cleanedCode}\n\nint main() { return 0; }`;
        }

        const results: any[] = [];
        let passedCount = 0;

        for (const tCase of actualTestCases) {
            const inputStr = tCase.input ? String(tCase.input) : "";
            const expectedStr = tCase.expected_output ? String(tCase.expected_output) : "";

            const payload = {
                source_code: Buffer.from(finalSource).toString("base64"),
                language_id: languageId || 54,
                stdin: Buffer.from(inputStr).toString("base64"),
                cpu_time_limit: limits.cpu ? Number(limits.cpu) : 2.0, 
                memory_limit: limits.memory ? Number(limits.memory) : 128000,
                base64_encoded: true,
                wait: true
            };

            const res = await axios.post(`${JUDGE0_URL}/submissions?base64_encoded=true&wait=true`, payload);
            const { status, stdout, stderr, compile_output } = res.data;
            
            const actualOutput = stdout ? Buffer.from(stdout, "base64").toString() : "";
            const normalizedActual = this.normalizeOutput(actualOutput);
            const normalizedExpected = this.normalizeOutput(expectedStr);

            const logicMatches = GradingService.smartCompare(normalizedActual, normalizedExpected);
            const isCorrect = (status.id === 3) && logicMatches;
            
            if (isCorrect) passedCount++;

            let errorDetails: string | null = null;
            if (stderr || compile_output) {
                const rawError = Buffer.from(stderr || compile_output, "base64").toString();
                errorDetails = rawError.includes("redefinition of 'int main'") 
                    ? "Constraint Violation: You have included a main() function." 
                    : rawError;
            }

            results.push({
                status: status.description,
                is_public: !!tCase.is_public,
                input: tCase.is_public ? inputStr : "Hidden",
                expected: tCase.is_public ? expectedStr : "REDACTED",
                actual: tCase.is_public ? actualOutput : "REDACTED",
                passed: isCorrect,
                error: errorDetails,
            });
        }

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
                 VALUES ($1, $2, 'started', NOW()) 
                 RETURNING submission_id, started_at`,
                [studentId, t.test_id],
            );
            const submissionId = sRes.rows[0].submission_id;

            const drawQuery = `
            INSERT INTO exam.submission_questions (submission_id, question_id, q_order, points)
            WITH RECURSIVE 
            slots AS (
                SELECT slot_id, slot_order, topic_id, difficulty, question_type, category, points,
                        ROW_NUMBER() OVER (ORDER BY slot_order) as rn
                FROM exam.test_slots
                WHERE test_id = $2
            ),
            picker AS (
                (
                    SELECT s.slot_order, s.points, q_pool.question_id, ARRAY[q_pool.question_id] as used_ids, s.rn
                    FROM slots s
                    CROSS JOIN LATERAL (
                        SELECT q.question_id
                        FROM exam.questions q
                        JOIN exam.question_topics qt ON q.question_id = qt.question_id
                        INNER JOIN exam.programming_questions pq ON q.question_id = pq.question_id
                        WHERE q.difficulty = s.difficulty
                        AND qt.topic_id = s.topic_id
                        AND q.question_type = s.question_type
                        AND (s.category = 'ANY' OR pq.category = s.category)
                        ORDER BY RANDOM()
                        LIMIT 1
                    ) q_pool
                    WHERE s.rn = 1
                )
                UNION ALL
                SELECT s.slot_order, s.points, q_pool.question_id, p.used_ids || q_pool.question_id, s.rn
                FROM slots s
                JOIN picker p ON s.rn = p.rn + 1
                CROSS JOIN LATERAL (
                    SELECT q.question_id
                    FROM exam.questions q
                    JOIN exam.question_topics qt ON q.question_id = qt.question_id
                    INNER JOIN exam.programming_questions pq ON q.question_id = pq.question_id
                    WHERE q.difficulty = s.difficulty
                        AND qt.topic_id = s.topic_id
                        AND q.question_type = s.question_type
                        AND (s.category = 'ANY' OR pq.category = s.category)
                        AND q.question_id != ALL(p.used_ids)
                    ORDER BY RANDOM()
                    LIMIT 1
                ) q_pool
            )
            SELECT $1, question_id, slot_order, points FROM picker;
            `;

            await client.query(drawQuery, [submissionId, t.test_id]);
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
           `SELECT submission_id FROM exam.submissions 
            WHERE submission_id = $1 AND student_id = $2 
            AND status IN ('in_progress', 'started')`,
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
        const forbiddenPatterns = ["/*", "*/"];
        for (const pattern of forbiddenPatterns) {
            if (code.includes(pattern)) {
                throw new Error(`SECURITY_VIOLATION: Forbidden pattern detected: ${pattern}`);
            }
        }
    }

    static async submitAndGrade(submissionId: number, studentId: string, db: Pool, codeOverride?: string) {
        const dataQuery = `
            SELECT sa.answer_id, sq.submission_question_id, sa.mcq_option_ids, sa.tf_answer, sa.code_answer,
            q.question_id, q.question_type, sq.points as question_points,
            q.structural_rules, q.weight_wb, q.weight_bb,
            pq.test_cases, pq.language_id, pq.category, pq.function_signature,
            pq.boilerplate_code, pq.cpu_time_limit, pq.memory_limit,
            tf.correct_answer as tf_correct, t.enable_negative_grading,
            s.started_at, t.duration_minutes, s.status as current_status,
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
        if (firstRow.current_status !== 'in_progress' && firstRow.current_status !== 'started') {
             throw new Error("SUBMISSION_CLOSED");
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
                    const rawCode = codeOverride || ans.code_answer;
                    if (rawCode) {
                        const forbiddenKeywords = ["system(", "fork(", "fstream", "ifstream", "ofstream", "<filesystem>", "bits/stdc++.h"];
                        const securityCheck = GradingService.performStaticAnalysis(rawCode, forbiddenKeywords, ans.required_keywords || []);
                        
                        if (!securityCheck.passed) {
                            if (securityCheck.violationType) {
                                await SecurityAuditService.logViolation(studentId, ans.question_id, rawCode, `Forbidden keyword: ${securityCheck.violationType}`);
                            }
                            evalResult = { type: 'programming', status: 'SECURITY_ERROR', feedback: securityCheck.error, details: [] };
                        } else {
                            const wbResult = await StructuralAnalysisService.analyze(rawCode, ans.structural_rules || []);
                            const structuralViolation = wbResult.details.find((d: any) => !d.passed && (d.weight === 0 || d.description.includes("forbidden")));
                            
                            if (structuralViolation) {
                                evalResult = { type: 'programming', status: 'SECURITY_ERROR', feedback: structuralViolation.description, details: wbResult.details };
                            } else {
                                const finalHarness = (ans.boilerplate_code && ans.boilerplate_code.trim().length > 0)
                                    ? ans.boilerplate_code
                                    : BoilerplateFactory.createFullHarness(ans.category, ans.function_signature);

                                const bbResult = await this.runJudge0Assessment(rawCode, ans.test_cases || [], finalHarness, { cpu: ans.cpu_time_limit, memory: ans.memory_limit }, ans.language_id || 54);

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
            return { submission_id: submissionId, status: 'submitted', final_score: totalScore, questions: gradingResults };
        } catch (e) {
            await client.query("ROLLBACK");
            throw e;
        } finally {
            client.release();
        }
    }
}
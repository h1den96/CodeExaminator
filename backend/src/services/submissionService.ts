import type { Pool } from "pg";
import { ExamDiscoveryService } from "./ExamDiscoveryService";
import { GradingService } from "./gradingService";
import { TestService } from "./testService";
import type { TestTemplateRow, SubmitAnswerDto } from "../types/examTypes";
import { ProgrammingGradingEngine } from "./programmingGradingEngine";
import { QuestionCategory } from "./boilerplateFactory";

interface ManualGradeDto {
    question_id: number;
    manual_grade: number;
    teacher_comments?: string;
}

export class SubmissionService {
    static async manuallyGradeSubmission(submissionId: number, grades: ManualGradeDto[], db: Pool) {
        const client = await db.connect();
        try {
            await client.query("BEGIN");
            for (const item of grades) {
                await client.query(
                    `UPDATE exam.student_answers sa
                     SET question_grade = $1, teacher_comments = $2, is_manually_graded = true
                     FROM exam.submission_questions sq
                     WHERE sa.submission_question_id = sq.submission_question_id
                       AND sq.submission_id = $3 AND sq.question_id = $4`,
                    [item.manual_grade, item.teacher_comments || null, submissionId, item.question_id]
                );
            }
            const totalRes = await client.query(
                `SELECT SUM(sa.question_grade) as total FROM exam.student_answers sa
                 JOIN exam.submission_questions sq ON sa.submission_question_id = sq.submission_question_id
                 WHERE sq.submission_id = $1`, [submissionId]
            );
            const newTotal = Number(totalRes.rows[0].total || 0);
            await client.query(
                `UPDATE exam.submissions SET total_grade = $1, status = 'graded', graded_at = NOW() WHERE submission_id = $2`,
                [newTotal, submissionId]
            );
            await client.query("COMMIT");
            return { success: true, final_score: newTotal };
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally { client.release(); }
    }

    static async manuallyGradeEntireSubmission(submissionId: number, grades: any[], db: Pool) {
        const client = await db.connect();
        try {
            await client.query("BEGIN");
            for (const item of grades) {
                const sqId = parseInt(item.submissionQuestionId);
                const gVal = parseFloat(String(item.grade).replace(',', '.'));

                if (isNaN(sqId)) continue;

                await client.query(
                    `INSERT INTO exam.student_answers (submission_question_id, question_grade, teacher_comments, is_manually_graded)
                     VALUES ($1, $2, $3, true)
                     ON CONFLICT (submission_question_id) 
                     DO UPDATE SET question_grade = EXCLUDED.question_grade, teacher_comments = EXCLUDED.teacher_comments, is_manually_graded = true`,
                    [sqId, gVal, item.comments || null]
                );
            }

            const totalRes = await client.query(
                `SELECT SUM(sa.question_grade) as earned, SUM(sq.points) as possible
                 FROM exam.submission_questions sq
                 LEFT JOIN exam.student_answers sa ON sq.submission_question_id = sa.submission_question_id
                 WHERE sq.submission_id = $1`, 
                [submissionId]
            );

            const earned = Number(totalRes.rows[0]?.earned || 0);
            const possible = Number(totalRes.rows[0]?.possible || 1);
            const normalizedTotal = Number(((earned / possible) * 10).toFixed(2));

            await client.query(
                `UPDATE exam.submissions SET total_grade = $1, status = 'graded' WHERE submission_id = $2`,
                [normalizedTotal, submissionId]
            );

            await client.query("COMMIT");
            return { success: true, newTotal: normalizedTotal };
        } catch (e) {
            await client.query("ROLLBACK");
            throw e;
        } finally { client.release(); }
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
        const checkQuery = `
            SELECT s.status, s.started_at, t.duration_minutes
            FROM exam.submissions s
            JOIN exam.tests t ON s.test_id = t.test_id
            WHERE s.submission_id = $1
        `;
        const checkRes = await db.query(checkQuery, [submissionId]);
        const sub = checkRes.rows[0];

        if (sub && sub.status === 'started') {
            const startTime = new Date(sub.started_at).getTime();
            const endTime = startTime + (sub.duration_minutes * 60000);
            const now = Date.now();

            if (now > endTime) {
                try {
                    await this.submitAndGrade(submissionId, studentId, db);
                } catch (gradeErr) {
                    console.error(gradeErr);
                }
            }
        }

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
                        'submission_question_id', sq.submission_question_id,
                        'answer_id', sa.answer_id,
                        'question_id', q.question_id,
                        'question_text', q.body,
                        'type', q.question_type,
                        'points_earned', COALESCE(sa.question_grade, 0),
                        'points_possible', sq.points,
                        'eval_details', sa.eval_result,
                        'student_code', sa.code_answer,
                        'teacher_comments', sa.teacher_comments
                    ))
                    FROM exam.submission_questions sq
                    JOIN exam.questions q ON sq.question_id = q.question_id
                    LEFT JOIN exam.student_answers sa ON sq.submission_question_id = sa.submission_question_id
                    WHERE sq.submission_id = s.submission_id
                ) as questions
            FROM exam.submissions s
            JOIN exam.tests t ON s.test_id = t.test_id
            WHERE s.submission_id = $1 
              AND (s.student_id::text = $2 OR $2 = 'TEACHER_BYPASS')
        `;

        const res = await db.query(query, [submissionId, studentId]);
        if (res.rows.length === 0) throw new Error("Submission not found.");
        return res.rows[0];
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
                    questions: fullTest.questions, 
                    test_id: t.test_id, 
                    title: t.title, 
                    started_at: existingSubmission.started_at,
                    duration_minutes: t.duration_minutes 
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
                INSERT INTO exam.submission_questions (submission_id, question_id, q_order, points, question_snapshot)
                WITH RECURSIVE 
                slots AS (
                    SELECT slot_id, slot_order, topic_id, difficulty, question_type, category, points,
                            ROW_NUMBER() OVER (ORDER BY slot_order) as rn
                    FROM exam.test_slots
                    WHERE test_id = $2
                ),
                picker AS (
                    (
                        SELECT s.slot_order, s.points, q_pool.question_id, q_pool.snapshot, ARRAY[q_pool.question_id] as used_ids, s.rn
                        FROM slots s
                        CROSS JOIN LATERAL (
                            SELECT q.question_id, 
                                to_jsonb(q) || jsonb_build_object('starter_code', pq.starter_code, 'boilerplate_code', pq.boilerplate_code) as snapshot
                            FROM exam.questions q
                            JOIN exam.question_topics qt ON q.question_id = qt.question_id
                            LEFT JOIN exam.programming_questions pq ON q.question_id = pq.question_id
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
                    SELECT s.slot_order, s.points, q_pool.question_id, q_pool.snapshot, p.used_ids || q_pool.question_id, s.rn
                    FROM slots s
                    JOIN picker p ON s.rn = p.rn + 1
                    CROSS JOIN LATERAL (
                        SELECT q.question_id,
                            to_jsonb(q) || jsonb_build_object('starter_code', pq.starter_code, 'boilerplate_code', pq.boilerplate_code) as snapshot
                            FROM exam.questions q
                            JOIN exam.question_topics qt ON q.question_id = qt.question_id
                            LEFT JOIN exam.programming_questions pq ON q.question_id = pq.question_id
                            WHERE q.difficulty = s.difficulty
                            AND qt.topic_id = s.topic_id
                            AND q.question_type = s.question_type
                            AND (s.category = 'ANY' OR pq.category = s.category)
                            AND q.question_id != ALL(p.used_ids)
                        ORDER BY RANDOM()
                        LIMIT 1
                    ) q_pool
                )
                SELECT $1, question_id, slot_order, points, snapshot FROM picker;
                `;

            await client.query(drawQuery, [submissionId, t.test_id]);
            await client.query("COMMIT");
            const freshTest = await TestService.reconstructTestFromSubmission(submissionId, db);
            return {
                submissionId,
                dto: { 
                    ...freshTest, 
                    questions: freshTest.questions, 
                    test_id: t.test_id, 
                    title: t.title, 
                    started_at: sRes.rows[0].started_at 
                },
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

    static async submitAndGrade(submissionId: number, studentId: string, db: Pool, codeOverride?: string) {
        const checkQuery = `SELECT student_id, status FROM exam.submissions WHERE submission_id = $1`;
        const checkRes = await db.query(checkQuery, [submissionId]);

        if (checkRes.rows.length === 0) {
            throw new Error("SUBMISSION_NOT_FOUND");
        }

        const sub = checkRes.rows[0];
        const isBypass = studentId === 'TEACHER_BYPASS' || studentId === 'SYSTEM_CRON';
        if (!isBypass && String(sub.student_id) !== String(studentId)) {
            throw new Error("ACCESS_DENIED");
        }

        const dataQuery = `
            SELECT 
                sa.answer_id, sq.submission_question_id, sa.mcq_option_ids, sa.tf_answer, sa.code_answer,
                q.question_id, q.question_type, sq.points as question_points,
                q.structural_rules, q.weight_wb, q.weight_bb,
                pq.test_cases, pq.language_id, pq.category, pq.function_signature,
                pq.boilerplate_code, pq.cpu_time_limit, pq.memory_limit,
                tf.correct_answer as tf_correct, t.enable_negative_grading,
                (SELECT json_agg(json_build_object('id', mo.option_id, 'weight', mo.score_weight))
                 FROM exam.mcq_options mo WHERE mo.question_id = q.question_id) as mcq_options_data
            FROM exam.submission_questions sq
            JOIN exam.questions q ON sq.question_id = q.question_id
            JOIN exam.submissions s ON sq.submission_id = s.submission_id
            JOIN exam.tests t ON s.test_id = t.test_id
            LEFT JOIN exam.programming_questions pq ON q.question_id = pq.question_id 
            LEFT JOIN exam.student_answers sa ON sq.submission_question_id = sa.submission_question_id
            LEFT JOIN exam.true_false_answers tf ON q.question_id = tf.question_id
            WHERE sq.submission_id = $1
        `;

        const { rows: questionsToGrade } = await db.query(dataQuery, [submissionId]);
        
        if (questionsToGrade.length === 0) {
            await db.query(
                `UPDATE exam.submissions SET status = 'submitted', total_grade = 0, submitted_at = NOW() WHERE submission_id = $1`,
                [submissionId]
            );
            return { success: true, final_score: 0 };
        }

        const gradingResults: { answerId: number | null, score: number, evalResult: any }[] = [];
        let rawEarnedPoints = 0;
        let maxTotalPoints = 0;

        for (const ans of questionsToGrade) {
            const points = Number(ans.question_points);
            maxTotalPoints += points;
            
            let earned = 0;
            let evalResult: any = {};

            if (ans.answer_id) {
                if (ans.question_type === 'mcq') {
                    earned = GradingService.calculateMCQ(points, ans.mcq_options_data || [], ans.mcq_option_ids || [], ans.enable_negative_grading);
                    evalResult = { type: 'mcq', selected: ans.mcq_option_ids };
                } 
                else if (ans.question_type === 'true_false') {
                    earned = GradingService.calculateTrueFalse(points, ans.tf_answer, ans.tf_correct);
                    evalResult = { type: 'tf', student_ans: ans.tf_answer, correct_ans: ans.tf_correct };
                } 
                else if (ans.question_type === 'programming') {
                    const rawCode = codeOverride || ans.code_answer;
                    
                    if (rawCode) {
                        const evaluation = await ProgrammingGradingEngine.evaluate({
                            studentCode: rawCode,
                            testCases: ans.test_cases || [],
                            points,
                            category: ans.category as QuestionCategory,
                            signature: ans.function_signature,
                            boilerplateCode: ans.boilerplate_code,
                            structuralRules: ans.structural_rules || [],
                            weightWb: ans.weight_wb ? Number(ans.weight_wb) : 0.2,
                            weightBb: ans.weight_bb ? Number(ans.weight_bb) : 0.8,
                            cpuLimit: ans.cpu_time_limit ? Number(ans.cpu_time_limit) : 2.0,
                            memoryLimit: ans.memory_limit ? Number(ans.memory_limit) : 128000,
                            languageId: ans.language_id ? Number(ans.language_id) : 54
                        });

                        earned = evaluation.earnedPoints;
                        evalResult = {
                            feedback: evaluation.feedback,
                            white_box: { ratio: earned / points, details: evaluation.structuralDetails },
                            black_box: { ratio: earned / points, test_results: evaluation.details }
                        };
                    } else {
                        earned = 0;
                        evalResult = { status: 'NO_ANSWER', feedback: 'No code submitted.' };
                    }
                }
            }

            gradingResults.push({ 
                answerId: ans.answer_id, 
                score: Number(earned.toFixed(2)), 
                evalResult 
            });
            rawEarnedPoints += earned;
        }

        const finalNormalizedGrade = maxTotalPoints > 0 
            ? Number(((rawEarnedPoints / maxTotalPoints) * 10).toFixed(2)) 
            : 0;

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

            await client.query(
                `UPDATE exam.submissions 
                 SET status = 'submitted', submitted_at = NOW(), total_grade = $1 
                 WHERE submission_id = $2`,
                [finalNormalizedGrade, submissionId]
            );

            await client.query("COMMIT");
            return { 
                success: true, 
                submission_id: submissionId, 
                final_score: finalNormalizedGrade 
            };
        } catch (e: any) {
            await client.query("ROLLBACK");
            throw e;
        } finally {
            client.release();
        }
    }
}
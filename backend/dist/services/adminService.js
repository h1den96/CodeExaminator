"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const db_1 = require("../db/db");
class AdminService {
    /**
     * Universal Create Question Function
     * Saves weights, grace settings, structural rules, and technical metadata.
     */
    static async createQuestion(dto) {
        const client = await db_1.examDb.connect();
        try {
            await client.query("BEGIN");
            const weightWb = dto.weight_wb ?? 0.20;
            const weightBb = dto.weight_bb ?? 0.80;
            const graceMode = dto.grace_mode || "STANDARD";
            const graceThreshold = dto.grace_threshold ?? 0.90;
            const graceCap = dto.grace_cap ?? 0.15;
            const structuralRules = dto.structural_rules || [];
            const qRes = await client.query(`INSERT INTO exam.questions 
         (title, body, question_type, difficulty, created_by, allow_multiple,
          weight_wb, weight_bb, grace_mode, grace_threshold, grace_cap, structural_rules)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING question_id`, [
                dto.title,
                dto.body,
                dto.question_type,
                dto.difficulty,
                dto.teacher_id,
                dto.allow_multiple || false,
                weightWb,
                weightBb,
                graceMode,
                graceThreshold,
                graceCap,
                JSON.stringify(structuralRules)
            ]);
            const qId = qRes.rows[0].question_id;
            if (dto.topic_ids && dto.topic_ids.length > 0) {
                for (const tId of dto.topic_ids) {
                    await client.query(`INSERT INTO exam.question_topics (question_id, topic_id) VALUES ($1, $2)`, [qId, tId]);
                }
            }
            if (dto.question_type === "mcq" && dto.options) {
                for (const opt of dto.options) {
                    const weight = typeof opt.score_weight === "number" ? opt.score_weight : (opt.is_correct ? 1.0 : 0.0);
                    await client.query(`INSERT INTO exam.mcq_options (question_id, option_text, is_correct, score_weight)
             VALUES ($1, $2, $3, $4)`, [qId, opt.text, opt.is_correct, weight]);
                }
            }
            else if (dto.question_type === "true_false" && dto.correct_answer !== undefined) {
                await client.query(`INSERT INTO exam.true_false_answers (question_id, correct_answer)
           VALUES ($1, $2)`, [qId, dto.correct_answer]);
            }
            else if (dto.question_type === "programming") {
                await client.query(`INSERT INTO exam.programming_questions 
           (question_id, category, function_signature, language_id, starter_code, test_cases)
           VALUES ($1, $2, $3, $4, $5, $6)`, [
                    qId,
                    dto.category || "SCALAR",
                    dto.function_signature || "",
                    dto.language_id || 54,
                    dto.starter_code || "",
                    JSON.stringify(dto.test_cases || [])
                ]);
            }
            await client.query("COMMIT");
            return { question_id: qId, message: "Question created successfully" };
        }
        catch (err) {
            await client.query("ROLLBACK");
            throw err;
        }
        finally {
            client.release();
        }
    }
    /**
     * Create Test Blueprint (Exam)
     */
    static async createTest(dto) {
        const client = await db_1.examDb.connect();
        try {
            await client.query("BEGIN");
            const testSql = `
        INSERT INTO exam.tests 
        (title, description, created_by, is_random, duration_minutes, available_from, available_until, strict_deadline, is_published)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING test_id
      `;
            const testRes = await client.query(testSql, [
                dto.title, dto.description, dto.created_by, dto.is_random, dto.duration_minutes || 60,
                dto.available_from || null, dto.available_until || null, dto.strict_deadline, dto.is_published ?? true
            ]);
            const testId = testRes.rows[0].test_id;
            if (dto.slots && dto.slots.length > 0) {
                const slotSql = `
          INSERT INTO exam.test_slots 
          (test_id, slot_order, topic_id, question_type, difficulty, category, points, weight_bb, weight_wb)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `;
                for (let i = 0; i < dto.slots.length; i++) {
                    const s = dto.slots[i];
                    let dbType = String(s.question_type).toLowerCase();
                    if (dbType === "multiple_choice")
                        dbType = "mcq";
                    if (dbType === "t/f")
                        dbType = "true_false";
                    if (dbType === "code")
                        dbType = "programming";
                    await client.query(slotSql, [
                        testId,
                        i + 1,
                        s.topic_id,
                        dbType,
                        s.difficulty.toLowerCase(),
                        s.category,
                        s.points,
                        s.weight_bb,
                        s.weight_wb,
                    ]);
                }
            }
            else {
                throw new Error("Cannot create a test with zero slots.");
            }
            await client.query("COMMIT");
            return { test_id: testId, message: "Exam blueprint and slots created." };
        }
        catch (err) {
            await client.query("ROLLBACK");
            console.error("AdminService.createTest Error:", err);
            throw err;
        }
        finally {
            client.release();
        }
    }
    static async getAllTopics() {
        const res = await db_1.examDb.query("SELECT * FROM exam.topics ORDER BY name ASC");
        return res.rows;
    }
    // --- RESTORED WRAPPER METHODS FOR COMPATIBILITY ---
    static async createProgrammingQuestion(data) {
        return this.createQuestion({ ...data, question_type: "programming" });
    }
    static async createMCQ(data) {
        return this.createQuestion({ ...data, question_type: "mcq" });
    }
    static async createTF(data) {
        return this.createQuestion({ ...data, question_type: "true_false" });
    }
    static async updateProgrammingTestCases(questionId, testCases) {
        const res = await db_1.examDb.query(`UPDATE exam.programming_questions SET test_cases = $1 WHERE question_id = $2 RETURNING question_id`, [JSON.stringify(testCases), questionId]);
        if (res.rowCount === 0)
            throw new Error("Programming question not found.");
        return { message: "Test cases updated successfully" };
    }
}
exports.AdminService = AdminService;

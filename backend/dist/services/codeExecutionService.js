"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeExecutionService = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const programmingGradingEngine_1 = require("./programmingGradingEngine");
dotenv_1.default.config();
class CodeExecutionService {
    static async executeAndGrade(submissionQuestionId, studentCode, db) {
        try {
            const questionQuery = `
        SELECT pq.test_cases, pq.category, pq.function_signature, pq.boilerplate_code, 
               sq.points as max_points, q.question_type, q.structural_rules, pq.language_id,
               q.weight_wb, q.weight_bb, pq.cpu_time_limit, pq.memory_limit
        FROM exam.submission_questions sq
        JOIN exam.questions q ON sq.question_id = q.question_id
        JOIN exam.programming_questions pq ON sq.question_id = pq.question_id
        WHERE sq.submission_question_id = $1
      `;
            const qRes = await db.query(questionQuery, [submissionQuestionId]);
            if (qRes.rows.length === 0)
                throw new Error("Question not found");
            const testCases = qRes.rows[0].test_cases;
            const maxPoints = Number(qRes.rows[0].max_points);
            const category = qRes.rows[0].category;
            const signature = qRes.rows[0].function_signature;
            const dbBoilerplate = qRes.rows[0].boilerplate_code;
            const structuralRules = qRes.rows[0].structural_rules || [];
            const weightWb = qRes.rows[0].weight_wb ? Number(qRes.rows[0].weight_wb) : 0.2;
            const weightBb = qRes.rows[0].weight_bb ? Number(qRes.rows[0].weight_bb) : 0.8;
            const cpuLimit = qRes.rows[0].cpu_time_limit ? Number(qRes.rows[0].cpu_time_limit) : 2.0;
            const memoryLimit = qRes.rows[0].memory_limit ? Number(qRes.rows[0].memory_limit) : 128000;
            const languageId = qRes.rows[0].language_id ? Number(qRes.rows[0].language_id) : 54;
            const evaluation = await programmingGradingEngine_1.ProgrammingGradingEngine.evaluate({
                studentCode,
                testCases,
                points: maxPoints,
                category,
                signature,
                boilerplateCode: dbBoilerplate,
                structuralRules,
                weightWb,
                weightBb,
                cpuLimit,
                memoryLimit,
                languageId
            });
            const finalMeta = {
                feedback: evaluation.feedback,
                test_results: evaluation.details,
                structural_analysis: evaluation.structuralDetails,
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
                evaluation.earnedPoints,
            ]);
            return {
                question_grade: evaluation.earnedPoints,
                details: evaluation.details,
            };
        }
        catch (err) {
            console.error(err);
            throw err;
        }
    }
}
exports.CodeExecutionService = CodeExecutionService;

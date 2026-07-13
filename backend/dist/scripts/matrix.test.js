"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const codeExecutionService_1 = require("../services/codeExecutionService");
const structuralAnalysisService_1 = require("../services/structuralAnalysisService");
const gradingService_1 = require("../services/gradingService");
const db_1 = require("../db/db");
const axios_1 = __importDefault(require("axios"));
jest.mock("axios");
jest.mock("../services/structuralAnalysisService");
const mockedAxios = axios_1.default;
const MockedStructuralService = structuralAnalysisService_1.StructuralAnalysisService;
describe("Dynamic Question Category Testing Suite", () => {
    let productionQuestions = [];
    let originalSmartCompare;
    let activeQuestionInLoop = null; // 🔥 Tracks the live running question layout
    beforeAll(async () => {
        originalSmartCompare = gradingService_1.GradingService.smartCompare;
        const res = await db_1.examDb.query(`
      SELECT pq.* FROM exam.programming_questions pq
      JOIN exam.questions q ON pq.question_id = q.question_id
    `);
        productionQuestions = res.rows;
    });
    afterAll(async () => {
        gradingService_1.GradingService.smartCompare = originalSmartCompare;
        await db_1.examDb.end();
        const { authDb } = require("../db/db");
        await authDb.end();
    });
    beforeEach(() => {
        jest.clearAllMocks();
        MockedStructuralService.hasLoop.mockReturnValue(true);
    });
    test("Evaluate Grader across all database category structures", async () => {
        if (productionQuestions.length === 0) {
            console.warn("Test matrix skipped: No programming questions found in database.");
            return;
        }
        // Intercept database reads globally for this test run
        mockPoolQueryForMetadata();
        for (const question of productionQuestions) {
            activeQuestionInLoop = question; // 🔥 Set our tracker to the current question profile
            const mockSqId = 999;
            const maxPoints = 10.00;
            // --- MATRIX TEST 1: SYNTAX ERROR / COMPILATION CRASH ---
            gradingService_1.GradingService.smartCompare = originalSmartCompare;
            mockedAxios.post.mockResolvedValueOnce({ data: question.test_cases.map(() => ({ token: "err_tok" })) });
            mockedAxios.get.mockResolvedValueOnce({
                data: {
                    submissions: question.test_cases.map(() => ({
                        status: { id: 4, description: "Compilation Error" },
                        compile_output: Buffer.from("Syntax Error").toString("base64"),
                        stdout: null, stderr: null
                    }))
                }
            });
            const compileErrorResult = await codeExecutionService_1.CodeExecutionService.executeAndGrade(mockSqId, "int broken_code() { syntax_error }", db_1.examDb);
            const expectedStaticScore = parseFloat((maxPoints * 0.2).toFixed(2));
            expect(compileErrorResult.question_grade).toBe(expectedStaticScore);
            // --- MATRIX TEST 2: PERFECT PASS SIMULATION ---
            gradingService_1.GradingService.smartCompare = () => true;
            mockedAxios.post.mockResolvedValueOnce({ data: question.test_cases.map(() => ({ token: "pass_tok" })) });
            mockedAxios.get.mockResolvedValueOnce({
                data: {
                    submissions: question.test_cases.map((tc) => {
                        const exactOutput = tc.expected_output || tc.expected || "";
                        return {
                            status: { id: 3, description: "Accepted" },
                            stdout: Buffer.from(String(exactOutput)).toString("base64"),
                            stderr: null,
                            compile_output: null
                        };
                    })
                }
            });
            const perfectResult = await codeExecutionService_1.CodeExecutionService.executeAndGrade(mockSqId, "int working_solution() { for(;;) {} return 0; }", db_1.examDb);
            expect(perfectResult.question_grade).toBe(maxPoints);
        }
    });
    function mockPoolQueryForMetadata() {
        db_1.examDb.query = jest.fn().mockImplementation((queryText, values) => {
            if (queryText.includes("SELECT pq.test_cases")) {
                // 🔥 Always deliver the EXACT test cases matching our active loop tracker
                return Promise.resolve({
                    rows: [{
                            test_cases: activeQuestionInLoop.test_cases,
                            category: activeQuestionInLoop.category,
                            function_signature: activeQuestionInLoop.function_signature,
                            boilerplate_code: activeQuestionInLoop.boilerplate_code,
                            max_points: "10.00"
                        }]
                });
            }
            return Promise.resolve({ rows: [], rowCount: 1 });
        });
    }
});

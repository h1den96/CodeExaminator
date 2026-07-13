"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const codeExecutionService_1 = require("../services/codeExecutionService");
const structuralAnalysisService_1 = require("../services/structuralAnalysisService");
const axios_1 = __importDefault(require("axios"));
jest.mock("axios");
jest.mock("../services/structuralAnalysisService");
const mockedAxios = axios_1.default;
const MockedStructuralService = structuralAnalysisService_1.StructuralAnalysisService;
describe("CodeExecutionService Execution Matrix & Grading Tests", () => {
    let mockPool;
    const mockSubmissionQuestionId = 101;
    const mockQuestionData = {
        rows: [
            {
                test_cases: [
                    { input: "2 3", expected_output: "5", is_public: true },
                    { input: "5 5", expected_output: "10", is_public: true }
                ],
                category: "SCALAR",
                function_signature: "int add(int a, int b);",
                boilerplate_code: "// {{STUDENT_CODE}}\n\nint main() { return 0; }",
                max_points: "10.00",
                question_type: "programming"
            }
        ]
    };
    beforeEach(() => {
        jest.clearAllMocks();
        mockPool = {
            query: jest.fn().mockImplementation((queryText, values) => {
                if (queryText.includes("SELECT pq.test_cases")) {
                    return Promise.resolve(mockQuestionData);
                }
                return Promise.resolve({ rows: [], rowCount: 1 });
            }),
            connect: jest.fn()
        };
        MockedStructuralService.hasLoop.mockReturnValue(true);
    });
    test("Matrix Case 1: Empty student submission logic parsing block", async () => {
        const studentCode = "";
        MockedStructuralService.hasLoop.mockReturnValueOnce(false);
        const result = await codeExecutionService_1.CodeExecutionService.executeAndGrade(mockSubmissionQuestionId, studentCode, mockPool);
        expect(result.question_grade).toBe(0);
        expect(result.details[0].status).toBe("Security Violation");
    });
    test("Matrix Case 2: Security violation block (banned process runtime execution)", async () => {
        const studentCode = "int main() { system(\"rm -rf /\"); }";
        const result = await codeExecutionService_1.CodeExecutionService.executeAndGrade(mockSubmissionQuestionId, studentCode, mockPool);
        expect(result.question_grade).toBe(0);
        expect(result.details[0].status).toBe("Security Violation");
    });
    test("Matrix Case 3: Compilation crash parsing handling within validation check", async () => {
        const studentCode = "int add(int a, int b) { for(;;) {} return a + b error_syntax }";
        mockedAxios.post.mockResolvedValueOnce({
            data: [{ token: "token_compile_error" }]
        });
        mockedAxios.get.mockResolvedValueOnce({
            data: {
                submissions: [
                    {
                        status: { id: 4, description: "Compilation Error" },
                        compile_output: "ZXJyb3I6IGV4cGVjdGVkICc7Jw==",
                        stdout: null,
                        stderr: null
                    },
                    {
                        status: { id: 4, description: "Compilation Error" },
                        compile_output: "ZXJyb3I6IGV4cGVjdGVkICc7Jw==",
                        stdout: null,
                        stderr: null
                    }
                ]
            }
        });
        const result = await codeExecutionService_1.CodeExecutionService.executeAndGrade(mockSubmissionQuestionId, studentCode, mockPool);
        expect(result.question_grade).toBe(2); // Structural weight check pass (2.0 pts) + Black Box crash (0.0 pts)
        expect(result.details[0].passed).toBe(false);
        expect(result.details[0].status).toBe("Compilation Error");
    });
    test("Matrix Case 4: Partial success metric validation parsing tracking rules", async () => {
        const studentCode = "int add(int a, int b) { for(int i=0; i<1; i++) {} return 5; }";
        mockedAxios.post.mockResolvedValueOnce({
            data: [{ token: "t1" }, { token: "t2" }]
        });
        mockedAxios.get.mockResolvedValueOnce({
            data: {
                submissions: [
                    {
                        status: { id: 3, description: "Accepted" },
                        stdout: Buffer.from("5\n").toString("base64"),
                        stderr: null,
                        compile_output: null
                    },
                    {
                        status: { id: 3, description: "Accepted" },
                        stdout: Buffer.from("5\n").toString("base64"),
                        stderr: null,
                        compile_output: null
                    }
                ]
            }
        });
        const result = await codeExecutionService_1.CodeExecutionService.executeAndGrade(mockSubmissionQuestionId, studentCode, mockPool);
        // Structural metric: Loop check detected passes (+2.0 pts)
        // Black Box verification: 1/2 passing cases checked (+4.0 pts)
        expect(result.question_grade).toBe(6);
        expect(result.details[0].passed).toBe(true);
        expect(result.details[1].passed).toBe(false);
    });
    test("Matrix Case 5: 100% full verification compilation matching pass execution", async () => {
        const studentCode = "int add(int a, int b) { for(int i=0; i<1; i++) {} return a + b; }";
        mockedAxios.post.mockResolvedValueOnce({
            data: [{ token: "t1" }, { token: "t2" }]
        });
        mockedAxios.get.mockResolvedValueOnce({
            data: {
                submissions: [
                    {
                        status: { id: 3, description: "Accepted" },
                        stdout: Buffer.from("5\n").toString("base64"),
                        stderr: null,
                        compile_output: null
                    },
                    {
                        status: { id: 3, description: "Accepted" },
                        stdout: Buffer.from("10\n").toString("base64"),
                        stderr: null,
                        compile_output: null
                    }
                ]
            }
        });
        const result = await codeExecutionService_1.CodeExecutionService.executeAndGrade(mockSubmissionQuestionId, studentCode, mockPool);
        expect(result.question_grade).toBe(10);
        expect(result.details[0].passed).toBe(true);
        expect(result.details[1].passed).toBe(true);
    });
});

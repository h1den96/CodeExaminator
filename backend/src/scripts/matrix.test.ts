import { CodeExecutionService } from "../services/codeExecutionService";
import { StructuralAnalysisService } from "../services/structuralAnalysisService";
import { GradingService } from "../services/gradingService";
import { examDb } from "../db/db";
import axios from "axios";

jest.mock("axios");
jest.mock("../services/structuralAnalysisService");

const mockedAxios = axios as jest.Mocked<typeof axios>;
const MockedStructuralService = StructuralAnalysisService as jest.Mocked<typeof StructuralAnalysisService>;

describe("Dynamic Question Category Testing Suite", () => {
  let productionQuestions: any[] = [];
  let originalSmartCompare: any;
  let activeQuestionInLoop: any = null;

  beforeAll(async () => {
    originalSmartCompare = GradingService.smartCompare;

    const res = await examDb.query(`
      SELECT pq.* FROM exam.programming_questions pq
      JOIN exam.questions q ON pq.question_id = q.question_id
    `);
    productionQuestions = res.rows;
  });

  afterAll(async () => {
    GradingService.smartCompare = originalSmartCompare;
    await examDb.end();
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

    mockPoolQueryForMetadata();

    for (const question of productionQuestions) {
      activeQuestionInLoop = question;
      const mockSqId = 999;
      const maxPoints = 10.00;

      GradingService.smartCompare = originalSmartCompare;

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

      const compileErrorResult = await CodeExecutionService.executeAndGrade(
        mockSqId,
        "int broken_code() { syntax_error }",
        examDb as any
      );

      const expectedStaticScore = parseFloat((maxPoints * 0.2).toFixed(2));
      expect(compileErrorResult.question_grade).toBe(expectedStaticScore);

      GradingService.smartCompare = () => true;

      mockedAxios.post.mockResolvedValueOnce({ data: question.test_cases.map(() => ({ token: "pass_tok" })) });
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          submissions: question.test_cases.map((tc: any) => {
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

      const perfectResult = await CodeExecutionService.executeAndGrade(
        mockSqId,
        "int working_solution() { for(;;) {} return 0; }",
        examDb as any
      );

      expect(perfectResult.question_grade).toBe(maxPoints);
    }
  });

  function mockPoolQueryForMetadata() {
    examDb.query = jest.fn().mockImplementation((queryText, values) => {
      if (queryText.includes("SELECT pq.test_cases")) {

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
    }) as any;
  }
});
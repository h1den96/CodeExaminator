import type { Request, Response } from "express";
import { examDb } from "../db/db";
import { SubmissionService } from "../services/submissionService";
import { AdminService } from "../services/adminService";
import { GradingService } from "../services/gradingService";
import { Judge0Service } from "../services/judge0Service";

type AuthUser = { user_id: number; role: string };

// 1. GET AVAILABLE TESTS (For Students)
export async function getAvailableTests(req: Request, res: Response) {
  try {
    const user = (req as any).user as AuthUser | undefined;
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const tests = await SubmissionService.getAvailableTestsForStudent(user.user_id, examDb);

    return res.status(200).json(tests);
  } catch (err: any) {
    console.error("[getAvailableTests] error:", err);
    return res.status(500).json({ error: "Failed to load tests" });
  }
}

// 2. START TEST
export async function startTest(req: Request, res: Response) {
  try {
    const user = (req as any).user as AuthUser | undefined;
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    // Check body first, fallback to query
    let testId = req.body.test_id || req.query.test_id;
    testId = Number(testId);

    if (!Number.isInteger(testId) || testId <= 0) {
      return res.status(400).json({ error: "Invalid test_id" });
    }

    const { submissionId, dto } = await SubmissionService.startTestForStudent(
      testId,
      String(user.user_id),
      examDb
    );

    return res.status(200).json({
      submission_id: submissionId,
      test: dto,
    });

  } catch (err: any) {
    console.error("[startTest] error:", err);

    if (err.message === "You have already submitted this test.") {
      return res.status(409).json({ 
        error: "TEST_ALREADY_SUBMITTED", 
        message: "You have already completed this assessment." 
      });
    }

    if (err.message?.includes("not found")) {
      return res.status(404).json({ error: err.message });
    }
    
    return res.status(500).json({ error: "Internal server error" });
  }
}

// 3. CREATE TEST (For Teachers)
export async function createTest(req: Request, res: Response) {
  try {
    const user = (req as any).user as AuthUser | undefined;
    
    // Safety check: Ensure only teachers can hit this
    if (!user || user.role !== 'teacher') {
      return res.status(403).json({ error: "Only teachers can create tests" });
    }

    const dto = req.body;
    dto.created_by = user.user_id;

    const result = await AdminService.createTest(dto);
    
    return res.status(201).json({ message: "Test created successfully", test: result });

  } catch (err: any) {
    console.error("[createTest] error:", err);
    
    if (err.message?.includes("Math Error")) {
      return res.status(400).json({ error: err.message });
    }
    
    return res.status(500).json({ error: "Internal server error" });
  }
}

// 4. GET ALL TESTS (For Teacher Dashboard)
export async function getAllTests(req: Request, res: Response) {
  try {
    let query = `SELECT * FROM exam.tests ORDER BY created_at DESC`;
    const result = await examDb.query(query);
    return res.status(200).json(result.rows);

  } catch (err: any) {
    console.error("[getAllTests] error:", err);
    return res.status(500).json({ error: "Failed to load tests" });
  }
}

// 5. GET SINGLE TEST BY ID
export async function getTestById(req: Request, res: Response) {
  try {
    const testId = req.params.id;
    
    // Fetch Test Metadata
    const testRes = await examDb.query(`SELECT * FROM exam.tests WHERE test_id = $1`, [testId]);
    
    if (testRes.rows.length === 0) {
      return res.status(404).json({ error: "Test not found" });
    }

    // Fetch Questions
    const qRes = await examDb.query(`
      SELECT q.*, tq.points, tq.position
      FROM exam.test_questions tq
      JOIN exam.questions q ON tq.question_id = q.question_id
      WHERE tq.test_id = $1
      ORDER BY tq.position ASC
    `, [testId]);

    const testData = {
      ...testRes.rows[0],
      questions: qRes.rows
    };

    return res.json(testData);
  } catch (err) {
    console.error("[getTestById] Error:", err);
    return res.status(500).json({ error: "Failed to load test details" });
  }
}

// 6. UPDATE TEST CASES (For Teacher Editor)
export async function updateQuestionTestCases(req: Request, res: Response) {
  try {
    const { questionId } = req.params;
    const { test_cases } = req.body;

    if (!test_cases || !Array.isArray(test_cases)) {
      return res.status(400).json({ error: "Invalid test_cases format. Must be an array." });
    }

    await AdminService.updateProgrammingTestCases(Number(questionId), test_cases);
    return res.json({ message: "Updated" });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}

// 7. RUN CODE (Real Execution)
export async function runSubmissionCode(req: Request, res: Response) {
  try {
    const submissionId = Number(req.params.id);
    const { question_id, code, language } = req.body;
    const user = (req as any).user as AuthUser | undefined;
    const studentId = user ? String(user.user_id) : "0";

    // 1. Save the code first
    await SubmissionService.saveSingleAnswer(submissionId, studentId, {
        question_id,
        code_answer: code
    }, examDb);

    // 2. Fetch test cases
    const qRes = await examDb.query(
        `SELECT test_cases FROM exam.programming_questions WHERE question_id = $1`,
        [question_id]
    );
    const testCases = qRes.rows[0]?.test_cases || [];

    // 3. 🚨 REAL EXECUTION
    const result = await Judge0Service.runBatch(code, "cpp", testCases);

    // 4. Return the REAL result
    return res.json(result);

  } catch (err: any) {
    console.error("[Run Code Error]", err);
    return res.status(500).json({ error: "Failed to execute code: " + err.message });
  }
}

// 8. SUBMIT EXAM (Calculates Grade)
export async function submitTest(req: Request, res: Response) {
  try {
    const submissionId = Number(req.params.id);
    const user = (req as any).user as AuthUser | undefined;

    // 1. Verify user exists
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    
    const studentId = String(user.user_id);

    // 2. Call the Service to Grade everything
    const result = await SubmissionService.submitAndGrade(submissionId, studentId, examDb);

    return res.json({ 
        message: "Exam submitted successfully", 
        grade: result.final_score,
        status: result.status 
    });

  } catch (err: any) {
    console.error("[Submit Test Error]", err);
    return res.status(500).json({ error: "Failed to submit exam" });
  }
}
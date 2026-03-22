import type { Request, Response } from "express";
import { examDb } from "../db/db";
import { SubmissionService } from "../services/submissionService";
import { AdminService } from "../services/adminService";
import { GradingService } from "../services/gradingService";
import { Judge0Service } from "../services/judge0Service";
import { Judge0Result } from "../types/examTypes";

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
  const user = (req as any).user;
  const testId = req.body.test_id;

  try {
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    if (!testId) return res.status(400).json({ error: "test_id is required" });

    // 1. Call your service to start the test
    const { submissionId, dto } = await SubmissionService.startTestForStudent(
      Number(testId),
      String(user.user_id), // Sending as string because your submissions table expects 'text'
      examDb
    );

    return res.status(200).json({
      submission_id: submissionId,
      test: dto
    });

  } catch (err: any) {
    // 2. Catch the "Already Submitted" error
    if (err.message?.toLowerCase().includes("submitted")) {
      
      // 🚀 Use the EXACT column names from your \d output
      // We cast testId to Number and studentId to String to match your types
      const existing = await examDb.query(
        `SELECT submission_id 
         FROM exam.submissions 
         WHERE test_id = $1 AND student_id = $2 
         ORDER BY submission_id DESC LIMIT 1`,
        [Number(testId), String(user.user_id)]
      );

      const sid = existing.rows[0]?.submission_id;

      // 3. Send the 409 with the real ID
      return res.status(409).json({ 
        error: "ALREADY_SUBMITTED",
        submission_id: sid // This will NOT be undefined anymore
      });
    }

    console.error("[startTest] error:", err.message);
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
// 7. RUN CODE (Real Execution)
// 7. RUN CODE (Real Execution)
export async function runSubmissionCode(req: Request, res: Response) {
  try {
    const submissionId = Number(req.params.id);
    const { question_id, code } = req.body;
    const user = (req as any).user as AuthUser | undefined;
    const studentId = user ? String(user.user_id) : "0";

    // 1. Save the student's progress
    await SubmissionService.saveSingleAnswer(submissionId, studentId, {
        question_id,
        code_answer: code
    }, examDb);

    // 🚀 FIX 1: Add cpu_time_limit and memory_limit to the SELECT query
    const qRes = await examDb.query(
        `SELECT boilerplate_code, test_cases, cpu_time_limit, memory_limit 
         FROM exam.programming_questions 
         WHERE question_id = $1`,
        [question_id]
    );
    
    const qData = qRes.rows[0];
    if (!qData) return res.status(404).json({ error: "Question metadata not found" });

    const testCases = qData.test_cases || [];
    const boilerplate = qData.boilerplate_code;

    // 2. THE STITCHING LOGIC
    const finalSource = boilerplate 
      ? boilerplate.replace("// {{STUDENT_CODE}}", code)
      : code;

    // 3. EXIT CHECK (Block the "Nuclear Option")
    if (code.includes("exit(") || code.includes("exit;")) {
      return res.json({
        grade: 0,
        details: [{
          status: "Forbidden Command",
          stderr: "The 'exit()' function is disabled for this exam. Please use 'return' to provide your answer."
        }]
      });
    }

    // 🚀 FIX 2: Now qData actually contains these values!
    const result = await Judge0Service.runBatch(
        finalSource, 
        "cpp", 
        testCases,
        qData.cpu_time_limit, // Now defined!
        qData.memory_limit    // Now defined!
    );

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
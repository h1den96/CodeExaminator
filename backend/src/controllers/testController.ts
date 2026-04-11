import type { Request, Response } from "express";
import { examDb } from "../db/db";
import { SubmissionService } from "../services/submissionService";
import { AdminService } from "../services/adminService";
import { GradingService } from "../services/gradingService";
import { Judge0Service } from "../services/judge0Service";
import { Judge0Result } from "../types/examTypes";
import { StructuralAnalysisService } from "../services/structuralAnalysisService";

type AuthUser = { user_id: number; role: string };

// 1. GET AVAILABLE TESTS (For Students)
export async function getAvailableTests(req: Request, res: Response) {
  try {
    const user = (req as any).user as AuthUser | undefined;
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const tests = await SubmissionService.getAvailableTestsForStudent(
      user.user_id,
      examDb,
    );

    return res.status(200).json(tests);
  } catch (err: any) {
    console.error("[getAvailableTests] error:", err);
    return res.status(500).json({ error: "Failed to load tests" });
  }
}

export async function getAllTests(req: Request, res: Response) {
  try {
    const result = await examDb.query(`
      SELECT t.*, 
             (SELECT COUNT(*) FROM exam.test_slots ts WHERE ts.test_id = t.test_id) as slot_count
      FROM exam.tests t 
      ORDER BY created_at DESC
    `);
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error("[getAllTests] Error:", err);
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
      examDb,
    );

    return res.status(200).json({
      submission_id: submissionId,
      test: dto,
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
        [Number(testId), String(user.user_id)],
      );

      const sid = existing.rows[0]?.submission_id;

      // 3. Send the 409 with the real ID
      return res.status(409).json({
        error: "ALREADY_SUBMITTED",
        submission_id: sid, // This will NOT be undefined anymore
      });
    }

    console.error("[startTest] error:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// 3. CREATE TEST (Updated for Slots)
export async function createTest(req: Request, res: Response) {
  try {
    const user = (req as any).user as AuthUser | undefined;

    if (!user || user.role !== "teacher") {
      return res.status(403).json({ error: "Only teachers can create tests" });
    }

    const dto = req.body; // This now contains the 'slots' array from the frontend
    dto.created_by = user.user_id;

    // The AdminService.createTest should now handle the transaction
    // for both the 'tests' table and the 'test_slots' table.
    const result = await AdminService.createTest(dto);

    return res.status(201).json({
      message: "Test blueprint created successfully",
      test: result,
    });
  } catch (err: any) {
    console.error("[createTest] error:", err);
    return res
      .status(500)
      .json({ error: "Internal server error: " + err.message });
  }
}

// 5. GET SINGLE TEST BY ID (Updated to return the Blueprint)
export async function getTestById(req: Request, res: Response) {
  try {
    const testId = req.params.id;

    // 1. Fetch Test Metadata
    const testRes = await examDb.query(
      `SELECT * FROM exam.tests WHERE test_id = $1`,
      [testId],
    );

    if (testRes.rows.length === 0) {
      return res.status(404).json({ error: "Test not found" });
    }

    // 2. Fetch Slots (The Blueprint) instead of fixed Questions
    // We join with topics to give the frontend the topic names
    const slotRes = await examDb.query(
      `
      SELECT ts.*, t.name as topic_name
      FROM exam.test_slots ts
      LEFT JOIN exam.topics t ON ts.topic_id = t.topic_id
      WHERE ts.test_id = $1
      ORDER BY ts.slot_order ASC
    `,
      [testId],
    );

    const testData = {
      ...testRes.rows[0],
      slots: slotRes.rows, // The frontend will use this to show the "recipe"
    };

    return res.json(testData);
  } catch (err) {
    console.error("[getTestById] Error:", err);
    return res.status(500).json({ error: "Failed to load test blueprint" });
  }
}

// 6. UPDATE TEST CASES (For Teacher Editor)
export async function updateQuestionTestCases(req: Request, res: Response) {
  try {
    const { questionId } = req.params;
    const { test_cases } = req.body;

    if (!test_cases || !Array.isArray(test_cases)) {
      return res
        .status(400)
        .json({ error: "Invalid test_cases format. Must be an array." });
    }

    await AdminService.updateProgrammingTestCases(
      Number(questionId),
      test_cases,
    );
    return res.json({ message: "Updated" });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}

// 7. RUN CODE (Hybrid Execution: AST + Judge0)
export async function runSubmissionCode(req: Request, res: Response) {
  try {
    const submissionId = Number(req.params.id);
    const { question_id, code } = req.body;
    const user = (req as any).user as AuthUser | undefined;
    const studentId = user ? String(user.user_id) : "0";

    // 1. Save student progress
    await SubmissionService.saveSingleAnswer(
      submissionId,
      studentId,
      {
        question_id,
        code_answer: code,
      },
      examDb,
    );

    // 2. Fetch metadata with Weights and Points
    const qRes = await examDb.query(
      `SELECT 
        q.structural_rules, 
        q.weight_wb, 
        q.weight_bb,
        sq.points,
        pq.boilerplate_code, 
        pq.test_cases
     FROM exam.questions q
     JOIN exam.programming_questions pq ON q.question_id = pq.question_id 
     JOIN exam.submission_questions sq ON q.question_id = sq.question_id
     WHERE q.question_id = $1 AND sq.submission_id = $2`,
      [question_id, submissionId],
    );

    const qData = qRes.rows[0];

    if (!qData)
      return res.status(404).json({ error: "Question metadata not found" });

    // 3. Stitching & Security
    const finalSource = qData.boilerplate_code
      ? qData.boilerplate_code.replace("// {{STUDENT_CODE}}", code)
      : code;

    if (code.includes("exit(") || code.includes("exit;")) {
      return res
        .status(403)
        .json({ error: "Forbidden: 'exit()' is not allowed." });
    }

    // 4. Run Analysis
    const structuralResult = await StructuralAnalysisService.analyze(
      code,
      qData.structural_rules || [],
    );

    const judge0Result = await Judge0Service.runBatch(
      finalSource,
      "cpp",
      qData.test_cases || [],
      qData.cpu_time_limit,
      qData.memory_limit,
    );

    // 5. HYBRID MATH FIX
    const totalPoints = Number(qData.points) || 10;
    const weightWB = Number(qData.weight_wb) || 0.2;
    const weightBB = Number(qData.weight_bb) || 0.8;

    // 🚀 CRITICAL FIX: Handle the status object or string
    const passedTests = judge0Result.details.filter((t: any) => {
      const statusDesc = t.status?.description || t.status;
      return statusDesc === "Accepted" || t.status_id === 3;
    }).length;

    const totalTests = judge0Result.details.length || 1;
    const bbPassRate = passedTests / totalTests;

    // Calculation: (10 * 0.2 * 1.0) + (10 * 0.8 * 1.0) = 10.0

    const earnedPoints = (totalPoints * weightWB * structuralResult.score) + 
    (totalPoints * weightBB * bbPassRate);

    // 6. Debugging Log for Terminal
    console.log(`\n--- Internal Grading Debug (Q${question_id}) ---`);
    judge0Result.details.forEach((test: any, index: number) => {
      console.log(
        `Test ${index}: Status: ${test.status?.description || test.status} | Output: [${test.stdout || "EMPTY"}]`,
      );
      if (test.compile_output)
        console.log(`Compile Error: ${test.compile_output}`);
    });
    console.log(`Final Grade: ${earnedPoints.toFixed(2)} / ${totalPoints}`);

    // 7. Return Results
    return res.json({
      structural_analysis: structuralResult,
      test_results: judge0Result.details,
      question_grade: Number(earnedPoints.toFixed(2)),
      max_points: totalPoints,
      weights: { wb: weightWB, bb: weightBB },
    });
  } catch (err: any) {
    console.error("[Run Code Error]", err);
    return res.status(500).json({ error: "Failed to execute: " + err.message });
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
    const result = await SubmissionService.submitAndGrade(
      submissionId,
      studentId,
      examDb,
    );

    return res.json({
      message: "Exam submitted successfully",
      grade: result.final_score,
      status: result.status,
    });
  } catch (err: any) {
    console.error("[Submit Test Error]", err);
    return res.status(500).json({ error: "Failed to submit exam" });
  }
}

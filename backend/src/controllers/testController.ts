import type { Request, Response } from "express";
import { examDb } from "../db/db";
import { SubmissionService } from "../services/submissionService";
import { AdminService } from "../services/adminService";
import { GradingService } from "../services/gradingService";
import { Judge0Service } from "../services/judge0Service";
import { Judge0Result } from "../types/examTypes";
import { StructuralAnalysisService } from "../services/structuralAnalysisService";
import { BoilerplateFactory } from "../services/boilerplateFactory";

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

// GET ALL TESTS (For Admin/Teacher - Filtered by Teacher ID)
export async function getAllTests(req: Request, res: Response) {
  try {
    const user = (req as any).user as AuthUser | undefined;
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    // Φιλτράρουμε με βάση το created_by για να βλέπει ο κάθε καθηγητής μόνο τα δικά του
    const result = await examDb.query(`
      SELECT t.*, 
             (SELECT COUNT(*) FROM exam.test_slots ts WHERE ts.test_id = t.test_id) as slot_count
      FROM exam.tests t 
      WHERE t.created_by = $1
      ORDER BY created_at DESC
    `, [user.user_id]);

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

    const { submissionId, dto } = await SubmissionService.startTestForStudent(
      Number(testId),
      String(user.user_id),
      examDb,
    );

    return res.status(200).json({
      submission_id: submissionId,
      test: dto,
    });
  } catch (err: any) {
    if (err.message?.toLowerCase().includes("submitted")) {
      const existing = await examDb.query(
        `SELECT submission_id 
         FROM exam.submissions 
         WHERE test_id = $1 AND student_id = $2 
         ORDER BY submission_id DESC LIMIT 1`,
        [Number(testId), String(user.user_id)],
      );

      const sid = existing.rows[0]?.submission_id;

      return res.status(409).json({
        error: "ALREADY_SUBMITTED",
        submission_id: sid,
      });
    }

    console.error("[startTest] error:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// 3. CREATE TEST
export async function createTest(req: Request, res: Response) {
  try {
    const user = (req as any).user as AuthUser | undefined;

    if (!user || user.role !== "teacher") {
      return res.status(403).json({ error: "Only teachers can create tests" });
    }

    const dto = req.body;
    dto.created_by = user.user_id;

    const result = await AdminService.createTest(dto);

    return res.status(201).json({
      message: "Test blueprint created successfully",
      test: result,
    });
  } catch (err: any) {
    console.error("[createTest] error:", err);
    return res.status(500).json({ error: "Internal server error: " + err.message });
  }
}

// 5. GET SINGLE TEST BY ID
export async function getTestById(req: Request, res: Response) {
  try {
    const testId = req.params.id;

    const testRes = await examDb.query(
      `SELECT * FROM exam.tests WHERE test_id = $1`,
      [testId],
    );

    if (testRes.rows.length === 0) {
      return res.status(404).json({ error: "Test not found" });
    }

    const slotRes = await examDb.query(
      `SELECT ts.*, t.name as topic_name
       FROM exam.test_slots ts
       LEFT JOIN exam.topics t ON ts.topic_id = t.topic_id
       WHERE ts.test_id = $1
       ORDER BY ts.slot_order ASC`,
      [testId],
    );

    const testData = {
      ...testRes.rows[0],
      slots: slotRes.rows,
    };

    return res.json(testData);
  } catch (err) {
    console.error("[getTestById] Error:", err);
    return res.status(500).json({ error: "Failed to load test blueprint" });
  }
}

// 6. UPDATE TEST CASES
export async function updateQuestionTestCases(req: Request, res: Response) {
  try {
    const { questionId } = req.params;
    const { test_cases } = req.body;

    if (!test_cases || !Array.isArray(test_cases)) {
      return res.status(400).json({ error: "Invalid test_cases format. Must be an array." });
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

// 7. RUN CODE (Hybrid Execution: AST + Judge0) - FIXED VERSION 🚀
export async function runSubmissionCode(req: Request, res: Response) {
  try {
    const submissionId = Number(req.params.id);
    const { question_id, code } = req.body;
    const user = (req as any).user as AuthUser | undefined;
    const studentId = user ? String(user.user_id) : "0";

    console.log(`[testController] Run Code request for Q${question_id}, Sub${submissionId}`);

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

    // 2. Fetch metadata including Boilerplate and Category info
    const qRes = await examDb.query(
      `SELECT 
        q.question_id,
        q.structural_rules, 
        q.weight_wb, 
        q.weight_bb,
        sq.points,
        pq.category,
        pq.function_signature,
        pq.boilerplate_code, 
        pq.test_cases,
        pq.cpu_time_limit,
        pq.memory_limit,
        pq.language_id
      FROM exam.questions q
      JOIN exam.programming_questions pq ON q.question_id = pq.question_id 
      JOIN exam.submission_questions sq ON q.question_id = sq.question_id
      WHERE q.question_id = $1 AND sq.submission_id = $2`,
      [question_id, submissionId],
    );

    const qData = qRes.rows[0];
    if (!qData) return res.status(404).json({ error: "Question metadata not found" });

    // 3. Clean and Stitch Code
    // We use any cast here because cleanStudentCode is private in SubmissionService
    const cleanedCode = (SubmissionService as any).cleanStudentCode(code);
    
    const finalHarness = (qData.boilerplate_code && qData.boilerplate_code.trim().length > 0)
        ? qData.boilerplate_code
        : BoilerplateFactory.createFullHarness(qData.category, qData.function_signature);

    const marker = "// [[STUDENT_CODE_ZONE]]";
    let finalSource = "";

    if (finalHarness.includes(marker)) {
        finalSource = finalHarness.replace(marker, cleanedCode);
    } else {
        console.warn(`[testController] Marker not found for Q${question_id}. Appending code.`);
        finalSource = finalHarness + "\n\n" + cleanedCode;
    }

    // 4. Run Structural Analysis (White Box)
    const structuralResult = await StructuralAnalysisService.analyze(
      code,
      qData.structural_rules || [],
    );

    // 5. Run Judge0 (Black Box)
    const judge0Result = await Judge0Service.runBatch(
      finalSource,
      "cpp",
      qData.test_cases || [],
      qData.cpu_time_limit,
      qData.memory_limit,
    );

    // 6. Calculate Hybrid Grade for "Run Code" feedback
    const totalPoints = Number(qData.points) || 10;
    const weightWB = Number(qData.weight_wb) || 0.2;
    const weightBB = Number(qData.weight_bb) || 0.8;

    const passedTests = judge0Result.details.filter((t: any) => {
      const statusDesc = t.status?.description || t.status;
      return statusDesc === "Accepted" || t.status_id === 3;
    }).length;

    const totalTests = judge0Result.details.length || 1;
    const bbPassRate = passedTests / totalTests;

    const earnedPoints = (totalPoints * weightWB * structuralResult.score) + 
                         (totalPoints * weightBB * bbPassRate);

    // 7. Debug Logging
    console.log(`\n--- Internal Grading Debug (Q${question_id}) ---`);
    console.log(`Stitched Code Length: ${finalSource.length}`);
    judge0Result.details.forEach((test: any, index: number) => {
        console.log(`Test ${index}: ${test.status?.description || test.status} | Output: [${test.stdout || "EMPTY"}]`);
        if (test.compile_output) console.error(`Compile Error: ${test.compile_output}`);
    });

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

// 8. SUBMIT EXAM (Final Submission)
export async function submitTest(req: Request, res: Response) {
  try {
    const submissionId = Number(req.params.id);
    const user = (req as any).user as AuthUser | undefined;

    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const result = await SubmissionService.submitAndGrade(
      submissionId,
      String(user.user_id),
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

// 9. GET STUDENT HISTORY (List of completed tests)
export const getStudentHistory = async (req: Request, res: Response) => {
  try {
    // Παίρνουμε τον χρήστη από το auth middleware (req.user)
    const user = (req as any).user;

    if (!user || !user.user_id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const studentId = String(user.user_id);

    console.log(`[getStudentHistory] Fetching history for student: ${studentId}`);

    /**
     * Χρησιμοποιούμε απευθείας το examDb που είναι imported στην αρχή του αρχείου.
     * Φέρνουμε τα submissions που έχουν ολοκληρωθεί (submitted ή completed).
     */
    const result = await examDb.query(
      `SELECT 
        s.submission_id, 
        COALESCE(t.title, 'Deleted Test') as test_title, 
        s.submitted_at, 
        s.total_grade,
        s.status,
        t.test_id
       FROM exam.submissions s
       LEFT JOIN exam.tests t ON s.test_id = t.test_id
       WHERE s.student_id::text = $1::text AND s.status IN ('submitted', 'completed')
       ORDER BY s.submitted_at DESC`,
      [studentId]
    );

    return res.status(200).json(result.rows);
  } catch (error: any) {
    console.error("Fetch History Error:", error.message);
    return res.status(500).json({ 
      error: "Failed to load exam history",
      details: error.message 
    });
  }
};
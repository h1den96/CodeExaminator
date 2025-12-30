// src/controllers/testController.ts
import type { Request, Response } from "express";
import { examDb } from "../db/db";
import { SubmissionService } from "../services/submissionService";
import { AdminService } from "../services/adminService";

type AuthUser = { user_id: number; role: string };

// 1. GET AVAILABLE TESTS
export async function getAvailableTests(req: Request, res: Response) {
  try {
    const user = (req as any).user as AuthUser | undefined;
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    // FIX: Call SubmissionService instead of testService
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
    const testId = Number(req.query.test_id);

    if (!Number.isInteger(testId) || testId <= 0) {
      return res.status(400).json({ error: "Invalid test_id" });
    }

    const user = (req as any).user as AuthUser | undefined;
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    // FIX: Call SubmissionService instead of testService
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
    if (err.message?.includes("not found")) {
      return res.status(404).json({ error: err.message });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
}

// DELETED: submitAnswer (Use submissionController.saveAnswers instead)
// DELETED: submitTest   (Use submissionController.submitSubmission instead)

export async function createTest(req: Request, res: Response) {
  try {
    const user = (req as any).user as AuthUser | undefined;
    
    // Safety check: Ensure only teachers can hit this
    // (Middleware should catch this, but double-check is good practice)
    if (!user || user.role !== 'teacher') {
      return res.status(403).json({ error: "Only teachers can create tests" });
    }

    const dto = req.body;
    
    // Attach the creator ID from the token
    dto.created_by = user.user_id;

    // Call the AdminService to write to DB
    const result = await AdminService.createTest(dto);
    
    return res.status(201).json({ message: "Test created successfully", test: result });

  } catch (err: any) {
    console.error("[createTest] error:", err);
    
    // Handle specific logic errors (like Math mismatch)
    if (err.message?.includes("Math Error")) {
      return res.status(400).json({ error: err.message });
    }
    
    return res.status(500).json({ error: "Internal server error" });
  }
}
// src/controllers/testController.ts
import type { Request, Response } from "express";
import { examDb } from "../db/db";
import {
  startTestForStudent,
  submitAnswersForSubmission,
  AnswersPayload,
  getAvailableTestsForStudent,
} from "../services/testService";
import { SubmitAnswerDto } from "../dto/SubmitAnswerDTO"
import * as testService from "../services/testService";

type AuthUser = { user_id: number; role: string };

export async function getAvailableTests(req: Request, res: Response) {
  try {
    const user = (req as any).user as AuthUser | undefined;

    if (!user) {
      return res
        .status(401)
        .json({ error: "Unauthorized (no user in req)" });
    }

    const studentId = user.user_id;

    const tests = await getAvailableTestsForStudent(studentId, examDb);

    return res.status(200).json(tests);
  } catch (err: any) {
    console.error("[getAvailableTests controller] error:", err);
    return res
      .status(500)
      .json({ error: "Failed to load available tests" });
  }
}

export async function startTest(req: Request, res: Response) {
  try {
    const raw = req.query.test_id;
    const testId = Number(raw);

    if (!Number.isInteger(testId) || testId <= 0) {
      return res.status(400).json({ error: "Invalid or missing test_id" });
    }

    const user = (req as any).user as AuthUser | undefined;
    if (!user) {
      return res.status(401).json({ error: "Unauthorized (no user in req)" });
    }

    const studentId = String(user.user_id);

    const { submissionId, dto } = await startTestForStudent(
      testId,
      studentId,
      examDb
    );

    return res.status(200).json({
      submission_id: submissionId,
      test: dto,
    });
  } catch (err: any) {
    console.error("[startTest controller] error:", err);
    if (err.message?.includes("not found")) {
      return res.status(404).json({ error: err.message });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function submitTest(req: Request, res: Response) {
  const user = (req as any).user as AuthUser | undefined;

  if (!user) {
    return res
      .status(401)
      .json({ error: "Unauthorized (no user in req)" });
  }

  const { submission_id, answers } = req.body as {
    submission_id?: number;
    answers?: AnswersPayload;
  };

  if (!Number.isInteger(submission_id) || submission_id! <= 0) {
    return res.status(400).json({
      error: "submission_id is required and must be a positive integer",
    });
  }

  if (!answers || typeof answers !== "object") {
    return res.status(400).json({ error: "answers object is required" });
  }

  const studentId = String(user.user_id);

  try {
    await submitAnswersForSubmission(
      submission_id!,
      studentId,
      answers,
      examDb
    );

    return res.json({
      ok: true,
      submission_id,
    });
  } catch (err: any) {
    console.error("[submitTest controller] error:", err);

    if (err.message === "submission_not_found") {
      return res.status(404).json({ error: "Submission not found" });
    }
    if (err.message === "submission_not_owned") {
      return res
        .status(403)
        .json({ error: "Submission does not belong to this student" });
    }
    if (err.message === "no_submission_questions") {
      return res.status(409).json({
        error: "Submission has no questions attached (invalid state)",
      });
    }

    return res.status(500).json({ error: "Failed to submit test" });
  }
}


export const submitAnswer = async (req: Request, res: Response) => {
  try {
    // 1. Λήψη παραμέτρων από URL και Auth
    const submissionId = parseInt(req.params.submissionId);
    
    // Υποθέτουμε ότι έχεις middleware που βάζει τον user στο req (π.χ. req.user ή res.locals)
    // Αν το id του φοιτητή είναι string στη βάση, το κρατάμε string.
    // Προσαρμοσε το ανάλογα με το Auth middleware σου:
    const studentId = (req as any).user?.id || "4"; // TODO: Replace "4" with real auth id

    // 2. Λήψη δεδομένων από το Body
    const answerDto: SubmitAnswerDto = req.body;

    // Basic Validation
    if (!submissionId || !answerDto.question_id) {
      return res.status(400).json({ error: "Missing submission ID or question ID" });
    }

    // 3. Κλήση του Service
    await testService.saveSingleAnswer(
      submissionId,
      studentId,
      answerDto,
      examDb
    );

    // 4. Απάντηση επιτυχίας (200 OK)
    return res.status(200).json({ message: "Answer saved successfully" });

  } catch (error: any) {
    console.error("Submit Answer Error:", error);
    
    // Διαχείριση λαθών που πετάει το Service
    if (error.message === "Submission not found or not active") {
      return res.status(404).json({ error: error.message });
    }
    if (error.message === "Question not found in this submission") {
      return res.status(400).json({ error: error.message });
    }

    return res.status(500).json({ error: "Internal Server Error" });
  }
};
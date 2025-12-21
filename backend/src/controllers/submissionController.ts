// src/controllers/submissionController.ts
import { Request, Response } from "express";
import { SubmitAnswerDto } from "../dto/SubmitAnswerDTO";
import * as testService from "../services/testService";

// Helper για να παίρνουμε τη βάση
const getDb = (req: Request) => (req as any).db;

// 1. SAVE ANSWERS (Autosave)
export const saveAnswers = async (req: Request, res: Response) => {
  try {
    const submissionId = Number(req.params.id);
    const dto: SubmitAnswerDto = req.body;

    const user = (req as any).user;
    if (!user || !user.user_id) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const studentId = String(user.user_id);

    if (!submissionId || !dto.question_id) {
      return res.status(400).json({ error: "Missing submission ID or question ID" });
    }

    const db = getDb(req);
    await testService.saveSingleAnswer(submissionId, studentId, dto, db);

    return res.status(200).json({ message: "Answer saved successfully" });

  } catch (error: any) {
    console.error("Save Answer Error:", error.message);
    if (error.message === "Submission not found or not active") {
      return res.status(404).json({ error: "Submission mismatch (Check Student ID)" });
    }
    if (error.message === "Question not found in this submission") {
      return res.status(400).json({ error: "Question ID mismatch" });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
};

// 2. SUBMIT EXAM (Final Submit)
export const submitSubmission = async (req: Request, res: Response) => {
  try {
    const submissionId = Number(req.params.id);
    
    const user = (req as any).user;
    if (!user || !user.user_id) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const studentId = String(user.user_id);

    const db = getDb(req);

    // Κλήση της συνάρτησης που προσθέσαμε στο Step 1
    const result = await testService.submitAndGrade(submissionId, studentId, db);

    return res.status(200).json({ 
      message: "Exam submitted successfully", 
      result 
    });

  } catch (error: any) {
    console.error("Submit Error:", error.message);
    if (error.message === "submission_not_found") {
      return res.status(404).json({ error: "Submission not found" });
    }
    if (error.message === "already_submitted") {
      return res.status(409).json({ error: "Exam is already submitted" });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
};

// 3. GET SUBMISSION (Optional placeholder)
export const getSubmission = async (req: Request, res: Response) => {
   res.status(501).json({ error: "Not implemented yet" });
};
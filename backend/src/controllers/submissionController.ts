// src/controllers/submissionController.ts
import { Request, Response } from "express";
// CHECK: Ensure this filename matches what you created earlier (examDTO.ts or examTypes.ts)
import { SubmitAnswerDto } from "../types/examTypes"; 
import { SubmissionService } from "../services/submissionService";
import { CodeExecutionService } from "../services/codeExecutionService";

// Helper to get the DB pool from the request (injected via middleware)
const getDb = (req: Request) => (req as any).db;

// 1. SAVE ANSWERS (Autosave for MCQs/Text)
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

    await SubmissionService.saveSingleAnswer(submissionId, studentId, dto, db);

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

// 2. SUBMIT EXAM (Final Submit / Finish Test)
export const submitSubmission = async (req: Request, res: Response) => {
  try {
    const submissionId = Number(req.params.id);
    
    const user = (req as any).user;
    if (!user || !user.user_id) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const studentId = String(user.user_id);

    const db = getDb(req);

    const result = await SubmissionService.submitAndGrade(submissionId, studentId, db);

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

// 3. RUN CODE (Judge0 / Docker)
// src/controllers/submissionController.ts

// src/controllers/submissionController.ts

export const submitCode = async (req: Request, res: Response) => {
    try {
        let { submissionQuestionId, submission_id, question_id, code } = req.body;

        if (!code) return res.status(400).json({ error: "Missing code" });

        const db = getDb(req);

        console.log("📥 Controller Received:", { submissionQuestionId, submission_id, question_id });

        // SAFEGUARD: If the frontend sends submissionQuestionId same as question_id, it's the bug.
        // We force a lookup in that case.
        if (String(submissionQuestionId) === String(question_id)) {
            console.warn("⚠️ Detected ID mismatch bug. Ignoring submissionQuestionId and forcing lookup.");
            submissionQuestionId = null;
        }

        // LOOKUP LOGIC
        if (!submissionQuestionId && submission_id && question_id) {
            const lookup = await db.query(
                `SELECT submission_question_id 
                 FROM exam.submission_questions 
                 WHERE submission_id = $1 AND question_id = $2`,
                [submission_id, question_id]
            );

            if (lookup.rows.length === 0) {
                 return res.status(404).json({ error: "Question link not found for this submission" });
            }

            submissionQuestionId = lookup.rows[0].submission_question_id;
            console.log("✅ Lookup Success! Real SQ_ID is:", submissionQuestionId);
        }

        if (!submissionQuestionId) {
             return res.status(400).json({ error: "Missing submissionQuestionId or (submission_id + question_id)" });
        }

        // Execute
        const result = await CodeExecutionService.executeAndGrade(
            Number(submissionQuestionId), 
            code, 
            db
        );
        
        res.json({
            success: true,
            grade: result.question_grade,
            details: result.details
        });

    } catch (error: any) {
        console.error("Code Execution Error:", error);
        res.status(500).json({ 
            error: error.message || "Internal Server Error",
            details: error.response?.data || "No details available"
        });
    }
};

// 4. GET SUBMISSION (Optional placeholder)
export const getSubmission = async (req: Request, res: Response) => {
   res.status(501).json({ error: "Not implemented yet" });
};

// src/controllers/submissionController.ts

export const getSubmissionResult = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    // 🚀 FIX: Use your helper function instead of the undefined 'examDb'
    const db = getDb(req); 

    console.log(`[getSubmissionResult] Fetching result for sub: ${id}, user: ${user?.user_id}`);

    if (!user || !user.user_id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const result = await SubmissionService.getSubmissionResult(
      Number(id),
      String(user.user_id),
      db
    );

    res.json(result);
  } catch (error: any) {
    console.error("DETAILED DATABASE ERROR:", error.message);
    res.status(500).json({ 
      error: "DATABASE_QUERY_FAILED", 
      message: error.message 
    });
  }
};
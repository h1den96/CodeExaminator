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
      return res
        .status(400)
        .json({ error: "Missing submission ID or question ID" });
    }

    const db = getDb(req);

    await SubmissionService.saveSingleAnswer(submissionId, studentId, dto, db);

    return res.status(200).json({ message: "Answer saved successfully" });
  } catch (error: any) {
    console.error("Save Answer Error:", error.message);
    if (error.message === "Submission not found or not active") {
      return res
        .status(404)
        .json({ error: "Submission mismatch (Check Student ID)" });
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

    const result = await SubmissionService.submitAndGrade(
      submissionId,
      studentId,
      db,
    );

    return res.status(200).json({
      message: "Exam submitted successfully",
      result,
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

    console.log("📥 Controller Received:", {
      submissionQuestionId,
      submission_id,
      question_id,
    });

    // SAFEGUARD: If the frontend sends submissionQuestionId same as question_id, it's the bug.
    // We force a lookup in that case.
    if (String(submissionQuestionId) === String(question_id)) {
      console.warn(
        "⚠️ Detected ID mismatch bug. Ignoring submissionQuestionId and forcing lookup.",
      );
      submissionQuestionId = null;
    }

    // LOOKUP LOGIC
    if (!submissionQuestionId && submission_id && question_id) {
      const lookup = await db.query(
        `SELECT submission_question_id 
                 FROM exam.submission_questions 
                 WHERE submission_id = $1 AND question_id = $2`,
        [submission_id, question_id],
      );

      if (lookup.rows.length === 0) {
        return res
          .status(404)
          .json({ error: "Question link not found for this submission" });
      }

      submissionQuestionId = lookup.rows[0].submission_question_id;
      console.log("✅ Lookup Success! Real SQ_ID is:", submissionQuestionId);
    }

    if (!submissionQuestionId) {
      return res
        .status(400)
        .json({
          error:
            "Missing submissionQuestionId or (submission_id + question_id)",
        });
    }

    // Execute
    const result = await CodeExecutionService.executeAndGrade(
      Number(submissionQuestionId),
      code,
      db,
    );

    res.json({
      success: true,
      question_grade: result.question_grade, // Frontend looks for 'question_grade'
      test_results: result.details || [],    // Frontend looks for 'test_results'
    });
  } catch (error: any) {
    console.error("Code Execution Error:", error);
    res.status(500).json({
      error: error.message || "Internal Server Error",
      details: error.response?.data || "No details available",
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

    const db = getDb(req);

    console.log(
      `[getSubmissionResult] Fetching result for sub: ${id}, user: ${user?.user_id}, role: ${user?.role}`,
    );

    if (!user || !user.user_id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // 💡 THE FIX: If the user is a teacher, we pass 'null' or a bypass flag 
    // to the service so it skips the student_id check.
    const studentIdToVerify = user.role === "teacher" ? "TEACHER_BYPASS" : String(user.user_id);

    // Call the service (Note: We might need to slightly update the service next)
    const result = await SubmissionService.getSubmissionResult(
      Number(id),
      studentIdToVerify, 
      db,
    );

    res.json(result);
  } catch (error: any) {
    console.error("DETAILED DATABASE ERROR:", error.message);
    
    if (error.message.includes("not found")) {
      return res.status(404).json({ error: "Report not found or access denied." });
    }

    res.status(500).json({
      error: "DATABASE_QUERY_FAILED",
      message: error.message,
    });
  }
};

// 1. Function to update the TOTAL grade (from the yellow panel)
export const overrideTotalGrade = async (req: any, res: any) => {
  const { id } = req.params;
  const { newGrade } = req.body;
  
  // Note: Adjust the db connection logic based on how your app handles the database pool
  const client = await req.db.connect(); 
  
  try {
    await client.query(
      "UPDATE exam.submissions SET total_grade = $1, status = 'completed' WHERE submission_id = $2",
      [newGrade, id]
    );
    
    console.log(`[OVERRIDE] Total grade manually set to ${newGrade} for submission ${id}`);
    res.json({ message: "Total grade updated successfully", newTotal: newGrade });
  } catch (err) {
    console.error("Total override error:", err);
    res.status(500).json({ error: "Failed to override total grade" });
  } finally {
    client.release();
  }
};

// 2. Function to update a SPECIFIC QUESTION'S grade and recalculate the total
export const overrideQuestionGrade = async (req: any, res: any) => {
  const { id: submissionId, answerId } = req.params;
  const { newQuestionGrade } = req.body;
  
  const client = await req.db.connect();
  
  try {
    await client.query("BEGIN");

    // A. Update the specific question's grade
    await client.query(
      "UPDATE exam.student_answers SET question_grade = $1 WHERE answer_id = $2",
      [newQuestionGrade, answerId]
    );

    // B. Recalculate the new total score for this submission
    const totalQuery = `
      SELECT SUM(question_grade) as total 
      FROM exam.student_answers sa
      JOIN exam.submission_questions sq ON sa.submission_question_id = sq.submission_question_id
      WHERE sq.submission_id = $1
    `;
    const { rows } = await client.query(totalQuery, [submissionId]);
    const newTotal = rows[0].total || 0;

    // C. Update the submissions table with the new total
    await client.query(
      "UPDATE exam.submissions SET total_grade = $1 WHERE submission_id = $2",
      [newTotal, submissionId]
    );

    await client.query("COMMIT");
    console.log(`[OVERRIDE] Question ${answerId} set to ${newQuestionGrade}. New total: ${newTotal}`);
    
    res.json({ message: "Question grade updated successfully", newTotal });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Question override error:", err);
    res.status(500).json({ error: "Failed to override question grade" });
  } finally {
    client.release();
  }
};
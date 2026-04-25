// src/controllers/submissionController.ts
import { Request, Response } from "express";
import { Pool } from "pg";
import { SubmitAnswerDto } from "../types/examTypes";
import { SubmissionService } from "../services/submissionService";
import { CodeExecutionService } from "../services/codeExecutionService";

/**
 * Επεκτείνουμε το Request της Express για να αναγνωρίζει το TypeScript 
 * το db pool και το user object που περνάνε από τα middleware.
 */
interface ExtendedRequest extends Request {
  db: Pool;
  user?: {
    user_id: number;
    role: string;
  };
}

// Helper για λήψη του DB pool με σωστό typing
const getDb = (req: ExtendedRequest): Pool => req.db || (req as any).db;

// 1. SAVE ANSWERS (Autosave για MCQ/TF/Text)
export const saveAnswers = async (req: Request, res: Response) => {
  const ereq = req as ExtendedRequest;
  try {
    const submissionId = Number(ereq.params.id);
    const dto: SubmitAnswerDto = ereq.body;

    const user = ereq.user;
    if (!user || !user.user_id) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const studentId = String(user.user_id);

    if (!submissionId || !dto.question_id) {
      return res
        .status(400)
        .json({ error: "Missing submission ID or question ID" });
    }

    const db = getDb(ereq);
    await SubmissionService.saveSingleAnswer(submissionId, studentId, dto, db);

    return res.status(200).json({ message: "Answer saved successfully" });
  } catch (error: any) {
    console.error("Save Answer Error:", error.message);
    if (error.message === "Submission not found or not active") {
      return res.status(404).json({ error: "Submission mismatch (Check Student ID)" });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
};

// 2. SUBMIT EXAM (Οριστική Υποβολή & Αυτόματη Βαθμολόγηση)
export const submitSubmission = async (req: Request, res: Response) => {
  const ereq = req as ExtendedRequest;
  try {
    const submissionId = Number(ereq.params.id);
    const user = ereq.user;

    if (!user || !user.user_id) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const studentId = String(user.user_id);
    const db = getDb(ereq);

    const result = await SubmissionService.submitAndGrade(submissionId, studentId, db);

    return res.status(200).json({
      message: "Exam submitted successfully",
      result,
    });
  } catch (error: any) {
    console.error("Submit Error:", error.message);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
};

// 3. SUBMIT CODE (Εκτέλεση μέσω Judge0)
export const submitCode = async (req: Request, res: Response) => {
  const ereq = req as ExtendedRequest;
  try {
    let { submissionQuestionId, submission_id, question_id, code } = ereq.body;

    if (!code) return res.status(400).json({ error: "Missing code" });

    const db = getDb(ereq);

    // Safeguard για ID mismatch
    if (String(submissionQuestionId) === String(question_id)) {
      console.warn("⚠️ Detected ID mismatch bug. Forcing lookup.");
      submissionQuestionId = null;
    }

    // Lookup αν λείπει το SQ_ID
    if (!submissionQuestionId && submission_id && question_id) {
      const lookup = await db.query(
        `SELECT submission_question_id FROM exam.submission_questions 
         WHERE submission_id = $1 AND question_id = $2`,
        [submission_id, question_id]
      );

      if (lookup.rows.length === 0) {
        return res.status(404).json({ error: "Question link not found" });
      }
      submissionQuestionId = lookup.rows[0].submission_question_id;
    }

    const result = await CodeExecutionService.executeAndGrade(Number(submissionQuestionId), code, db);

    res.json({
      success: true,
      question_grade: result.question_grade,
      test_results: result.details || [],
    });
  } catch (error: any) {
    console.error("Code Execution Error:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
};

// 4. GET SUBMISSION RESULT (Αποτελέσματα για Μαθητή/Καθηγητή)
export const getSubmissionResult = async (req: Request, res: Response) => {
  const ereq = req as ExtendedRequest;
  try {
    const { id } = ereq.params;
    const user = ereq.user;
    const db = getDb(ereq);

    if (!user || !user.user_id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const studentIdToVerify = user.role === "teacher" ? "TEACHER_BYPASS" : String(user.user_id);
    const result = await SubmissionService.getSubmissionResult(Number(id), studentIdToVerify, db);

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: "DATABASE_QUERY_FAILED", message: error.message });
  }
};

// 5. OVERRIDE TOTAL GRADE (Manual αλλαγή συνολικού βαθμού)
export const overrideTotalGrade = async (req: Request, res: Response) => {
  const ereq = req as ExtendedRequest;
  const { id } = ereq.params;
  const { newGrade } = ereq.body;
  
  const db = getDb(ereq);
  const client = await db.connect(); 
  
  try {
    await client.query(
      "UPDATE exam.submissions SET total_grade = $1, status = 'completed' WHERE submission_id = $2",
      [newGrade, id]
    );
    res.json({ message: "Total grade updated successfully", newTotal: newGrade });
  } catch (err) {
    res.status(500).json({ error: "Failed to override total grade" });
  } finally {
    client.release();
  }
};

// 6. OVERRIDE QUESTION GRADE (Manual αλλαγή βαθμού ερώτησης & recalculate total)
export const overrideQuestionGrade = async (req: Request, res: Response) => {
  const ereq = req as ExtendedRequest;
  const { id: submissionId, answerId } = ereq.params;
  const { newQuestionGrade } = ereq.body;
  
  const db = getDb(ereq);
  const client = await db.connect();
  
  try {
    await client.query("BEGIN");

    await client.query(
      "UPDATE exam.student_answers SET question_grade = $1, is_manually_graded = true WHERE answer_id = $2",
      [newQuestionGrade, answerId]
    );

    const { rows } = await client.query(
      `SELECT SUM(question_grade) as total FROM exam.student_answers sa
       JOIN exam.submission_questions sq ON sa.submission_question_id = sq.submission_question_id
       WHERE sq.submission_id = $1`, 
      [submissionId]
    );
    const newTotal = rows[0].total || 0;

    await client.query(
      "UPDATE exam.submissions SET total_grade = $1 WHERE submission_id = $2",
      [newTotal, submissionId]
    );

    await client.query("COMMIT");
    res.json({ message: "Question grade updated successfully", newTotal });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: "Failed to override question grade" });
  } finally {
    client.release();
  }
};

// 7. BULK MANUAL GRADES (Μαζική βαθμολόγηση από καθηγητή)
export const submitBulkManualGrades = async (req: Request, res: Response) => {
  const ereq = req as ExtendedRequest;
  const { id: submissionId } = ereq.params;
  const { grades } = ereq.body; 

  try {
    const db = getDb(ereq); // Την παίρνουμε σωστά εδώ
    const result = await SubmissionService.manuallyGradeEntireSubmission(
      Number(submissionId),
      grades,
      db // Την περνάμε καθαρά εδώ
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Placeholder
export const getSubmission = async (req: Request, res: Response) => {
  res.status(501).json({ error: "Not implemented yet" });
};
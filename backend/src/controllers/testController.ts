import type { Request, Response } from "express";
import { examDb } from "../db/db";
import { SubmissionService } from "../services/submissionService";
import { AdminService } from "../services/adminService";
import { GradingService } from "../services/gradingService";
import { Judge0Service } from "../services/judge0Service";
import { Judge0Result } from "../types/examTypes";
import { StructuralAnalysisService } from "../services/structuralAnalysisService";
import { BoilerplateFactory } from "../services/boilerplateFactory";
import { CodeExecutionService } from "../services/codeExecutionService";

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
      [testId]
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
      [testId]
    );

    const questionRes = await examDb.query(
      `SELECT
          q.question_id,
          q.question_type,
          q.body AS text,
          tq.points,
          pq.test_cases,
          tf.correct_answer
       FROM exam.test_questions tq
       JOIN exam.questions q ON q.question_id = tq.question_id
       LEFT JOIN exam.programming_questions pq ON pq.question_id = q.question_id
       LEFT JOIN exam.true_false_answers tf ON tf.question_id = q.question_id
       WHERE tq.test_id = $1
       ORDER BY tq.position ASC`,
      [testId]
    );

    let questions = questionRes.rows;
    let isPoolPreview = false;

    // Random/slot-based tests never populate exam.test_questions - the real
    // question set only gets resolved per-student at startTest time. Fall
    // back to showing the eligible pool for each slot, using the exact same
    // matching criteria as SubmissionService.startTestForStudent's drawQuery.
    if (questions.length === 0 && slotRes.rows.length > 0) {
      isPoolPreview = true;

      const poolRes = await examDb.query(
        `SELECT
            s.slot_id,
            s.slot_order,
            s.question_type,
            s.difficulty,
            s.topic_id,
            top.name AS topic_name,
            s.category AS slot_category,
            s.points,
            q.question_id,
            q.body AS text,
            pq.test_cases,
            tf.correct_answer
         FROM exam.test_slots s
         LEFT JOIN exam.topics top ON top.topic_id = s.topic_id
         JOIN exam.questions q
           ON q.difficulty = s.difficulty
          AND q.question_type = s.question_type
         JOIN exam.question_topics qt
           ON qt.question_id = q.question_id
          AND qt.topic_id = s.topic_id
         LEFT JOIN exam.programming_questions pq ON pq.question_id = q.question_id
         LEFT JOIN exam.true_false_answers tf ON tf.question_id = q.question_id
         WHERE s.test_id = $1
           AND (s.category = 'ANY' OR pq.category = s.category OR s.question_type != 'programming')
         ORDER BY s.slot_order ASC, q.question_id ASC`,
        [testId]
      );

      questions = poolRes.rows;

      const mcqIds = [...new Set(questions.filter((q: any) => q.question_type === "mcq").map((q: any) => q.question_id))];
      if (mcqIds.length > 0) {
        const optRes = await examDb.query(
          `SELECT question_id, option_text AS text, is_correct
           FROM exam.mcq_options
           WHERE question_id = ANY($1::int[])
           ORDER BY option_id ASC`,
          [mcqIds]
        );
        const optionsByQuestion = new Map<number, any[]>();
        for (const opt of optRes.rows) {
          const list = optionsByQuestion.get(opt.question_id) || [];
          list.push({ text: opt.text, is_correct: opt.is_correct });
          optionsByQuestion.set(opt.question_id, list);
        }
        for (const q of questions) {
          if (q.question_type === "mcq") q.options = optionsByQuestion.get(q.question_id) || [];
        }
      }
    } else {
      const mcqQuestions = questions.filter((q: any) => q.question_type === "mcq");
      if (mcqQuestions.length > 0) {
        const optRes = await examDb.query(
          `SELECT question_id, option_text AS text, is_correct
           FROM exam.mcq_options
           WHERE question_id = ANY($1::int[])
           ORDER BY option_id ASC`,
          [mcqQuestions.map((q: any) => q.question_id)]
        );
        const optionsByQuestion = new Map<number, any[]>();
        for (const opt of optRes.rows) {
          const list = optionsByQuestion.get(opt.question_id) || [];
          list.push({ text: opt.text, is_correct: opt.is_correct });
          optionsByQuestion.set(opt.question_id, list);
        }
        for (const q of mcqQuestions) {
          q.options = optionsByQuestion.get(q.question_id) || [];
        }
      }
    }

    const subRes = await examDb.query(
      `SELECT 
          submission_id, 
          student_id, 
          status, 
          started_at, 
          submitted_at, 
          total_grade
       FROM exam.submissions
       WHERE test_id = $1
       ORDER BY submitted_at DESC NULLS LAST`,
      [testId]
    );

    const testData = {
      ...testRes.rows[0],
      questions,
      is_pool_preview: isPoolPreview,
      slots: slotRes.rows,
      submissions: subRes.rows,
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

// 7. RUN CODE (Delegates cleanly to our updated CodeExecutionService) 🚀
export async function runSubmissionCode(req: Request, res: Response) {
  try {
    const submissionId = Number(req.params.id);
    const { question_id, code } = req.body;
    const user = (req as any).user as AuthUser | undefined;

    console.log(`[testController] Run Code request for Q${question_id}, Sub${submissionId}`);

    const sqRes = await examDb.query(
      `SELECT submission_question_id 
       FROM exam.submission_questions 
       WHERE submission_id = $1 AND question_id = $2`,
      [submissionId, question_id]
    );

    if (sqRes.rows.length === 0) {
      return res.status(404).json({ error: "Submission question matching profile not found." });
    }

    const targetSubmissionQuestionId = sqRes.rows[0].submission_question_id;

    const gradingPackage = await CodeExecutionService.executeAndGrade(
      targetSubmissionQuestionId,
      code,
      examDb as any
    );

    const hasCompileError = Array.isArray(gradingPackage.details) && gradingPackage.details.some(
      (detail: any) => detail.status === "Compilation Error"
    );

    const securityViolation = Array.isArray(gradingPackage.details) && gradingPackage.details.some(
      (detail: any) => detail.status === "Security Violation"
    );

    return res.json({
      status: securityViolation ? "Security Violation" : (hasCompileError ? "Compilation Error" : "Success"),
      structural_analysis: {
        score: securityViolation ? 0 : 1,
        details: gradingPackage.details?.[0]?.status === "Security Violation" ? [] : (gradingPackage as any).structural_analysis || []
      },
      test_results: gradingPackage.details || [],
      question_grade: gradingPackage.question_grade,
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
      status: (result as any).status,
    });
  } catch (err: any) {
    console.error("[Submit Test Error]", err);
    return res.status(500).json({ error: "Failed to submit exam" });
  }
}

// 9. GET STUDENT HISTORY (List of completed tests)
export const getStudentHistory = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.user_id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const studentId = String(user.user_id);
    console.log(`[getStudentHistory] Fetching history for student: ${studentId}`);

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

// 10. TOGGLE PUBLISH STATUS
export async function togglePublishStatus(req: Request, res: Response) {
  try {
    const testId = req.params.id;
    const { is_published } = req.body;

    const result = await examDb.query(
      `UPDATE exam.tests 
       SET is_published = $1 
       WHERE test_id = $2 
       RETURNING *`,
      [is_published, testId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Test not found" });
    }

    return res.json({ message: "Status updated", test: result.rows[0] });
  } catch (err) {
    console.error("[togglePublishStatus] Error:", err);
    return res.status(500).json({ error: "Failed to update publish status" });
  }
}
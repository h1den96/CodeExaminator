import { Request, Response } from "express";
import { Pool } from "pg";

interface ExtendedRequest extends Request {
  db: Pool;
  user?: { user_id: number; role: string };
}

const getDb = (req: ExtendedRequest): Pool => req.db || (req as any).db;

export async function getTeacherTests(req: Request, res: Response) {
  const ereq = req as ExtendedRequest;
  try {
    const user = ereq.user;
    if (!user || user.role !== "teacher") {
      return res.status(403).json({ error: "Access denied. Teachers only." });
    }

    const db = getDb(ereq);
    const query = `
      SELECT t.test_id, t.title, t.is_published, t.created_at,
             COUNT(DISTINCT s.submission_id) AS total_submissions
      FROM exam.tests t
      LEFT JOIN exam.submissions s ON t.test_id = s.test_id
      WHERE t.created_by = $1
      GROUP BY t.test_id, t.title, t.is_published, t.created_at
      ORDER BY t.created_at DESC;
    `;
    const result = await db.query(query, [user.user_id]);
    return res.json(result.rows);
  } catch (err: any) {
    console.error("[getTeacherTests] Error:", err);
    return res.status(500).json({ error: "Failed to load tests" });
  }
}

export async function getTestSubmissions(req: Request, res: Response) {
  const ereq = req as ExtendedRequest;
  try {
    const { testId } = ereq.params;
    const user = ereq.user;
    if (!user || user.role !== "teacher") {
      return res.status(403).json({ error: "Access denied" });
    }

    const db = getDb(ereq);
    const query = `
      SELECT 
        s.submission_id, 
        s.student_id, 
        COALESCE(st.first_name, u.full_name, s.student_id) AS first_name, 
        COALESCE(st.last_name, '') AS last_name, 
        s.submitted_at, 
        s.total_grade, 
        s.status
      FROM exam.submissions s
      LEFT JOIN exam.students st ON s.student_id = st.student_id::text
      LEFT JOIN auth.users u ON s.student_id = u.user_id::text
      WHERE s.test_id = $1
      ORDER BY s.submitted_at DESC NULLS LAST;
    `;
    const result = await db.query(query, [testId]);
    return res.json(result.rows);
  } catch (err: any) {
    console.error("[getTestSubmissions] Error:", err);
    return res.status(500).json({ error: "Failed to load submissions" });
  }
}

export async function getSubmissionDetails(req: Request, res: Response) {
  const ereq = req as ExtendedRequest;
  try {
    const { submissionId } = ereq.params;
    const user = ereq.user;
    if (!user || user.role !== "teacher") {
      return res.status(403).json({ error: "Access denied" });
    }

    const db = getDb(ereq);

    const subQuery = `SELECT * FROM exam.submissions WHERE submission_id = $1`;
    const subResult = await db.query(subQuery, [submissionId]);
    if (subResult.rows.length === 0) {
      return res.status(404).json({ error: "Submission not found" });
    }
    const submission = subResult.rows[0];

    const questionsQuery = `
      SELECT 
        sq.question_id, 
        q.title, 
        q.body AS question_body, 
        q.question_type, 
        10 AS max_points,
        sa.answer_id, 
        sa.code_answer, 
        sa.question_grade AS auto_grade,
        pq.reference_solution,
        pq.function_signature,
        tr.review_id, 
        tr.commentary, 
        tr.highlighted_data, 
        tr.score_override
      FROM exam.submission_questions sq
      JOIN exam.questions q ON sq.question_id = q.question_id
      LEFT JOIN exam.student_answers sa ON sa.submission_question_id = sq.submission_question_id
      LEFT JOIN exam.programming_questions pq ON pq.question_id = q.question_id
      LEFT JOIN exam.teacher_reviews tr ON tr.submission_id = $1 AND tr.question_id = sq.question_id
      WHERE sq.submission_id = $1;
    `;
    const questionsResult = await db.query(questionsQuery, [Number(submissionId)]);

    return res.json({
      submission,
      questions: questionsResult.rows,
    });
  } catch (err: any) {
    console.error("[getSubmissionDetails] Error Details:", err.message, err.stack);
    return res.status(500).json({ error: "Failed to load submission details", details: err.message });
  }
}

export async function saveTeacherReview(req: Request, res: Response) {
  const ereq = req as ExtendedRequest;
  try {
    const user = ereq.user;
    if (!user || user.role !== "teacher") {
      return res.status(403).json({ error: "Access denied" });
    }

    const { submissionId, questionId, commentary, highlightedData, scoreOverride } = ereq.body;

    if (!submissionId || !questionId) {
      return res.status(400).json({ error: "submissionId and questionId are required" });
    }

    const db = getDb(ereq);

    const client = await db.connect();
    try {
      await client.query("BEGIN");

      const reviewQuery = `
        INSERT INTO exam.teacher_reviews 
          (submission_id, question_id, teacher_id, commentary, highlighted_data, score_override, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
        ON CONFLICT (submission_id, question_id)
        DO UPDATE SET 
            commentary = EXCLUDED.commentary,
            highlighted_data = EXCLUDED.highlighted_data,
            score_override = EXCLUDED.score_override,
            updated_at = NOW()
        RETURNING *;
      `;
      const reviewRes = await client.query(reviewQuery, [
        submissionId,
        questionId,
        String(user.user_id),
        commentary,
        highlightedData ? JSON.stringify(highlightedData) : null,
        scoreOverride !== "" && scoreOverride != null ? Number(scoreOverride) : null,
      ]);

      if (scoreOverride !== "" && scoreOverride != null) {
        await client.query(
          `UPDATE exam.student_answers sa
           SET question_grade = $1
           FROM exam.submission_questions sq
           WHERE sa.submission_question_id = sq.submission_question_id 
             AND sq.submission_id = $2 
             AND sq.question_id = $3`,
          [Number(scoreOverride), submissionId, questionId]
        );

        const totalRes = await client.query(
          `SELECT COALESCE(SUM(sa.question_grade), 0) as earned, COALESCE(SUM(sq.points), 1) as possible
           FROM exam.submission_questions sq
           LEFT JOIN exam.student_answers sa ON sa.submission_question_id = sq.submission_question_id
           WHERE sq.submission_id = $1`,
          [submissionId]
        );
        const earned = Number(totalRes.rows[0].earned || 0);
        const possible = Number(totalRes.rows[0].possible || 1);
        const newTotal = Number(((earned / possible) * 10).toFixed(2));

        await client.query(
          `UPDATE exam.submissions SET total_grade = $1 WHERE submission_id = $2`,
          [newTotal, submissionId]
        );
      }

      await client.query("COMMIT");
      return res.json(reviewRes.rows[0]);
    } catch (innerErr) {
      await client.query("ROLLBACK");
      throw innerErr;
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error("[saveTeacherReview] Error:", err);
    return res.status(500).json({ error: "Failed to save review" });
  }
}
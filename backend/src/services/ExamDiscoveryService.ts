// src/services/ExamDiscoveryService.ts
import type { Pool } from "pg";
import type { Spec, AvailableTestDto } from "../types/examTypes";

export class ExamDiscoveryService {
  
  static async getAvailableTestsForStudent(
    studentId: number, // (unused in query currently, but good for future logic)
    db: Pool
  ): Promise<AvailableTestDto[]> {
    const sql = `
      SELECT
        test_id,
        title,
        description,
        available_from,
        available_until,
        (
          tf_count * tf_points +
          mcq_count * mcq_points +
          prog_count * prog_points
        )::double precision AS total_points
      FROM exam.tests
      WHERE
        (available_from IS NULL OR available_from <= now())
        AND (available_until IS NULL OR available_until >= now())
      ORDER BY created_at DESC, test_id;
    `;
    const result = await db.query(sql);
    return result.rows as AvailableTestDto[];
  }

  static async generateRandomTest(spec: Spec, db: Pool) {
    // 1. Fetch True/False
    const tfQ = await db.query(
      `SELECT question_id, 'true_false' AS question_type, title, body
         FROM exam.questions
        WHERE question_type = 'true_false'
        ORDER BY random() LIMIT $1`,
      [spec.tf]
    );
  
    // 2. Fetch MCQ (with weighted options)
    const mcqQ = await db.query(
      `SELECT 
         q.question_id, 
         'mcq' AS question_type, 
         q.title, 
         q.body,
         (
           SELECT json_agg(json_build_object('option_id', qo.option_id, 'option_text', qo.option_text))
           FROM exam.mcq_options qo
           WHERE qo.question_id = q.question_id
         ) AS options
         FROM exam.questions q
        WHERE q.question_type = 'mcq'
        ORDER BY random() LIMIT $1`,
      [spec.mcq]
    );
  
    // 3. Fetch Programming
    const progQ = await db.query(
      `SELECT q.question_id, 'programming' AS question_type, q.title, q.body, pq.starter_code
         FROM exam.questions q
         JOIN exam.programming_questions pq
           ON pq.question_id = q.question_id
        WHERE q.question_type = 'programming'
        ORDER BY random() LIMIT $1`,
      [spec.prog]
    );
  
    return [...tfQ.rows, ...mcqQ.rows, ...progQ.rows];
  }
}
import { Pool } from "pg";
import { examDb } from "../db/db";

// Types for Creation
export type CreateQuestionDto = {
  title?: string;
  body: string;
  question_type: 'mcq' | 'true_false' | 'programming';
  difficulty: 'easy' | 'medium' | 'hard';
  topic_ids: number[];
  options?: { text: string; is_correct: boolean; weight?: number }[];
  correct_answer?: boolean;
  starter_code?: string;
  test_cases?: any[];
  teacher_id: number;
};

export type CreateTestDto = {
  title: string;
  description?: string;
  tf_count: number;
  mcq_count: number;
  prog_count: number;
  tf_points: number;
  mcq_points: number;
  prog_points: number;
  is_random: boolean;
  generation_config: {
    topics: number[];
    difficulty_distribution?: {
      easy: number;
      medium: number;
      hard: number;
    };
  };
  created_by: number;
};

export class ExamManagementService {
  
  static async createQuestion(dto: CreateQuestionDto) {
    const client = await examDb.connect();
    try {
      await client.query("BEGIN");

      // 1. Insert Base Question
      const qRes = await client.query(
        `INSERT INTO exam.questions 
         (title, body, question_type, difficulty, created_by)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING question_id`,
        [dto.title, dto.body, dto.question_type, dto.difficulty, dto.teacher_id]
      );
      const qId = qRes.rows[0].question_id;

      // 2. Link Topics
      if (dto.topic_ids && dto.topic_ids.length > 0) {
        for (const tId of dto.topic_ids) {
           await client.query(
             `INSERT INTO exam.question_topics (question_id, topic_id) VALUES ($1, $2)`,
             [qId, tId]
           );
        }
      }

      // 3. Handle Type Specifics
      if (dto.question_type === 'mcq' && dto.options) {
        for (const opt of dto.options) {
          await client.query(
            `INSERT INTO exam.mcq_options (question_id, option_text, is_correct, score_weight)
             VALUES ($1, $2, $3, $4)`,
            [qId, opt.text, opt.is_correct, opt.is_correct ? 1.0 : 0.0]
          );
        }
      } else if (dto.question_type === 'true_false' && dto.correct_answer !== undefined) {
        await client.query(
          `INSERT INTO exam.true_false_answers (question_id, correct_answer)
           VALUES ($1, $2)`,
          [qId, dto.correct_answer]
        );
      } else if (dto.question_type === 'programming') {
        await client.query(
          `INSERT INTO exam.programming_questions (question_id, starter_code, test_cases)
           VALUES ($1, $2, $3)`,
          [qId, dto.starter_code || "", JSON.stringify(dto.test_cases || [])]
        );
      }

      await client.query("COMMIT");
      return { question_id: qId };

    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  static async createTest(dto: CreateTestDto) {
    // Optional: Add math validation here (counts vs config)
    
    const sql = `
      INSERT INTO exam.tests 
      (title, description, created_by,
       tf_count, mcq_count, prog_count,
       tf_points, mcq_points, prog_points,
       is_random, generation_config)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING test_id
    `;

    const values = [
      dto.title, dto.description, dto.created_by,
      dto.tf_count, dto.mcq_count, dto.prog_count,
      dto.tf_points, dto.mcq_points, dto.prog_points,
      dto.is_random, JSON.stringify(dto.generation_config)
    ];

    const res = await examDb.query(sql, values);
    return res.rows[0];
  }

  static async getAllTopics() {
    const res = await examDb.query("SELECT * FROM exam.topics ORDER BY name ASC");
    return res.rows;
  }
}
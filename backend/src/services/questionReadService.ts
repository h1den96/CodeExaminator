// src/services/questionReadService.ts
import { examDb } from "../db/db";
import { McqPublicDTO } from "../dto/questions/MultipleChoiceDTO";
import { QuestionDetailDto } from "../dto/questions/QuestionDetailDTO";
import { TrueFalseDTO } from "../dto/questions/TrueFalseDTO";

export class QuestionReadService {
  async getById(id: string): Promise<QuestionDetailDto | null> {
    const qid = Number(id);
    if (!Number.isInteger(qid)) return null;

    const sql = `
      SELECT
        q.question_id,
        q.title,
        q.body,
        q.created_at,
        q.question_type,
        pq.starter_code
      FROM exam.questions q
      LEFT JOIN exam.programming_questions pq
        ON pq.question_id = q.question_id
      WHERE q.question_id = $1
    `;

    const { rows } = await examDb.query(sql, [qid]);
    if (!rows[0]) return null;

    const r = rows[0];
    return {
      question_id: r.question_id,
      title: r.title,
      body: r.body,
      created_at: r.created_at,
      question_type: r.question_type,
      starter_code: r.starter_code ?? null,
    };
  }

  async getRandomProgramming(): Promise<QuestionDetailDto | null> {
    const sql = `
      SELECT
        q.question_id,
        q.title,
        q.body,
        q.created_at,
        q.question_type,
        pq.starter_code
      FROM exam.questions q
      JOIN exam.programming_questions pq
        ON pq.question_id = q.question_id
      ORDER BY random()
      LIMIT 1
    `;
    const { rows } = await examDb.query(sql);
    if (!rows[0]) return null;

    const r = rows[0];
    return {
      question_id: r.question_id,
      title: r.title,
      body: r.body,
      created_at: r.created_at,
      question_type: r.question_type,
      starter_code: r.starter_code ?? null,
    };
  }

  async getRandomMultipleChoice(): Promise<McqPublicDTO | null> {
    const qSql = `
      SELECT
        q.question_id,
        q.question_type,
        q.title,
        q.body,
        q.created_at
      FROM exam.questions q
      WHERE q.question_type = 'mcq'
      ORDER BY random()
      LIMIT 1
    `;
    const qRes = await examDb.query(qSql);
    if (!qRes.rows[0]) return null;

    const qid: number = qRes.rows[0].question_id;

    const oSql = `
      SELECT option_id, option_text
      FROM exam.mcq_options
      WHERE question_id = $1
      ORDER BY option_id
    `;
    const oRes = await examDb.query(oSql, [qid]);

    return {
      question_id: qid,
      question_type: "mcq",
      title: qRes.rows[0].title,
      body: qRes.rows[0].body,
      created_at: qRes.rows[0].created_at,
      options: oRes.rows,
    };
  }

  async getRandomTrueFalsePublic(): Promise<Omit<TrueFalseDTO, "correct_answer"> | null> {
    const sql = `
      SELECT
        q.question_id,
        q.question_type,
        q.title,
        q.body,
        q.created_at
      FROM exam.questions q
      WHERE q.question_type = 'true_false'
      ORDER BY random()
      LIMIT 1
    `;
    const { rows } = await examDb.query(sql);
    if (!rows[0]) return null;

    const r = rows[0];
    return {
      question_id: r.question_id,
      question_type: r.question_type,
      title: r.title,
      body: r.body,
      created_at: r.created_at,
    };
  }
  
  async getRandomTrueFalseAdmin(): Promise<TrueFalseDTO | null> {
    const sql = `
      SELECT
        q.question_id,
        q.question_type,
        q.title,
        q.body,
        q.created_at,
        tf.correct_answer
      FROM exam.questions q
      JOIN exam.true_false_answers tf
        ON tf.question_id = q.question_id
      WHERE q.question_type = 'true_false'
      ORDER BY random()
      LIMIT 1
    `;
    const { rows } = await examDb.query(sql);
    if (!rows[0]) return null;

    const r = rows[0];
    return {
      question_id: r.question_id,
      question_type: r.question_type,
      title: r.title,
      body: r.body,
      created_at: r.created_at,
      correct_answer: r.correct_answer,
    };
  }
}

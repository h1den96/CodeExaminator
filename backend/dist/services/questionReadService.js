"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestionReadService = void 0;
// src/services/questionReadService.ts
const db_1 = require("../db/db");
class QuestionReadService {
    async getById(id) {
        const qid = Number(id);
        if (!Number.isInteger(qid))
            return null;
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
        const { rows } = await db_1.examDb.query(sql, [qid]);
        if (!rows[0])
            return null;
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
    async getRandomProgramming() {
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
        const { rows } = await db_1.examDb.query(sql);
        if (!rows[0])
            return null;
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
    async getRandomMultipleChoice() {
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
        const qRes = await db_1.examDb.query(qSql);
        if (!qRes.rows[0])
            return null;
        const qid = qRes.rows[0].question_id;
        const oSql = `
      SELECT option_id, option_text
      FROM exam.mcq_options
      WHERE question_id = $1
      ORDER BY option_id
    `;
        const oRes = await db_1.examDb.query(oSql, [qid]);
        return {
            question_id: qid,
            question_type: "mcq",
            title: qRes.rows[0].title,
            body: qRes.rows[0].body,
            created_at: qRes.rows[0].created_at,
            options: oRes.rows,
        };
    }
    async getRandomTrueFalsePublic() {
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
        const { rows } = await db_1.examDb.query(sql);
        if (!rows[0])
            return null;
        const r = rows[0];
        return {
            question_id: r.question_id,
            question_type: r.question_type,
            title: r.title,
            body: r.body,
            created_at: r.created_at,
        };
    }
    async getRandomTrueFalseAdmin() {
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
        const { rows } = await db_1.examDb.query(sql);
        if (!rows[0])
            return null;
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
exports.QuestionReadService = QuestionReadService;

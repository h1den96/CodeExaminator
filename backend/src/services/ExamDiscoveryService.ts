/*import type { Pool } from "pg";
import type { AvailableTestDto, RandomizerSpec, Difficulty } from "../types/examTypes";

export class ExamDiscoveryService {
  
  static async getAvailableTestsForStudent(
    studentId: number | string, 
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

  // --- REWRITTEN RANDOMIZER (Fixed: Removed q.points) ---
  static async generateRandomTest(spec: RandomizerSpec, db: Pool) {
    const { counts, config } = spec;
    const { topics, difficulty_distribution } = config;

    const fetchBatch = async (
      type: 'mcq' | 'true_false' | 'programming',
      limit: number,
      diff: Difficulty | null
    ) => {
      if (limit <= 0) return [];

      const params: any[] = [limit];
      let query = "";
      
      // Removed "q.points" from all queries below
      if (type === 'mcq') {
        query = `
          SELECT q.question_id, 'mcq' AS question_type, q.title, q.body, q.difficulty,
          (
             SELECT json_agg(json_build_object('option_id', qo.option_id, 'option_text', qo.option_text))
             FROM exam.mcq_options qo WHERE qo.question_id = q.question_id
          ) AS options
          FROM exam.questions q
          WHERE q.question_type = 'mcq'
        `;
      } else if (type === 'true_false') {
        query = `
          SELECT q.question_id, 'true_false' AS question_type, q.title, q.body, q.difficulty
          FROM exam.questions q
          WHERE q.question_type = 'true_false'
        `;
      } else {
        query = `
          SELECT q.question_id, 'programming' AS question_type, q.title, q.body, q.difficulty, pq.starter_code
          FROM exam.questions q
          JOIN exam.programming_questions pq ON pq.question_id = q.question_id
          WHERE q.question_type = 'programming'
        `;
      }

      let paramIdx = 2;

      // 1. Topic Filter
      if (topics && topics.length > 0) {
        query += ` AND EXISTS (
           SELECT 1 FROM exam.question_topics qt 
           WHERE qt.question_id = q.question_id 
           AND qt.topic_id = ANY($${paramIdx}::int[])
        )`;
        params.push(topics);
        paramIdx++;
      }

      // 2. Difficulty Filter
      if (diff) {
        query += ` AND q.difficulty = $${paramIdx}`;
        params.push(diff);
        paramIdx++;
      }

      query += ` ORDER BY random() LIMIT $1`;

      const res = await db.query(query, params);
      return res.rows;
    };

    const results: any[] = [];

    // --- 1. MCQ (Prioritize Count limit) ---
    if (counts.mcq > 0) {
      let remaining = counts.mcq;
      if (difficulty_distribution) {
        const easyLimit = Math.min(remaining, difficulty_distribution.easy || 0);
        if (easyLimit > 0) { results.push(...await fetchBatch('mcq', easyLimit, 'easy')); remaining -= easyLimit; }

        const medLimit = Math.min(remaining, difficulty_distribution.medium || 0);
        if (medLimit > 0) { results.push(...await fetchBatch('mcq', medLimit, 'medium')); remaining -= medLimit; }

        const hardLimit = Math.min(remaining, difficulty_distribution.hard || 0);
        if (hardLimit > 0) { results.push(...await fetchBatch('mcq', hardLimit, 'hard')); remaining -= hardLimit; }
      }
      if (remaining > 0) { results.push(...await fetchBatch('mcq', remaining, null)); }
    }

    // --- 2. True/False ---
    if (counts.tf > 0) {
      results.push(...await fetchBatch('true_false', counts.tf, null));
    }

    // --- 3. Programming ---
    if (counts.prog > 0) {
      results.push(...await fetchBatch('programming', counts.prog, null));
    }

    return results;
  }
}*/

import type { Pool } from "pg";
import type { AvailableTestDto, RandomizerSpec, Difficulty } from "../types/examTypes";

export class ExamDiscoveryService {
  
  static async getAvailableTestsForStudent(
    studentId: number | string, 
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

  // --- REWRITTEN RANDOMIZER ---
  static async generateRandomTest(spec: RandomizerSpec, db: Pool) {
    const { counts, config } = spec;
    const { topics, difficulty_distribution } = config;

    const fetchBatch = async (
      type: 'mcq' | 'true_false' | 'programming',
      limit: number,
      diff: Difficulty | null
    ) => {
      if (limit <= 0) return [];

      const params: any[] = [limit];
      let query = "";
      
      if (type === 'mcq') {
        query = `
          SELECT 
            q.question_id, 
            'mcq' AS question_type, 
            q.title, 
            q.body, 
            q.difficulty,
            q.allow_multiple,  -- <--- ADDED THIS FIELD
            (
               SELECT json_agg(json_build_object('option_id', qo.option_id, 'option_text', qo.option_text))
               FROM exam.mcq_options qo WHERE qo.question_id = q.question_id
            ) AS options
          FROM exam.questions q
          WHERE q.question_type = 'mcq'
        `;
      } else if (type === 'true_false') {
        query = `
          SELECT q.question_id, 'true_false' AS question_type, q.title, q.body, q.difficulty
          FROM exam.questions q
          WHERE q.question_type = 'true_false'
        `;
      } else {
        query = `
          SELECT q.question_id, 'programming' AS question_type, q.title, q.body, q.difficulty, pq.starter_code
          FROM exam.questions q
          JOIN exam.programming_questions pq ON pq.question_id = q.question_id
          WHERE q.question_type = 'programming'
        `;
      }

      let paramIdx = 2;

      // 1. Topic Filter
      if (topics && topics.length > 0) {
        query += ` AND EXISTS (
           SELECT 1 FROM exam.question_topics qt 
           WHERE qt.question_id = q.question_id 
           AND qt.topic_id = ANY($${paramIdx}::int[])
        )`;
        params.push(topics);
        paramIdx++;
      }

      // 2. Difficulty Filter
      if (diff) {
        query += ` AND q.difficulty = $${paramIdx}`;
        params.push(diff);
        paramIdx++;
      }

      query += ` ORDER BY random() LIMIT $1`;

      const res = await db.query(query, params);
      return res.rows;
    };

    const results: any[] = [];

    // --- 1. MCQ ---
    if (counts.mcq > 0) {
      let remaining = counts.mcq;
      if (difficulty_distribution) {
        const easyLimit = Math.min(remaining, difficulty_distribution.easy || 0);
        if (easyLimit > 0) { results.push(...await fetchBatch('mcq', easyLimit, 'easy')); remaining -= easyLimit; }

        const medLimit = Math.min(remaining, difficulty_distribution.medium || 0);
        if (medLimit > 0) { results.push(...await fetchBatch('mcq', medLimit, 'medium')); remaining -= medLimit; }

        const hardLimit = Math.min(remaining, difficulty_distribution.hard || 0);
        if (hardLimit > 0) { results.push(...await fetchBatch('mcq', hardLimit, 'hard')); remaining -= hardLimit; }
      }
      if (remaining > 0) { results.push(...await fetchBatch('mcq', remaining, null)); }
    }

    // --- 2. True/False ---
    if (counts.tf > 0) {
      results.push(...await fetchBatch('true_false', counts.tf, null));
    }

    // --- 3. Programming ---
    if (counts.prog > 0) {
      results.push(...await fetchBatch('programming', counts.prog, null));
    }

    return results;
  }
}
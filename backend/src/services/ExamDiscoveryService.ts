import type { Pool } from "pg";
import type { AvailableTestDto, RandomizerSpec, Difficulty } from "../types/examTypes";

export class ExamDiscoveryService {
  
  static async getAvailableTestsForStudent(studentId: string | number, db: Pool) {
  const query = `
    SELECT 
      t.test_id, 
      t.title, 
      t.description, 
      t.duration_minutes, 
      t.available_until,
      s.status as submission_status
    FROM exam.tests t
    LEFT JOIN exam.submissions s ON t.test_id = s.test_id AND s.student_id = $1
    WHERE t.is_published = true
      AND NOW() >= t.available_from 
      AND NOW() <= t.available_until
      AND (s.status IS NULL OR s.status = 'in_progress')
    ORDER BY t.available_until ASC;
  `;

  const { rows } = await db.query(query, [studentId]);
  return rows;
}

 static async generateRandomTest(spec: RandomizerSpec, db: Pool) {
    const { counts, config } = spec;
    const { topics } = config;
    const masterUniqueIds = new Set<number>();

    const getUniqueBatch = async (type: string, limit: number, diff: string | null) => {
        if (limit <= 0) return 0;
        
        const excludeArray = Array.from(masterUniqueIds);
        let query = `SELECT q.question_id FROM exam.questions q WHERE q.question_type = $1`;
        const params: any[] = [type];
        let pIdx = 2;

        if (diff) { 
            query += ` AND q.difficulty = $${pIdx}`; 
            params.push(diff); 
            pIdx++; 
        }
        
        if (excludeArray.length > 0) {
            query += ` AND q.question_id != ALL($${pIdx}::int[])`;
            params.push(excludeArray);
            pIdx++;
        }

        if (topics && topics.length > 0) {
            query += ` AND EXISTS (SELECT 1 FROM exam.question_topics qt WHERE qt.question_id = q.question_id AND qt.topic_id = ANY($${pIdx}::int[]))`;
            params.push(topics); 
            pIdx++;
        }

        query += ` ORDER BY random() LIMIT $${pIdx}`;
        params.push(limit);

        const res = await db.query(query, params);
        res.rows.forEach(r => masterUniqueIds.add(r.question_id));
        return res.rowCount || 0;
    };

    let remainingMcq = counts.mcq;
    const dist = config.difficulty_distribution;

    if (remainingMcq > 0) {
        remainingMcq -= await getUniqueBatch('mcq', Math.min(remainingMcq, dist?.easy || 0), 'easy');
        remainingMcq -= await getUniqueBatch('mcq', Math.min(remainingMcq, dist?.medium || 0), 'medium');
        remainingMcq -= await getUniqueBatch('mcq', Math.min(remainingMcq, dist?.hard || 0), 'hard');
        
        if (remainingMcq > 0) {
            await getUniqueBatch('mcq', remainingMcq, null);
        }
    }

    await getUniqueBatch('true_false', counts.tf, null);
    await getUniqueBatch('programming', counts.prog, null);

    const finalIds = Array.from(masterUniqueIds);
    if (finalIds.length === 0) return [];

    const finalRes = await db.query(`
        SELECT q.question_id, q.question_type, q.title, q.body, q.difficulty, q.allow_multiple,
               pq.starter_code,
               (SELECT json_agg(json_build_object('option_id', mo.option_id, 'option_text', mo.option_text))
                FROM exam.mcq_options mo WHERE mo.question_id = q.question_id) AS options
        FROM exam.questions q
        LEFT JOIN exam.programming_questions pq ON q.question_id = pq.question_id
        WHERE q.question_id = ANY($1::int[])
    `, [finalIds]);

    return finalIds.map(id => finalRes.rows.find(r => r.question_id === id)).filter(Boolean);
  }
}
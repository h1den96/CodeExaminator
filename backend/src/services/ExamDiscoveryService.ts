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
    const { topics } = config;

    const masterUniqueIds = new Set<number>();

    const getUniqueBatch = async (type: string, limit: number, diff: string | null) => {
        if (limit <= 0) return;
        
        const excludeArray = Array.from(masterUniqueIds);
        // 🛡️ FIX: Removed 'AND q.is_active = true' to stop the crash
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
    };

    const dist = config.difficulty_distribution;
    if (counts.mcq > 0) {
        await getUniqueBatch('mcq', dist?.easy || 0, 'easy');
        await getUniqueBatch('mcq', dist?.medium || 0, 'medium');
        await getUniqueBatch('mcq', dist?.hard || 0, 'hard');
        
        const currentMcqCount = Array.from(masterUniqueIds).length;
        if (currentMcqCount < counts.mcq) {
            await getUniqueBatch('mcq', counts.mcq - currentMcqCount, null);
        }
    }

    await getUniqueBatch('true_false', counts.tf, null);
    await getUniqueBatch('programming', counts.prog, null);

    const finalIds = Array.from(masterUniqueIds);

    const finalRes = await db.query(`
        SELECT q.question_id, q.question_type, q.title, q.body, q.difficulty, q.allow_multiple,
               pq.starter_code,
               (SELECT json_agg(json_build_object('id', mo.option_id, 'text', mo.option_text))
                FROM exam.mcq_options mo WHERE mo.question_id = q.question_id) AS options
        FROM exam.questions q
        LEFT JOIN exam.programming_questions pq ON q.question_id = pq.question_id
        WHERE q.question_id = ANY($1::int[])
    `, [finalIds]);

    return finalIds.map(id => finalRes.rows.find(r => r.question_id === id));
}


}
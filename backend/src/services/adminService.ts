import { examDb } from "../db/db";

// Helper type for Question Input
export type CreateQuestionDto = {
  title?: string;
  body: string;
  question_type: 'mcq' | 'true_false' | 'programming';
  difficulty: 'easy' | 'medium' | 'hard';
  topic_ids: number[]; // e.g. [1, 5]
  teacher_id: number;
  allow_multiple?: boolean;
  
  // Type Specifics
  options?: { text: string; is_correct: boolean; score_weight?: number }[]; // For MCQ
  correct_answer?: boolean; // For TF
  starter_code?: string; // For Prog
  test_cases?: any[]; // For Prog
};

export type SlotDto = {
  topic_id: number;
  question_type: 'mcq' | 'true_false' | 'programming';
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  weight_bb: number; // Black-box (Results)
  weight_wb: number; // White-box (Logic/AST)
};

export type CreateTestDto = {
  title: string;
  description?: string;
  created_by: number;
  
  // Time & Scheduling
  duration_minutes: number;
  available_from?: string | null;
  available_until?: string | null;
  strict_deadline: boolean;

  // The NEW Core
  is_random: boolean;
  slots: SlotDto[]; // 🚀 The Array of requirements
  
  is_published?: boolean;
};

export class AdminService {
  
  /**
   * Universal Create Question Function
   * Handles linking topics and saving specific data for all 3 types.
   */
  static async createQuestion(dto: CreateQuestionDto) {
    const client = await examDb.connect();
    try {
      await client.query("BEGIN");

      // 1. Insert Base Question
      const qRes = await client.query(
        `INSERT INTO exam.questions 
         (title, body, question_type, difficulty, created_by, allow_multiple)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING question_id`,
        [
            dto.title, 
            dto.body, 
            dto.question_type, 
            dto.difficulty, 
            dto.teacher_id, 
            dto.allow_multiple || false 
        ]
      );
      const qId = qRes.rows[0].question_id;

      // 2. Link Topics (Many-to-Many)
      if (dto.topic_ids && dto.topic_ids.length > 0) {
        for (const tId of dto.topic_ids) {
           await client.query(
             `INSERT INTO exam.question_topics (question_id, topic_id) VALUES ($1, $2)`,
             [qId, tId]
           );
        }
      }

      // 3. Handle Specific Types
      if (dto.question_type === 'mcq' && dto.options) {
        for (const opt of dto.options) {
          // Default weight: 1.0 for correct, 0.0 for incorrect if not provided
          const weight = typeof opt.score_weight === 'number' 
            ? opt.score_weight 
            : (opt.is_correct ? 1.0 : 0.0);

          await client.query(
            `INSERT INTO exam.mcq_options (question_id, option_text, is_correct, score_weight)
             VALUES ($1, $2, $3, $4)`,
            [qId, opt.text, opt.is_correct, weight]
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
      return { question_id: qId, message: "Question created successfully" };

    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Create Test Blueprint (Exam)
   * Saves metadata, scheduling info, and generation config.
   */
  static async createTest(dto: CreateTestDto) {
    const client = await examDb.connect();
    try {
      await client.query("BEGIN"); // 🛡️ Start Transaction

      // 1. Insert Test Record
      // Note: We removed the tf_count, mcq_count, etc. columns 
      // as they are now derived from the slots.
      const testSql = `
        INSERT INTO exam.tests 
        (
          title, description, created_by,
          is_random, duration_minutes, 
          available_from, available_until, strict_deadline, 
          is_published
        )
        VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING test_id
      `;

      const testValues = [
        dto.title, 
        dto.description, 
        dto.created_by,
        dto.is_random, 
        dto.duration_minutes || 60,
        dto.available_from || null,
        dto.available_until || null,
        dto.strict_deadline,
        dto.is_published ?? true
      ];

      const testRes = await client.query(testSql, testValues);
      const testId = testRes.rows[0].test_id;

      // 2. Insert Slots
      // We iterate through the slots array and link them to the testId
      if (dto.slots && dto.slots.length > 0) {
        const slotSql = `
          INSERT INTO exam.test_slots 
          (test_id, slot_order, topic_id, question_type, difficulty, points, weight_bb, weight_wb)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `;

        for (let i = 0; i < dto.slots.length; i++) {
          const s = dto.slots[i];
          
          // Map 'mcq' from frontend to 'multiple_choice' if your DB constraint requires it
          const dbType = s.question_type === 'mcq' ? 'multiple_choice' : s.question_type;

          await client.query(slotSql, [
            testId,
            i + 1, // slot_order
            s.topic_id,
            dbType,
            s.difficulty,
            s.points,
            s.weight_bb,
            s.weight_wb
          ]);
        }
      } else {
        throw new Error("Cannot create a test with zero slots.");
      }

      await client.query("COMMIT"); // ✅ Success!
      return { test_id: testId, message: "Exam blueprint and slots created." };

    } catch (err) {
      await client.query("ROLLBACK"); // ❌ Failure: Undo everything
      console.error("AdminService.createTest Error:", err);
      throw err;
    } finally {
      client.release();
    }
  }

  static async getAllTopics() {
    const res = await examDb.query("SELECT * FROM exam.topics ORDER BY name ASC");
    return res.rows;
  }

  // --- Wrapper Methods for Backward Compatibility ---
  
  static async createProgrammingQuestion(data: any) {
    return this.createQuestion({ ...data, question_type: 'programming' });
  }

  static async createMCQ(data: any) {
    // Map 'score_weight' from frontend to the DTO structure if needed
    // The createQuestion function handles this logic inside the loop, 
    // so we just pass data through.
    return this.createQuestion({ ...data, question_type: 'mcq' });
  }

  static async createTF(data: any) {
    return this.createQuestion({ ...data, question_type: 'true_false' });
  }

  static async updateProgrammingTestCases(questionId: number, testCases: any[]) {
    const client = await examDb.connect();
    try {
      await client.query("BEGIN");
      
      // Update the programming_questions table
      const res = await client.query(
        `UPDATE exam.programming_questions 
         SET test_cases = $1 
         WHERE question_id = $2
         RETURNING question_id`,
        [JSON.stringify(testCases), questionId]
      );

      if (res.rowCount === 0) {
        throw new Error("Programming question not found (or id is not a programming type)");
      }

      await client.query("COMMIT");
      return { message: "Test cases updated successfully" };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

}


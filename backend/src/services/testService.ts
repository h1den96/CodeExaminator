// src/services/testService.ts
import type { Pool } from "pg";
import type { TestDTO, AvailableTestDto } from "../dto/TestDTO";
import type { SubmitAnswerDto } from "../dto/SubmitAnswerDTO";

type TestTemplateRow = {
  test_id: number;
  title: string;
  description: string | null;
  tf_count: number;
  mcq_count: number;
  prog_count: number;
  tf_points: string;
  mcq_points: string;
  prog_points: string;
};

export type Spec = { tf: number; mcq: number; prog: number };

export type AnswersPayload = {
  tf: Record<number, boolean | "true" | "false" | null>;
  mcq: Record<number, number | null>;
  prog: Record<number, string>;
};

function calculateWeightedMCQScore(
  questionPoints: number,
  options: { id: number; weight: number }[],
  selectedIds: number[],
  enableNegativeGrading: boolean
): number {
  let totalWeight = 0.0;

  selectedIds.forEach((sid) => {
    const opt = options.find((o) => o.id === sid);
    if (opt) {
      let w = Number(opt.weight);
      
      // SAFE MODE LOGIC:
      // If negative grading is OFF, treat penalties as 0.
      if (!enableNegativeGrading && w < 0) {
        w = 0;
      }
      totalWeight += w;
    }
  });

  // Clamp factor between 0 (0%) and 1 (100%)
  const factor = Math.min(1, Math.max(0, totalWeight));
  
  // Return points (rounded to 2 decimals)
  return Number((factor * questionPoints).toFixed(2));
}

export async function getRandomTest(spec: Spec, db: Pool) {
  // 1. Fetch True/False (include title & body)
  const tfQ = await db.query(
    `SELECT question_id, 'true_false' AS question_type, title, body
       FROM exam.questions
      WHERE question_type = 'true_false'
      ORDER BY random() LIMIT $1`,
    [spec.tf]
  );

  // 2. Fetch MCQ (include title, body, AND options)
  // FIX: Changed exam.question_options -> exam.mcq_options
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

  // 3. Fetch Programming (include title, body, starter_code)
  const progQ = await db.query(
    `SELECT q.question_id, 'programming' AS question_type, q.title, q.body, pq.starter_code
       FROM exam.questions q
       JOIN exam.programming_questions pq
         ON pq.question_id = q.question_id
      WHERE q.question_type = 'programming'
      ORDER BY random() LIMIT $1`,
    [spec.prog]
  );

  const rows = [...tfQ.rows, ...mcqQ.rows, ...progQ.rows];
  return rows;
}

export async function startTest(spec: Spec, db: Pool) {
  return getRandomTest(spec, db);
}

export async function startTestForStudent(
  testId: number,
  studentId: string,
  examDb: Pool
): Promise<{ submissionId: number; dto: TestDTO }> {

  const tRes = await examDb.query<TestTemplateRow>(
    `SELECT * FROM exam.tests WHERE test_id = $1`,
    [testId]
  );

  const t = tRes.rows[0];
  if (!t) {
    throw new Error(`Test template with id=${testId} not found`);
  }

  // Check for existing submission
  const existingRes = await examDb.query(
    `SELECT submission_id
       FROM exam.submissions
      WHERE student_id = $1
        AND test_id = $2
        AND status = 'in_progress'
      ORDER BY started_at DESC
      LIMIT 1`,
    [studentId, testId]
  );

  if ((existingRes.rowCount ?? 0) > 0) {
    const existingSubmissionId: number = existingRes.rows[0].submission_id;

    // FIX: Changed exam.question_options -> exam.mcq_options
    const qsRes = await examDb.query(
      `SELECT
         q.question_id,
         q.question_type,
         q.title,
         q.body,
         pq.starter_code,
         sq.q_order,
         sq.points,
         (
            SELECT json_agg(json_build_object('option_id', qo.option_id, 'option_text', qo.option_text))
            FROM exam.mcq_options qo
            WHERE qo.question_id = q.question_id
         ) as options
       FROM exam.submission_questions sq
       JOIN exam.questions q
         ON q.question_id = sq.question_id
       LEFT JOIN exam.programming_questions pq
         ON pq.question_id = q.question_id
      WHERE sq.submission_id = $1
      ORDER BY sq.q_order`,
      [existingSubmissionId]
    );

    const rows = qsRes.rows;

    const dto: any = {
      test_id: t.test_id,
      title: t.title,
      description: t.description,
      questions: rows,
    };

    return { submissionId: existingSubmissionId, dto: dto as TestDTO };
  }

  // Create NEW submission
  const spec: Spec = {
    tf: t.tf_count,
    mcq: t.mcq_count,
    prog: t.prog_count,
  };

  const rows = await getRandomTest(spec, examDb);

  const sRes = await examDb.query(
    `INSERT INTO exam.submissions (student_id, test_id, status)
     VALUES ($1, $2, 'in_progress')
     RETURNING submission_id`,
    [studentId, t.test_id]
  );

  const submissionId: number = sRes.rows[0].submission_id;

  let order = 1;

  for (const q of rows) {
    const qt: string = q.question_type;
    const points =
      qt === "true_false"
        ? t.tf_points
        : qt === "mcq"
        ? t.mcq_points
        : t.prog_points;

    await examDb.query(
      `INSERT INTO exam.submission_questions
         (submission_id, question_id, q_order, points)
       VALUES ($1, $2, $3, $4)`,
      [submissionId, q.question_id, order, points]
    );

    order++;
  }

  const dto: any = {
    test_id: t.test_id,
    title: t.title,
    description: t.description,
    questions: rows,
  };

  return { submissionId, dto: dto as TestDTO };
}

export async function submitAnswersForSubmission(
  submissionId: number,
  studentId: string,
  answers: AnswersPayload,
  examDb: Pool
): Promise<void> {

  const subRes = await examDb.query(
    `SELECT submission_id, student_id
       FROM exam.submissions
      WHERE submission_id = $1`,
    [submissionId]
  );

  if (subRes.rowCount === 0) throw new Error("submission_not_found");

  const submission = subRes.rows[0];
  if (submission.student_id !== studentId) throw new Error("submission_not_owned");

  await examDb.query(
    `UPDATE exam.submissions
        SET status = 'submitted',
            submitted_at = now()
      WHERE submission_id = $1`,
    [submissionId]
  );
}

export async function getAvailableTestsForStudent(
  studentId: number,
  examDb: Pool
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
  const result = await examDb.query(sql);
  return result.rows as AvailableTestDto[];
}

export async function saveSingleAnswer(
  submissionId: number,
  studentId: string,
  dto: SubmitAnswerDto,
  examDb: Pool
): Promise<void> {

  // 1. Βεβαιώσου ότι το submission ανήκει στον φοιτητή και είναι ενεργό
  const subCheck = await examDb.query(
    `SELECT submission_id 
     FROM exam.submissions 
     WHERE submission_id = $1 AND student_id = $2 AND status = 'in_progress'`,
    [submissionId, studentId]
  );

  if (subCheck.rowCount === 0) {
    throw new Error("Submission not found or not active");
  }

  // 2. Βρες το submission_question_id που αντιστοιχεί σε αυτή την ερώτηση
  const sqRes = await examDb.query(
    `SELECT submission_question_id 
     FROM exam.submission_questions 
     WHERE submission_id = $1 AND question_id = $2`,
    [submissionId, dto.question_id]
  );

  if (sqRes.rowCount === 0) {
    throw new Error("Question not found in this submission");
  }

  const submissionQuestionId = sqRes.rows[0].submission_question_id;

  // 3. Upsert Logic
  // Ελέγχουμε αν υπάρχει ήδη απάντηση για να κάνουμε Update ή Insert
  const existingAns = await examDb.query(
    `SELECT answer_id FROM exam.student_answers WHERE submission_question_id = $1`,
    [submissionQuestionId]
  );

  // Προετοιμασία τιμών για αποφυγή undefined
  const mcqVal = dto.mcq_option_ids || null;
  const tfVal = dto.tf_answer ?? null; // Το ?? κρατάει το false/true αλλά κάνει null το undefined
  const codeVal = dto.code_answer || null;

  if (existingAns.rowCount && existingAns.rowCount > 0) {
    // Update existing answer
    await examDb.query(
      `UPDATE exam.student_answers
       SET mcq_option_ids = $1,
           tf_answer = $2,
           code_answer = $3,
           answered_at = now()
       WHERE submission_question_id = $4`,
      [mcqVal, tfVal, codeVal, submissionQuestionId]
    );
  } else {
    // Insert new answer
    await examDb.query(
      `INSERT INTO exam.student_answers 
        (submission_question_id, mcq_option_ids, tf_answer, code_answer)
       VALUES ($1, $2, $3, $4)`,
      [submissionQuestionId, mcqVal, tfVal, codeVal]
    );
  }
}

export async function submitAndGrade(
  submissionId: number,
  studentId: string,
  examDb: Pool
) {
  const client = await examDb.connect();
  try {
    await client.query("BEGIN");

    // 1. Έλεγχος & Κλείδωμα
    const check = await client.query(
      `SELECT status FROM exam.submissions 
       WHERE submission_id = $1 AND student_id = $2 FOR UPDATE`,
      [submissionId, studentId]
    );

    if (check.rowCount === 0) throw new Error("submission_not_found");
    if (check.rows[0].status !== 'in_progress') throw new Error("already_submitted");

    // 2. Αυτόματη Διόρθωση MCQ (Single Choice)
    await client.query(
      `UPDATE exam.student_answers sa
       SET question_grade = sq.points
       FROM exam.submission_questions sq
       JOIN exam.mcq_options mo ON mo.question_id = sq.question_id
       WHERE sa.submission_question_id = sq.submission_question_id
         AND sq.submission_id = $1
         AND sa.mcq_option_ids[1] = mo.option_id
         AND mo.is_correct = true`,
      [submissionId]
    );

    // 3. Αυτόματη Διόρθωση True/False
    await client.query(
      `UPDATE exam.student_answers sa
       SET question_grade = sq.points
       FROM exam.submission_questions sq
       JOIN exam.true_false_answers tf ON tf.question_id = sq.question_id
       WHERE sa.submission_question_id = sq.submission_question_id
         AND sq.submission_id = $1
         AND sa.tf_answer = tf.correct_answer`,
      [submissionId]
    );

    // 4. Υπολογισμός Συνολικής Βαθμολογίας
    const scoreRes = await client.query(
      `SELECT COALESCE(SUM(question_grade), 0) as total_score
       FROM exam.student_answers sa
       JOIN exam.submission_questions sq ON sa.submission_question_id = sq.submission_question_id
       WHERE sq.submission_id = $1`,
      [submissionId]
    );
    
    const totalScore = scoreRes.rows[0].total_score;

    // 5. Τελική Ενημέρωση Submission
    await client.query(
      `UPDATE exam.submissions
       SET status = 'submitted',
           submitted_at = now(),
           total_grade = $2
       WHERE submission_id = $1`,
      [submissionId, totalScore]
    );

    await client.query("COMMIT");
    return { submission_id: submissionId, status: 'submitted', auto_grade: totalScore };

  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}


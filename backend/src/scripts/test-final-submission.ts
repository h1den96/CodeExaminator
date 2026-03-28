import { Pool } from 'pg';
import { SubmissionService } from '../../src/services/submissionService'; // Adjust path as needed

// 1. Database Connection
const pool = new Pool({
  connectionString: "postgresql://postgres:password@localhost:5433/exam_system"
});

// 2. Mock Data (Use an actual ID from your student_answers table)
const SUBMISSION_ID = 77; 
const STUDENT_ID = "6"; 
const QUESTION_ID = 84; // The Fibonacci question with 2 rules

const studentCode = `
long long fib(int n) {
    if (n <= 0) return 0;
    if (n == 1) return 1;
    // Corrected parenthesis and actually recursive
    return fib(n - 1) + fib(n - 2); 
}
`;

async function runFinalTest() {
  console.log("🚀 Starting Final Hybrid Submission Test...");

  try {


    console.log("💾 Saving fresh student code to database...");
    await SubmissionService.saveSingleAnswer(
      SUBMISSION_ID,
      STUDENT_ID,
      {
        question_id: QUESTION_ID,
        code_answer: studentCode // Using your fixed variable here
      },
      pool
    );

    // 2. NOW grade it
    const result = await SubmissionService.submitAndGrade(
      SUBMISSION_ID,
      STUDENT_ID,
      pool
    );

    console.log("\n--- ✅ Submission Successful ---");
    console.log(`Final Grade: ${result.final_score.toFixed(2)}`);
    console.log(`Status: ${result.status}`);

    const dbCheck = await pool.query(
      `SELECT sa.question_grade, sa.eval_result 
       FROM exam.student_answers sa
       JOIN exam.submission_questions sq ON sa.submission_question_id = sq.submission_question_id
       WHERE sq.submission_id = $1 AND sq.question_id = $2`,
      [SUBMISSION_ID, QUESTION_ID]
    );

    const row = dbCheck.rows[0];
    console.log("\n--- 🔍 Database Verification ---");
    console.log(`Grade in DB: ${row.question_grade}`);
    console.log(`JSON Breakdown:`, JSON.stringify(row.eval_result, null, 2));

  } catch (error) {
    console.error("\n--- ❌ Test Failed ---");
    console.log(error);
  } finally {
    await pool.end();
  }
}

runFinalTest();
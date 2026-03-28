/*import { Pool } from 'pg';
import { SubmissionService } from '../../src/services/submissionService';

const pool = new Pool({
  connectionString: "postgresql://postgres:password@localhost:5433/exam_system"
});

const SUBMISSION_ID = 77; 
const STUDENT_ID = "6"; 
const QUESTION_ID = 84; 

const SCENARIOS = [
  {
    name: "Scenario 1: The Legend (Perfect)",
    code: `long long fib(int n) { 
             if (n <= 0) return 0; if (n == 1) return 1;
             return fib(n-1) + fib(n-2); 
           }`
  },
  {
    name: "Scenario 2: The Cheater (Forbidden Pow)",
    code: `long long fib(int n) { 
             double x = std::pow(1, 1); // Forbidden!
             if (n <= 0) return 0; if (n == 1) return 1;
             return fib(n-1) + fib(n-2); 
           }`
  },
  {
    name: "Scenario 3: The Good Try (Wrong Logic, Good Structure)",
    code: `long long fib(int n) { 
             if (n <= 0) return 99; // Wrong logic!
             return fib(n-1) + fib(n-2); 
           }`
  }
];

async function runTestSuite() {
  for (const scenario of SCENARIOS) {
    console.log(`\n--- 🏃 Running ${scenario.name} ---`);

    try {
      // 1. Reset DB state automatically
      await pool.query("UPDATE exam.submissions SET status = 'in_progress', total_grade = NULL WHERE submission_id = $1", [SUBMISSION_ID]);
      
      // 2. Save the code for this scenario
      await SubmissionService.saveSingleAnswer(SUBMISSION_ID, STUDENT_ID, {
        question_id: QUESTION_ID,
        code_answer: scenario.code
      }, pool);

      // 3. Grade it
      const result = await SubmissionService.submitAndGrade(SUBMISSION_ID, STUDENT_ID, pool);

      console.log(`✅ Result: ${result.final_score.toFixed(2)} / 10.00`);
      
    } catch (error: any) {
      console.error(`❌ Scenario Failed: ${error.message}`);
    }
  }
  await pool.end();
}

runTestSuite();*/

import { Pool } from "pg";
import { SubmissionService } from "../../src/services/submissionService";

const pool = new Pool({
  connectionString: "postgresql://postgres:password@localhost:5433/exam_system",
  max: 10,
});

const SUBMISSION_ID = 77;
const STUDENT_ID = "6";
const QUESTION_ID = 84;

// Helper to pause execution (The "Cooldown")
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function runPacedTest(totalRequests: number, batchSize: number) {
  console.log(
    `\n--- 🧊 Starting Paced Test: ${totalRequests} total, in squads of ${batchSize} ---`,
  );

  const startTime = Date.now();
  let completed = 0;

  for (let i = 0; i < totalRequests; i += batchSize) {
    const currentBatchSize = Math.min(batchSize, totalRequests - i);
    console.log(
      `🚀 Dispatching Squad: Submissions ${i + 1} to ${i + currentBatchSize}...`,
    );

    const squad = Array.from({ length: currentBatchSize }).map(async () => {
      try {
        // We reset the lock so the grader doesn't skip it
        await pool.query(
          "UPDATE exam.submissions SET status = 'in_progress' WHERE submission_id = $1",
          [SUBMISSION_ID],
        );
        await SubmissionService.submitAndGrade(SUBMISSION_ID, STUDENT_ID, pool);
        completed++;
      } catch (err) {
        console.error("❌ A puppet snapped a string:", err);
      }
    });

    await Promise.all(squad);

    // The Breath: Give the CPU 500ms to cool down between batches
    if (i + batchSize < totalRequests) {
      console.log("⏸️  Cooldown... letting the fans spin down.");
      await sleep(500);
    }
  }

  const duration = (Date.now() - startTime) / 1000;
  console.log(`\n--- 📊 Paced Test Results ---`);
  console.log(
    `Success: ${completed}/${totalRequests} | Total Time: ${duration.toFixed(2)}s`,
  );
}

// 15 total requests, handled 3 at a time.
runPacedTest(15, 3).then(() => pool.end());

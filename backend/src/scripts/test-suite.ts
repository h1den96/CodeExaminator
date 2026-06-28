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

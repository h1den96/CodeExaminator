import axios from "axios";

// Configuration
const API_URL = "http://localhost:3000/api";
const TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo2LCJyb2xlIjoic3R1ZGVudCIsImlhdCI6MTc3NDQ0OTk2MywiZXhwIjoxNzc0NDUwODYzfQ.ivDgzFkEOlVsr2oqkPeeFfwCyHpWo8eNi-QLI7YLLrA";
const SUBMISSION_ID = 77;
const QUESTION_ID = 84;

async function testHybridGrading() {
  console.log("Starting Hybrid Grading Test...");

  // 🧪 Test Code: We'll include a 'pow' call to test if our FORBID rule works!
  const studentCode = `
long long fib(int n) {
    // pow(1, 1); // Uncomment this to test the "FORBID" rule failure!
    if (n <= 0) return 0;
    if (n == 1) return 1;
    return fib(n - 1) + fib(n - 2);
}
    `;

  try {
    console.log("Sending submission to backend...");

    const response = await axios.post(
      `${API_URL}/submissions/${SUBMISSION_ID}/run`,
      {
        question_id: QUESTION_ID,
        code: studentCode,
      },
      { headers: { Authorization: `Bearer ${TOKEN}` } },
    );

    const results = response.data;
    const totalPoints = results.max_points || 10;
    const weightBB = results.weights?.bb || 0.8;
    const weightWB = results.weights?.wb || 0.2;

    console.log("\n--- 🧩 Structural (White-Box) Breakdown ---");

    // 🚀 NEW: Loop through the specific rule details from the backend
    results.structural_analysis.details.forEach((rule: any) => {
      const icon = rule.passed ? "✅" : "❌";
      console.log(`${icon} Rule: ${rule.description} (Weight: ${rule.impact})`);
    });

    const wbScoreFraction = results.structural_analysis.score; // e.g. 0.5 or 1.0
    console.log(`White-Box Internal Score: ${wbScoreFraction * 100}%`);

    console.log("\n--- 🧪 Functional (Black-Box) Breakdown ---");
    const testsPassed =
      results.test_results?.filter(
        (r: any) =>
          r.status === "Accepted" || r.status?.description === "Accepted",
      ).length || 0;
    const totalTests = results.test_results?.length || 1;
    const bbPassRate = testsPassed / totalTests;

    console.log(`Functionality: ${testsPassed} / ${totalTests} Passed`);

    // --- 🧮 Calculation Logic ---
    // Final Score = (Points * WB_Weight * WB_Result) + (Points * BB_Weight * BB_Result)
    const expectedWB = totalPoints * weightWB * wbScoreFraction;
    const expectedBB = totalPoints * weightBB * bbPassRate;
    const expectedTotal = expectedWB + expectedBB;

    console.log("\n--- 📊 Final Score Comparison ---");
    console.log(`Expected (Script): ${expectedTotal.toFixed(2)}`);
    console.log(`Actual (Backend): ${results.question_grade}`);

    if (Math.abs(expectedTotal - results.question_grade) < 0.05) {
      console.log(
        "\nStatus: Success! The Hybrid Grader is perfectly synchronized.",
      );
    } else {
      console.log("\nStatus: Failure. Score mismatch detected.");
    }
  } catch (err: any) {
    const errorMsg = err.response?.data?.error || err.message;
    console.error("Error running test:", errorMsg);
  }
}

testHybridGrading();

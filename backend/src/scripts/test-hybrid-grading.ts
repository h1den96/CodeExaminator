import axios from 'axios';

// Configuration
const API_URL = 'http://localhost:3000/api'; 
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo2LCJyb2xlIjoic3R1ZGVudCIsImlhdCI6MTc3NDQ0OTk2MywiZXhwIjoxNzc0NDUwODYzfQ.ivDgzFkEOlVsr2oqkPeeFfwCyHpWo8eNi-QLI7YLLrA'; 
const SUBMISSION_ID = 77; 
const QUESTION_ID = 84; 

async function testHybridGrading() {
    console.log("Starting Hybrid Grading Test...");

    const studentCode = `
long long fib(int n) {
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
                code: studentCode
            },
            { headers: { Authorization: `Bearer ${TOKEN}` } }
        );

        const results = response.data;

        console.log("\n--- Grading Breakdown ---");
        
        // 🚀 FIX 1: Use weights directly from the backend response instead of hardcoding
        const totalPoints = results.max_points || 10; 
        const weightBB = results.weights?.bb || 0.8; 
        const weightWB = results.weights?.wb || 0.2; 

        const structuralPassed = results.structural_analysis?.recursion_detected || false;
        
        // 🚀 FIX 2: Correctly filter the status object
        const testsPassed = results.test_results?.filter((r: any) => 
            r.status === 'Accepted' || r.status?.description === 'Accepted'
        ).length || 0;

        const totalTests = results.test_results?.length || 1;

        console.log(`Structure (Recursion Detected): ${structuralPassed ? "Pass" : "Fail"}`);
        console.log(`Functionality (Tests Passed): ${testsPassed} / ${totalTests}`);

        // Calculation Logic
        const structuralScore = structuralPassed ? (totalPoints * weightWB) : 0;
        const functionalScore = (testsPassed / totalTests) * (totalPoints * weightBB);
        const expectedTotal = structuralScore + functionalScore;

        console.log(`\nExpected Score: ${expectedTotal.toFixed(2)} / ${totalPoints}`);
        console.log(`Actual DB Score: ${results.question_grade}`);

        // Check for floating point equality
        if (Math.abs(expectedTotal - results.question_grade) < 0.05) {
            console.log("\nStatus: Success. The Hybrid Grader calculated the weights correctly.");
        } else {
            console.log("\nStatus: Failure. Score mismatch detected.");
            console.log("Debug Info:", {
                structuralScore,
                functionalScore,
                passedCount: testsPassed,
                totalTests
            });
        }

    } catch (err: any) {
        const errorMsg = err.response?.data?.error || err.message;
        console.error("Error running test:", errorMsg);
    }
}

testHybridGrading();
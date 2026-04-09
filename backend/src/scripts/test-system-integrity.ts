import { Judge0Service } from "../services/judge0Service";
import { GradingService } from "../services/gradingService";

// Ορίζουμε τα σενάρια δοκιμών
const testScenarios = [
    {
        name: "🚨 SECURITY: System File Access",
        category: "SCALAR",
        code: `#include <iostream>\n#include <fstream>\nint main() { std::ifstream f("/etc/passwd"); if(f.is_open()) std::cout << "HACKED"; else std::cout << "SAFE"; return 0; }`,
        testCases: [{ input: "", expected_output: "SAFE" }],
        expectedStatus: "Accepted", // Θέλουμε να το τρέξει αλλά να φάει "πόρτα" από το λειτουργικό
        minGrade: 10 // Αν το Judge0 είναι σωστό, θα εκτυπώσει SAFE και θα πάρει 10
    },
    {
        name: "💣 SECURITY: Fork Bomb Attempt",
        category: "SCALAR",
        code: `#include <unistd.h>\nint main() { while(1) fork(); return 0; }`,
        testCases: [{ input: "", expected_output: "any" }],
        expectedStatus: "Runtime Error", // Εδώ περιμένουμε το Sandbox να το σκοτώσει
        shouldFail: true
    },
    {
        name: "⚖️ FAIRNESS: Excessive Whitespace",
        category: "SCALAR",
        code: `#include <iostream>\nint main() { std::cout << "   10   " << std::endl << std::endl; return 0; }`,
        testCases: [{ input: "", expected_output: "10" }],
        expectedStatus: "Accepted",
        minGrade: 10 // Πρέπει να το βγάλει σωστό παρά τα κενά
    },
    {
        name: "⚖️ FAIRNESS: Floating Point Precision",
        category: "SCALAR",
        code: `#include <iostream>\nint main() { std::cout << 3.141589 << std::endl; return 0; }`,
        testCases: [{ input: "", expected_output: "3.1416" }],
        expectedStatus: "Accepted",
        minGrade: 10 // Έλεγχος αν ο comparator "συγχωρεί" τη μικρή διαφορά
    }
];

async function runAudit() {
    console.log("🚀 Starting System Integrity Audit...\n");

    for (const scenario of testScenarios) {
        console.log(`Testing: ${scenario.name}`);
        
        try {
            // 1. Προαιρετικός Στατικός Έλεγχος (αν τον έχεις συνδέσει)
            const staticCheck = GradingService.performStaticAnalysis(scenario.code, ["system(", "fork("], []);
            if (!staticCheck.passed) {
                console.log(`   ✅ Static Analysis Blocked it: ${staticCheck.error}`);
                console.log("-----------------------------------\n");
                continue;
            }

            // 2. Εκτέλεση στο Judge0
            const result = await Judge0Service.runBatch(scenario.code, "cpp", scenario.testCases);
            
            const actualStatus = result.details[0].status.description;
            const actualGrade = result.grade;

            // 3. Αξιολόγηση Αποτελέσματος
            let success = true;
            if (scenario.shouldFail && actualStatus === "Accepted") success = false;
            if (scenario.minGrade && actualGrade < scenario.minGrade) success = false;

            if (success) {
                console.log(`   ✅ Result: PASS (Status: ${actualStatus}, Grade: ${actualGrade})`);
            } else {
                console.log(`   ❌ Result: FAIL (Status: ${actualStatus}, Grade: ${actualGrade})`);
                console.log(`      Detail: Expected grade >= ${scenario.minGrade}`);
            }

        } catch (error) {
            console.error(`   ❌ System Error during test:`, error);
        }
        console.log("-----------------------------------\n");
    }
}

runAudit();
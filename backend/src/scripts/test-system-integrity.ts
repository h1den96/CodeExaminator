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
    },
    {
        name: "SEC-01: Macro Obfuscation",
        code: `#define EXEC system\nint main() { EXEC("ls"); return 0; }`,
        testCases: [{ input: "", expected_output: "" }],
        expectBlock: true // Πρέπει να κοπεί από το "system("
    },
    {
        name: "SEC-02: ASM Injection",
        code: `int main() { asm("int $0x80"); return 0; }`,
        testCases: [{ input: "", expected_output: "" }],
        expectBlock: true // Πρέπει να προσθέσουμε το "asm" στα forbidden
    },
    {
        name: "SEC-03: Hex Include Trick",
        code: `#include <\x66\x73\x74\x72\x65\x61\x6d>\nint main() { return 0; }`,
        testCases: [{ input: "", expected_output: "" }],
        expectBlock: true // Έλεγχος αν η ανάλυση πιάνει hex χαρακτήρες
    },
    {
        name: "SEC-04: Process Kill Attempt",
        code: `#include <signal.h>\n#include <unistd.h>\nint main() { kill(getppid(), SIGKILL); return 0; }`,
        testCases: [{ input: "", expected_output: "" }],
        expectBlock: true 
    },

    /* --- ΚΑΤΗΓΟΡΙΑ 2: ΟΡΙΑ ΠΟΡΩΝ (STRESS) --- */
    {
        name: "RES-01: Infinite Loop (TLE)",
        code: `int main() { while(1); return 0; }`,
        testCases: [{ input: "", expected_output: "any" }],
        expectedStatus: "Time Limit Exceeded",
        shouldFail: true
    },
    {
        name: "RES-02: Memory Exhaustion (MLE)",
        code: `#include <vector>\nint main() { std::vector<int> v(1e9, 1); return 0; }`,
        testCases: [{ input: "", expected_output: "any" }],
        expectedStatus: "Memory Limit Exceeded",
        shouldFail: true
    },
    {
        name: "RES-03: Stack Overflow",
        code: `void recurse() { recurse(); }\nint main() { recurse(); return 0; }`,
        testCases: [{ input: "", expected_output: "any" }],
        expectedStatus: "Runtime Error",
        shouldFail: true
    },
    {
        name: "RES-04: Massive Output (OLE)",
        code: `#include <iostream>\nint main() { for(int i=0; i<1000000; i++) std::cout << "SPAM "; return 0; }`,
        testCases: [{ input: "", expected_output: "any" }],
        expectedStatus: "Output Limit Exceeded",
        shouldFail: true
    },

    /* --- ΚΑΤΗΓΟΡΙΑ 3: ΑΡΙΘΜΗΤΙΚΗ & SMART COMPARE --- */
    {
        name: "MATH-01: Scientific Notation",
        code: `#include <iostream>\nint main() { std::cout << 1e2 << std::endl; return 0; }`,
        testCases: [{ input: "", expected_output: "100" }],
        minGrade: 10 // Το smartCompare πρέπει να ξέρει ότι 1e2 == 100
    },
    {
        name: "MATH-02: High Precision Epsilon",
        code: `#include <iostream>\nint main() { std::cout << 0.0000001 << std::endl; return 0; }`,
        testCases: [{ input: "", expected_output: "0" }],
        minGrade: 10 // Έλεγχος αν η ανοχή μας $|a - b| < 10^{-4}$ είναι σωστή
    },
    {
        name: "MATH-03: Negative Zero",
        code: `#include <iostream>\nint main() { std::cout << -0.0 << std::endl; return 0; }`,
        testCases: [{ input: "", expected_output: "0" }],
        minGrade: 10
    },
    {
        name: "MATH-04: Large Integer Precision",
        code: `#include <iostream>\nint main() { std::cout << "9007199254740991" << std::endl; return 0; }`,
        testCases: [{ input: "", expected_output: "9007199254740991" }],
        minGrade: 10
    },

    /* --- ΚΑΤΗΓΟΡΙΑ 4: FORMATTING & EDGE CASES --- */
    {
        name: "FORM-01: Mixed Casing",
        code: `#include <iostream>\nint main() { std::cout << "HeLlO wOrLd" << std::endl; return 0; }`,
        testCases: [{ input: "", expected_output: "hello world" }],
        minGrade: 10 // Η normalizeOutput πρέπει να κάνει lowerCase
    },
    {
        name: "FORM-02: Tabs and Newlines",
        code: `#include <iostream>\nint main() { std::cout << "\\t10\\n\\n20\\t" << std::endl; return 0; }`,
        testCases: [{ input: "", expected_output: "10\\n20" }],
        minGrade: 10
    },
    {
        name: "FORM-03: Empty Output",
        code: `int main() { return 0; }`,
        testCases: [{ input: "", expected_output: "" }],
        minGrade: 10
    },
    {
        name: "FORM-04: Null Characters in Strings",
        code: `#include <iostream>\nint main() { std::cout << "A" << "\\0" << "B"; return 0; }`,
        testCases: [{ input: "", expected_output: "A" }],
        minGrade: 10
    },

    /* --- ΚΑΤΗΓΟΡΙΑ 5: ΣΥΜΠΕΡΙΦΟΡΑ ΣΥΣΤΗΜΑΤΟΣ --- */
    {
        name: "SYS-01: Stderr Redirect",
        code: `#include <iostream>\nint main() { std::cerr << "Error message"; std::cout << "Valid output"; return 0; }`,
        testCases: [{ input: "", expected_output: "Valid output" }],
        minGrade: 10 // Πρέπει να βαθμολογεί μόνο το stdout
    },
    {
        name: "SYS-02: Non-zero Exit Code",
        code: `int main() { return 1; }`,
        testCases: [{ input: "", expected_output: "" }],
        expectedStatus: "Runtime Error (Non-zero exit code)",
        shouldFail: true
    },
    {
        name: "SYS-03: Fast Compilation Stress",
        code: `#include <iostream>\nint main() { std::cout << "Fast"; return 0; }`,
        testCases: [{ input: "", expected_output: "Fast" }],
        minGrade: 10
    },
    {
        name: "SYS-04: Large Input Handling",
        code: `#include <iostream>\n#include <string>\nint main() { std::string s; std::cin >> s; std::cout << s; return 0; }`,
        testCases: [{ input: "a".repeat(1000), expected_output: "a".repeat(1000) }],
        minGrade: 10
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
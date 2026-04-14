import axios from "axios";

const API_URL = "http://localhost:3000/api";
const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo2LCJyb2xlIjoic3R1ZGVudCIsImlhdCI6MTc3NjE3NTIyOCwiZXhwIjoxNzc2MTc2MTI4fQ.guDfeFz7ObFGqTSiMBHn1K632cP9RgyLrOAujTYEyqM"; 
const SUBMISSION_ID = 7;
const QUESTION_ID = 127;

async function testStressAndSecurity() {
    console.log("--- ⚡ STRESS & SECURITY TEST ---");

    const tests = [
        {
            name: "1. Infinite Loop (CPU Timeout)",
            // Στέλνουμε ολόκληρη τη συνάρτηση για να είναι έγκυρη C++
            code: `bool isPrime(int n) { while(true); return false; }`,
            expectedStatus: "Time Limit Exceeded"
        },
        {
            name: "2. Memory Bomb (RAM Exhaustion)",
            code: `#include <vector>\nbool isPrime(int n) { std::vector<long long> v; while(true) v.push_back(42); return false; }`,
            expectedStatus: "Memory Limit Exceeded"
        },
        {
            name: "3. Illegal System Call",
            code: `bool isPrime(int n) { system("ls -la"); return false; }`,
            expectedStatus: "SECURITY_ERROR"
        },
        {
            name: "4. Floating Point Error",
            code: `bool isPrime(int n) { int x = 10 / 0; return false; }`,
            expectedStatus: "Runtime Error"
        },
        {
            name: "5. Massive Output Spam",
            code: `bool isPrime(int n) { for(int i=0; i<1000000; i++) std::cout << "SPAM "; return false; }`,
            expectedStatus: "Output Limit Exceeded"
        },
        {
            name: "6. File Operation Attempt",
            code: `bool isPrime(int n) { FILE *f = fopen("secrets.txt", "w"); return false; }`,
            expectedStatus: "SECURITY_ERROR"
        }
    ];

    for (const t of tests) {
        try {
            console.log(`\nTesting: ${t.name}...`);
            const res = await axios.post(`${API_URL}/submissions/${SUBMISSION_ID}/run`, 
                { question_id: QUESTION_ID, code: t.code },
                { headers: { Authorization: `Bearer ${TOKEN}` } }
            );

            const resData = res.data;
            const firstResult = resData.test_results?.[0];
            
            // Παίρνουμε το κείμενο του status
            const statusObj = firstResult?.status || resData.status;
            const statusText = typeof statusObj === 'string' ? statusObj : (statusObj?.description || "Unknown");

            console.log(`Result: ${statusText}`);

            // Έλεγχος αν πέτυχε το τεστ
            const isExpected = statusText.toLowerCase().includes(t.expectedStatus.toLowerCase()) || 
                               (resData.error && resData.error.includes(t.expectedStatus));

            if (isExpected) {
                console.log("✅ System handled it correctly.");
            } else {
                console.log(`❌ Unexpected behavior. Expected: ${t.expectedStatus}`);
                if (firstResult?.compile_output) {
                    // Ασφαλής αποκωδικοποίηση Base64 για τα σφάλματα
                    const decodedError = Buffer.from(firstResult.compile_output, 'base64').toString('utf-8');
                    console.log("Compile Error Detail:", decodedError);
                }
            }
        } catch (err: any) {
            const errorMsg = err.response?.data?.error || err.message;
            if (errorMsg.includes("SECURITY_ERROR") || errorMsg.includes(t.expectedStatus)) {
                console.log(`Result: ${errorMsg}`);
                console.log("✅ System handled it correctly (Blocked by Backend).");
            } else {
                console.log(`❌ Error: ${errorMsg}`);
            }
        }
    }
}

testStressAndSecurity();
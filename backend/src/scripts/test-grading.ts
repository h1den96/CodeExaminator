import { Pool } from 'pg';
import { SubmissionService } from '../services/submissionService';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const db = new Pool({ connectionString: process.env.DATABASE_URL });

async function runSuperDebug() {
    try {
        console.log("--- 🕵️ SUPER DEBUG MODE STARTING ---");

        // 1. Έλεγχος αν ο Judge0 ακούει
        console.log("Checking Judge0 connection...");
        try {
            const health = await (require('axios')).get(`${process.env.JUDGE0_URL || "http://localhost:2358"}/languages`);
            console.log("✅ Judge0 is ALIVE. Available languages:", health.data.length);
        } catch (e) {
            throw new Error("❌ Judge0 is DOWN or UNREACHABLE! Check your Docker containers.");
        }

        // 2. Reset DB
        console.log("Resetting Submission 77...");
        await db.query("UPDATE exam.submissions SET status='in_progress', started_at=NOW() WHERE submission_id=77");

        const code = `int fib(int n) { return (n <= 1) ? n : fib(n-1) + fib(n-2); }`;

        // 3. Εκτέλεση και εμφάνιση του σφάλματος
        console.log("Calling SubmissionService...");
        const result = await SubmissionService.submitAndGrade(77, "6", db, code);
        
        console.log("✅ SUCCESS! Final Score:", result.final_score);

    } catch (error: any) {
        console.log("\n--- 🛑 ERROR DETECTED ---");
        if (error.response) {
            // Εδώ θα δούμε τι λέει Ο ΙΔΙΟΣ Ο JUDGE0 για το 500άρι
            console.log("STATUS CODE:", error.response.status);
            console.log("ERROR DATA FROM JUDGE0:", JSON.stringify(error.response.data, null, 2));
        } else {
            console.log("ERROR MESSAGE:", error.message);
        }
    } finally {
        await db.end();
    }
}

runSuperDebug();
import { examDb } from "../db/db"; // Adjust path to your db config
import { BoilerplateFactory } from "../services/boilerplateFactory";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

async function runCollisionTest() {
  let questionId: number | null = null;

  try {
    console.log("--- Starting Automated Collision Test ---");

    // 1. Insert Test Question
    const qRes = await examDb.query(`
      INSERT INTO exam.questions (body, difficulty, question_type) 
      VALUES ('AUTOMATED COLLISION TEST', 'easy', 'programming') 
      RETURNING question_id
    `);
    questionId = qRes.rows[0].question_id;

    // 2. Insert Programming Details (SCALAR with a MAIN included)
    const teacherCode = `#include <iostream>\nint main() { return 0; }\nint test(int x) { return x; }`;
    
    await examDb.query(`
      INSERT INTO exam.programming_questions (question_id, category, function_signature, starter_code)
      VALUES ($1, 'SCALAR', 'int test(int x)', $2)
    `, [questionId, teacherCode]);

    console.log(`[INFO] Created Temporary Question ID: ${questionId}`);

    // 3. Simulate the Boilerplate Factory (The "Crime")
    // Note: We use the existing factory BEFORE the fix
    const harness = BoilerplateFactory.createFullHarness('SCALAR', 'int test(int x)');
    const finalCode = harness.replace("// {{STUDENT_CODE}}", teacherCode);

    console.log("\n=== RESULTING CODE (SENT TO COMPILER) ===");
    console.log(finalCode);
    console.log("==========================================\n");

    // 4. Verification Logic
    const mainOccurrences = (finalCode.match(/int main\s*\(/g) || []).length;
    if (mainOccurrences > 1) {
      console.error(`🚨 COLLISION DETECTED: Found ${mainOccurrences} main() functions!`);
      console.log("The compiler will fail with 'redefinition of main'.");
    } else {
      console.log("✅ No collision detected (The factory is already smart).");
    }

  } catch (err) {
    console.error("Test failed:", err);
  } finally {
    if (questionId) {
      console.log(`\n--- Cleaning up Question ID: ${questionId} ---`);
      // Only deletes the specific ID created by this script
      await examDb.query("DELETE FROM exam.questions WHERE question_id = $1", [questionId]);
      console.log("Cleanup complete. Database is back to original state.");
    }
    process.exit();
  }
}

runCollisionTest();
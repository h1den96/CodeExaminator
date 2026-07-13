"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../db/db"); // Adjust path to your db config
const boilerplateFactory_1 = require("../services/boilerplateFactory");
const dotenv = __importStar(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv.config({ path: path_1.default.resolve(__dirname, "../../.env") });
async function runCollisionTest() {
    let questionId = null;
    try {
        console.log("--- Starting Automated Collision Test ---");
        // 1. Insert Test Question
        const qRes = await db_1.examDb.query(`
      INSERT INTO exam.questions (body, difficulty, question_type) 
      VALUES ('AUTOMATED COLLISION TEST', 'easy', 'programming') 
      RETURNING question_id
    `);
        questionId = qRes.rows[0].question_id;
        // 2. Insert Programming Details (SCALAR with a MAIN included)
        const teacherCode = `#include <iostream>\nint main() { return 0; }\nint test(int x) { return x; }`;
        await db_1.examDb.query(`
      INSERT INTO exam.programming_questions (question_id, category, function_signature, starter_code)
      VALUES ($1, 'SCALAR', 'int test(int x)', $2)
    `, [questionId, teacherCode]);
        console.log(`[INFO] Created Temporary Question ID: ${questionId}`);
        // 3. Simulate the Boilerplate Factory (The "Crime")
        // Note: We use the existing factory BEFORE the fix
        const harness = boilerplateFactory_1.BoilerplateFactory.createFullHarness('SCALAR', 'int test(int x)');
        const finalCode = harness.replace("// {{STUDENT_CODE}}", teacherCode);
        console.log("\n=== RESULTING CODE (SENT TO COMPILER) ===");
        console.log(finalCode);
        console.log("==========================================\n");
        // 4. Verification Logic
        const mainOccurrences = (finalCode.match(/int main\s*\(/g) || []).length;
        if (mainOccurrences > 1) {
            console.error(`🚨 COLLISION DETECTED: Found ${mainOccurrences} main() functions!`);
            console.log("The compiler will fail with 'redefinition of main'.");
        }
        else {
            console.log("✅ No collision detected (The factory is already smart).");
        }
    }
    catch (err) {
        console.error("Test failed:", err);
    }
    finally {
        if (questionId) {
            console.log(`\n--- Cleaning up Question ID: ${questionId} ---`);
            // Only deletes the specific ID created by this script
            await db_1.examDb.query("DELETE FROM exam.questions WHERE question_id = $1", [questionId]);
            console.log("Cleanup complete. Database is back to original state.");
        }
        process.exit();
    }
}
runCollisionTest();

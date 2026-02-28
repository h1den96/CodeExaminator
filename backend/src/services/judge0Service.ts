// src/services/judge0Service.ts
import axios from "axios";

// This points to your Docker container
const JUDGE0_URL = process.env.JUDGE0_URL || "http://localhost:2358";

export class Judge0Service {
  
  // Helper to map string languages to Judge0 IDs
  private static getLanguageId(lang: string): number {
    // 54 = C++ (GCC 9.2.0), 71 = Python (3.8.1)
    if (lang === "cpp" || lang === "c++") return 54;
    if (lang === "python") return 71;
    return 54; // Default to C++
  }

  /**
   * 🏃‍♂️ BATCH EXECUTION
   * Runs the code against multiple test cases and calculates a grade.
   */
  static async runBatch(code: string, language: string, testCases: any[]) {
    const langId = this.getLanguageId(language);
    const results: any[] = [];
    let passedCount = 0;

    // 1. Loop through all test cases
    for (const tc of testCases) {
      // Run specific case
      const output = await this.submitCode(langId, code, tc.input);
      
      // Compare Output (Trim whitespace to be safe)
      const expected = (tc.output || "").trim();
      const actual = (output.stdout || "").trim();
      
      // Determine Pass/Fail
      const passed = output.success && (actual === expected);
      
      if (passed) passedCount++;

      results.push({
        input: tc.input,
        expected_output: expected,
        actual_output: actual,
        status: passed ? "Passed" : "Failed",
        stderr: output.stderr,
        compile_output: output.compile_output
      });
    }

    // 2. Calculate Grade (0 to 10 scale)
    const total = testCases.length;
    const grade = total === 0 ? 0 : (passedCount / total) * 10;

    return {
      grade: Math.round(grade * 100) / 100, // Round to 2 decimals
      details: results
    };
  }

  /**
   * Sends single code execution to Judge0
   */
  static async submitCode(languageId: number, code: string, stdin: string = "") {
    try {
      const response = await axios.post(
        `${JUDGE0_URL}/submissions?base64_encoded=true&wait=true`, 
        {
          source_code: Buffer.from(code).toString('base64'),
          language_id: languageId,
          stdin: Buffer.from(stdin).toString('base64'),
          base64_encoded: true
        }
      );

      const result = response.data;
      
      // Status ID 3 means "Accepted"
      const isSuccess = result.status.id === 3;
      
      const decode = (str: string | null) => str ? Buffer.from(str, 'base64').toString('utf-8') : "";

      return {
        success: isSuccess,
        status: result.status.description,
        stdout: decode(result.stdout),
        stderr: decode(result.stderr),
        compile_output: decode(result.compile_output),
        message: result.message
      };

    } catch (error: any) {
      console.error("Judge0 Connection Error:", error.message);
      return {
        success: false,
        status: "System Error",
        stderr: "Could not connect to code execution engine. Is Docker running?",
        stdout: ""
      };
    }
  }
}
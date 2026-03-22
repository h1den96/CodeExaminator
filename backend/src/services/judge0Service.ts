// src/services/judge0Service.ts
import axios from "axios";
import { normalizeOutput } from "../utils/grader";
import { Judge0Result} from "../types/examTypes"; // Import types if needed

const JUDGE0_URL = process.env.JUDGE0_URL || "http://localhost:2358";

export class Judge0Service {
  
  private static getLanguageId(lang: string): number {

    if (lang === "cpp" || lang === "c++") return 54;
    if (lang === "python") return 71;
    return 54; // Default to C++
  }


  static async runBatch(code: string, language: string, testCases: any[], cpuLimit?: number, memLimit?: number) {
    const langId = this.getLanguageId(language);
    const results: any[] = [];
    let passedCount = 0;

    for (const tc of testCases) {
      // 🚀 1. Execute the code
      const output: Judge0Result = await this.submitCode(langId, code, tc.input, cpuLimit, memLimit);
      
      // 🚀 2. Normalize both outputs for a FAIR comparison
      const actualNormalized = normalizeOutput(output.stdout);
      const expectedNormalized = normalizeOutput(tc.output);
      
      // 🚀 3. Determine the specific status
      let finalStatus = "";
      const isAccepted = output.status === "Accepted"; // Judge0 finished within resources
      const logicMatches = actualNormalized === expectedNormalized;

      if (isAccepted && logicMatches) {
        finalStatus = "Passed";
        passedCount++;
      } else if (isAccepted && !logicMatches) {
        finalStatus = "Failed"; // Logic was wrong, but it ran safely
      } else {
        finalStatus = output.status || "Error"; // Pass through TLE, MLE, or Runtime Error
      }

      results.push({
        input: tc.input,
        expected: tc.output, // Keep original for UI display
        actual: output.stdout, // Keep original for UI display
        status: finalStatus,
        stderr: output.stderr,
        compile_output: output.compile_output,
        time: output.time,
        memory: output.memory
      });
    }

    // 🚀 4. Calculate Grade (Partial credit)
    const total = testCases.length;
    const gradeValue = total === 0 ? 0 : (passedCount / total) * 10;

    return {
      grade: Math.round(gradeValue * 100) / 100, 
      details: results
    };
}

  /**
   * Sends single code execution to Judge0
   */
  static async submitCode(
  languageId: number,
  code: string,
  stdin: string = "",
  cpuTimeLimit?: number,
  memoryLimit?: number
): Promise<Judge0Result> { // 👈 Explicit return type
  try {
    const response = await axios.post(
      `${JUDGE0_URL}/submissions?base64_encoded=true&wait=true`, 
      {
        source_code: Buffer.from(code).toString('base64'),
        language_id: languageId,
        stdin: Buffer.from(stdin).toString('base64'),
        base64_encoded: true,
        cpu_time_limit: cpuTimeLimit,
        memory_limit: memoryLimit,
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
      time: result.time || "0.000", // 🚀 Extract time (string like "0.05")
      memory: result.memory || 0,   // 🚀 Extract memory (number in KB)
      message: result.message
    };

  } catch (error: any) {
    console.error("Judge0 Connection Error:", error.message);
    return {
      success: false,
      status: "System Error",
      stderr: "Could not connect to code execution engine.",
      stdout: "",
      compile_output: "",
      time: "0.000",
      memory: 0
    };
  }
}
}
import axios from "axios";
import { normalizeOutput } from "../utils/grader";
import { Judge0Result } from "../types/examTypes";

const JUDGE0_URL = process.env.JUDGE0_URL || "http://localhost:2358";

export class Judge0Service {
  private static getLanguageId(lang: string): number {
    if (lang === "cpp" || lang === "c++") return 54;
    if (lang === "python") return 71;
    return 54; // Default to C++
  }

  static async runBatch(
    code: string,
    language: string,
    testCases: any[],
    cpuLimit?: number,
    memLimit?: number,
  ) {
    const langId = this.getLanguageId(language);
    const results: any[] = [];
    let passedCount = 0;

    for (const tc of testCases) {
      // 1. Execute the code
      const output: Judge0Result = await this.submitCode(
        langId,
        code,
        tc.input || "",
        cpuLimit,
        memLimit,
      );

      // 🚀 FIX: Use 'expected_output' to match your DB column name
      const expectedStr = tc.expected_output || tc.output || "";

      // 2. Normalize both outputs
      const actualNormalized = normalizeOutput(output.stdout);
      const expectedNormalized = normalizeOutput(expectedStr);

      // 3. Logic Comparison
      // Judge0 status is "Accepted" if it didn't crash/timeout
      const isAccepted = output.status === "Accepted";
      const logicMatches = actualNormalized === expectedNormalized;

      // 🚀 FIX: We keep the status as an OBJECT so the Controller can read .description
      const finalStatusObj = {
        id: isAccepted && logicMatches ? 3 : 4, // 3 = Accepted, 4 = Wrong Answer
        description:
          isAccepted && logicMatches
            ? "Accepted"
            : isAccepted
              ? "Wrong Answer"
              : output.status,
      };

      if (isAccepted && logicMatches) {
        passedCount++;
      }

      // 🚀 CRITICAL FIX: Ensure property names match what testController expects
      results.push({
        input: tc.input,
        expected_output: expectedStr,
        stdout: output.stdout, // Controller looks for this!
        status: finalStatusObj, // Controller looks for .status.description
        stderr: output.stderr,
        compile_output: output.compile_output,
        time: output.time,
        memory: output.memory,
      });
    }

    const total = testCases.length || 1;
    const gradeValue = (passedCount / total) * 10;

    return {
      grade: Math.round(gradeValue * 100) / 100,
      details: results,
    };
  }

  static async submitCode(
    languageId: number,
    code: string,
    stdin: string = "",
    cpuTimeLimit?: number,
    memoryLimit?: number,
  ): Promise<Judge0Result> {
    try {
      const response = await axios.post(
        `${JUDGE0_URL}/submissions?base64_encoded=true&wait=true`,
        {
          source_code: Buffer.from(code).toString("base64"),
          language_id: languageId,
          stdin: Buffer.from(stdin).toString("base64"),
          base64_encoded: true,
          cpu_time_limit: cpuTimeLimit,
          memory_limit: memoryLimit,
        },
      );

      const result = response.data;
      const isSuccess = result.status?.id === 3;

      const decode = (str: string | null) =>
        str ? Buffer.from(str, "base64").toString("utf-8").trim() : "";

      return {
        success: isSuccess,
        status: result.status?.description || "Error",
        stdout: decode(result.stdout),
        stderr: decode(result.stderr),
        compile_output: decode(result.compile_output),
        time: result.time || "0.000",
        memory: result.memory || 0,
        message: result.message,
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
        memory: 0,
      };
    }
  }
}

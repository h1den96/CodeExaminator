import axios from "axios";
import { normalizeOutput } from "../utils/grader";
import { Judge0Result } from "../types/examTypes";
import { GradingService } from "./gradingService";

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
      // 1. Εκτέλεση του κώδικα στο Judge0
      const output: Judge0Result = await this.submitCode(
        langId,
        code,
        tc.input || "",
        cpuLimit,
        memLimit,
      );

      const expectedStr = tc.expected_output || tc.output || "";

      // 2. Normalization (Καθαρισμός κενών/αλλαγών γραμμής)
      const actualNormalized = normalizeOutput(output.stdout);
      const expectedNormalized = normalizeOutput(expectedStr);

      // 3. Logic Comparison με Smart Compare 🚀
      // Ελέγχουμε αν η εκτέλεση ήταν επιτυχής ΚΑΙ αν το αποτέλεσμα είναι σωστό (με ανοχή Epsilon)
      const isAcceptedStatus = output.status === "Accepted";
      const logicMatches = GradingService.smartCompare(actualNormalized, expectedNormalized);

      // 4. Δημιουργία του Status Object για τον Controller
      const finalStatusObj = {
        id: isAcceptedStatus && logicMatches ? 3 : 4, // 3=Accepted, 4=Wrong Answer
        description:
          isAcceptedStatus && logicMatches
            ? "Accepted"
            : isAcceptedStatus
              ? "Wrong Answer"
              : output.status, // Διατήρηση του αρχικού σφάλματος (π.χ. TLE, Runtime Error)
      };

      if (isAcceptedStatus && logicMatches) {
        passedCount++;
      }

      // 5. Push των αποτελεσμάτων με τα σωστά property names
      results.push({
        input: tc.input,
        expected_output: expectedStr,
        stdout: output.stdout, 
        status: finalStatusObj, 
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

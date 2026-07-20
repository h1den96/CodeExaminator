import axios from "axios";
import { StructuralAnalysisService, AnalysisRule } from "./structuralAnalysisService";
import { BoilerplateFactory, QuestionCategory } from "./boilerplateFactory";
import { GradingService } from "./gradingService";

const RUNTIME_ENGINE_URL = process.env.JUDGE0_URL || "http://localhost:2358";
const DEFAULT_LANG_ID = 54;

export interface GradingInput {
  studentCode: string;
  testCases: any[];
  points: number;
  category: QuestionCategory;
  signature: string;
  boilerplateCode: string | null;
  structuralRules: AnalysisRule[];
  weightWb?: number;
  weightBb?: number;
  graceMode?: "STRICT" | "STANDARD" | "THRESHOLD";
  graceThreshold?: number;
  graceCap?: number;
  cpuLimit?: number;
  memoryLimit?: number;
  languageId?: number;
}

export interface GradingOutput {
  earnedPoints: number;
  feedback: string;
  details: any[];
  structuralDetails: any[];
  astHealth?: {
    healthIndex: number;
    totalNodes: number;
    errorNodes: number;
  };
}

export class ProgrammingGradingEngine {
  private static safeDecode(str: string | null): string {
    if (!str) return "";
    try {
      return Buffer.from(str, "base64").toString("utf-8");
    } catch (e) {
      return str;
    }
  }

  private static safeEncode(str: string | null): string {
    if (!str) return "";
    return Buffer.from(str).toString("base64");
  }

  private static cleanStudentCode(code: string): string {
    if (!code) return "";

    let sanitized = code
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\/\/.*/g, "");

    const forbiddenPattern = /\b(system|exec|fork|popen|unistd|socket|fopen|fstream|ofstream|ifstream|freopen|remove|rename)\s*\(/i;
    const forbiddenTypes = /\b(FILE|std::fstream|std::ofstream|std::ifstream)\b/;

    if (forbiddenPattern.test(sanitized) || forbiddenTypes.test(sanitized)) {
      throw new Error("SECURITY_ERROR: Access to system or file operations is restricted.");
    }

    return sanitized
      .replace(/^\s*#include\s*[<|"].*[>|"]/gm, "")
      .replace(/^\s*using\s+namespace\s+std\s*;/gm, "")
      .replace(/;\s*;/g, ";")
      .replace(/\{\s*\}/g, "")
      .trim();
  }

  private static sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  static async evaluate(input: GradingInput): Promise<GradingOutput> {
    const {
      studentCode,
      testCases,
      points,
      category,
      signature,
      boilerplateCode,
      structuralRules = [],
      weightWb = 0.2,
      weightBb = 0.8,
      graceMode = "STANDARD",
      graceThreshold = 0.90,
      graceCap = 0.15,
      cpuLimit = 2.0,
      memoryLimit = 128000,
      languageId = DEFAULT_LANG_ID
    } = input;

    // 1. Basic Static Security Scan
    const staticAnalysis = GradingService.performStaticAnalysis(studentCode);
    if (!staticAnalysis.passed) {
      return {
        earnedPoints: 0,
        feedback: "Security violation detected.",
        details: [{
          status: "Security Violation",
          passed: false,
          compile_output: staticAnalysis.error
        }],
        structuralDetails: []
      };
    }

    let cleanedCode = "";
    try {
      cleanedCode = this.cleanStudentCode(studentCode);
    } catch (e: any) {
      return {
        earnedPoints: 0,
        feedback: "Security violation detected during clean pass.",
        details: [{
          status: "Security Violation",
          passed: false,
          compile_output: e.message
        }],
        structuralDetails: []
      };
    }

    // 2. White-Box Track: Dynamic Structural AST Analysis
    const wbResult = await StructuralAnalysisService.analyze(studentCode, structuralRules);
    const S_wb = wbResult.score;

    if (!testCases || testCases.length === 0) {
      throw new Error("No test cases specified for verification.");
    }

    // 3. Prepare Runtime Harness
    const defaultHarness = BoilerplateFactory.createFullHarness(category, signature);
    let finalSourceCode = "";

    if (boilerplateCode && boilerplateCode.trim().length > 0) {
      let activeBoilerplate = boilerplateCode;
      if (activeBoilerplate.includes("// {{STUDENT_CODE}}")) {
        activeBoilerplate = activeBoilerplate.replace("// {{STUDENT_CODE}}", "// [[STUDENT_CODE_ZONE]]");
      }
      if (activeBoilerplate.includes("// [[STUDENT_CODE_ZONE]]")) {
        finalSourceCode = activeBoilerplate.replace("// [[STUDENT_CODE_ZONE]]", cleanedCode);
      } else {
        finalSourceCode = activeBoilerplate + "\n\n" + cleanedCode;
      }
    } else {
      finalSourceCode = defaultHarness.replace("// [[STUDENT_CODE_ZONE]]", cleanedCode);
    }

    const payloads = testCases.map((tc: any) => ({
      source_code: this.safeEncode(finalSourceCode),
      language_id: languageId,
      stdin: this.safeEncode(tc.input || ""),
      expected_output: this.safeEncode(tc.expected_output || tc.expected || ""),
      cpu_time_limit: cpuLimit,
      memory_limit: memoryLimit,
    }));

    // 4. Batch Execution in Sandbox
    const batchResponse = await axios.post(
      `${RUNTIME_ENGINE_URL}/submissions/batch?base64_encoded=true&wait=false`,
      { submissions: payloads }
    );

    let results = batchResponse.data;
    if (!Array.isArray(results)) {
      results = [results];
    }
    const tokens = results.map((r: any) => r.token).join(",");

    let attempts = 0;
    let isDone = false;
    while (attempts < 10 && !isDone) {
      const checkResponse = await axios.get(
        `${RUNTIME_ENGINE_URL}/submissions/batch?tokens=${tokens}&base64_encoded=true&fields=token,stdout,stderr,status,compile_output,memory`
      );
      results = checkResponse.data.submissions;

      if (results.every((r: any) => r.status && r.status.id > 2)) {
        isDone = true;
      } else {
        attempts++;
        await this.sleep(1000 + attempts * 500);
      }
    }

    if (!isDone) {
      throw new Error("Grading timeout from sandbox execution.");
    }

    const firstCompError = results.find((r: any) => r.status?.id === 6);
    let globalCompileLog = "";

    if (firstCompError) {
      try {
        const individualRes = await axios.get(
          `${RUNTIME_ENGINE_URL}/submissions/${firstCompError.token}?base64_encoded=true&fields=token,stdout,stderr,status,compile_output,message`
        );
        if (individualRes.data?.compile_output) {
          globalCompileLog = Buffer.from(individualRes.data.compile_output, "base64").toString("utf-8");
        } else if (individualRes.data?.stderr) {
          globalCompileLog = Buffer.from(individualRes.data.stderr, "base64").toString("utf-8");
        }
      } catch (tokenErr) {
        console.error(tokenErr);
      }
    }

    // 5. Calculate Syntactic Health Index (H_ast)
    const astHealth = StructuralAnalysisService.calculateSyntacticHealth(studentCode);
    const H_ast = astHealth.healthIndex;

    let S_bb = 0.0;
    let feedback = "";
    let cleanDetails: any[] = [];
    const isCompiled = !firstCompError;

    if (!isCompiled) {
      // Compilation Failed Handling (Scenario B & C)
      if (graceMode === "STRICT") {
        S_bb = 0.0;
        feedback = "Compilation failed. Strict Mode active: 0 execution points awarded.";
      } else {
        if (H_ast >= graceThreshold) {
          S_bb = graceCap * H_ast;
          feedback = `Compilation failed. Syntactic grace awarded (${(H_ast * 100).toFixed(1)}% AST Health).`;
        } else {
          S_bb = 0.0;
          feedback = `Compilation failed. AST Health (${(H_ast * 100).toFixed(1)}%) below required grace threshold (${(graceThreshold * 100).toFixed(1)}%).`;
        }
      }

      cleanDetails = results.map(() => ({
        status: "Compilation Error",
        passed: false,
        stdout: "REDACTED",
        expected: "REDACTED",
        stderr: "",
        compile_output: globalCompileLog,
        input: "REDACTED",
        is_public: false,
        weight: 1.0,
        memory_leak: false
      }));

    } else {
      // Successful Compilation Handling (Scenario A)
      let totalTestWeight = 0;
      let earnedTestWeight = 0;
      let hasAnyMemoryLeak = false;

      cleanDetails = results.map((r: any, idx: number) => {
        const actualOutput = this.safeDecode(r.stdout);
        const expectedOutput = testCases[idx].expected_output || testCases[idx].expected || "";
        
        // Weight assignment based on category or explicit test weight
        const tcCategory = testCases[idx].category || "FUNCTIONAL";
        const caseWeight = Number(testCases[idx].weight ?? (tcCategory === "EDGE" ? 5 : tcCategory === "SANITY" ? 1 : 3));
        totalTestWeight += caseWeight;

        const isPassed = GradingService.smartCompare(actualOutput, expectedOutput);
        
        let isMemorySafetyViolation = false;
        const stderrLog = this.safeDecode(r.stderr);
        if (stderrLog.toLowerCase().includes("addresssanitizer") || stderrLog.toLowerCase().includes("leaksanitizer")) {
          isMemorySafetyViolation = true;
          hasAnyMemoryLeak = true;
        }

        if (isPassed) {
          earnedTestWeight += caseWeight;
        }

        return {
          status: isPassed ? "Accepted" : (r.status?.description || "Wrong Answer"),
          passed: isPassed,
          stdout: "REDACTED",
          expected: "REDACTED",
          stderr: isMemorySafetyViolation ? "Memory Safety Violation" : "",
          compile_output: "",
          input: "REDACTED",
          is_public: false,
          weight: caseWeight,
          memory_leak: isMemorySafetyViolation
        };
      });

      let S_bb_raw = totalTestWeight > 0 ? earnedTestWeight / totalTestWeight : 0.0;

      // Apply 10% Memory Leak Penalty if Sanitizer Flags Violations
      if (hasAnyMemoryLeak) {
        S_bb = S_bb_raw * 0.90;
        feedback = `Passed test suites, but a 10% memory safety penalty was applied.`;
      } else {
        S_bb = S_bb_raw;
        feedback = `Passed ${(S_bb * 100).toFixed(0)}% of the functional test suites.`;
      }
    }

    // 6. Master Equation: Final Earned Score Calculation
    const totalRatio = (weightWb * S_wb) + (weightBb * S_bb);
    const finalScore = parseFloat((points * totalRatio).toFixed(2));

    return {
      earnedPoints: finalScore,
      feedback,
      details: cleanDetails,
      structuralDetails: wbResult.details,
      astHealth: {
        healthIndex: H_ast,
        errorNodes: astHealth.errorNodes,
        totalNodes: astHealth.totalNodes
      }
    };
  }
}
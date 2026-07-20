import axios from "axios";
import { StructuralAnalysisService } from "./structuralAnalysisService";
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
  structuralRules: any;
  weightWb?: number;
  weightBb?: number;
  cpuLimit?: number;
  memoryLimit?: number;
  languageId?: number;
}

export interface GradingOutput {
  earnedPoints: number;
  feedback: string;
  details: any[];
  structuralDetails: any[];
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
    // SAFELY eliminate actual empty blocks by checking if braces or semicolons are completely empty
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
      structuralRules = {},
      weightWb = 0.1,
      weightBb = 0.9,
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

    // 2. White-Box Track: Dead-Simple Restriction Filter
    // Only used to catch explicitly forbidden tokens or security flags. No free points.
    const wbResult = await StructuralAnalysisService.analyze(studentCode, structuralRules);
    const hasRuleViolation = wbResult.details.some((d: any) => !d.passed);
    
    let finalWbRatio = 1.0; 
    if (hasRuleViolation) {
      finalWbRatio = 0.0; // Fail the entire 10% gate if they bypass rules/constraints
    }

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

    // 5. Black-Box Track: Direct Execution Analysis
    let totalTestWeight = 0;
    let earnedTestWeight = 0;
    const isCompiled = !firstCompError;

    const cleanDetails = results.map((r: any, idx: number) => {
      const actualOutput = this.safeDecode(r.stdout);
      const expectedOutput = testCases[idx].expected_output || testCases[idx].expected || "";
      const caseWeight = Number(testCases[idx].weight ?? 1.0);
      totalTestWeight += caseWeight;

      const isPassed = r.status?.id === 6 ? false : GradingService.smartCompare(actualOutput, expectedOutput);
      
      let isMemorySafetyViolation = false;
      const stderrLog = this.safeDecode(r.stderr);
      if (stderrLog.toLowerCase().includes("addresssanitizer") || stderrLog.toLowerCase().includes("leaksanitizer")) {
        isMemorySafetyViolation = true;
      }

      if (isPassed) {
        earnedTestWeight += isMemorySafetyViolation ? (caseWeight * 0.9) : caseWeight;
      }

      return {
        status: r.status?.id === 6 ? "Compilation Error" : (isPassed ? "Accepted" : (r.status?.description || "Wrong Answer")),
        passed: isPassed,
        stdout: "REDACTED",
        expected: "REDACTED",
        stderr: isMemorySafetyViolation ? "Memory Safety Violation" : "",
        compile_output: r.status?.id === 6 ? globalCompileLog : "",
        input: "REDACTED",
        is_public: false,
        weight: caseWeight,
        memory_leak: isMemorySafetyViolation
      };
    });

    let bbRatio = 0;
    let feedback = "";

    if (!isCompiled) {
      bbRatio = 0.0; // Broken syntax = 0% execution points. No exceptions, no exploits.
      feedback = "Compilation failed. Execution points denied.";
    } else {
      bbRatio = totalTestWeight > 0 ? earnedTestWeight / totalTestWeight : 0;
      feedback = `Passed ${(bbRatio * 100).toFixed(0)}% of the functional test suites.`;
    }

    if (hasRuleViolation) {
      feedback += " Structural compliance constraints or security tokens violated.";
    }

    // 6. Final Score Combination
    const structuralPointsAwarded = parseFloat((points * weightWb * finalWbRatio).toFixed(2));
    const testScore = bbRatio * (points * weightBb);
    const finalScore = parseFloat((testScore + structuralPointsAwarded).toFixed(2));

    return {
      earnedPoints: finalScore,
      feedback,
      details: cleanDetails,
      structuralDetails: wbResult.details
    };
  }
}
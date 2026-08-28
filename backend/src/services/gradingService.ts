import { StructuralAnalysisService } from "./structuralAnalysisService";

export type QuestionCategory =
  | "SCALAR"
  | "LINEAR"
  | "GRID"
  | "LINKED_LIST"
  | "CUSTOM";

export class GradingService {
  /**
   * 📊 CALCULATE MCQ SCORE
   */
  static calculateMCQ(
    maxPoints: number,
    options: { id: number; weight: number }[],
    selectedIds: number[],
    enableNegative: boolean,
  ): number {
    if (!selectedIds || selectedIds.length === 0) return 0;

    let totalWeight = 0;
    for (const selectedId of selectedIds) {
      const option = options.find((o) => o.id === selectedId);
      if (option) {
        totalWeight += Number(option.weight);
      }
    }

    let finalScore = totalWeight * maxPoints;
    if (finalScore > maxPoints) finalScore = maxPoints;
    if (finalScore < 0) return enableNegative ? finalScore : 0;

    return parseFloat(finalScore.toFixed(2));
  }

  /**
   * ✅ CALCULATE TRUE/FALSE SCORE
   */
  static calculateTrueFalse(
    maxPoints: number,
    studentAnswer: boolean | null,
    correctAnswer: boolean,
    enableNegative: boolean = false,
    penaltyRatio: number = 1.0,
  ): number {
    if (studentAnswer === null || studentAnswer === undefined) return 0;
    if (studentAnswer === correctAnswer) return maxPoints;
    return enableNegative ? -maxPoints * penaltyRatio : 0;
  }

  /**
   * 🧼 REMOVE COMMENTS FROM CODE STRING
   */
  private static stripComments(code: string): string {
    return code.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1');
  }

  /**
   * 🧠 STATIC ANALYSIS
   * Scans code for banned or required keywords safely outside comments.
   */
  static performStaticAnalysis(
    code: string,
    forbidden: string[] = [],
    required: string[] = []
  ): { passed: boolean; error?: string; violationType?: string } {

    if (!code || code.trim().length === 0) {
        return { passed: false, error: "No code submitted." };
    }

    // Clean out all multi-line and single-line comment blocks
    const cleanCode = this.stripComments(code);

    // Normalize spacing to avoid spaces bypass structures like "system   ("
    const normalizedCode = cleanCode.replace(/\s+/g, '');

    // Hardcoded Security Core Definitions
    const systemSecurityList = [
        "system(", "fork(", "fstream", "ifstream", "ofstream",
        "asm", "__asm__", "syscall", "int0x80", "\\x", "__attribute__"
    ];

    const finalForbidden = Array.from(new Set([...forbidden, ...systemSecurityList]));

    // Evaluate Forbidden Statements
    for (const word of finalForbidden) {
        const targetCode = word.includes('(') ? normalizedCode : cleanCode;

        if (targetCode.includes(word)) {
            return {
                passed: false,
                error: `Security/Static Analysis Failed: Forbidden keyword '${word}' detected.`,
                violationType: word
            };
        }
    }

    // Evaluate Required Statements
    if (required && required.length > 0) {
        for (const word of required) {
            if (!cleanCode.includes(word)) {
                return {
                    passed: false,
                    error: `Static Analysis Failed: Missing required keyword '${word}'.`,
                };
            }
        }
    }

    return { passed: true };
  }

  /**
   * ⚖️ SMART LOGICAL COMPARISON
   * Strips out hidden newlines, trailing whitespaces, and normalizes floats.
   */
  static smartCompare(actual: string, expected: string): boolean {
    let cleanActual = actual.replace(/\r/g, "").trim();
    let cleanExpected = expected.replace(/\r/g, "").trim();

    if (cleanActual === cleanExpected) return true;

    // Remove surrounding quotes if present
    if (
        (cleanExpected.startsWith('"') && cleanExpected.endsWith('"')) ||
        (cleanExpected.startsWith("'") && cleanExpected.endsWith("'"))
    ) {
        cleanExpected = cleanExpected.slice(1, -1);
    }

    if (
        (cleanActual.startsWith('"') && cleanActual.endsWith('"')) ||
        (cleanActual.startsWith("'") && cleanActual.endsWith("'"))
    ) {
        cleanActual = cleanActual.slice(1, -1);
    }

    if (cleanActual === cleanExpected) return true;

    // Normalize spacing inside vectors/arrays/lists by stripping all whitespace
    // for structural comparison (e.g., "[1, -1, 0]" vs "[1,-1,0]")
    const strippedActual = cleanActual.replace(/\s+/g, "");
    const strippedExpected = cleanExpected.replace(/\s+/g, "");

    if (strippedActual === strippedExpected) return true;

    const numA = parseFloat(cleanActual);
    const numE = parseFloat(cleanExpected);

    if (!isNaN(numA) && !isNaN(numE)) {
      return Math.abs(numA - numE) < 0.0001;
    }

    return false;
  }
}
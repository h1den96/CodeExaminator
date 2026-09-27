import { StructuralAnalysisService } from "./structuralAnalysisService";

export type QuestionCategory =
  | "SCALAR"
  | "LINEAR"
  | "GRID"
  | "LINKED_LIST"
  | "CUSTOM";

export class GradingService {

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

  private static stripComments(code: string): string {
    return code.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1');
  }

  static performStaticAnalysis(
    code: string,
    forbidden: string[] = [],
    required: string[] = []
  ): { passed: boolean; error?: string; violationType?: string } {

    if (!code || code.trim().length === 0) {
        return { passed: false, error: "No code submitted." };
    }

    const cleanCode = this.stripComments(code);

    const normalizedCode = cleanCode.replace(/\s+/g, '');

    const systemSecurityList = [
        "system(", "fork(", "fstream", "ifstream", "ofstream",
        "asm", "__asm__", "syscall", "int0x80", "\\x", "__attribute__"
    ];

    const finalForbidden = Array.from(new Set([...forbidden, ...systemSecurityList]));

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

  static smartCompare(actual: string, expected: string): boolean {
    let cleanActual = actual.replace(/\r/g, "").trim();
    let cleanExpected = expected.replace(/\r/g, "").trim();

    if (cleanActual === cleanExpected) return true;

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
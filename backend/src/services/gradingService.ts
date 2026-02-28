// src/services/gradingService.ts

export class GradingService {

  /**
   * 📊 CALCULATE MCQ SCORE
   */
  static calculateMCQ(
    maxPoints: number,
    options: { id: number; weight: number }[],
    selectedIds: number[],
    enableNegative: boolean
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
    correctAnswer: boolean
  ): number {
    if (studentAnswer === null || studentAnswer === undefined) return 0;
    return studentAnswer === correctAnswer ? maxPoints : 0;
  }

  /**
   * 🧠 STATIC ANALYSIS (This was missing!)
   * Scans code for banned or required keywords.
   */
  static performStaticAnalysis(code: string, forbidden: string[], required: string[]): { passed: boolean; error?: string } {
    if (!code) return { passed: false, error: "No code submitted." };

    // 1. Check Forbidden Keywords
    if (forbidden && forbidden.length > 0) {
      for (const word of forbidden) {
        if (code.includes(word)) {
           return { passed: false, error: `Static Analysis Failed: Forbidden keyword '${word}' detected.` };
        }
      }
    }

    // 2. Check Required Keywords
    if (required && required.length > 0) {
      for (const word of required) {
        if (!code.includes(word)) {
           return { passed: false, error: `Static Analysis Failed: Missing required keyword '${word}'.` };
        }
      }
    }

    return { passed: true };
  }
}
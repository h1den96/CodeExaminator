// backend/src/services/GradingService.ts

interface Option {
  id: number;
  weight: number;
}

export class GradingService {
  
  /**
   * Calculates the weighted score for an MCQ question.
   */
  static calculateMCQ(
    questionPoints: number,
    options: Option[],
    selectedIds: number[],
    enableNegativeGrading: boolean
  ): number {
    let totalWeight = 0.0;

    selectedIds.forEach((sid) => {
      const opt = options.find((o) => o.id === sid);
      if (opt) {
        // 1. Sum real weights (e.g. +1.0 and -0.5)
        totalWeight += Number(opt.weight);
      }
    });

    // 2. Handle Safe Mode (No Negative Grading)
    if (!enableNegativeGrading) {
        totalWeight = Math.max(0, totalWeight);
    }

    // 3. Cap the top at 100% (1.0)
    totalWeight = Math.min(1, totalWeight);

    return Number((totalWeight * questionPoints).toFixed(2));
  }

  static calculateTrueFalse(
    questionPoints: number,
    studentAnswer: string | boolean | null, // Updated type to handle "true" string from DB
    correctAnswer: boolean
  ): number {
    // Normalize string "true"/"false" to boolean if needed
    const normalizedStudent = String(studentAnswer).toLowerCase() === 'true';
    
    if (normalizedStudent === correctAnswer) {
      return Number(questionPoints);
    }
    return 0;
  }

  // --- NEW: GRADING LOGIC FOR PROGRAMMING ---
  static calculateProgramming(
    questionPoints: number,
    judgeResult: { success: boolean; } | null
  ): number {
    // If Judge0 said "Accepted" (success), give full points.
    // Otherwise give 0.
    if (judgeResult && judgeResult.success) {
        return Number(questionPoints);
    }
    return 0;
  }
}
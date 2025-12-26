// src/services/GradingService.ts

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
        // 1. Always sum the real weights first (e.g. +1.0 and -0.5)
        totalWeight += Number(opt.weight);
      }
    });

    // 2. Handle Safe Mode (No Negative Grading)
    // If disabled, we clamp the bottom at 0.
    // If enabled, we allow the negative total to pass through.
    if (!enableNegativeGrading) {
        totalWeight = Math.max(0, totalWeight);
    }

    // 3. Cap the top at 100% (1.0) 
    // This prevents students from getting > 100% if weights are messy
    totalWeight = Math.min(1, totalWeight);

    // 4. Return Points (rounded to 2 decimals)
    return Number((totalWeight * questionPoints).toFixed(2));
  }

  static calculateTrueFalse(
    questionPoints: number,
    studentAnswer: boolean | null,
    correctAnswer: boolean
  ): number {
    if (studentAnswer === correctAnswer) {
      return Number(questionPoints);
    }
    return 0;
  }
}
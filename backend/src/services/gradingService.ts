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
    enableNegativeGrading: boolean // <--- The Toggle from your Test Settings
  ): number {
    let totalWeight = 0.0;

    selectedIds.forEach((sid) => {
      const opt = options.find((o) => o.id === sid);
      if (opt) {
        const weight = Number(opt.weight);

        // --- THE LOGIC CHANGE ---
        if (enableNegativeGrading) {
            // Mode 1: HARD (Apply everything, even negatives)
            totalWeight += weight;
        } else {
            // Mode 2: EASY (Only count positive weights, ignore penalties)
            if (weight > 0) {
                totalWeight += weight;
            }
            // If weight is negative, we do nothing (effectively 0)
        }
      }
    });

    // Final safety clamp (Standard practice)
    // Even in negative mode, you might not want a question to give -5 points total.
    // Usually, the floor for a question score is 0.
    totalWeight = Math.max(0, totalWeight);

    // Cap at 100% (1.0)
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
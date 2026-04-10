// src/services/gradingService.ts

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
  ): number {
    if (studentAnswer === null || studentAnswer === undefined) return 0;
    return studentAnswer === correctAnswer ? maxPoints : 0;
  }

  /**
   * 🧠 STATIC ANALYSIS (This was missing!)
   * Scans code for banned or required keywords.
   */
  static performStaticAnalysis(
    code: string,
    forbidden: string[] = [],
    required: string[] = []
): { passed: boolean; error?: string; violationType?: string } {
    
    if (!code || code.trim().length === 0) {
        return { passed: false, error: "No code submitted." };
    }

    // 1. Προετοιμασία: Καθαρισμός κώδικα από κενά και tabs
    // Αυτό εμποδίζει bypasses όπως το "system  (" ή "fork  ()"
    const normalizedCode = code.replace(/\s+/g, '');

    // 2. Εσωτερική Λίστα Ασφαλείας (Hardcoded Security Rules)
    // Αυτά τα keywords ελέγχονται ΠΑΝΤΑ για την προστασία του server
    const systemSecurityList = [
        "system(", "fork(", "fstream", "ifstream", "ofstream",
        "asm", "__asm__", "syscall", "int0x80", "\\x", "__attribute__"
    ];

    // Συνδυασμός της λίστας του καθηγητή με τη λίστα ασφαλείας
    const finalForbidden = Array.from(new Set([...forbidden, ...systemSecurityList]));

    // 3. Έλεγχος Απαγορευμένων (Forbidden Keywords)
    for (const word of finalForbidden) {
        // Αν το word περιλαμβάνει παρενθέσεις, τις ελέγχουμε στον normalizedCode
        // Αλλιώς ελέγχουμε στον κανονικό κώδικα (για βιβλιοθήκες π.χ. <fstream>)
        const targetCode = word.includes('(') ? normalizedCode : code;
        
        if (targetCode.includes(word)) {
            return {
                passed: false,
                error: `Security/Static Analysis Failed: Forbidden keyword '${word}' detected.`,
                violationType: word
            };
        }
    }

    // 4. Έλεγχος Απαιτούμενων (Required Keywords)
    // Εδώ χρησιμοποιούμε τον κανονικό κώδικα για να μην έχουμε θέματα με strings
    if (required && required.length > 0) {
        for (const word of required) {
            if (!code.includes(word)) {
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
    const a = actual.trim();
    const e = expected.trim();

    // 1. Strict match
    if (a === e) return true;

    // 2. Numeric Epsilon Check
    // We attempt to convert both to numbers to handle rounding differences
    const numA = parseFloat(a);
    const numE = parseFloat(e);

    if (!isNaN(numA) && !isNaN(numE)) {
      // Use a standard epsilon of 0.0001
      return Math.abs(numA - numE) < 0.0001;
    }

    return false;
  }
}

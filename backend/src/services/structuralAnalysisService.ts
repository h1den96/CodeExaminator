import Parser from "tree-sitter";
// @ts-ignore
import Cpp from "tree-sitter-cpp";

export interface AnalysisRule {
  type: "REQUIRE" | "FORBID";
  target: string;
  description: string;
  weight: number;
  name?: string; 
}

export class StructuralAnalysisService {
  private static parser: Parser;

  private static initParser() {
    if (!this.parser) {
      this.parser = new Parser();
      this.parser.setLanguage(Cpp as any);
    }
  }

  private static calculateCyclomaticComplexity(node: Parser.SyntaxNode): number {
    let complexity = 1;

    const branchingTypes = [
      "if_statement",
      "for_statement",
      "while_statement",
      "do_statement",
      "case_statement",
      "catch_clause",
      "conditional_expression"
    ];
    
    const branches = node.descendantsOfType(branchingTypes);
    complexity += branches.length;

    const binaryExpressions = node.descendantsOfType("binary_expression");
    for (const expr of binaryExpressions) {
      const operatorNode = expr.children[1];
      if (operatorNode && (operatorNode.type === "&&" || operatorNode.type === "||")) {
        complexity++;
      }
    }

    return complexity;
  }

  private static hasMainFunction(node: Parser.SyntaxNode): boolean {
    const functions = node.descendantsOfType("function_definition");
    for (const fn of functions) {
      const nameNode = fn
        .descendantsOfType("identifier")
        .find((n) => n.parent?.type === "function_declarator");

      if (nameNode && nameNode.text === "main") return true;
    }
    return false;
  }

  private static hasPreprocessorDirectives(node: Parser.SyntaxNode): boolean {
    const types = ["preproc_include", "preproc_def", "preproc_function_def"];
    return node.descendantsOfType(types).length > 0;
  }

  static async analyze(
    code: string,
    rules: AnalysisRule[],
  ): Promise<{ score: number; details: any[] }> {
    this.initParser();
    const tree = this.parser.parse(code);
    const root = tree.rootNode;

    // 1. Ελεγχος για "θανατηφορα" σφαλματα (Fatal Gates)
    if (this.hasMainFunction(root)) {
      return { 
        score: 0, 
        details: [{ 
          passed: false, 
          description: "Defining main() is strictly forbidden. The system provides its own entry point." 
        }] 
      };
    }

    if (this.hasPreprocessorDirectives(root)) {
      return { 
        score: 0, 
        details: [{ 
          passed: false, 
          description: "Preprocessor directives (#include, #define) are not allowed. Necessary headers are included by the judge." 
        }] 
      };
    }

    const details: any[] = [];
    let earnedWeight = 0;
    let totalPossibleWeight = 0;

    // 2. Εσωτερικος Ελεγχος Ασφαλειας (Security Gate)
    const forbiddenFunctions = ["system", "fork", "exec", "fopen", "popen", "socket"];
    let securityPassed = true;
    for (const fnName of forbiddenFunctions) {
      if (this.findFunctionCall(root, fnName)) {
        securityPassed = false;
        break;
      }
    }

    details.push({
      type: "FORBID",
      target: "security",
      name: "Security",
      description: "Security Policy Compliance",
      passed: securityPassed,
      weight: 0
    });

    // Αν αποτύχει η ασφάλεια, μηδενίζουμε το WB score ακαριαία
    if (!securityPassed) return { score: 0, details };

    // 3. Υπολογισμος Κυκλωματικής Πολυπλοκότητας (Ενεργό Score)
    const complexityScore = this.calculateCyclomaticComplexity(root);
    const complexityWeight = 30; // Το βάρος που καταλαμβάνει η πολυπλοκότητα στο WB Score
    const complexityThreshold = 15;
    
    totalPossibleWeight += complexityWeight;
    
    // Υπολογισμός κέρδους: 10% ποινή για κάθε μονάδα πάνω από το threshold (15)
    let complexityEarned = complexityWeight;
    if (complexityScore > complexityThreshold) {
      const penaltyPercent = (complexityScore - complexityThreshold) * 0.1; 
      complexityEarned = Math.max(0, complexityWeight * (1 - penaltyPercent));
    }
    earnedWeight += complexityEarned;

    details.push({
      type: "SCORE",
      target: "complexity",
      name: "Cyclomatic Complexity",
      description: `Complexity is ${complexityScore}. Penalty applied if > ${complexityThreshold}.`,
      passed: complexityScore <= complexityThreshold,
      weight: complexityWeight,
      earned: complexityEarned,
      actual_value: complexityScore
    });

    // 4. Ελεγχος των κανονων που ορισε ο καθηγητης
    for (const rule of rules) {
      let passed = false;
      const weight = rule.weight || 0;

      if (weight > 0) totalPossibleWeight += weight;

      if (rule.target === "recursion") {
        passed = this.detectRecursion(root);
      } 
      else if (rule.target === "loop") {
        passed = this.hasLoop(code);
      }
      else if (rule.type === "FORBID" && rule.target === "function_call") {
        const forbiddenName = rule.name || "";
        passed = !this.findFunctionCall(root, forbiddenName);
      }
      else if (rule.type === "REQUIRE" && rule.target === "function_call") {
        const requiredName = rule.name || "";
        passed = this.findFunctionCall(root, requiredName);
      }

      if (passed && weight > 0) earnedWeight += weight;

      details.push({
        type: rule.type,
        target: rule.target,
        name: rule.name,
        description: rule.description,
        passed: passed,
        weight: weight,
      });
    }

    // Τελικός υπολογισμός αναλογίας (0.0 - 1.0)
    const finalRatio = totalPossibleWeight > 0 ? earnedWeight / totalPossibleWeight : 1;

    return { score: finalRatio, details };
  }

  private static detectRecursion(node: Parser.SyntaxNode): boolean {
    const functions = node.descendantsOfType("function_definition");
    for (const fn of functions) {
      const nameNode = fn
        .descendantsOfType("identifier")
        .find((n) => n.parent?.type === "function_declarator");

      if (!nameNode) continue;
      const fnName = nameNode.text;
      const body = fn.children.find((c) => c.type === "compound_statement");

      if (body && this.findFunctionCall(body, fnName)) return true;
    }
    return false;
  }

  private static findFunctionCall(node: Parser.SyntaxNode, name: string): boolean {
    return node.descendantsOfType("call_expression").some((call) => {
      const identifier = call.descendantsOfType("identifier")[0];
      return identifier && identifier.text === name;
    });
  }

  public static hasLoop(code: string): boolean {
    if (!code) return false;
    const loopRegex = /\b(for|while|do)\b/g;
    return loopRegex.test(code);
  }
}
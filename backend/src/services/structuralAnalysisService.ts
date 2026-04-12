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

  /**
   * Ελέγχει αν ο κώδικας περιέχει ορισμό της συνάρτησης main
   */
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

  /**
   * Ελέγχει αν ο κώδικας περιέχει preprocessor directives (#include, #define κλπ)
   */
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

    // 1. Άμεσος έλεγχος για "θανατηφόρα" σφάλματα συρραφής
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

    // 2. Ορισμός μόνιμων κανόνων ασφαλείας (Security Static Analysis)
    const securityRules: AnalysisRule[] = [
      { 
        type: "FORBID", 
        target: "function_call", 
        name: "system", 
        description: "Security: Use of system() is strictly forbidden", 
        weight: 0 
      },
      { 
        type: "FORBID", 
        target: "function_call", 
        name: "fork", 
        description: "Security: Use of fork() is forbidden", 
        weight: 0 
      },
      { 
        type: "FORBID", 
        target: "function_call", 
        name: "exec", 
        description: "Security: Use of exec() functions is forbidden", 
        weight: 0 
      }
    ];

    const allRules = [...rules, ...securityRules];
    const details: any[] = [];
    let earnedWeight = 0;
    let totalPossibleWeight = 0;

    for (const rule of allRules) {
      let passed = false;
      const weight = rule.weight || 0;

      if (weight > 0) totalPossibleWeight += weight;

      // Logic ανάλογα με το target
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
      // Tree-sitter-cpp: Η κλήση μπορεί να είναι identifier ή field_expression (π.χ. std::sort)
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
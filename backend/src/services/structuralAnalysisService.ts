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

  static async analyze(
    code: string,
    rules: AnalysisRule[],
  ): Promise<{ score: number; details: any[] }> {
    this.initParser();
    const tree = this.parser.parse(code);
    const root = tree.rootNode;

    // 1. Ορισμός μόνιμων κανόνων ασφαλείας (Global Security Rules)
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
        name: "exec", 
        description: "Security: Use of exec() functions is forbidden", 
        weight: 0 
      },
      { 
        type: "FORBID", 
        target: "function_call", 
        name: "fork", 
        description: "Security: Use of fork() is forbidden", 
        weight: 0 
      }
    ];

    // Συνδυασμός των ακαδημαϊκών κανόνων της άσκησης με τους κανόνες ασφαλείας
    const allRules = [...rules, ...securityRules];

    const details: any[] = [];
    let earnedWeight = 0;
    let totalPossibleWeight = 0;

    for (const rule of allRules) {
      let passed = false;
      const weight = rule.weight || 0;

      // Υπολογισμός συνολικού βάρους μόνο για κανόνες με weight > 0
      if (weight > 0) {
        totalPossibleWeight += weight;
      }

      // Λογική ελέγχου ανάλογα με τον στόχο (target)
      if (rule.target === "recursion") {
        passed = this.detectRecursion(root);
      } 
      else if (rule.type === "FORBID" && rule.target === "function_call") {
        // Ο κανόνας FORBID πετυχαίνει αν ΔΕΝ βρεθεί η συνάρτηση
        const forbiddenName = rule.name || "pow";
        passed = !this.findFunctionCall(root, forbiddenName);
      }
      else if (rule.type === "REQUIRE" && rule.target === "function_call") {
        // Ο κανόνας REQUIRE πετυχαίνει αν βρεθεί η συνάρτηση
        const requiredName = rule.name;
        passed = !!requiredName && this.findFunctionCall(root, requiredName);
      }

      // Αν ο κανόνας πέρασε και έχει βάρος, πρόσθεσέ το στο σκορ
      if (passed && weight > 0) {
        earnedWeight += weight;
      }

      details.push({
        type: rule.type,
        target: rule.target,
        name: rule.name,
        description: rule.description,
        passed: passed,
        weight: weight,
      });
    }

    const finalRatio = totalPossibleWeight > 0
      ? earnedWeight / totalPossibleWeight
      : 0;

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

      // Αν μέσα στο σώμα της συνάρτησης υπάρχει κλήση προς το όνομα της ίδιας της συνάρτησης
      if (body && this.findFunctionCall(body, fnName)) {
        return true;
      }
    }
    return false;
  }

  private static findFunctionCall(
    node: Parser.SyntaxNode,
    name: string,
  ): boolean {
    return node.descendantsOfType("call_expression").some((call) => {
      const identifier = call.descendantsOfType("identifier")[0];
      return identifier && identifier.text === name;
    });
  }

  public hasLoop(code: string): boolean {
    if (!code) return false;
    // Regex to find 'for', 'while', or 'do' not inside a comment/string
    const loopRegex = /\b(for|while|do)\b/g;
    return loopRegex.test(code);
  }
}
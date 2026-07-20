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

  static calculateSyntacticHealth(code: string): { healthIndex: number; totalNodes: number; errorNodes: number } {
    this.initParser();
    const tree = this.parser.parse(code);
    const root = tree.rootNode;

    let totalNodes = 0;
    let errorNodes = 0;

    function traverse(node: Parser.SyntaxNode) {
      totalNodes++;
      if (node.type === "ERROR" || node.isMissing) {
        errorNodes++;
      }
      for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i);
        if (child) traverse(child);
      }
    }

    traverse(root);

    const healthIndex = totalNodes > 0 ? 1.0 - (errorNodes / totalNodes) : 0.0;
    return { healthIndex, totalNodes, errorNodes };
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

  private static isBodyEmpty(node: Parser.SyntaxNode): boolean {
    const functions = node.descendantsOfType("function_definition");
    if (functions.length === 0) return true;

    for (const fn of functions) {
      const body = fn.children.find((c) => c.type === "compound_statement");
      if (body) {
        const meaningfulChildren = body.children.filter(
          (c) => c.text !== "{" && c.text !== "}"
        );
        if (meaningfulChildren.length > 0) {
          return false;
        }
      }
    }
    return true;
  }

  static async analyze(
    code: string,
    rules: AnalysisRule[],
  ): Promise<{ score: number; details: any[] }> {
    this.initParser();
    const tree = this.parser.parse(code);
    const root = tree.rootNode;

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

    if (this.isBodyEmpty(root)) {
      return {
        score: 0,
        details: [{
          passed: false,
          description: "The function body contains no executable programming statements."
        }]
      };
    }

    const details: any[] = [];
    let earnedWeight = 0;
    let totalPossibleWeight = 0;

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

    if (!securityPassed) return { score: 0, details };

    const complexityScore = this.calculateCyclomaticComplexity(root);
    const complexityWeight = 30; 
    const complexityThreshold = 15;
    totalPossibleWeight += complexityWeight;
    
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

  private static stripComments(code: string): string {
    return code.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1');
  }

  public static hasLoop(studentCode: string): boolean {
    const cleanedCode = this.stripComments(studentCode);
    const loopRegex = /\b(for|while|do)\b/;
    return loopRegex.test(cleanedCode);
  }
}
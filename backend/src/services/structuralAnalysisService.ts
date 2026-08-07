import Parser from "tree-sitter";
// @ts-ignore
import Cpp from "tree-sitter-cpp";

export interface AnalysisRule {
  type: "REQUIRE" | "FORBID";
  target: "recursion" | "loop" | "function_call" | "logarithmic_complexity" | "smart_pointers" | "raw_pointers";
  description: string;
  weight: number;
  name?: string;
}

export class StructuralAnalysisService {
  private static parser: Parser;

  // Cyclomatic complexity of 1 means zero branching (if/for/while/case/&&/||)
  // at all — pure straight-line code. A one-line constant-return stub like
  // `return 0;` scores exactly 1 here, which is <= the penalty threshold, so
  // without this floor it silently earned FULL complexity credit, identical
  // to a correct, well-structured solution. Requiring at least this much
  // complexity means "avoids the penalty" is no longer the same as "did work".
  private static readonly MIN_COMPLEXITY_FOR_CREDIT = 2;

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

  private static hasUsingNamespaceDirective(node: Parser.SyntaxNode): boolean {
    // tree-sitter-cpp parses `using namespace std;` as a using_declaration node.
    // Matching on the 'namespace' keyword in the node text (rather than assuming
    // a specific child structure) so this stays robust across grammar versions —
    // same pattern already used by detectSmartPointers below.
    const usingDecls = node.descendantsOfType("using_declaration");
    return usingDecls.some((u) => /\bnamespace\b/.test(u.text));
  }

  // A body containing only a single "return <literal>;" statement (e.g.
  // `return 0;`, `return false;`, `return nullptr;`) is treated the same as
  // an empty body: it is definitionally a constant-return stub and cannot
  // constitute a real solution to any non-trivial problem. This is checked
  // separately from complexity so that a genuinely correct one-line
  // expression-based solution (e.g. `return n * 2;`, which is NOT a bare
  // literal) is not caught by this rule.
  private static isTrivialLiteralReturn(stmt: Parser.SyntaxNode): boolean {
    if (stmt.type !== "return_statement") return false;
    const text = stmt.text.trim();
    return /^return\s+(-?\d+(\.\d+)?|true|false|nullptr|""|'.')\s*;?$/.test(text);
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

        if (meaningfulChildren.length === 0) {
          // Truly empty body for this function — keep checking others.
          continue;
        }

        const isSingleTrivialReturn =
          meaningfulChildren.length === 1 &&
          this.isTrivialLiteralReturn(meaningfulChildren[0]);

        if (!isSingleTrivialReturn) {
          // This function has real content — the submission as a whole is
          // not considered empty.
          return false;
        }
      }
    }
    // Every function found is either truly empty or a single constant-literal
    // return — i.e. a stub.
    return true;
  }

  private static detectLogarithmicComplexity(node: Parser.SyntaxNode): boolean {
    const updateExpressions = node.descendantsOfType("assignment_expression");
    for (const expr of updateExpressions) {
      const op = expr.children[1]?.text;
      if (op === "/=" || op === ">>=") return true;
    }

    const binaryExprs = node.descendantsOfType("binary_expression");
    for (const expr of binaryExprs) {
      const op = expr.children[1]?.text;
      if (op === "/" || op === ">>") {
        const parent = expr.parent;
        if (parent && (parent.type === "assignment_expression" || parent.type === "init_declarator")) {
          return true;
        }
      }
    }
    return false;
  }

  private static detectSmartPointers(node: Parser.SyntaxNode): boolean {
    const templateTypes = node.descendantsOfType("template_type");
    for (const t of templateTypes) {
      const text = t.text;
      if (text.includes("unique_ptr") || text.includes("shared_ptr") || text.includes("make_unique") || text.includes("make_shared")) {
        return true;
      }
    }
    // `auto p = std::make_unique<T>(...)` never produces a template_type node —
    // only a template_function call node for `make_unique<T>`. Without this
    // check, that (arguably more idiomatic) style was silently invisible to
    // this rule while `std::unique_ptr<T> p = ...` was detected fine.
    const templateFunctions = node.descendantsOfType("template_function");
    for (const t of templateFunctions) {
      const text = t.text;
      if (text.includes("make_unique") || text.includes("make_shared")) {
        return true;
      }
    }
    return false;
  }

  private static detectRawPointers(node: Parser.SyntaxNode): boolean {
    const newExprs = node.descendantsOfType("new_expression");
    const deleteExprs = node.descendantsOfType("delete_expression");
    return newExprs.length > 0 || deleteExprs.length > 0;
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

    if (this.hasUsingNamespaceDirective(root)) {
      return {
        score: 0,
        details: [{
          passed: false,
          description: "Using-namespace directives (e.g. 'using namespace std;') are not allowed. Use explicit std:: qualification."
        }]
      };
    }

    if (this.isBodyEmpty(root)) {
      return {
        score: 0,
        details: [{
          passed: false,
          description: "The function body contains no executable programming statements beyond a constant/stub return."
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

    // Complexity credit now requires a minimum floor of actual branching
    // logic. Previously this term only ever penalized *exceeding* the
    // threshold and otherwise defaulted to full credit — meaning a stub with
    // zero branches (complexity == 1) scored identically to a correct,
    // well-structured solution on this metric.
    let complexityEarned = 0;
    if (complexityScore >= this.MIN_COMPLEXITY_FOR_CREDIT) {
      complexityEarned = complexityWeight;
      if (complexityScore > complexityThreshold) {
        const penaltyPercent = (complexityScore - complexityThreshold) * 0.1;
        complexityEarned = Math.max(0, complexityWeight * (1 - penaltyPercent));
      }
    }
    earnedWeight += complexityEarned;

    details.push({
      type: "SCORE",
      target: "complexity",
      name: "Cyclomatic Complexity",
      description: complexityScore < this.MIN_COMPLEXITY_FOR_CREDIT
        ? "No branching logic detected — complexity credit requires at least minimal control flow."
        : `Complexity is ${complexityScore}. Penalty applied if > ${complexityThreshold}.`,
      passed: complexityScore >= this.MIN_COMPLEXITY_FOR_CREDIT && complexityScore <= complexityThreshold,
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
      else if (rule.target === "logarithmic_complexity") {
        passed = this.detectLogarithmicComplexity(root);
      }
      else if (rule.target === "smart_pointers") {
        passed = this.detectSmartPointers(root);
      }
      else if (rule.target === "raw_pointers") {
        passed = !this.detectRawPointers(root);
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
    // Direct self-calls (f calls f) are one case; mutual/indirect recursion
    // (f calls g, g calls f) is another. Build a call graph across every
    // function defined in the student's code and check reachability back to
    // the starting function, rather than only checking self-calls.
    const functions = node.descendantsOfType("function_definition");
    const funcBodies: Record<string, Parser.SyntaxNode> = {};
    const funcNames: string[] = [];

    for (const fn of functions) {
      const nameNode = fn
        .descendantsOfType("identifier")
        .find((n) => n.parent?.type === "function_declarator");
      const body = fn.children.find((c) => c.type === "compound_statement");
      if (nameNode && body) {
        funcBodies[nameNode.text] = body;
        funcNames.push(nameNode.text);
      }
    }

    const callGraph: Record<string, Set<string>> = {};
    for (const name of funcNames) {
      callGraph[name] = new Set();
      for (const other of funcNames) {
        if (this.findFunctionCall(funcBodies[name], other)) {
          callGraph[name].add(other);
        }
      }
    }

    for (const start of funcNames) {
      const visited = new Set<string>();
      const stack = [...callGraph[start]];
      while (stack.length > 0) {
        const current = stack.pop()!;
        if (current === start) return true;
        if (visited.has(current)) continue;
        visited.add(current);
        for (const next of callGraph[current] || []) {
          stack.push(next);
        }
      }
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
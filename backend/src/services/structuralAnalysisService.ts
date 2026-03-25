import Parser from 'tree-sitter';
import CPP from 'tree-sitter-cpp';

export class StructuralAnalysisService {
  /**
   * Main entry point called by the controller.
   */
  static async analyze(code: string, rules: any[]) {
    const results = {
      score: 0,
      recursion_detected: false,
      details: [] as string[]
    };

    if (!rules || !Array.isArray(rules) || rules.length === 0) {
      return results;
    }

    const parser = new Parser();
    parser.setLanguage(CPP);
    const tree = parser.parse(code);

    for (const ruleObj of rules) {
      if (ruleObj.rule === 'has_recursion') {
        const isRecursive = this.detectRecursion(tree);
        if (isRecursive) {
          results.recursion_detected = true;
          results.score = 1.0; 
          results.details.push("Verified: Function calls itself recursively.");
        } else {
          results.details.push("Logic Error: No recursive call found in function body.");
        }
      }
    }

    return results;
  }

  /**
   * Robust recursion detection using AST queries
   */
  private static detectRecursion(tree: Parser.Tree): boolean {
    // 1. Query to find function definitions and capture the identifier of the name
    // This handles: int func(), int* func(), void func(int x), etc.
    const funcQueryStr = `
      (function_definition
        declarator: (_ 
          declarator: (identifier) @func_name
        )
      ) @func_def
    `;

    const funcQuery = new Parser.Query(CPP, funcQueryStr);
    const funcMatches = funcQuery.matches(tree.rootNode);

    for (const match of funcMatches) {
      const funcDefNode = match.captures.find(c => c.name === 'func_def')?.node;
      const funcNameNode = match.captures.find(c => c.name === 'func_name')?.node;

      if (!funcDefNode || !funcNameNode) continue;

      const funcName = funcNameNode.text;

      // 2. Search for call_expressions inside this specific function's body
      const callQueryStr = `
        (call_expression
          function: (identifier) @call_name
          (#eq? @call_name "${funcName}")
        )
      `;

      const callQuery = new Parser.Query(CPP, callQueryStr);
      const callMatches = callQuery.matches(funcDefNode);

      if (callMatches.length > 0) return true;
    }

    return false;
  }
}
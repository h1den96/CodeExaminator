// 1. Fixed Import: tree-sitter often requires this specific import style in TS
import Parser from 'tree-sitter';
// @ts-ignore - tree-sitter-cpp often lacks types, this is fine
import Cpp from 'tree-sitter-cpp';

export interface AnalysisRule {
    type: 'REQUIRE' | 'FORBID';
    target: string;
    description: string;
    weight: number;
    name?: string; // Added to handle forbidden function names like 'pow'
}

export class StructuralAnalysisService {
    private static parser: Parser;

    private static initParser() {
        if (!this.parser) {
            this.parser = new Parser();
            this.parser.setLanguage(Cpp);
        }
    }

    static async analyze(code: string, rules: AnalysisRule[]): Promise<{ score: number, details: any[] }> {
        this.initParser();
        const tree = this.parser.parse(code);
        const root = tree.rootNode;

        // 2. Fixed 'never[]' error: Explicitly typing the array
        const details: any[] = [];
        let totalScore = 0;

        for (const rule of rules) {
            let passed = false;

            if (rule.target === 'recursion') {
                passed = this.detectRecursion(root);
            } else if (rule.type === 'FORBID' && rule.target === 'function_call') {
                const forbiddenName = rule.name || 'pow';
                passed = !this.findFunctionCall(root, forbiddenName);
            }

            const impact = rule.weight || 0.5;
            // Only add to score if the rule passed
            if (passed) totalScore += impact;

            details.push({
                description: rule.description,
                passed: passed,
                impact: impact
            });
        }

        return { score: totalScore, details };
    }

    private static detectRecursion(node: Parser.SyntaxNode): boolean {
        // Find all function definitions
        const functions = node.descendantsOfType('function_definition');

        for (const fn of functions) {
            // Find the identifier (name) of the function
            const nameNode = fn.descendantsOfType('identifier').find(n => 
                n.parent?.type === 'function_declarator'
            );

            if (!nameNode) continue;
            const fnName = nameNode.text;

            // 3. Fixed 'childBlocks' error: Using .children and checking type
            const body = fn.children.find(c => c.type === 'compound_statement');
            
            if (body && this.findFunctionCall(body, fnName)) {
                return true; 
            }
        }
        return false;
    }

    private static findFunctionCall(node: Parser.SyntaxNode, name: string): boolean {
        return node.descendantsOfType('call_expression').some(call => {
            // Check if any identifier inside the call matches our target name
            const identifier = call.descendantsOfType('identifier')[0];
            return identifier && identifier.text === name;
        });
    }
}
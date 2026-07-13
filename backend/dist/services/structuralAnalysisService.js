"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StructuralAnalysisService = void 0;
const tree_sitter_1 = __importDefault(require("tree-sitter"));
// @ts-ignore
const tree_sitter_cpp_1 = __importDefault(require("tree-sitter-cpp"));
class StructuralAnalysisService {
    static initParser() {
        if (!this.parser) {
            this.parser = new tree_sitter_1.default();
            this.parser.setLanguage(tree_sitter_cpp_1.default);
        }
    }
    static calculateCyclomaticComplexity(node) {
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
    static hasMainFunction(node) {
        const functions = node.descendantsOfType("function_definition");
        for (const fn of functions) {
            const nameNode = fn
                .descendantsOfType("identifier")
                .find((n) => n.parent?.type === "function_declarator");
            if (nameNode && nameNode.text === "main")
                return true;
        }
        return false;
    }
    static hasPreprocessorDirectives(node) {
        const types = ["preproc_include", "preproc_def", "preproc_function_def"];
        return node.descendantsOfType(types).length > 0;
    }
    // New AST helper to verify if any executable logic exists inside the code tree
    static isBodyEmpty(node) {
        const functions = node.descendantsOfType("function_definition");
        if (functions.length === 0)
            return true;
        for (const fn of functions) {
            const body = fn.children.find((c) => c.type === "compound_statement");
            if (body) {
                // Exclude curly braces { and } from token calculation
                const meaningfulChildren = body.children.filter((c) => c.text !== "{" && c.text !== "}");
                if (meaningfulChildren.length > 0) {
                    return false; // Found actual internal statement logic
                }
            }
        }
        return true;
    }
    static async analyze(code, rules) {
        this.initParser();
        const tree = this.parser.parse(code);
        const root = tree.rootNode;
        // 1. Fatal Gates Check
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
        // NEW STRUCTURAL GATE: Zero out scores if no executable content is added
        if (this.isBodyEmpty(root)) {
            return {
                score: 0,
                details: [{
                        passed: false,
                        description: "The function body contains no executable programming statements."
                    }]
            };
        }
        const details = [];
        let earnedWeight = 0;
        let totalPossibleWeight = 0;
        // 2. Security Gate
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
        if (!securityPassed)
            return { score: 0, details };
        // 3. Cyclomatic Complexity Evaluation
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
        // 4. Professor Defined Assessment Processing
        for (const rule of rules) {
            let passed = false;
            const weight = rule.weight || 0;
            if (weight > 0)
                totalPossibleWeight += weight;
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
            if (passed && weight > 0)
                earnedWeight += weight;
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
    static detectRecursion(node) {
        const functions = node.descendantsOfType("function_definition");
        for (const fn of functions) {
            const nameNode = fn
                .descendantsOfType("identifier")
                .find((n) => n.parent?.type === "function_declarator");
            if (!nameNode)
                continue;
            const fnName = nameNode.text;
            const body = fn.children.find((c) => c.type === "compound_statement");
            if (body && this.findFunctionCall(body, fnName))
                return true;
        }
        return false;
    }
    static findFunctionCall(node, name) {
        return node.descendantsOfType("call_expression").some((call) => {
            const identifier = call.descendantsOfType("identifier")[0];
            return identifier && identifier.text === name;
        });
    }
    static stripComments(code) {
        return code.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1');
    }
    static hasLoop(studentCode) {
        // 2. Automatically clean the code incoming from the execution engine
        const cleanedCode = this.stripComments(studentCode);
        // 3. Scan only the executable lines
        const loopRegex = /\b(for|while|do)\b/;
        return loopRegex.test(cleanedCode);
    }
}
exports.StructuralAnalysisService = StructuralAnalysisService;

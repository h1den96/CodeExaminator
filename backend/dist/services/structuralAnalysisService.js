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
    static calculateSyntacticHealth(code) {
        this.initParser();
        const tree = this.parser.parse(code);
        const root = tree.rootNode;
        let totalNodes = 0;
        let errorNodes = 0;
        function traverse(node) {
            totalNodes++;
            if (node.type === "ERROR" || node.isMissing) {
                errorNodes++;
            }
            for (let i = 0; i < node.childCount; i++) {
                const child = node.child(i);
                if (child)
                    traverse(child);
            }
        }
        traverse(root);
        const healthIndex = totalNodes > 0 ? 1.0 - (errorNodes / totalNodes) : 0.0;
        return { healthIndex, totalNodes, errorNodes };
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
    static isBodyEmpty(node) {
        const functions = node.descendantsOfType("function_definition");
        if (functions.length === 0)
            return true;
        for (const fn of functions) {
            const body = fn.children.find((c) => c.type === "compound_statement");
            if (body) {
                const meaningfulChildren = body.children.filter((c) => c.text !== "{" && c.text !== "}");
                if (meaningfulChildren.length > 0) {
                    return false;
                }
            }
        }
        return true;
    }
    static detectLogarithmicComplexity(node) {
        const updateExpressions = node.descendantsOfType("assignment_expression");
        for (const expr of updateExpressions) {
            const op = expr.children[1]?.text;
            if (op === "/=" || op === ">>=")
                return true;
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
    static detectSmartPointers(node) {
        const templateTypes = node.descendantsOfType("template_type");
        for (const t of templateTypes) {
            const text = t.text;
            if (text.includes("unique_ptr") || text.includes("shared_ptr") || text.includes("make_unique") || text.includes("make_shared")) {
                return true;
            }
        }
        return false;
    }
    static detectRawPointers(node) {
        const newExprs = node.descendantsOfType("new_expression");
        const deleteExprs = node.descendantsOfType("delete_expression");
        return newExprs.length > 0 || deleteExprs.length > 0;
    }
    static async analyze(code, rules) {
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
        const details = [];
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
        if (!securityPassed)
            return { score: 0, details };
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
            if (weight > 0)
                totalPossibleWeight += weight;
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
        const cleanedCode = this.stripComments(studentCode);
        const loopRegex = /\b(for|while|do)\b/;
        return loopRegex.test(cleanedCode);
    }
}
exports.StructuralAnalysisService = StructuralAnalysisService;

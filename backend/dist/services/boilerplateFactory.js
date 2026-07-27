"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BoilerplateFactory = void 0;
class BoilerplateFactory {
    static parseSignature(signature) {
        const regex = /(.+?)\s+(\w+)\s*\((.*)\)/;
        const match = signature.match(regex);
        if (!match) {
            throw new Error(`Invalid function signature format: ${signature}`);
        }
        const rawParams = match[3].trim();
        const params = rawParams
            ? rawParams.split(",").map((p) => {
                const parts = p.trim().split(/\s+/);
                const nameWithSymbols = parts.pop() || "";
                const name = nameWithSymbols.replace(/[&*\[\]]/g, "");
                const symbols = nameWithSymbols.match(/[&*\[\]]+/g)?.[0] || "";
                const type = parts.join(" ") + " " + symbols;
                return { type: type.trim(), name: name.trim() };
            })
            : [];
        return {
            returnType: match[1].trim(),
            functionName: match[2].trim(),
            params,
        };
    }
    static getBaseIncludes() {
        return `#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <algorithm>
#include <cmath>
#include <iomanip>
#include <set>
#include <unordered_set>
#include <map>
#include <unordered_map>
#include <queue>
#include <stack>
#include <deque>
#include <list>
#include <functional>

using namespace std;

// Universal Stream Cleaner: Sanitizes JSON array syntax ([1,2,3] -> 1 2 3)
stringstream getCleanInputStream() {
    string raw, line;
    while (getline(cin, line)) {
        raw += line + "\\n";
    }
    // Remove brackets and commas for array/grid parsing
    for (char &c : raw) {
        if (c == '[' || c == ']' || c == ',') {
            c = ' ';
        }
    }
    return stringstream(raw);
}`;
    }
    static createFullHarness(category, signature, existingCode) {
        const baseIncludes = this.getBaseIncludes();
        const marker = `// [[STUDENT_CODE_ZONE]]`;
        if (category === "CUSTOM") {
            return `${baseIncludes}\n\n${marker}\n`;
        }
        if (!signature || signature.trim() === "") {
            return `${baseIncludes}\n\n${marker}\n\nint main() { return 0; }`;
        }
        try {
            const sig = this.parseSignature(signature);
            switch (category) {
                case "SCALAR":
                    return this.generateScalarHarness(baseIncludes, marker, sig);
                case "LINEAR":
                    return this.generateLinearHarness(baseIncludes, marker, sig);
                case "GRID":
                    return this.generateGridHarness(baseIncludes, marker, sig);
                case "LINKED_LIST":
                    return this.generateLinkedListHarness(baseIncludes, marker, sig, existingCode);
                default:
                    return `${baseIncludes}\n\n${marker}\n\nint main() { return 0; }`;
            }
        }
        catch (e) {
            console.error("Harness generation failed:", e);
            return `${baseIncludes}\n\n${marker}\n\nint main() { return 0; }`;
        }
    }
    static generateScalarHarness(includes, marker, sig) {
        const isSingleStringParam = sig.params.length === 1 && sig.params[0].type.includes("string");
        const isFloatOrDouble = sig.returnType.includes("double") || sig.returnType.includes("float");
        const isBool = sig.returnType.trim() === "bool";
        const printRes = (expr) => isBool ? `cout << boolalpha << ${expr} << endl;` : `cout << ${expr} << endl;`;
        if (isSingleStringParam) {
            // Handles string parameters cleanly without line-break quote errors
            return `${includes}\n\n${marker}\n\nint main() {\n    string line, raw;\n    while (getline(cin, line)) {\n        if (!raw.empty()) raw += "\\n";\n        raw += line;\n    }\n    if (raw.length() >= 2 && raw.front() == '\\\"' && raw.back() == '\\\"') {\n        raw = raw.substr(1, raw.length() - 2);\n    }\n    ${sig.returnType === "void" ? `${sig.functionName}(raw);` : printRes(`${sig.functionName}(raw)`)}\n    return 0;\n}`;
        }
        const decls = sig.params.map((p, i) => `${p.type.replace(/[&]/g, "")} p${i};`).join("\n    ");
        const reads = sig.params.map((_, i) => `ss >> p${i}`).join(" && ");
        const args = sig.params.map((_, i) => `p${i}`).join(", ");
        return `${includes}\n\n${marker}\n\nint main() {\n    stringstream ss = getCleanInputStream();\n    ${decls}\n    if (${reads || "true"}) {\n        ${sig.returnType === "void" ? `${sig.functionName}(${args});` : isFloatOrDouble ? `auto res = ${sig.functionName}(${args});\n        cout << fixed << setprecision(1) << res << endl;` : printRes(`${sig.functionName}(${args})`)}\n    }\n    return 0;\n}`;
    }
    static generateLinearHarness(includes, marker, sig) {
        const vectorTypeMatch = sig.params[0]?.type.match(/vector<(.+)>/);
        let innerType = "int";
        if (vectorTypeMatch) {
            innerType = vectorTypeMatch[1].replace(/const|&/g, "").trim();
        }
        const hasExtraParams = sig.params.length > 1;
        const extraDecls = sig.params.slice(1).map((p, i) => `${p.type.replace(/[&]/g, "")} p${i + 1};`).join("\n    ");
        const callArgs = ["v", ...sig.params.slice(1).map((_, i) => `p${i + 1}`)].join(", ");
        const isReturnVector = sig.returnType.includes("vector");
        return `${includes}\n\n${marker}\n\nint main() {\n    stringstream ss = getCleanInputStream();\n    vector<${innerType}> allVals;\n    ${innerType} tempVal;\n    while (ss >> tempVal) {\n        allVals.push_back(tempVal);\n    }\n    \n    ${extraDecls}\n    vector<${innerType}> v;\n    ${hasExtraParams ? `if (!allVals.empty()) {\n        p1 = allVals.back();\n        allVals.pop_back();\n        v = allVals;\n    }` : `v = allVals;`}\n    \n    ${isReturnVector ? `auto res = ${sig.functionName}(${callArgs});\n    cout << "[";\n    for(size_t i=0; i<res.size(); i++) cout << res[i] << (i==res.size()-1 ? "" : ", ");\n    cout << "]" << endl;` : sig.returnType === "void" ? `${sig.functionName}(${callArgs});\n    cout << "[";\n    for(size_t i=0; i<v.size(); i++) cout << v[i] << (i==v.size()-1 ? "" : ", ");\n    cout << "]" << endl;` : `cout << ${sig.functionName}(${callArgs}) << endl;`}\n    return 0;\n}`;
    }
    static generateGridHarness(includes, marker, sig) {
        const gridTypeMatch = sig.params[0]?.type.match(/vector<vector<(.+)>>/);
        const innerType = gridTypeMatch ? gridTypeMatch[1].replace(/const|&/g, "").trim() : "int";
        const extraDecls = sig.params.slice(1).map((p, i) => `${p.type.replace(/[&]/g, "")} p${i + 1};`).join("\n    ");
        const callArgs = ["g", ...sig.params.slice(1).map((_, i) => `p${i + 1}`)].join(", ");
        const isReturnGrid = sig.returnType.includes("vector");
        const isBool = sig.returnType.trim() === "bool";
        const printGrid = `cout << "[";\n    for(size_t i=0; i<g.size(); i++) {\n        cout << "[";\n        for(size_t j=0; j<g[i].size(); j++) cout << g[i][j] << (j==g[i].size()-1 ? "" : ", ");\n        cout << "]" << (i==g.size()-1 ? "" : ", ");\n    }\n    cout << "]" << endl;`;
        return `${includes}\n\n${marker}\n\nint main() {\n    stringstream ss = getCleanInputStream();\n    vector<${innerType}> allVals;\n    ${innerType} val;\n    ${extraDecls}\n    \n    while (ss >> val) {\n        allVals.push_back(val);\n    }\n    \n    if (allVals.empty()) return 0;\n    \n    int total = allVals.size();\n    int dim = sqrt(total);\n    if (dim * dim != total) dim = total;\n    int rows = dim, cols = total / dim;\n    \n    vector<vector<${innerType}>> g(rows, vector<${innerType}>(cols));\n    int idx = 0;\n    for(int i=0; i<rows; i++) {\n        for(int j=0; j<cols; j++) {\n            g[i][j] = allVals[idx++];\n        }\n    }\n    \n    ${isReturnGrid ? `auto res = ${sig.functionName}(${callArgs});\n    cout << "[";\n    for(size_t i=0; i<res.size(); i++) {\n        cout << "[";\n        for(size_t j=0; j<res[i].size(); j++) cout << res[i][j] << (j==res[i].size()-1 ? "" : ", ");\n        cout << "]" << (i==res.size()-1 ? "" : ", ");\n    }\n    cout << "]" << endl;` : sig.returnType === "void" ? `${sig.functionName}(${callArgs});\n    ${printGrid}` : isBool ? `cout << boolalpha << ${sig.functionName}(${callArgs}) << endl;` : `cout << ${sig.functionName}(${callArgs}) << endl;`}\n    return 0;\n}`;
    }
    static generateLinkedListHarness(includes, marker, sig, existingCode) {
        const nodeType = sig.params[0]?.type.replace("*", "").trim() || "Node";
        // Many LINKED_LIST reference solutions define their own struct/class for the
        // node type as part of a self-contained answer. If we detect that, skip our
        // own injection to avoid a "redefinition of struct X" compile error.
        const nodeAlreadyDefined = existingCode
            ? new RegExp(`\\b(struct|class)\\s+${nodeType}\\b`).test(existingCode)
            : false;
        const structDef = nodeAlreadyDefined
            ? ""
            : `struct ${nodeType} {\n    int val;\n    ${nodeType} *next;\n    ${nodeType}(int x) : val(x), next(NULL) {}\n};\n\n`;
        const extraDecls = sig.params.slice(1).map((p, i) => `${p.type.replace(/[&]/g, "")} p${i + 1};`).join("\n    ");
        const callArgs = ["head", ...sig.params.slice(1).map((_, i) => `p${i + 1}`)].join(", ");
        const isBool = sig.returnType.trim() === "bool";
        return `${includes}\n\n${structDef}${marker}\n\n${nodeType}* buildList(const vector<int>& values) {\n    if (values.empty()) return NULL;\n    ${nodeType}* head = new ${nodeType}(values[0]);\n    ${nodeType}* curr = head;\n    for (size_t i = 1; i < values.size(); i++) {\n        curr->next = new ${nodeType}(values[i]);\n        curr = curr->next;\n    }\n    return head;\n}\n\nvoid printList(${nodeType}* head) {\n    while (head) {\n        cout << head->val << (head->next ? " " : "");\n        head = head->next;\n    }\n    cout << endl;\n}\n\nint main() {\n    stringstream ss = getCleanInputStream();\n    vector<int> v;\n    int val;\n    ${extraDecls}\n    \n    while (ss >> val) {\n        v.push_back(val);\n    }\n    \n    ${nodeType}* head = buildList(v);\n    ${sig.returnType.includes("*") ? `${nodeType}* result = ${sig.functionName}(${callArgs}); printList(result);` : sig.returnType === "void" ? `${sig.functionName}(${callArgs}); printList(head);` : isBool ? `cout << boolalpha << ${sig.functionName}(${callArgs}) << endl;` : `cout << ${sig.functionName}(${callArgs}) << endl;`}\n    return 0;\n}`;
    }
}
exports.BoilerplateFactory = BoilerplateFactory;

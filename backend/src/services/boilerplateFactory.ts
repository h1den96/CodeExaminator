export type QuestionCategory =
  | "SCALAR"
  | "LINEAR"
  | "GRID"
  | "LINKED_LIST"
  | "CUSTOM";

interface Param {
  type: string;
  name: string;
}

interface ParsedSignature {
  returnType: string;
  functionName: string;
  params: Param[];
}

export class BoilerplateFactory {
  private static parseSignature(signature: string): ParsedSignature {
    // Regex που αντέχει περισσότερα κενά και ειδικούς χαρακτήρες
    const regex = /(.+?)\s+(\w+)\s*\((.*)\)/;
    const match = signature.match(regex);

    if (!match) {
      throw new Error(`Invalid function signature format: ${signature}`);
    }

    const rawParams = match[3].trim();
    const params: Param[] = rawParams
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

  static createFullHarness(category: QuestionCategory, signature: string): string {
    const baseIncludes = `#include <iostream>\n#include <vector>\n#include <string>\n#include <algorithm>\n#include <cmath>\n#include <iomanip>\n\nusing namespace std;`;
    const marker = `// [[STUDENT_CODE_ZONE]]`;

    if (category === "CUSTOM") {
        return `${baseIncludes}\n\n${marker}\n`;
    }

    // Fallback για κενά signatures από τη βάση
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
                return this.generateLinkedListHarness(baseIncludes, marker, sig);
            default:
                return `${baseIncludes}\n\n${marker}\n\nint main() { return 0; }`;
        }
    } catch (e) {
        console.error("Harness generation failed:", e);
        return `${baseIncludes}\n\n${marker}\n\n// Error parsing signature: ${signature}\nint main() { return 0; }`;
    }
  }

  private static generateScalarHarness(includes: string, marker: string, sig: ParsedSignature): string {
    const decls = sig.params.map((p, i) => `${p.type.replace(/[&]/g, "")} p${i};`).join("\n    ");
    const reads = sig.params.map((_, i) => `p${i}`).join(" >> ");
    const args = sig.params.map((_, i) => `p${i}`).join(", ");

    return `${includes}\n\n${marker}\n\nint main() {\n    ${decls}\n    if (cin >> ${reads}) {\n        ${sig.returnType === "void" ? `${sig.functionName}(${args});` : `auto res = ${sig.functionName}(${args});\n        cout << fixed << setprecision(4) << res << endl;`}\n    }\n    return 0;\n}`;
  }

  private static generateLinearHarness(includes: string, marker: string, sig: ParsedSignature): string {
    // Υποστήριξη και για vector<T> και για T arr[]
    const isCArray = sig.params[0]?.type.includes("[]");
    const vectorTypeMatch = sig.params[0]?.type.match(/vector<(.+)>/);
    
    let innerType = "int";
    if (vectorTypeMatch) innerType = vectorTypeMatch[1].replace(/const|&/g, "").trim();
    else if (isCArray) innerType = sig.params[0].type.replace("[]", "").trim();

    const extraDecls = sig.params.slice(1).map((p, i) => `${p.type.replace(/[&]/g, "")} p${i+1};`).join("\n    ");
    const extraReads = sig.params.length > 1 ? " >> " + sig.params.slice(1).map((_, i) => `p${i+1}`).join(" >> ") : "";
    
    // Αν είναι C-array περνάμε το v.data(), αλλιώς το v
    const firstArg = isCArray ? "v.data()" : "v";
    const callArgs = [firstArg, ...sig.params.slice(1).map((_, i) => `p${i+1}`)].join(", ");

    return `${includes}\n\n${marker}\n\nint main() {\n    int n;\n    if (!(cin >> n)) return 0;\n    vector<${innerType}> v(n);\n    for(int i = 0; i < n; i++) cin >> v[i];\n    ${extraDecls}\n    if (cin ${extraReads} || true) {\n        ${sig.returnType === "void" ? `${sig.functionName}(${callArgs});\n        for(int i=0; i<v.size(); i++) cout << v[i] << (i==v.size()-1 ? "" : " ");\n        cout << endl;` : `cout << ${sig.functionName}(${callArgs}) << endl;`}\n    }\n    return 0;\n}`;
  }

  private static generateGridHarness(includes: string, marker: string, sig: ParsedSignature): string {
    const gridTypeMatch = sig.params[0]?.type.match(/vector<vector<(.+)>>/);
    const innerType = gridTypeMatch ? gridTypeMatch[1].replace(/const|&/g, "").trim() : "int";
    const extraDecls = sig.params.slice(1).map((p, i) => `${p.type.replace(/[&]/g, "")} p${i+1};`).join("\n    ");
    const extraReads = sig.params.length > 1 ? " >> " + sig.params.slice(1).map((_, i) => `p${i+1}`).join(" >> ") : "";
    const callArgs = ["g", ...sig.params.slice(1).map((_, i) => `p${i+1}`)].join(", ");

    return `${includes}\n\n${marker}\n\nint main() {\n    int r, c;\n    if (!(cin >> r >> c)) return 0;\n    vector<vector<${innerType}>> g(r, vector<${innerType}>(c));\n    for(int i=0; i<r; i++) for(int j=0; j<c; j++) cin >> g[i][j];\n    ${extraDecls}\n    if (cin ${extraReads} || true) {\n        ${sig.returnType === "void" ? `${sig.functionName}(${callArgs});` : `cout << ${sig.functionName}(${callArgs}) << endl;`}\n    }\n    return 0;\n}`;
  }

  private static generateLinkedListHarness(includes: string, marker: string, sig: ParsedSignature): string {
    // Αναγνώριση οποιουδήποτε Node structure
    const nodeType = sig.params[0]?.type.replace("*", "").trim() || "ListNode";
    const extraDecls = sig.params.slice(1).map((p, i) => `${p.type.replace(/[&]/g, "")} p${i+1};`).join("\n    ");
    const extraReads = sig.params.length > 1 ? " >> " + sig.params.slice(1).map((_, i) => `p${i+1}`).join(" >> ") : "";
    const callArgs = ["head", ...sig.params.slice(1).map((_, i) => `p${i+1}`)].join(", ");

    return `${includes}\n\nstruct ${nodeType} {\n    int val;\n    ${nodeType} *next;\n    ${nodeType}(int x) : val(x), next(NULL) {}\n};\n\n${marker}\n\n${nodeType}* buildList(const vector<int>& values) {\n    if (values.empty()) return NULL;\n    ${nodeType}* head = new ${nodeType}(values[0]);\n    ${nodeType}* curr = head;\n    for (size_t i = 1; i < values.size(); i++) {\n        curr->next = new ${nodeType}(values[i]);\n        curr = curr->next;\n    }\n    return head;\n}\n\nvoid printList(${nodeType}* head) {\n    while (head) {\n        cout << head->val << (head->next ? " " : "");\n        head = head->next;\n    }\n    cout << endl;\n}\n\nint main() {\n    int n;\n    if (!(cin >> n)) return 0;\n    vector<int> v(n);\n    for(int i=0; i<n; i++) cin >> v[i];\n    ${nodeType}* head = buildList(v);\n    ${extraDecls}\n    if (cin ${extraReads} || true) {\n        ${sig.returnType.includes("*") ? `${nodeType}* result = ${sig.functionName}(${callArgs}); printList(result);` : sig.returnType === "void" ? `${sig.functionName}(${callArgs}); printList(head);` : `cout << ${sig.functionName}(${callArgs}) << endl;`}\n    }\n    return 0;\n}`;
  }
}
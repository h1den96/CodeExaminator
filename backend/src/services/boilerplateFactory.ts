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
  /**
   * Αναλύει το signature και διαχωρίζει τύπους, ονόματα και σύμβολα (&, *).
   */
  private static parseSignature(signature: string): ParsedSignature {
    const regex = /(.+)\s+(\w+)\s*\((.*)\)/;
    const match = signature.match(regex);

    if (!match) {
      throw new Error(`Invalid function signature format: ${signature}`);
    }

    const rawParams = match[3].trim();
    const params: Param[] = rawParams
      ? rawParams.split(",").map((p) => {
          const parts = p.trim().split(/\s+/);
          const nameWithSymbols = parts.pop() || "";
          
          const name = nameWithSymbols.replace(/[&*]/g, ""); 
          const symbols = nameWithSymbols.match(/[&*]+/g)?.[0] || "";
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

  /**
   * Κύρια μέθοδος παραγωγής κώδικα C++
   */
  static createFullHarness(category: QuestionCategory, signature: string): string {
    const baseIncludes = `#include <iostream>
      #include <vector>
      #include <string>
      #include <algorithm>
      #include <cmath>
      #include <iomanip>

      using namespace std;`;

    // 1. Αν είναι CUSTOM, επιστρέφουμε αμέσως χωρίς να αναλύσουμε το signature
    if (category === "CUSTOM") {
        return `${baseIncludes}\n\n// {{STUDENT_CODE}}\n`;
    }

    // 2. Για όλες τις άλλες κατηγορίες, αναλύουμε το signature
    const sig = this.parseSignature(signature);

    const studentFuncHeader = `${sig.returnType} ${sig.functionName}(${sig.params
      .map((p) => `${p.type} ${p.name}`)
      .join(", ")}) {`;

    switch (category) {
      case "SCALAR":
        return this.generateScalarHarness(baseIncludes, studentFuncHeader, sig);
      case "LINEAR":
        return this.generateLinearHarness(baseIncludes, studentFuncHeader, sig);
      case "GRID":
        return this.generateGridHarness(baseIncludes, studentFuncHeader, sig);
      case "LINKED_LIST":
        return this.generateLinkedListHarness(baseIncludes, studentFuncHeader, sig);
      default:
        return `${baseIncludes}\n\n${studentFuncHeader}\n    // {{STUDENT_CODE}}\n}\n\nint main() { return 0; }`;
    }
  }

  /**
   * Template για SCALAR: Υποστηρίζει Ν παραμέτρους
   */
  private static generateScalarHarness(includes: string, header: string, sig: ParsedSignature): string {
    const declarations = sig.params.map((p, i) => `${p.type.replace(/[&]/g, "")} p${i};`).join("\n    ");
    const reads = sig.params.map((_, i) => `p${i}`).join(" >> ");
    const callArgs = sig.params.map((_, i) => `p${i}`).join(", ");

    return `${includes}

${header}
    // {{STUDENT_CODE}}
}

int main() {
    ${declarations}
    if (cin >> ${reads}) {
        ${sig.returnType === "void" 
            ? `${sig.functionName}(${callArgs});` 
            : `auto result = ${sig.functionName}(${callArgs});
        cout << fixed << setprecision(4) << result << endl;`
        }
    }
    return 0;
}
`;
  }

  /**
   * Template για LINEAR: vector<T> + Extra Scalars
   */
  private static generateLinearHarness(includes: string, header: string, sig: ParsedSignature): string {
    const vectorTypeMatch = sig.params[0]?.type.match(/vector<(.+)>/);
    const innerType = vectorTypeMatch ? vectorTypeMatch[1].replace(/const|&/g, "").trim() : "int";

    const extraDecls = sig.params.slice(1).map((p, i) => `${p.type.replace(/[&]/g, "")} p${i+1};`).join("\n    ");
    const extraReads = sig.params.length > 1 
        ? " >> " + sig.params.slice(1).map((_, i) => `p${i+1}`).join(" >> ") 
        : "";
    const callArgs = ["v", ...sig.params.slice(1).map((_, i) => `p${i+1}`)].join(", ");

    return `${includes}

${header}
    // {{STUDENT_CODE}}
}

int main() {
    int n;
    if (!(cin >> n)) return 0;
    vector<${innerType}> v(n);
    for(int i = 0; i < n; i++) cin >> v[i];
    
    ${extraDecls}
    if (cin ${extraReads} || true) { 
        ${sig.returnType === "void" 
            ? `${sig.functionName}(${callArgs});
        for(int i=0; i<v.size(); i++) cout << v[i] << (i==v.size()-1 ? "" : " ");
        cout << endl;` 
            : `cout << ${sig.functionName}(${callArgs}) << endl;`
        }
    }
    return 0;
}
`;
  }

  /**
   * Template για GRID: vector<vector<T>> + Extra Scalars
   */
  private static generateGridHarness(includes: string, header: string, sig: ParsedSignature): string {
    const gridTypeMatch = sig.params[0]?.type.match(/vector<vector<(.+)>>/);
    const innerType = gridTypeMatch ? gridTypeMatch[1].replace(/const|&/g, "").trim() : "int";

    const extraDecls = sig.params.slice(1).map((p, i) => `${p.type.replace(/[&]/g, "")} p${i+1};`).join("\n    ");
    const extraReads = sig.params.length > 1 
        ? " >> " + sig.params.slice(1).map((_, i) => `p${i+1}`).join(" >> ") 
        : "";
    const callArgs = ["g", ...sig.params.slice(1).map((_, i) => `p${i+1}`)].join(", ");

    return `${includes}

${header}
    // {{STUDENT_CODE}}
}

int main() {
    int r, c;
    if (!(cin >> r >> c)) return 0;
    vector<vector<${innerType}>> g(r, vector<${innerType}>(c));
    for(int i=0; i<r; i++)
        for(int j=0; j<c; j++) cin >> g[i][j];

    ${extraDecls}
    if (cin ${extraReads} || true) {
        ${sig.returnType === "void" 
            ? `${sig.functionName}(${callArgs});` 
            : `cout << ${sig.functionName}(${callArgs}) << endl;`
        }
    }
    return 0;
}
`;
  }

  /**
   * Template για LINKED_LIST: struct ListNode + Helpers
   */
  private static generateLinkedListHarness(includes: string, header: string, sig: ParsedSignature): string {
    const extraDecls = sig.params.slice(1).map((p, i) => `${p.type.replace(/[&]/g, "")} p${i+1};`).join("\n    ");
    const extraReads = sig.params.length > 1 ? " >> " + sig.params.slice(1).map((_, i) => `p${i+1}`).join(" >> ") : "";
    const callArgs = ["head", ...sig.params.slice(1).map((_, i) => `p${i+1}`)].join(", ");

    return `${includes}

struct ListNode {
    int val;
    ListNode *next;
    ListNode(int x) : val(x), next(NULL) {}
};

${header}
    // {{STUDENT_CODE}}
}

ListNode* buildList(const vector<int>& values) {
    if (values.empty()) return NULL;
    ListNode* head = new ListNode(values[0]);
    ListNode* curr = head;
    for (size_t i = 1; i < values.size(); i++) {
        curr->next = new ListNode(values[i]);
        curr = curr->next;
    }
    return head;
}

void printList(ListNode* head) {
    while (head) {
        cout << head->val << (head->next ? " " : "");
        head = head->next;
    }
    cout << endl;
}

int main() {
    int n;
    if (!(cin >> n)) return 0;
    vector<int> v(n);
    for(int i=0; i<n; i++) cin >> v[i];
    
    ListNode* head = buildList(v);
    ${extraDecls}
    
    if (cin ${extraReads} || true) {
        ${sig.returnType.includes("ListNode*") 
            ? `ListNode* result = ${sig.functionName}(${callArgs}); printList(result);`
            : sig.returnType === "void"
                ? `${sig.functionName}(${callArgs}); printList(head);`
                : `cout << ${sig.functionName}(${callArgs}) << endl;`
        }
    }
    return 0;
}
`;
  }
}
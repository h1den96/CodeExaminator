export type QuestionCategory =
  | "SCALAR"
  | "LINEAR"
  | "GRID"
  | "LINKED_LIST"
  | "CUSTOM";

interface ParsedSignature {
  returnType: string;
  functionName: string;
  params: string;
}

export class BoilerplateFactory {
  /**
   * Parses a signature like "int fib(int n)" into its components.
   */
  private static parseSignature(signature: string): ParsedSignature {
    const regex = /^([\w<>:]+)\s+(\w+)\s*\((.*)\)$/;
    const match = signature.match(regex);

    if (!match) {
      throw new Error(`Invalid function signature format: ${signature}`);
    }

    return {
      returnType: match[1],
      functionName: match[2],
      params: match[3],
    };
  }

  /**
   * The Master Generator.
   * Creates the full C++ source code for Judge0.
   */
  static createFullHarness(
    category: QuestionCategory,
    signature: string,
  ): string {
    const { returnType, functionName } = this.parseSignature(signature);

    switch (category) {
      case "SCALAR":
        return this.getScalarTemplate(functionName, returnType);
      case "LINEAR":
        return this.getLinearTemplate(functionName, returnType);
      case "CUSTOM":
        return `// CUSTOM BOILERPLATE\n#include <iostream>\n#include <vector>\n#include <string>\n#include <algorithm>\nusing namespace std;\n\n// {{STUDENT_CODE}}\n`;
      default:
        return `// {{STUDENT_CODE}}`;
    }
  }

  private static getScalarTemplate(name: string, ret: string): string {
    return `
#include <iostream>
#include <string>
#include <vector>
#include <algorithm>
#include <cmath>
#include <iomanip>

using namespace std;

// {{STUDENT_CODE}}

int main() {
    cout << "NODE_STARTED" << endl; // Debug flag 1
    int val;
    if (cin >> val) {
        cout << "INPUT_RECEIVED:" << val << endl; // Debug flag 2
        auto result = fib(val);
        cout << result << endl; 
    } else {
        cout << "NO_INPUT_FOUND" << endl; // Debug flag 3
    }
    return 0;
}
`;
  }

  private static getLinearTemplate(name: string, ret: string): string {
    return `
#include <iostream>
#include <vector>
#include <string>
#include <algorithm>

using namespace std;

// {{STUDENT_CODE}}

int main() {
    // Standard Linear Wrapper
    // Reads size then N elements
    int size;
    if (cin >> size) {
        vector<int> v(size);
        for(int i = 0; i < size; i++) {
            cin >> v[i];
        }
        
        ${ret === "void" 
            ? `${name}(v);` 
            : `auto result = ${name}(v);`
        }
        
        ${ret === "void"
            ? `for(int i = 0; i < v.size(); i++) {
                 cout << v[i] << (i == v.size() - 1 ? "" : " ");
               }
               cout << endl;`
            : `cout << result << endl;`
        }
    }
    return 0;
}
`;
  }
}
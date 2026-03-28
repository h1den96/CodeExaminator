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
        return `// CUSTOM BOILERPLATE\n#include <iostream>\nusing namespace std;\n\n// {{STUDENT_CODE}}\n`;
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

using namespace std;

// {{STUDENT_CODE}}

int main() {
    // Standard Scalar Wrapper
    // Reads from stdin, calls the student function, prints to stdout
    int val;
    while (cin >> val) {
        auto result = ${name}(val);
        cout << result << " ";
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
    while (cin >> size) {
        vector<int> v(size);
        for(int i = 0; i < size; i++) cin >> v[i];
        
        ${ret === "void" ? `${name}(v);` : `auto result = ${name}(v);`}
        
        ${
          ret === "void"
            ? `for(int x : v) cout << x << " ";`
            : `cout << result;`
        }
        cout << endl;
    }
    return 0;
}
`;
  }
}

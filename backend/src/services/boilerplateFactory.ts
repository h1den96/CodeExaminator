export type QuestionCategory =
  | "SCALAR"
  | "LINEAR"
  | "GRID"
  | "LINKED_LIST"
  | "CUSTOM"
  | "TREE"
  | "STRUCT"
  | "CLASS";

interface ParsedParam {
  rawType: string;
  cleanType: string;
  name: string;
  isReference: boolean;
  isVector: boolean;
  isGrid: boolean;
  isLinkedList: boolean;
  isVectorOfNodes: boolean;
  isPointer: boolean;
  isDoublePointer: boolean;
  isFunctionPointer: boolean;
  funcPtrReturnPart: string;
  funcPtrArgsPart: string;
}

interface StructField {
  type: string;
  name: string;
  isPublic: boolean;
}

interface ParsedSignature {
  returnType: string;
  functionName: string;
  params: ParsedParam[];
}

export class BoilerplateFactory {
  public static getBaseIncludes(studentCode: string = ""): string {
    let includes = `#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <algorithm>
#include <cmath>
#include <map>
#include <set>
#include <unordered_map>
#include <unordered_set>
#include <queue>
#include <deque>
#include <stack>
#include <list>
#include <memory>
#include <utility>
#include <iomanip>
#include <cstring>
#include <cctype>
#include <functional>

using namespace std;
`;

    includes += BoilerplateFactory.injectKnownStructSupport(
      studentCode,
      "Point2D",
      `struct Point2D {
    int x, y;
    Point2D(int x = 0, int y = 0) : x(x), y(y) {}
};`,
      `inline istream& operator>>(istream& is, Point2D& p) {
    while (is.peek() != EOF && !isdigit(is.peek()) && is.peek() != '-') is.get();
    is >> p.x;
    while (is.peek() != EOF && !isdigit(is.peek()) && is.peek() != '-') is.get();
    is >> p.y;
    return is;
}

inline ostream& operator<<(ostream& os, const Point2D& p) {
    os << "(" << p.x << ", " << p.y << ")";
    return os;}`
    );

    includes += BoilerplateFactory.injectKnownStructSupport(
      studentCode,
      "Pixel",
      `struct Pixel {
    int r, g, b;
    Pixel(int r = 0, int g = 0, int b = 0) : r(r), g(g), b(b) {}
};`,
      `inline istream& operator>>(istream& is, Pixel& p) {
    while (is.peek() != EOF && !isdigit(is.peek()) && is.peek() != '-') is.get();
    is >> p.r;
    while (is.peek() != EOF && !isdigit(is.peek()) && is.peek() != '-') is.get();
    is >> p.g;
    while (is.peek() != EOF && !isdigit(is.peek()) && is.peek() != '-') is.get();
    is >> p.b;
    return is;
}

inline ostream& operator<<(ostream& os, const Pixel& p) {
    os << "(" << p.r << ", " << p.g << ", " << p.b << ")";
    return os;}`
    );

    includes += `
inline void skipDelimiter(istream& is) {
    while (is.peek() != EOF) {
        int c = is.peek();
        if (isspace(static_cast<unsigned char>(c)) || c == ',') {
            is.get();
        } else {
            break;
        }
    }
}

inline istream& readQuotedString(istream& is, string& s) {
    skipDelimiter(is);
    if (is.peek() == '"' || is.peek() == '\\'') {
        char q = is.get();
        s.clear();
        while (is.peek() != EOF && is.peek() != q) {
            s += static_cast<char>(is.get());
        }
        if (is.peek() == q) is.get();
    } else {
        s.clear();
        while (is.peek() != EOF) {
            int c = is.peek();
            if (isspace(static_cast<unsigned char>(c)) || c == ',') break;
            s += static_cast<char>(is.get());
        }
    }
    return is;
}

template <typename T, typename = void>
struct is_streamable : std::false_type {};

template <typename T>
struct is_streamable<T, std::void_t<decltype(std::declval<std::ostream&>() << std::declval<T>())>> : std::true_type {};

template <typename T>
typename std::enable_if<is_streamable<T>::value, void>::type
formatValue(ostream& os, const T& val) {
    os << val;
}

template <typename T>
typename std::enable_if<!is_streamable<T>::value, void>::type
formatValue(ostream& os, const T& val) {
    os << "[object]";
}

inline void formatValue(ostream& os, double val) {
    os << fixed << setprecision(1) << val;
}

inline void formatValue(ostream& os, float val) {
    os << fixed << setprecision(1) << val;
}

template <typename T>
ostream& operator<<(ostream& os, const vector<T>& v) {
    os << "[";
    for (size_t i = 0; i < v.size(); ++i) {
        formatValue(os, v[i]);
        if (i + 1 < v.size()) os << ", ";
    }
    os << "]";
    return os;
}

template <typename T>
istream& operator>>(istream& is, vector<T>& v) {
    v.clear();
    skipDelimiter(is);
    if (is.peek() != '[') {
        is.setstate(ios::failbit);
        return is;
    }
    is.get();
    skipDelimiter(is);
    if (is.peek() == ']') {
        is.get();
        return is;
    }
    while (true) {
        skipDelimiter(is);
        T val;
        if (!(is >> val)) {
            is.setstate(ios::failbit);
            return is;
        }
        v.push_back(val);
        skipDelimiter(is);
        if (is.peek() == ']') {
            is.get();
            break;
        }
    }
    return is;
}
`;
    return includes;
  }

  private static injectKnownStructSupport(
    studentCode: string,
    typeName: string,
    structDef: string,
    operators: string
  ): string {
    const hasStruct = new RegExp(`\\b(?:struct|class)\\s+${typeName}\\b`).test(studentCode);
    if (hasStruct) return "";
    return `\n${structDef}\n\n${operators}\n`;
  }

  private static getPostStudentCodeSupport(studentCode: string): string {
    let out = "";
    out += BoilerplateFactory.getDynamicStructSupport(studentCode);
    return out;
  }

  private static findTopLevelFunctions(code: string): string[] {
    const names: string[] = [];
    const re = /(?:^|\n)\s*(?:inline\s+)?(?:[a-zA-Z_]\w*[\s*&]+)+([a-zA-Z_]\w*)\s*\([^)]*\)\s*\{/g;
    let m: RegExpExecArray | null;
    const reserved = new Set(["if", "while", "for", "switch", "return", "main"]);
    while ((m = re.exec(code)) !== null) {
      if (!reserved.has(m[1])) {
        names.push(m[1]);
      }
    }
    return names;
  }

  private static findClassForMethod(code: string, methodName: string): string | null {
    const structs = BoilerplateFactory.findTopLevelStructs(code);
    for (const s of structs) {
      if (new RegExp(`\\b${methodName}\\s*\\(`).test(s.body)) {
        return s.name;
      }
    }
    return null;
  }

  private static findTopLevelStructs(code: string): { kind: string; name: string; body: string }[] {
    const results: { kind: string; name: string; body: string }[] = [];
    const re = /\b(struct|class)\s+([A-Za-z_]\w*)\s*(?:\:[^{]*)?\{/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(code)) !== null) {
      const kind = m[1];
      const name = m[2];
      const bodyStart = re.lastIndex;
      let depth = 1;
      let i = bodyStart;
      for (; i < code.length; i++) {
        if (code[i] === "{") depth++;
        else if (code[i] === "}") {
          depth--;
          if (depth === 0) break;
        }
      }
      if (depth !== 0) break;
      const body = code.substring(bodyStart, i);
      results.push({ kind, name, body });
      re.lastIndex = i + 1;
    }
    return results;
  }

  private static splitTopLevel(str: string, sep: string): string[] {
    const result: string[] = [];
    let current = "";
    let depth = 0;
    for (let i = 0; i < str.length; i++) {
      const c = str[i];
      if (c === "(" || c === "[" || c === "{" || c === "<") depth++;
      else if (c === ")" || c === "]" || c === "}" || c === ">") depth--;
      if (c === sep && depth === 0) {
        result.push(current);
        current = "";
      } else {
        current += c;
      }
    }
    if (current.length) result.push(current);
    return result;
  }

  private static parseStructFields(kind: string, body: string): StructField[] {
    const statements = BoilerplateFactory.splitTopLevel(body, ";");
    const fields: StructField[] = [];
    let currentAccess = kind === "class" ? "private" : "public";

    for (const raw of statements) {
      let stmt = raw.trim();
      if (!stmt) continue;

      const lines = stmt.split(/\n+/);
      let cleanStmtLines: string[] = [];

      for (const line of lines) {
        const trimmedLine = line.trim();
        const accessMatch = trimmedLine.match(/^(public|private|protected)\s*:/);
        if (accessMatch) {
          currentAccess = accessMatch[1];
          const remainder = trimmedLine.replace(/^(public|private|protected)\s*:\s*/, "").trim();
          if (remainder) cleanStmtLines.push(remainder);
        } else {
          if (trimmedLine) cleanStmtLines.push(trimmedLine);
        }
      }

      stmt = cleanStmtLines.join(" ").trim();
      if (!stmt) continue;
      if (stmt.includes("(")) continue;
      if (/^(using|typedef|friend|static\b|constexpr\b)/.test(stmt)) continue;

      const declarators = BoilerplateFactory.splitTopLevel(stmt, ",").map((s) => s.trim());
      if (declarators.length === 0) continue;

      const firstTokens = declarators[0].split(/\s+/).filter(Boolean);
      if (firstTokens.length < 2) continue;
      const firstName = firstTokens.pop() as string;
      const type = firstTokens.join(" ");

      const allNameTokens = [firstName, ...declarators.slice(1)];
      for (let n of allNameTokens) {
        n = n.trim();
        const eq = n.indexOf("=");
        if (eq !== -1) n = n.substring(0, eq).trim();
        n = n.replace(/\[[^\]]*\]/g, "");
        const starMatch = n.match(/^(\*+)?([A-Za-z_]\w*)$/);
        if (!starMatch) continue;
        fields.push({ 
          type: type + (starMatch[1] || ""), 
          name: starMatch[2],
          isPublic: currentAccess === "public"
        });
      }
    }
    return fields;
  }

  private static isNumericFieldType(type: string): boolean {
    const NUMERIC_WORDS = new Set(["unsigned", "signed", "short", "long", "int", "float", "double", "bool"]);
    const words = type.trim().split(/\s+/);
    return words.length > 0 && words.every((w) => NUMERIC_WORDS.has(w));
  }

  private static isStringFieldType(type: string): boolean {
    const t = type.trim();
    return t === "string" || t === "std::string";
  }

  private static generateStructOperators(name: string, fields: StructField[]): string {
    const printablePublicFields = fields.filter(
      (f) => f.isPublic && !f.type.includes("*") && (BoilerplateFactory.isNumericFieldType(f.type) || BoilerplateFactory.isStringFieldType(f.type))
    );

    if (printablePublicFields.length === 0) {
      return `
inline istream& operator>>(istream& is, ${name}&) { return is; }
inline ostream& operator<<(ostream& os, const ${name}&) { os << "[object]"; return os; }
`;
    }

    const readLines: string[] = [];
    printablePublicFields.forEach((f, idx) => {
      const t = f.type.trim();
      if (BoilerplateFactory.isNumericFieldType(t)) {
        readLines.push(
          `    while (is.peek() != EOF && !isdigit(is.peek()) && is.peek() != '-') is.get();\n    is >> obj.${f.name};`
        );
      } else if (BoilerplateFactory.isStringFieldType(t)) {
        readLines.push(`    readQuotedString(is, obj.${f.name});`);
      } else {
        readLines.push(`    { string skip_${idx}; readQuotedString(is, skip_${idx}); }`);
      }
    });

    const printLines = printablePublicFields
      .map((f, i) => `    formatValue(os, obj.${f.name});${i + 1 < printablePublicFields.length ? ' os << ", ";' : ""}`)
      .join("\n");

    return `
inline istream& operator>>(istream& is, ${name}& obj) {
${readLines.join("\n")}
    return is;
}

inline ostream& operator<<(ostream& os, const ${name}& obj) {
    os << "{";
${printLines}
    os << "}";
    return os;
}
`;
  }

  private static getDynamicStructSupport(studentCode: string): string {
    const structs = BoilerplateFactory.findTopLevelStructs(studentCode);
    let out = "";

    for (const s of structs) {
      const hasExtractOperator = new RegExp(`operator\\s*>>\\s*\\([^)]*\\b${s.name}\\b`).test(studentCode);
      if (hasExtractOperator) continue;

      const fields = BoilerplateFactory.parseStructFields(s.kind, s.body);
      out += BoilerplateFactory.generateStructOperators(s.name, fields);
    }

    return out;
  }

  public static getNodeDefinition(studentCode: string): string {
    const hasNodeDef = /\bstruct\s+Node\b|\bclass\s+Node\b/.test(studentCode);
    if (hasNodeDef) return "";

    return `
struct Node {
    int val;
    int data;
    Node* next;
    Node() : val(0), data(0), next(nullptr) {}
};
`;
  }

  public static getLinkedListHelpers(): string {
    return `
inline Node* buildList(const vector<int>& vals) {
    if (vals.empty()) return nullptr;
    Node* head = nullptr;
    Node* tail = nullptr;
    for (int v : vals) {
        Node* n = new Node();
        *(reinterpret_cast<int*>(n)) = v;
        n->next = nullptr;
        if (!head) {
            head = n;
            tail = n;
        } else {
            tail->next = n;
            tail = n;
        }
    }
    return head;
}

inline vector<int> listToVector(Node* head) {
    vector<int> result;
    while (head) {
        result.push_back(*(reinterpret_cast<int*>(head)));
        head = head->next;
    }
    return result;
}

inline ostream& operator<<(ostream& os, const Node* head) {
    os << listToVector(const_cast<Node*>(head));
    return os;
}
`;
  }

  public static parseCppSignature(signature: string): ParsedSignature {
    const sanitized = signature
      .replace(/#include\s*<[^>]+>/g, "")
      .replace(/using\s+namespace\s+std\s*;/g, "")
      .trim();

    const firstParen = sanitized.indexOf("(");
    const lastParen = sanitized.lastIndexOf(")");

    if (firstParen === -1 || lastParen === -1) {
      throw new Error(`Invalid C++ function signature: ${signature}`);
    }

    const declHeader = sanitized.substring(0, firstParen).trim();
    const paramListStr = sanitized.substring(firstParen + 1, lastParen).trim();

    const headerTokens = declHeader.split(/\s+/);
    let functionName = headerTokens.pop() || "";
    
    const pointerMatch = functionName.match(/^(\*+)(.+)$/);
    let extraStars = "";
    if (pointerMatch) {
      extraStars = pointerMatch[1];
      functionName = pointerMatch[2];
    }

    const returnType = headerTokens.join(" ") + extraStars;
    const params: ParsedParam[] = [];

    if (paramListStr.length > 0) {
      const rawParams = BoilerplateFactory.splitParams(paramListStr);
      for (let i = 0; i < rawParams.length; i++) {
        let p = rawParams[i].trim();

        const defaultEqIndex = p.indexOf("=");
        if (defaultEqIndex !== -1) {
          p = p.substring(0, defaultEqIndex).trim();
        }

        let rawType = p;
        let name = `p${i}`;
        let isFunctionPointer = false;
        let funcPtrReturnPart = "";
        let funcPtrArgsPart = "";

        const funcPtrMatch = p.match(/^(.*?)\(\s*\*\s*([a-zA-Z_]\w*)?\s*\)\s*\((.*)\)$/);
        if (funcPtrMatch) {
          funcPtrReturnPart = funcPtrMatch[1].trim();
          funcPtrArgsPart = funcPtrMatch[3].trim();
          name = funcPtrMatch[2] || `p${i}`;
          rawType = `${funcPtrReturnPart}(*)(${funcPtrArgsPart})`;
          isFunctionPointer = true;
        } else {
          const tokens = p.split(/\s+/);
          if (tokens.length > 1) {
            const lastToken = tokens[tokens.length - 1];
            const match = lastToken.match(/^([*&]*)([a-zA-Z_][a-zA-Z0-9_]*)$/);
            if (match) {
              const attachedSymbols = match[1];
              name = match[2];
              tokens.pop();
              rawType = tokens.join(" ") + attachedSymbols;
            }
          }
        }

        const isReference = rawType.includes("&");
        const cleanType = rawType
          .replace(/\bconst\b/g, "")
          .replace(/&/g, "")
          .replace(/\s+/g, " ")
          .replace(/\s*\*\s*/g, "*")
          .trim();

        const isGrid = cleanType.includes("vector<vector<");
        const isVectorOfNodes = cleanType.includes("vector<Node*>");
        const isVector = cleanType.includes("vector<") && !isGrid && !isVectorOfNodes;
        const isLinkedList = cleanType.includes("Node*") && !isVectorOfNodes;
        const isDoublePointer = cleanType.includes("**");
        const isPointer = (cleanType.includes("*") || isDoublePointer || cleanType.includes("(*)")) && !isLinkedList && !isVectorOfNodes && !isFunctionPointer;

        params.push({ 
          rawType, 
          cleanType, 
          name, 
          isReference, 
          isVector, 
          isGrid, 
          isLinkedList, 
          isVectorOfNodes, 
          isPointer, 
          isDoublePointer, 
          isFunctionPointer, 
          funcPtrReturnPart, 
          funcPtrArgsPart 
        });
      }
    }

    return { returnType, functionName, params };
  }

  private static splitParams(paramStr: string): string[] {
    const result: string[] = [];
    let current = "";
    let angleDepth = 0;
    let parenDepth = 0;

    for (let i = 0; i < paramStr.length; i++) {
      const char = paramStr[i];
      if (char === "<") angleDepth++;
      else if (char === ">") angleDepth--;
      else if (char === "(") parenDepth++;
      else if (char === ")") parenDepth--;

      if (char === "," && angleDepth === 0 && parenDepth === 0) {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    if (current.trim()) {
      result.push(current);
    }
    return result;
  }

  public static generateHarness(
    studentCode: string,
    signatureStr: string,
    customBoilerplate?: string | null,
    category?: string | null
  ): string {
    const baseIncludes = BoilerplateFactory.getBaseIncludes(studentCode);
    const postStudentSupport = BoilerplateFactory.getPostStudentCodeSupport(studentCode);

    if (/\bint\s+main\s*\(/.test(studentCode)) {
      return `${baseIncludes}\n\n${studentCode}\n\n${postStudentSupport}`;
    }

    if (customBoilerplate && customBoilerplate.trim().length > 0) {
      if (customBoilerplate.includes("// [[STUDENT_CODE_ZONE]]")) {
        return customBoilerplate.replace("// [[STUDENT_CODE_ZONE]]", studentCode);
      }
      return `${baseIncludes}\n\n${studentCode}\n;\n\n${postStudentSupport}\n\n${customBoilerplate}`;
    }

    if (!signatureStr || signatureStr.trim().length === 0 || signatureStr.trim() === "int main()") {
      return `${baseIncludes}\n\n${studentCode}\n;\n\n${postStudentSupport}\n\nint main() { return 0; }`;
    }

    const parsed = BoilerplateFactory.parseCppSignature(signatureStr);
    const hasLinkedList = parsed.params.some((p) => p.isLinkedList || p.isVectorOfNodes) || parsed.returnType.includes("Node*");

    const nodeDef = hasLinkedList ? BoilerplateFactory.getNodeDefinition(studentCode) : "";
    const listHelpers = hasLinkedList ? BoilerplateFactory.getLinkedListHelpers() : "";

    const topFunctions = BoilerplateFactory.findTopLevelFunctions(studentCode);

    let invocationPrefix = "";
    if (category && category.toUpperCase() === "CLASS") {
      const targetClass = BoilerplateFactory.findClassForMethod(studentCode, parsed.functionName);
      if (targetClass) {
        invocationPrefix = `${targetClass}().`;
      } else {
        const classMatch = studentCode.match(/class\s+([A-Za-z_]\w*)/);
        const className = classMatch ? classMatch[1] : "Solution";
        invocationPrefix = `${className}().`;
      }
    }

    const declarationLines: string[] = [];
    const streamReadExprs: string[] = [];
    const postReadSetupLines: string[] = [];
    const callArgs: string[] = [];

    parsed.params.forEach((p, idx) => {
      const varName = `v${idx}`;
      const cleanType = p.cleanType.trim();

      if (p.isFunctionPointer) {
        declarationLines.push(`        ${p.funcPtrReturnPart} (*${varName})(${p.funcPtrArgsPart}) = nullptr;`);
        declarationLines.push(`        string func_str_${idx};`);
        
        let dispatchCode = `(readQuotedString(ss, func_str_${idx}), `;
        topFunctions.forEach((fn) => {
          dispatchCode += `(func_str_${idx} == "${fn}" ? (${varName} = &${fn}, true) : `;
        });
        dispatchCode += `true`;
        topFunctions.forEach(() => { dispatchCode += `)`; });
        dispatchCode += `)`;

        streamReadExprs.push(dispatchCode);
      } else if (p.isVectorOfNodes) {
        const dataVar = `${varName}_data`;
        declarationLines.push(`        vector<vector<int>> ${dataVar};`);
        declarationLines.push(`        vector<Node*> ${varName};`);
        streamReadExprs.push(`(skipDelimiter(ss), ss >> ${dataVar})`);
        postReadSetupLines.push(`        for (const auto& sub : ${dataVar}) { ${varName}.push_back(buildList(sub)); }`);
      } else if (p.isLinkedList) {
        const dataVar = `${varName}_data`;
        declarationLines.push(`        vector<int> ${dataVar};`);
        declarationLines.push(`        Node* ${varName} = nullptr;`);
        streamReadExprs.push(`(skipDelimiter(ss), ss >> ${dataVar})`);
        postReadSetupLines.push(`        ${varName} = buildList(${dataVar});`);
      } else if (p.isDoublePointer) {
        const valVar = `${varName}_val`;
        const ptrVar = `${varName}_ptr`;
        declarationLines.push(`        int ${valVar} = {};`);
        declarationLines.push(`        int* ${ptrVar} = &${valVar};`);
        declarationLines.push(`        int** ${varName} = &${ptrVar};`);
        streamReadExprs.push(`(skipDelimiter(ss), ss >> ${valVar})`);
      } else if ((p.isPointer || cleanType.includes("*")) && !p.isFunctionPointer) {
        const baseType = cleanType.replace(/\*/g, "").trim();
        const valueVar = `${varName}_val`;
        const tokVar = `ptr_tok_${idx}`;
        
        declarationLines.push(`        ${baseType} ${valueVar} = {};`);
        declarationLines.push(`        ${cleanType} ${varName} = nullptr;`);
        declarationLines.push(`        string ${tokVar};`);
        
        streamReadExprs.push(
          `(skipDelimiter(ss), (ss >> ${tokVar}) ? (${tokVar} != "nullptr" && ${tokVar} != "NULL" && ${tokVar} != "null" ? (stringstream(${tokVar}) >> ${valueVar} ? (${varName} = &${valueVar}, true) : false) : true) : false)`
        );
      } else if (cleanType === "string" || cleanType === "std::string") {
        declarationLines.push(`        string ${varName};`);
        streamReadExprs.push(`(readQuotedString(ss, ${varName}))`);
      } else if (!['int', 'double', 'float', 'char', 'string', 'bool', 'long', 'short', 'unsigned'].includes(cleanType) && !cleanType.startsWith('vector') && !cleanType.startsWith('std::vector')) {
        const rawVar = `raw_${idx}`;
        declarationLines.push(`        ${cleanType} ${varName} = {};`);
        declarationLines.push(`        string ${rawVar};`);
        streamReadExprs.push(`(skipDelimiter(ss), ss >> ${rawVar})`);
      } else {
        declarationLines.push(`        ${cleanType} ${varName} = {};`);
        streamReadExprs.push(`(skipDelimiter(ss), ss >> ${varName})`);
      }

      callArgs.push(varName);
    });

    const varDeclarations = declarationLines.join("\n");
    const streamReads = streamReadExprs.length > 0 ? streamReadExprs.join(" && ") : "true";
    const postReadSetup = postReadSetupLines.join("\n");
    const callArgsStr = callArgs.join(", ");
    const callExpr = `${invocationPrefix}${parsed.functionName}(${callArgsStr})`;

    let executionBlock = "";

    if (parsed.returnType === "void") {
      let mutableParams = parsed.params.filter((p) => p.isReference || p.isLinkedList || p.isPointer || p.isVectorOfNodes);
      if (mutableParams.length === 0) mutableParams = parsed.params;
      const mutatedPrint = mutableParams
        .map((p) => `formatValue(cout, v${parsed.params.indexOf(p)});`)
        .join(' cout << " "; ');

      executionBlock = `
            ${callExpr};
            ${mutatedPrint}
            cout << endl;
`;
    } else if (parsed.returnType === "bool") {
      executionBlock = `
            cout << boolalpha << ${callExpr} << endl;
`;
    } else {
      executionBlock = `
            formatValue(cout, ${callExpr});
            cout << endl;
`;
    }

    const readyBlock = postReadSetup ? `${postReadSetup}\n${executionBlock}` : executionBlock;

    return `${baseIncludes}

${nodeDef}

${studentCode}
;

${postStudentSupport}

${listHelpers}

int main() {
    string line;
    while (getline(cin, line)) {
        if (line.empty()) continue;
        stringstream ss(line);
${varDeclarations}
        if (${streamReads}) {
${readyBlock}
        }
    }
    return 0;
}
`;
  }

  public static createFullHarness(...args: any[]): string {
    let studentCode = "";
    let signatureStr = "";
    let customBoilerplate: string | null | undefined = null;
    let category: string | null | undefined = null;

    if (args.length === 1 && typeof args[0] === "object" && args[0] !== null) {
      const opts = args[0];
      studentCode = opts.studentCode || opts.code || "";
      signatureStr = opts.signatureStr || opts.function_signature || opts.signature || "";
      customBoilerplate = opts.customBoilerplate || opts.boilerplate_code || opts.boilerplate || null;
      category = opts.category || opts.testType || opts.type || null;
    } else {
      const knownCategories = ["SCALAR", "LINEAR", "GRID", "LINKED_LIST", "CUSTOM", "TREE", "STRUCT", "CLASS"];
      const stringArgs = args.filter((a) => typeof a === "string");

      if (stringArgs.length >= 2) {
        if (knownCategories.includes(stringArgs[0].toUpperCase())) {
          category = stringArgs[0];
          studentCode = stringArgs[1];
          signatureStr = stringArgs[2] || "";
          customBoilerplate = stringArgs[3] || null;
        } else {
          studentCode = stringArgs[0];
          signatureStr = stringArgs[1];
          customBoilerplate = stringArgs[2] || null;
        }
      }
    }

    return BoilerplateFactory.generateHarness(studentCode, signatureStr, customBoilerplate, category);
  }
}
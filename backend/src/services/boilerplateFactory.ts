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
  hasDefault: boolean;
  defaultValue: string;
}

interface StructField {
  type: string;
  name: string;
  isPublic: boolean;
}

interface ClassMethod {
  returnType: string;
  name: string;
  params: ParsedParam[];
}

interface ParsedSignature {
  returnType: string;
  functionName: string;
  params: ParsedParam[];
}

export class BoilerplateFactory {
  public static getBaseIncludes(studentCode: string = ""): string {
    return `#include <iostream>
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
#include <type_traits>

using namespace std;

inline void skipDelimiter(istream& is) {
    while (is.good() && is.peek() != EOF) {
        int c = is.peek();
        if (isspace(static_cast<unsigned char>(c)) || c == ',' || c == '=') {
            is.get();
        } else {
            break;
        }
    }
}

inline istream& readQuotedString(istream& is, string& s) {
    skipDelimiter(is);
    s.clear();
    if (!is.good()) return is;
    int peekChar = is.peek();
    if (peekChar == '"' || peekChar == '\\'') {
        char q = static_cast<char>(is.get());
        while (is.good() && is.peek() != EOF) {
            char c = static_cast<char>(is.get());
            if (c == '\\\\' && is.good() && is.peek() != EOF) {
                s += static_cast<char>(is.get());
            } else if (c == q) {
                break;
            } else {
                s += c;
            }
        }
    } else {
        while (is.good() && is.peek() != EOF) {
            int c = is.peek();
            if (isspace(static_cast<unsigned char>(c)) || c == ',') break;
            s += static_cast<char>(is.get());
        }
    }
    return is;
}

inline istream& readCharLiteral(istream& is, char& c) {
    skipDelimiter(is);
    if (!is.good()) return is;
    int peekChar = is.peek();
    if (peekChar == '\\'' || peekChar == '"') {
        char q = static_cast<char>(is.get());
        if (is.good() && is.peek() != EOF) {
            c = static_cast<char>(is.get());
            if (c == '\\\\' && is.good() && is.peek() != EOF) {
                c = static_cast<char>(is.get());
            }
        }
        if (is.good() && is.peek() == q) is.get();
    } else {
        is >> c;
    }
    return is;
}

template <typename T1, typename T2> ostream& operator<<(ostream& os, const pair<T1, T2>& p);
template <typename T> ostream& operator<<(ostream& os, const vector<T>& v);

template <typename...>
using void_t_custom = void;

template <typename T, typename = void>
struct is_streamable : std::false_type {};

template <typename T>
struct is_streamable<T, void_t_custom<decltype(std::declval<std::ostream&>() << std::declval<T>())>> : std::true_type {};

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

inline void formatValue(ostream& os, const string& val) {
    os << "\\"" << val << "\\"";
}

template <typename T1, typename T2>
ostream& operator<<(ostream& os, const pair<T1, T2>& p) {
    os << "(";
    formatValue(os, p.first);
    os << ", ";
    formatValue(os, p.second);
    os << ")";
    return os;
}

template <typename T>
void formatArray(ostream& os, T* ptr, size_t size) {
    if (!ptr) {
        os << "nullptr";
        return;
    }
    os << "[";
    for (size_t i = 0; i < size; ++i) {
        formatValue(os, ptr[i]);
        if (i + 1 < size) os << ", ";
    }
    os << "]";
}

template <typename T>
void format2DArray(ostream& os, T** ptr, size_t rows, size_t cols) {
    if (!ptr) {
        os << "nullptr";
        return;
    }
    os << "[";
    for (size_t i = 0; i < rows; ++i) {
        formatArray(os, ptr[i], cols);
        if (i + 1 < rows) os << ", ";
    }
    os << "]";
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
typename std::enable_if<std::is_same<T, string>::value, bool>::type
readVectorElem(istream& is, T& val) {
    return static_cast<bool>(readQuotedString(is, val));
}

template <typename T>
typename std::enable_if<std::is_same<T, char>::value, bool>::type
readVectorElem(istream& is, T& val) {
    return static_cast<bool>(readCharLiteral(is, val));
}

template <typename T>
typename std::enable_if<!std::is_same<T, string>::value && !std::is_same<T, char>::value, bool>::type
readVectorElem(istream& is, T& val) {
    return static_cast<bool>(is >> val);
}

template <typename T>
istream& operator>>(istream& is, vector<T>& v) {
    v.clear();
    skipDelimiter(is);
    if (!is.good() || is.peek() != '[') {
        is.setstate(ios::failbit);
        return is;
    }
    is.get();
    skipDelimiter(is);
    if (is.good() && is.peek() == ']') {
        is.get();
        return is;
    }
    while (is.good()) {
        skipDelimiter(is);
        T val;
        if (!readVectorElem(is, val)) {
            is.setstate(ios::failbit);
            return is;
        }
        v.push_back(val);
        skipDelimiter(is);
        if (is.good() && is.peek() == ']') {
            is.get();
            break;
        }
    }
    return is;
}

inline vector<string> splitCommandStream(const string& str) {
    vector<string> cmds;
    string cur;
    int depth = 0;
    for (char c : str) {
        if (c == '(' || c == '[' || c == '{' || c == '<') depth++;
        else if (c == ')' || c == ']' || c == '}' || c == '>') depth--;
        
        if (c == ',' && depth == 0) {
            if (!cur.empty()) cmds.push_back(cur);
            cur.clear();
        } else {
            cur += c;
        }
    }
    if (!cur.empty()) cmds.push_back(cur);
    return cmds;
}
`;
  }

  private static getPostStudentCodeSupport(studentCode: string): string {
    return BoilerplateFactory.getDynamicStructSupport(studentCode);
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

  private static findClassForMethod(code: string, methodName: string): { kind: string; name: string; body: string } | null {
    const structs = BoilerplateFactory.findTopLevelStructs(code);
    for (const s of structs) {
      if (new RegExp(`\\b${methodName}\\s*\\(`).test(s.body)) {
        return s;
      }
    }
    return null;
  }

  private static isAbstractClass(body: string): boolean {
    return /virtual\s+[^=]+=\s*0\s*;/.test(body);
  }

  private static findTopLevelStructs(code: string): { kind: string; name: string; body: string }[] {
    const results: { kind: string; name: string; body: string }[] = [];
    const re = /\b(struct|class)\s+([A-Za-z_]\w*)\s*(?:[^{]*)?\{/g;
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

  private static parseClassMethods(classBody: string): ClassMethod[] {
    const methods: ClassMethod[] = [];
    const re = /(?:(?:inline|virtual|static)\s+)*([a-zA-Z_]\w*(?:\s*[*&])?)\s+([a-zA-Z_]\w*)\s*\(([^)]*)\)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(classBody)) !== null) {
      const returnType = m[1].trim();
      const methodName = m[2].trim();
      const paramStr = m[3].trim();

      if (methodName === "if" || methodName === "while" || methodName === "for" || methodName === "switch") continue;

      const rawParams = BoilerplateFactory.splitParams(paramStr);
      const params: ParsedParam[] = rawParams.map((rawParam, idx) => {
        let p = rawParam.trim();
        const defaultEqIndex = p.indexOf("=");
        let hasDefault = false;
        let defaultValue = "";
        if (defaultEqIndex !== -1) {
          hasDefault = true;
          defaultValue = p.substring(defaultEqIndex + 1).trim();
          p = p.substring(0, defaultEqIndex).trim();
        }
        const cleanType = p.replace(/\bconst\b/g, "").replace(/[&]/g, "").trim();
        return {
          rawType: p,
          cleanType,
          name: `p${idx}`,
          isReference: p.includes("&"),
          isVector: cleanType.includes("vector<"),
          isGrid: cleanType.includes("vector<vector<"),
          isLinkedList: cleanType.includes("Node*"),
          isVectorOfNodes: cleanType.includes("vector<Node*>"),
          isPointer: cleanType.includes("*"),
          isDoublePointer: cleanType.includes("**"),
          isFunctionPointer: false,
          funcPtrReturnPart: "",
          funcPtrArgsPart: "",
          hasDefault,
          defaultValue
        };
      });

      methods.push({ returnType, name: methodName, params });
    }
    return methods;
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

  private static findNodeDataField(studentCode: string): { type: string; name: string } | null {
    const structs = BoilerplateFactory.findTopLevelStructs(studentCode);
    const nodeStruct = structs.find((s) => s.name === "Node");
    if (!nodeStruct) return null;

    const fields = BoilerplateFactory.parseStructFields(nodeStruct.kind, nodeStruct.body);
    const dataField = fields.find((f) => {
      const normalizedType = f.type.replace(/\s+/g, "");
      return normalizedType !== "Node*" && f.name !== "next";
    });

    return dataField ? { type: dataField.type, name: dataField.name } : null;
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
    const printableFields = fields.filter(
      (f) => !f.type.includes("*") && (BoilerplateFactory.isNumericFieldType(f.type) || BoilerplateFactory.isStringFieldType(f.type))
    );

    if (printableFields.length === 0) {
      return `
inline istream& operator>>(istream& is, ${name}&) { return is; }
inline ostream& operator<<(ostream& os, const ${name}&) { os << "[object]"; return os; }
`;
    }

    const readLines: string[] = [];
    printableFields.forEach((f, idx) => {
      if (!f.isPublic) return;
      const t = f.type.trim();
      if (BoilerplateFactory.isNumericFieldType(t)) {
        readLines.push(
          `    while (is.good() && is.peek() != EOF && !isdigit(is.peek()) && is.peek() != '-') is.get();\n    if (is.good()) is >> obj.${f.name};`
        );
      } else if (BoilerplateFactory.isStringFieldType(t)) {
        readLines.push(`    readQuotedString(is, obj.${f.name});`);
      } else {
        readLines.push(`    { string skip_${idx}; readQuotedString(is, skip_${idx}); }`);
      }
    });

    const publicPrintable = printableFields.filter((f) => f.isPublic);
    const printLines = publicPrintable
      .map((f, i) => `    formatValue(os, obj.${f.name});${i + 1 < publicPrintable.length ? ' os << ", ";' : ""}`)
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

  public static getLinkedListHelpers(dataType: string = "int", dataField: string = "val"): string {
    return `
inline Node* buildList(const vector<${dataType}>& vals) {
    if (vals.empty()) return nullptr;
    Node* head = nullptr;
    Node* tail = nullptr;
    for (const auto& v : vals) {
        Node* n = new Node();
        n->${dataField} = v;
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

inline vector<${dataType}> listToVector(Node* head) {
    vector<${dataType}> result;
    Node* curr = head;
    size_t limit = 10000;
    while (curr && limit--) {
        result.push_back(curr->${dataField});
        curr = curr->next;
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
        let hasDefault = false;
        let defaultValue = "";
        if (defaultEqIndex !== -1) {
          hasDefault = true;
          defaultValue = p.substring(defaultEqIndex + 1).trim();
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
          .trim();

        const isGrid = cleanType.includes("vector<vector<");
        const isVectorOfNodes = cleanType.includes("vector<Node*>");
        const isVector = cleanType.includes("vector<") && !isGrid && !isVectorOfNodes;
        const isLinkedList = cleanType.includes("Node*") && !isVectorOfNodes;
        const isDoublePointer = !isFunctionPointer && cleanType.includes("**");
        const isPointer = !isFunctionPointer && (cleanType.includes("*") || isDoublePointer) && !isLinkedList && !isVectorOfNodes;

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
          funcPtrArgsPart,
          hasDefault,
          defaultValue
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

  private static generateClassCommandHarness(
    className: string,
    classBody: string,
    studentCode: string,
    baseIncludes: string,
    postStudentSupport: string
  ): string {
    const classMethods = BoilerplateFactory.parseClassMethods(classBody);

    let dispatchCases = "";
    classMethods.forEach((method) => {
      let readArgs = "";
      let callArgs = "";
      method.params.forEach((p, idx) => {
        const initVal = p.hasDefault && p.defaultValue.length > 0 ? p.defaultValue : "{}";
        readArgs += `            ${p.cleanType} arg${idx} = ${initVal};\n`;
        readArgs += `            skipDelimiter(method_ss);\n`;
        if (p.hasDefault) {
          readArgs += `            if (method_ss.good() && method_ss.peek() != EOF) { method_ss >> arg${idx}; }\n`;
        } else {
          readArgs += `            method_ss >> arg${idx};\n`;
        }
        callArgs += (idx > 0 ? ", " : "") + `arg${idx}`;
      });

      let callAndPrint = "";
      if (method.returnType === "void") {
        callAndPrint = `instance.${method.name}(${callArgs});`;
      } else {
        callAndPrint = `formatValue(cout, instance.${method.name}(${callArgs})); cout << endl;`;
      }

      dispatchCases += `
        if (cmd_name == "${method.name}") {
${readArgs}
            ${callAndPrint}
            executed = true;
        }
`;
    });

    return `${baseIncludes}

${studentCode}
;

${postStudentSupport}

int main() {
    ${className} instance;
    string line;
    while (getline(cin, line)) {
        if (line.empty()) continue;
        vector<string> commands = splitCommandStream(line);
        for (const string& cmd : commands) {
            stringstream method_ss(cmd);
            skipDelimiter(method_ss);
            string cmd_name;
            while (method_ss.good() && method_ss.peek() != EOF && method_ss.peek() != '(' && method_ss.peek() != '=' && !isspace(method_ss.peek())) {
                cmd_name += static_cast<char>(method_ss.get());
            }
            if (method_ss.good() && (method_ss.peek() == '(' || method_ss.peek() == '=')) method_ss.get();

            bool executed = false;
            ${dispatchCases}
        }
    }
    return 0;
}
`;
  }

  public static generateHarness(
    studentCode: string,
    signatureStr: string,
    customBoilerplate?: string | null,
    category?: string | null,
    helperCode?: string | null
  ): string {
    const helperSource = helperCode && helperCode.trim().length > 0 ? helperCode : "";
    const PRIMITIVE_TYPES = new Set([
      'int', 'double', 'float', 'char', 'string', 'bool',
      'long', 'short', 'unsigned', 'signed', 'long long',
      'unsigned long', 'unsigned long long', 'unsigned short',
      'unsigned int', 'unsigned char', 'signed char',
      'long double', 'long long int', 'long int',
      'short int', 'signed int'
    ]);
    const baseIncludes = BoilerplateFactory.getBaseIncludes(studentCode);
    const postStudentSupport = BoilerplateFactory.getPostStudentCodeSupport(studentCode);

    // NOTE: Previously, student code containing `int main(...)` bypassed the
    // entire harness system here and ran as the literal program entry point —
    // meaning a student could hardcode expected outputs (or do anything else)
    // completely outside the test-input/output contract, with black-box scoring
    // computed from output the student fully controlled. That branch has been
    // removed. Student-defined main() now falls through to normal harness
    // generation below, where it collides with the harness's own main() and
    // fails to compile — consistent with the white-box hard gate in
    // structuralAnalysisService.ts, which already forbids main() outright.
    // Defense in depth: programmingGradingEngine.ts's cleanStudentCode also
    // rejects `int main(` explicitly before this point is ever reached.

    if (customBoilerplate && customBoilerplate.trim().length > 0) {
      if (customBoilerplate.includes("// [[STUDENT_CODE_ZONE]]")) {
        return customBoilerplate.replace("// [[STUDENT_CODE_ZONE]]", studentCode);
      }
      return `${baseIncludes}\n\n${helperSource}\n\n${studentCode}\n;\n\n${postStudentSupport}\n\n${customBoilerplate}`;
    }

    const targetClassObj = category === "CLASS" ? BoilerplateFactory.findClassForMethod(studentCode, signatureStr.split(/\s+/).pop() || "") : null;
    if (category === "CLASS" && targetClassObj && !BoilerplateFactory.isAbstractClass(targetClassObj.body)) {
      return BoilerplateFactory.generateClassCommandHarness(
        targetClassObj.name,
        targetClassObj.body,
        studentCode,
        baseIncludes,
        postStudentSupport
      );
    }

    if (!signatureStr || signatureStr.trim().length === 0 || signatureStr.trim() === "int main()") {
      return `${baseIncludes}\n\n${studentCode}\n;\n\n${postStudentSupport}\n\nint main() { return 0; }`;
    }

    const parsed = BoilerplateFactory.parseCppSignature(signatureStr);
    const hasLinkedList = parsed.params.some((p) => p.isLinkedList || p.isVectorOfNodes) || parsed.returnType.includes("Node*");

    const nodeDef = hasLinkedList ? BoilerplateFactory.getNodeDefinition(studentCode) : "";
    const nodeDataField = hasLinkedList ? BoilerplateFactory.findNodeDataField(studentCode) : null;
    const nodeDataType = nodeDataField ? nodeDataField.type : "int";
    const nodeDataFieldName = nodeDataField ? nodeDataField.name : "val";
    const listHelpers = hasLinkedList ? BoilerplateFactory.getLinkedListHelpers(nodeDataType, nodeDataFieldName) : "";

    const topFunctions = BoilerplateFactory.findTopLevelFunctions(`${studentCode}\n${helperSource}`);

    const classMethodMatch = BoilerplateFactory.findClassForMethod(studentCode, parsed.functionName);
    const isConstructorCall = classMethodMatch && parsed.functionName === classMethodMatch.name;
    const isAbstract = classMethodMatch && BoilerplateFactory.isAbstractClass(classMethodMatch.body);

    let className = "";
    if (classMethodMatch) {
      className = classMethodMatch.name;
    } else if (category && category.toUpperCase() === "CLASS") {
      const classMatch = studentCode.match(/class\s+([A-Za-z_]\w*)/);
      className = classMatch ? classMatch[1] : "Solution";
    }

    if (classMethodMatch && isAbstract && !isConstructorCall) {
      throw new Error(
        `generateHarness: function "${parsed.functionName}" resolves to a method on abstract class "${classMethodMatch.name}" ` +
        `(it contains a pure virtual member). The generic harness cannot instantiate an abstract class or auto-select ` +
        `which concrete subclass to dispatch to for each test case. This question requires explicit boilerplate_code ` +
        `that instantiates the correct concrete subclass per test case.`
      );
    }

    const isClassContext = className.length > 0 && !isConstructorCall && !isAbstract;

    const declarationLines: string[] = [];
    const streamReadExprs: string[] = [];
    const postReadSetupLines: string[] = [];
    const callArgs: string[] = [];

    const makeOptionalIfDefaulted = (p: ParsedParam, expr: string): string => {
      if (!p.hasDefault) return expr;
      return `(skipDelimiter(ss), (!ss.good() || ss.peek() == EOF) ? true : static_cast<bool>(${expr}))`;
    };

    parsed.params.forEach((p, idx) => {
      const varName = `v${idx}`;
      const cleanType = p.cleanType.trim();
      const defaultInit = p.hasDefault && p.defaultValue.length > 0 ? p.defaultValue : null;

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

        streamReadExprs.push(makeOptionalIfDefaulted(p, dispatchCode));
      } else if (p.isVectorOfNodes) {
        const dataVar = `${varName}_data`;
        declarationLines.push(`        vector<vector<${nodeDataType}>> ${dataVar};`);
        declarationLines.push(`        vector<Node*> ${varName};`);
        streamReadExprs.push(makeOptionalIfDefaulted(p, `(skipDelimiter(ss), ss >> ${dataVar})`));
        postReadSetupLines.push(`        for (const auto& sub : ${dataVar}) { ${varName}.push_back(buildList(sub)); }`);
      } else if (p.isLinkedList) {
        const dataVar = `${varName}_data`;
        declarationLines.push(`        vector<${nodeDataType}> ${dataVar};`);
        declarationLines.push(`        Node* ${varName} = nullptr;`);
        streamReadExprs.push(makeOptionalIfDefaulted(p, `(skipDelimiter(ss), ss >> ${dataVar})`));
        postReadSetupLines.push(`        ${varName} = buildList(${dataVar});`);
      } else if (p.isDoublePointer) {
        const baseType = cleanType.replace(/\*/g, "").trim() || "int";
        const dataVar = `${varName}_data`;
        const ptrsVar = `${varName}_ptrs`;
        const tokVar = `ptr_tok_${idx}`;

        declarationLines.push(`        vector<vector<${baseType}>> ${dataVar};`);
        declarationLines.push(`        vector<${baseType}*> ${ptrsVar};`);
        declarationLines.push(`        ${cleanType} ${varName} = nullptr;`);
        declarationLines.push(`        string ${tokVar};`);

        streamReadExprs.push(
          makeOptionalIfDefaulted(
            p,
            `(skipDelimiter(ss), (ss.peek() == 'n' || ss.peek() == 'N') ? (ss >> ${tokVar}, (${varName} = nullptr, true)) : static_cast<bool>(ss >> ${dataVar}))`
          )
        );

        postReadSetupLines.push(`        if (!${dataVar}.empty()) {`);
        postReadSetupLines.push(`            for (auto& row : ${dataVar}) {`);
        postReadSetupLines.push(`                ${ptrsVar}.push_back(row.data());`);
        postReadSetupLines.push(`            }`);
        postReadSetupLines.push(`            ${varName} = ${ptrsVar}.data();`);
        postReadSetupLines.push(`        }`);
      }else if (p.isPointer) {
        const baseType = cleanType.replace(/\*/g, "").trim();
        const valueVar = `${varName}_val`;
        const tokVar = `ptr_tok_${idx}`;
        
        declarationLines.push(`        ${baseType} ${valueVar} = {};`);
        declarationLines.push(`        ${cleanType} ${varName} = ${defaultInit ?? "nullptr"};`);
        declarationLines.push(`        string ${tokVar};`);
        
        streamReadExprs.push(
          makeOptionalIfDefaulted(p, `(skipDelimiter(ss), (readQuotedString(ss, ${tokVar})) ? (${tokVar} != "nullptr" && ${tokVar} != "NULL" && ${tokVar} != "null" ? (stringstream(${tokVar}) >> ${valueVar} ? (${varName} = &${valueVar}, true) : false) : (${varName} = nullptr, true)) : false)`)
        );
      } else if (cleanType === "char" || cleanType === "const char") {
        declarationLines.push(`        char ${varName} = ${defaultInit ?? "'\\0'"};`);
        streamReadExprs.push(makeOptionalIfDefaulted(p, `(readCharLiteral(ss, ${varName}))`));
      } else if (cleanType === "string" || cleanType === "std::string") {
        declarationLines.push(`        string ${varName}${defaultInit ? ` = ${defaultInit}` : ""};`);
        streamReadExprs.push(makeOptionalIfDefaulted(p, `(readQuotedString(ss, ${varName}))`));
      } else if (!PRIMITIVE_TYPES.has(cleanType) && !cleanType.startsWith('vector') && !cleanType.startsWith('std::vector')) {
        const rawVar = `raw_${idx}`;
        declarationLines.push(`        ${cleanType} ${varName} = ${defaultInit ?? "{}"};`);
        declarationLines.push(`        string ${rawVar};`);
        streamReadExprs.push(makeOptionalIfDefaulted(p, `(skipDelimiter(ss), ss >> ${rawVar})`));
      } else {
        declarationLines.push(`        ${cleanType} ${varName} = ${defaultInit ?? "{}"};`);
        streamReadExprs.push(makeOptionalIfDefaulted(p, `(skipDelimiter(ss), ss >> ${varName})`));
      }

      callArgs.push(varName);
    });

    const varDeclarations = declarationLines.join("\n");
    const streamReads = streamReadExprs.length > 0 ? streamReadExprs.join(" && ") : "true";
    const postReadSetup = postReadSetupLines.join("\n");
    const callArgsStr = callArgs.join(", ");
    
    const invocationPrefix = isClassContext ? "instance." : "";
    const callExpr = `${invocationPrefix}${parsed.functionName}(${callArgsStr})`;

    let instanceDeclaration = "";
    if (isClassContext) {
      instanceDeclaration = `    ${className} instance;\n`;
    }

    let executionBlock = "";
    const cleanReturnType = parsed.returnType.trim();

    if (cleanReturnType.includes("**")) {
      let rowVarIndex = parsed.params.findIndex(
        (p) => !p.isPointer && !p.cleanType.includes("*") && (p.name.match(/row|m|r/i) || p.cleanType.includes("int") || p.cleanType.includes("size_t"))
      );
      let colVarIndex = parsed.params.findIndex(
        (p, idx) => idx !== rowVarIndex && !p.isPointer && !p.cleanType.includes("*") && (p.name.match(/col|n|c/i) || p.cleanType.includes("int") || p.cleanType.includes("size_t"))
      );

      const rowVar = rowVarIndex !== -1 ? `v${rowVarIndex}` : "1";
      const colVar = colVarIndex !== -1 ? `v${colVarIndex}` : rowVar;

      executionBlock = `
            auto raw_res = ${callExpr};
            format2DArray(cout, raw_res, static_cast<size_t>(${rowVar}), static_cast<size_t>(${colVar}));
            cout << endl;
`;
    } else if (cleanReturnType.includes("*") && !cleanReturnType.includes("Node*") && !cleanReturnType.includes("char*")) {
      let sizeVarIndex = parsed.params.findIndex(
        (p) => !p.isPointer && !p.cleanType.includes("*") && (p.name.match(/size|len|count|n/i) || p.cleanType.includes("int") || p.cleanType.includes("size_t"))
      );
      const sizeVar = sizeVarIndex !== -1 ? `v${sizeVarIndex}` : "1";

      executionBlock = `
            auto raw_res = ${callExpr};
            formatArray(cout, raw_res, static_cast<size_t>(${sizeVar}));
            cout << endl;
`;
    } else if (parsed.returnType === "void") {
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

${helperSource}

${studentCode}
;

${postStudentSupport}

${listHelpers}

int main() {
${instanceDeclaration}    string line;
    while (getline(cin, line)) {
        if (line.empty()) continue;
        stringstream ss(line);
${varDeclarations}
        if (${streamReads}) {
${readyBlock}
        } else {
            cerr << "PARSE_ERROR: input line did not match expected parameter types for this signature: " << line << endl;
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
    let helperCode: string | null | undefined = null;

    if (args.length === 1 && typeof args[0] === "object" && args[0] !== null) {
      const opts = args[0];
      studentCode = opts.studentCode || opts.code || "";
      signatureStr = opts.signatureStr || opts.function_signature || opts.signature || "";
      customBoilerplate = opts.customBoilerplate || opts.boilerplate_code || opts.boilerplate || null;
      category = opts.category || opts.testType || opts.type || null;
      helperCode = opts.helperCode || opts.helper_code || opts.support_code || opts.supportCode || null;
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

    return BoilerplateFactory.generateHarness(studentCode, signatureStr, customBoilerplate, category, helperCode);
  }
}
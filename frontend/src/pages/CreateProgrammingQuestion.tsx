import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useTheme } from "../context/ThemeContext";

interface Topic {
  topic_id: number;
  name: string;
}

interface TestCase {
  input: string;
  expected_output: string;
  category: "SANITY" | "FUNCTIONAL" | "EDGE";
  weight: number;
}

interface StructuralRule {
  type: "REQUIRE" | "FORBID";
  target: "recursion" | "loop" | "function_call" | "logarithmic_complexity" | "smart_pointers" | "raw_pointers";
  description: string;
  weight: number;
  name: string;
}

export default function CreateProgrammingQuestion() {
  const { colors, fontMono, subtleBackground } = useTheme();
  const navigate = useNavigate();

  // Basic Form State
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [category, setCategory] = useState("");
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<number | "">("");
  const [starterCode, setStarterCode] = useState(
  `#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your code here\n    return 0;\n}`
);
  const [helperCode, setHelperCode] = useState("");

  // Harness / Boilerplate Generation State
  const [functionSignature, setFunctionSignature] = useState("");
  const [referenceSolution, setReferenceSolution] = useState("");
  const [boilerplateMode, setBoilerplateMode] = useState<"auto" | "custom">("auto");
  const [boilerplateCode, setBoilerplateCode] = useState("");
  const [isValidated, setIsValidated] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationResults, setValidationResults] = useState<any[] | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Hybrid Blueprint & Grading Configuration State
  const [weightWb, setWeightWb] = useState(0.20);
  const [weightBb, setWeightBb] = useState(0.80);
  const [graceMode, setGraceMode] = useState<"STRICT" | "STANDARD" | "THRESHOLD">("STANDARD");
  const [graceThreshold, setGraceThreshold] = useState(0.90);
  const [graceCap, setGraceCap] = useState(0.15);

  // Dynamic Structural Rules State
  const [structuralRules, setStructuralRules] = useState<StructuralRule[]>([]);

  // Dynamic Test Cases State
  const [testCases, setTestCases] = useState<TestCase[]>([
    { input: "", expected_output: "", category: "FUNCTIONAL", weight: 1.0 },
  ]);
  const [loading, setLoading] = useState(false);

  // Dynamic Data State
  const [topics, setTopics] = useState<Topic[]>([]);

  // Load Topics and Categories on mount
  useEffect(() => {
    api
      .get("/topics")
      .then((res) => setTopics(res.data))
      .catch((err) => console.error("Failed to load topics", err));

    api
      .get("/programming-categories")
      .then((res) => setCategoriesList(res.data))
      .catch((err) => console.error("Failed to load categories", err));
  }, []);

  // CUSTOM harness category cannot be auto-generated — force custom boilerplate mode
  useEffect(() => {
    if (category === "CUSTOM" && boilerplateMode === "auto") {
      setBoilerplateMode("custom");
    }
  }, [category, boilerplateMode]);

  // Any edit to fields the harness/tests depend on invalidates the last validation run
  useEffect(() => {
    setIsValidated(false);
    setValidationResults(null);
    setValidationError(null);
  }, [functionSignature, referenceSolution, category, boilerplateMode, boilerplateCode, helperCode, testCases]);

  // Handlers for Weight Split
  const handleWeightWbChange = (val: number) => {
    const wb = Math.max(0, Math.min(1, val));
    setWeightWb(wb);
    setWeightBb(Number((1 - wb).toFixed(2)));
  };

  // Handlers for Dynamic Test Cases
  const addTestCase = () => {
    setTestCases([...testCases, { input: "", expected_output: "", category: "FUNCTIONAL", weight: 1.0 }]);
  };

  const removeTestCase = (index: number) => {
    if (testCases.length === 1) return;
    const newCases = testCases.filter((_, i) => i !== index);
    setTestCases(newCases);
  };

  const updateTestCase = (
    index: number,
    field: keyof TestCase,
    value: any
  ) => {
    const newCases = [...testCases];
    newCases[index] = { ...newCases[index], [field]: value };
    setTestCases(newCases);
  };

  // Handlers for Structural Rules
  const addStructuralRule = () => {
    setStructuralRules([
      ...structuralRules,
      {
        name: "Custom Rule",
        type: "REQUIRE",
        target: "smart_pointers",
        description: "Must use smart pointers for memory management",
        weight: 0.1,
      },
    ]);
  };

  const removeStructuralRule = (index: number) => {
    setStructuralRules(structuralRules.filter((_, i) => i !== index));
  };

  const updateStructuralRule = (
    index: number,
    field: keyof StructuralRule,
    value: any
  ) => {
    const newRules = [...structuralRules];
    newRules[index] = { ...newRules[index], [field]: value };
    setStructuralRules(newRules);
  };

  // Validate the harness (auto-generated or custom) against the reference solution via Judge0
  const handleValidateBoilerplate = async () => {
    if (!functionSignature || !referenceSolution) {
      alert("Function Signature and Reference Solution are required before validating.");
      return;
    }
    if (category === "CUSTOM" && !boilerplateCode.trim()) {
      alert("CUSTOM category questions require boilerplate code before validating.");
      return;
    }

    setValidating(true);
    setValidationError(null);
    try {
      const res = await api.post("/questions/programming/validate-boilerplate", {
        function_signature: functionSignature,
        reference_solution: referenceSolution,
        category,
        helper_code: helperCode,
        boilerplate_code: boilerplateMode === "custom" ? boilerplateCode : null,
        test_cases: testCases,
      });

      setValidationResults(res.data.test_results || []);
      setIsValidated(res.data.all_passed === true);

      if (!res.data.all_passed) {
        alert("Validation failed — see results below. Fix the reference solution, test cases, or boilerplate code and try again.");
      }
    } catch (err: any) {
      console.error(err);
      setValidationError(err.response?.data?.error || "Validation request failed");
      setIsValidated(false);
    } finally {
      setValidating(false);
    }
  };

  const handleSubmit = async () => {
    if (!title || !body || !selectedTopic || !category) {
      alert("Please fill in all required fields (Title, Body, Topic, Category).");
      return;
    }
    if (!functionSignature || !referenceSolution) {
      alert("Function Signature and Reference Solution are required.");
      return;
    }
    if (category === "CUSTOM" && !boilerplateCode.trim()) {
      alert("CUSTOM category questions require boilerplate code — auto-generation is not available for this category.");
      return;
    }
    if (!isValidated) {
      alert("Please validate the boilerplate against your test cases before saving.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/questions/programming", {
        title,
        body,
        difficulty,
        category,
        topic_ids: [Number(selectedTopic)],
        starter_code: starterCode,
        helper_code: helperCode,
        weight_wb: weightWb,
        weight_bb: weightBb,
        grace_mode: graceMode,
        grace_threshold: graceThreshold,
        grace_cap: graceCap,
        structural_rules: structuralRules,
        test_cases: testCases,
        function_signature: functionSignature,
        reference_solution: referenceSolution,
        boilerplate_code: boilerplateMode === "custom" ? boilerplateCode : null,
      });
      alert("Question Created Successfully!");
      navigate("/teacher/create-question-hub");
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to create question");
    } finally {
      setLoading(false);
    }
  };

  // Styles
  const inputStyle = {
    width: "100%",
    padding: "10px",
    borderRadius: "6px",
    border: `1px solid ${colors.border}`,
    background: colors.inputBg,
    color: colors.text,
    marginBottom: "15px",
    fontSize: "0.95rem",
  };

  // For monospace/code fields (function signature, reference solution, starter code,
  // boilerplate, helper code) — uses the dedicated code-surface tokens + mono font.
  const codeInputStyle = {
    ...inputStyle,
    background: colors.codeBg,
    color: colors.codeText,
    border: `1px solid ${colors.codeBorder}`,
    fontFamily: fontMono,
  };

  const labelStyle = {
    display: "block",
    marginBottom: "5px",
    fontWeight: "bold",
    fontSize: "0.9rem",
    color: colors.text,
  };

  const cardSectionStyle = {
    marginTop: "20px",
    padding: "20px",
    background: colors.neutralBg,
    borderRadius: "8px",
  };

  const handleBack = () => {
    navigate("/teacher/create-question-hub");
  };

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        color: colors.text,
        ...subtleBackground,
      }}
    >
      <div style={{ maxWidth: "850px", margin: "0 auto", padding: "40px 20px" }}>
        <button
          onClick={handleBack}
          style={{
            marginBottom: "20px",
            background: "transparent",
            color: colors.text,
            border: `1px solid ${colors.border}`,
            padding: "8px 16px",
            borderRadius: "6px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          ← Back to Hub
        </button>

        <div
          style={{
            background: colors.card,
            padding: "40px",
            borderRadius: "16px",
            border: `1px solid ${colors.border}`,
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.06), 0 2px 4px -1px rgba(0, 0, 0, 0.04)",
          }}
        >
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: "bold",
              marginBottom: "20px",
              borderBottom: `1px solid ${colors.border}`,
              paddingBottom: "10px",
            }}
          >
            Create Programming Challenge
          </h1>

          {/* --- SECTION 1: BASIC INFO --- */}
          <label style={labelStyle}>Question Title</label>
          <input
            style={inputStyle}
            placeholder="e.g. Calculate Array Average"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <label style={labelStyle}>Problem Description (Instructions)</label>
          <textarea
            style={{
              ...inputStyle,
              minHeight: "100px",
            }}
            placeholder="Describe the problem..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />

          <div style={{ display: "flex", gap: "20px", marginBottom: "15px" }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Difficulty</label>
              <select
                style={inputStyle}
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Topic</label>
              <select
                style={inputStyle}
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(Number(e.target.value))}
              >
                <option value="">-- Select Topic --</option>
                {topics.map((t) => (
                  <option key={t.topic_id} value={t.topic_id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Category</label>
              <select
                style={inputStyle}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">-- Select Category --</option>
                {categoriesList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <label style={labelStyle}>Function Signature (C++)</label>
          <input
            style={{ ...codeInputStyle, fontSize: "0.9rem" }}
            placeholder="e.g. int calculateAverage(vector<int> nums)"
            value={functionSignature}
            onChange={(e) => setFunctionSignature(e.target.value)}
          />

          <label style={labelStyle}>Reference Solution (C++)</label>
          <p style={{ fontSize: "0.85rem", color: colors.textSec, marginBottom: "8px" }}>
            A correct implementation. This is what gets validated against your test cases —
            it's never shown to students.
          </p>
          <textarea
            style={{
              ...codeInputStyle,
              minHeight: "160px",
              fontSize: "0.85rem",
              whiteSpace: "pre",
            }}
            value={referenceSolution}
            onChange={(e) => setReferenceSolution(e.target.value)}
          />


          {/* --- SECTION 2: GRADING & HYBRID WEIGHTS --- */}
          <div style={cardSectionStyle}>
            <h3 style={{ fontWeight: "bold", marginBottom: "10px" }}>
              ⚖️ Hybrid Grading Weights
            </h3>
            <p style={{ fontSize: "0.85rem", color: colors.textSec, marginBottom: "15px" }}>
              Balance AST static analysis against functional execution score.
            </p>

            <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>White-Box Weight (AST Analysis): {(weightWb * 100).toFixed(0)}%</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={weightWb}
                  onChange={(e) => handleWeightWbChange(parseFloat(e.target.value))}
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Black-Box Weight (Unit Tests): {(weightBb * 100).toFixed(0)}%</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={weightBb}
                  disabled
                  style={{ width: "100%", opacity: 0.6 }}
                />
              </div>
            </div>
          </div>

          {/* --- SECTION 3: SYNTACTIC GRACE CONFIGURATION --- */}
          <div style={cardSectionStyle}>
            <h3 style={{ fontWeight: "bold", marginBottom: "10px" }}>
              🛡️ Syntactic Grace Rules
            </h3>
            <div style={{ display: "flex", gap: "15px" }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Grace Mode</label>
                <select
                  style={inputStyle}
                  value={graceMode}
                  onChange={(e) => setGraceMode(e.target.value as any)}
                >
                  <option value="STANDARD">STANDARD (Partial Credit Available)</option>
                  <option value="STRICT">STRICT (Zero Credit on Compile Error)</option>
                  <option value="THRESHOLD">THRESHOLD (Enforce Minimum AST Health)</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Grace Threshold (Min AST Score)</label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  style={inputStyle}
                  value={graceThreshold}
                  onChange={(e) => setGraceThreshold(parseFloat(e.target.value))}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Grace Cap (Max Credit)</label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  style={inputStyle}
                  value={graceCap}
                  onChange={(e) => setGraceCap(parseFloat(e.target.value))}
                />
              </div>
            </div>
          </div>

          {/* --- SECTION 4: AST STRUCTURAL RULES --- */}
          <div style={cardSectionStyle}>
            <h3 style={{ fontWeight: "bold", marginBottom: "10px" }}>
              🔍 AST Structural Rules
            </h3>
            <p style={{ fontSize: "0.85rem", color: colors.textSec, marginBottom: "15px" }}>
              Enforce or penalize specific code practices at the parse tree level.
            </p>

            {structuralRules.map((rule, idx) => (
              <div key={idx} style={{ display: "flex", gap: "10px", marginBottom: "10px", alignItems: "center" }}>
                <select
                  style={{ ...inputStyle, width: "120px", marginBottom: 0 }}
                  value={rule.type}
                  onChange={(e) => updateStructuralRule(idx, "type", e.target.value)}
                >
                  <option value="REQUIRE">REQUIRE</option>
                  <option value="FORBID">FORBID</option>
                </select>

                <select
                  style={{ ...inputStyle, width: "180px", marginBottom: 0 }}
                  value={rule.target}
                  onChange={(e) => updateStructuralRule(idx, "target", e.target.value)}
                >
                  <option value="smart_pointers">smart_pointers</option>
                  <option value="raw_pointers">raw_pointers</option>
                  <option value="recursion">recursion</option>
                  <option value="loop">loop</option>
                  <option value="logarithmic_complexity">logarithmic_complexity</option>
                </select>

                <input
                  style={{ ...inputStyle, flex: 1, marginBottom: 0 }}
                  placeholder="Rule Description"
                  value={rule.description}
                  onChange={(e) => updateStructuralRule(idx, "description", e.target.value)}
                />

                <input
                  type="number"
                  step="0.05"
                  style={{ ...inputStyle, width: "80px", marginBottom: 0 }}
                  value={rule.weight}
                  onChange={(e) => updateStructuralRule(idx, "weight", parseFloat(e.target.value))}
                />

                <button
                  onClick={() => removeStructuralRule(idx)}
                  style={{
                    padding: "8px 12px",
                    background: colors.dangerText,
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                >
                  ✕
                </button>
              </div>
            ))}

            <button
              onClick={addStructuralRule}
              style={{
                marginTop: "5px",
                color: colors.accentText,
                background: "transparent",
                border: "none",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              + Add Structural Rule
            </button>
          </div>

          {/* --- SECTION 5: STARTER CODE --- */}
          <div style={{ marginTop: "20px" }}>
            <label style={labelStyle}>Starter Code (C++)</label>
            <textarea
              style={{
                ...codeInputStyle,
                minHeight: "140px",
                fontSize: "0.85rem",
                whiteSpace: "pre",
              }}
              value={starterCode}
              onChange={(e) => setStarterCode(e.target.value)}
            />
          </div>

          {/* --- SECTION 5B: BOILERPLATE / HARNESS VALIDATION --- */}
          <div style={cardSectionStyle}>
            <h3 style={{ fontWeight: "bold", marginBottom: "10px" }}>
              🛠️ Grading Harness
            </h3>
            <p style={{ fontSize: "0.85rem", color: colors.textSec, marginBottom: "15px" }}>
              Auto-generate the harness from the function signature, or write your own if the
              input/output format doesn't fit a standard pattern. Either way, it must pass
              validation against your Reference Solution and Test Cases before saving.
            </p>

            <div style={{ display: "flex", gap: "20px", marginBottom: "15px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <input
                  type="radio"
                  checked={boilerplateMode === "auto"}
                  disabled={category === "CUSTOM"}
                  onChange={() => setBoilerplateMode("auto")}
                />
                Auto-generate boilerplate
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <input
                  type="radio"
                  checked={boilerplateMode === "custom"}
                  onChange={() => setBoilerplateMode("custom")}
                />
                Write custom boilerplate
              </label>
            </div>

            {category === "CUSTOM" && (
              <p style={{ fontSize: "0.85rem", color: colors.warningText, marginBottom: "10px" }}>
                CUSTOM category questions always require custom boilerplate — auto-generation
                isn't available for this category.
              </p>
            )}

            {boilerplateMode === "custom" && (
              <textarea
                style={{
                  ...codeInputStyle,
                  minHeight: "200px",
                  fontSize: "0.85rem",
                  whiteSpace: "pre",
                }}
                placeholder={`// [[STUDENT_CODE_ZONE]]\nint main() {\n    // parse input, call the student's function, print in the expected format\n    return 0;\n}`}
                value={boilerplateCode}
                onChange={(e) => setBoilerplateCode(e.target.value)}
              />
            )}

            <button
              onClick={handleValidateBoilerplate}
              disabled={validating}
              style={{
                marginTop: "10px",
                padding: "10px 20px",
                background: validating ? colors.neutralBg : colors.successText,
                color: validating ? colors.neutralText : "white",
                border: "none",
                borderRadius: "6px",
                fontWeight: "bold",
                cursor: validating ? "not-allowed" : "pointer",
              }}
            >
              {validating ? "Testing against Judge0..." : "Test Boilerplate"}
            </button>

            {isValidated && (
              <span style={{ marginLeft: "12px", color: colors.successText, fontWeight: "bold" }}>
                ✓ Validated — all test cases pass
              </span>
            )}

            {validationError && (
              <div style={{ marginTop: "12px", padding: "10px", borderRadius: "6px", background: colors.dangerBg, color: colors.dangerText }}>
                {validationError}
              </div>
            )}

            {validationResults && (
              <div style={{ marginTop: "15px" }}>
                {validationResults.map((r: any, i: number) => (
                  <div
                    key={i}
                    style={{
                      padding: "10px",
                      marginBottom: "8px",
                      borderRadius: "6px",
                      background: r.passed ? colors.successBg : colors.dangerBg,
                      color: r.passed ? colors.successText : colors.dangerText,
                      fontSize: "0.85rem",
                    }}
                  >
                    <div>
                      <b>{r.passed ? "✓ PASS" : "✗ FAIL"}</b> — input: <code style={{ fontFamily: fontMono }}>{r.input}</code>
                    </div>
                    <div>Expected: <code style={{ fontFamily: fontMono }}>{r.expected}</code> | Got: <code style={{ fontFamily: fontMono }}>{r.stdout || "(none)"}</code></div>
                    {r.stderr && (
                      <div style={{ color: colors.dangerText, fontFamily: fontMono }}>stderr: {r.stderr}</div>
                    )}
                    {r.compile_output && (
                      <div style={{ color: colors.dangerText, fontFamily: fontMono, whiteSpace: "pre-wrap" }}>
                        {r.compile_output}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* --- SECTION 6: UNIT TESTS --- */}
          <div style={cardSectionStyle}>
            <h3 style={{ fontWeight: "bold", marginBottom: "10px" }}>
              🧪 Unit Test Cases
            </h3>
            <p
              style={{
                fontSize: "0.85rem",
                marginBottom: "15px",
                color: colors.textSec,
              }}
            >
              Categorize tests and set test-specific weights for multi-tier scoring.
            </p>

            {testCases.map((tc, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  gap: "10px",
                  marginBottom: "10px",
                  alignItems: "center",
                }}
              >
                <select
                  style={{ ...inputStyle, width: "140px", marginBottom: 0 }}
                  value={tc.category}
                  onChange={(e) => updateTestCase(idx, "category", e.target.value)}
                >
                  <option value="SANITY">SANITY</option>
                  <option value="FUNCTIONAL">FUNCTIONAL</option>
                  <option value="EDGE">EDGE</option>
                </select>

                <input
                  style={{ ...inputStyle, flex: 1, marginBottom: 0 }}
                  placeholder="Input"
                  value={tc.input}
                  onChange={(e) => updateTestCase(idx, "input", e.target.value)}
                />

                <input
                  style={{ ...inputStyle, flex: 1, marginBottom: 0 }}
                  placeholder="Expected Output"
                  value={tc.expected_output}
                  onChange={(e) => updateTestCase(idx, "expected_output", e.target.value)}
                />

                <input
                  type="number"
                  step="0.1"
                  style={{ ...inputStyle, width: "70px", marginBottom: 0 }}
                  value={tc.weight}
                  onChange={(e) => updateTestCase(idx, "weight", parseFloat(e.target.value))}
                />

                {testCases.length > 1 && (
                  <button
                    onClick={() => removeTestCase(idx)}
                    style={{
                      padding: "8px 12px",
                      background: colors.dangerText,
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}

            <button
              onClick={addTestCase}
              style={{
                marginTop: "10px",
                color: colors.accentText,
                background: "transparent",
                border: "none",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              + Add Another Test Case
            </button>
          </div>

          {/* --- SECTION: HELPER CODE --- */}
          <div style={{ marginTop: "20px" }}>
            <label style={labelStyle}>Helper Code / Support Functions (Optional)</label>
            <p style={{ fontSize: "0.85rem", color: colors.textSec, marginBottom: "8px" }}>
              Define auxiliary functions (e.g., operation pointers like add/sub) referenced by test cases that students don't need to write.
            </p>
            <textarea
              style={{
                ...codeInputStyle,
                minHeight: "100px",
                fontSize: "0.85rem",
                whiteSpace: "pre",
              }}
              placeholder="int add(int a, int b) { return a + b; }"
              value={helperCode}
              onChange={(e) => setHelperCode(e.target.value)}
            />
          </div>

          {/* --- ACTIONS --- */}
          <div style={{ marginTop: "30px", textAlign: "right" }}>
            {!isValidated && (
              <p style={{ fontSize: "0.85rem", color: colors.textSec, marginBottom: "8px" }}>
                Test the boilerplate above before saving.
              </p>
            )}
            <button
              onClick={handleSubmit}
              disabled={loading || !isValidated}
              style={{
                padding: "12px 24px",
                background: loading || !isValidated ? colors.neutralBg : colors.accent,
                color: loading || !isValidated ? colors.neutralText : "white",
                border: "none",
                borderRadius: "6px",
                fontWeight: "bold",
                fontSize: "1rem",
                cursor: loading || !isValidated ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Saving..." : "Save Question"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
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
  const { colors, theme } = useTheme();
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

  const handleSubmit = async () => {
    if (!title || !body || !selectedTopic || !category) {
      alert("Please fill in all required fields (Title, Body, Topic, Category).");
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
        weight_wb: weightWb,
        weight_bb: weightBb,
        grace_mode: graceMode,
        grace_threshold: graceThreshold,
        grace_cap: graceCap,
        structural_rules: structuralRules,
        test_cases: testCases,
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
    background: theme === "dark" ? "#1e293b" : "#f8fafc",
    color: colors.text,
    marginBottom: "15px",
    fontSize: "0.95rem",
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
    background: theme === "dark" ? "#0f172a" : "#f1f5f9",
    borderRadius: "8px",
  };

  const handleBack = () => {
    navigate("/teacher/create-question-hub");
  };

  return (
    <div style={{ 
      padding: "40px",
      background: "#f3f4f6",
      minHeight: "100vh",
      color: colors.text,
      fontFamily: "sans-serif" 
    }}>
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
          maxWidth: "850px",
          margin: "0 auto",
          background: colors.card,
          padding: "40px",
          borderRadius: "16px",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
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
            fontFamily: "sans-serif",
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
                  background: "#ef4444",
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
              color: "#3b82f6",
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
              ...inputStyle,
              minHeight: "140px",
              fontFamily: "monospace",
              fontSize: "0.85rem",
              whiteSpace: "pre",
            }}
            value={starterCode}
            onChange={(e) => setStarterCode(e.target.value)}
          />
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
                    background: "#ef4444",
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
              color: "#3b82f6",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            + Add Another Test Case
          </button>
        </div>

        {/* --- ACTIONS --- */}
        <div style={{ marginTop: "30px", textAlign: "right" }}>
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              padding: "12px 24px",
              background: loading ? "#9ca3af" : "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontWeight: "bold",
              fontSize: "1rem",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Saving..." : "Save Question"}
          </button>
        </div>
      </div>
    </div>
  );
}
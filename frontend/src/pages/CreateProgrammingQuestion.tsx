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
  expected: string;
}

export default function CreateProgrammingQuestion() {
  const { colors, theme } = useTheme();
  const navigate = useNavigate();

  // Form State
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [selectedTopic, setSelectedTopic] = useState<number | "">("");
  const [starterCode, setStarterCode] = useState(`#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your code here\n    return 0;\n}`);
  
  // Dynamic Data State
  const [topics, setTopics] = useState<Topic[]>([]);
  const [testCases, setTestCases] = useState<TestCase[]>([{ input: "", expected: "" }]);
  const [loading, setLoading] = useState(false);

  // Load Topics on mount
  useEffect(() => {
    api.get("/topics")
      .then((res) => setTopics(res.data))
      .catch((err) => console.error("Failed to load topics", err));
  }, []);

  // Handlers for Dynamic Test Cases
  const addTestCase = () => {
    setTestCases([...testCases, { input: "", expected: "" }]);
  };

  const removeTestCase = (index: number) => {
    if (testCases.length === 1) return; // Keep at least one
    const newCases = testCases.filter((_, i) => i !== index);
    setTestCases(newCases);
  };

  const updateTestCase = (index: number, field: keyof TestCase, value: string) => {
    const newCases = [...testCases];
    newCases[index][field] = value;
    setTestCases(newCases);
  };

  const handleSubmit = async () => {
    if (!title || !body || !selectedTopic) {
      alert("Please fill in all required fields (Title, Body, Topic).");
      return;
    }

    setLoading(true);
    try {
      await api.post("/questions/programming", {
        title,
        body,
        difficulty,
        topic_ids: [Number(selectedTopic)], // Backend expects array
        starter_code: starterCode,
        test_cases: testCases
      });
      alert("Question Created Successfully!");
      navigate("/teacher/dashboard"); // Or wherever you want to go
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
    background: theme === 'dark' ? '#1e293b' : '#f8fafc',
    color: colors.text,
    marginBottom: "15px",
    fontSize: "0.95rem"
  };

  const labelStyle = {
    display: "block",
    marginBottom: "5px",
    fontWeight: "bold",
    fontSize: "0.9rem",
    color: colors.text
  };

  return (
    <div style={{ padding: "40px", background: colors.bg, minHeight: "100vh", color: colors.text }}>
      <div style={{ maxWidth: "800px", margin: "0 auto", background: colors.card, padding: "30px", borderRadius: "8px", border: `1px solid ${colors.border}` }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "20px", borderBottom: `1px solid ${colors.border}`, paddingBottom: "10px" }}>
          Create Programming Challenge
        </h1>

        {/* --- SECTION 1: BASIC INFO --- */}
        <label style={labelStyle}>Question Title</label>
        <input 
          style={inputStyle}
          placeholder="e.g. Calculate Array Average"
          value={title} onChange={e => setTitle(e.target.value)} 
        />

        <label style={labelStyle}>Problem Description (Instructions)</label>
        <textarea 
          style={{ ...inputStyle, minHeight: "100px", fontFamily: "sans-serif" }}
          placeholder="Describe the problem..."
          value={body} onChange={e => setBody(e.target.value)} 
        />

        <div style={{ display: "flex", gap: "20px", marginBottom: "15px" }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Difficulty</label>
            <select style={inputStyle} value={difficulty} onChange={e => setDifficulty(e.target.value)}>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Topic</label>
            <select style={inputStyle} value={selectedTopic} onChange={e => setSelectedTopic(Number(e.target.value))}>
              <option value="">-- Select Topic --</option>
              {topics.map(t => (
                <option key={t.topic_id} value={t.topic_id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* --- SECTION 2: STARTER CODE --- */}
        <label style={labelStyle}>Starter Code (C++)</label>
        <textarea 
          style={{ ...inputStyle, minHeight: "150px", fontFamily: "monospace", fontSize: "0.85rem", whiteSpace: "pre" }}
          value={starterCode} 
          onChange={e => setStarterCode(e.target.value)} 
        />

        {/* --- SECTION 3: UNIT TESTS --- */}
        <div style={{ marginTop: "20px", padding: "20px", background: theme === 'dark' ? '#0f172a' : '#f1f5f9', borderRadius: "8px" }}>
          <h3 style={{ fontWeight: "bold", marginBottom: "10px" }}>🧪 Unit Test Cases</h3>
          <p style={{ fontSize: "0.85rem", marginBottom: "15px", color: colors.textSec }}>
            The system will inject the <strong>Input</strong> into <code>cin</code> and compare the student's output with <strong>Expected Output</strong>.
          </p>

          {testCases.map((tc, idx) => (
            <div key={idx} style={{ display: "flex", gap: "10px", marginBottom: "10px", alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <input 
                  style={{ ...inputStyle, marginBottom: 0 }} 
                  placeholder="Input (e.g. 5 10)"
                  value={tc.input}
                  onChange={(e) => updateTestCase(idx, 'input', e.target.value)}
                />
              </div>
              <div style={{ flex: 1 }}>
                <input 
                  style={{ ...inputStyle, marginBottom: 0 }} 
                  placeholder="Expected (e.g. 15)"
                  value={tc.expected}
                  onChange={(e) => updateTestCase(idx, 'expected', e.target.value)}
                />
              </div>
              {testCases.length > 1 && (
                <button 
                  onClick={() => removeTestCase(idx)}
                  style={{ padding: "10px", background: "#ef4444", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}
                >
                  ✕
                </button>
              )}
            </div>
          ))}

          <button 
            onClick={addTestCase}
            style={{ marginTop: "10px", color: "#3b82f6", background: "transparent", border: "none", cursor: "pointer", fontWeight: "bold" }}
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
              cursor: loading ? "not-allowed" : "pointer"
            }}
          >
            {loading ? "Saving..." : "Save Question"}
          </button>
        </div>

      </div>
    </div>
  );
}
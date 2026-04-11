import { useState, useRef, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { useTheme } from "../../context/ThemeContext";
import type { Question, SaveStatus } from "../../hooks/useTestSession";
import {
  StatusIndicator,
  NavigationButtons,
  QuestionHeader,
} from "./TestComponents";

interface Props {
  testData: any;
  question: Question;
  currentIdx: number;
  totalQ: number;
  answer: any;
  saveStatus: SaveStatus;
  submitting: boolean;
  onAnswer: (id: number, val: any, type: string) => void;
  onNavigate: (idx: number) => void;
  onSubmit: () => void;
  onRunCode: (id: number, code: string) => void;
  isRunning: boolean;
  runResult: { grade: number; details?: any } | null;
  runError: string | null;
  topPart: string;
  bottomPart: string;
}

export default function ProgrammingLayout({
  testData,
  question,
  currentIdx,
  totalQ,
  answer,
  saveStatus,
  submitting,
  onAnswer,
  onNavigate,
  onSubmit,
  onRunCode,
  isRunning,
  runResult,
  runError,
  topPart,
  bottomPart,
}: Props) {
  const { colors, theme } = useTheme();
  const [leftWidth, setLeftWidth] = useState(40);
  const isDragging = useRef(false);

  // Ref to store code instantly
  const codeRef = useRef(answer || question.starter_code || "");

  useEffect(() => {
    if (answer !== undefined) {
      codeRef.current = answer;
    }
  }, [answer]);

  const handleEditorChange = (value: string | undefined) => {
    const val = value || "";
    codeRef.current = val;
    onAnswer(question.question_id, val, "programming");
  };

  const handleRunClick = () => {
    onRunCode(question.question_id, codeRef.current);
  };

  // Drag Resizing Logic
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const newWidth = (e.clientX / window.innerWidth) * 100;
      if (newWidth > 20 && newWidth < 80) setLeftWidth(newWidth);
    };
    const handleMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = "default";
      document.body.style.userSelect = "auto";
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const decodeOutput = (str: string | null) => {
    if (!str) return "";
    try {
      return atob(str);
    } catch (e) {
      return str;
    }
  };

  const boilerplateStyle: React.CSSProperties = {
    backgroundColor: "#1e1e1e",
    color: "#6a9955",
    padding: "12px 20px",
    fontFamily: "'Fira Code', 'Courier New', monospace",
    fontSize: "14px",
    whiteSpace: "pre",
    opacity: 0.7,
    userSelect: "none",
    overflow: "hidden",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        background: colors.bg,
        color: colors.text,
        zIndex: 9999,
      }}
    >
      {/* === LEFT PANEL === */}
      <div
        style={{
          width: `${leftWidth}%`,
          display: "flex",
          flexDirection: "column",
          background: colors.card,
          borderRight: `1px solid ${colors.border}`,
        }}
      >
        <div
          style={{
            padding: "10px 20px",
            borderBottom: `1px solid ${colors.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: colors.bg,
          }}
        >
          <span style={{ fontWeight: "bold", fontSize: "0.9rem" }}>
            {testData?.title}
          </span>
          <StatusIndicator status={saveStatus} />
        </div>

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          <QuestionHeader question={question} idx={currentIdx} />

          {/* === TERMINAL SECTION === */}
          {(isRunning || runResult || runError) && (
            <div
              style={{
                marginTop: "auto",
                border: `1px solid ${colors.border}`,
                borderRadius: "6px",
                overflow: "hidden",
                backgroundColor: "#1e1e1e",
                color: "#e2e8f0",
                fontSize: "0.85rem",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              }}
            >
              <div
                style={{
                  padding: "6px 12px",
                  background: "#334155",
                  borderBottom: `1px solid #475569`,
                  fontWeight: "bold",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>💻</span> CONSOLE
                </span>
                {isRunning && <span style={{ color: "#38bdf8" }}>Running...</span>}
              </div>

              <div
                style={{
                  padding: "12px",
                  fontFamily: "monospace",
                  whiteSpace: "pre-wrap",
                  maxHeight: "300px",
                  overflowY: "auto",
                }}
              >
                {runError && (
                  <div style={{ color: "#ef4444", marginBottom: "8px" }}>
                    <strong>System Error:</strong> {runError}
                  </div>
                )}

                {runResult && (
                  <>
                    <div
                      style={{
                        marginBottom: "12px",
                        display: "inline-block",
                        padding: "4px 10px",
                        borderRadius: "4px",
                        background: (runResult.grade ?? 0) >= (question.points ?? 0) ? "#166534" : "#991b1b",
                        color: "white",
                        fontWeight: "bold",
                        fontSize: "0.8rem",
                      }}
                    >
                      GRADE: {runResult.grade ?? 0} / {question.points}
                    </div>

                    {/* RENDER INDIVIDUAL TEST CASES */}
                    {Array.isArray(runResult.details) && runResult.details.length > 0 ? (
                      runResult.details.map((test: any, index: number) => {
                        
                        // 1. Logic for passing status
                        const isPassed = 
                          test.passed === true || 
                          test.status === "Accepted" || 
                          test.status?.description === "Accepted" || 
                          test.status?.id === 3;

                        // 2. Define the missing variables for rendering
                        const errorLog = test.error || test.compile_output || test.stderr || ""; 
                        const output = test.stdout || test.actual || "";

                        return (
                          <div 
                            key={index} 
                            style={{ 
                              marginBottom: "14px", 
                              borderLeft: `4px solid ${isPassed ? "#22c55e" : "#ef4444"}`, 
                              paddingLeft: "12px",
                              background: "rgba(255,255,255,0.02)",
                              padding: "8px 12px"
                            }}
                          >
                            <div style={{ fontWeight: "bold", color: isPassed ? "#4ade80" : "#fca5a5", marginBottom: "4px" }}>
                              {isPassed ? "✅ PASSED" : "❌ FAILED"}: Test Case #{index + 1}
                            </div>

                            {test.is_public && test.input && (
                              <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                                <strong>Input:</strong> {test.input}
                              </div>
                            )}

                            {errorLog && (
                              <div style={{ marginTop: "6px" }}>
                                <pre style={{ 
                                  fontSize: "0.75rem", 
                                  color: "#fca5a5", 
                                  background: "#2d2d2d", 
                                  padding: "8px", 
                                  borderRadius: "4px",
                                  overflowX: "auto"
                                }}>
                                  {errorLog}
                                </pre>
                              </div>
                            )}

                            {isPassed && output && (
                              <div style={{ fontSize: "0.75rem", color: "#f0fdf4", marginTop: "4px" }}>
                                <strong>Output:</strong> {output}
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div style={{ color: "#94a3b8", fontStyle: 'italic' }}>
                        No detailed test results found.
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* === BUTTON SECTION === */}
        <div
          style={{
            padding: "20px",
            borderTop: `1px solid ${colors.border}`,
            background: colors.bg,
          }}
        >
          <button
            onClick={handleRunClick}
            disabled={isRunning || submitting}
            style={{
              width: "100%",
              padding: "12px",
              marginBottom: "10px",
              cursor: isRunning || submitting ? "not-allowed" : "pointer",
              background: isRunning ? "#b45309" : "#eab308",
              border: "none",
              borderRadius: 6,
              fontWeight: "bold",
              color: "black",
              fontSize: "1rem",
              display: "flex",
              justifyContent: "center",
              gap: "10px",
            }}
          >
            {isRunning ? "Compiling..." : "▶ Run Code"}
          </button>
          <NavigationButtons
            currentIdx={currentIdx}
            totalQ={totalQ}
            submitting={submitting}
            onNavigate={onNavigate}
            onSubmit={onSubmit}
          />
        </div>
      </div>

      {/* DRAG HANDLE */}
      <div
        onMouseDown={() => {
          isDragging.current = true;
          document.body.style.cursor = "col-resize";
        }}
        style={{ width: "5px", cursor: "col-resize", background: "#334155" }}
      />

      {/* === RIGHT PANEL: EDITOR === */}
      <div
        style={{
          width: `${100 - leftWidth}%`,
          background: "#1e1e1e",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {topPart && (
          <div style={{ ...boilerplateStyle, borderBottom: "1px solid #2d2d2d" }}>
            {topPart.trim()}
          </div>
        )}

        <div style={{ flex: 1 }}>
          <Editor
            height="100%"
            width="100%"
            defaultLanguage="cpp"
            theme={theme === "dark" ? "vs-dark" : "light"}
            value={codeRef.current}
            onChange={handleEditorChange}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              automaticLayout: true,
              scrollBeyondLastLine: false,
              padding: { top: 10 },
            }}
          />
        </div>

        {bottomPart && (
          <div style={{ ...boilerplateStyle, borderTop: "1px solid #2d2d2d" }}>
            {bottomPart.trim()}
          </div>
        )}
      </div>
    </div>
  );
}
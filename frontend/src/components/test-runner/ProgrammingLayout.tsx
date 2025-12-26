import { useState, useRef, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { useTheme } from "../../context/ThemeContext"; 
import type { Question, TestDetails, SaveStatus } from "../../hooks/useTestSession";
import { StatusIndicator, NavigationButtons, QuestionHeader } from "./TestComponents"; 

interface Props {
  testData: TestDetails;
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
  runResult: { status?: string; grade: number; details?: any } | null;
  runError: string | null;
}

export default function ProgrammingLayout({ 
  testData, question, currentIdx, totalQ, answer, 
  saveStatus, submitting, onAnswer, onNavigate, onSubmit,
  onRunCode, isRunning, runResult, runError
}: Props) {
  const { colors, theme } = useTheme();
  const [leftWidth, setLeftWidth] = useState(50);
  const isDragging = useRef(false);

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

  const codeToRun = answer !== undefined ? answer : (question.starter_code || "");

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', background: colors.bg, color: colors.text, zIndex: 9999 }}>
      
      {/* LEFT PANEL */}
      <div style={{ width: `${leftWidth}%`, display: 'flex', flexDirection: 'column', background: colors.card }}>
        <div style={{ padding: '10px 20px', borderBottom: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 'bold' }}>{testData?.title} — Q{currentIdx + 1}/{totalQ}</span>
          <StatusIndicator status={saveStatus} />
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          <QuestionHeader question={question} idx={currentIdx} />

          {/* STATES */}
          {isRunning && <div style={{ color: '#0369a1', margin: '10px 0' }}>⏳ Running...</div>}
          
          {runError && (
            <div style={{ padding: 10, background: '#fee2e2', color: '#b91c1c', marginTop: 10, borderRadius: 4 }}>
              ⚠️ {runError}
            </div>
          )}

          {/* FIX: RENDER RESULTS PROPERLY */}
          {runResult && !isRunning && (
            <div style={{ 
              padding: 15, 
              background: '#f0fdf4', 
              border: '1px solid #86efac', 
              marginTop: 15, 
              borderRadius: 6,
              // FORCE DARK TEXT so it is visible even in Dark Mode
              color: '#1e1e1e' 
            }}>
              <div style={{ marginBottom: 10, fontSize: '1.1rem', color: '#166534', fontWeight: 'bold' }}>
                Grade: {runResult.grade} / {question.points || 10}
              </div>

              {Array.isArray(runResult.details) ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {runResult.details.map((res: any, i: number) => (
                    <div key={i} style={{ 
                      padding: '8px', 
                      background: res.status === 'Accepted' ? '#dcfce7' : '#fee2e2',
                      borderLeft: `4px solid ${res.status === 'Accepted' ? '#22c55e' : '#ef4444'}`,
                      fontSize: '0.9rem',
                      // FORCE DARK TEXT HERE TOO
                      color: res.status === 'Accepted' ? '#14532d' : '#7f1d1d'
                    }}>
                      <strong>Test Case {i + 1}:</strong> {res.status}
                      {res.stdout && (
                        <div style={{ 
                          marginTop: 4, 
                          fontFamily: 'monospace', 
                          background: 'rgba(255,255,255,0.5)', 
                          padding: 4,
                          borderRadius: 4,
                          // Ensure output text is black
                          color: '#000000' 
                        }}>
                          Output: {res.stdout.trim()}
                        </div>
                      )}
                      {res.compile_output && <pre style={{ color: '#b91c1c', fontSize: '0.8rem' }}>{res.compile_output}</pre>}
                    </div>
                  ))}
                </div>
              ) : (
                <pre style={{ fontSize: '0.8em', whiteSpace: 'pre-wrap', color: '#333' }}>
                   {JSON.stringify(runResult.details, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>

        <div style={{ padding: '20px', borderTop: `1px solid ${colors.border}` }}>
          <button 
            onClick={() => onRunCode(question.question_id, codeToRun)}
            disabled={isRunning || submitting}
            style={{ 
              width: '100%', 
              padding: '12px', 
              marginBottom: '10px', 
              cursor: isRunning || submitting ? 'not-allowed' : 'pointer',
              background: isRunning ? '#b45309' : '#eab308', 
              border: 'none', 
              borderRadius: 6, 
              fontWeight: 'bold',
              color: 'black', // Button text always black
              fontSize: '1rem'
            }}
          >
            {isRunning ? "Running..." : "▶ Run Code"}
          </button>

          <NavigationButtons 
            currentIdx={currentIdx} totalQ={totalQ} submitting={submitting}
            onNavigate={onNavigate} onSubmit={onSubmit} 
          />
        </div>
      </div>

      <div
        onMouseDown={() => { isDragging.current = true; document.body.style.cursor = "col-resize"; }}
        style={{ width: '6px', cursor: 'col-resize', background: '#ccc' }}
      />

      <div style={{ width: `${100 - leftWidth}%`, background: '#1e1e1e' }}>
        <Editor 
          height="100%" width="100%" 
          defaultLanguage="cpp" 
          theme={theme === 'dark' ? "vs-dark" : "light"} 
          value={codeToRun} 
          onChange={(val) => onAnswer(question.question_id, val, "programming")}
          options={{ minimap: { enabled: false }, fontSize: 14, automaticLayout: true }} 
        />
      </div>
    </div>
  );
}
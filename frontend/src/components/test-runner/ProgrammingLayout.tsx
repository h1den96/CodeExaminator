/*import { useState, useRef, useEffect } from "react";
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
      
      
      <div style={{ width: `${leftWidth}%`, display: 'flex', flexDirection: 'column', background: colors.card }}>
        <div style={{ padding: '10px 20px', borderBottom: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 'bold' }}>{testData?.title} — Q{currentIdx + 1}/{totalQ}</span>
          <StatusIndicator status={saveStatus} />
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          <QuestionHeader question={question} idx={currentIdx} />

          
          {isRunning && <div style={{ color: '#0369a1', margin: '10px 0' }}>⏳ Running...</div>}
          
          {runError && (
            <div style={{ padding: 10, background: '#fee2e2', color: '#b91c1c', marginTop: 10, borderRadius: 4 }}>
              ⚠️ {runError}
            </div>
          )}

          
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
}*/

import { useState, useRef, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { useTheme } from "../../context/ThemeContext"; 
import type { Question, SaveStatus } from "../../hooks/useTestSession";
import { StatusIndicator, NavigationButtons, QuestionHeader } from "./TestComponents"; 

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
}

export default function ProgrammingLayout({ 
  testData, question, currentIdx, totalQ, answer, 
  saveStatus, submitting, onAnswer, onNavigate, onSubmit,
  onRunCode, isRunning, runResult, runError
}: Props) {
  const { colors, theme } = useTheme();
  const [leftWidth, setLeftWidth] = useState(40);
  const isDragging = useRef(false);

  // 1. Ref to store code instantly (Fixes 400 Error)
  const codeRef = useRef(answer || question.starter_code || "");

  // Update ref when answer changes from parent (e.g. navigation)
  useEffect(() => {
    if (answer !== undefined) {
      codeRef.current = answer;
    }
  }, [answer]);

  const handleEditorChange = (value: string | undefined) => {
    const val = value || "";
    codeRef.current = val; // Update ref immediately
    onAnswer(question.question_id, val, "programming"); // Sync to parent
  };

  const handleRunClick = () => {
    // Send the value from the REF, which is always current
    onRunCode(question.question_id, codeRef.current);
  };

  // 2. Drag Resizing Logic
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

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', background: colors.bg, color: colors.text, zIndex: 9999 }}>
      
      {/* LEFT PANEL: INSTRUCTIONS & TERMINAL */}
      <div style={{ width: `${leftWidth}%`, display: 'flex', flexDirection: 'column', background: colors.card, borderRight: `1px solid ${colors.border}` }}>
        {/* Header */}
        <div style={{ padding: '10px 20px', borderBottom: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: colors.bg }}>
          <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{testData?.title}</span>
          <StatusIndicator status={saveStatus} />
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <QuestionHeader question={question} idx={currentIdx} />

          {/* --- TERMINAL & RESULTS SECTION --- */}
          {(isRunning || runResult || runError) && (
            <div style={{ 
              marginTop: 'auto', 
              border: `1px solid ${colors.border}`, 
              borderRadius: '8px', 
              overflow: 'hidden',
              backgroundColor: theme === 'dark' ? '#0f172a' : '#f8fafc' 
            }}>
              <div style={{ padding: '8px 12px', background: theme === 'dark' ? '#1e293b' : '#e2e8f0', borderBottom: `1px solid ${colors.border}`, fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
                <span>CONSOLE / OUTPUT</span>
                {isRunning && <span style={{ color: '#0ea5e9' }}>Running...</span>}
              </div>

              <div style={{ padding: '15px', fontFamily: 'monospace', fontSize: '0.85rem', color: theme === 'dark' ? '#cbd5e1' : '#334155' }}>
                
                {/* 1. System/Network Errors */}
                {runError && (
                   <div style={{ color: '#ef4444', marginBottom: '10px' }}>
                     <strong>System Error:</strong> {runError}
                   </div>
                )}

                {/* 2. Compilation / Judge Results */}
                {runResult && (
                  <>
                     {/* Pass/Fail Banner */}
                     <div style={{ 
                        marginBottom: '15px', 
                        padding: '8px', 
                        borderRadius: '4px', 
                        background: runResult.grade === question.points ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        color: runResult.grade === question.points ? '#22c55e' : '#ef4444',
                        fontWeight: 'bold'
                     }}>
                        Grade: {runResult.grade} / {question.points}
                     </div>

                     {/* Details: Syntax Errors or Test Cases */}
                     {runResult.details ? (
                       runResult.details.compile_output ? (
                         // SHOW SYNTAX ERRORS
                         <div style={{ whiteSpace: 'pre-wrap', color: '#ef4444' }}>
                           <strong>Compilation Error:</strong><br/>
                           {atob(runResult.details.compile_output)} {/* Decode Base64 if needed, usually Judge0 returns plain text but let's see */}
                           {runResult.details.compile_output}
                         </div>
                       ) : (
                         // SHOW TEST CASES / STDERR
                         <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                           {/* Stdout/Stderr */}
                           {runResult.details.stderr && (
                             <div style={{ color: '#ef4444', whiteSpace: 'pre-wrap' }}>
                               <strong>Runtime Error:</strong><br/>
                               {runResult.details.stderr}
                             </div>
                           )}
                           {runResult.details.stdout && (
                             <div style={{ whiteSpace: 'pre-wrap' }}>
                               <strong>Output:</strong><br/>
                               {runResult.details.stdout}
                             </div>
                           )}
                           {/* Status Message */}
                           <div>
                             <strong>Status:</strong> {runResult.details.status?.description || runResult.details.status}
                           </div>
                         </div>
                       )
                     ) : (
                       <div>No details available.</div>
                     )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{ padding: '20px', borderTop: `1px solid ${colors.border}`, background: colors.bg }}>
          <button 
            onClick={handleRunClick}
            disabled={isRunning || submitting}
            style={{ 
              width: '100%', 
              padding: '12px', 
              marginBottom: '10px', 
              cursor: isRunning || submitting ? 'not-allowed' : 'pointer',
              background: '#eab308', 
              border: 'none', 
              borderRadius: 6, 
              fontWeight: 'bold',
              color: 'black',
              fontSize: '1rem',
              display: 'flex', justifyContent: 'center', gap: '10px'
            }}
          >
            {isRunning ? "Compiling & Running..." : "▶ Run Code"}
          </button>

          <NavigationButtons 
            currentIdx={currentIdx} totalQ={totalQ} submitting={submitting}
            onNavigate={onNavigate} onSubmit={onSubmit} 
          />
        </div>
      </div>

      {/* DRAG HANDLE */}
      <div
        onMouseDown={() => { isDragging.current = true; document.body.style.cursor = "col-resize"; }}
        style={{ width: '5px', cursor: 'col-resize', background: '#334155', transition: 'background 0.2s' }}
        onMouseEnter={(e) => e.currentTarget.style.background = '#2563eb'}
        onMouseLeave={(e) => e.currentTarget.style.background = '#334155'}
      />

      {/* RIGHT PANEL: EDITOR */}
      <div style={{ width: `${100 - leftWidth}%`, background: '#1e1e1e', display: 'flex', flexDirection: 'column' }}>
        <Editor 
          height="100%" 
          width="100%" 
          defaultLanguage="cpp" 
          theme={theme === 'dark' ? "vs-dark" : "light"} 
          value={codeRef.current} 
          onChange={handleEditorChange}
          options={{ 
            minimap: { enabled: false }, 
            fontSize: 14, 
            automaticLayout: true,
            scrollBeyondLastLine: false,
            padding: { top: 20 }
          }} 
        />
      </div>
    </div>
  );
}
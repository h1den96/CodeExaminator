/*import { useState, useRef, useEffect } from "react";
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

  // 1. Ref to store code instantly (prevents stale state on Run)
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

  // Helper to decode Base64 if backend sends it (Judge0 sometimes does)
  const decodeOutput = (str: string | null) => {
    if (!str) return "";
    try {
      return atob(str);
    } catch (e) {
      return str;
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', background: colors.bg, color: colors.text, zIndex: 9999 }}>
    
      <div style={{ width: `${leftWidth}%`, display: 'flex', flexDirection: 'column', background: colors.card, borderRight: `1px solid ${colors.border}` }}>
    
        <div style={{ padding: '10px 20px', borderBottom: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: colors.bg }}>
          <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{testData?.title}</span>
          <StatusIndicator status={saveStatus} />
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          <QuestionHeader question={question} idx={currentIdx} />

          {(isRunning || runResult || runError) && (
            <div style={{ 
              marginTop: 'auto', // Pushes this box to the bottom of the flex container
              border: `1px solid ${colors.border}`, 
              borderRadius: '6px', 
              overflow: 'hidden',
              backgroundColor: '#1e1e1e', // Always dark background for terminal look
              color: '#e2e8f0',
              fontSize: '0.85rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{ 
                padding: '6px 12px', 
                background: '#334155', 
                borderBottom: `1px solid #475569`, 
                fontWeight: 'bold', 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>💻</span> CONSOLE
                </span>
                {isRunning && <span style={{ color: '#38bdf8' }}>Running...</span>}
              </div>

              <div style={{ padding: '12px', fontFamily: 'monospace', whiteSpace: 'pre-wrap', maxHeight: '250px', overflowY: 'auto' }}>

                {runError && (
                   <div style={{ color: '#ef4444', marginBottom: '8px' }}>
                     <strong>System Error:</strong> {runError}
                   </div>
                )}

                {runResult && (
                  <>
                     <div style={{ 
                        marginBottom: '10px', 
                        display: 'inline-block',
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        background: runResult.grade === question.points ? '#166534' : '#991b1b',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '0.75rem'
                     }}>
                        GRADE: {runResult.grade} / {question.points}
                     </div>

                     {runResult.details ? (
                       <>
                         {runResult.details.compile_output && (
                           <div style={{ color: '#fca5a5', marginBottom: '10px', borderLeft: '2px solid #ef4444', paddingLeft: '8px' }}>
                             <div style={{fontWeight:'bold', color: '#ef4444'}}>COMPILATION ERROR:</div>
                             {decodeOutput(runResult.details.compile_output)}
                           </div>
                         )}

                         {runResult.details.stderr && (
                           <div style={{ color: '#fca5a5', marginBottom: '10px', borderLeft: '2px solid #ef4444', paddingLeft: '8px' }}>
                             <div style={{fontWeight:'bold', color: '#ef4444'}}>RUNTIME ERROR:</div>
                             {runResult.details.stderr}
                           </div>
                         )}

                         {runResult.details.stdout && (
                           <div style={{ color: '#f0fdf4', marginBottom: '5px' }}>
                             <div style={{fontWeight:'bold', color: '#4ade80'}}>OUTPUT:</div>
                             {runResult.details.stdout}
                           </div>
                         )}

                         {!runResult.details.stdout && !runResult.details.stderr && !runResult.details.compile_output && (
                            <div style={{ color: '#94a3b8', fontStyle: 'italic' }}>
                              (Program executed successfully with no output)
                            </div>
                         )}
                       </>
                     ) : (
                       <div style={{ color: '#94a3b8' }}>No output details available.</div>
                     )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: '20px', borderTop: `1px solid ${colors.border}`, background: colors.bg }}>
          <button 
            onClick={handleRunClick}
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
              color: 'black',
              fontSize: '1rem',
              display: 'flex', justifyContent: 'center', gap: '10px'
            }}
          >
            {isRunning ? "Compiling..." : "▶ Run Code"}
          </button>

          <NavigationButtons 
            currentIdx={currentIdx} totalQ={totalQ} submitting={submitting}
            onNavigate={onNavigate} onSubmit={onSubmit} 
          />
        </div>
      </div>

      <div
        onMouseDown={() => { isDragging.current = true; document.body.style.cursor = "col-resize"; }}
        style={{ width: '5px', cursor: 'col-resize', background: '#334155', transition: 'background 0.2s' }}
        onMouseEnter={(e) => e.currentTarget.style.background = '#2563eb'}
        onMouseLeave={(e) => e.currentTarget.style.background = '#334155'}
      />

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

  // 1. Ref to store code instantly (prevents stale state on Run)
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

  // Helper to decode Base64 if backend sends it (Judge0 sometimes does)
  const decodeOutput = (str: string | null) => {
    if (!str) return "";
    try {
      return atob(str);
    } catch (e) {
      return str;
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', background: colors.bg, color: colors.text, zIndex: 9999 }}>
      
      {/* === LEFT PANEL: INSTRUCTIONS & TERMINAL === */}
      <div style={{ width: `${leftWidth}%`, display: 'flex', flexDirection: 'column', background: colors.card, borderRight: `1px solid ${colors.border}` }}>
        
        {/* Header */}
        <div style={{ padding: '10px 20px', borderBottom: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: colors.bg }}>
          <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{testData?.title}</span>
          <StatusIndicator status={saveStatus} />
        </div>
        
        {/* Scrollable Content Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Question Text */}
          <QuestionHeader question={question} idx={currentIdx} />

          {/* === TERMINAL / OUTPUT SECTION (Pushes to bottom) === */}
          {(isRunning || runResult || runError) && (
            <div style={{ 
              marginTop: 'auto', // Pushes this box to the bottom of the flex container
              border: `1px solid ${colors.border}`, 
              borderRadius: '6px', 
              overflow: 'hidden',
              backgroundColor: '#1e1e1e', // Always dark background for terminal look
              color: '#e2e8f0',
              fontSize: '0.85rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}>
              {/* Terminal Header */}
              <div style={{ 
                padding: '6px 12px', 
                background: '#334155', 
                borderBottom: `1px solid #475569`, 
                fontWeight: 'bold', 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>💻</span> CONSOLE
                </span>
                {isRunning && <span style={{ color: '#38bdf8' }}>Running...</span>}
              </div>

              {/* Terminal Body */}
              <div style={{ padding: '12px', fontFamily: 'monospace', whiteSpace: 'pre-wrap', maxHeight: '250px', overflowY: 'auto' }}>
                
                {/* 1. System Error (Network, Server) */}
                {runError && (
                   <div style={{ color: '#ef4444', marginBottom: '8px' }}>
                     <strong>System Error:</strong> {runError}
                   </div>
                )}

                {/* 2. Execution Results */}
                {runResult && (
                  <>
                     {/* Grade Badge */}
                     <div style={{ 
                        marginBottom: '10px', 
                        display: 'inline-block',
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        background: runResult.grade === question.points ? '#166534' : '#991b1b',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '0.75rem'
                     }}>
                        GRADE: {runResult.grade} / {question.points}
                     </div>

                     {/* DETAILS */}
                     {runResult.details ? (
                       <>
                         {/* Compilation Error */}
                         {runResult.details.compile_output && (
                           <div style={{ color: '#fca5a5', marginBottom: '10px', borderLeft: '2px solid #ef4444', paddingLeft: '8px' }}>
                             <div style={{fontWeight:'bold', color: '#ef4444'}}>COMPILATION ERROR:</div>
                             {decodeOutput(runResult.details.compile_output)}
                           </div>
                         )}

                         {/* Runtime Error (stderr) */}
                         {runResult.details.stderr && (
                           <div style={{ color: '#fca5a5', marginBottom: '10px', borderLeft: '2px solid #ef4444', paddingLeft: '8px' }}>
                             <div style={{fontWeight:'bold', color: '#ef4444'}}>RUNTIME ERROR:</div>
                             {runResult.details.stderr}
                           </div>
                         )}

                         {/* Standard Output (stdout) */}
                         {runResult.details.stdout && (
                           <div style={{ color: '#f0fdf4', marginBottom: '5px' }}>
                             <div style={{fontWeight:'bold', color: '#4ade80'}}>OUTPUT:</div>
                             {runResult.details.stdout}
                           </div>
                         )}
                         
                         {/* Empty Output Warning */}
                         {!runResult.details.stdout && !runResult.details.stderr && !runResult.details.compile_output && (
                            <div style={{ color: '#94a3b8', fontStyle: 'italic' }}>
                              (Program executed successfully with no output)
                            </div>
                         )}
                       </>
                     ) : (
                       <div style={{ color: '#94a3b8' }}>No output details available.</div>
                     )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions (Fixed at bottom) */}
        <div style={{ padding: '20px', borderTop: `1px solid ${colors.border}`, background: colors.bg }}>
          <button 
            onClick={handleRunClick}
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
              color: 'black',
              fontSize: '1rem',
              display: 'flex', justifyContent: 'center', gap: '10px'
            }}
          >
            {isRunning ? "Compiling..." : "▶ Run Code"}
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

      {/* === RIGHT PANEL: EDITOR === */}
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
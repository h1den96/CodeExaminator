import React, { useState, useRef, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { useTheme } from "../../context/ThemeContext"; 
import type { Question, TestData, SaveStatus } from "../../hooks/useTestSession";
import { StatusIndicator, NavigationButtons, QuestionHeader } from "./TestComponents"; 

interface Props {
  testData: TestData;
  question: Question;
  currentIdx: number;
  totalQ: number;
  answer: any;
  saveStatus: SaveStatus;
  submitting: boolean;
  onAnswer: (id: number, val: any) => void;
  onNavigate: (idx: number) => void;
  onSubmit: () => void;
  onRunCode: (id: number, code: string) => void; 
  isRunning: boolean; 
  runResult: { status: string; grade: number } | null;
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

  // Resize Logic
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
      
      {/* LEFT PANEL */}
      <div style={{ width: `${leftWidth}%`, display: 'flex', flexDirection: 'column', background: colors.card }}>
        <div style={{ padding: '10px 20px', background: theme === 'dark' ? '#1f1f1f' : '#f9fafb', borderBottom: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{testData.title} — Q{currentIdx + 1}/{totalQ}</span>
          <StatusIndicator status={saveStatus} />
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          <QuestionHeader question={question} idx={currentIdx} />

          {/* 1. LOADING STATE */}
          {isRunning && (
             <div style={{ marginTop: 20, padding: 15, background: '#e0f2fe', color: '#0369a1', borderRadius: 4 }}>
               <span className="loader"></span> ⏳ Sending code to Judge0...
             </div>
          )}

          {/* 2. ERROR STATE */}
          {runError && (
            <div style={{ marginTop: 20, padding: 15, background: '#fee2e2', borderLeft: '4px solid #ef4444', borderRadius: 4, color: '#b91c1c' }}>
              <strong>⚠️ Execution Failed:</strong><br/>
              {runError}
            </div>
          )}

          {/* 3. SUCCESS STATE (Only one block needed) */}
          {runResult && !isRunning && (
            <div style={{ marginTop: 20, padding: 15, background: theme === 'dark' ? '#333' : '#f0fdf4', borderLeft: '4px solid #22c55e', borderRadius: 4 }}>
              <strong style={{ color: theme === 'dark' ? '#4ade80' : '#15803d' }}>Run Results:</strong>
              <div style={{ marginTop: 5 }}>
                Status: {runResult.status} <br/>
                Grade: <strong>{runResult.grade} / {question.points}</strong>
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: '20px', borderTop: `1px solid ${colors.border}` }}>
          
          {/* RUN CODE BUTTON */}
          <div style={{ marginBottom: 15 }}>
            <button 
              onClick={() => onRunCode(question.question_id, answer)}
              disabled={isRunning || submitting}
              style={{ 
                width: '100%', 
                padding: '12px', 
                background: isRunning ? '#b45309' : '#eab308', 
                border: 'none', 
                borderRadius: 6, 
                color: 'black', 
                fontWeight: 'bold', 
                cursor: isRunning ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                fontSize: '1rem'
              }}
            >
              {isRunning ? "Running..." : "▶ Run Code"}
            </button>
          </div>

          <NavigationButtons 
            currentIdx={currentIdx} totalQ={totalQ} submitting={submitting}
            onNavigate={onNavigate} onSubmit={onSubmit} 
          />
        </div>
      </div>

      {/* RESIZE HANDLE */}
      <div
        onMouseDown={() => { isDragging.current = true; document.body.style.cursor = "col-resize"; }}
        style={{ width: '6px', cursor: 'col-resize', backgroundColor: theme === 'dark' ? '#444' : '#ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
      >
        <div style={{ width: '2px', height: '20px', backgroundColor: '#888', borderRadius: '1px' }} />
      </div>

      {/* RIGHT PANEL (EDITOR) */}
      <div style={{ width: `${100 - leftWidth}%`, background: '#1e1e1e' }}>
        <Editor 
          height="100%" width="100%" 
          defaultLanguage="cpp" 
          theme={theme === 'dark' ? "vs-dark" : "light"} 
          value={answer || question.starter_code || ""} 
          onChange={(val) => onAnswer(question.question_id, val)}
          options={{ minimap: { enabled: false }, fontSize: 14, automaticLayout: true }} 
        />
      </div>
    </div>
  );
}
// src/components/test-runner/StandardLayout.tsx
import React from "react";
import { useTheme } from "../../context/ThemeContext";
import type { Question, TestDetails, SaveStatus } from "../../hooks/useTestSession";
// Import QuestionHeader so formatting is consistent!
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
}

export default function StandardLayout({ 
  testData, question, currentIdx, totalQ, answer, 
  saveStatus, submitting, onAnswer, onNavigate, onSubmit 
}: Props) {
  const { colors } = useTheme();

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px', color: colors.text }}>
      
      {/* HEADER */}
      <div style={{ marginBottom: 30, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
           <h1 style={{ margin: 0, fontSize: '1.5rem' }}>{testData.title}</h1>
           <span style={{ color: '#666' }}>Question {currentIdx + 1} of {totalQ}</span>
        </div>
        <StatusIndicator status={saveStatus} />
      </div>

      {/* QUESTION CARD */}
      <div style={{ background: colors.card, padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
        
        {/* FIX: Use QuestionHeader here to get the 'pre-wrap' formatting */}
        <QuestionHeader question={question} idx={currentIdx} />

        {/* OPTIONS RENDERER */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          {/* MCQ */}
          {question.question_type === "mcq" && question.options?.map((opt) => (
            <label 
              key={opt.id} 
              style={{ 
                display: 'flex', alignItems: 'center', gap: '12px', 
                padding: '15px', border: `2px solid ${answer === opt.id ? '#3b82f6' : colors.border}`,
                borderRadius: '8px', cursor: 'pointer',
                background: answer === opt.id ? 'rgba(59, 130, 246, 0.05)' : 'transparent'
              }}
            >
              <input 
                type="radio" 
                name={`q-${question.question_id}`} 
                checked={answer === opt.id} 
                onChange={() => onAnswer(question.question_id, opt.id, "mcq")}
                style={{ width: '18px', height: '18px' }}
              />
              {/* FIX: Ensure this is opt.text (NOT opt.option_text) */}
              <span style={{ fontSize: '1rem' }}>{opt.text}</span>
            </label>
          ))}

          {/* True/False */}
          {question.question_type === "true_false" && (
            <>
              {[true, false].map((val) => (
                <label 
                  key={val.toString()} 
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: '12px', 
                    padding: '15px', border: `2px solid ${answer === val ? '#3b82f6' : colors.border}`,
                    borderRadius: '8px', cursor: 'pointer',
                    background: answer === val ? 'rgba(59, 130, 246, 0.05)' : 'transparent'
                  }}
                >
                  <input 
                    type="radio" 
                    name={`q-${question.question_id}`} 
                    checked={answer === val}
                    onChange={() => onAnswer(question.question_id, val, "true_false")}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <span style={{ fontSize: '1rem' }}>{val ? "True" : "False"}</span>
                </label>
              ))}
            </>
          )}

        </div>
      </div>

      <div style={{ marginTop: 30 }}>
        <NavigationButtons 
            currentIdx={currentIdx} totalQ={totalQ} submitting={submitting}
            onNavigate={onNavigate} onSubmit={onSubmit} 
        />
      </div>
    </div>
  );
}
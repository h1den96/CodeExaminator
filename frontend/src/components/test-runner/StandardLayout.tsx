// src/components/test-runner/StandardLayout.tsx
/*import React from "react";
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
      

      <div style={{ marginBottom: 30, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
           <h1 style={{ margin: 0, fontSize: '1.5rem' }}>{testData.title}</h1>
           <span style={{ color: '#666' }}>Question {currentIdx + 1} of {totalQ}</span>
        </div>
        <StatusIndicator status={saveStatus} />
      </div>


      <div style={{ background: colors.card, padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
        
        
        <QuestionHeader question={question} idx={currentIdx} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          

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
             
              <span style={{ fontSize: '1rem' }}>{opt.text}</span>
            </label>
          ))}

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
  */

import { useTheme } from "../../context/ThemeContext";
import { NavigationButtons, QuestionHeader, StatusIndicator } from "./TestComponents";

export default function StandardLayout(props: any) {
  const { 
    testData, question, currentIdx, totalQ, answer, 
    saveStatus, submitting, onAnswer, onNavigate, onSubmit 
  } = props;
  
  const { colors } = useTheme();

  // --- THE NEW LOGIC ---
  const handleSelection = (optionId: number) => {
    if (question.allow_multiple) {
      // CHECKBOX MODE (Toggle)
      // 1. Get current array (or empty if null)
      const currentSelection = Array.isArray(answer) ? answer : [];
      
      let newSelection;
      if (currentSelection.includes(optionId)) {
        // Remove it
        newSelection = currentSelection.filter((id: number) => id !== optionId);
      } else {
        // Add it
        newSelection = [...currentSelection, optionId];
      }
      // Send Array to Parent
      onAnswer(question.question_id, newSelection, 'mcq');
    
    } else {
      // RADIO MODE (Replace)
      // Send Single ID to Parent
      onAnswer(question.question_id, optionId, 'mcq'); 
    }
  };

  const isSelected = (val: any) => {
    if (question.allow_multiple) {
      return Array.isArray(answer) && answer.includes(val);
    }
    // Handle legacy single-value or single-item array
    return answer === val || (Array.isArray(answer) && answer[0] === val);
  };

  return (
    <div style={{ minHeight: "100vh", background: colors.bg, color: colors.text, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: "40px 20px" }}>
      <div style={{ width: '100%', maxWidth: 800 }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center' }}>
          <div>
            <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{testData.title}</span>
            <div style={{ fontSize: '0.9rem', color: colors.textSec }}>Question {currentIdx + 1} of {totalQ}</div>
          </div>
          <StatusIndicator status={saveStatus} />
        </div>

        {/* Card */}
        <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 30, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}>
          <QuestionHeader question={question} idx={currentIdx} />
          
          {/* HINT for Students */}
          {question.allow_multiple && (
            <div style={{ marginBottom: 15, padding: '8px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', borderRadius: 4, fontSize: '0.9rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>ℹ️</span> 
              <span>Select all that apply</span>
            </div>
          )}

          {/* MCQ OPTIONS */}
          {question.question_type === 'mcq' && question.options?.map((opt: any) => {
            const selected = isSelected(opt.id);
            return (
              <div 
                key={opt.id}
                onClick={() => handleSelection(opt.id)}
                style={{
                  padding: 15, margin: '10px 0', borderRadius: 8, cursor: 'pointer',
                  border: selected ? '2px solid #3b82f6' : `1px solid ${colors.border}`,
                  background: selected ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                  transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', gap: '15px'
                }}
              >
                {/* Visual Checkbox or Radio */}
                <div style={{
                  width: 22, height: 22, 
                  borderRadius: question.allow_multiple ? 4 : '50%', // Square vs Circle
                  border: selected ? 'none' : `2px solid ${colors.textSec}`,
                  background: selected ? '#3b82f6' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontWeight: 'bold', fontSize: 14,
                  flexShrink: 0
                }}>
                  {selected && (question.allow_multiple ? '✓' : '')} 
                  {selected && !question.allow_multiple && <div style={{width: 8, height: 8, background: 'white', borderRadius: '50%'}} />}
                </div>

                <span style={{ fontSize: '1rem' }}>{opt.text}</span>
              </div>
            );
          })}

          {/* TRUE/FALSE UI (Unchanged) */}
          {(question.question_type === 'true_false' || question.question_type === 'tf') && (
            <div style={{ display: 'flex', gap: 20, marginTop: 20 }}>
              {['true', 'false'].map((val) => (
                <div
                  key={val}
                  onClick={() => onAnswer(question.question_id, val, 'true_false')}
                  style={{
                    flex: 1, padding: 20, textAlign: 'center', borderRadius: 8, cursor: 'pointer', textTransform: 'capitalize', fontWeight: isSelected(val) ? 'bold' : 'normal',
                    border: isSelected(val) ? '2px solid #3b82f6' : `1px solid ${colors.border}`,
                    background: isSelected(val) ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                    transition: 'all 0.2s'
                  }}
                >
                  {val}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <NavigationButtons 
          currentIdx={currentIdx} totalQ={totalQ} submitting={submitting}
          onNavigate={onNavigate} onSubmit={onSubmit}
        />
      </div>
    </div>
  );
}
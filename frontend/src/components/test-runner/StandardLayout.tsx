import React from 'react';
import { useTheme } from "../../context/ThemeContext";
import { NavigationButtons, QuestionHeader, StatusIndicator } from "./TestComponents";

export default function StandardLayout(props: any) {
  const { 
    testData, question, currentIdx, totalQ, answer, 
    saveStatus, submitting, onAnswer, onNavigate, onSubmit 
  } = props;
  
  const { colors } = useTheme();

  // --- LOGIC: Handle Selection ---
  const handleSelection = (optionId: number) => {
    if (question.allow_multiple) {
      // 🔲 CHECKBOX MODE (Array)
      const currentSelection = Array.isArray(answer) ? answer : [];
      
      let newSelection;
      if (currentSelection.includes(optionId)) {
        // Remove if already selected
        newSelection = currentSelection.filter((id: number) => id !== optionId);
      } else {
        // Add if not selected
        newSelection = [...currentSelection, optionId];
      }
      onAnswer(question.question_id, newSelection, 'mcq');
    
    } else {
      // 🔘 RADIO MODE (Single Value)
      onAnswer(question.question_id, optionId, 'mcq'); 
    }
  };

  // --- LOGIC: Check if Selected ---
  const isSelected = (val: any) => {
    if (question.allow_multiple) {
      return Array.isArray(answer) && answer.includes(val);
    }
    return answer === val || (Array.isArray(answer) && answer[0] === val);
  };

  return (
    <div style={{ minHeight: "100vh", background: colors.bg, color: colors.text, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: "40px 20px" }}>
      <div style={{ width: '100%', maxWidth: 800 }}>
        
        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center' }}>
          <div>
            <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{testData.title}</span>
            <div style={{ fontSize: '0.9rem', color: colors.textSec }}>
                Question {currentIdx + 1} of {totalQ}
            </div>
          </div>
          <StatusIndicator status={saveStatus} />
        </div>

        {/* QUESTION CARD */}
        <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 30, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}>
          <QuestionHeader question={question} idx={currentIdx} />
          
          {/* 💡 HINT for Multi-Select */}
          {question.allow_multiple && (
            <div style={{ 
                marginBottom: 20, padding: '8px 12px', 
                background: 'rgba(245, 158, 11, 0.1)', 
                color: '#d97706', 
                borderRadius: 6, 
                fontSize: '0.9rem', 
                fontWeight: '600', 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '8px' 
            }}>
              <span>ℹ️</span> 
              <span>Select all that apply</span>
            </div>
          )}

          {/* --- MCQ OPTIONS RENDERER --- */}
          {question.question_type === 'mcq' && question.options?.map((opt: any) => {
            // FIX: Handle mismatch between 'id' and 'option_id'
            const optionId = opt.id || opt.option_id; 
            const selected = isSelected(optionId);

            console.log("DEBUG OPTION:", opt);
            
            return (
              <div 
                key={optionId}
                onClick={() => handleSelection(optionId)}
                style={{
                  padding: "16px", margin: '12px 0', borderRadius: 8, cursor: 'pointer',
                  border: selected ? '2px solid #3b82f6' : `1px solid ${colors.border}`,
                  background: selected ? 'rgba(59, 130, 246, 0.05)' : colors.inputBg,
                  transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', gap: '15px'
                }}
              >
                {/* ICON */}
                <div style={{
                  width: 24, height: 24, 
                  borderRadius: question.allow_multiple ? 4 : '50%',
                  border: selected ? 'none' : `2px solid #9ca3af`,
                  background: selected ? '#3b82f6' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontWeight: 'bold', fontSize: 16,
                  flexShrink: 0
                }}>
                  {selected && (question.allow_multiple ? '✓' : '')} 
                  {selected && !question.allow_multiple && <div style={{width: 10, height: 10, background: 'white', borderRadius: '50%'}} />}
                </div>

                {/* 👇 FIX APPLIED HERE: Checks for 'text' OR 'option_text' */}
                <span style={{ fontSize: '1.05rem', lineHeight: '1.5' }}>
                  {opt.text || opt.option_text || "Error: Missing Text"}
                </span>
              </div>
            );
          })}

          {/* --- TRUE/FALSE RENDERER --- */}
          {(question.question_type === 'true_false' || question.question_type === 'tf') && (
            <div style={{ display: 'flex', gap: 20, marginTop: 20 }}>
              {['true', 'false'].map((val) => {
                  const isActive = String(answer) === val;
                  return (
                    <div
                      key={val}
                      onClick={() => onAnswer(question.question_id, val === 'true', 'true_false')}
                      style={{
                        flex: 1, padding: 25, textAlign: 'center', borderRadius: 8, cursor: 'pointer', 
                        textTransform: 'capitalize', fontWeight: isActive ? 'bold' : 'normal', fontSize: '1.1rem',
                        border: isActive ? '2px solid #3b82f6' : `1px solid ${colors.border}`,
                        background: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                        transition: 'all 0.2s'
                      }}
                    >
                      {val}
                    </div>
                  );
              })}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <NavigationButtons 
          currentIdx={currentIdx} totalQ={totalQ} submitting={submitting}
          onNavigate={onNavigate} onSubmit={onSubmit}
        />
      </div>
    </div>
  );
}
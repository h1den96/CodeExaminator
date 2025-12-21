import React from "react";
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
}

export default function StandardLayout({ 
  testData, question, currentIdx, totalQ, answer, 
  saveStatus, submitting, onAnswer, onNavigate, onSubmit 
}: Props) {
  const { colors, theme } = useTheme();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: colors.bg, padding: 20, color: colors.text }}>
      <div style={{ width: '100%', maxWidth: '800px', backgroundColor: colors.card, borderRadius: 8, border: `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column', minHeight: '500px' }}>
        
        {/* HEADER */}
        <div style={{ padding: '20px', borderBottom: `1px solid ${colors.border}`, background: theme === 'dark' ? '#1f1f1f' : '#fafafa' }}>
           <h1 style={{ margin: 0, fontSize: '1.2rem' }}>{testData.title}</h1>
           <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
             <span style={{ color: colors.textSec, fontSize: '0.9rem' }}>Question {currentIdx + 1} of {totalQ}</span>
             <StatusIndicator status={saveStatus} />
           </div>
        </div>

        {/* CONTENT */}
        <div style={{ padding: '30px', flex: 1 }}>
          <QuestionHeader question={question} idx={currentIdx} />
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: 20 }}>
            {/* True/False Logic */}
            {question.question_type === "true_false" && ['true', 'false'].map((optStr) => {
                const isTrue = optStr === 'true';
                const isSelected = answer === isTrue;
                return (
                  <label key={optStr} style={optionStyle(isSelected, colors, theme)}>
                    <input type="radio" name={`q-${question.question_id}`} checked={isSelected} 
                      onChange={() => onAnswer(question.question_id, isTrue)} style={{ marginRight: '10px' }} />
                    {optStr.charAt(0).toUpperCase() + optStr.slice(1)}
                  </label>
                );
            })}

            {/* MCQ Logic */}
            {question.question_type === "mcq" && question.options?.map((opt) => {
                const isSelected = answer === opt.option_id;
                return (
                  <label key={opt.option_id} style={optionStyle(isSelected, colors, theme)}>
                    <input type="radio" name={`q-${question.question_id}`} checked={isSelected} 
                      onChange={() => onAnswer(question.question_id, opt.option_id)} style={{ marginRight: '10px' }} />
                    {opt.option_text}
                  </label>
                );
            })}
          </div>
        </div>

        {/* FOOTER */}
        <div style={{ padding: '20px', background: theme === 'dark' ? '#1f1f1f' : '#fafafa', borderTop: `1px solid ${colors.border}` }}>
          <NavigationButtons currentIdx={currentIdx} totalQ={totalQ} submitting={submitting} onNavigate={onNavigate} onSubmit={onSubmit} />
        </div>
      </div>
    </div>
  );
}

// Helper Style
const optionStyle = (isSelected: boolean, colors: any, theme: string) => ({
  display: 'flex', alignItems: 'center', padding: '15px', 
  border: isSelected ? '1px solid #2563eb' : `1px solid ${colors.border}`, 
  borderRadius: 6, 
  background: isSelected ? (theme === 'dark' ? '#1e3a8a' : '#eff6ff') : colors.card, 
  cursor: 'pointer'
});
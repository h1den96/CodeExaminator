import React from 'react';
import { useTheme } from "../../context/ThemeContext";
import type { Question, SaveStatus } from "../../hooks/useTestSession";

export const StatusIndicator = ({ status }: { status: SaveStatus }) => {
  let color = 'gray', text = 'Saved';
  if (status === 'saving') { color = 'orange'; text = '⏳ Saving...'; }
  if (status === 'error') { color = 'red'; text = '❌ Not Saved'; }
  if (status === 'saved') { color = 'green'; text = '✅ Saved'; }
  return <span style={{ color, fontWeight: 'bold', fontSize: '0.85rem' }}>{text}</span>;
};

export const QuestionHeader = ({ question, idx }: { question: Question, idx: number }) => {
  const { colors, theme } = useTheme();
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>{question.title || `Question ${idx + 1}`}</h2>
        <span style={{ background: theme === 'dark' ? '#333' : '#e5e7eb', padding: '4px 8px', borderRadius: 4, fontSize: '0.9rem' }}>
          {question.points} pts
        </span>
      </div>
      <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, color: colors.textSec }}>
        {question.body || <i>No instructions provided.</i>}
      </div>
    </div>
  );
};

export const NavigationButtons = ({ currentIdx, totalQ, submitting, onNavigate, onSubmit }: any) => {
  const { colors } = useTheme();
  const isLast = currentIdx === totalQ - 1;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <button onClick={() => onNavigate(currentIdx - 1)} disabled={currentIdx === 0} 
        style={{ padding: '8px 16px', borderRadius: 4, border: `1px solid ${colors.border}`, background: colors.card, color: colors.text, opacity: currentIdx === 0 ? 0.5 : 1 }}>
        Previous
      </button>
      
      {isLast ? (
        <button onClick={onSubmit} disabled={submitting} 
          style={{ padding: '8px 16px', background: '#16a34a', color: 'white', border: 'none', borderRadius: 4, fontWeight: 'bold' }}>
          {submitting ? "Submitting..." : "Submit Test"}
        </button>
      ) : (
        <button onClick={() => onNavigate(currentIdx + 1)} 
          style={{ padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 4 }}>
          Next Question
        </button>
      )}
    </div>
  );
};
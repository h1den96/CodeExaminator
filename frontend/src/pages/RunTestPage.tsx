// src/pages/RunTestPage.tsx
import React from "react";
import ProgrammingLayout from "../components/test-runner/ProgrammingLayout"; 
import StandardLayout from "../components/test-runner/StandardLayout";
import { useTestSession } from "../hooks/useTestSession";
import { useTheme } from "../context/ThemeContext";

export default function RunTestPage() {
  const { colors } = useTheme();
  
  // The Hook handles all logic (loading, errors, navigation, submission)
  const { 
    loading, error, data, currentIdx, answers, saveStatus, submitting,
    handleAnswer, submitTest, setCurrentIdx,
    runCode, isRunning, runResult, runError
  } = useTestSession();

  // 1. Loading / Error States
  if (loading) return (
    <div style={{ padding: 40, textAlign: 'center', color: colors.text }}>
      <h2>Loading Exam...</h2>
    </div>
  );
  
  if (error) return (
    <div style={{ padding: 40, textAlign: 'center', color: '#ef4444' }}>
      <h2>Error Loading Test</h2>
      <p>{error}</p>
      <button onClick={() => window.location.href = '/tests'}>Back to Dashboard</button>
    </div>
  );

  if (!data) return null;

  // 2. Data Preparation
  const question = data.test.questions[currentIdx];
  const totalQ = data.test.questions.length;
  
  // Robust check: handles "programming" or "prog" from DB
  const isProgramming = 
    question.question_type === "programming" || 
    question.question_type === "prog";

  // Props shared by both layouts
  const commonProps = {
    testData: data.test,
    question,
    currentIdx,
    totalQ,
    answer: answers[question.question_id],
    saveStatus,
    submitting,
    onAnswer: handleAnswer,
    onNavigate: setCurrentIdx,
    onSubmit: submitTest
  };

  // 3. Render the Correct Layout
  if (isProgramming) {
    return (
      <ProgrammingLayout 
        {...commonProps} 
        onRunCode={runCode}
        isRunning={isRunning}
        runResult={runResult}
        runError={runError}
      />
    );
  }

  return (
    <StandardLayout 
      {...commonProps} 
    />
  );
}
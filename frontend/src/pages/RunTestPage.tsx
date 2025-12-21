// src/pages/RunTestPage.tsx
import React from "react";
import { useTestSession } from "../hooks/useTestSession";
import ProgrammingLayout from "../components/test-runner/ProgrammingLayout";
import StandardLayout from "../components/test-runner/StandardLayout";
import { useTheme } from "../context/ThemeContext";

export default function RunTestPage() {
  const { colors } = useTheme();
  
  // 1. Get ALL functions from your hook, including the new 'runCode' logic
  const { 
    loading, error, data, currentIdx, answers, saveStatus, submitting,
    handleAnswer, submitTest, setCurrentIdx,
    runCode, isRunning, runResult, runError // <--- IMPORTANT: Get these from the hook
  } = useTestSession();

  if (loading) return <div style={{ height: "100vh", display: "grid", placeItems: "center", background: colors.bg, color: colors.text }}>Starting test...</div>;
  if (error) return <div style={{ height: "100vh", display: "grid", placeItems: "center", background: colors.bg, color: "red" }}>{error}</div>;
  if (!data) return null;

  const question = data.test.questions[currentIdx];
  const totalQ = data.test.questions.length;
  
  // Check if it's a programming question
  const isProgramming = question.question_type.includes("prog") || typeof question.starter_code === "string";

  // 2. Define props shared by BOTH layouts (Navigation, Saving, etc.)
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

  // 3. Render the correct layout
 if (isProgramming) {
    return (
      <ProgrammingLayout 
        {...commonProps} 
        onRunCode={runCode}
        isRunning={isRunning}
        runResult={runResult}
        runError={runError} // <--- Pass it here
      />
    );
  }

  // Standard layout (MCQ/TrueFalse) doesn't need runCode
  return <StandardLayout {...commonProps} />;
}
// src/pages/RunTestPage.tsx
import React from "react";
// Ensure this path is 100% correct relative to this file
import ProgrammingLayout from "../components/test-runner/ProgrammingLayout"; 
import StandardLayout from "../components/test-runner/StandardLayout";
import { useTestSession } from "../hooks/useTestSession";
import { useTheme } from "../context/ThemeContext";

export default function RunTestPage() {
  const { colors } = useTheme();
  
  const { 
    loading, error, data, currentIdx, answers, saveStatus, submitting,
    handleAnswer, submitTest, setCurrentIdx,
    runCode, isRunning, runResult, runError
  } = useTestSession();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!data) return null;

  const question = data.test.questions[currentIdx];
  const totalQ = data.test.questions.length;
  
  // Robust check for programming type
  const isProgramming = question.question_type === "programming" || question.question_type.includes("prog");

  const commonProps = {
    testData: data.test,
    question,
    currentIdx,
    totalQ,
    answer: answers[question.question_id],
    saveStatus,
    submitting,
    onAnswer: handleAnswer, // This function expects (id, val, type)
    onNavigate: setCurrentIdx,
    onSubmit: submitTest
  };

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

  // Pass "mcq" or "true_false" manually for StandardLayout
  return (
    <StandardLayout 
      {...commonProps} 
      // Example wrapper to inject type if StandardLayout doesn't handle it
      onAnswer={(id, val) => handleAnswer(id, val, question.question_type)} 
    />
  );
}
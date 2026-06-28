// src/pages/RunTestPage.tsx
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Import navigate
import ProgrammingLayout from "../components/test-runner/ProgrammingLayout";
import StandardLayout from "../components/test-runner/StandardLayout";
import { useTestSession } from "../hooks/useTestSession";
import { useTheme } from "../context/ThemeContext";

export default function RunTestPage() {
  const navigate = useNavigate();
  const { colors } = useTheme();

  const {
    loading,
    error,
    data,
    currentIdx,
    answers,
    saveStatus,
    submitting,
    handleAnswer,
    submitTest,
    setCurrentIdx,
    runCode,
    isRunning,
    runResult,
    runError,
  } = useTestSession();

  // 1. Loading State
  if (loading)
    return (
      <div style={{ padding: 40, textAlign: "center", color: colors.text }}>
        <h2>Loading Exam...</h2>
      </div>
    );

  // 2. Error State (Updated to handle "Already Submitted")
  if (error) {
    // Check if the error message indicates a conflict (409)
    const isAlreadySubmitted =
      error.includes("TEST_ALREADY_SUBMITTED") ||
      error.includes("already completed") ||
      error.includes("already submitted");

    if (isAlreadySubmitted) {
      return (
        <div
          style={{
            padding: 60,
            textAlign: "center",
            maxWidth: 600,
            margin: "0 auto",
          }}
        >
          <h2 style={{ color: "#16a34a" }}>Assessment Complete</h2>
          <p style={{ color: colors.textSec, marginBottom: 30 }}>
            You have already submitted this test. You cannot take it again.
          </p>
          <button
            onClick={() => navigate("/teacher/dashboard")} // Or /student/dashboard
            style={{
              padding: "12px 24px",
              backgroundColor: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Return to Dashboard
          </button>
        </div>
      );
    }

    // Generic Error Fallback
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#ef4444" }}>
        <h2>Error Loading Test</h2>
        <p>{error}</p>
        <button
          onClick={() => navigate("/teacher/dashboard")}
          style={{ padding: "8px 16px", marginTop: "10px", cursor: "pointer" }}
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  // 3. Data Check
  if (!data) return null;

  // 4. Data Preparation
  const question = data.test.questions[currentIdx];
  const totalQ = data.test.questions.length;

  const isProgramming =
    question.question_type === "programming" ||
    question.question_type === "prog";

  const commonProps = {
    testData: data.test,
    question,
    currentIdx,
    totalQ,
    answer: answers[question.question_id] || question.starter_code || "",
    saveStatus,
    submitting,
    onAnswer: handleAnswer,
    onNavigate: setCurrentIdx,
    onSubmit: submitTest,
  };

  // 5. Render Layout
  if (isProgramming) {

    const fullBoilerplate = question.boilerplate_code || "";
    const parts = fullBoilerplate.split("// {{STUDENT_CODE}}");
    
    const topPart = parts[0] || "";
    const bottomPart = parts[1] || "";

    return (
      <ProgrammingLayout
        {...commonProps}
        onRunCode={runCode}
        isRunning={isRunning}
        runResult={runResult}
        runError={runError}
        topPart={topPart}
        bottomPart={bottomPart}
      />
    );
  }

  return <StandardLayout {...commonProps} />;
}

// src/pages/TestDetailsPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import api from '../api/axios';

// 1. Define the shape of a Question
interface Question {
  question_id: number;
  question_type: 'mcq' | 'true_false' | 'programming';
  text: string;
  points: number;
  // Fields for the Teacher's "Answer Key"
  correct_answer?: string | boolean; 
  options?: { text: string; is_correct: boolean }[]; // Specific structure for MCQs
  test_cases?: any[]; // Array for programming test cases
}

// 2. Define the shape of the full Test
interface TestDetail {
  test_id: number;
  title: string;
  description: string;
  is_published: boolean;
  questions: Question[];
}

export default function TestDetailsPage() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const { colors } = useTheme();

  const [test, setTest] = useState<TestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAnswers, setShowAnswers] = useState(false); // Controls "Answer Key" visibility

  // 3. Load Test Data
  useEffect(() => {
    api.get(`/tests/${testId}`)
      .then(res => setTest(res.data))
      .catch(err => {
        console.error("Failed to load test", err);
        alert("Error loading test details.");
      })
      .finally(() => setLoading(false));
  }, [testId]);

  // 4. Handle Publish/Unpublish
  const handlePublishToggle = async () => {
    if (!test) return;
    try {
      const newStatus = !test.is_published;
      // Optimistically update UI
      setTest({ ...test, is_published: newStatus });
      // Send update to backend
      await api.put(`/tests/${testId}/publish`, { is_published: newStatus });
    } catch (err) {
      console.error(err);
      alert("Failed to update status. Please try again.");
      // Revert if failed
      setTest(prev => prev ? { ...prev, is_published: !prev.is_published } : null);
    }
  };

  if (loading) return <div style={{ padding: "40px", color: colors.text }}>Loading Test Details...</div>;
  if (!test) return <div style={{ padding: "40px", color: colors.text }}>Test not found.</div>;

  return (
    <div style={{ padding: "40px 20px", maxWidth: "1000px", margin: "0 auto", backgroundColor: colors.bg, minHeight: "100vh" }}>
      
      {/* HEADER: Back Button, Title, Controls */}
      <div style={{ marginBottom: "30px", borderBottom: `1px solid ${colors.border}`, paddingBottom: "20px" }}>
        <button 
            onClick={() => navigate('/teacher/dashboard')} 
            style={{ marginBottom: "15px", background: "none", border: "none", color: colors.textSec, cursor: "pointer", fontSize: "0.9rem" }}
        >
          &larr; Back to Dashboard
        </button>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "20px" }}>
            <div>
                <h1 style={{ margin: "0 0 10px 0", color: colors.text }}>{test.title}</h1>
                <p style={{ margin: 0, color: colors.textSec }}>{test.description || "No description provided."}</p>
                <div style={{ marginTop: "10px" }}>
                    <span style={{ 
                        fontSize: "0.8rem", 
                        padding: "4px 8px", 
                        borderRadius: "4px",
                        backgroundColor: test.is_published ? "#dcfce7" : "#f3f4f6",
                        color: test.is_published ? "#166534" : "#4b5563",
                        fontWeight: "bold"
                    }}>
                        STATUS: {test.is_published ? "PUBLISHED" : "DRAFT"}
                    </span>
                </div>
            </div>
            
            <div style={{ display: "flex", gap: "10px" }}>
                <button 
                    onClick={() => setShowAnswers(!showAnswers)}
                    style={{
                        padding: "10px 15px",
                        backgroundColor: showAnswers ? "#e0f2fe" : "transparent",
                        color: showAnswers ? "#0284c7" : colors.text,
                        border: `1px solid ${showAnswers ? "#0284c7" : colors.border}`,
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontWeight: "500"
                    }}
                >
                    {showAnswers ? "Hide Answers" : "👁️ Show Answers"}
                </button>

                <button 
                    onClick={handlePublishToggle}
                    style={{
                        padding: "10px 20px",
                        backgroundColor: test.is_published ? "#dcfce7" : "#2563eb",
                        color: test.is_published ? "#166534" : "white",
                        border: test.is_published ? "1px solid #86efac" : "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontWeight: "bold",
                    }}
                >
                    {test.is_published ? "Unpublish" : "🚀 Publish Now"}
                </button>
            </div>
        </div>
      </div>

      {/* QUESTIONS LIST */}
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {test.questions.map((q, index) => (
            <div 
                key={q.question_id}
                style={{
                    backgroundColor: colors.card,
                    border: `1px solid ${colors.border}`,
                    borderRadius: "8px",
                    padding: "20px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
                }}
            >
                {/* Question Metadata */}
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                    <span style={{ fontWeight: "bold", color: "#64748b", textTransform: "uppercase", fontSize: "0.85rem" }}>
                        Q{index + 1} &mdash; {q.question_type.replace("_", " ")}
                    </span>
                    <span style={{ fontSize: "0.9rem", color: colors.textSec, backgroundColor: colors.bg, padding: "2px 8px", borderRadius: "4px" }}>
                        {q.points} Points
                    </span>
                </div>

                {/* Question Body */}
                <div style={{ fontSize: "1.05rem", marginBottom: "15px", color: colors.text, whiteSpace: "pre-wrap" }}>
                    {q.text}
                </div>

                {/* ANSWER KEY SECTION (Conditional) */}
                {showAnswers && (
                    <div style={{ 
                        marginTop: "15px", 
                        padding: "15px", 
                        backgroundColor: "#f0fdf4", // Light green background
                        borderLeft: "4px solid #22c55e", // Green accent
                        borderRadius: "4px",
                        fontSize: "0.95rem"
                    }}>
                        <strong style={{ color: "#15803d", display: "block", marginBottom: "5px" }}>Correct Answer:</strong>
                        
                        <div style={{ color: "#166534" }}>
                            {/* TRUE / FALSE */}
                            {q.question_type === 'true_false' && (
                                <span>{String(q.correct_answer).toUpperCase()}</span>
                            )}
                            
                            {/* MCQ */}
                            {q.question_type === 'mcq' && q.options && (
                                <ul style={{ margin: "5px 0 0 20px", padding: 0 }}>
                                    {q.options.map((opt, i) => (
                                        <li key={i} style={{ fontWeight: opt.is_correct ? "bold" : "normal", color: opt.is_correct ? "#15803d" : "#166534" }}>
                                            {opt.text} {opt.is_correct && "✅"}
                                        </li>
                                    ))}
                                </ul>
                            )}

                            {/* PROGRAMMING */}
                            {q.question_type === 'programming' && (
                                <div>
                                    <p style={{ margin: "0 0 5px 0", fontSize: "0.9rem" }}>Test Cases:</p>
                                    <pre style={{ 
                                        backgroundColor: "rgba(255,255,255,0.7)", 
                                        padding: "10px", 
                                        borderRadius: "4px", 
                                        overflowX: "auto",
                                        border: "1px solid #bbf7d0",
                                        margin: 0
                                    }}>
                                        {JSON.stringify(q.test_cases, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        ))}
        
        {test.questions.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px", color: colors.textSec }}>
                No questions found in this test.
            </div>
        )}
      </div>

    </div>
  );
}
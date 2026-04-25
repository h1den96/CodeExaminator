// src/pages/TestDetailsPage.tsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import api from "../api/axios";

// 1. Submissions Interface
interface Submission {
  submission_id: number;
  student_id: string;
  status: string;
  started_at: string;
  submitted_at: string | null;
  total_grade: string | null;
}

// 2. Question Interface
interface Question {
  question_id: number;
  question_type: "mcq" | "true_false" | "programming";
  text: string;
  points: number;
  correct_answer?: string | boolean;
  options?: { text: string; is_correct: boolean }[]; 
  test_cases?: any[]; 
}

// 3. Test Detail Interface
interface TestDetail {
  test_id: number;
  title: string;
  description: string;
  is_published: boolean;
  questions?: Question[];
  slots?: Question[]; 
  submissions?: Submission[];
}

export default function TestDetailsPage() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const { colors } = useTheme();

  const [test, setTest] = useState<TestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAnswers, setShowAnswers] = useState(false);

  useEffect(() => {
    api
      .get(`/tests/${testId}`)
      .then((res) => setTest(res.data))
      .catch((err) => {
        console.error("Failed to load test", err);
        alert("Error loading test details.");
      })
      .finally(() => setLoading(false));
  }, [testId]);

  const handlePublishToggle = async () => {
    if (!test) return;
    try {
      const newStatus = !test.is_published;
      setTest({ ...test, is_published: newStatus });
      await api.put(`/tests/${testId}/publish`, { is_published: newStatus });
    } catch (err) {
      console.error(err);
      alert("Failed to update status. Please try again.");
      setTest((prev) =>
        prev ? { ...prev, is_published: !prev.is_published } : null,
      );
    }
  };

  if (loading)
    return (
      <div style={{ padding: "40px", color: colors.text }}>
        Loading Test Details...
      </div>
    );
  if (!test)
    return (
      <div style={{ padding: "40px", color: colors.text }}>Test not found.</div>
    );

  // Safe fallbacks for arrays
  const questionsList = test.questions || test.slots || [];
  const submissionsList = test.submissions || [];

  // Calculate Submissions Stats
  const completedSubmissions = submissionsList.filter(
    (s) => ["submitted", "completed", "graded"].includes(s.status.toLowerCase())
  );
  const averageGrade =
    completedSubmissions.length > 0
      ? (
          completedSubmissions.reduce(
            (acc, curr) => acc + Number(curr.total_grade || 0),
            0
          ) / completedSubmissions.length
        ).toFixed(2)
      : "N/A";

  return (
    <div
      style={{
        padding: "40px 20px",
        maxWidth: "1200px",
        margin: "0 auto",
        backgroundColor: colors.bg,
        minHeight: "100vh",
      }}
    >
      {/* HEADER: Back Button, Title, Controls */}
      <div
        style={{
          marginBottom: "30px",
          borderBottom: `1px solid ${colors.border}`,
          paddingBottom: "20px",
        }}
      >
        <button
          onClick={() => navigate("/teacher/dashboard")}
          style={{
            marginBottom: "15px",
            background: "none",
            border: "none",
            color: colors.textSec,
            cursor: "pointer",
            fontSize: "0.9rem",
          }}
        >
          &larr; Back to Dashboard
        </button>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: "20px",
          }}
        >
          <div>
            <h1 style={{ margin: "0 0 10px 0", color: colors.text }}>
              {test.title}
            </h1>
            <p style={{ margin: 0, color: colors.textSec }}>
              {test.description || "No description provided."}
            </p>
            <div style={{ marginTop: "10px" }}>
              <span
                style={{
                  fontSize: "0.8rem",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  backgroundColor: test.is_published ? "#dcfce7" : "#f3f4f6",
                  color: test.is_published ? "#166534" : "#4b5563",
                  fontWeight: "bold",
                }}
              >
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
                fontWeight: "500",
              }}
            >
              {showAnswers ? "Hide Answers" : "Show Answers"}
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
              {test.is_published ? "Unpublish" : "Publish Now"}
            </button>
          </div>
        </div>
      </div>

      {/* --- STATS & SUBMISSIONS DASHBOARD --- */}
      <div style={{ marginBottom: "40px" }}>
        <div
          style={{
            display: "flex",
            gap: "30px",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              padding: "20px",
              backgroundColor: colors.card,
              border: `1px solid ${colors.border}`,
              borderRadius: "8px",
              flex: 1,
            }}
          >
            <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#2563eb" }}>
              {submissionsList.length}
            </div>
            <div style={{ fontSize: "0.85rem", color: colors.textSec, textTransform: "uppercase" }}>
              Total Students
            </div>
          </div>
          <div
            style={{
              padding: "20px",
              backgroundColor: colors.card,
              border: `1px solid ${colors.border}`,
              borderRadius: "8px",
              flex: 1,
            }}
          >
            <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#16a34a" }}>
              {averageGrade}
            </div>
            <div style={{ fontSize: "0.85rem", color: colors.textSec, textTransform: "uppercase" }}>
              Avg Score
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: colors.card,
            borderRadius: "12px",
            border: `1px solid ${colors.border}`,
            overflow: "hidden",
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ backgroundColor: "#f8fafc", borderBottom: `2px solid ${colors.border}` }}>
                  <th style={{ padding: "16px", color: "#475569" }}>Student ID</th>
                  <th style={{ padding: "16px", color: "#475569" }}>Status</th>
                  <th style={{ padding: "16px", color: "#475569" }}>Started At</th>
                  <th style={{ padding: "16px", color: "#475569" }}>Time Taken</th>
                  <th style={{ padding: "16px", color: "#475569" }}>Grade</th>
                  <th style={{ padding: "16px", color: "#475569", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {submissionsList.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: "40px", textAlign: "center", color: colors.textSec }}>
                      No submissions yet.
                    </td>
                  </tr>
                ) : (
                  submissionsList.map((sub) => {
                    let timeTaken = "-";
                    if (sub.started_at && sub.submitted_at) {
                      const diffMs =
                        new Date(sub.submitted_at).getTime() - new Date(sub.started_at).getTime();
                      const diffMins = Math.round(diffMs / 60000);
                      timeTaken = `${diffMins} mins`;
                    }

                    const isDone = ["completed", "submitted", "graded"].includes(sub.status.toLowerCase());
                    const isStarted = sub.status === "started";

                    const isClickable = isDone || isStarted;

                    return (
                      <tr key={sub.submission_id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                        <td style={{ padding: "16px", fontWeight: "bold", color: colors.text }}>
                          User #{sub.student_id}
                        </td>
                        <td style={{ padding: "16px" }}>
                          <span
                            style={{
                              backgroundColor: isDone ? "#dcfce7" : "#fef3c7",
                              color: isDone ? "#166534" : "#92400e",
                              padding: "4px 8px",
                              borderRadius: "4px",
                              fontSize: "0.75rem",
                              fontWeight: "bold",
                              textTransform: "uppercase",
                            }}
                          >
                            {sub.status}
                          </span>
                        </td>
                        <td style={{ padding: "16px", color: colors.textSec }}>
                          {new Date(sub.started_at).toLocaleString([], {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </td>
                        <td style={{ padding: "16px", color: colors.textSec }}>{timeTaken}</td>
                        <td
                          style={{
                            padding: "16px",
                            fontWeight: "bold",
                            color: isDone ? "#2563eb" : colors.textSec,
                          }}
                        >
                          {sub.total_grade !== null ? `${sub.total_grade}` : "-"}
                        </td>
                        <td style={{ padding: "16px", textAlign: "right" }}>
                          <button
                            onClick={() => navigate(`/results/${sub.submission_id}`)}
                            disabled={!isClickable}
                            style={{
                              padding: "8px 16px",
                              backgroundColor: isClickable ? "transparent" : "#f1f5f9",
                              color: isClickable ? "#2563eb" : "#94a3b8",
                              border: isClickable ? `1px solid #2563eb` : "none",
                              borderRadius: "6px",
                              cursor: isClickable ? "pointer" : "not-allowed",
                              fontWeight: "bold",
                            }}
                          >
                            View Report
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* --- QUESTIONS LIST --- */}
      <h2 style={{ color: colors.text, marginBottom: "20px" }}>Test Questions</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {questionsList.map((q, index) => (
          <div
            key={q.question_id || index}
            style={{
              backgroundColor: colors.card,
              border: `1px solid ${colors.border}`,
              borderRadius: "8px",
              padding: "20px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "10px",
              }}
            >
              <span
                style={{
                  fontWeight: "bold",
                  color: "#64748b",
                  textTransform: "uppercase",
                  fontSize: "0.85rem",
                }}
              >
                Q{index + 1} &mdash; {q.question_type.replace("_", " ")}
              </span>
              <span
                style={{
                  fontSize: "0.9rem",
                  color: colors.textSec,
                  backgroundColor: colors.bg,
                  padding: "2px 8px",
                  borderRadius: "4px",
                }}
              >
                {q.points} Points
              </span>
            </div>

            <div
              style={{
                fontSize: "1.05rem",
                marginBottom: "15px",
                color: colors.text,
                whiteSpace: "pre-wrap",
              }}
            >
              {q.text}
            </div>

            {/* ANSWER KEY SECTION */}
            {showAnswers && (
              <div
                style={{
                  marginTop: "15px",
                  padding: "15px",
                  backgroundColor: "#f0fdf4",
                  borderLeft: "4px solid #22c55e",
                  borderRadius: "4px",
                  fontSize: "0.95rem",
                }}
              >
                <strong
                  style={{
                    color: "#15803d",
                    display: "block",
                    marginBottom: "5px",
                  }}
                >
                  Correct Answer:
                </strong>

                <div style={{ color: "#166534" }}>
                  {q.question_type === "true_false" && (
                    <span>{String(q.correct_answer).toUpperCase()}</span>
                  )}

                  {q.question_type === "mcq" && q.options && (
                    <ul style={{ margin: "5px 0 0 20px", padding: 0 }}>
                      {q.options.map((opt, i) => (
                        <li
                          key={`mcq-opt-${i}`}
                          style={{
                            fontWeight: opt.is_correct ? "bold" : "normal",
                            color: opt.is_correct ? "#15803d" : "#166534",
                          }}
                        >
                          {opt.text} {opt.is_correct && "(Correct)"}
                        </li>
                      ))}
                    </ul>
                  )}

                  {q.question_type === "programming" && (
                    <div>
                      <p style={{ margin: "0 0 5px 0", fontSize: "0.9rem" }}>
                        Test Cases:
                      </p>
                      <pre
                        style={{
                          backgroundColor: "rgba(255,255,255,0.7)",
                          padding: "10px",
                          borderRadius: "4px",
                          overflowX: "auto",
                          border: "1px solid #bbf7d0",
                          margin: 0,
                        }}
                      >
                        {JSON.stringify(q.test_cases, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {questionsList.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "40px",
              color: colors.textSec,
            }}
          >
            No questions found in this test.
          </div>
        )}
      </div>
    </div>
  );
}
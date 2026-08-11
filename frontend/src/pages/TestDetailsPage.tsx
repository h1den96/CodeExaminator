// src/pages/TestDetailsPage.tsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import BackgroundAccents from "../components/BackgroundAccents";
import api from "../api/axios";

interface Submission {
  submission_id: number;
  student_id: string;
  status: string;
  started_at: string;
  submitted_at: string | null;
  total_grade: string | null;
}

interface Question {
  question_id: number;
  question_type: "mcq" | "true_false" | "programming";
  text: string;
  points: number;
  correct_answer?: string | boolean;
  options?: { text: string; is_correct: boolean }[];
  test_cases?: any[];
  // Present only when is_pool_preview is true: groups candidate questions
  // by the slot they could be drawn for.
  slot_id?: number;
  slot_order?: number;
  difficulty?: string;
  topic_name?: string;
}

interface SlotGroup {
  slotId: number | string;
  slotOrder: number;
  difficulty?: string;
  topicName?: string;
  questionType?: string;
  questions: Question[];
}

interface TestDetail {
  test_id: number;
  title: string;
  description: string;
  is_published: boolean;
  questions?: Question[];
  slots?: Question[];
  submissions?: Submission[];
  // True when this test uses random slot-based question selection, meaning
  // `questions` is the full eligible pool per slot rather than a fixed set.
  is_pool_preview?: boolean;
}

export default function TestDetailsPage() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const { colors, fontMono, richBackground } = useTheme();

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
      <div style={{ position: "relative", minHeight: "100vh", color: colors.text, ...richBackground }}>
        <BackgroundAccents />
        <div style={{ position: "relative", zIndex: 1, padding: "40px" }}>
          Loading test details...
        </div>
      </div>
    );
  if (!test)
    return (
      <div style={{ position: "relative", minHeight: "100vh", color: colors.text, ...richBackground }}>
        <BackgroundAccents />
        <div style={{ position: "relative", zIndex: 1, padding: "40px" }}>
          Test not found.
        </div>
      </div>
    );

  const questionsList = test.questions || test.slots || [];
  const submissionsList = test.submissions || [];
  const isPoolPreview = !!test.is_pool_preview;

  // In pool-preview mode, multiple questions can share the same slot_id
  // (they're all candidates for that slot, not a fixed set). Group them so
  // the UI can show "Slot 1 - 4 possible questions" instead of one flat list.
  const slotGroups: SlotGroup[] = [];
  if (isPoolPreview) {
    const groupMap = new Map<number | string, SlotGroup>();
    for (const q of questionsList) {
      const key = q.slot_id ?? "unknown";
      if (!groupMap.has(key)) {
        groupMap.set(key, {
          slotId: key,
          slotOrder: q.slot_order ?? 0,
          difficulty: q.difficulty,
          topicName: q.topic_name,
          questionType: q.question_type,
          questions: [],
        });
      }
      groupMap.get(key)!.questions.push(q);
    }
    slotGroups.push(...Array.from(groupMap.values()).sort((a, b) => a.slotOrder - b.slotOrder));
  }

  const completedSubmissions = submissionsList.filter((s) =>
    ["submitted", "completed", "graded"].includes(s.status.toLowerCase()),
  );
  const averageGrade =
    completedSubmissions.length > 0
      ? (
          completedSubmissions.reduce(
            (acc, curr) => acc + Number(curr.total_grade || 0),
            0,
          ) / completedSubmissions.length
        ).toFixed(2)
      : "N/A";

  const renderQuestionCard = (q: Question, index: number) => (
    <div
      key={q.question_id || index}
      style={{
        backgroundColor: colors.card,
        border: `1px solid ${colors.border}`,
        borderRadius: "10px",
        padding: "20px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "10px",
          flexWrap: "wrap",
          gap: "8px",
        }}
      >
        <span
          style={{
            fontWeight: 700,
            color: colors.textSec,
            textTransform: "uppercase",
            fontSize: "0.8rem",
            letterSpacing: "0.03em",
          }}
        >
          {isPoolPreview ? "Candidate" : `Q${index + 1}`} &mdash; {q.question_type.replace("_", " ")}
        </span>
        <span
          style={{
            fontSize: "0.85rem",
            color: colors.textSec,
            backgroundColor: colors.neutralBg,
            padding: "2px 10px",
            borderRadius: "999px",
          }}
        >
          {q.points} points
        </span>
      </div>

      <div
        style={{
          fontSize: "1rem",
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
            backgroundColor: colors.successBg,
            borderLeft: `4px solid ${colors.successText}`,
            borderRadius: "4px",
            fontSize: "0.9rem",
          }}
        >
          <strong
            style={{
              color: colors.successText,
              display: "block",
              marginBottom: "5px",
            }}
          >
            Correct answer:
          </strong>

          <div style={{ color: colors.successText }}>
            {q.question_type === "true_false" && (
              <span>{String(q.correct_answer).toUpperCase()}</span>
            )}

            {q.question_type === "mcq" && q.options && (
              <ul style={{ margin: "5px 0 0 20px", padding: 0 }}>
                {q.options.map((opt, i) => (
                  <li
                    key={`mcq-opt-${i}`}
                    style={{
                      fontWeight: opt.is_correct ? 700 : 400,
                    }}
                  >
                    {opt.text} {opt.is_correct && "(Correct)"}
                  </li>
                ))}
              </ul>
            )}

            {q.question_type === "programming" && (
              <div>
                <p style={{ margin: "0 0 5px 0", fontSize: "0.85rem" }}>
                  Test cases:
                </p>
                <pre
                  style={{
                    backgroundColor: colors.card,
                    padding: "10px",
                    borderRadius: "6px",
                    overflowX: "auto",
                    border: `1px solid ${colors.successBorder}`,
                    margin: 0,
                    fontFamily: fontMono,
                    color: colors.text,
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
  );

  return (
    <div
      style={{
        position: "relative",
        minHeight: "100vh",
        color: colors.text,
        ...richBackground,
      }}
    >
      <BackgroundAccents />
      <div
        style={{
          position: "relative",
          zIndex: 1,
          padding: "40px 20px",
          maxWidth: "1200px",
          margin: "0 auto",
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
            padding: 0,
          }}
        >
          &larr; Back to dashboard
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
                  fontSize: "0.75rem",
                  padding: "4px 10px",
                  borderRadius: "999px",
                  backgroundColor: test.is_published ? colors.successBg : colors.neutralBg,
                  color: test.is_published ? colors.successText : colors.neutralText,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.03em",
                }}
              >
                Status: {test.is_published ? "Published" : "Draft"}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => setShowAnswers(!showAnswers)}
              style={{
                padding: "10px 16px",
                backgroundColor: showAnswers ? colors.accentSubtle : "transparent",
                color: showAnswers ? colors.accentText : colors.text,
                border: `1px solid ${showAnswers ? colors.accent : colors.border}`,
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              {showAnswers ? "Hide answers" : "Show answers"}
            </button>

            <button
              onClick={handlePublishToggle}
              style={{
                padding: "10px 20px",
                backgroundColor: test.is_published ? colors.successBg : colors.accent,
                color: test.is_published ? colors.successText : "white",
                border: test.is_published ? `1px solid ${colors.successBorder}` : "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              {test.is_published ? "Unpublish" : "Publish now"}
            </button>
          </div>
        </div>
      </div>

      {/* --- STATS & SUBMISSIONS DASHBOARD --- */}
      <div style={{ marginBottom: "40px" }}>
        <div
          style={{
            display: "flex",
            gap: "20px",
            marginBottom: "20px",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              padding: "20px",
              backgroundColor: colors.card,
              border: `1px solid ${colors.border}`,
              borderRadius: "10px",
              flex: 1,
              minWidth: "160px",
            }}
          >
            <div style={{ fontSize: "2rem", fontWeight: 700, color: colors.accent }}>
              {submissionsList.length}
            </div>
            <div style={{ fontSize: "0.8rem", color: colors.textSec, textTransform: "uppercase", letterSpacing: "0.03em" }}>
              Total students
            </div>
          </div>
          <div
            style={{
              padding: "20px",
              backgroundColor: colors.card,
              border: `1px solid ${colors.border}`,
              borderRadius: "10px",
              flex: 1,
              minWidth: "160px",
            }}
          >
            <div style={{ fontSize: "2rem", fontWeight: 700, color: colors.successText }}>
              {averageGrade}
            </div>
            <div style={{ fontSize: "0.8rem", color: colors.textSec, textTransform: "uppercase", letterSpacing: "0.03em" }}>
              Avg score
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
                <tr style={{ backgroundColor: colors.neutralBg, borderBottom: `2px solid ${colors.border}` }}>
                  <th style={{ padding: "16px", color: colors.textSec }}>Student ID</th>
                  <th style={{ padding: "16px", color: colors.textSec }}>Status</th>
                  <th style={{ padding: "16px", color: colors.textSec }}>Started at</th>
                  <th style={{ padding: "16px", color: colors.textSec }}>Time taken</th>
                  <th style={{ padding: "16px", color: colors.textSec }}>Grade</th>
                </tr>
              </thead>
              <tbody>
                {submissionsList.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: "40px", textAlign: "center", color: colors.textSec }}>
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

                    return (
                      <tr key={sub.submission_id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                        <td style={{ padding: "16px", fontWeight: 700, color: colors.text }}>
                          User #{sub.student_id}
                        </td>
                        <td style={{ padding: "16px" }}>
                          <span
                            style={{
                              backgroundColor: isDone ? colors.successBg : colors.warningBg,
                              color: isDone ? colors.successText : colors.warningText,
                              padding: "4px 10px",
                              borderRadius: "999px",
                              fontSize: "0.7rem",
                              fontWeight: 700,
                              textTransform: "uppercase",
                              letterSpacing: "0.03em",
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
                            fontWeight: 700,
                            color: isDone ? colors.accent : colors.textSec,
                          }}
                        >
                          {sub.total_grade !== null ? `${sub.total_grade}` : "-"}
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
      <h2 style={{ color: colors.text, marginBottom: "20px" }}>Test questions</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {questionsList.map((q, index) => (
          <div
            key={q.question_id || index}
            style={{
              backgroundColor: colors.card,
              border: `1px solid ${colors.border}`,
              borderRadius: "10px",
              padding: "20px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "10px",
                flexWrap: "wrap",
                gap: "8px",
              }}
            >
              <span
                style={{
                  fontWeight: 700,
                  color: colors.textSec,
                  textTransform: "uppercase",
                  fontSize: "0.8rem",
                  letterSpacing: "0.03em",
                }}
              >
                Q{index + 1} &mdash; {q.question_type.replace("_", " ")}
              </span>
              <span
                style={{
                  fontSize: "0.85rem",
                  color: colors.textSec,
                  backgroundColor: colors.neutralBg,
                  padding: "2px 10px",
                  borderRadius: "999px",
                }}
              >
                {q.points} points
              </span>
            </div>

            <div
              style={{
                fontSize: "1rem",
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
                  backgroundColor: colors.successBg,
                  borderLeft: `4px solid ${colors.successText}`,
                  borderRadius: "4px",
                  fontSize: "0.9rem",
                }}
              >
                <strong
                  style={{
                    color: colors.successText,
                    display: "block",
                    marginBottom: "5px",
                  }}
                >
                  Correct answer:
                </strong>

                <div style={{ color: colors.successText }}>
                  {q.question_type === "true_false" && (
                    <span>{String(q.correct_answer).toUpperCase()}</span>
                  )}

                  {q.question_type === "mcq" && q.options && (
                    <ul style={{ margin: "5px 0 0 20px", padding: 0 }}>
                      {q.options.map((opt, i) => (
                        <li
                          key={`mcq-opt-${i}`}
                          style={{
                            fontWeight: opt.is_correct ? 700 : 400,
                          }}
                        >
                          {opt.text} {opt.is_correct && "(Correct)"}
                        </li>
                      ))}
                    </ul>
                  )}

                  {q.question_type === "programming" && (
                    <div>
                      <p style={{ margin: "0 0 5px 0", fontSize: "0.85rem" }}>
                        Test cases:
                      </p>
                      <pre
                        style={{
                          backgroundColor: colors.card,
                          padding: "10px",
                          borderRadius: "6px",
                          overflowX: "auto",
                          border: `1px solid ${colors.successBorder}`,
                          margin: 0,
                          fontFamily: fontMono,
                          color: colors.text,
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
    </div>
  );
}
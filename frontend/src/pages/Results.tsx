import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useTheme } from "../context/ThemeContext";
import BackgroundAccents from "../components/BackgroundAccents";

// --- Helper function για Pedagogical Feedback ---
// Maps a judge status to a semantic theme role (warning vs danger) plus the message.
const getStatusFeedback = (status: string) => {
  const feedbackMap: Record<string, { msg: string; role: "warning" | "danger" }> = {
    "Time Limit Exceeded": {
      msg: "Your code exceeded the execution time limit. Check for infinite loops or inefficient algorithms.",
      role: "warning",
    },
    "Memory Limit Exceeded": {
      msg: "Memory limit exhausted. Avoid creating excessively large data structures or deep recursion.",
      role: "danger",
    },
    SECURITY_ERROR: {
      msg: "Submission rejected by the security system due to restricted system calls.",
      role: "danger",
    },
    "Runtime Error": {
      msg: "The program terminated abruptly (crash). Check for memory management errors or division by zero.",
      role: "danger",
    },
    "Wrong Answer": {
      msg: "The code executed, but the result is not as expected. Double-check the problem statement details.",
      role: "warning",
    },
  };
  return feedbackMap[status] || null;
};

export default function Results() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { colors, fontMono, richBackground } = useTheme();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [manualGrades, setManualGrades] = useState<Record<number, { grade: string; comments: string }>>({});
  const [isUpdating, setIsUpdating] = useState(false);

  const checkIsTeacher = () => {
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const userObj = JSON.parse(userStr);
        return userObj.role === "teacher";
      }
    } catch (e) {
      console.error("Failed to parse user role", e);
    }
    return false;
  };

  const isTeacher = checkIsTeacher();

  useEffect(() => {
    if (!id || id === "undefined") {
      console.error("ID IS MISSING!");
      return;
    }

    api
      .get(`/submissions/${id}/result`)
      .then((res) => {
        setData(res.data);

        const initialManual: any = {};
        res.data.questions.forEach((q: any) => {
          initialManual[q.submission_question_id] = {
            grade: String(q.points_earned || "0"),
            comments: q.teacher_comments || "",
          };
        });
        setManualGrades(initialManual);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Result fetch error:", err);
        setLoading(false);
        if (err.response?.status === 403) {
          setErrorMsg("Access Denied: You do not have permission to view this report.");
        } else if (err.response?.status === 404) {
          setErrorMsg("Report not found.");
        } else {
          setErrorMsg("Server error while fetching the report.");
        }
      });
  }, [id]);

  const handleManualGradeChange = (sqId: number, field: "grade" | "comments", value: string) => {
    setManualGrades((prev) => ({
      ...prev,
      [sqId]: { ...prev[sqId], [field]: value },
    }));
  };

  const handleBulkOverride = async () => {
    if (!window.confirm("Save manual grades?")) return;
    setIsUpdating(true);

    try {
      const payload = Object.entries(manualGrades)
        .map(([sqId, val]) => ({
          submissionQuestionId: parseInt(sqId),
          grade: parseFloat(String(val?.grade || "0").replace(",", ".")),
          comments: val?.comments || "",
        }))
        .filter((item) => !isNaN(item.submissionQuestionId));

      const res = await api.post(`/submissions/${id}/bulk-manual-grade`, { grades: payload });

      const updatedQuestions = data.questions.map((q: any) => {
        const match = payload.find((p) => p.submissionQuestionId === q.submission_question_id);
        return match ? { ...q, points_earned: Number(match.grade).toFixed(2), teacher_comments: match.comments } : q;
      });

      setData({
        ...data,
        total_grade: Number(res.data.newTotal).toFixed(2),
        status: "graded",
        questions: updatedQuestions,
      });

      alert("Updated successfully!");
    } catch (err) {
      alert("Failed to update.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBack = () => {
    navigate(isTeacher ? "/teacher/dashboard" : "/tests");
  };

  if (loading) {
    return (
      <div style={{ position: "relative", minHeight: "100vh", color: colors.textSec, ...richBackground }}>
        <BackgroundAccents />
        <div style={{ position: "relative", zIndex: 1, padding: "100px", textAlign: "center" }}>
          <p style={{ fontSize: "1.2rem", fontWeight: 600 }}>Analyzing the results...</p>
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div style={{ position: "relative", minHeight: "100vh", color: colors.dangerText, ...richBackground }}>
        <BackgroundAccents />
        <div style={{ position: "relative", zIndex: 1, padding: "100px", textAlign: "center" }}>
          <h2 style={{ marginBottom: "15px" }}>Error</h2>
          <p>{errorMsg}</p>
          <button
            onClick={handleBack}
            style={{
              marginTop: "20px",
              padding: "10px 20px",
              cursor: "pointer",
              borderRadius: 8,
              border: `1px solid ${colors.border}`,
              background: colors.card,
              color: colors.text,
            }}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const totalPossible = (data.questions ?? []).reduce(
    (acc: number, q: any) => acc + (Number(q.points_possible) || 0),
    0,
  );

  const isSubmittedLike = ["graded", "submitted", "completed"].includes(data.status);

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
          maxWidth: "950px",
          margin: "0 auto",
          padding: "40px 20px",
        }}
      >
      {/* --- HEADER: TOTAL SCORE --- */}
      <div
        style={{
          textAlign: "center",
          marginBottom: "40px",
          padding: "40px",
          background: colors.card,
          borderRadius: "16px",
          border: `1px solid ${colors.border}`,
        }}
      >
        <h1 style={{ margin: "0 0 10px 0", color: colors.text }}>
          {data.test_title || "Exam Report"}
        </h1>
        <div style={{ fontSize: "4.5rem", fontWeight: 700, color: colors.accent }}>
          {data.total_grade ?? "0.00"}
          <span style={{ fontSize: "1.5rem", color: colors.textMuted, marginLeft: "10px" }}>
            / {totalPossible}.00
          </span>
        </div>
        <div style={{ marginTop: "10px" }}>
          <span
            style={{
              padding: "6px 16px",
              borderRadius: "999px",
              fontSize: "0.85rem",
              fontWeight: 700,
              background: isSubmittedLike ? colors.successBg : colors.dangerBg,
              color: isSubmittedLike ? colors.successText : colors.dangerText,
            }}
          >
            Status: {data.status?.toUpperCase()}
          </span>
        </div>
        {isTeacher && (
          <p style={{ marginTop: "15px", color: colors.textSec, fontWeight: 600, fontSize: "0.85rem" }}>
            PEDAGOGICAL REVIEW MODE
          </p>
        )}
      </div>

      <h2
        style={{
          marginBottom: "24px",
          borderBottom: `2px solid ${colors.border}`,
          paddingBottom: "12px",
        }}
      >
        Question review
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {(data.questions ?? []).map((q: any, i: number) => {
          const isCorrect = Number(q.points_earned) >= Number(q.points_possible);
          const isPartial = Number(q.points_earned) > 0 && !isCorrect;

          const testResults = q.eval_details?.black_box?.test_results || [];
          const whiteBoxDetails = q.eval_details?.white_box?.details || [];

          const scoreColors = isCorrect
            ? { bg: colors.successBg, text: colors.successText, border: colors.successBorder }
            : isPartial
              ? { bg: colors.warningBg, text: colors.warningText, border: colors.warningBorder }
              : { bg: colors.dangerBg, text: colors.dangerText, border: colors.dangerBorder };

          return (
            <div
              key={i}
              style={{
                padding: "28px",
                borderRadius: "14px",
                border: `1px solid ${colors.border}`,
                background: colors.card,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "20px",
                  gap: "16px",
                  flexWrap: "wrap",
                }}
              >
                <div style={{ flex: 1, minWidth: "200px" }}>
                  <h3 style={{ margin: "0 0 8px 0", color: colors.text }}>
                    {i + 1}. {q.question_text}
                  </h3>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      fontWeight: 700,
                      padding: "8px 16px",
                      borderRadius: "10px",
                      fontSize: "1.1rem",
                      background: scoreColors.bg,
                      color: scoreColors.text,
                      border: `1px solid ${scoreColors.border}`,
                    }}
                  >
                    {q.points_earned ?? 0} / {q.points_possible ?? 0}
                  </div>
                </div>
              </div>

              {/* --- WHITE-BOX SECTION: Complexity & Rules --- */}
              {q.type === "programming" && whiteBoxDetails.length > 0 && (
                <div
                  style={{
                    marginBottom: "20px",
                    padding: "15px",
                    background: colors.accentSubtle,
                    borderRadius: "10px",
                    border: `1px solid ${colors.accent}33`,
                  }}
                >
                  <p style={{ margin: "0 0 10px 0", fontSize: "0.85rem", fontWeight: 700, color: colors.accentText }}>
                    Code quality & structure (white-box):
                  </p>
                  {whiteBoxDetails.map((detail: any, idx: number) => (
                    <div
                      key={idx}
                      style={{
                        fontSize: "0.85rem",
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "4px 0",
                        borderBottom:
                          idx !== whiteBoxDetails.length - 1 ? `1px solid ${colors.accent}22` : "none",
                        color: colors.text,
                      }}
                    >
                      <span>
                        {detail.target === "complexity" ? "Logic complexity" : detail.description}
                      </span>
                      <span
                        style={{
                          fontWeight: 700,
                          color: detail.passed
                            ? colors.successText
                            : detail.target === "complexity"
                              ? colors.accentText
                              : colors.dangerText,
                        }}
                      >
                        {detail.target === "complexity"
                          ? detail.actual_value < 5
                            ? "Simple"
                            : detail.actual_value < 15
                              ? "Moderate"
                              : "High"
                          : detail.passed
                            ? "Compliant"
                            : "Violation"}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* --- MCQ & TRUE/FALSE FEEDBACK --- */}
              {(q.type === "mcq" || q.type === "true_false") && (
                <div
                  style={{
                    marginTop: "10px",
                    padding: "18px",
                    borderRadius: "10px",
                    background: colors.neutralBg,
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  <div style={{ marginBottom: "12px" }}>
                    <span style={{ color: colors.textSec, fontSize: "0.9rem", display: "block", marginBottom: "4px" }}>
                      Student answer:
                    </span>
                    <strong style={{ fontSize: "1rem", color: isCorrect ? colors.successText : colors.dangerText }}>
                      {q.type === "mcq"
                        ? q.student_answer || "No response"
                        : q.tf_student_answer === null
                          ? "No response"
                          : String(q.tf_student_answer)}
                    </strong>
                  </div>

                  {!isCorrect && (
                    <div style={{ paddingTop: "12px", borderTop: `1px solid ${colors.border}` }}>
                      <span style={{ color: colors.textSec, fontSize: "0.9rem", display: "block", marginBottom: "4px" }}>
                        Correct answer:
                      </span>
                      <strong style={{ fontSize: "1rem", color: colors.successText }}>
                        {q.type === "mcq" ? q.correct_answer : String(q.tf_correct_answer)}
                      </strong>
                    </div>
                  )}
                </div>
              )}

              {/* --- PROGRAMMING FEEDBACK & CODE --- */}
              {q.type === "programming" && (
                <>
                  {testResults.length > 0 && testResults.some((t: any) => !t.passed) && (
                    (() => {
                      const errorResult = testResults.find((t: any) => !t.passed);
                      const feedback = getStatusFeedback(errorResult?.status || "Wrong Answer");
                      if (!feedback) return null;
                      const fc = feedback.role === "warning"
                        ? { bg: colors.warningBg, text: colors.warningText, border: colors.warningBorder }
                        : { bg: colors.dangerBg, text: colors.dangerText, border: colors.dangerBorder };
                      return (
                        <div
                          style={{
                            marginTop: "15px",
                            padding: "12px 16px",
                            borderRadius: "8px",
                            border: `1px solid ${fc.border}`,
                            background: fc.bg,
                            color: fc.text,
                            fontSize: "0.9rem",
                          }}
                        >
                          <span>{feedback.msg}</span>
                        </div>
                      );
                    })()
                  )}

                  {q.student_code && (
                    <div style={{ marginTop: "20px" }}>
                      <p style={{ fontSize: "0.85rem", fontWeight: 700, color: colors.textSec, marginBottom: "8px" }}>
                        Submitted code:
                      </p>
                      <pre
                        style={{
                          background: colors.codeBg,
                          color: colors.codeText,
                          padding: "16px",
                          borderRadius: "8px",
                          fontSize: "0.85rem",
                          overflowX: "auto",
                          fontFamily: fontMono,
                          border: `1px solid ${colors.codeBorder}`,
                        }}
                      >
                        {q.student_code}
                      </pre>
                    </div>
                  )}

                  {testResults.length > 0 && (
                    <div style={{ marginTop: "20px" }}>
                      <p style={{ fontWeight: 700, fontSize: "0.9rem", color: colors.textSec, marginBottom: "10px" }}>
                        Functional validation table:
                      </p>
                      <div
                        style={{
                          overflowX: "auto",
                          background: colors.neutralBg,
                          padding: "10px",
                          borderRadius: "8px",
                          border: `1px solid ${colors.border}`,
                        }}
                      >
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                          <thead>
                            <tr style={{ textAlign: "left", color: colors.textMuted, borderBottom: `1px solid ${colors.border}` }}>
                              <th style={{ padding: "10px" }}>Visibility</th>
                              <th style={{ padding: "10px" }}>Input</th>
                              <th style={{ padding: "10px" }}>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {testResults.map((test: any, idx: number) => (
                              <tr key={idx} style={{ borderBottom: `1px solid ${colors.border}` }}>
                                <td style={{ padding: "10px" }}>{test.is_public ? "Public" : "Private"}</td>
                                <td style={{ padding: "10px", fontFamily: fontMono }}>{test.input}</td>
                                <td
                                  style={{
                                    padding: "10px",
                                    fontWeight: 700,
                                    color: test.passed ? colors.successText : colors.dangerText,
                                  }}
                                >
                                  {test.passed ? "Passed" : test.status === "Accepted" ? "Wrong Answer" : test.status}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* --- INSTRUCTOR MANUAL OVERRIDE (Per Question) --- */}
              {isTeacher && (
                <div
                  style={{
                    marginTop: "25px",
                    padding: "20px",
                    background: colors.neutralBg,
                    border: `1px dashed ${colors.border}`,
                    borderRadius: "10px",
                  }}
                >
                  <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
                    <div style={{ width: "150px" }}>
                      <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, color: colors.textSec, marginBottom: "5px" }}>
                        ADJUST GRADE
                      </label>
                      <input
                        type="text"
                        value={manualGrades[q.submission_question_id]?.grade || ""}
                        onChange={(e) => handleManualGradeChange(q.submission_question_id, "grade", e.target.value)}
                        style={{
                          width: "100%",
                          padding: "8px",
                          borderRadius: "6px",
                          border: `1px solid ${colors.border}`,
                          background: colors.inputBg,
                          color: colors.text,
                          boxSizing: "border-box",
                        }}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: "200px" }}>
                      <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, color: colors.textSec, marginBottom: "5px" }}>
                        TEACHER FEEDBACK
                      </label>
                      <input
                        type="text"
                        placeholder="Add a pedagogical comment for this question..."
                        value={manualGrades[q.submission_question_id]?.comments || ""}
                        onChange={(e) => handleManualGradeChange(q.submission_question_id, "comments", e.target.value)}
                        style={{
                          width: "100%",
                          padding: "8px",
                          borderRadius: "6px",
                          border: `1px solid ${colors.border}`,
                          background: colors.inputBg,
                          color: colors.text,
                          boxSizing: "border-box",
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* --- STUDENT VIEW OF COMMENTS --- */}
              {!isTeacher && q.teacher_comments && (
                <div
                  style={{
                    marginTop: "15px",
                    padding: "15px",
                    background: colors.successBg,
                    borderLeft: `4px solid ${colors.successText}`,
                    borderRadius: "4px",
                  }}
                >
                  <p style={{ margin: 0, fontSize: "0.9rem", color: colors.successText }}>
                    <strong>Instructor comments:</strong> {q.teacher_comments}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* --- STICKY TEACHER ACTION BAR --- */}
      {isTeacher && (
        <div
          style={{
            position: "sticky",
            bottom: "25px",
            marginTop: "40px",
            padding: "25px",
            background: colors.codeBg,
            borderRadius: "16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ color: colors.codeText }}>
            <p style={{ margin: 0, fontWeight: 700 }}>Manual overrides pending</p>
            <p style={{ margin: 0, fontSize: "0.8rem", color: colors.textMuted }}>
              Overrides will update the student's total grade automatically.
            </p>
          </div>
          <button
            onClick={handleBulkOverride}
            disabled={isUpdating}
            style={{
              padding: "12px 30px",
              background: colors.accent,
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontWeight: 700,
              cursor: "pointer",
              opacity: isUpdating ? 0.7 : 1,
            }}
          >
            {isUpdating ? "Saving changes..." : "Save all manual grades"}
          </button>
        </div>
      )}

      <button
        onClick={handleBack}
        style={{
          marginTop: "40px",
          padding: "16px",
          width: "100%",
          borderRadius: "12px",
          border: `1px solid ${colors.border}`,
          background: colors.card,
          color: colors.textSec,
          cursor: "pointer",
          fontWeight: 600,
          fontSize: "1rem",
        }}
      >
        ← Go back to dashboard
      </button>
      </div>
    </div>
  );
}
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";

// --- Helper function για Pedagogical Feedback ---
const getStatusFeedback = (status: string) => {
  const feedbackMap: Record<string, { msg: string; color: string; bg: string }> = {
    "Time Limit Exceeded": {
      msg: "Your code exceeded the execution time limit. Check for infinite loops or inefficient algorithms.",
      color: "#9a3412",
      bg: "#fff7ed"
    },
    "Memory Limit Exceeded": {
      msg: "Memory limit exhausted. Avoid creating excessively large data structures or deep recursion.",
      color: "#991b1b",
      bg: "#fef2f2"
    },
    "SECURITY_ERROR": {
      msg: "Submission rejected by the security system due to restricted system calls.",
      color: "#7f1d1d",
      bg: "#fee2e2"
    },
    "Runtime Error": {
      msg: "The program terminated abruptly (crash). Check for memory management errors or division by zero.",
      color: "#991b1b",
      bg: "#fef2f2"
    },
    "Wrong Answer": {
      msg: "The code executed, but the result is not as expected. Double-check the problem statement details.",
      color: "#854d0e",
      bg: "#fefce8"
    }
  };
  return feedbackMap[status] || null;
};

export default function Results() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // States για το Manual Grading ανά ερώτηση (Bulk Override)
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
        
        // Αρχικοποίηση του state για τη χειροκίνητη βαθμολόγηση ανά ερώτηση
        const initialManual: any = {};
        res.data.questions.forEach((q: any) => {
          initialManual[q.submission_question_id] = { // Χρήση sq_id ως κλειδί
            grade: String(q.points_earned || "0"),
            comments: q.teacher_comments || ""
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
  setManualGrades(prev => ({
    ...prev,
    [sqId]: { ...prev[sqId], [field]: value }
  }));
};

  // Logic για το Bulk Manual Override (Συνολική αποθήκευση)
  const handleBulkOverride = async () => {
    if (!window.confirm("Save manual grades?")) return;
    setIsUpdating(true);

    // ΔΙΟΡΘΩΣΗ: Χρήση Object.entries για ασφαλές mapping χωρίς crash
    const payload = Object.entries(manualGrades)
      .map(([sqId, val]) => {
        const parsedId = parseInt(sqId);
        if (isNaN(parsedId)) return null;
        return {
          submissionQuestionId: parsedId, // <--- Στέλνουμε submissionQuestionId
          grade: parseFloat(String(val?.grade || "0").replace(',', '.')),
          comments: val?.comments || ""
        };
      })
      .filter((item): item is any => item !== null);

    try {
      const res = await api.post(`/submissions/${id}/bulk-manual-grade`, { grades: payload });
      
      const updatedQuestions = data.questions.map((q: any) => {
          const match = payload.find((p: any) => p.answerId === q.answer_id);
          return match ? { ...q, points_earned: match.grade, teacher_comments: match.comments } : q;
      });

      setData({ ...data, total_grade: res.data.newTotal, status: 'graded', questions: updatedQuestions });
      alert("Updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to update.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(isTeacher ? "/teacher/dashboard" : "/student/dashboard");
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "100px", textAlign: "center", color: "#64748b" }}>
        <p style={{ fontSize: "1.2rem", fontWeight: "bold" }}>Analyzing the results...</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div style={{ padding: "100px", textAlign: "center", color: "#dc2626" }}>
        <h2 style={{ marginBottom: "15px" }}>Error</h2>
        <p>{errorMsg}</p>
        <button onClick={handleBack} style={{ marginTop: "20px", padding: "10px 20px", cursor: "pointer" }}>
          Go Back
        </button>
      </div>
    );
  }

  if (!data) return null;

  const totalPossible = (data.questions ?? []).reduce(
    (acc: number, q: any) => acc + (Number(q.points_possible) || 0),
    0,
  );

  return (
    <div
      style={{
        maxWidth: "950px",
        margin: "40px auto",
        padding: "20px",
        fontFamily: "sans-serif",
        color: "#1e293b",
      }}
    >
      {/* --- HEADER: TOTAL SCORE --- */}
      <div
        style={{
          textAlign: "center",
          marginBottom: "40px",
          padding: "40px",
          background: "#f8fafc",
          borderRadius: "16px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
        }}
      >
        <h1 style={{ margin: "0 0 10px 0", color: "#1e293b" }}>
          {data.test_title || "Exam Report"}
        </h1>
        <div style={{ fontSize: "4.5rem", fontWeight: "bold", color: "#2563eb" }}>
          {data.total_grade ?? "0.00"}
          <span style={{ fontSize: "1.5rem", color: "#94a3b8", marginLeft: "10px" }}>
            / {totalPossible}.00
          </span>
        </div>
        <div style={{ marginTop: "10px" }}>
          <span
            style={{
              padding: "6px 16px",
              borderRadius: "20px",
              fontSize: "0.9rem",
              fontWeight: "bold",
              background: (data.status === "graded" || data.status === "submitted" || data.status === "completed") ? "#dcfce7" : "#fee2e2",
              color: (data.status === "graded" || data.status === "submitted" || data.status === "completed") ? "#166534" : "#991b1b",
            }}
          >
            Status: {data.status?.toUpperCase()}
          </span>
        </div>
        {isTeacher && (
          <p style={{ marginTop: "15px", color: "#64748b", fontWeight: "bold", fontSize: "0.9rem" }}>
            PEDAGOGICAL REVIEW MODE
          </p>
        )}
      </div>

      <h2
        style={{
          marginBottom: "24px",
          borderBottom: "2px solid #f1f5f9",
          paddingBottom: "12px",
        }}
      >
        Question Review
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
        {(data.questions ?? []).map((q: any, i: number) => {
          const isCorrect = Number(q.points_earned) >= Number(q.points_possible);
          const isPartial = Number(q.points_earned) > 0 && !isCorrect;
          
          const testResults = q.eval_details?.black_box?.test_results || [];
          const whiteBoxDetails = q.eval_details?.white_box?.details || [];
          
          return (
            <div
              key={i}
              style={{
                padding: "28px",
                borderRadius: "14px",
                border: "1px solid #e2e8f0",
                background: "white",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "20px",
                }}
              >
                <div style={{ flex: 1, paddingRight: "20px" }}>
                  <h3 style={{ margin: "0 0 8px 0", color: "#1e293b" }}>
                    {i + 1}. {q.question_text}
                  </h3>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      fontWeight: "bold",
                      padding: "8px 16px",
                      borderRadius: "10px",
                      fontSize: "1.1rem",
                      background: isCorrect ? "#f0fdf4" : isPartial ? "#fff7ed" : "#fef2f2",
                      color: isCorrect ? "#16a34a" : isPartial ? "#ea580c" : "#dc2626",
                      border: `1px solid ${isCorrect ? "#bbf7d0" : isPartial ? "#fdba74" : "#fecaca"}`,
                    }}
                  >
                    {q.points_earned ?? 0} / {q.points_possible ?? 0}
                  </div>
                </div>
              </div>

              {/* --- WHITE-BOX SECTION: Complexity & Rules --- */}
              {q.type === "programming" && whiteBoxDetails.length > 0 && (
                <div style={{ marginBottom: "20px", padding: "15px", background: "#f0f9ff", borderRadius: "10px", border: "1px solid #bae6fd" }}>
                  <p style={{ margin: "0 0 10px 0", fontSize: "0.85rem", fontWeight: "bold", color: "#0369a1" }}>Code Quality & Structure (White-Box):</p>
                  {whiteBoxDetails.map((detail: any, idx: number) => (
                    <div key={idx} style={{ fontSize: "0.85rem", display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: idx !== whiteBoxDetails.length - 1 ? "1px solid #e0f2fe" : "none" }}>
                      <span>
                        {detail.target === 'complexity' ? "Logic Complexity" : detail.description}
                      </span>
                      <span style={{ fontWeight: "bold", color: detail.passed ? "#16a34a" : (detail.target === 'complexity' ? '#0369a1' : "#dc2626") }}>
                        {detail.target === 'complexity' 
                          ? (detail.actual_value < 5 ? "Simple" : detail.actual_value < 15 ? "Moderate" : "High")
                          : (detail.passed ? "Compliant" : "Violation")}
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
                    background: "#f8fafc",
                    border: "1px solid #f1f5f9",
                  }}
                >
                  <div style={{ marginBottom: "12px" }}>
                    <span style={{ color: "#64748b", fontSize: "0.9rem", display: "block", marginBottom: "4px" }}>
                      Student Answer:
                    </span>
                    <strong style={{ fontSize: "1rem", color: isCorrect ? "#16a34a" : "#dc2626" }}>
                      {q.type === "mcq"
                        ? q.student_answer || "No response"
                        : q.tf_student_answer === null
                          ? "No response"
                          : String(q.tf_student_answer)}
                    </strong>
                  </div>

                  {!isCorrect && (
                    <div style={{ paddingTop: "12px", borderTop: "1px solid #e2e8f0" }}>
                      <span style={{ color: "#64748b", fontSize: "0.9rem", display: "block", marginBottom: "4px" }}>
                        Correct Answer:
                      </span>
                      <strong style={{ fontSize: "1rem", color: "#16a34a" }}>
                        {q.type === "mcq"
                          ? q.correct_answer
                          : String(q.tf_correct_answer)}
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
                        
                        return feedback ? (
                            <div style={{ marginTop: "15px", padding: "12px 16px", borderRadius: "8px", border: `1px solid ${feedback.color}44`, background: feedback.bg, color: feedback.color, fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "12px" }}>
                                <span>{feedback.msg}</span>
                            </div>
                        ) : null;
                    })()
                  )}

                  {q.student_code && (
                    <div style={{ marginTop: "20px" }}>
                      <p style={{ fontSize: "0.85rem", fontWeight: "bold", color: "#64748b", marginBottom: "8px" }}>Submitted Code:</p>
                      <pre style={{ background: "#1e293b", color: "#f8fafc", padding: "16px", borderRadius: "8px", fontSize: "0.85rem", overflowX: "auto", fontFamily: "monospace", border: "1px solid #334155" }}>
                        {q.student_code}
                      </pre>
                    </div>
                  )}

                  {testResults.length > 0 && (
                    <div style={{ marginTop: "20px" }}>
                      <p style={{ fontWeight: "bold", fontSize: "0.9rem", color: "#475569", marginBottom: "10px" }}>Functional Validation Table:</p>
                      <div style={{ overflowX: "auto", background: "#f8fafc", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                          <thead>
                            <tr style={{ textAlign: "left", color: "#94a3b8", borderBottom: "1px solid #e2e8f0" }}>
                              <th style={{ padding: "10px" }}>Visibility</th>
                              <th style={{ padding: "10px" }}>Input</th>
                              <th style={{ padding: "10px" }}>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {testResults.map((test: any, idx: number) => (
                              <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                <td style={{ padding: "10px" }}>{test.is_public ? "Public" : "Private"}</td>
                                <td style={{ padding: "10px", fontFamily: "monospace" }}>{test.input}</td>
                                <td style={{ padding: "10px", fontWeight: "bold", color: test.passed ? "#16a34a" : "#dc2626" }}>
                                  {test.passed ? "Passed" : (test.status === "Accepted" ? "Wrong Answer" : test.status)}
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
                <div style={{ marginTop: "25px", padding: "20px", background: "#fdfbff", border: "1px dashed #d1d5db", borderRadius: "10px" }}>
                  <div style={{ display: "flex", gap: "20px" }}>
                    <div style={{ width: "150px" }}>
                      <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "bold", color: "#6b7280", marginBottom: "5px" }}>ADJUST GRADE</label>
                      <input 
                        type="text"
                        step="0.1"
                        max={q.points_possible}
                        value={manualGrades[q.submission_question_id]?.grade || ""}
                        onChange={(e) => handleManualGradeChange(q.submission_question_id, "grade", e.target.value)}
                        style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #d1d5db" }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "bold", color: "#6b7280", marginBottom: "5px" }}>TEACHER FEEDBACK</label>
                      <input 
                        type="text"
                        placeholder="Add a pedagogical comment for this question..."
                        value={manualGrades[q.submission_question_id]?.comments || ""}
                        onChange={(e) => handleManualGradeChange(q.submission_question_id, "comments", e.target.value)}
                        style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #d1d5db" }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* --- STUDENT VIEW OF COMMENTS --- */}
              {!isTeacher && q.teacher_comments && (
                <div style={{ marginTop: "15px", padding: "15px", background: "#f0fdf4", borderLeft: "4px solid #22c55e", borderRadius: "4px" }}>
                  <p style={{ margin: 0, fontSize: "0.9rem", color: "#166534" }}>
                    <strong>Instructor Comments:</strong> {q.teacher_comments}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* --- STICKY TEACHER ACTION BAR --- */}
      {isTeacher && (
        <div style={{ position: "sticky", bottom: "25px", marginTop: "40px", padding: "25px", background: "#1e293b", borderRadius: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.4)" }}>
          <div style={{ color: "white" }}>
            <p style={{ margin: 0, fontWeight: "bold" }}>Manual Overrides Pending</p>
            <p style={{ margin: 0, fontSize: "0.8rem", color: "#94a3b8" }}>Overrides will update the student's total grade automatically.</p>
          </div>
          <button 
            onClick={handleBulkOverride}
            disabled={isUpdating}
            style={{ padding: "12px 30px", background: "#22c55e", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}
          >
            {isUpdating ? "Saving Changes..." : "Save All Manual Grades"}
          </button>
        </div>
      )}

      <button
        onClick={handleBack}
        style={{
          marginTop: "40px",
          padding: "18px",
          width: "100%",
          borderRadius: "14px",
          border: "none",
          background: "#f1f5f9",
          color: "#475569",
          cursor: "pointer",
          fontWeight: "bold",
          fontSize: "1.1rem",
        }}
      >
        &larr; Go Back to Dashboard
      </button>
    </div>
  );
}
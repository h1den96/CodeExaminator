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

  // States για το Manual Override
  const [overrideGrade, setOverrideGrade] = useState("");
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
    console.log("FETCHING RESULT FOR ID:", id);
    if (!id || id === "undefined"){
      console.error("ID IS MISSING OR UNDEFINED!");
      return;
    }

    api
      .get(`/submissions/${id}/result`)
      .then((res) => {
        setData(res.data);
        setOverrideGrade(res.data.total_grade || "0");
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
  }, [id, navigate]);

  // Logic για το Manual Override
  const handleManualOverride = async () => {
    if (!window.confirm("Are you sure you want to modify the grade manually?")) return;
    
    setIsUpdating(true);
    try {
      await api.patch(`/submissions/${id}/override`, { 
        newGrade: parseFloat(overrideGrade) 
      });
      setData({ ...data, total_grade: overrideGrade, status: 'completed' });
      alert("Grade modified successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to modify grade");
    } finally {
      setIsUpdating(false);
    }
  };

  // Διορθωση για το Go Back button
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
        <p style={{ fontSize: "1.2rem", fontWeight: "bold" }}>Analyzing the answers...</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div style={{ padding: "100px", textAlign: "center", color: "#dc2626" }}>
        <h2 style={{ marginBottom: "15px" }}>⚠️ Error</h2>
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
        maxWidth: "900px",
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
              background: data.status === "completed" || data.status === "submitted" ? "#dcfce7" : "#fee2e2",
              color: data.status === "completed" || data.status === "submitted" ? "#166534" : "#991b1b",
            }}
          >
            Status: {data.status?.toUpperCase()}
          </span>
        </div>
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
                    {i + 1}. {q.title || `Question ${i + 1}`}
                  </h3>
                  <div
                    style={{
                      fontSize: "0.95rem",
                      color: "#475569",
                      lineHeight: "1.5",
                    }}
                  >
                    {q.question_text}
                  </div>
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
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "#94a3b8",
                      marginTop: "5px",
                      textTransform: "uppercase",
                    }}
                  >
                    Points
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
                          : (detail.passed ? (detail.type === "FORBID" ? "Compliant" : "Passed") : "Violation")}
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
                    <span
                      style={{
                        color: "#64748b",
                        fontSize: "0.9rem",
                        display: "block",
                        marginBottom: "4px",
                      }}
                    >
                      Student Answer:
                    </span>
                    <strong
                      style={{
                        fontSize: "1rem",
                        color: isCorrect ? "#16a34a" : "#dc2626",
                      }}
                    >
                      {q.type === "mcq"
                        ? q.student_answer || "No response"
                        : q.tf_student_answer === null
                          ? "No response"
                          : String(q.tf_student_answer)}
                    </strong>
                  </div>

                  {!isCorrect && (
                    <div
                      style={{
                        paddingTop: "12px",
                        borderTop: "1px solid #e2e8f0",
                      }}
                    >
                      <span
                        style={{
                          color: "#64748b",
                          fontSize: "0.9rem",
                          display: "block",
                          marginBottom: "4px",
                        }}
                      >
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
                      <pre style={{ background: "#1e293b", color: "#f8fafc", padding: "16px", borderRadius: "8px", fontSize: "0.85rem", overflowX: "auto", fontFamily: "'Fira Code', monospace", border: "1px solid #334155" }}>
                        {q.student_code}
                      </pre>
                    </div>
                  )}

                  {testResults.length > 0 && (
                    <div style={{ marginTop: "20px" }}>
                      <p style={{ fontWeight: "bold", fontSize: "0.9rem", color: "#475569", marginBottom: "10px" }}>💻 Test Case Breakdown:</p>
                      <div style={{ overflowX: "auto", background: "#f8fafc", padding: "10px", borderRadius: "8px" }}>
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
                                <td style={{ padding: "10px", color: "#64748b" }}>
                                  {test.is_public ? "🌍 Public" : "🔒 Private"}
                                </td>
                                <td style={{ padding: "10px", fontFamily: "monospace", color: "#1e293b" }}>
                                  {test.input}
                                </td>
                                <td style={{ padding: "10px", fontWeight: "bold", color: test.passed ? "#16a34a" : "#dc2626" }}>
                                  {test.passed 
                                    ? "✓ Passed" 
                                    : (test.status === "Accepted" ? "✗ Wrong Answer" : `✗ ${test.status}`)
                                  }
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
            </div>
          );
        })}
      </div>

      {/* --- INSTRUCTOR PANEL: MANUAL OVERRIDE (Μόνο για Καθηγητές) --- */}
      {isTeacher && (
        <div style={{ marginTop: "40px", padding: "30px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "16px" }}>
          <h3 style={{ margin: "0 0 10px 0", color: "#92400e" }}>🛠️ Instructor Control Panel</h3>
          <p style={{ fontSize: "0.9rem", color: "#b45309", marginBottom: "20px" }}>
            Εαν ο αυτοματος ελεγχος απετυχε να αναγνωρισει τη σωστη προσεγγιση, μπορειτε να αλλαξετε τον τελικο βαθμο χειροκινητα.
          </p>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: "0.8rem", marginBottom: "5px", fontWeight: "bold" }}>Final Grade</label>
              <input 
                type="number" 
                value={overrideGrade} 
                onChange={(e) => setOverrideGrade(e.target.value)}
                style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #fbbf24" }}
              />
            </div>
            <button 
              onClick={handleManualOverride}
              disabled={isUpdating}
              style={{ marginTop: "22px", padding: "12px 24px", background: "#d97706", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}
            >
              {isUpdating ? "Updating..." : "Override & Finalize"}
            </button>
          </div>
        </div>
      )}

      {/* ΚΟΥΜΠΙ ΕΠΙΣΤΡΟΦΗΣ */}
      <button
        onClick={handleBack}
        style={{
          marginTop: "50px",
          padding: "18px",
          width: "100%",
          borderRadius: "14px",
          border: "none",
          background: "#1e293b",
          color: "white",
          cursor: "pointer",
          fontWeight: "bold",
          fontSize: "1.1rem",
          transition: "all 0.2s",
        }}
        onMouseOver={(e) => (e.currentTarget.style.background = "#0f172a")}
        onMouseOut={(e) => (e.currentTarget.style.background = "#1e293b")}
      >
        &larr; Go Back
      </button>
    </div>
  );
}
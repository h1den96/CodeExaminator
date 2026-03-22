import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function Results() {
  const { submissionId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!submissionId) return;

    // 🚀 Fetching the deep-dive report from the backend
    api.get(`/submissions/${submissionId}/result`)
      .then((res) => {
        setData(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Result fetch error:", err);
        setLoading(false);
        // If the backend fails (500), check your terminal for the column name error
        if (err.response?.status === 404) navigate("/tests");
      });
  }, [submissionId, navigate]);

  if (loading) {
    return (
      <div style={{ padding: "100px", textAlign: "center", color: "#64748b" }}>
        <p style={{ fontSize: "1.2rem", fontWeight: "bold" }}>Analyzing your answers...</p>
      </div>
    );
  }

  if (!data) return null;

  // Calculate the total points possible across all questions
  const totalPossible = (data.questions ?? []).reduce(
    (acc: number, q: any) => acc + (Number(q.max_points) || 0), 0
  );

  return (
    <div style={{ maxWidth: "900px", margin: "40px auto", padding: "20px", fontFamily: "sans-serif", color: "#1e293b" }}>
      
      {/* --- HEADER: TOTAL SCORE --- */}
      <div style={{ 
        textAlign: "center", marginBottom: "40px", padding: "40px", 
        background: "#f8fafc", borderRadius: "16px", border: "1px solid #e2e8f0",
        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
      }}>
        <h1 style={{ margin: "0 0 10px 0", color: "#1e293b" }}>
            {data.test_title || "Exam Report"}
        </h1>
        <div style={{ fontSize: "4.5rem", fontWeight: "bold", color: "#2563eb" }}>
          {data.total_grade ?? "0.00"} 
          <span style={{ fontSize: "1.5rem", color: "#94a3b8", marginLeft: "10px" }}>/ {totalPossible}.00</span>
        </div>
        <div style={{ marginTop: "10px" }}>
            <span style={{ 
                padding: "6px 16px", borderRadius: "20px", fontSize: "0.9rem", fontWeight: "bold",
                background: data.status === 'completed' ? '#dcfce7' : '#fee2e2',
                color: data.status === 'completed' ? '#166534' : '#991b1b'
            }}>
                Status: {data.status?.toUpperCase()}
            </span>
        </div>
      </div>

      <h2 style={{ marginBottom: "24px", borderBottom: "2px solid #f1f5f9", paddingBottom: "12px" }}>
        Question Review
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
        {(data.questions ?? []).map((q: any, i: number) => {
          const isCorrect = Number(q.points) >= Number(q.max_points);
          const isPartial = Number(q.points) > 0 && !isCorrect;

          return (
            <div key={i} style={{ 
              padding: "28px", borderRadius: "14px", border: "1px solid #e2e8f0", 
              background: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" 
            }}>
              
              {/* Question Header & Points */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                <div style={{ flex: 1, paddingRight: "20px" }}>
                  <h3 style={{ margin: "0 0 8px 0", color: "#1e293b" }}>
                    {i + 1}. {q.title}
                  </h3>
                  <div style={{ fontSize: "0.95rem", color: "#475569", lineHeight: "1.5" }}>
                    {q.body}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                    <div style={{ 
                        fontWeight: "bold", padding: "8px 16px", borderRadius: "10px", fontSize: "1.1rem",
                        background: isCorrect ? "#f0fdf4" : isPartial ? "#fff7ed" : "#fef2f2",
                        color: isCorrect ? "#16a34a" : isPartial ? "#ea580c" : "#dc2626",
                        border: `1px solid ${isCorrect ? "#bbf7d0" : isPartial ? "#fdba74" : "#fecaca"}`
                    }}>
                        {q.points ?? 0} / {q.max_points ?? 0}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "5px", textTransform: "uppercase" }}>
                        Points
                    </div>
                </div>
              </div>

              {/* --- MCQ & TRUE/FALSE FEEDBACK --- */}
              {(q.type === 'mcq' || q.type === 'true_false') && (
                <div style={{ marginTop: "10px", padding: "18px", borderRadius: "10px", background: "#f8fafc", border: "1px solid #f1f5f9" }}>
                  <div style={{ marginBottom: "12px" }}>
                    <span style={{ color: "#64748b", fontSize: "0.9rem", display: "block", marginBottom: "4px" }}>Your Answer:</span>
                    <strong style={{ fontSize: "1rem", color: isCorrect ? "#16a34a" : "#dc2626" }}>
                      {q.type === 'mcq' ? (q.student_answer || "No response") : (q.tf_student_answer === null ? "No response" : String(q.tf_student_answer))}
                    </strong>
                  </div>

                  {!isCorrect && (
                    <div style={{ paddingTop: "12px", borderTop: "1px solid #e2e8f0" }}>
                      <span style={{ color: "#64748b", fontSize: "0.9rem", display: "block", marginBottom: "4px" }}>Correct Answer:</span>
                      <strong style={{ fontSize: "1rem", color: "#16a34a" }}>
                        {q.type === 'mcq' ? q.correct_answer : String(q.tf_correct_answer)}
                      </strong>
                    </div>
                  )}
                </div>
              )}

              {/* --- PROGRAMMING TEST CASE GRID --- */}
              {q.type === 'programming' && q.code_results?.details && (
                <div style={{ marginTop: "15px" }}>
                  <p style={{ fontWeight: "bold", fontSize: "0.9rem", color: "#475569", marginBottom: "10px" }}>💻 Test Case Breakdown:</p>
                  <div style={{ overflowX: "auto", background: "#f8fafc", padding: "10px", borderRadius: "8px" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                      <thead>
                        <tr style={{ textAlign: "left", color: "#94a3b8", borderBottom: "1px solid #e2e8f0" }}>
                          <th style={{ padding: "10px" }}>Test Case</th>
                          <th style={{ padding: "10px" }}>Status</th>
                          <th style={{ padding: "10px" }}>Execution</th>
                        </tr>
                      </thead>
                      <tbody>
                        {q.code_results.details.map((test: any, idx: number) => (
                          <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "10px", fontFamily: "monospace", color: "#1e293b" }}>
                                {test.input ? `Input: ${test.input}` : `Base Case #${idx + 1}`}
                            </td>
                            <td style={{ 
                                padding: "10px", fontWeight: "bold", 
                                color: test.status === "Passed" ? "#16a34a" : "#dc2626" 
                            }}>
                              {test.status === "Passed" ? "✓ Passed" : `✗ ${test.status}`}
                            </td>
                            <td style={{ padding: "10px", color: "#94a3b8" }}>
                                {test.time ? `${test.time}s` : "--"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <button 
        onClick={() => navigate("/tests")}
        style={{ 
            marginTop: "50px", padding: "18px", width: "100%", borderRadius: "14px", 
            border: "none", background: "#1e293b", color: "white", cursor: "pointer", 
            fontWeight: "bold", fontSize: "1.1rem", transition: "all 0.2s"
        }}
        onMouseOver={(e) => e.currentTarget.style.background = "#0f172a"}
        onMouseOut={(e) => e.currentTarget.style.background = "#1e293b"}
      >
        Return to Dashboard
      </button>
    </div>
  );
}
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function Results() {
  const { submissionId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api.get(`/submissions/${submissionId}/result`)
      .then(res => setData(res.data))
      .catch(() => navigate("/tests"));
  }, [submissionId]);

  if (!data) return <div style={{ padding: "50px", textAlign: "center" }}>Calculating Grade...</div>;

  return (
    <div style={{ maxWidth: "800px", margin: "40px auto", padding: "20px", fontFamily: "sans-serif" }}>
      <div style={{ textAlign: "center", marginBottom: "40px", padding: "40px", background: "#f8fafc", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
        <h1 style={{ margin: "0 0 10px 0", color: "#1e293b" }}>{data.testTitle}</h1>
        <div style={{ fontSize: "4rem", fontWeight: "bold", color: "#2563eb" }}>
          {data.finalGrade} <span style={{ fontSize: "1.5rem", color: "#64748b" }}>/ 10.00</span>
        </div>
        <p style={{ color: "#64748b", margin: "10px 0 0 0" }}>Final Grade</p>
      </div>

      <h2 style={{ marginBottom: "20px" }}>Question Review</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        {data.questions.map((q: any, i: number) => (
          <div key={i} style={{ 
            padding: "20px", borderRadius: "12px", border: "1px solid",
            borderColor: q.isCorrect ? "#bbf7d0" : "#fecaca",
            backgroundColor: q.isCorrect ? "#f0fdf4" : "#fef2f2"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
              <strong style={{ color: "#1e293b" }}>Question {i + 1}: {q.title}</strong>
              <span style={{ fontWeight: "bold", color: q.isCorrect ? "#16a34a" : "#dc2626" }}>
                {q.earned} / {q.max} pts
              </span>
            </div>

            {!q.isCorrect && (
              <div style={{ fontSize: "0.9rem", marginTop: "10px", padding: "10px", background: "rgba(255,255,255,0.5)", borderRadius: "6px" }}>
                <div style={{ color: "#dc2626" }}><strong>Mistake:</strong> Incorrect Answer</div>
                <div style={{ color: "#475569", marginTop: "4px" }}>
                  <strong>Correct Answer:</strong> {Array.isArray(q.correctAnswer) ? q.correctAnswer.join(", ") : String(q.correctAnswer)}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      <button 
        onClick={() => navigate("/tests")}
        style={{ marginTop: "30px", padding: "12px 24px", width: "100%", borderRadius: "8px", border: "none", background: "#1e293b", color: "white", cursor: "pointer", fontWeight: "bold" }}
      >
        Back to Dashboard
      </button>
    </div>
  );
}
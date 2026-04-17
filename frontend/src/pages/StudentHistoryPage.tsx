import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchStudentHistory, type StudentHistoryItem } from "../api/examApi";
import { useTheme } from "../context/ThemeContext";

export default function StudentHistoryPage() {
  const { colors } = useTheme();
  const navigate = useNavigate();
  const [history, setHistory] = useState<StudentHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentHistory()
      .then((data) => setHistory(data))
      .catch((err) => console.error("Failed to load history:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleViewDetails = (submissionId: number) => {
    navigate(`/results/${submissionId}`);
  };

  return (
    <div
      style={{
        padding: "40px 20px",
        maxWidth: "1000px",
        margin: "0 auto",
        minHeight: "100vh",
        background: colors.bg,
        color: colors.text,
        fontFamily: "sans-serif",
      }}
    >
      {/* 🌟 ΝΕΟ: Back Button */}
      <button
        onClick={() => navigate("/tests")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          background: "transparent",
          border: "none",
          color: "#2563eb", // Μπλε χρώμα που ταιριάζει με τα υπόλοιπα links
          fontSize: "1rem",
          fontWeight: "bold",
          cursor: "pointer",
          padding: "0",
          marginBottom: "20px",
          transition: "color 0.2s",
        }}
        onMouseOver={(e) => (e.currentTarget.style.color = "#1d4ed8")}
        onMouseOut={(e) => (e.currentTarget.style.color = "#2563eb")}
      >
        <span>&larr;</span> Back to Exams
      </button>

      {/* Header Section */}
      <div style={{ marginBottom: "40px" }}>
        <h1 style={{ margin: 0, fontSize: "2rem" }}>Exam History</h1>
        <p style={{ color: colors.textSec, marginTop: "10px" }}>
          Review your past performances and detailed reports.
        </p>
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: "50px" }}>
          <p style={{ color: colors.textSec }}>Loading your history...</p>
        </div>
      )}

      {!loading && history.length === 0 && (
        <div
          style={{
            padding: "60px",
            textAlign: "center",
            background: colors.card,
            borderRadius: "16px",
            border: `1px solid ${colors.border}`,
          }}
        >
          <h3 style={{ color: colors.text }}>No history found</h3>
          <p style={{ color: colors.textSec }}>
            You haven't completed any exams yet.
          </p>
          <button
            onClick={() => navigate("/tests")}
            style={{
              marginTop: "20px",
              padding: "10px 20px",
              backgroundColor: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Go to Available Exams
          </button>
        </div>
      )}

      {/* History List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {history.map((item) => (
          <div
            key={item.submission_id}
            style={{
              padding: "20px 25px",
              backgroundColor: colors.card,
              border: `1px solid ${colors.border}`,
              borderRadius: "12px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              boxShadow: "0 2px 4px rgba(0,0,0,0.04)",
              transition: "transform 0.2s",
            }}
          >
            {/* Left Side: Info */}
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: "0 0 8px 0", color: colors.text }}>
                {item.test_title}
              </h3>
              <div
                style={{
                  display: "flex",
                  gap: "15px",
                  fontSize: "0.85rem",
                  color: colors.textSec,
                }}
              >
                <span>
                  📅 {new Date(item.submitted_at).toLocaleDateString()}
                </span>
                <span>
                  🕒 {new Date(item.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span style={{ 
                  color: item.status === "completed" || item.status === "submitted" ? "#16a34a" : "#dc2626",
                  fontWeight: "bold",
                  textTransform: "uppercase"
                }}>
                  {item.status}
                </span>
              </div>
            </div>

            {/* Right Side: Score & Action */}
            <div style={{ display: "flex", alignItems: "center", gap: "30px" }}>
              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    fontSize: "1.4rem",
                    fontWeight: "bold",
                    color: "#2563eb",
                  }}
                >
                  {item.total_grade}
                  <span style={{ fontSize: "0.9rem", color: colors.textSec }}>
                    {" "}/ {item.max_points}.00
                  </span>
                </div>
                <div style={{ fontSize: "0.75rem", color: colors.textSec, textTransform: "uppercase" }}>
                  Final Score
                </div>
              </div>

              <button
                onClick={() => handleViewDetails(item.submission_id)}
                style={{
                  padding: "10px 18px",
                  backgroundColor: "transparent",
                  color: colors.text,
                  border: `1px solid ${colors.border}`,
                  borderRadius: "8px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = colors.border;
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                View Report
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
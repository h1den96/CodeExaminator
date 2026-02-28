import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../auth/AuthContext";
import { fetchAllTests, type TestSummary } from "../api/examApi"; 

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const { colors } = useTheme();
  const { logout } = useAuth();
  
  const [tests, setTests] = useState<TestSummary[]>([]);
  const [loading, setLoading] = useState(true);

  // Load data immediately when dashboard opens
  useEffect(() => {
    fetchAllTests()
      .then((data) => {
         // Sort by newest first
         setTests(data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      })
      .catch((err) => console.error("Failed to load tests", err))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div style={{ padding: "40px 20px", maxWidth: "1200px", margin: "0 auto", backgroundColor: colors.bg, minHeight: "100vh" }}>
      
      {/* 1. HEADER & LOGOUT */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px" }}>
        <div>
            <h1 style={{ color: colors.text, margin: 0 }}>Teacher Dashboard</h1>
            <p style={{ color: colors.textSec, marginTop: "5px" }}>Welcome back, Professor.</p>
        </div>
        <button 
          onClick={handleLogout}
          style={{
            padding: "10px 20px",
            backgroundColor: "#ef4444",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "bold"
          }}
        >
          Log Out
        </button>
      </div>

      {/* 2. ACTION BAR (Quick Actions) */}
      <div style={{ 
          marginBottom: "30px", 
          display: "grid", 
          gridTemplateColumns: "1fr 1fr", 
          gap: "20px" 
      }}>
        
        {/* Button A: Create Exam Blueprint */}
        <button 
            onClick={() => navigate("/teacher/create-test")}
            style={{
                padding: "25px",
                backgroundColor: "#eff6ff", 
                border: "2px dashed #3b82f6", 
                borderRadius: "12px",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                transition: "background-color 0.2s"
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#dbeafe"}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#eff6ff"}
        >
            <span style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#1d4ed8" }}>📝 Create Exam</span>
            <span style={{ color: "#1e40af", fontSize: "0.9rem" }}>Define topics & generate a test</span>
        </button>

        {/* Button B: Add Question (Links to Hub) */}
        <button 
            onClick={() => navigate("/teacher/create-question-hub")}
            style={{
                padding: "25px",
                backgroundColor: "#f0fdf4", // Light Green bg
                border: "2px dashed #22c55e", // Green dashed border
                borderRadius: "12px",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                transition: "background-color 0.2s"
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#dcfce7"}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#f0fdf4"}
        >
            <span style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#15803d" }}>➕ Add Question</span>
            <span style={{ color: "#166534", fontSize: "0.9rem" }}>Choose: MCQ, True/False, or Code</span>
        </button>
      </div>
      
      {/* 3. RECENT TESTS LIST */}
      <div>
        <h2 style={{ color: colors.text, borderBottom: `1px solid ${colors.border}`, paddingBottom: "10px", marginBottom: "20px" }}>
            Recent Exams
        </h2>

        {loading && <p style={{ color: colors.textSec }}>Loading your exams...</p>}
        
        {!loading && tests.length === 0 && (
            <p style={{ color: colors.textSec }}>No exams found. Create one above!</p>
        )}

        {/* Grid View of Tests */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
            {tests.map((test) => (
                <div 
                    key={test.test_id}
                    onClick={() => navigate(`/teacher/test/${test.test_id}`)} 
                    style={{
                        backgroundColor: colors.card,
                        border: `1px solid ${colors.border}`,
                        borderRadius: "10px",
                        padding: "20px",
                        cursor: "pointer",
                        transition: "transform 0.2s, box-shadow 0.2s",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-3px)";
                        e.currentTarget.style.boxShadow = "0 8px 12px rgba(0,0,0,0.1)";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.05)";
                    }}
                >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                         <span style={{ fontSize: "0.8rem", color: colors.textSec }}>
                            {new Date(test.created_at).toLocaleDateString()}
                         </span>
                         <span style={{ 
                             fontSize: "0.7rem", fontWeight: "bold", padding: "2px 6px", borderRadius: "4px",
                             backgroundColor: test.is_published ? "#dcfce7" : "#f3f4f6",
                             color: test.is_published ? "#166534" : "#4b5563"
                         }}>
                            {test.is_published ? "PUBLISHED" : "DRAFT"}
                         </span>
                    </div>
                    <h3 style={{ margin: "0 0 5px 0", color: colors.text }}>{test.title}</h3>
                    <p style={{ margin: 0, fontSize: "0.9rem", color: colors.textSec }}>
                        {test.question_count} Questions &bull; {test.total_points} Points
                    </p>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}
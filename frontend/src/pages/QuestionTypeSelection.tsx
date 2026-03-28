// src/pages/teacher/QuestionTypeSelection.tsx
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

export default function QuestionTypeSelection() {
  const { colors, theme } = useTheme();
  const navigate = useNavigate();

  const options = [
    {
      title: "💻 Programming Challenge",
      desc: "Create a coding problem with automated Unit Tests (Input/Output).",
      path: "/teacher/create-programming",
      color: "#2563eb", // Blue
      bg: theme === "dark" ? "rgba(37, 99, 235, 0.1)" : "#eff6ff",
    },
    {
      title: "☑️ Multiple Choice",
      desc: "Standard question with one correct answer out of 4 options.",
      path: "/teacher/create-mcq", // Placeholder for now
      color: "#16a34a", // Green
      bg: theme === "dark" ? "rgba(22, 163, 74, 0.1)" : "#f0fdf4",
    },
    {
      title: "❓ True / False",
      desc: "Simple binary choice question.",
      path: "/teacher/create-tf", // Placeholder for now
      color: "#d97706", // Amber
      bg: theme === "dark" ? "rgba(217, 119, 6, 0.1)" : "#fffbeb",
    },
  ];

  return (
    <div
      style={{
        padding: "40px 20px",
        backgroundColor: colors.bg,
        minHeight: "100vh",
        color: colors.text,
      }}
    >
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        {/* Back Button */}
        <button
          onClick={() => navigate("/teacher/dashboard")}
          style={{
            marginBottom: "30px",
            background: "none",
            border: "none",
            color: colors.textSec,
            cursor: "pointer",
            fontSize: "0.9rem",
            display: "flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          ← Back to Dashboard
        </button>

        <h1
          style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "10px" }}
        >
          Select Question Type
        </h1>
        <p
          style={{
            color: colors.textSec,
            marginBottom: "40px",
            fontSize: "1.1rem",
          }}
        >
          What kind of question would you like to add to the question bank?
        </p>

        {/* Grid of Options */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "25px",
          }}
        >
          {options.map((opt) => (
            <div
              key={opt.title}
              onClick={() => navigate(opt.path)}
              style={{
                backgroundColor: colors.card,
                border: `2px solid ${colors.border}`,
                borderRadius: "16px",
                padding: "30px",
                cursor: "pointer",
                transition:
                  "transform 0.2s, border-color 0.2s, box-shadow 0.2s",
                boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-5px)";
                e.currentTarget.style.borderColor = opt.color;
                e.currentTarget.style.boxShadow = `0 10px 15px -3px ${opt.bg}`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.borderColor = colors.border;
                e.currentTarget.style.boxShadow = "0 4px 6px rgba(0,0,0,0.05)";
              }}
            >
              {/* Icon Box */}
              <div
                style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "12px",
                  backgroundColor: opt.bg,
                  color: opt.color,
                  fontSize: "1.8rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "20px",
                }}
              >
                {opt.title.split(" ")[0]}
              </div>

              <h3
                style={{
                  fontSize: "1.25rem",
                  fontWeight: "bold",
                  marginBottom: "10px",
                  color: colors.text,
                }}
              >
                {opt.title.substring(2)}
              </h3>

              <p
                style={{
                  color: colors.textSec,
                  fontSize: "0.95rem",
                  lineHeight: "1.6",
                }}
              >
                {opt.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

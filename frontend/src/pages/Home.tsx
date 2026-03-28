// src/pages/Home.tsx
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function Home() {
  const nav = useNavigate();
  const { isAuthenticated, logout } = useAuth();

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1.5rem",
        backgroundColor: "#1a1a1a",
        color: "white",
        textAlign: "center",
      }}
    >
      <h1 style={{ fontSize: "3rem", fontWeight: "bold", margin: 0 }}>
        CodeExaminator
      </h1>
      <p style={{ fontSize: "1.2rem", color: "#aaa", maxWidth: "500px" }}>
        Test your programming skills with our interactive exam platform.
      </p>

      {!isAuthenticated ? (
        <div style={{ display: "flex", gap: "1rem" }}>
          <button
            onClick={() => nav("/login")}
            style={{
              padding: "0.75rem 2rem",
              borderRadius: "4px",
              border: "1px solid #3b82f6",
              backgroundColor: "transparent",
              color: "#3b82f6",
              cursor: "pointer",
              fontSize: "1rem",
            }}
          >
            Log in
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", gap: "1rem" }}>
          <button
            onClick={() => nav("/tests")}
            style={{
              padding: "0.75rem 2rem",
              borderRadius: "4px",
              border: "none",
              backgroundColor: "#3b82f6",
              color: "white",
              cursor: "pointer",
              fontSize: "1rem",
              fontWeight: "bold",
            }}
          >
            View Available Tests
          </button>
          <button
            onClick={logout}
            style={{
              padding: "0.75rem 2rem",
              borderRadius: "4px",
              border: "1px solid #ef4444",
              backgroundColor: "transparent",
              color: "#ef4444",
              cursor: "pointer",
              fontSize: "1rem",
            }}
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}

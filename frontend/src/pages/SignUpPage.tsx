import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import BackgroundAccents from "../components/BackgroundAccents";

const API_BASE = "http://localhost:3000";

export default function SignUpPage() {
  const { colors, theme, fontMono, richBackground } = useTheme();
  const nav = useNavigate();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [semester, setSemester] = useState<number | string>(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          semester: Number(semester),
          email,
          password,
          role: "student",
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "Registration failed");
        setLoading(false);
        return;
      }

      alert("Account created successfully! Please log in.");
      nav("/login");
    } catch (err: any) {
      setError(err.message || "Error connecting to server");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    height: "42px",
    background: colors.inputBg,
    border: `1px solid ${colors.border}`,
    color: colors.text,
    borderRadius: 8,
    fontSize: "0.95rem",
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: colors.text,
        position: "relative",
        ...richBackground,
      }}
    >
      <BackgroundAccents />
      <form
        onSubmit={handleSubmit}
        style={{
          backgroundColor: colors.card,
          padding: "2.25rem 2rem",
          borderRadius: "14px",
          border: `1px solid ${colors.border}`,
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          width: "340px",
          position: "relative",
          zIndex: 1,
          boxShadow:
            theme === "light"
              ? "0 4px 16px rgba(0,0,0,0.08)"
              : "0 4px 16px rgba(0,0,0,0.4)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            marginBottom: "2px",
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: colors.accentSubtle,
              color: colors.accentText,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: fontMono,
              fontWeight: 700,
              fontSize: "1rem",
            }}
          >
            {"</>"}
          </div>
          <span style={{ fontSize: "1.3rem", fontWeight: 700 }}>
            Code Examinator
          </span>
        </div>
        <h1
          style={{
            margin: "0 0 0.5rem 0",
            textAlign: "center",
            fontSize: "1.1rem",
            fontWeight: 600,
            color: colors.textSec,
          }}
        >
          Create your account
        </h1>

        {error && (
          <div
            style={{
              backgroundColor: colors.dangerBg,
              color: colors.dangerText,
              border: `1px solid ${colors.dangerBorder}`,
              padding: "10px 12px",
              borderRadius: "8px",
              textAlign: "center",
              fontSize: "0.85rem",
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: "10px" }}>
          <input
            style={{ ...inputStyle, width: "100%" }}
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="First name"
            required
          />
          <input
            style={{ ...inputStyle, width: "100%" }}
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Last name"
            required
          />
        </div>

        <input
          style={inputStyle}
          type="number"
          min="1"
          max="12"
          value={semester}
          onChange={(e) => setSemester(e.target.value)}
          placeholder="Semester (1-8)"
          required
        />

        <input
          style={inputStyle}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@university.edu"
          required
        />

        <input
          style={inputStyle}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••••••"
          required
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "11px",
            marginTop: "6px",
            background: colors.accent,
            color: "#ffffff",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            opacity: loading ? 0.7 : 1,
            fontWeight: 600,
            fontSize: "0.95rem",
          }}
        >
          {loading ? "Creating account..." : "Sign up"}
        </button>

        <div
          style={{
            textAlign: "center",
            fontSize: "0.85rem",
            marginTop: "4px",
            color: colors.textSec,
          }}
        >
          Already have an account?{" "}
          <span
            onClick={() => nav("/login")}
            style={{
              color: colors.accent,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Log in
          </span>
        </div>
      </form>
    </div>
  );
}
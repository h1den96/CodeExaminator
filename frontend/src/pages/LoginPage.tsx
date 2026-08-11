import { type FormEvent, useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useTheme } from "../context/ThemeContext";
import BackgroundAccents from "../components/BackgroundAccents";

const API_BASE = "http://localhost:3000";

export default function LoginPage() {
  const { login } = useAuth();
  const { colors, theme, toggleTheme, fontMono, richBackground } = useTheme();
  const nav = useNavigate();

  const [searchParams] = useSearchParams();
  const isExpired = searchParams.get("expired") === "true";

  const [email, setEmail] = useState("user123@email.com");
  const [password, setPassword] = useState("Password123!");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isExpired) {
      // Keep the banner visible; no auto-clear.
    }
  }, [isExpired]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }

      const token = data.accessToken || data.access_token || data.token;
      const user = data.user;

      if (!token || !user) {
        throw new Error("Ο διακομιστής δεν επέστρεψε τα απαραίτητα στοιχεία σύνδεσης.");
      }

      login(token, user);

      const userRole = user.role?.toLowerCase();

      if (userRole === "teacher") {
        nav("/teacher/dashboard");
      } else {
        nav("/tests");
      }
    } catch (err: any) {
      console.error("Login Error:", err);
      setError(err.message || "Παρουσιάστηκε σφάλμα κατά τη σύνδεση.");
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
      {/* Theme toggle */}
      <button
        type="button"
        onClick={toggleTheme}
        title="Toggle theme"
        style={{
          position: "absolute",
          top: 20,
          right: 20,
          width: 36,
          height: 36,
          borderRadius: "50%",
          border: `1px solid ${colors.border}`,
          background: colors.card,
          color: colors.textSec,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1rem",
          zIndex: 1,
        }}
      >
        {theme === "dark" ? "☀️" : "🌙"}
      </button>

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
        {/* Brand lockup */}
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
        <p
          style={{
            textAlign: "center",
            margin: "0 0 0.75rem 0",
            fontSize: "0.8rem",
            color: colors.textSec,
            fontFamily: fontMono,
          }}
        >
          {"// prove your code, pass your class"}
        </p>

        {isExpired && !error && (
          <div
            style={{
              backgroundColor: colors.warningBg,
              color: colors.warningText,
              padding: "10px 12px",
              borderRadius: "8px",
              border: `1px solid ${colors.warningBorder}`,
              fontSize: "0.85rem",
              textAlign: "center",
            }}
          >
            ⚠️ <strong>Session expired</strong>
            <br />
            Please log in again to continue.
          </div>
        )}

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

        <div>
          <label
            style={{
              fontSize: "0.8rem",
              color: colors.textSec,
              display: "block",
              marginBottom: "6px",
            }}
          >
            Email
          </label>
          <input
            style={inputStyle}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@university.edu"
            autoComplete="email"
          />
        </div>

        <div>
          <label
            style={{
              fontSize: "0.8rem",
              color: colors.textSec,
              display: "block",
              marginBottom: "6px",
            }}
          >
            Password
          </label>
          <input
            style={inputStyle}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            autoComplete="current-password"
          />
        </div>

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
            transition: "background 0.15s",
          }}
          onMouseOver={(e) => {
            if (!loading) e.currentTarget.style.background = colors.accentHover;
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = colors.accent;
          }}
        >
          {loading ? "Logging in..." : "Log in"}
        </button>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            margin: "6px 0",
          }}
        >
          <div style={{ flex: 1, height: "1px", background: colors.border }} />
          <span style={{ fontSize: "0.75rem", color: colors.textMuted }}>OR</span>
          <div style={{ flex: 1, height: "1px", background: colors.border }} />
        </div>

        <button
          type="button"
          onClick={() => nav("/signup")}
          style={{
            padding: "11px",
            background: "transparent",
            color: colors.text,
            border: `1px solid ${colors.border}`,
            borderRadius: 8,
            cursor: "pointer",
            fontWeight: 600,
            fontSize: "0.95rem",
          }}
        >
          Create an account
        </button>
      </form>
    </div>
  );
}
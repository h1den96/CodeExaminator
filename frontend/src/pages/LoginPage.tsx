// src/pages/LoginPage.tsx
import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useTheme } from "../context/ThemeContext";

const API_BASE = "http://localhost:3000";

export default function LoginPage() {
  const { login } = useAuth();
  const { colors, theme } = useTheme();
  const nav = useNavigate();
  const [email, setEmail] = useState("user123@email.com");
  const [password, setPassword] = useState("Password123!");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
      login(data.accessToken || data.access_token || data.token);
      nav("/tests");
    } catch (err: any) {
      setError(err.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", width: "100vw", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: colors.bg, color: colors.text }}>
      <form onSubmit={handleSubmit} style={{ backgroundColor: colors.card, padding: "2rem", borderRadius: "8px", border: `1px solid ${colors.border}`, display: "flex", flexDirection: "column", gap: "1rem", width: "320px", boxShadow: theme === 'light' ? "0 4px 10px rgba(0,0,0,0.1)" : "none" }}>
        <h1 style={{ margin: "0 0 1rem 0", textAlign: "center" }}>Log in</h1>
        {error && <div style={{ color: "#ef4444", textAlign: "center", fontSize: "0.9rem" }}>{error}</div>}
        <input style={{ padding: "10px", background: colors.inputBg, border: `1px solid ${colors.border}`, color: colors.text, borderRadius: 4 }} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
        <input style={{ padding: "10px", background: colors.inputBg, border: `1px solid ${colors.border}`, color: colors.text, borderRadius: 4 }} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
        <button type="submit" disabled={loading} style={{ padding: "10px", marginTop: "10px", background: "#2563eb", color: "white", border: "none", borderRadius: 4, cursor: "pointer", opacity: loading ? 0.7 : 1 }}>{loading ? "Logging in..." : "Log in"}</button>
      
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
            <div style={{ flex: 1, height: '1px', background: colors.border }}></div>
            <span style={{ fontSize: '0.8rem', color: '#888' }}>OR</span>
            <div style={{ flex: 1, height: '1px', background: colors.border }}></div>
        </div>

        <button 
            type="button" 
            onClick={() => nav("/signup")}
            style={{ 
                padding: "10px", 
                background: "#22c55e", // Green color for Sign Up
                color: "white", 
                border: "none", 
                borderRadius: 4, 
                cursor: "pointer",
                fontWeight: "bold"
            }}
        >
            Create an Account
        </button>
      
      </form>
    </div>
  );
}
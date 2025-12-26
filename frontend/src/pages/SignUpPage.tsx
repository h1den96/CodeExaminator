import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

// Ensure this matches your API base URL
const API_BASE = "http://localhost:3000";

export default function SignUpPage() {
  const { colors, theme } = useTheme();
  const nav = useNavigate();

  // Sign Up Fields
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
      // Assuming your backend endpoint is /api/auth/register
      // Adjust the body fields if your backend expects different keys (e.g. first_name vs firstName)
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          first_name: firstName, 
          last_name: lastName, 
          semester: Number(semester),
          email, 
          password,
          role: "student" // Default role, adjust if backend handles this automatically
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "Registration failed");
        setLoading(false);
        return;
      }

      // On success, redirect to login so they can authenticate
      alert("Account created successfully! Please log in.");
      nav("/login");

    } catch (err: any) {
      setError(err.message || "Error connecting to server");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    padding: "10px",
    background: colors.inputBg,
    border: `1px solid ${colors.border}`,
    color: colors.text,
    borderRadius: 4
  };

  return (
    <div style={{ 
      minHeight: "100vh", 
      width: "100vw", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center", 
      backgroundColor: colors.bg, 
      color: colors.text 
    }}>
      <form 
        onSubmit={handleSubmit} 
        style={{ 
          backgroundColor: colors.card, 
          padding: "2rem", 
          borderRadius: "8px", 
          border: `1px solid ${colors.border}`, 
          display: "flex", 
          flexDirection: "column", 
          gap: "1rem", 
          width: "320px", 
          boxShadow: theme === 'light' ? "0 4px 10px rgba(0,0,0,0.1)" : "none" 
        }}
      >
        <h1 style={{ margin: "0 0 1rem 0", textAlign: "center" }}>Sign Up</h1>
        
        {error && (
          <div style={{ color: "#ef4444", textAlign: "center", fontSize: "0.9rem" }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: "10px" }}>
          <input 
            style={{ ...inputStyle, width: "100%" }} 
            type="text" 
            value={firstName} 
            onChange={(e) => setFirstName(e.target.value)} 
            placeholder="First Name" 
            required 
          />
          <input 
            style={{ ...inputStyle, width: "100%" }} 
            type="text" 
            value={lastName} 
            onChange={(e) => setLastName(e.target.value)} 
            placeholder="Last Name" 
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
          placeholder="Email" 
          required 
        />
        
        <input 
          style={inputStyle} 
          type="password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          placeholder="Password" 
          required 
        />

        <button 
          type="submit" 
          disabled={loading} 
          style={{ 
            padding: "10px", 
            marginTop: "10px", 
            background: "#2563eb", 
            color: "white", 
            border: "none", 
            borderRadius: 4, 
            cursor: "pointer", 
            opacity: loading ? 0.7 : 1,
            fontWeight: "bold"
          }}
        >
          {loading ? "Creating Account..." : "Sign Up"}
        </button>

        <div style={{ textAlign: "center", fontSize: "0.9rem", marginTop: "10px", color: "#666" }}>
          Already have an account?{" "}
          <span 
            onClick={() => nav("/login")} 
            style={{ color: "#2563eb", cursor: "pointer", textDecoration: "underline" }}
          >
            Log in
          </span>
        </div>
      </form>
    </div>
  );
}
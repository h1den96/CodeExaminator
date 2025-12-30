import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { fetchAvailableTests, type AvailableTest } from "../api/testClient";

export default function AvailableTestsPage() {
  const { token, logout } = useAuth();
  const { colors, theme, toggleTheme } = useTheme();
  const [tests, setTests] = useState<AvailableTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const nav = useNavigate();

  // FIXED: Helper to Logout AND Redirect
  const handleLogout = () => {
    logout();
    nav("/login");
  };

  useEffect(() => {
    const loadTests = async () => {
      // 1. Try to get token from Context OR LocalStorage (Fixes refresh bug)
      const effectiveToken = token || localStorage.getItem("accessToken");

      if (!effectiveToken) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setErr(null);
        const data = await fetchAvailableTests(effectiveToken);
        setTests(data);
      } catch (e: any) {
        console.error(e);
        setErr(e.message || "Failed to load tests");
      } finally {
        setLoading(false);
      }
    };

    loadTests();
  }, [token]); 

  if (loading) return <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: colors.bg, color: colors.text }}>Loading...</div>;
  if (err) return <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: colors.bg, color: "red" }}>{err}</div>;

  return (
    <div style={{
      minHeight: "100vh",
      width: "100vw",
      backgroundColor: colors.bg,
      color: colors.text,
      padding: "40px",
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      transition: "background 0.3s ease"
    }}>
      
      <div style={{ width: "100%", maxWidth: "1200px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px" }}>
          <h1 style={{ margin: 0, fontSize: "2rem", fontWeight: "700" }}>Available Tests</h1>
          <div style={{ display: "flex", gap: "10px" }}>
            <button 
              onClick={toggleTheme}
              style={{ padding: "8px 16px", background: colors.card, border: `1px solid ${colors.border}`, color: colors.text, borderRadius: 6, cursor: "pointer" }}
            >
              {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
            </button>
            <button 
              onClick={handleLogout} 
              style={{ padding: "8px 16px", background: "transparent", border: "1px solid #ef4444", color: "#ef4444", borderRadius: 6, cursor: "pointer" }}
            >
              Log out
            </button>
          </div>
        </div>

        {/* Tests Grid */}
        {tests.length === 0 ? (
          <p style={{ textAlign: "center", color: colors.textSec }}>No tests available at the moment.</p>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
            gap: "24px",
            width: "100%"
          }}>
            {tests.map((t) => (
              <div key={t.test_id} style={{
                backgroundColor: colors.card,
                borderRadius: "12px",
                border: `1px solid ${colors.border}`,
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow: theme === 'light' ? "0 4px 6px -1px rgba(0, 0, 0, 0.05)" : "none",
                transition: "transform 0.2s, box-shadow 0.2s",
                height: "220px"
              }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                    <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: "600", color: colors.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "70%" }}>
                      {t.title}
                    </h2>
                    <span style={{ 
                      fontSize: "0.75rem", 
                      fontWeight: "bold", 
                      backgroundColor: theme === 'dark' ? "#1e3a8a" : "#dbeafe", 
                      color: theme === 'dark' ? "#bfdbfe" : "#1e40af", 
                      padding: "4px 8px", 
                      borderRadius: "99px" 
                    }}>
                      {t.total_points} PTS
                    </span>
                  </div>
                  <p style={{ 
                    margin: 0, 
                    color: colors.textSec, 
                    fontSize: "0.95rem", 
                    lineHeight: "1.5",
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden"
                  }}>
                    {t.description || "No description provided."}
                  </p>
                </div>
                
                <div style={{ marginTop: "auto", textAlign: "right" }}>
                  <button 
                    onClick={() => nav(`/run-test?test_id=${t.test_id}`)}
                    style={{ 
                      backgroundColor: "#2563eb", 
                      color: "white", 
                      border: "none", 
                      padding: "10px 24px", 
                      borderRadius: "8px", 
                      fontWeight: "500", 
                      cursor: "pointer",
                      transition: "background 0.2s"
                    }}
                  >
                    Start Exam
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../auth/AuthContext"; // Import Auth Context

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const { colors } = useTheme();
  const { logout } = useAuth(); // Get the logout function

  const handleLogout = () => {
    logout(); // Clear state/storage
    navigate("/login"); // Go to login
  };

  return (
    <div style={{ padding: "40px", maxWidth: "1000px", margin: "0 auto" }}>
      
      {/* Header with Logout */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px" }}>
        <h1 style={{ color: colors.text, margin: 0 }}>Teacher Dashboard</h1>
        <button 
          onClick={handleLogout}
          style={{
            padding: "10px 20px",
            backgroundColor: "#ef4444", // Red color
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
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
        
        {/* Card 1: Create New Test */}
        <div 
          onClick={() => navigate("/teacher/create-test")}
          style={{
            backgroundColor: colors.card,
            border: `1px solid ${colors.border}`,
            padding: "30px",
            borderRadius: "12px",
            cursor: "pointer",
            transition: "transform 0.2s",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-5px)"}
          onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
        >
          <h2 style={{ color: "#2563eb", marginTop: 0 }}>➕ Create New Test</h2>
          <p style={{ color: colors.text, opacity: 0.8 }}>
            Design a new exam blueprint. Set topics, difficulties, and point values.
          </p>
        </div>

        {/* Card 2: View Active Tests */}
        <div 
          onClick={() => navigate("/tests")}
          style={{
            backgroundColor: colors.card,
            border: `1px solid ${colors.border}`,
            padding: "30px",
            borderRadius: "12px",
            cursor: "pointer",
            transition: "transform 0.2s",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-5px)"}
          onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
        >
          <h2 style={{ color: "#16a34a", marginTop: 0 }}>📋 View Active Tests</h2>
          <p style={{ color: colors.text, opacity: 0.8 }}>
            See the list of currently available tests.
          </p>
        </div>

      </div>
    </div>
  );
}
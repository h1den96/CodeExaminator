import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useTheme } from "../context/ThemeContext";

interface Test {
  test_id: number;
  title: string;
  description: string;
  available_from: string;
  available_until: string;
  duration_minutes: number;
  submission_status: string | null; // 'in_progress', 'completed', or null
  total_grade: string | null;
}

export default function AvailableTestsPage() {
  const { colors } = useTheme();
  const navigate = useNavigate();
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 1. New State for Sorting
  const [sortOption, setSortOption] = useState("relevant");

  useEffect(() => {
    api.get("/tests/available")
      .then((res) => setTests(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  // 2. The Sorting Logic (Memoized for performance)
  const sortedTests = useMemo(() => {
    const sorted = [...tests]; // Create a copy to sort
    const now = new Date().getTime();

    switch (sortOption) {
      case "az":
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      
      case "za":
        return sorted.sort((a, b) => b.title.localeCompare(a.title));
      
      case "ending_soon":
        // Sort by deadline (closest first). Null deadlines go last.
        return sorted.sort((a, b) => {
          if (!a.available_until) return 1;
          if (!b.available_until) return -1;
          return new Date(a.available_until).getTime() - new Date(b.available_until).getTime();
        });

      case "newest":
        // Sort by start date (newest first)
        return sorted.sort((a, b) => 
          new Date(b.available_from).getTime() - new Date(a.available_from).getTime()
        );

      case "relevant":
      default:
        // "Smart Sort": Active > Upcoming > Past
        return sorted.sort((a, b) => {
          const getScore = (t: Test) => {
            const start = new Date(t.available_from).getTime();
            const end = t.available_until ? new Date(t.available_until).getTime() : Infinity;
            
            // Priority 1: Active (Started & Not Ended)
            if (now >= start && now <= end) return 1;
            // Priority 2: Upcoming (Not started yet)
            if (now < start) return 2;
            // Priority 3: Past (Ended)
            return 3;
          };
          return getScore(a) - getScore(b);
        });
    }
  }, [tests, sortOption]);

  const handleStart = (testId: number) => {
    navigate("/exam", { state: { test_id: testId } });
  };

  return (
    <div style={{ padding: "40px 20px", maxWidth: "1000px", margin: "0 auto", minHeight: "100vh", background: colors.bg, color: colors.text }}>
      
      {/* Header Section */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", flexWrap: "wrap", gap: "20px" }}>
        <div>
          <h1 style={{ margin: 0 }}>Available Exams</h1>
          <p style={{ color: colors.textSec, marginTop: "5px" }}>Select an exam to begin.</p>
        </div>

        {/* 3. The Sort Dropdown */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <label style={{ fontWeight: "bold", fontSize: "0.9rem", color: colors.textSec }}>Sort By:</label>
          <select 
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            style={{
              padding: "10px 15px",
              borderRadius: "8px",
              border: `1px solid ${colors.border}`,
              background: colors.card,
              color: colors.text,
              cursor: "pointer",
              fontSize: "0.9rem",
              outline: "none"
            }}
          >
            <option value="relevant">🔥 Most Relevant</option>
            <option value="ending_soon">⏳ Ending Soon</option>
            <option value="newest">📅 Newest Added</option>
            <option value="az">Aa-Zz Title</option>
            <option value="za">Zz-Aa Title</option>
          </select>
        </div>
      </div>

      {loading && <p>Loading tests...</p>}

      {!loading && sortedTests.length === 0 && (
        <div style={{ padding: "40px", textAlign: "center", background: colors.card, borderRadius: "12px", border: `1px solid ${colors.border}` }}>
            <h3>No exams found</h3>
            <p style={{ color: colors.textSec }}>Check back later for new assignments.</p>
        </div>
      )}

      {/* Grid of Tests */}
      <div style={{ display: "grid", gap: "20px" }}>
        {sortedTests.map((test) => {
           const now = new Date().getTime();
           const start = new Date(test.available_from).getTime();
           const end = test.available_until ? new Date(test.available_until).getTime() : Infinity;
           
           const isActive = now >= start && now <= end;
           const isFuture = now < start;
           const isPast = now > end;
           const isCompleted = test.submission_status === 'completed';

           return (
            <div key={test.test_id} style={{ 
                padding: "25px", 
                backgroundColor: colors.card, 
                border: `1px solid ${colors.border}`, 
                borderRadius: "12px",
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center",
                opacity: isPast ? 0.7 : 1,
                boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
            }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "5px" }}>
                    <h2 style={{ margin: 0, fontSize: "1.4rem" }}>{test.title}</h2>
                    {/* Status Badge */}
                    {isCompleted ? <span style={badgeStyle("#dcfce7", "#166534")}>COMPLETED</span> :
                     isActive ? <span style={badgeStyle("#dbeafe", "#1e40af")}>ACTIVE</span> :
                     isFuture ? <span style={badgeStyle("#f3f4f6", "#4b5563")}>UPCOMING</span> :
                     <span style={badgeStyle("#fee2e2", "#991b1b")}>CLOSED</span>
                    }
                </div>
                
                <p style={{ color: colors.textSec, margin: "5px 0 10px 0" }}>{test.description || "No description provided."}</p>
                
                <div style={{ fontSize: "0.85rem", color: colors.textSec, display: "flex", gap: "15px" }}>
                    <span>⏱ Duration: <strong>{test.duration_minutes} mins</strong></span>
                    {test.available_until && (
                        <span>📅 Due: {new Date(test.available_until).toLocaleString()}</span>
                    )}
                </div>
              </div>

              {/* Action Button */}
              <div>
                {isCompleted ? (
                    <div style={{ textAlign: "right" }}>
                        <span style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#16a34a" }}>
                            {test.total_grade}%
                        </span>
                        <div style={{ fontSize: "0.8rem", color: colors.textSec }}>Final Grade</div>
                    </div>
                ) : (
                    <button 
                        onClick={() => handleStart(test.test_id)}
                        disabled={!isActive || isCompleted}
                        style={{
                            padding: "12px 25px",
                            backgroundColor: isActive ? "#2563eb" : "#e5e7eb",
                            color: isActive ? "white" : "#9ca3af",
                            border: "none",
                            borderRadius: "8px",
                            fontWeight: "bold",
                            cursor: isActive ? "pointer" : "not-allowed",
                            transition: "background 0.2s"
                        }}
                    >
                        {isActive ? "Start Exam" : isFuture ? "Opens Soon" : "Closed"}
                    </button>
                )}
              </div>
            </div>
           );
        })}
      </div>
    </div>
  );
}

// Simple helper for badge styles
const badgeStyle = (bg: string, color: string) => ({
    backgroundColor: bg,
    color: color,
    padding: "4px 8px",
    borderRadius: "6px",
    fontSize: "0.7rem",
    fontWeight: "bold",
    textTransform: "uppercase" as const
});
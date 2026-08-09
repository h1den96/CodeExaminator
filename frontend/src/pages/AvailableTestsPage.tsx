import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useTheme } from "../context/ThemeContext";
import BackgroundAccents from "../components/BackgroundAccents";

interface Test {
  test_id: number;
  title: string;
  description: string;
  available_from: string;
  available_until: string;
  duration_minutes: number;
  submission_status: string | null;
  total_grade: string | null;
}

export default function AvailableTestsPage() {
  const { colors, richBackground } = useTheme();
  const navigate = useNavigate();
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);

  const [sortOption, setSortOption] = useState("relevant");

  useEffect(() => {
    api
      .get("/tests/available")
      .then((res) => setTests(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const sortedTests = useMemo(() => {
    const sorted = [...tests];
    const now = new Date().getTime();

    switch (sortOption) {
      case "az":
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      case "za":
        return sorted.sort((a, b) => b.title.localeCompare(a.title));
      case "ending_soon":
        return sorted.sort((a, b) => {
          if (!a.available_until) return 1;
          if (!b.available_until) return -1;
          return (
            new Date(a.available_until).getTime() -
            new Date(b.available_until).getTime()
          );
        });
      case "newest":
        return sorted.sort(
          (a, b) =>
            new Date(b.available_from).getTime() -
            new Date(a.available_from).getTime(),
        );
      case "relevant":
      default:
        return sorted.sort((a, b) => {
          const getScore = (t: Test) => {
            const start = new Date(t.available_from).getTime();
            const end = t.available_until
              ? new Date(t.available_until).getTime()
              : Infinity;
            if (now >= start && now <= end) return 1;
            if (now < start) return 2;
            return 3;
          };
          return getScore(a) - getScore(b);
        });
    }
  }, [tests, sortOption]);

  const handleStart = (testId: number) => {
    navigate("/exam", { state: { test_id: testId } });
  };

  const badgeStyle = (bg: string, color: string) => ({
    backgroundColor: bg,
    color,
    padding: "4px 10px",
    borderRadius: "999px",
    fontSize: "0.68rem",
    fontWeight: 700,
    textTransform: "uppercase" as const,
    letterSpacing: "0.03em",
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        color: colors.text,
        position: "relative",
        ...richBackground,
      }}
    >
      <BackgroundAccents />
      <div
        style={{
          position: "relative",
          zIndex: 1,
          padding: "40px 20px",
          maxWidth: "1000px",
          margin: "0 auto",
        }}
      >
      {/* Header Section */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "30px",
          flexWrap: "wrap",
          gap: "20px",
        }}
      >
        <div>
          <h1 style={{ margin: 0 }}>Available exams</h1>
          <p style={{ color: colors.textSec, marginTop: "5px" }}>
            Select an exam to begin.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <label
              style={{
                fontWeight: 600,
                fontSize: "0.85rem",
                color: colors.textSec,
              }}
            >
              Sort by
            </label>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              style={{
                padding: "9px 14px",
                borderRadius: "8px",
                border: `1px solid ${colors.border}`,
                background: colors.card,
                color: colors.text,
                cursor: "pointer",
                fontSize: "0.85rem",
                outline: "none",
              }}
            >
              <option value="relevant">🔥 Most relevant</option>
              <option value="ending_soon">⏳ Ending soon</option>
              <option value="newest">📅 Newest added</option>
              <option value="az">Aa–Zz title</option>
              <option value="za">Zz–Aa title</option>
            </select>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => navigate("/history")}
              style={{
                padding: "10px 18px",
                backgroundColor: colors.accent,
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontWeight: 600,
                cursor: "pointer",
                fontSize: "0.85rem",
                transition: "background 0.15s",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = colors.accentHover;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = colors.accent;
              }}
            >
              Test history
            </button>

            <button
              onClick={handleLogout}
              style={{
                padding: "10px 18px",
                backgroundColor: "transparent",
                color: colors.dangerText,
                border: `1px solid ${colors.dangerBorder}`,
                borderRadius: "8px",
                fontWeight: 600,
                cursor: "pointer",
                fontSize: "0.85rem",
                transition: "all 0.15s",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = colors.dangerBg;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {loading && <p style={{ color: colors.textSec }}>Loading tests...</p>}

      {!loading && sortedTests.length === 0 && (
        <div
          style={{
            padding: "40px",
            textAlign: "center",
            background: colors.card,
            borderRadius: "12px",
            border: `1px solid ${colors.border}`,
          }}
        >
          <h3 style={{ margin: "0 0 6px 0" }}>No exams found</h3>
          <p style={{ color: colors.textSec, margin: 0 }}>
            Check back later for new assignments.
          </p>
        </div>
      )}

      {/* Grid of Tests */}
      <div style={{ display: "grid", gap: "16px" }}>
        {sortedTests.map((test) => {
          const now = new Date().getTime();
          const start = new Date(test.available_from).getTime();
          const end = test.available_until
            ? new Date(test.available_until).getTime()
            : Infinity;

          const isActive = now >= start && now <= end;
          const isFuture = now < start;
          const isPast = now > end;
          const isCompleted =
            test.submission_status === "completed" ||
            test.submission_status === "submitted";

          return (
            <div
              key={test.test_id}
              style={{
                padding: "24px",
                backgroundColor: colors.card,
                border: `1px solid ${colors.border}`,
                borderRadius: "12px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                opacity: isPast && !isCompleted ? 0.65 : 1,
                gap: "20px",
                flexWrap: "wrap",
              }}
            >
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    marginBottom: "6px",
                  }}
                >
                  <h2 style={{ margin: 0, fontSize: "1.3rem" }}>
                    {test.title}
                  </h2>
                  {isCompleted ? (
                    <span style={badgeStyle(colors.successBg, colors.successText)}>
                      Completed
                    </span>
                  ) : isActive ? (
                    <span style={badgeStyle(colors.accentSubtle, colors.accentText)}>
                      Active
                    </span>
                  ) : isFuture ? (
                    <span style={badgeStyle(colors.neutralBg, colors.neutralText)}>
                      Upcoming
                    </span>
                  ) : (
                    <span style={badgeStyle(colors.dangerBg, colors.dangerText)}>
                      Closed
                    </span>
                  )}
                </div>

                <p style={{ color: colors.textSec, margin: "0 0 10px 0" }}>
                  {test.description || "No description provided."}
                </p>

                <div
                  style={{
                    fontSize: "0.83rem",
                    color: colors.textSec,
                    display: "flex",
                    gap: "16px",
                    flexWrap: "wrap",
                  }}
                >
                  <span>
                    ⏱ Duration: <strong>{test.duration_minutes} mins</strong>
                  </span>
                  {test.available_until && (
                    <span>
                      📅 Due: {new Date(test.available_until).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>

              <div>
                {isCompleted ? (
                  <div style={{ textAlign: "right" }}>
                    <span
                      style={{
                        fontSize: "1.5rem",
                        fontWeight: 700,
                        color: colors.successText,
                      }}
                    >
                      {test.total_grade}%
                    </span>
                    <div style={{ fontSize: "0.78rem", color: colors.textSec }}>
                      Final grade
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => handleStart(test.test_id)}
                    disabled={!isActive || isCompleted}
                    style={{
                      padding: "11px 24px",
                      backgroundColor: isActive ? colors.accent : colors.neutralBg,
                      color: isActive ? "white" : colors.textMuted,
                      border: "none",
                      borderRadius: "8px",
                      fontWeight: 600,
                      cursor: isActive ? "pointer" : "not-allowed",
                      transition: "background 0.15s",
                    }}
                    onMouseOver={(e) => {
                      if (isActive) e.currentTarget.style.backgroundColor = colors.accentHover;
                    }}
                    onMouseOut={(e) => {
                      if (isActive) e.currentTarget.style.backgroundColor = colors.accent;
                    }}
                  >
                    {isActive
                      ? "Start exam"
                      : isFuture
                        ? "Opens soon"
                        : "Closed"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
}
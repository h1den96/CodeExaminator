import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useTheme } from "../context/ThemeContext";
import BackgroundAccents from "../components/BackgroundAccents";

export default function CreateTF() {
  const { colors, richBackground } = useTheme();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [topics, setTopics] = useState<any[]>([]);
  const [isTrue, setIsTrue] = useState(true);
  const [penaltyPercent, setPenaltyPercent] = useState(100);

  const difficultiesList = [
    { id: "easy", name: "Easy" },
    { id: "medium", name: "Medium" },
    { id: "hard", name: "Hard" }
  ];

  useEffect(() => {
    api.get("/topics").then((res) => setTopics(res.data));
  }, []);

  const handleSubmit = async () => {
    if (!title || !body || !topic) return alert("Missing fields");
    try {
      await api.post("/questions/tf", {
        title,
        body,
        difficulty,
        topic_ids: [Number(topic)],
        is_true: isTrue,
        penalty_ratio: penaltyPercent / 100,
      });
      alert("True/False Question Created!");
      navigate("/teacher/create-question-hub");
    } catch (e) {
      alert("Error creating question");
    }
  };

  const handleBack = () => {
    navigate("/teacher/create-question-hub");
  };

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
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
          maxWidth: "800px",
          margin: "0 auto",
          padding: "40px 20px",
        }}
      >
        <button
          onClick={handleBack}
          style={{
            marginBottom: "20px",
            background: "transparent",
            color: colors.text,
            border: `1px solid ${colors.border}`,
            padding: "8px 16px",
            borderRadius: "6px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          ← Back to Hub
        </button>

        <div
          style={{
            background: colors.card,
            padding: "30px",
            borderRadius: "12px",
            border: `1px solid ${colors.border}`,
          }}
        >
          <h1 style={{ marginBottom: "20px" }}>Create True/False Question</h1>

          <input
            style={{
              width: "100%",
              padding: "10px",
              marginBottom: "15px",
              background: colors.inputBg,
              border: `1px solid ${colors.border}`,
              color: colors.text,
              borderRadius: "6px",
            }}
            placeholder="Question Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <textarea
            style={{
              width: "100%",
              padding: "10px",
              marginBottom: "15px",
              height: "100px",
              background: colors.inputBg,
              border: `1px solid ${colors.border}`,
              color: colors.text,
              borderRadius: "6px",
            }}
            placeholder="Statement (e.g., 'The sky is blue.')"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />

          <select
            style={{
              width: "100%",
              padding: "10px",
              marginBottom: "20px",
              background: colors.inputBg,
              color: colors.text,
              border: `1px solid ${colors.border}`,
              borderRadius: "6px",
            }}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          >
            <option value="">Select Topic</option>
            {topics.map((t) => (
              <option key={t.topic_id} value={t.topic_id}>
                {t.name}
              </option>
            ))}
          </select>

          <select
            style={{
              width: "100%",
              padding: "10px",
              marginBottom: "20px",
              background: colors.inputBg,
              color: colors.text,
              border: `1px solid ${colors.border}`,
              borderRadius: "6px",
            }}
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
          >
            <option value="">Select Difficulty</option>
            {difficultiesList.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          <h3>Select the Correct Answer:</h3>
          <div style={{ display: "flex", gap: "20px", marginTop: "10px" }}>
            <button
              onClick={() => setIsTrue(true)}
              style={{
                flex: 1,
                padding: "20px",
                background: isTrue ? colors.successText : colors.bg,
                border: isTrue
                  ? `2px solid ${colors.successBorder}`
                  : `1px solid ${colors.border}`,
                color: isTrue ? "white" : colors.text,
                cursor: "pointer",
                borderRadius: "8px",
                fontWeight: "bold",
              }}
            >
              TRUE
            </button>
            <button
              onClick={() => setIsTrue(false)}
              style={{
                flex: 1,
                padding: "20px",
                background: !isTrue ? colors.dangerText : colors.bg,
                border: !isTrue
                  ? `2px solid ${colors.dangerBorder}`
                  : `1px solid ${colors.border}`,
                color: !isTrue ? "white" : colors.text,
                cursor: "pointer",
                borderRadius: "8px",
                fontWeight: "bold",
              }}
            >
              FALSE
            </button>
          </div>

          <div style={{ marginTop: "20px" }}>
            <h3>Penalty for a Wrong Answer:</h3>
            <p style={{ fontSize: "13px", color: colors.text, opacity: 0.75, marginTop: "4px" }}>
              Only applies if the test this question is used in has negative
              marking enabled. 100% deducts full points on a wrong answer,
              same as the question's own points; lower it for a softer
              penalty.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "10px" }}>
              <input
                type="number"
                min={0}
                max={100}
                step={5}
                value={penaltyPercent}
                onChange={(e) => setPenaltyPercent(Number(e.target.value))}
                style={{
                  width: "100px",
                  padding: "10px",
                  background: colors.inputBg,
                  border: `1px solid ${colors.border}`,
                  color: colors.text,
                  borderRadius: "6px",
                }}
              />
              <span>%</span>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            style={{
              marginTop: "30px",
              width: "100%",
              padding: "12px",
              background: colors.accent,
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Save Question
          </button>
        </div>
      </div>
    </div>
  );
}
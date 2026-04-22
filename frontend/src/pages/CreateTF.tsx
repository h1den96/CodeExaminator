import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useTheme } from "../context/ThemeContext";

export default function CreateTF() {
  const { colors } = useTheme();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [topics, setTopics] = useState<any[]>([]);
  const [isTrue, setIsTrue] = useState(true);

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
      });
      alert("True/False Question Created!");
      navigate("/teacher/create-question-hub");
    } catch (e) {
      alert("Error creating question");
    }
  };

  return (
    <div
      style={{
        padding: "40px",
        background: colors.bg,
        minHeight: "100vh",
        color: colors.text,
      }}
    >
      <div
        style={{
          maxWidth: "800px",
          margin: "0 auto",
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
              background: isTrue ? "#166534" : colors.bg,
              border: isTrue
                ? "2px solid #22c55e"
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
              background: !isTrue ? "#991b1b" : colors.bg,
              border: !isTrue
                ? "2px solid #ef4444"
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

        <button
          onClick={handleSubmit}
          style={{
            marginTop: "30px",
            width: "100%",
            padding: "12px",
            background: "#2563eb",
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
  );
}

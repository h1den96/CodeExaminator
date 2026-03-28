import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useTheme } from "../context/ThemeContext";

export default function CreateMCQ() {
  const { colors, theme } = useTheme();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [topic, setTopic] = useState("");
  const [topics, setTopics] = useState<any[]>([]);

  // MCQ State: Options with explicit WEIGHTS
  const [options, setOptions] = useState([
    { text: "", weight: 100 }, // Default: 100% credit
    { text: "", weight: 0 }, // Default: 0% credit
    { text: "", weight: 0 },
    { text: "", weight: 0 },
  ]);

  useEffect(() => {
    api.get("/topics").then((res) => setTopics(res.data));
  }, []);

  const handleOptionChange = (
    idx: number,
    field: "text" | "weight",
    val: string,
  ) => {
    const newOpts = [...options];
    if (field === "weight") {
      // Allow numeric input, clamp between -100 and 100 if you want
      newOpts[idx].weight = Number(val);
    } else {
      newOpts[idx].text = val;
    }
    setOptions(newOpts);
  };

  const addOption = () => {
    setOptions([...options, { text: "", weight: 0 }]);
  };

  const removeOption = (idx: number) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!title || !body || !topic) return alert("Missing fields");

    // Validation: Ensure at least one option gives points
    if (!options.some((o) => o.weight > 0)) {
      return alert("At least one option must have a positive score weight!");
    }

    try {
      await api.post("/questions/mcq", {
        title,
        body,
        difficulty,
        topic_ids: [Number(topic)],
        // Backend expects 0.0 to 1.0, so we divide by 100
        options: options.map((o) => ({
          text: o.text,
          score_weight: o.weight / 100,
        })),
      });
      alert("MCQ Created!");
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
        <h1 style={{ marginBottom: "20px" }}>Create Weighted MCQ</h1>

        {/* Basic Info */}
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
          placeholder="Question Body"
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

        {/* Options Section */}
        <h3>Options & Weights</h3>
        <p
          style={{
            fontSize: "0.85rem",
            color: colors.textSec,
            marginBottom: "15px",
          }}
        >
          Assign a <strong>Score %</strong> to each option. <br />
          • 100 = Fully Correct
          <br />
          • 50 = Half Credit
          <br />
          • 0 = Incorrect
          <br />• -25 = Penalty (if negative grading enabled)
        </p>

        {options.map((opt, idx) => (
          <div
            key={idx}
            style={{
              display: "flex",
              gap: "10px",
              marginBottom: "10px",
              alignItems: "center",
            }}
          >
            {/* Weight Input */}
            <div
              style={{
                width: "80px",
                display: "flex",
                alignItems: "center",
                position: "relative",
              }}
            >
              <input
                type="number"
                value={opt.weight}
                onChange={(e) =>
                  handleOptionChange(idx, "weight", e.target.value)
                }
                style={{
                  width: "100%",
                  padding: "10px",
                  textAlign: "center",
                  fontWeight: "bold",
                  background:
                    opt.weight > 0
                      ? "#dcfce7"
                      : opt.weight < 0
                        ? "#fee2e2"
                        : colors.inputBg,
                  border:
                    opt.weight > 0
                      ? "2px solid #22c55e"
                      : opt.weight < 0
                        ? "2px solid #ef4444"
                        : `1px solid ${colors.border}`,
                  color:
                    opt.weight > 0
                      ? "#166534"
                      : opt.weight < 0
                        ? "#991b1b"
                        : colors.text,
                  borderRadius: "6px",
                }}
              />
              <span
                style={{
                  position: "absolute",
                  right: "5px",
                  fontSize: "0.8rem",
                  opacity: 0.5,
                }}
              >
                %
              </span>
            </div>

            {/* Text Input */}
            <input
              style={{
                flex: 1,
                padding: "10px",
                background: colors.inputBg,
                border: `1px solid ${colors.border}`,
                color: colors.text,
                borderRadius: "6px",
              }}
              placeholder={`Option ${idx + 1}`}
              value={opt.text}
              onChange={(e) => handleOptionChange(idx, "text", e.target.value)}
            />

            {/* Remove Button */}
            {options.length > 2 && (
              <button
                onClick={() => removeOption(idx)}
                style={{
                  background: "#ef4444",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  width: "30px",
                  height: "30px",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            )}
          </div>
        ))}

        <button
          onClick={addOption}
          style={{
            marginTop: "5px",
            background: "none",
            border: "none",
            color: "#2563eb",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          + Add Option
        </button>

        <hr style={{ margin: "20px 0", borderColor: colors.border }} />

        <button
          onClick={handleSubmit}
          style={{
            width: "100%",
            padding: "12px 24px",
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

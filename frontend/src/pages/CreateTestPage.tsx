import React, { useEffect, useState } from "react";
import { fetchTopics, createTest, type Topic } from "../api/examApi";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

interface Slot {
  topic_id: number;
  question_type: "true_false" | "multiple_choice" | "programming";
  difficulty: "easy" | "medium" | "hard";
  points: number;
  weight_bb: number; // Black-box (Results)
  weight_wb: number; // White-box (Logic)
}

export default function CreateTestPage() {
  const navigate = useNavigate();
  const { colors } = useTheme();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    available_from: "",
    available_until: "",
    duration_minutes: 60,
    strict_deadline: true,
    slots: [] as Slot[], // 🚀 THE NEW CORE: Array of Slots
  });

  useEffect(() => {
    fetchTopics().then(setTopics).catch(console.error);
  }, []);

  const addSlot = () => {
    if (topics.length === 0) return;
    const newSlot: Slot = {
      topic_id: topics[0].topic_id,
      question_type: "multiple_choice",
      difficulty: "easy",
      points: 10,
      weight_bb: 0.8,
      weight_wb: 0.2,
    };
    setFormData((prev) => ({ ...prev, slots: [...prev.slots, newSlot] }));
  };

  const updateSlot = (index: number, updates: Partial<Slot>) => {
    const newSlots = [...formData.slots];
    newSlots[index] = { ...newSlots[index], ...updates };

    // Auto-balance weights if one changes
    if (updates.weight_bb !== undefined)
      newSlots[index].weight_wb = 1 - updates.weight_bb;
    if (updates.weight_wb !== undefined)
      newSlots[index].weight_bb = 1 - updates.weight_wb;

    setFormData((prev) => ({ ...prev, slots: newSlots }));
  };

  const removeSlot = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      slots: prev.slots.filter((_, i) => i !== index),
    }));
  };

  // Inside CreateTestPage.tsx

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.slots.length === 0) {
      setError("Please add at least one question slot.");
      return;
    }

    setLoading(true);
    try {
      // TypeScript should be happy now!
      await createTest({
        title: formData.title,
        description: formData.description,
        available_from: formData.available_from || null,
        available_until: formData.available_until || null,
        duration_minutes: formData.duration_minutes,
        strict_deadline: formData.strict_deadline,
        is_random: true,
        slots: formData.slots, // Ensure this matches the Slot[] type
      });

      alert("Test Blueprint Created!");
      navigate("/teacher/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to create test blueprint.");
    } finally {
      setLoading(false);
    }
  };

  // Styles
  const cardStyle = {
    backgroundColor: colors.card,
    padding: "20px",
    borderRadius: "12px",
    border: `1px solid ${colors.border}`,
    marginBottom: "20px",
  };
  const inputBase = {
    padding: "8px",
    borderRadius: "6px",
    border: `1px solid ${colors.border}`,
    backgroundColor: colors.inputBg,
    color: colors.text,
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: colors.bg,
        color: colors.text,
        padding: "40px 20px",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <header style={{ marginBottom: "30px" }}>
          <h1 style={{ margin: 0 }}>Create Exam Blueprint</h1>
          <p style={{ color: colors.textSec }}>
            Design the "Slots" that define the student experience.
          </p>
        </header>

        {error && (
          <div style={{ color: "red", marginBottom: "20px" }}>{error}</div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{
            display: "grid",
            gridTemplateColumns: "350px 1fr",
            gap: "30px",
          }}
        >
          {/* LEFT: Meta & Scheduling */}
          <section>
            <div style={cardStyle}>
              <h3 style={{ marginTop: 0 }}>General Settings</h3>
              <input
                placeholder="Exam Title"
                style={{ ...inputBase, width: "100%", marginBottom: "15px" }}
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
              />
              <textarea
                placeholder="Instructions..."
                style={{ ...inputBase, width: "100%", minHeight: "100px" }}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>

            <div style={cardStyle}>
              <h3>Timing</h3>
              <div style={{ marginBottom: "10px" }}>
                <label>Opens:</label>
                <input
                  type="datetime-local"
                  style={{ ...inputBase, width: "100%" }}
                  onChange={(e) =>
                    setFormData({ ...formData, available_from: e.target.value })
                  }
                />
              </div>
              <div style={{ marginBottom: "10px" }}>
                <label>Closes:</label>
                <input
                  type="datetime-local"
                  style={{ ...inputBase, width: "100%" }}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      available_until: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label>Duration (Mins):</label>
                <input
                  type="number"
                  value={formData.duration_minutes}
                  style={{ ...inputBase, width: "100%" }}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      duration_minutes: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>
          </section>

          {/* RIGHT: THE SLOT MANAGER */}
          <section>
            <div style={cardStyle}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "20px",
                }}
              >
                <h3 style={{ margin: 0 }}>Question Slots</h3>
                <span style={{ fontWeight: "bold", color: colors.textSec }}>
                  {formData.slots.length} Questions Total
                </span>
              </div>

              {formData.slots.map((slot, index) => (
                <div
                  key={index}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.5fr 1fr 1fr 100px 2fr auto",
                    gap: "10px",
                    alignItems: "center",
                    padding: "15px",
                    border: `1px solid ${colors.border}`,
                    borderRadius: "8px",
                    marginBottom: "10px",
                    backgroundColor: colors.bg,
                  }}
                >
                  {/* Topic */}
                  <select
                    style={inputBase}
                    value={slot.topic_id}
                    onChange={(e) =>
                      updateSlot(index, { topic_id: Number(e.target.value) })
                    }
                  >
                    {topics.map((t) => (
                      <option key={t.topic_id} value={t.topic_id}>
                        {t.name}
                      </option>
                    ))}
                  </select>

                  {/* Type */}
                  <select
                    style={inputBase}
                    value={slot.question_type}
                    onChange={(e) =>
                      updateSlot(index, {
                        question_type: e.target.value as any,
                      })
                    }
                  >
                    <option value="multiple_choice">MCQ</option>
                    <option value="true_false">T/F</option>
                    <option value="programming">Code</option>
                  </select>

                  {/* Difficulty */}
                  <select
                    style={inputBase}
                    value={slot.difficulty}
                    onChange={(e) =>
                      updateSlot(index, { difficulty: e.target.value as any })
                    }
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>

                  {/* Points */}
                  <input
                    type="number"
                    style={inputBase}
                    value={slot.points}
                    onChange={(e) =>
                      updateSlot(index, { points: Number(e.target.value) })
                    }
                  />

                  {/* Hybrid Weights (Only show for Programming) */}
                  <div
                    style={{
                      fontSize: "0.75rem",
                      display: "flex",
                      flexDirection: "column",
                      gap: "2px",
                    }}
                  >
                    {slot.question_type === "programming" ? (
                      <>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <span>
                            Result: {Math.round(slot.weight_bb * 100)}%
                          </span>
                          <span>
                            Logic: {Math.round(slot.weight_wb * 100)}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={slot.weight_bb}
                          onChange={(e) =>
                            updateSlot(index, {
                              weight_bb: parseFloat(e.target.value),
                            })
                          }
                        />
                      </>
                    ) : (
                      <span
                        style={{ color: colors.textSec, fontStyle: "italic" }}
                      >
                        Auto-graded (100% Result)
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => removeSlot(index)}
                    style={{
                      border: "none",
                      background: "transparent",
                      color: "#ef4444",
                      cursor: "pointer",
                      fontSize: "1.2rem",
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={addSlot}
                style={{
                  width: "100%",
                  padding: "12px",
                  border: `2px dashed ${colors.border}`,
                  borderRadius: "8px",
                  cursor: "pointer",
                  background: "transparent",
                  color: colors.text,
                  fontWeight: "bold",
                }}
              >
                + Add New Random Slot
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || formData.slots.length === 0}
              style={{
                width: "100%",
                padding: "20px",
                background: "#2563eb",
                color: "#fff",
                border: "none",
                borderRadius: "12px",
                fontSize: "1.2rem",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              {loading ? "Saving Blueprint..." : "🚀 Create Randomized Exam"}
            </button>
          </section>
        </form>
      </div>
    </div>
  );
}

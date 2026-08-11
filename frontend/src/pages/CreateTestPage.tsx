import React, { useEffect, useState } from "react";
import { fetchTopics, createTest, type Topic } from "../api/examApi";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import BackgroundAccents from "../components/BackgroundAccents";

interface Slot {
  topic_id: number;
  question_type: "true_false" | "multiple_choice" | "programming";
  difficulty: "easy" | "medium" | "hard";
  category: "SCALAR" | "LINEAR" | "GRID" | "LINKED_LIST" | "CUSTOM";
  points: number;
  weight_bb: number; // Black-box (Results)
  weight_wb: number; // White-box (Logic)
}

export default function CreateTestPage() {
  const navigate = useNavigate();
  const { colors, richBackground } = useTheme();
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
    grace_mode: "STANDARD" as "STRICT" | "STANDARD" | "THRESHOLD",
    grace_threshold: 0.90,
    grace_cap: 0.15,
    slots: [] as Slot[], 
  });

  useEffect(() => {
    fetchTopics().then(setTopics).catch(console.error);
  }, []);

  const addSlot = () => {
    if (topics.length === 0) return;
    const newSlot: Slot = {
      topic_id: topics[0].topic_id,
      question_type: "programming",
      difficulty: "easy",
      category: "SCALAR",
      points: 10,
      weight_bb: 0.8,
      weight_wb: 0.2,
    };
    setFormData((prev) => ({ ...prev, slots: [...prev.slots, newSlot] }));
  };

  const updateSlot = (index: number, updates: Partial<Slot>) => {
    const newSlots = [...formData.slots];
    newSlots[index] = { ...newSlots[index], ...updates };

    if (updates.weight_bb !== undefined)
      newSlots[index].weight_wb = Number((1 - updates.weight_bb).toFixed(2));
    if (updates.weight_wb !== undefined)
      newSlots[index].weight_bb = Number((1 - updates.weight_wb).toFixed(2));

    setFormData((prev) => ({ ...prev, slots: newSlots }));
  };

  const removeSlot = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      slots: prev.slots.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.slots.length === 0) {
      setError("Please add at least one question slot.");
      return;
    }

    if (formData.available_from && formData.available_until) {
      const opens = new Date(formData.available_from);
      const closes = new Date(formData.available_until);
      if (closes.getTime() <= opens.getTime()) {
        setError("The closing time must be after the opening time.");
        return;
      }
    }

    setLoading(true);
    try {
      const isoAvailableFrom = formData.available_from 
        ? new Date(formData.available_from).toISOString() 
        : null;
        
      const isoAvailableUntil = formData.available_until 
        ? new Date(formData.available_until).toISOString() 
        : null;

      await createTest({
        ...formData,
        available_from: isoAvailableFrom,
        available_until: isoAvailableUntil,
        is_random: true,
      });

      alert("Strict Exam Blueprint Created!");
      navigate("/teacher/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to create test blueprint.");
    } finally {
      setLoading(false);
    }
  };

  // Shared Styles
  const cardStyle = {
    backgroundColor: colors.card,
    padding: "20px",
    borderRadius: "12px",
    border: `1px solid ${colors.border}`,
    marginBottom: "20px",
  };
  const inputBase = {
    height: "42px",
    padding: "0 12px",
    borderRadius: "8px",
    border: `1px solid ${colors.border}`,
    backgroundColor: colors.inputBg,
    color: colors.text,
    fontSize: "0.95rem",
    boxSizing: "border-box" as const,
  };
  const labelStyle = {
    display: "block",
    marginBottom: "6px",
    fontSize: "0.8rem",
    fontWeight: 600,
    color: colors.textSec,
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

      <style>{`
        .ctp-form-grid {
          display: grid;
          grid-template-columns: 350px 1fr;
          gap: 30px;
        }
        .ctp-slot-row {
          display: grid;
          grid-template-columns: 1.5fr 1fr 1fr 1.5fr 80px 2fr auto;
          gap: 10px;
          align-items: center;
        }
        @media (max-width: 900px) {
          .ctp-form-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 720px) {
          .ctp-slot-row {
            grid-template-columns: 1fr 1fr;
          }
        }
        @media (max-width: 480px) {
          .ctp-slot-row {
            grid-template-columns: 1fr;
          }
        }
    `}</style>
      <div style={{ position: "relative", zIndex: 1, maxWidth: "1200px", margin: "0 auto", padding: "40px 20px" }}>
        <header style={{ marginBottom: "30px" }}>
          <h1 style={{ margin: 0 }}>Create Strict Exam Blueprint</h1>
          <p style={{ color: colors.textSec }}>
            Define specific requirements for randomized question selection.
          </p>
        </header>

        {error && (
          <div style={{ 
            padding: "12px", 
            backgroundColor: colors.dangerBg, 
            color: colors.dangerText, 
            borderRadius: "8px", 
            marginBottom: "20px",
            border: `1px solid ${colors.dangerBorder}` 
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="ctp-form-grid">      
          {/* LEFT: Meta, Scheduling & Global Grace */}
          <section>
            <div style={cardStyle}>
              <h3 style={{ marginTop: 0, marginBottom: "16px" }}>General Settings</h3>
              <div style={{ marginBottom: "15px" }}>
                <label style={labelStyle}>Exam Title</label>
                <input
                  placeholder="e.g. Midterm Exam"
                  style={{ ...inputBase, width: "100%" }}
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <label style={labelStyle}>Instructions</label>
                <textarea
                  placeholder="Instructions for students taking this exam..."
                  style={{
                    ...inputBase,
                    height: "auto",
                    width: "100%",
                    minHeight: "100px",
                    padding: "10px 12px",
                    resize: "vertical",
                    fontFamily: "inherit",
                  }}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>

            <div style={cardStyle}>
              <h3 style={{ marginTop: 0, marginBottom: "16px" }}>Timing</h3>
              <div style={{ marginBottom: "15px" }}>
                <label style={labelStyle}>Opens</label>
                <input
                  type="datetime-local"
                  style={{ ...inputBase, width: "100%" }}
                  value={formData.available_from}
                  onChange={(e) => {
                    const newOpens = e.target.value;
                    setFormData((prev) => ({
                      ...prev,
                      available_from: newOpens,
                      // Clear Closes if it's no longer after the new Opens time
                      available_until:
                        prev.available_until && newOpens && new Date(prev.available_until) <= new Date(newOpens)
                          ? ""
                          : prev.available_until,
                    }));
                  }}
                  required
                />
              </div>
              <div style={{ marginBottom: "15px" }}>
                <label style={labelStyle}>Closes</label>
                <input
                  type="datetime-local"
                  style={{ ...inputBase, width: "100%" }}
                  value={formData.available_until}
                  min={formData.available_from || undefined}
                  onChange={(e) => setFormData({ ...formData, available_until: e.target.value })}
                  required
                />
                {formData.available_from && (
                  <p style={{ margin: "6px 0 0", fontSize: "0.75rem", color: colors.textSec }}>
                    Must be after the opening time.
                  </p>
                )}
              </div>
              <div>
                <label style={labelStyle}>Duration (Mins)</label>
                <input
                  type="number"
                  value={formData.duration_minutes}
                  style={{ ...inputBase, width: "100%" }}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: Number(e.target.value) })}
                  required
                />
              </div>
            </div>

            <div style={cardStyle}>
              <h3 style={{ marginTop: 0, marginBottom: "16px" }}>🛡️ Global Grace Settings</h3>
              <div style={{ marginBottom: "15px" }}>
                <label style={labelStyle}>Grace Mode</label>
                <select
                  style={{ ...inputBase, width: "100%" }}
                  value={formData.grace_mode}
                  onChange={(e) => setFormData({ ...formData, grace_mode: e.target.value as any })}
                >
                  <option value="STANDARD">STANDARD (Partial Credit)</option>
                  <option value="STRICT">STRICT (Zero Credit on Fail)</option>
                  <option value="THRESHOLD">THRESHOLD (AST Health Required)</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>AST Threshold</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    max="1"
                    style={{ ...inputBase, width: "100%" }}
                    value={formData.grace_threshold}
                    onChange={(e) => setFormData({ ...formData, grace_threshold: parseFloat(e.target.value) })}
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Grace Cap</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    max="1"
                    style={{ ...inputBase, width: "100%" }}
                    value={formData.grace_cap}
                    onChange={(e) => setFormData({ ...formData, grace_cap: parseFloat(e.target.value) })}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* RIGHT: THE SLOT MANAGER */}
          <section>
            <div style={cardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h3 style={{ margin: 0 }}>Question Slots</h3>
                <span style={{ fontWeight: "bold", color: colors.textSec }}>
                  {formData.slots.length} Strict Requirements
                </span>
              </div>

              {formData.slots.map((slot, index) => (
                <div
                  key={index}
                  className="ctp-slot-row"
                  style={{
                    padding: "15px",
                    border: `1px solid ${colors.border}`,
                    borderRadius: "8px",
                    marginBottom: "10px",
                    backgroundColor: colors.bg,
                  }}
                >
                  <select
                    style={inputBase}
                    value={slot.topic_id}
                    onChange={(e) => updateSlot(index, { topic_id: Number(e.target.value) })}
                  >
                    {topics.map((t) => (
                      <option key={t.topic_id} value={t.topic_id}>{t.name}</option>
                    ))}
                  </select>

                  <select
                    style={inputBase}
                    value={slot.question_type}
                    onChange={(e) => updateSlot(index, { question_type: e.target.value as any })}
                  >
                    <option value="programming">Code</option>
                    <option value="multiple_choice">MCQ</option>
                    <option value="true_false">T/F</option>
                  </select>

                  <select
                    style={inputBase}
                    value={slot.difficulty}
                    onChange={(e) => updateSlot(index, { difficulty: e.target.value as any })}
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>

                  <select
                    style={{
                      ...inputBase,
                      opacity: slot.question_type === "programming" ? 1 : 0.5,
                    }}
                    disabled={slot.question_type !== "programming"}
                    value={slot.category}
                    onChange={(e) => updateSlot(index, { category: e.target.value as any })}
                  >
                    <option value="SCALAR">Scalar (Simple Function)</option>
                    <option value="LINEAR">Linear (Arrays/Vectors)</option>
                    <option value="GRID">Grid (2D Arrays/Matrices)</option>
                    <option value="LINKED_LIST">Linked List (Nodes/Pointers)</option>
                    <option value="CUSTOM">Custom (Full Program)</option>
                  </select>

                  <input
                    type="number"
                    style={inputBase}
                    value={slot.points}
                    onChange={(e) => updateSlot(index, { points: Number(e.target.value) })}
                  />

                  <div style={{ fontSize: "0.75rem", display: "flex", flexDirection: "column", gap: "2px" }}>
                    {slot.question_type === "programming" ? (
                      <>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span>Result: {Math.round(slot.weight_bb * 100)}%</span>
                          <span>Logic: {Math.round(slot.weight_wb * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={slot.weight_bb}
                          onChange={(e) => updateSlot(index, { weight_bb: parseFloat(e.target.value) })}
                        />
                      </>
                    ) : (
                      <span style={{ color: colors.textSec, fontStyle: "italic" }}>
                        Auto-graded
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => removeSlot(index)}
                    style={{ border: "none", background: "transparent", color: colors.dangerText, cursor: "pointer", fontSize: "1.2rem" }}
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
                + Add Strict Random Slot
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || formData.slots.length === 0}
              style={{
                width: "100%",
                padding: "20px",
                background: loading || formData.slots.length === 0 ? colors.neutralBg : colors.accent,
                color: loading || formData.slots.length === 0 ? colors.neutralText : "#fff",
                border: "none",
                borderRadius: "12px",
                fontSize: "1.2rem",
                fontWeight: "bold",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Creating Exam..." : "🚀 Create Strict Randomized Exam"}
            </button>
          </section>
        </form>
      </div>
    </div>
  );
}
// src/pages/CreateTestPage.tsx
import React, { useEffect, useState } from 'react';
import { fetchTopics, createTest, type Topic } from '../api/examApi';
import { useNavigate } from 'react-router-dom';
import { useTheme } from "../context/ThemeContext";

export default function CreateTestPage() {
  const navigate = useNavigate();
  const { colors } = useTheme(); 
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    
    // Structure
    tf_count: 0,
    mcq_count: 0,
    prog_count: 0,
    tf_points: 1,
    mcq_points: 5,
    prog_points: 10,
    
    // Difficulty
    diff_easy: 0,
    diff_medium: 0,
    diff_hard: 0,
    
    // Selection
    selectedTopics: [] as number[],

    // 🕒 NEW: Scheduling & Strict Mode
    available_from: '',
    available_until: '',
    duration_minutes: 60,
    strict_deadline: true // Default to Strict Mode
  });

  // Load topics
  useEffect(() => {
    fetchTopics()
      .then((data) => setTopics(data))
      .catch((err) => console.error("Failed to load topics", err));
  }, []);

  // 🧠 Auto-Calculate Duration when dates change
  useEffect(() => {
    if (formData.available_from && formData.available_until) {
        const start = new Date(formData.available_from).getTime();
        const end = new Date(formData.available_until).getTime();
        const diffMins = Math.floor((end - start) / 1000 / 60);
        
        // Only update if positive and sensible
        if (diffMins > 0) {
            setFormData(prev => ({ ...prev, duration_minutes: diffMins }));
        }
    }
  }, [formData.available_from, formData.available_until]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    // Handle Checkbox specifically
    if (type === 'checkbox') {
        const checked = (e.target as HTMLInputElement).checked;
        setFormData((prev) => ({ ...prev, [name]: checked }));
        return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? 0 : Number(value)) : value,
    }));
  };

  const handleTopicToggle = (topicId: number) => {
    setFormData((prev) => {
      const current = prev.selectedTopics;
      if (current.includes(topicId)) {
        return { ...prev, selectedTopics: current.filter((id) => id !== topicId) };
      } else {
        return { ...prev, selectedTopics: [...current, topicId] };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const totalQuestions = formData.tf_count + formData.mcq_count + formData.prog_count;
    const totalDiff = formData.diff_easy + formData.diff_medium + formData.diff_hard;

    if (totalQuestions === 0) {
      setError("Error: You must request at least one question.");
      setLoading(false);
      return;
    }
    if (totalQuestions !== totalDiff) {
      setError(`Math Error: Total questions (${totalQuestions}) does not match difficulty sum (${totalDiff}).`);
      setLoading(false);
      return;
    }
    if (formData.selectedTopics.length === 0) {
      setError("Please select at least one topic.");
      setLoading(false);
      return;
    }

    try {
      await createTest({
        title: formData.title,
        description: formData.description,
        
        // Counts & Points
        tf_count: formData.tf_count,
        mcq_count: formData.mcq_count,
        prog_count: formData.prog_count,
        tf_points: formData.tf_points,
        mcq_points: formData.mcq_points,
        prog_points: formData.prog_points,
        
        // Time & Schedule
        duration_minutes: formData.duration_minutes,
        available_from: formData.available_from ? new Date(formData.available_from).toISOString() : null,
        available_until: formData.available_until ? new Date(formData.available_until).toISOString() : null,
        strict_deadline: formData.strict_deadline, // 👈 Sending the flag

        is_random: true,
        generation_config: {
          topics: formData.selectedTopics,
          difficulty_distribution: {
            easy: formData.diff_easy,
            medium: formData.diff_medium,
            hard: formData.diff_hard,
          },
        },
      });

      alert("Test Created Successfully!");
      navigate('/teacher/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to create test.");
    } finally {
      setLoading(false);
    }
  };

  // Helper for total count
  const totalQ = formData.tf_count + formData.mcq_count + formData.prog_count;
  const totalDiff = formData.diff_easy + formData.diff_medium + formData.diff_hard;
  const isMathCorrect = totalQ === totalDiff && totalQ > 0;

  // Style helpers
  const cardStyle = { backgroundColor: colors.card, padding: "25px", borderRadius: "12px", border: `1px solid ${colors.border}`, boxShadow: "0 2px 5px rgba(0,0,0,0.05)" };
  const cardHeader = { marginTop: 0, marginBottom: "20px", borderBottom: `1px solid ${colors.border}`, paddingBottom: "10px" };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: colors.bg, color: colors.text, padding: "40px 20px" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
            <div>
                <h1 style={{ margin: 0, fontSize: "2rem" }}>Create Exam Blueprint</h1>
                <p style={{ color: colors.textSec, marginTop: "5px" }}>Define the rules, scheduling, and structure.</p>
            </div>
            <button 
                onClick={() => navigate('/teacher/dashboard')}
                style={{ padding: "10px 20px", background: "transparent", border: `1px solid ${colors.border}`, color: colors.text, borderRadius: "6px", cursor: "pointer" }}
            >
                Cancel
            </button>
        </div>

        {error && (
          <div style={{ backgroundColor: "#fee2e2", color: "#b91c1c", padding: "15px", borderRadius: "8px", marginBottom: "30px", border: "1px solid #fecaca" }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px" }}>
          
          {/* LEFT COLUMN: Basics & Scheduling */}
          <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
            
            {/* 1. Exam Details */}
            <div style={cardStyle}>
              <h3 style={cardHeader}>1. Exam Details</h3>
              
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", fontSize: "0.9rem" }}>Title</label>
                <input
                  style={{ width: "100%", padding: "10px", borderRadius: "6px", border: `1px solid ${colors.border}`, backgroundColor: colors.inputBg, color: colors.text }}
                  type="text"
                  name="title"
                  placeholder="e.g. Midterm Exam 2024"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", fontSize: "0.9rem" }}>Description</label>
                <textarea
                  style={{ width: "100%", padding: "10px", borderRadius: "6px", border: `1px solid ${colors.border}`, backgroundColor: colors.inputBg, color: colors.text, minHeight: "80px" }}
                  name="description"
                  placeholder="Instructions for students..."
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* 2. Schedule & Timing (NEW SECTION) */}
            <div style={cardStyle}>
              <h3 style={cardHeader}>2. Schedule & Timing</h3>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
                <div>
                    <label style={{ display: "block", marginBottom: "5px", fontSize: "0.9rem", fontWeight: "bold" }}>📅 Opens At</label>
                    <input 
                        type="datetime-local" 
                        name="available_from"
                        value={formData.available_from}
                        onChange={handleChange}
                        style={{ width: "100%", padding: "8px", borderRadius: "6px", border: `1px solid ${colors.border}`, backgroundColor: colors.inputBg, color: colors.text }}
                    />
                </div>
                <div>
                    <label style={{ display: "block", marginBottom: "5px", fontSize: "0.9rem", fontWeight: "bold" }}>📅 Closes At</label>
                    <input 
                        type="datetime-local" 
                        name="available_until"
                        value={formData.available_until}
                        onChange={handleChange}
                        style={{ width: "100%", padding: "8px", borderRadius: "6px", border: `1px solid ${colors.border}`, backgroundColor: colors.inputBg, color: colors.text }}
                    />
                </div>
              </div>

              <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>⏱ Duration (Minutes)</label>
                  <input 
                      type="number" 
                      name="duration_minutes"
                      value={formData.duration_minutes}
                      onChange={handleChange}
                      style={{ width: "120px", padding: "8px", borderRadius: "6px", border: `1px solid ${colors.border}`, backgroundColor: colors.inputBg, color: colors.text }}
                  />
                  <span style={{ fontSize: "0.85rem", color: colors.textSec, marginLeft: "10px" }}>Student timer</span>
              </div>

              {/* 👇 THE STRICT MODE CHECKBOX */}
              <div style={{ padding: "15px", backgroundColor: colors.bg, borderRadius: "8px", border: `1px solid ${colors.border}` }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontWeight: "bold" }}>
                      <input 
                          type="checkbox" 
                          name="strict_deadline"
                          checked={formData.strict_deadline} 
                          onChange={handleChange} 
                          style={{ width: "20px", height: "20px", cursor: "pointer" }}
                      />
                      Enforce Hard Deadline (Strict Mode)
                  </label>
                  <p style={{ margin: "5px 0 0 34px", fontSize: "0.85rem", color: colors.textSec, lineHeight: "1.4" }}>
                      {formData.strict_deadline 
                          ? <span style={{ color: "#b91c1c" }}>🔴 <strong>STRICT:</strong> Test auto-submits at the 'Closes At' time, even if the student started late.</span> 
                          : <span style={{ color: "#15803d" }}>🟢 <strong>FLEXIBLE:</strong> Student gets full duration (e.g., 60 mins) regardless of start time.</span>}
                  </p>
              </div>

            </div>

            {/* 3. Topics */}
            <div style={cardStyle}>
              <h3 style={cardHeader}>3. Topics Covered</h3>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {topics.map(t => {
                  const isSelected = formData.selectedTopics.includes(t.topic_id);
                  return (
                    <div 
                        key={t.topic_id}
                        onClick={() => handleTopicToggle(t.topic_id)}
                        style={{ 
                            padding: '8px 16px', 
                            borderRadius: '20px', 
                            cursor: 'pointer', 
                            border: isSelected ? '1px solid #2563eb' : `1px solid ${colors.border}`, 
                            backgroundColor: isSelected ? '#eff6ff' : colors.bg,
                            color: isSelected ? '#1d4ed8' : colors.text,
                            fontWeight: isSelected ? 'bold' : 'normal',
                            transition: 'all 0.2s',
                            userSelect: 'none'
                        }}
                    >
                        {isSelected && <span>✓ </span>}
                        {t.name}
                    </div>
                  );
                })}
                {topics.length === 0 && <p style={{ color: colors.textSec }}>No topics found.</p>}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Counts & Difficulty */}
          <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
            
            {/* 4. Structure */}
            <div style={cardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${colors.border}`, paddingBottom: "10px", marginBottom: "20px" }}>
                  <h3 style={{ margin: 0 }}>4. Structure</h3>
                  <span style={{ fontSize: "0.85rem", padding: "4px 8px", backgroundColor: "#f3f4f6", borderRadius: "4px", color: "#374151" }}>Total Qs: <strong>{totalQ}</strong></span>
              </div>

              {/* Grid for Inputs */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "15px", alignItems: "end" }}>
                 <label style={{ fontSize: "0.8rem", color: colors.textSec, marginBottom: "-10px" }}>Type</label>
                 <label style={{ fontSize: "0.8rem", color: colors.textSec, marginBottom: "-10px" }}>Count</label>
                 <label style={{ fontSize: "0.8rem", color: colors.textSec, marginBottom: "-10px" }}>Points Each</label>

                 {/* Row 1: T/F */}
                 <div style={{ fontWeight: "bold" }}>True/False</div>
                 <input type="number" name="tf_count" value={formData.tf_count} onChange={handleChange} min="0" style={inputStyle(colors)} />
                 <input type="number" name="tf_points" value={formData.tf_points} onChange={handleChange} min="0" style={inputStyle(colors)} />

                 {/* Row 2: MCQ */}
                 <div style={{ fontWeight: "bold" }}>Multiple Choice</div>
                 <input type="number" name="mcq_count" value={formData.mcq_count} onChange={handleChange} min="0" style={inputStyle(colors)} />
                 <input type="number" name="mcq_points" value={formData.mcq_points} onChange={handleChange} min="0" style={inputStyle(colors)} />

                 {/* Row 3: Code */}
                 <div style={{ fontWeight: "bold" }}>Programming</div>
                 <input type="number" name="prog_count" value={formData.prog_count} onChange={handleChange} min="0" style={inputStyle(colors)} />
                 <input type="number" name="prog_points" value={formData.prog_points} onChange={handleChange} min="0" style={inputStyle(colors)} />
              </div>
            </div>

            {/* 5. Difficulty */}
            <div style={cardStyle}>
               <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${colors.border}`, paddingBottom: "10px", marginBottom: "20px" }}>
                  <h3 style={{ margin: 0 }}>5. Difficulty Mix</h3>
                  <span style={{ 
                      fontSize: "0.85rem", 
                      padding: "4px 8px", 
                      backgroundColor: isMathCorrect ? "#d1fae5" : "#fee2e2", 
                      borderRadius: "4px", 
                      color: isMathCorrect ? "#065f46" : "#b91c1c",
                      transition: "background-color 0.3s"
                  }}>
                      Sum: <strong>{totalDiff}</strong> / {totalQ}
                  </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "15px" }}>
                <div>
                    <label style={{ display: "block", marginBottom: "5px", fontSize: "0.9rem", color: "#16a34a", fontWeight: "bold" }}>Easy</label>
                    <input type="number" name="diff_easy" value={formData.diff_easy} onChange={handleChange} min="0" style={inputStyle(colors)} />
                </div>
                <div>
                    <label style={{ display: "block", marginBottom: "5px", fontSize: "0.9rem", color: "#ea580c", fontWeight: "bold" }}>Medium</label>
                    <input type="number" name="diff_medium" value={formData.diff_medium} onChange={handleChange} min="0" style={inputStyle(colors)} />
                </div>
                <div>
                    <label style={{ display: "block", marginBottom: "5px", fontSize: "0.9rem", color: "#dc2626", fontWeight: "bold" }}>Hard</label>
                    <input type="number" name="diff_hard" value={formData.diff_hard} onChange={handleChange} min="0" style={inputStyle(colors)} />
                </div>
              </div>
              
              {!isMathCorrect && totalQ > 0 && (
                  <p style={{ color: "#ef4444", fontSize: "0.85rem", marginTop: "15px" }}>
                    ⚠️ The difficulty counts must sum up to exactly {totalQ}.
                  </p>
              )}
            </div>

            {/* Submit Button */}
            <button 
                type="submit" 
                disabled={loading || !isMathCorrect} 
                style={{ 
                    padding: "18px", 
                    fontSize: "1.1rem", 
                    backgroundColor: isMathCorrect ? "#2563eb" : "#94a3b8", 
                    color: "#fff", 
                    border: "none", 
                    borderRadius: "8px", 
                    cursor: isMathCorrect ? "pointer" : "not-allowed", 
                    fontWeight: "bold",
                    transition: "background-color 0.2s",
                    boxShadow: "0 4px 6px rgba(37, 99, 235, 0.2)"
                }}
            >
                {loading ? 'Creating Blueprint...' : '🚀 Create Exam'}
            </button>

          </div>
        </form>
      </div>
    </div>
  );
}

// Helper Style for Inputs
const inputStyle = (colors: any) => ({
    width: "100%", 
    padding: "10px", 
    borderRadius: "6px", 
    border: `1px solid ${colors.border}`, 
    backgroundColor: colors.inputBg, 
    color: colors.text,
    textAlign: "center" as const
});
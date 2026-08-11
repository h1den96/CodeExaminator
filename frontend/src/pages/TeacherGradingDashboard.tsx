import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import BackgroundAccents from '../components/BackgroundAccents';
import api from '../api/axios';

export default function TeacherGradingDashboard() {
    const { colors, richBackground } = useTheme();
    const navigate = useNavigate();

    const [tests, setTests] = useState<any[]>([]);
    const [selectedTest, setSelectedTest] = useState<number | null>(null);
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [selectedSubmission, setSelectedSubmission] = useState<number | null>(null);
    const [submissionDetails, setSubmissionDetails] = useState<any | null>(null);
    const [activeQuestionId, setActiveQuestionId] = useState<number | null>(null);

    const [commentary, setCommentary] = useState<string>('');
    const [scoreOverride, setScoreOverride] = useState<string | number>('');

    useEffect(() => {
        api.get('/teacher/tests')
            .then(res => {
                if (Array.isArray(res.data)) setTests(res.data);
            })
            .catch(err => console.error("Failed to load tests:", err));
    }, []);

    const handleSelectTest = (testId: number) => {
        setSelectedTest(testId);
        setSelectedSubmission(null);
        setSubmissionDetails(null);
        api.get(`/teacher/tests/${testId}/submissions`)
            .then(res => {
                if (Array.isArray(res.data)) setSubmissions(res.data);
            })
            .catch(err => console.error("Failed to load submissions:", err));
    };

    const handleSelectSubmission = (subId: number) => {
        setSelectedSubmission(subId);
        api.get(`/teacher/submissions/${subId}/details`)
            .then(res => {
                const data = res.data;
                setSubmissionDetails(data);
                if (data.questions && data.questions.length > 0) {
                    const firstQ = data.questions[0];
                    setActiveQuestionId(firstQ.question_id);
                    setCommentary(firstQ.commentary || '');
                    setScoreOverride(firstQ.score_override ?? firstQ.auto_grade ?? '');
                }
            })
            .catch(err => console.error("Failed to load submission details:", err));
    };

    const handleSelectQuestion = (q: any) => {
        setActiveQuestionId(q.question_id);
        setCommentary(q.commentary || '');
        setScoreOverride(q.score_override ?? q.auto_grade ?? '');
    };

    const handleSaveReview = () => {
        const payload = {
            submissionId: selectedSubmission,
            questionId: activeQuestionId,
            commentary,
            highlightedData: null,
            scoreOverride: scoreOverride === '' ? null : Number(scoreOverride)
        };

        api.post('/teacher/reviews', payload)
            .then(res => {
                const updatedReview = res.data;
                setSubmissionDetails((prev: any) => ({
                    ...prev,
                    questions: prev.questions.map((q: any) => q.question_id === activeQuestionId ? {
                        ...q,
                        commentary: updatedReview.commentary,
                        score_override: updatedReview.score_override,
                        review_id: updatedReview.review_id
                    } : q)
                }));
                alert('Review and grade saved successfully!');
            })
            .catch(err => console.error("Failed to save review:", err));
    };

    const activeQuestion = submissionDetails?.questions?.find((q: any) => q.question_id === activeQuestionId);

    return (
        <div style={{ width: "100%", minHeight: "100vh", position: "relative", ...richBackground, display: "flex", flexDirection: "column" }}>
            <BackgroundAccents />
            <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
            {/* Top Bar Navigation */}
            <div style={{ padding: "20px 40px", borderBottom: `1px solid ${colors.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: colors.card }}>
                <h1 style={{ color: colors.text, margin: 0, fontSize: "1.5rem" }}>Exam Grading & Review Dashboard</h1>
                <button
                    onClick={() => navigate("/teacher/dashboard")}
                    style={{ padding: "8px 16px", backgroundColor: colors.neutralBg, color: colors.neutralText, border: `1px solid ${colors.border}`, borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}
                >
                    &larr; Back to Dashboard
                </button>
            </div>

            <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
                {/* Sidebar: Tests & Submissions */}
                <div style={{ width: "320px", borderRight: `1px solid ${colors.border}`, padding: "20px", overflowY: "auto", backgroundColor: colors.card }}>
                    <h3 style={{ color: colors.text, marginBottom: "15px", fontSize: "1.1rem" }}>Published Tests</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "25px" }}>
                        {tests.map((t: any) => (
                            <div
                                key={t.test_id}
                                onClick={() => handleSelectTest(t.test_id)}
                                style={{
                                    padding: "12px",
                                    borderRadius: "8px",
                                    cursor: "pointer",
                                    backgroundColor: selectedTest === t.test_id ? colors.accentSubtle : colors.neutralBg,
                                    border: `1px solid ${selectedTest === t.test_id ? colors.accent : colors.border}`
                                }}
                            >
                                <p style={{ fontWeight: "bold", color: colors.text, margin: "0 0 5px 0" }}>{t.title}</p>
                                <p style={{ fontSize: "0.8rem", color: colors.textSec, margin: 0 }}>Submissions: {t.total_submissions}</p>
                            </div>
                        ))}
                    </div>

                    {selectedTest && (
                        <div>
                            <h3 style={{ color: colors.text, marginBottom: "15px", fontSize: "1.1rem" }}>Student Submissions</h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                {submissions.map((s: any) => (
                                    <div
                                        key={s.submission_id}
                                        onClick={() => handleSelectSubmission(s.submission_id)}
                                        style={{
                                            padding: "10px",
                                            borderRadius: "6px",
                                            cursor: "pointer",
                                            backgroundColor: selectedSubmission === s.submission_id ? colors.successBg : colors.neutralBg,
                                            border: `1px solid ${selectedSubmission === s.submission_id ? colors.successBorder : colors.border}`
                                        }}
                                    >
                                        <p style={{ fontWeight: "600", color: colors.text, margin: "0 0 3px 0", fontSize: "0.95rem" }}>{s.first_name} {s.last_name}</p>
                                        <p style={{ fontSize: "0.8rem", color: colors.textSec, margin: 0 }}>Grade: {s.total_grade ?? 'Pending'}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Main Content Area */}
                <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
                    {submissionDetails ? (
                        <>
                            {/* Question List Column */}
                            <div style={{ width: "280px", borderRight: `1px solid ${colors.border}`, padding: "20px", overflowY: "auto", backgroundColor: colors.card }}>
                                <h3 style={{ color: colors.text, marginBottom: "15px", fontSize: "1.1rem" }}>Questions</h3>
                                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                    {submissionDetails.questions.map((q: any, idx: number) => (
                                        <div
                                            key={q.question_id}
                                            onClick={() => handleSelectQuestion(q)}
                                            style={{
                                                padding: "12px",
                                                borderRadius: "8px",
                                                cursor: "pointer",
                                                backgroundColor: activeQuestionId === q.question_id ? colors.accentSubtle : colors.neutralBg,
                                                border: `1px solid ${activeQuestionId === q.question_id ? colors.accent : colors.border}`
                                            }}
                                        >
                                            <p style={{ fontWeight: "600", color: colors.text, margin: "0 0 5px 0", fontSize: "0.9rem" }}>Q{idx + 1}: {q.title}</p>
                                            <p style={{ fontSize: "0.75rem", color: colors.textSec, margin: 0 }}>Type: {q.question_type} | Max: {q.max_points}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Active Question Review & Grading Pane */}
                            <div style={{ flex: 1, padding: "30px", overflowY: "auto", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                                {activeQuestion && (
                                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                                        <div>
                                            <h2 style={{ color: colors.text, margin: "0 0 8px 0" }}>{activeQuestion.title}</h2>
                                            <p style={{ fontSize: "0.85rem", color: colors.textSec, textTransform: "uppercase", margin: "0 0 10px 0" }}>Type: {activeQuestion.question_type} &bull; Max Points: {activeQuestion.max_points}</p>
                                            <div style={{ backgroundColor: colors.card, padding: "15px", borderRadius: "8px", border: `1px solid ${colors.border}`, color: colors.text, fontSize: "0.95rem" }}>
                                                {activeQuestion.question_body}
                                            </div>
                                        </div>

                                        <div style={{ backgroundColor: colors.card, padding: "20px", borderRadius: "8px", border: `1px solid ${colors.border}` }}>
                                            <h4 style={{ color: colors.text, margin: "0 0 10px 0", fontSize: "0.95rem" }}>Student Answer:</h4>
                                            {activeQuestion.question_type === 'programming' ? (
                                                <pre style={{ backgroundColor: colors.codeBg || "#1e1e1e", color: colors.codeText || "#4ec9b0", padding: "15px", borderRadius: "6px", fontFamily: "monospace", fontSize: "0.9rem", overflowX: "auto", margin: 0, border: `1px solid ${colors.codeBorder || colors.border}` }}>
                                                    {activeQuestion.code_answer || 'No code provided'}
                                                </pre>
                                            ) : (
                                                <p style={{ color: colors.text, margin: 0, fontSize: "0.95rem" }}>{activeQuestion.code_answer || activeQuestion.selected_option_id || String(activeQuestion.boolean_answer) || 'No answer'}</p>
                                            )}
                                        </div>

                                        {activeQuestion.reference_solution && (
                                            <div style={{ backgroundColor: colors.card, padding: "20px", borderRadius: "8px", border: `1px solid ${colors.border}` }}>
                                                <h4 style={{ color: colors.accentText, margin: "0 0 10px 0", fontSize: "0.95rem" }}>Reference Solution (for comparison):</h4>
                                                <pre style={{ backgroundColor: colors.codeBg || "#1e1e1e", color: colors.codeText || "#dcdcaa", padding: "15px", borderRadius: "6px", fontFamily: "monospace", fontSize: "0.9rem", overflowX: "auto", margin: 0, border: `1px solid ${colors.codeBorder || colors.border}` }}>
                                                    {activeQuestion.reference_solution}
                                                </pre>
                                            </div>
                                        )}

                                        <div style={{ display: "flex", flexDirection: "column", gap: "15px", backgroundColor: colors.card, padding: "20px", borderRadius: "8px", border: `1px solid ${colors.border}` }}>
                                            <div>
                                                <label style={{ display: "block", color: colors.text, fontWeight: "600", marginBottom: "8px", fontSize: "0.9rem" }}>Score Override / Grade</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={scoreOverride}
                                                    onChange={e => setScoreOverride(e.target.value)}
                                                    style={{ width: "100%", padding: "10px", borderRadius: "6px", border: `1px solid ${colors.border}`, backgroundColor: colors.neutralBg, color: colors.text, fontSize: "0.95rem" }}
                                                />
                                            </div>

                                            <div>
                                                <label style={{ display: "block", color: colors.text, fontWeight: "600", marginBottom: "8px", fontSize: "0.9rem" }}>Teacher Commentary / Feedback</label>
                                                <textarea
                                                    rows={4}
                                                    value={commentary}
                                                    onChange={e => setCommentary(e.target.value)}
                                                    placeholder="Provide commentary, highlight mistakes, or explain reference solution..."
                                                    style={{ width: "100%", padding: "10px", borderRadius: "6px", border: `1px solid ${colors.border}`, backgroundColor: colors.neutralBg, color: colors.text, fontSize: "0.95rem", resize: "vertical" }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px", borderTop: `1px solid ${colors.border}`, paddingTop: "20px" }}>
                                    <button
                                        onClick={handleSaveReview}
                                        style={{ padding: "12px 24px", backgroundColor: colors.successBg, color: colors.successText, border: `1px solid ${colors.successBorder}`, borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "0.95rem" }}
                                    >
                                        Save Review & Grade
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: colors.textSec, fontSize: "1.1rem" }}>
                            Select a test and student submission from the sidebar to begin reviewing.
                        </div>
                    )}
                </div>
            </div>
            </div>
        </div>
    );
}
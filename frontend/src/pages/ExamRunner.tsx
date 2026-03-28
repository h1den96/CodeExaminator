import { useState, useEffect, useRef, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useTheme } from "../context/ThemeContext";
import { saveAnswerToDB } from "../api/examApi";

// 👇 Import your custom layout
import ProgrammingLayout from "../components/test-runner/ProgrammingLayout";

// --- TYPES ---
interface Question {
  question_id: number;
  title: string;
  body: string;
  question_type: "mcq" | "true_false" | "programming";
  options?: { option_id: number; option_text: string }[];
  starter_code?: string;
  boiler_plate_code?: string;
  points: number;
  allow_multiple: boolean;
}

interface TestData {
  test_id: number;
  title: string;
  duration_minutes: number;
  started_at: string;
  available_until: string | null;
  strict_deadline: boolean;
  questions: Question[];
}

// --- FLOATING TIMER ---
function FloatingTimer({
  durationMins,
  startedAt,
  availableUntil,
  strictDeadline,
  onTimeUp,
}: {
  durationMins: number;
  startedAt: string;
  availableUntil: string | null;
  strictDeadline: boolean;
  onTimeUp: () => void;
}) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!startedAt || !durationMins) return;

    const personalEndTime =
      new Date(startedAt).getTime() + durationMins * 60 * 1000;
    const globalEndTime = availableUntil
      ? new Date(availableUntil).getTime()
      : Infinity;
    const effectiveEndTime = strictDeadline
      ? Math.min(personalEndTime, globalEndTime)
      : personalEndTime;

    const calculateTime = () => {
      const diff = effectiveEndTime - new Date().getTime();
      if (diff <= 0) {
        setTimeLeft(0);
        onTimeUp();
      } else {
        setTimeLeft(diff);
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [startedAt, durationMins, availableUntil, strictDeadline, onTimeUp]);

  const formatTime = (ms: number | null) => {
    if (ms === null || isNaN(ms)) return "--:--:--";
    const hours = Math.floor(ms / 1000 / 60 / 60);
    const minutes = Math.floor((ms / 1000 / 60) % 60);
    const seconds = Math.floor((ms / 1000) % 60);
    return `${hours > 0 ? hours + ":" : ""}${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const isUrgent = (timeLeft || 0) < 300000;

  return (
    <div
      style={{
        position: "fixed",
        top: "15px",
        right: "20px",
        zIndex: 10000,
        padding: "8px 14px",
        borderRadius: "20px",
        background: isUrgent
          ? "rgba(254, 242, 242, 0.95)"
          : "rgba(255, 255, 255, 0.9)",
        color: isUrgent ? "#dc2626" : "#334155",
        fontSize: "0.9rem",
        fontWeight: "600",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
        border: isUrgent ? "1px solid #fca5a5" : "1px solid rgba(0,0,0,0.05)",
        display: "flex",
        alignItems: "center",
        gap: "8px",
      }}
    >
      <span>{isUrgent ? "🔥" : "⏳"}</span>
      <span>{formatTime(timeLeft)}</span>
    </div>
  );
}

// --- MAIN EXAM RUNNER ---
export default function ExamRunner() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { colors } = useTheme();

  // --- 1. ALL HOOKS MUST GO HERE AT THE TOP ---
  const [testData, setTestData] = useState<TestData | null>(null);
  const [submissionId, setSubmissionId] = useState<number | null>(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error">(
    "saved",
  );
  const [loading, setLoading] = useState(true);

  const [isRunning, setIsRunning] = useState(false);
  const [runResult, setRunResult] = useState<any>(null);
  const [runError, setRunError] = useState<string | null>(null);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 🛡️ Safe check for the current question
  const question = testData?.questions?.[currentQIndex];

  // 🚀 MOVED: useMemo is now safely at the top
  const { topPart, bottomPart } = useMemo(() => {
    if (
      !question ||
      question.question_type !== "programming" ||
      !question.boiler_plate_code
    ) {
      return { topPart: "", bottomPart: "" };
    }
    const parts = question.boiler_plate_code.split("// {{STUDENT_CODE}}");
    return {
      topPart: parts[0] || "",
      bottomPart: parts[1] || "",
    };
  }, [question]);

  // --- 2. EFFECTS ---

  // Prevents accidental tab closing
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "Exam in progress!";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // Main Test Initialization
  useEffect(() => {
    if (!state?.test_id) {
      navigate("/tests");
      return;
    }

    const startExam = async () => {
      try {
        const res = await api.post("/tests/start", { test_id: state.test_id });
        const fetchedTest = res.data.test;

        // Ensure no duplicate questions
        const uniqueQuestions = fetchedTest.questions.filter(
          (q: any, index: number, self: any[]) =>
            index === self.findIndex((t) => t.question_id === q.question_id),
        );

        setTestData({ ...fetchedTest, questions: uniqueQuestions });
        setSubmissionId(res.data.submission_id);

        // Pre-load saved answers if resuming
        const initialAnswers: Record<number, any> = {};
        uniqueQuestions.forEach((q: any) => {
          if (q.student_mcq && q.student_mcq.length > 0) {
            initialAnswers[q.question_id] = q.allow_multiple
              ? q.student_mcq
              : q.student_mcq[0];
          } else if (q.student_tf !== null && q.student_tf !== undefined) {
            initialAnswers[q.question_id] = q.student_tf;
          } else if (q.student_code) {
            initialAnswers[q.question_id] = q.student_code;
          }
        });
        setAnswers(initialAnswers);
      } catch (err: any) {
        // 1. Check if the error is a 409 Conflict (Already Submitted)
        if (err.response?.status === 409) {
          // 2. Grab the ID from the backend's error response
          // Ensure this matches the key 'submission_id' we just added to the controller
          const sid = err.response.data.submission_id;

          if (sid) {
            console.log("Redirecting to valid submission:", sid);
            navigate(`/results/${sid}`);
          } else {
            // Fallback: If no ID was found, just go to the general tests list
            console.warn("409 Conflict: No submission_id provided by backend.");
            navigate("/tests");
          }
        } else {
          // 3. For any other error (500, 404, etc.), go back to the list
          console.error("Critical error during startExam:", err);
          navigate("/tests");
        }
      } finally {
        setLoading(false);
      }
    };

    startExam();
  }, [state, navigate]);

  // --- 3. FUNCTIONS ---
  const saveAnswer = async (qId: number, payload: any) => {
    if (!submissionId) return;
    setSaveStatus("saving");
    try {
      await saveAnswerToDB(submissionId, qId, payload);
      setSaveStatus("saved");
    } catch (err) {
      setSaveStatus("error");
    }
  };

  const handleAnswerChange = (qId: number, value: any, type: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: value }));

    let payload: any = {};
    if (type === "programming") payload.code_answer = value;
    if (type === "true_false") payload.tf_answer = value;
    if (type === "mcq")
      payload.mcq_option_ids = Array.isArray(value) ? value : [value];

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      saveAnswer(qId, payload);
    }, 500);
  };

  const handleRunCode = async (qId: number, code: string) => {
    setIsRunning(true);
    setRunResult(null);
    setRunError(null);
    try {
      const res = await api.post(`/submissions/${submissionId}/run`, {
        question_id: qId,
        code,
        language: "cpp",
      });
      setRunResult(res.data);
    } catch (err: any) {
      setRunError("Compilation failed.");
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (!window.confirm("Finish Exam?")) return;
    try {
      await api.post(`/submissions/${submissionId}/submit`);
      navigate(`/results/${submissionId}`);
    } catch (e) {
      alert("Submission failed");
    }
  };

  // --- 4. EARLY RETURNS (SAFE TO DO NOW) ---
  if (loading)
    return (
      <div style={{ padding: 40, color: colors.text }}>Loading Exam...</div>
    );
  if (!testData || !testData.questions.length || !question)
    return <div style={{ padding: 40 }}>Test data empty.</div>;

  const progQuestion = {
    ...question,
    question_text: question.body,
    options: question.options?.map((o) => ({
      id: o.option_id,
      text: o.option_text,
    })),
  };

  return (
    <>
      <FloatingTimer
        durationMins={testData.duration_minutes}
        startedAt={testData.started_at}
        availableUntil={testData.available_until}
        strictDeadline={testData.strict_deadline}
        onTimeUp={() => {
          alert("Time's up!");
          navigate("/tests");
        }}
      />

      {question.question_type === "programming" ? (
        <ProgrammingLayout
          testData={testData}
          question={progQuestion}
          currentIdx={currentQIndex}
          totalQ={testData.questions.length}
          answer={answers[question.question_id]}
          saveStatus={saveStatus}
          submitting={false}
          onAnswer={handleAnswerChange}
          onNavigate={setCurrentQIndex}
          onSubmit={handleSubmit}
          onRunCode={handleRunCode}
          isRunning={isRunning}
          runResult={runResult}
          runError={runError}
          topPart={topPart}
          bottomPart={bottomPart}
        />
      ) : (
        <div
          style={{
            minHeight: "100vh",
            background: colors.bg,
            color: colors.text,
            padding: "80px 20px 20px 20px",
          }}
        >
          <div style={{ maxWidth: "800px", margin: "0 auto" }}>
            <div
              style={{
                padding: "20px",
                background: colors.card,
                borderRadius: "12px",
                border: `1px solid ${colors.border}`,
                marginBottom: "20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h2 style={{ margin: 0 }}>{testData.title}</h2>
                <div style={{ color: colors.textSec }}>
                  Question {currentQIndex + 1} of {testData.questions.length}
                </div>
              </div>
              <span
                style={{
                  fontSize: "0.85rem",
                  color: saveStatus === "error" ? "red" : colors.textSec,
                }}
              >
                {saveStatus === "saving" ? "☁️ Saving..." : "✅ Saved"}
              </span>
            </div>

            <div
              style={{
                padding: "30px",
                background: colors.card,
                borderRadius: "12px",
                border: `1px solid ${colors.border}`,
                marginBottom: "20px",
              }}
            >
              <h3 style={{ marginTop: 0 }}>{question.title}</h3>
              <div
                dangerouslySetInnerHTML={{ __html: question.body }}
                style={{ lineHeight: "1.6" }}
              />
              <hr style={{ borderColor: colors.border, margin: "20px 0" }} />

              {question.question_type === "mcq" && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  {question.options?.map((opt) => {
                    const isSelected = question.allow_multiple
                      ? (answers[question.question_id] || []).includes(
                          opt.option_id,
                        )
                      : answers[question.question_id] === opt.option_id;
                    return (
                      <label
                        key={opt.option_id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "15px",
                          padding: "15px",
                          border: `1px solid ${colors.border}`,
                          borderRadius: "8px",
                          cursor: "pointer",
                          backgroundColor: isSelected ? "#eff6ff" : colors.bg,
                        }}
                      >
                        <input
                          type={question.allow_multiple ? "checkbox" : "radio"}
                          name={`q-${question.question_id}`}
                          checked={isSelected}
                          onChange={() => {
                            if (question.allow_multiple) {
                              const current =
                                answers[question.question_id] || [];
                              const next = current.includes(opt.option_id)
                                ? current.filter(
                                    (id: number) => id !== opt.option_id,
                                  )
                                : [...current, opt.option_id];
                              handleAnswerChange(
                                question.question_id,
                                next,
                                "mcq",
                              );
                            } else {
                              handleAnswerChange(
                                question.question_id,
                                opt.option_id,
                                "mcq",
                              );
                            }
                          }}
                        />
                        <span>{opt.option_text}</span>
                      </label>
                    );
                  })}
                </div>
              )}

              {question.question_type === "true_false" && (
                <div style={{ display: "flex", gap: "20px" }}>
                  {[true, false].map((val) => (
                    <button
                      key={String(val)}
                      onClick={() =>
                        handleAnswerChange(
                          question.question_id,
                          val,
                          "true_false",
                        )
                      }
                      style={{
                        flex: 1,
                        padding: "20px",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontWeight: "bold",
                        border:
                          answers[question.question_id] === val
                            ? `2px solid #2563eb`
                            : `1px solid ${colors.border}`,
                        backgroundColor:
                          answers[question.question_id] === val
                            ? "#eff6ff"
                            : colors.bg,
                        color:
                          answers[question.question_id] === val
                            ? "#1d4ed8"
                            : colors.text,
                      }}
                    >
                      {val ? "TRUE" : "FALSE"}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button
                onClick={() => setCurrentQIndex((i) => i - 1)}
                disabled={currentQIndex === 0}
                style={{
                  padding: "12px 24px",
                  borderRadius: "8px",
                  border: `1px solid ${colors.border}`,
                  background: colors.card,
                  cursor: "pointer",
                  opacity: currentQIndex === 0 ? 0.5 : 1,
                }}
              >
                ← Previous
              </button>
              {currentQIndex < testData.questions.length - 1 ? (
                <button
                  onClick={() => setCurrentQIndex((i) => i + 1)}
                  style={{
                    padding: "12px 24px",
                    borderRadius: "8px",
                    border: "none",
                    background: "#2563eb",
                    color: "white",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  Next →
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  style={{
                    padding: "12px 30px",
                    borderRadius: "8px",
                    border: "none",
                    background: "#16a34a",
                    color: "white",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  Submit Exam
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

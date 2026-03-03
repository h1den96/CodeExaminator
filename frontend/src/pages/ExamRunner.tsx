import { useState, useEffect, useRef } from "react";
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
  question_type: 'mcq' | 'true_false' | 'programming';
  options?: { option_id: number; option_text: string }[];
  starter_code?: string;
  points: number; // Ensure backend sends points
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

// --- FLOATING TIMER (Works on top of everything) ---
function FloatingTimer({ durationMins, startedAt, availableUntil, strictDeadline, onTimeUp }: 
    { durationMins: number, startedAt: string, availableUntil: string | null, strictDeadline: boolean, onTimeUp: () => void }) {
  
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    // 🔍 DEBUG: Check if data is arriving. Warn but don't crash.
    if (!startedAt || !durationMins) {
        // console.warn("Timer missing data:", { startedAt, durationMins });
        return;
    }

    const personalEndTime = new Date(startedAt).getTime() + (durationMins * 60 * 1000);
    const globalEndTime = availableUntil ? new Date(availableUntil).getTime() : Infinity;
    const effectiveEndTime = strictDeadline ? Math.min(personalEndTime, globalEndTime) : personalEndTime;

    // Immediate calculation to avoid 1-second delay
    const calculateTime = () => {
        const diff = effectiveEndTime - new Date().getTime();
        if (diff <= 0) {
            setTimeLeft(0);
            // Only trigger time up if we were previously counting down
            if (timeLeft !== 0 && timeLeft !== null) onTimeUp();
        } else {
            setTimeLeft(diff);
        }
    };

    calculateTime(); // Run once immediately
    const interval = setInterval(calculateTime, 1000);

    return () => clearInterval(interval);
  }, [startedAt, durationMins, availableUntil, strictDeadline]);

  // Format Helper
  const formatTime = (ms: number | null) => {
      if (ms === null || isNaN(ms)) return "--:--:--"; // Show placeholder instead of nothing
      if (ms <= 0) return "00:00:00";
      
      const hours = Math.floor((ms / 1000 / 60 / 60));
      const minutes = Math.floor((ms / 1000 / 60) % 60);
      const seconds = Math.floor((ms / 1000) % 60);
      return `${hours > 0 ? hours + ':' : ''}${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Only turn red in the last 5 minutes (300,000 ms)
  const isUrgent = (timeLeft || 0) < 300000;

  return (
    <div style={{ 
      position: "fixed", 
      top: "15px", 
      right: "20px", 
      zIndex: 10000,
      padding: "8px 14px", 
      borderRadius: "20px", 
      background: isUrgent && timeLeft !== null ? "rgba(254, 242, 242, 0.95)" : "rgba(255, 255, 255, 0.9)", 
      backdropFilter: "blur(5px)", 
      color: isUrgent && timeLeft !== null ? "#dc2626" : "#334155",
      fontSize: "0.9rem",
      fontFamily: "Monaco, Consolas, monospace", 
      fontWeight: "600",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)", 
      border: isUrgent && timeLeft !== null ? "1px solid #fca5a5" : "1px solid rgba(0,0,0,0.05)",
      display: "flex", 
      alignItems: "center", 
      gap: "8px"
    }}>
      <span style={{ fontSize: "1rem" }}>{isUrgent ? "🔥" : "⏳"}</span>
      <span>{formatTime(timeLeft)}</span>
    </div>
  );
}

// --- MAIN EXAM RUNNER ---
export default function ExamRunner() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { colors } = useTheme();

  const [testData, setTestData] = useState<TestData | null>(null);
  const [submissionId, setSubmissionId] = useState<number | null>(null);
  
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [loading, setLoading] = useState(true);

  // Execution State (For Programming Questions)
  const [isRunning, setIsRunning] = useState(false);
  const [runResult, setRunResult] = useState<{ grade: number; details?: any } | null>(null);
  const [runError, setRunError] = useState<string | null>(null);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 1. Setup & Protection
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = "Exam in progress!"; };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  useEffect(() => {
    if (!state?.test_id) { alert("No test selected."); navigate("/tests"); return; }
    
    const startExam = async () => {
      try {
        const res = await api.post("/tests/start", { test_id: state.test_id });
        
        // 1. The backend returns 'test' (which contains the questions)
        const fetchedTest = res.data.test; 
        
        setTestData(fetchedTest);
        setSubmissionId(res.data.submission_id);

        const initialAnswers: Record<number, any> = {};

        // 2. HYDRATION LOGIC: Loop through questions and check for saved answers
        fetchedTest.questions.forEach((q: any) => {
            // Check for saved MCQ (backend sends student_mcq array)
            if (q.student_mcq && q.student_mcq.length > 0) {
                // If it's a single-choice MCQ, we take the first ID
                initialAnswers[q.question_id] = q.student_mcq[0]; 
            } 
            // Check for saved True/False
            else if (q.student_tf !== null && q.student_tf !== undefined) {
                initialAnswers[q.question_id] = q.student_tf;
            } 
            // Check for saved Code
            else if (q.student_code) {
                initialAnswers[q.question_id] = q.student_code;
            }
        });

        setAnswers(initialAnswers); // 🚀 This populates the UI on reload
      } catch (err: any) {
        alert(err.response?.data?.message || "Failed to start exam.");
        navigate("/tests");
      } finally {
        setLoading(false);
      }
    };
    startExam();
  }, [state, navigate]);

  // 2. Logic: Save Answer
 const saveAnswer = async (qId: number, payload: any) => {
    if (!submissionId) return;
    
    setSaveStatus('saving'); // Update UI to show saving
    
    try {
        // Call the external file! 🚀
        await saveAnswerToDB(submissionId, qId, payload);
        
        setSaveStatus('saved'); // Update UI to show success
    } catch (err) {
        console.error("Failed to save answer:", err);
        setSaveStatus('error'); // Update UI to show error
    }
  };

const handleAnswerChange = (qId: number, value: any, type: string) => {
  setAnswers(prev => ({ ...prev, [qId]: value }));

  let payload: any = {};
  if (type === 'programming') payload.code_answer = value;
  if (type === 'true_false') payload.tf_answer = value;
  if (type === 'mcq') payload.mcq_option_ids = [value];

  if (timeoutRef.current) clearTimeout(timeoutRef.current);
  
  setSaveStatus('saving');

  timeoutRef.current = setTimeout(() => {
    saveAnswer(qId, payload);
  }, 500); 
};

  // 3. Logic: Run Code (Compile)
  const handleRunCode = async (qId: number, code: string) => {
    setIsRunning(true);
    setRunResult(null);
    setRunError(null);
    try {
        const res = await api.post(`/submissions/${submissionId}/run`, { question_id: qId, code, language: "cpp" });
        setRunResult(res.data);
    } catch (err: any) {
        setRunError(err.response?.data?.message || "Compilation failed. Check server logs.");
    } finally {
        setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
     if(!window.confirm("Finish Exam? This cannot be undone.")) return;
     try {
       // await api.post(`/submissions/${submissionId}/submit`);
       alert("Exam Submitted!");
       navigate("/tests");
     } catch(e) {
       alert("Submission failed");
     }
  };

  if (loading) return <div style={{ padding: 40, color: colors.text }}>Loading Exam...</div>;
  if (!testData) return <div style={{ padding: 40, color: colors.text }}>Error loading test data.</div>;

  // 🛡️ SAFETY CHECK: If the test has 0 questions (Empty Test)
  if (!testData.questions || testData.questions.length === 0) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: colors.text }}>
        <h2>⚠️ This exam has no questions.</h2>
        <p>Please contact your instructor.</p>
        <button onClick={() => navigate("/tests")} style={{ marginTop: 20, padding: "10px 20px", cursor: "pointer" }}>
          Go Back
        </button>
      </div>
    );
  }

  const question = testData.questions[currentQIndex];

  // 🛡️ SAFETY CHECK: Index out of bounds
  if (!question) return <div style={{ padding: 40 }}>Error: Question index out of bounds.</div>;

  // 👇 PASTE THIS LOG RIGHT HERE 👇
  console.log("DEBUG QUESTION DATA:", {
      id: question.question_id,
      options: question.options
  });

  // 🔄 MAPPER: Convert DB question format to Component format
  // Your DB returns 'body', but ProgrammingLayout might expect 'question_text'
  const progQuestion = {
    question_id: question.question_id,
    question_text: question.body, 
    question_type: question.question_type,
    points: question.points,
    starter_code: question.starter_code,
    allowed_multiple: false,
    options: question.options?.map(o => ({ id: o.option_id, text: o.option_text }))
  } as any;

  return (
    <>
      {/* 🟢 GLOBAL FLOATING TIMER (Visible on all layouts) */}
      <FloatingTimer 
         durationMins={testData.duration_minutes}
         startedAt={testData.started_at}
         availableUntil={testData.available_until}
         strictDeadline={testData.strict_deadline}
         onTimeUp={() => { alert("Time's up!"); navigate("/tests"); }}
      />

      {/* 🔀 LAYOUT SWITCHER */}
      {question.question_type === 'programming' ? (
        
        // --- 💻 CUSTOM PROGRAMMING LAYOUT ---
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
        />

      ) : (

        // --- 📝 STANDARD LAYOUT (MCQ / TrueFalse) ---
        <div style={{ minHeight: "100vh", background: colors.bg, color: colors.text, padding: "80px 20px 20px 20px" }}>
            <div style={{ maxWidth: "800px", margin: "0 auto" }}>
                
                {/* Header Card */}
                <div style={{ 
                    padding: "20px", background: colors.card, borderRadius: "12px", 
                    border: `1px solid ${colors.border}`, marginBottom: "20px",
                    display: "flex", justifyContent: "space-between", alignItems: "center"
                }}>
                    <div>
                        <h2 style={{ margin: 0 }}>{testData.title}</h2>
                        <div style={{ color: colors.textSec }}>Question {currentQIndex + 1} of {testData.questions.length}</div>
                    </div>
                    <span style={{ fontSize: "0.85rem", color: saveStatus === 'error' ? 'red' : colors.textSec }}>
                        {saveStatus === 'saving' ? '☁️ Saving...' : '✅ Saved'}
                    </span>
                </div>

                {/* Question Body */}
                <div style={{ padding: "30px", background: colors.card, borderRadius: "12px", border: `1px solid ${colors.border}`, marginBottom: "20px" }}>
                    <h3 style={{ marginTop: 0 }}>{question.title}</h3>
                    <div dangerouslySetInnerHTML={{ __html: question.body }} style={{ lineHeight: "1.6" }} />
                    <hr style={{ borderColor: colors.border, margin: "20px 0" }} />

                    {/* MCQ Options */}
                    {question.question_type === 'mcq' && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            {question.options?.map(opt => (
                                <label key={opt.option_id} style={{ 
                                    display: "flex", alignItems: "center", gap: "15px", padding: "15px", 
                                    border: `1px solid ${colors.border}`, borderRadius: "8px", cursor: "pointer",
                                    backgroundColor: answers[question.question_id] === opt.option_id ? "#eff6ff" : colors.bg
                                }}>
                                    <input
                                        type="radio"
                                        name={`q-${question.question_id}`}
                                        checked={answers[question.question_id] === opt.option_id}
                                        onChange={() => handleAnswerChange(question.question_id, opt.option_id, 'mcq')}
                                        style={{ width: "18px", height: "18px" }}
                                    />
                                    <span>{opt.option_text}</span>
                                </label>
                            ))}
                        </div>
                    )}

                    {/* True/False Options */}
                    {question.question_type === 'true_false' && (
                        <div style={{ display: "flex", gap: "20px" }}>
                            {[true, false].map((val) => (
                                <button key={String(val)}
                                    onClick={() => handleAnswerChange(question.question_id, val, 'true_false')}
                                    style={{
                                        flex: 1, padding: "20px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold",
                                        border: answers[question.question_id] === val ? `2px solid #2563eb` : `1px solid ${colors.border}`,
                                        backgroundColor: answers[question.question_id] === val ? "#eff6ff" : colors.bg,
                                        color: answers[question.question_id] === val ? "#1d4ed8" : colors.text
                                    }}
                                >
                                    {val ? "TRUE" : "FALSE"}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <button 
                        onClick={() => setCurrentQIndex(i => i - 1)} disabled={currentQIndex === 0}
                        style={{ padding: "12px 24px", borderRadius: "8px", border: `1px solid ${colors.border}`, background: colors.card, cursor: "pointer", opacity: currentQIndex===0?0.5:1 }}
                    >
                        ← Previous
                    </button>
                    {currentQIndex < testData.questions.length - 1 ? (
                        <button onClick={() => setCurrentQIndex(i => i + 1)} style={{ padding: "12px 24px", borderRadius: "8px", border: "none", background: "#2563eb", color: "white", cursor: "pointer", fontWeight: "bold" }}>
                            Next →
                        </button>
                    ) : (
                        <button onClick={handleSubmit} style={{ padding: "12px 30px", borderRadius: "8px", border: "none", background: "#16a34a", color: "white", cursor: "pointer", fontWeight: "bold" }}>
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
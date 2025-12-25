import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import api from "../api/axios";

// ==========================================
// 1. EXPORTED TYPES 
// ==========================================

export type SaveStatus = "saved" | "saving" | "error";

export interface Question {
  question_id: number;
  question_text: string; // We will map 'body' to this
  question_type: string;
  points: number;
  starter_code?: string;
  options?: { id: number; text: string }[];
}

export interface TestDetails {
  id: number;
  title: string;
  description?: string;
  questions: Question[];
}

export interface TestData {
  test: TestDetails;
  submissionId: number;
}

// ==========================================
// 2. THE HOOK
// ==========================================
export function useTestSession() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const testId = params.get("test_id");
  const { token, logout } = useAuth();

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [data, setData] = useState<TestData | null>(null);
  const [submissionId, setSubmissionId] = useState<number | null>(null);
  
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [submitting, setSubmitting] = useState(false);

  // Execution State
  const [isRunning, setIsRunning] = useState(false);
  const [runResult, setRunResult] = useState<{ grade: number; details?: string } | null>(null);
  const [runError, setRunError] = useState<string | null>(null);

  // Load Exam Data
  useEffect(() => {
    if (!testId) return;
    if (!token) {
        navigate("/login");
        return;
    }

    setLoading(true);
    
    api.get(`/test/start?test_id=${testId}`, {
      headers: { Authorization: `Bearer ${token}` } 
    })
      .then((res) => {
        const root = res.data; // Based on your JSON, data is at the root
        
        // Safety Check: specific to your JSON structure
        if (!root.test || !Array.isArray(root.test.questions)) {
             console.error("Invalid Structure:", root);
             setError("Invalid test data structure received.");
             setLoading(false);
             return;
        }

        // --- DATA MAPPING (Backend JSON -> Frontend Interface) ---
        const mappedQuestions: Question[] = root.test.questions.map((q: any) => ({
            question_id: q.question_id,
            // MAP 'body' (from JSON) to 'question_text' (for UI)
            question_text: q.body, 
            question_type: q.question_type,
            // Parse "1.00" string to number
            points: parseFloat(q.points) || 0,
            starter_code: q.starter_code || "",
            // Map options if they exist (for MCQs)
            options: q.options ? q.options.map((o: any) => ({
                id: o.option_id,
                text: o.option_text
            })) : []
        }));

        const mappedData: TestData = {
            test: {
                id: root.test.test_id,
                title: root.test.title,
                description: root.test.description,
                questions: mappedQuestions
            },
            submissionId: root.submission_id
        };

        setSubmissionId(root.submission_id);
        setData(mappedData);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Load Test Error:", err);
        // Handle Token Expiration
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
            alert("Session expired. Please log in again.");
            if (logout) logout();
            navigate("/login");
            return;
        }
        setError(err.response?.data?.error || "Failed to load test");
        setLoading(false);
      });
  }, [testId, token, navigate, logout]);

  // Autosave Logic
  const timeoutRef = useRef<any>(null);

  const handleAnswer = useCallback((questionId: number, value: any, type: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    setSaveStatus("saving");

    let payload: any = { question_id: questionId };
    
    // Format payload based on question type
    if (type === "programming") {
        payload.code_answer = value;
    } else if (type === "mcq") {
        // Ensure array format for MCQs
        payload.mcq_option_ids = Array.isArray(value) ? value : [value]; 
    } else if (type === "true_false") {
        payload.tf_answer = value;
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
        if (!submissionId || !token) return;

        api.patch(`/submissions/${submissionId}/answers`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then(() => setSaveStatus("saved"))
        .catch((err) => {
          console.error("Autosave failed", err);
          if (err.response && err.response.status === 401) {
             setSaveStatus("error"); 
             alert("Session expired. Answer not saved.");
          } else {
             setSaveStatus("error");
          }
        });

    }, 1000); // 1 second debounce
  }, [submissionId, token]);

  // In src/hooks/useTestSession.ts

  const runCode = async (questionId: number, code: string) => {
    // FIX 1: Check for submissionId. If missing, we can't run code.
    if (!token || !submissionId) {
        console.error("Missing token or submissionId", { token: !!token, submissionId });
        return;
    }

    setIsRunning(true);
    setRunError(null);
    setRunResult(null);

    try {
      console.log("🚀 Sending Code:", { submission_id: submissionId, question_id: questionId });

      const res = await api.post("/submissions/submit-code", {
        // FIX 2: DO NOT send 'submissionQuestionId' here!
        // Send these two instead so the backend calculates the correct ID.
        submission_id: submissionId,
        question_id: questionId,
        code: code,
        language_id: 54
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        setRunResult({
          grade: res.data.grade,
          details: res.data.details
        });
      } else {
        setRunError("Execution failed without error details.");
      }
    } catch (err: any) {
      console.error("Run Code Error:", err.response?.data);
      setRunError(err.response?.data?.error || "Failed to run code");
    } finally {
      setIsRunning(false);
    }
  };

  const submitTest = async () => {
    if (!confirm("Finish exam?")) return;
    if (!token || !submissionId) return;

    setSubmitting(true);
    try {
        await api.post(`/submissions/${submissionId}/submit`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        alert("Exam Submitted!");
        navigate("/dashboard");
    } catch(err: any) {
        if (err.response && err.response.status === 401) {
             alert("Session expired. Could not submit.");
        } else {
             alert("Error submitting exam");
        }
    } finally {
        setSubmitting(false);
    }
  };

  return {
    loading, error, data, currentIdx, answers, saveStatus, submitting,
    handleAnswer, submitTest, setCurrentIdx,
    runCode, isRunning, runResult, runError
  };
}
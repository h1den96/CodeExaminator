// src/hooks/useTestSession.ts
import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import api from "../api/axios"; 
import { startTest } from "../api/testClient"; // <--- IMPORT THE CLIENT

// ==========================================
// 1. EXPORTED TYPES 
// ==========================================

export type SaveStatus = "saved" | "saving" | "error";

export interface Question {
  question_id: number;
  question_text: string; 
  question_type: string;
  points: number;
  starter_code?: string;
  allowed_multiple?: boolean;
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
  const [runResult, setRunResult] = useState<{ grade: number; details?: any } | null>(null);
  const [runError, setRunError] = useState<string | null>(null);

  // Load Exam Data
  useEffect(() => {
    if (!testId) return;
    if (!token) {
        navigate("/login");
        return;
    }

    setLoading(true);
    
    // CHANGED: Use startTest (POST) instead of api.get (GET)
    startTest(token, Number(testId))
      .then((root) => {
        // Note: 'root' is the JSON data directly, not an axios response object
        
        // Safety Check
        if (!root.test || !Array.isArray(root.test.questions)) {
             console.error("Invalid Structure:", root);
             setError("Invalid test data structure received.");
             setLoading(false);
             return;
        }

        // --- DATA MAPPING ---
        const mappedQuestions: Question[] = root.test.questions.map((q: any) => ({
            question_id: q.question_id,
            question_text: q.body, 
            question_type: q.question_type,
            points: Number(q.points) || 0,
            starter_code: q.starter_code || "",
            allow_multiple: q.allow_multiple || false,
            options: q.options ? q.options.map((o: any) => ({
                id: o.option_id,
                text: o.option_text
            })) : []
        }));

        const mappedData: TestData = {
            test: {
                id: root.test.test_id,
                title: root.test.title,
                description: root.test.description || "",
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
        setError(err.message || "Failed to load test");
        setLoading(false);
      });
  }, [testId, token, navigate, logout]);

  // Autosave Logic
  const timeoutRef = useRef<any>(null);

  const handleAnswer = useCallback((questionId: number, value: any, type: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    setSaveStatus("saving");

    let payload: any = { question_id: questionId };
    
    if (type === "programming") {
        payload.code_answer = value;
    } else if (type === "mcq") {
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
          } else {
             setSaveStatus("error");
          }
        });

    }, 1000); 
  }, [submissionId, token]);

  const runCode = async (questionId: number, code: string) => {
    if (!token || !submissionId) {
        console.error("Missing token or submissionId");
        return;
    }

    setIsRunning(true);
    setRunError(null);
    setRunResult(null);

    try {
      // Note: We use the existing 'api' axios instance for this call
      const res = await api.post("/submissions/submit-code", {
        submission_id: submissionId,
        question_id: questionId,
        code: code,
        language_id: 54 // C++ (GCC 9.2.0)
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
    if (!confirm("Are you sure you want to finish the exam?")) return;
    if (!token || !submissionId) return;

    setSubmitting(true);
    try {
        await api.post(`/submissions/${submissionId}/submit`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        alert("Exam Submitted Successfully!");
        navigate("/tests"); // Go back to dashboard
    } catch(err: any) {
        console.error("Submit Error", err);
        alert("Error submitting exam");
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
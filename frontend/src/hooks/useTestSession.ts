// src/hooks/useTestSession.ts
import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import api from "../api/axios";
import { startTest } from "../api/testClient"; 

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
  boilerplate_code?: string;
  allow_multiple?: boolean;
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

  // Basic UI State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TestData | null>(null);
  const [submissionId, setSubmissionId] = useState<number | null>(null);

  // Interaction State
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [submitting, setSubmitting] = useState(false);

  // Execution State (Code Grader)
  const [isRunning, setIsRunning] = useState(false);
  const [runResult, setRunResult] = useState<{
    grade: number;
    details?: any;
  } | null>(null);
  const [runError, setRunError] = useState<string | null>(null);

  // Load Exam Data
  useEffect(() => {
    if (!testId) return;
    if (!token) {
      navigate("/login");
      return;
    }

    setLoading(true);

    startTest(token, Number(testId))
      .then((root) => {
        // Safety Check for Data Integrity
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
          boilerplate_code: q.boilerplate_code || "",
          allow_multiple: q.allow_multiple || false,
          options: q.options
            ? q.options.map((o: any) => ({
                id: o.id || o.option_id,
                text: o.text || o.option_text,
              }))
            : [],
        }));

        const mappedData: TestData = {
          test: {
            id: root.test.test_id,
            title: root.test.title,
            description: root.test.description || "",
            questions: mappedQuestions,
          },
          submissionId: root.submission_id,
        };

        // Update State
        setSubmissionId(root.submission_id);
        setData(mappedData);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Load Test Error:", err);
        setError(err.message || "Failed to load test");
        setLoading(false);
      });
  }, [testId, token, navigate]);

  // Autosave Logic
  const timeoutRef = useRef<any>(null);

  const handleAnswer = useCallback(
    (questionId: number, value: any, type: string) => {
      setAnswers((prev) => ({ ...prev, [questionId]: value }));
      setSaveStatus("saving");

      let payload: any = { question_id: questionId };
      if (type === "programming") payload.code_answer = value;
      else if (type === "mcq") payload.mcq_option_ids = Array.isArray(value) ? value : [value];
      else if (type === "true_false") payload.tf_answer = value;

      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      timeoutRef.current = setTimeout(() => {
        if (!submissionId || !token) return;

        api.patch(`/submissions/${submissionId}/answers`, payload, {
            headers: { Authorization: `Bearer ${token}` },
          })
          .then(() => setSaveStatus("saved"))
          .catch((err) => {
            console.error("Autosave failed", err);
            setSaveStatus("error");
          });
      }, 1000);
    },
    [submissionId, token],
  );

  /**
   * CODE EXECUTION (RUN CODE)
   * Sends the current student code to the backend for grading.
   */
  const runCode = async (questionId: number, code: string) => {
    if (isRunning) return;

    console.log("🚀 [runCode] Requesting grade for Q:", questionId);
    setIsRunning(true);
    setRunError(null);
    setRunResult(null);

    try {
      const res = await api.post(`/submissions/${submissionId}/run`, {
        question_id: questionId,
        code: code,
      });

      console.log("✅ [runCode] API Response:", res.data);

      if (res.data) {
        // Convert to Number to handle strings like "10.00"
        const finalGrade = Number(res.data.question_grade);

        setRunResult({
          grade: isNaN(finalGrade) ? 0 : finalGrade,
          details: res.data.test_results || [],
        });
        
        console.log("🎯 Frontend State Updated with Grade:", finalGrade);
      } else {
        console.warn("⚠️ [runCode] Received empty response from server.");
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message || "Execution failed";
      console.error("❌ [runCode] Error:", errorMsg);
      setRunError(errorMsg);
    } finally {
      setIsRunning(false);
      console.log("🏁 [runCode] Execution finished.");
    }
  };

  const submitTest = async () => {
    if (!confirm("Are you sure you want to finish the exam?")) return;
    if (!token || !submissionId) return;

    setSubmitting(true);
    try {
      await api.post(`/submissions/${submissionId}/submit`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      alert("Exam Submitted Successfully!");
      navigate("/tests"); 
    } catch (err: any) {
      console.error("Submit Error", err);
      alert("Error submitting exam");
    } finally {
      setSubmitting(false);
    }
  };

  return {
    loading,
    error,
    data,
    currentIdx,
    answers,
    saveStatus,
    submitting,
    handleAnswer,
    submitTest,
    setCurrentIdx,
    runCode,
    isRunning,
    runResult,
    runError,
  };
}
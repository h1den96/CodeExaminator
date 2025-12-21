import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../auth/AuthContext"; 
import { startTest } from "../api/testClient"; 

// --- Shared Types ---
export type Question = {
  question_id: number;
  submission_question_id?: number; // <--- ADD THIS (It fixes the lookup logic)
  question_type: string;
  title?: string;
  body?: string;
  starter_code?: string;
  options?: { option_id: number; option_text: string }[];
  points: number;
};
export type TestData = { test_id: number; title: string; description: string; questions: Question[] };
export type StartResponse = { submission_id: number; test: TestData };
export type SaveStatus = 'saved' | 'saving' | 'error';

export function useTestSession() {
  const { token, isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();
  const nav = useNavigate();

  // --- MOVED INSIDE (Where they belong) ---
  const [runResult, setRunResult] = useState<{ status: string; grade: number } | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  // ----------------------------------------

  const [data, setData] = useState<StartResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [runError, setRunError] = useState<string | null>(null); // <--- NEW
  
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 1. INITIAL LOAD
  useEffect(() => {
    if (!isAuthenticated || !token) {
      setError("Not logged in");
      setLoading(false);
      return;
    }
    const id = Number(searchParams.get("test_id"));
    if (!id || id <= 0) {
      setError("Invalid test ID");
      setLoading(false);
      return;
    }

    (async () => {
      try {
        setLoading(true);
        const res = await startTest(token, id);
        setData(res);
        
        const initialAnswers: Record<number, any> = {};
        res.test.questions.forEach((q: Question) => {
          if ((q.question_type.includes("prog") || q.starter_code) && q.starter_code) {
            initialAnswers[q.question_id] = q.starter_code;
          }
        });
        setAnswers(prev => ({ ...initialAnswers, ...prev }));
      } catch (e: any) {
        setError(e.message || "Failed to start test");
      } finally {
        setLoading(false);
      }
    })();
  }, [isAuthenticated, token, searchParams]);

  // 4. RUN CODE (Fixed Logic)
  const runCode = async (questionId: number, code: string) => {
    const targetQuestion = data?.test.questions.find(q => q.question_id === questionId);
    const realSubmissionId = targetQuestion?.submission_question_id || 134;

    setIsRunning(true);
    setRunResult(null);
    setRunError(null);

   try {
        // FIX: Add the 3rd argument containing the Headers
        const res = await axios.post(
          "http://localhost:3000/api/submissions/submit-code", 
          {
            submissionQuestionId: realSubmissionId,
            code: code
          },
          { 
            headers: { Authorization: `Bearer ${token}` } // <--- THIS WAS MISSING
          }
        );

        if (res.data.success) {
          setRunResult({
            status: "Completed",
            grade: Number(res.data.grade)
          });
        }
    } catch (err: any) {
        console.error(err);
        if (err.response && err.response.status === 404) {
             setRunError("Error: Server route not found. Check backend URL.");
        } else if (err.response && err.response.status === 401) {
             setRunError("Error: Unauthorized. Try logging in again.");
        } else {
             setRunError("Error: Failed to run code. " + (err.message || "Unknown error"));
        }
    } finally {
        setIsRunning(false);
    }
  };

  // 2. AUTOSAVE LOGIC
  const triggerAutosave = async (qId: number, val: any, qType: string) => {
    if (!data || !token) return;
    setSaveStatus('saving');

    const payload: any = { question_id: qId };
    if (qType.includes("prog") || typeof val === 'string') {
       payload.code_answer = val;
    } else if (qType === "true_false") {
       payload.tf_answer = val;
    } else if (qType === "mcq") {
       payload.mcq_option_ids = [val]; 
    }

    try {
      await axios.patch(
        `http://localhost:3000/api/submissions/${data.submission_id}/answers`, 
        payload, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSaveStatus('saved');
    } catch (err) {
      console.error("Autosave failed", err);
      setSaveStatus('error');
    }
  };

  const handleAnswer = (qId: number, val: any) => {
    setAnswers((prev) => ({ ...prev, [qId]: val }));

    const question = data?.test.questions.find(q => q.question_id === qId);
    const qType = question?.question_type || "unknown";

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      triggerAutosave(qId, val, qType);
    }, 1000);
  };

  // 3. NAVIGATION & SUBMIT
  const submitTest = async () => {
    if (!data || !token) return;
    if (!window.confirm("Are you sure you want to submit? This action cannot be undone.")) return;
    
    try {
      setSubmitting(true);
      const res = await axios.post(
        `http://localhost:3000/api/submissions/${data.submission_id}/submit`, 
        {}, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(`Test submitted successfully! Score: ${res.data.result.auto_grade}`);
      nav("/tests");
    } catch (e: any) {
      alert("Failed to submit: " + (e.response?.data?.error || e.message));
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
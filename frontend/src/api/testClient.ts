// src/api/testClient.ts
const API_BASE = "http://localhost:3000"; 

export interface AvailableTest {
  test_id: number;
  title: string;
  description: string | null;
  total_points: number;
}

export interface StartTestResponse {
  submission_id: number;
  test: {
    test_id: number;
    title: string;
    description?: string; // <--- ADDED THIS TO FIX THE ERROR
    questions: any[]; 
  };
}

export interface AnswersPayload {
  tf: Record<number, "true" | "false" | null>;
  mcq: Record<number, number | null>;      
  prog: Record<number, string>;            
}

// 1. Fetch Available Tests (GET)
export async function fetchAvailableTests(token: string): Promise<AvailableTest[]> {
  const res = await fetch(`${API_BASE}/api/test/available`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to fetch tests (HTTP ${res.status})`);
  }

  return res.json();
}

// 2. Start Test (POST)
export async function startTest(token: string, testId: number): Promise<StartTestResponse> {
  const params = new URLSearchParams({ test_id: String(testId) });

  console.log("🚀 STARTING TEST VIA POST:", testId); 

  const res = await fetch(`${API_BASE}/api/test/start?` + params.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({}) 
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to start test (HTTP ${res.status})`);
  }

  return res.json();
}

// 3. Submit Test (POST)
export async function submitTest(
  token: string,
  submissionId: number,
  answers: AnswersPayload
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/test/submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      submission_id: submissionId,
      answers,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to submit test (HTTP ${res.status})`);
  }
}
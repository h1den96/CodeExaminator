// src/api/testClient.ts
/*import type { StartTestResponse } from '../types/test';

export type StartTestParams = {
  tf?: number;
  mcq?: number;
  prog?: number;
};

export async function startTest(
  token: string,
  params?: StartTestParams
): Promise<StartTestResponse> {
  const q = new URLSearchParams();

  if (params?.tf != null) q.set('tf', String(params.tf));
  if (params?.mcq != null) q.set('mcq', String(params.mcq));
  if (params?.prog != null) q.set('prog', String(params.prog));

  const url = '/api/test/start' + (q.toString() ? `?${q.toString()}` : '');

  const r = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    // keep this if your backend uses cookies (e.g. refresh_token)
    credentials: 'include',
  });

  if (!r.ok) {
    // you can inspect r.status / body for better error messages if you want
    throw new Error('Failed to start test');
  }

  return (await r.json()) as StartTestResponse;
}
*/
/*
// src/api/testClient.ts
import type { StartTestResponse } from "../types/test";

const API_BASE = "http://localhost:3000";

export interface AvailableTest {
  test_id: number;
  title: string;
  description: string | null;
  available_from: string | null;
  available_until: string | null;
  total_points: number;
}

export async function fetchAvailableTests(
  token: string
): Promise<AvailableTest[]> {
  const res = await fetch(`${API_BASE}/api/test/available`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch tests (HTTP ${res.status})`);
  }

  return res.json();
}

export async function startTest(
  token: string,
  testId: number
): Promise<StartTestResponse> {
  const params = new URLSearchParams({ test_id: String(testId) });

  const res = await fetch(`${API_BASE}/api/test/start?` + params.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(`Failed to start test (HTTP ${res.status})`);
  }

  return res.json();
}
*/

// src/api/testClient.ts
const API_BASE = "http://localhost:3000";

// ---- Types ----

export interface AvailableTest {
  test_id: number;
  title: string;
  description: string | null;
  available_from: string | null;
  available_until: string | null;
  total_points: number;
}

export interface StartTestResponse {
  submission_id: number;
  test: any; // μπορείς να το εξειδικεύσεις αργότερα με σωστό τύπο
}

// Ταιριάζει με το backend AnswersPayload / TestsPage σου
export interface AnswersPayload {
  tf: Record<number, "true" | "false" | null>;
  mcq: Record<number, number | null>;      // option_id
  prog: Record<number, string>;            // code
}

// ---- API calls ----

// GET /api/test/available
export async function fetchAvailableTests(
  token: string
): Promise<AvailableTest[]> {
  const res = await fetch(`${API_BASE}/api/test/available`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch tests (HTTP ${res.status})`);
  }

  return res.json();
}

// GET /api/test/start?test_id=...
export async function startTest(
  token: string,
  testId: number
): Promise<StartTestResponse> {
  const params = new URLSearchParams({ test_id: String(testId) });

  const res = await fetch(`${API_BASE}/api/test/start?` + params.toString(), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`, // 👈 πολύ σημαντικό
    },
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(`Failed to start test (HTTP ${res.status})`);
  }

  return res.json();
}

// POST /api/test/submit
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
    credentials: "include",
    body: JSON.stringify({
      submission_id: submissionId,
      answers,
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to submit test (HTTP ${res.status})`);
  }
}

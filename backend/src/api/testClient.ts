import { http } from "./http";

export async function listTests() {
  const { data } = await http.get("/api/tests");
  return data;
}

export async function startTest(params?: { tf?: number; mcq?: number; prog?: number }) {
  const q = new URLSearchParams();
  if (params?.tf) q.set("tf", String(params.tf));
  if (params?.mcq) q.set("mcq", String(params.mcq));
  if (params?.prog) q.set("prog", String(params.prog));
  const qs = q.toString() ? `?${q.toString()}` : "";
  const { data } = await http.get(`/api/test/start${qs}`);
  return data; // { submission_id, questions, ... }
}

export async function fetchSubmission(id: number) {
  const { data } = await http.get(`/api/submissions/${id}`);
  return data;
}

export async function saveAnswers(id: number, answers: any) {
  await http.patch(`/api/submissions/${id}/answers`, { answers });
}

export async function submitSubmission(id: number) {
  const { data } = await http.post(`/api/submissions/${id}/submit`, {});
  return data;
}

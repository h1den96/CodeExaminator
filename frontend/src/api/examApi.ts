import api from "./axios";

export interface Topic {
  topic_id: number;
  name: string;
  description: string | null;
}

// 🚀 The NEW Slot Interface
export interface Slot {
  topic_id: number;
  question_type: "true_false" | "multiple_choice" | "programming";
  difficulty: "easy" | "medium" | "hard";
  points: number;
  weight_bb: number; // Black-box weight (0.0 to 1.0)
  weight_wb: number; // White-box weight (0.0 to 1.0)
}

export interface CreateQuestionPayload {
  title: string;
  body: string;
  question_type: "mcq" | "true_false" | "programming";
  difficulty: "easy" | "medium" | "hard";
  topic_ids: number[];
  options?: { text: string; is_correct: boolean }[];
  correct_answer?: boolean;
  starter_code?: string;
  test_cases?: any[];
}

// 🚀 Updated Payload to support Slots
export interface CreateTestPayload {
  title: string;
  description?: string;
  is_random: boolean;
  slots: Slot[]; // 🔥 This replaces the individual counts

  duration_minutes: number;
  available_from: string | null;
  available_until: string | null;
  strict_deadline: boolean;

  // We make these optional so old code doesn't break,
  // but the new "CreateTestPage" won't need them.
  tf_count?: number;
  mcq_count?: number;
  prog_count?: number;
  tf_points?: number;
  mcq_points?: number;
  prog_points?: number;
  generation_config?: any;
}

export interface TestSummary {
  test_id: number;
  title: string;
  description: string;
  created_at: string;
  is_published: boolean;
  total_points: number;
  question_count: number;
}

export interface StudentHistoryItem {
  submission_id: number;
  test_title: string;
  submitted_at: string;
  total_grade: string;
  max_points: number;
  status: string;
}

// --- API Functions ---

export const fetchAllTests = async (): Promise<TestSummary[]> => {
  const res = await api.get("/tests");
  return res.data;
};

export const fetchTopics = async (): Promise<Topic[]> => {
  const res = await api.get("/topics");
  return res.data;
};

export const createQuestion = async (payload: CreateQuestionPayload) => {
  const res = await api.post("/questions", payload);
  return res.data;
};

// 🚀 This will now accept the Slot-based payload
export const createTest = async (payload: CreateTestPayload) => {
  const res = await api.post("/test/create", payload);
  return res.data;
};

export const fetchStudentHistory = async (): Promise<StudentHistoryItem[]> => {
  const res = await api.get("/tests/history");
  return res.data;
};

export const saveAnswerToDB = async (
  submissionId: number,
  qId: number,
  payload: any,
) => {
  const response = await api.post(`/submissions/${submissionId}/save-answer`, {
    question_id: qId,
    ...payload,
  });
  return response.data;
};

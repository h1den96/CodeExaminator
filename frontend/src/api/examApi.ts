// src/api/examApi.ts
import api from './axios';

export interface Topic {
  topic_id: number;
  name: string;
  description: string | null;
}

export interface CreateQuestionPayload {
  title: string;
  body: string;
  question_type: 'mcq' | 'true_false' | 'programming';
  difficulty: 'easy' | 'medium' | 'hard';
  topic_ids: number[];
  options?: { text: string; is_correct: boolean }[];
  correct_answer?: boolean;
  starter_code?: string;
  test_cases?: any[];
}

export interface CreateTestPayload {
  title: string;
  description?: string;
  tf_count: number;
  mcq_count: number;
  prog_count: number;
  tf_points: number;
  mcq_points: number;
  prog_points: number;
  is_random: boolean;
  generation_config: {
    topics: number[];
    difficulty_distribution: {
      easy: number;
      medium: number;
      hard: number;
    };
  };

    duration_minutes?: number;
    available_from?: string | null;
    available_until?: string | null;
    strict_deadline?: boolean;
}
// Add these to existing imports/interfaces
export interface TestSummary {
  test_id: number;
  title: string;
  description: string;
  created_at: string;
  is_published: boolean;
  total_points: number;
  question_count: number;
}

// 4. Fetch All Tests (For Dashboard)
export const fetchAllTests = async (): Promise<TestSummary[]> => {
  // Adjust endpoint based on your backend route, e.g., '/tests' or '/teacher/tests'
  const res = await api.get('/tests'); 
  return res.data;
};
// 1. Fetch Topics for the Dropdown
export const fetchTopics = async (): Promise<Topic[]> => {
  const res = await api.get('/topics');
  return res.data;
};

// 2. Create a Question (Optional, if you want a UI for this later)
export const createQuestion = async (payload: CreateQuestionPayload) => {
  const res = await api.post('/questions', payload);
  return res.data;
};

// 3. Create the Test Blueprint
export const createTest = async (payload: CreateTestPayload) => {
  const res = await api.post('/test/create', payload);
  return res.data;
};
// src/types/exam.types.ts

export type Difficulty = 'easy' | 'medium' | 'hard';

export type Spec = {
  tf: number;
  mcq: number;
  prog: number;
};

export type GenerationConfig = {
  topics?: number[]; 
  difficulty_distribution?: {
    easy?: number;
    medium?: number;
    hard?: number;
  };
};

export type RandomizerSpec = {
  counts: Spec; 
  config: GenerationConfig;
};

export type TestTemplateRow = {
  test_id: number;
  title: string;
  description: string | null;
  tf_count: number;
  mcq_count: number;
  prog_count: number;
  tf_points: string; 
  mcq_points: string;
  prog_points: string;
  enable_negative_grading: boolean;
  generation_config: GenerationConfig | null;
  duration_minutes: number;
  available_until: string | null;
  available_from: string | null;
  strict_deadline: boolean;
};

// --- 👇 NEW: Define the Question Shape Here 👇 ---
export interface Question {
  question_id: number;
  question_type: 'mcq' | 'true_false' | 'programming' | 'tf' | 'prog'; // Handle all variations
  body: string;
  points: number;
  
  // ✅ THE CRITICAL FIELD
  allow_multiple?: boolean; 
  
  // Specific fields
  options?: { id: number; text: string }[]; // For MCQ
  test_cases?: any[]; // For Programming
}

export type AnswersPayload = {
  tf: Record<number, boolean | "true" | "false" | null>;
  mcq: Record<number, number | number[] | null>; 
  prog: Record<number, string>;
};

export type SubmitAnswerDto = {
  question_id: number;
  mcq_option_ids?: number[];
  tf_answer?: boolean;
  code_answer?: string;
};

export type AvailableTestDto = {
  test_id: number;
  title: string;
  description: string | null;
  available_from: Date | null;
  available_until: Date | null;
  total_points: number;
};

export interface TestDTO {
  test_id: number;
  title: string;
  description?: string | null;
  questions: any[];
  duration_minutes?: number;
  available_until?: string | null;
  strict_deadline?: boolean;
  started_at?: string; // Important for the timer!
}
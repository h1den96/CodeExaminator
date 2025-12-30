// src/types/exam.types.ts

export type Difficulty = 'easy' | 'medium' | 'hard';

// 1. Keep 'Spec' for the simple counts (Backwards compatible)
export type Spec = {
  tf: number;
  mcq: number;
  prog: number;
};

export type GenerationConfig = {
  topics?: number[]; // Array of topic_ids
  difficulty_distribution?: {
    easy?: number;
    medium?: number;
    hard?: number;
  };
};

// 2. Use 'Spec' inside the new RandomizerSpec
export type RandomizerSpec = {
  counts: Spec; 
  config: GenerationConfig;
};

// ... Update TestTemplateRow to include config ...
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
  generation_config: GenerationConfig | null; // <--- Added this
};

// ... Keep the rest of your DTOs exactly as they were ...
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

export type TestDTO = {
  test_id: number;
  title: string;
  description: string | null;
  questions: any[]; 
};
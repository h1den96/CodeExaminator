// src/types/exam.types.ts

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
};

export type Spec = {
  tf: number;
  mcq: number;
  prog: number;
};

// Input DTOs
export type AnswersPayload = {
  tf: Record<number, boolean | "true" | "false" | null>;
  // Updated this to be clearer: it can be a single ID (number) or array (number[])
  mcq: Record<number, number | number[] | null>; 
  prog: Record<number, string>;
};

export type SubmitAnswerDto = {
  question_id: number;
  mcq_option_ids?: number[];
  tf_answer?: boolean;
  code_answer?: string;
};

// Output DTOs
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
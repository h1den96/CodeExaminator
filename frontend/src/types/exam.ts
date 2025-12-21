export interface Question {
  question_id: number;
  question_type: 'mcq' | 'true_false' | 'programming';
  title: string;
  body: string;
  starter_code?: string; // Μόνο για programming
  options?: { option_id: number; option_text: string }[]; // Μόνο για MCQ
}

export interface ExamState {
  submission_id: number;
  test_id: number;
  questions: Question[];
  status: 'in_progress' | 'submitted';
}

export interface AnswerPayload {
  question_id: number;
  mcq_option_ids?: number[];
  tf_answer?: boolean;
  code_answer?: string;
}
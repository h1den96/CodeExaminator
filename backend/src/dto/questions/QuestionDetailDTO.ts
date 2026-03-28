// src/dto/questions/question-detail.dto.ts
export type QuestionDetailDto = {
  question_id: number;
  title: string | null;
  body: string;
  question_type: "mcq" | "true_false" | "programming";
  starter_code?: string | null;
  created_at: string;
};

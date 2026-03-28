// server/dto/TestDTO.ts
export type McqOptionPublicDTO = {
  option_id: number;
  option_text: string;
};

export type TestQuestionDTO = {
  position: number;
  question_id: number;
  title: string;
  body: string;
  question_type: "mcq" | "true_false" | "programming";
  starter_code: string | null;
  options: McqOptionPublicDTO[] | null;
};

export type TestDTO = {
  submission_id: number;
  test_id: number | null; // or number if you always use a tests table
  status: "in_progress";
  //created_at: string;
  questions: TestQuestionDTO[];
};

export interface AvailableTestDto {
  test_id: number;
  title: string;
  description: string | null;
  available_from: string | null;
  available_until: string | null;
  total_points: number;
}

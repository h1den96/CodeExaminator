export type programmingQuestionDTO = {
  question_id: number;
  question_type: "programming";
  title: string;
  body: string;
  created_at: string;
  starter_code: string | null;
};

export type TrueFalseDTO = {
  question_id: number;
  question_type: "true_false";
  title: string;
  body: string;
  created_at: string;
  correct_answer: boolean;
};

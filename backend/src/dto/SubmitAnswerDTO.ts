export interface SubmitAnswerDto {
  question_id: number;
  mcq_option_ids?: number[];
  tf_answer?: boolean | null;
  code_answer?: string | null;
}
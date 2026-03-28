export type McqOptionPublicDTO = {
  option_id: number;
  option_text: string;
};

export type McqPublicDTO = {
  question_id: number;
  question_type: "mcq";
  title: string;
  body: string;
  created_at: string;
  options: McqOptionPublicDTO[];
};

export interface Question {
  question_id: number;
  question_type: "mcq" | "true_false" | "programming";
  title: string;
  body: string;
  starter_code?: string;
  options?: { option_id: number; option_text: string }[];
}

export interface ExamState {
  submission_id: number;
  test_id: number;
  questions: Question[];
  status: "in_progress" | "submitted";
}

export interface AnswerPayload {
  question_id: number;
  mcq_option_ids?: number[];
  tf_answer?: boolean;
  code_answer?: string;
}

export interface StructuralRule {
  type: "REQUIRE" | "FORBID";
  target:
    | "recursion"
    | "loop"
    | "function_call"
    | "logarithmic_complexity"
    | "smart_pointers"
    | "raw_pointers"
    | string;
  description: string;
  weight: number;
  name?: string;
}

export interface TestCase {
  input: string;
  expected_output: string;
  category: "SANITY" | "FUNCTIONAL" | "EDGE";
  weight: number;
  is_hidden?: boolean;
}

export interface ProgrammingQuestionPayload {
  title: string;
  body: string;
  difficulty: "easy" | "medium" | "hard";
  topic_ids: number[];
  category?: "SCALAR" | "LINEAR" | "GRID" | "LINKED_LIST" | "CUSTOM";
  function_signature?: string;
  starter_code?: string;
  weight_wb: number;
  weight_bb: number;
  grace_mode: "STRICT" | "STANDARD" | "THRESHOLD";
  grace_threshold: number;
  grace_cap: number;
  structural_rules: StructuralRule[];
  test_cases: TestCase[];
}
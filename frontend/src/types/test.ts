// src/types/test.ts
export type TFQ = {
  id: number;
  type: 'true_false';
  title: string;
  body: string | null;
};

export type MCQ = {
  id: number;
  type: 'mcq';
  title: string;
  body: string | null;
  options: { option_id: number; option_text: string }[];
};

export type PROG = {
  id: number;
  type: 'programming';
  title: string;
  body: string | null;
  starter_code: string | null;
};

export type AnyQ = TFQ | MCQ | PROG;

export type StartTestResponse = {
  structure: { true_false: number; mcq: number; programming: number };
  count: number;
  questions: AnyQ[];
};

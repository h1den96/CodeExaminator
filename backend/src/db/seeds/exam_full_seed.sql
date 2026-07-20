--
-- PostgreSQL database dump
--

-- Dumped from database version 16.2 (Debian 16.2-1.pgdg120+2)
-- Dumped by pg_dump version 16.2 (Debian 16.2-1.pgdg120+2)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY exam.true_false_answers DROP CONSTRAINT IF EXISTS true_false_answers_question_id_fkey;
ALTER TABLE IF EXISTS ONLY exam.tests DROP CONSTRAINT IF EXISTS tests_created_by_fkey;
ALTER TABLE IF EXISTS ONLY exam.test_slots DROP CONSTRAINT IF EXISTS test_slots_topic_id_fkey;
ALTER TABLE IF EXISTS ONLY exam.test_slots DROP CONSTRAINT IF EXISTS test_slots_test_id_fkey;
ALTER TABLE IF EXISTS ONLY exam.test_questions DROP CONSTRAINT IF EXISTS test_questions_test_id_fkey;
ALTER TABLE IF EXISTS ONLY exam.test_questions DROP CONSTRAINT IF EXISTS test_questions_question_id_fkey;
ALTER TABLE IF EXISTS ONLY exam.submission_questions DROP CONSTRAINT IF EXISTS submission_questions_submission_id_fkey;
ALTER TABLE IF EXISTS ONLY exam.submission_questions DROP CONSTRAINT IF EXISTS submission_questions_question_id_fkey;
ALTER TABLE IF EXISTS ONLY exam.students DROP CONSTRAINT IF EXISTS students_student_id_fkey;
ALTER TABLE IF EXISTS ONLY exam.student_answers DROP CONSTRAINT IF EXISTS student_answers_submission_question_id_fkey;
ALTER TABLE IF EXISTS ONLY exam.questions DROP CONSTRAINT IF EXISTS questions_created_by_fkey;
ALTER TABLE IF EXISTS ONLY exam.question_topics DROP CONSTRAINT IF EXISTS question_topics_topic_id_fkey;
ALTER TABLE IF EXISTS ONLY exam.question_topics DROP CONSTRAINT IF EXISTS question_topics_question_id_fkey;
ALTER TABLE IF EXISTS ONLY exam.programming_questions DROP CONSTRAINT IF EXISTS programming_questions_question_id_fkey;
ALTER TABLE IF EXISTS ONLY exam.mcq_options DROP CONSTRAINT IF EXISTS mcq_options_question_id_fkey;
DROP INDEX IF EXISTS exam.uniq_active_submission_per_student_test;
ALTER TABLE IF EXISTS ONLY exam.student_answers DROP CONSTRAINT IF EXISTS unique_submission_question;
ALTER TABLE IF EXISTS ONLY exam.true_false_answers DROP CONSTRAINT IF EXISTS true_false_answers_pkey;
ALTER TABLE IF EXISTS ONLY exam.topics DROP CONSTRAINT IF EXISTS topics_pkey;
ALTER TABLE IF EXISTS ONLY exam.topics DROP CONSTRAINT IF EXISTS topics_name_key;
ALTER TABLE IF EXISTS ONLY exam.tests DROP CONSTRAINT IF EXISTS tests_pkey;
ALTER TABLE IF EXISTS ONLY exam.test_slots DROP CONSTRAINT IF EXISTS test_slots_pkey;
ALTER TABLE IF EXISTS ONLY exam.test_questions DROP CONSTRAINT IF EXISTS test_questions_pkey;
ALTER TABLE IF EXISTS ONLY exam.submissions DROP CONSTRAINT IF EXISTS submissions_pkey;
ALTER TABLE IF EXISTS ONLY exam.submission_questions DROP CONSTRAINT IF EXISTS submission_questions_pkey;
ALTER TABLE IF EXISTS ONLY exam.students DROP CONSTRAINT IF EXISTS students_pkey;
ALTER TABLE IF EXISTS ONLY exam.student_answers DROP CONSTRAINT IF EXISTS student_answers_pkey;
ALTER TABLE IF EXISTS ONLY exam.questions DROP CONSTRAINT IF EXISTS questions_pkey;
ALTER TABLE IF EXISTS ONLY exam.question_topics DROP CONSTRAINT IF EXISTS question_topics_pkey;
ALTER TABLE IF EXISTS ONLY exam.programming_questions DROP CONSTRAINT IF EXISTS programming_questions_pkey;
ALTER TABLE IF EXISTS ONLY exam.mcq_options DROP CONSTRAINT IF EXISTS mcq_options_pkey;
ALTER TABLE IF EXISTS exam.topics ALTER COLUMN topic_id DROP DEFAULT;
ALTER TABLE IF EXISTS exam.tests ALTER COLUMN test_id DROP DEFAULT;
ALTER TABLE IF EXISTS exam.test_slots ALTER COLUMN slot_id DROP DEFAULT;
ALTER TABLE IF EXISTS exam.submissions ALTER COLUMN submission_id DROP DEFAULT;
ALTER TABLE IF EXISTS exam.submission_questions ALTER COLUMN submission_question_id DROP DEFAULT;
ALTER TABLE IF EXISTS exam.student_answers ALTER COLUMN answer_id DROP DEFAULT;
ALTER TABLE IF EXISTS exam.questions ALTER COLUMN question_id DROP DEFAULT;
ALTER TABLE IF EXISTS exam.mcq_options ALTER COLUMN option_id DROP DEFAULT;
DROP TABLE IF EXISTS exam.true_false_answers;
DROP SEQUENCE IF EXISTS exam.topics_topic_id_seq;
DROP TABLE IF EXISTS exam.topics;
DROP SEQUENCE IF EXISTS exam.tests_test_id_seq;
DROP TABLE IF EXISTS exam.tests;
DROP SEQUENCE IF EXISTS exam.test_slots_slot_id_seq;
DROP TABLE IF EXISTS exam.test_slots;
DROP TABLE IF EXISTS exam.test_questions;
DROP SEQUENCE IF EXISTS exam.submissions_submission_id_seq;
DROP TABLE IF EXISTS exam.submissions;
DROP SEQUENCE IF EXISTS exam.submission_questions_submission_question_id_seq;
DROP TABLE IF EXISTS exam.submission_questions;
DROP SEQUENCE IF EXISTS exam.students_student_id_seq;
DROP TABLE IF EXISTS exam.students;
DROP SEQUENCE IF EXISTS exam.student_answers_answer_id_seq;
DROP TABLE IF EXISTS exam.student_answers;
DROP SEQUENCE IF EXISTS exam.questions_question_id_seq;
DROP TABLE IF EXISTS exam.questions;
DROP TABLE IF EXISTS exam.question_topics;
DROP TABLE IF EXISTS exam.programming_questions;
DROP SEQUENCE IF EXISTS exam.mcq_options_option_id_seq;
DROP TABLE IF EXISTS exam.mcq_options;
DROP SCHEMA IF EXISTS exam;
--
-- Name: exam; Type: SCHEMA; Schema: -; Owner: judge0
--

CREATE SCHEMA exam;


ALTER SCHEMA exam OWNER TO judge0;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: mcq_options; Type: TABLE; Schema: exam; Owner: judge0
--

CREATE TABLE exam.mcq_options (
    option_id integer NOT NULL,
    question_id integer NOT NULL,
    option_text text NOT NULL,
    is_correct boolean DEFAULT false NOT NULL,
    score_weight numeric(5,2) DEFAULT 0.00 NOT NULL
);


ALTER TABLE exam.mcq_options OWNER TO judge0;

--
-- Name: mcq_options_option_id_seq; Type: SEQUENCE; Schema: exam; Owner: judge0
--

CREATE SEQUENCE exam.mcq_options_option_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE exam.mcq_options_option_id_seq OWNER TO judge0;

--
-- Name: mcq_options_option_id_seq; Type: SEQUENCE OWNED BY; Schema: exam; Owner: judge0
--

ALTER SEQUENCE exam.mcq_options_option_id_seq OWNED BY exam.mcq_options.option_id;


--
-- Name: programming_questions; Type: TABLE; Schema: exam; Owner: judge0
--

CREATE TABLE exam.programming_questions (
    question_id integer NOT NULL,
    starter_code text,
    test_cases jsonb NOT NULL,
    boilerplate_code text,
    cpu_time_limit double precision DEFAULT 2.0,
    memory_limit integer DEFAULT 128000,
    category text DEFAULT 'SCALAR'::text,
    function_signature text,
    language_id integer DEFAULT 54
);


ALTER TABLE exam.programming_questions OWNER TO judge0;

--
-- Name: question_topics; Type: TABLE; Schema: exam; Owner: judge0
--

CREATE TABLE exam.question_topics (
    question_id integer NOT NULL,
    topic_id integer NOT NULL
);


ALTER TABLE exam.question_topics OWNER TO judge0;

--
-- Name: questions; Type: TABLE; Schema: exam; Owner: judge0
--

CREATE TABLE exam.questions (
    question_id integer NOT NULL,
    question_type text NOT NULL,
    title text,
    body text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    difficulty text NOT NULL,
    created_by integer,
    allow_multiple boolean DEFAULT false,
    weight_bb numeric(3,2) DEFAULT 0.90,
    weight_wb numeric(3,2) DEFAULT 0.10,
    structural_rules jsonb DEFAULT '[]'::jsonb,
    grace_mode text DEFAULT 'STANDARD'::text NOT NULL,
    grace_threshold numeric(3,2) DEFAULT 0.90 NOT NULL,
    grace_cap numeric(3,2) DEFAULT 0.15 NOT NULL,
    CONSTRAINT questions_difficulty_check CHECK ((difficulty = ANY (ARRAY['easy'::text, 'medium'::text, 'hard'::text]))),
    CONSTRAINT questions_grace_mode_check CHECK ((grace_mode = ANY (ARRAY['STRICT'::text, 'STANDARD'::text, 'THRESHOLD'::text]))),
    CONSTRAINT questions_question_type_check CHECK ((question_type = ANY (ARRAY['mcq'::text, 'true_false'::text, 'programming'::text])))
);


ALTER TABLE exam.questions OWNER TO judge0;

--
-- Name: questions_question_id_seq; Type: SEQUENCE; Schema: exam; Owner: judge0
--

CREATE SEQUENCE exam.questions_question_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE exam.questions_question_id_seq OWNER TO judge0;

--
-- Name: questions_question_id_seq; Type: SEQUENCE OWNED BY; Schema: exam; Owner: judge0
--

ALTER SEQUENCE exam.questions_question_id_seq OWNED BY exam.questions.question_id;


--
-- Name: student_answers; Type: TABLE; Schema: exam; Owner: judge0
--

CREATE TABLE exam.student_answers (
    answer_id integer NOT NULL,
    submission_question_id integer NOT NULL,
    mcq_option_ids integer[],
    tf_answer boolean,
    code_answer text,
    eval_result jsonb,
    question_grade numeric(6,2),
    answered_at timestamp with time zone DEFAULT now(),
    is_submitted boolean DEFAULT false,
    submitted_at timestamp with time zone
);


ALTER TABLE exam.student_answers OWNER TO judge0;

--
-- Name: student_answers_answer_id_seq; Type: SEQUENCE; Schema: exam; Owner: judge0
--

CREATE SEQUENCE exam.student_answers_answer_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE exam.student_answers_answer_id_seq OWNER TO judge0;

--
-- Name: student_answers_answer_id_seq; Type: SEQUENCE OWNED BY; Schema: exam; Owner: judge0
--

ALTER SEQUENCE exam.student_answers_answer_id_seq OWNED BY exam.student_answers.answer_id;


--
-- Name: students; Type: TABLE; Schema: exam; Owner: judge0
--

CREATE TABLE exam.students (
    student_id integer NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    semester integer NOT NULL
);


ALTER TABLE exam.students OWNER TO judge0;

--
-- Name: students_student_id_seq; Type: SEQUENCE; Schema: exam; Owner: judge0
--

CREATE SEQUENCE exam.students_student_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE exam.students_student_id_seq OWNER TO judge0;

--
-- Name: students_student_id_seq; Type: SEQUENCE OWNED BY; Schema: exam; Owner: judge0
--

ALTER SEQUENCE exam.students_student_id_seq OWNED BY exam.students.student_id;


--
-- Name: submission_questions; Type: TABLE; Schema: exam; Owner: judge0
--

CREATE TABLE exam.submission_questions (
    submission_question_id integer NOT NULL,
    submission_id integer NOT NULL,
    question_id integer NOT NULL,
    q_order integer NOT NULL,
    points numeric(6,2) NOT NULL,
    mcq_option_order integer[],
    question_snapshot jsonb,
    points_earned numeric(6,2) DEFAULT 0,
    code_execution_results jsonb
);


ALTER TABLE exam.submission_questions OWNER TO judge0;

--
-- Name: submission_questions_submission_question_id_seq; Type: SEQUENCE; Schema: exam; Owner: judge0
--

CREATE SEQUENCE exam.submission_questions_submission_question_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE exam.submission_questions_submission_question_id_seq OWNER TO judge0;

--
-- Name: submission_questions_submission_question_id_seq; Type: SEQUENCE OWNED BY; Schema: exam; Owner: judge0
--

ALTER SEQUENCE exam.submission_questions_submission_question_id_seq OWNED BY exam.submission_questions.submission_question_id;


--
-- Name: submissions; Type: TABLE; Schema: exam; Owner: judge0
--

CREATE TABLE exam.submissions (
    submission_id integer NOT NULL,
    student_id text NOT NULL,
    test_id integer NOT NULL,
    submitted_at timestamp with time zone DEFAULT now(),
    total_grade numeric(6,2) DEFAULT NULL::numeric,
    status text DEFAULT 'in_progress'::text NOT NULL,
    started_at timestamp with time zone DEFAULT now()
);


ALTER TABLE exam.submissions OWNER TO judge0;

--
-- Name: submissions_submission_id_seq; Type: SEQUENCE; Schema: exam; Owner: judge0
--

CREATE SEQUENCE exam.submissions_submission_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE exam.submissions_submission_id_seq OWNER TO judge0;

--
-- Name: submissions_submission_id_seq; Type: SEQUENCE OWNED BY; Schema: exam; Owner: judge0
--

ALTER SEQUENCE exam.submissions_submission_id_seq OWNED BY exam.submissions.submission_id;


--
-- Name: test_questions; Type: TABLE; Schema: exam; Owner: judge0
--

CREATE TABLE exam.test_questions (
    test_id integer NOT NULL,
    question_id integer NOT NULL,
    "position" integer,
    points numeric(6,2)
);


ALTER TABLE exam.test_questions OWNER TO judge0;

--
-- Name: test_slots; Type: TABLE; Schema: exam; Owner: judge0
--

CREATE TABLE exam.test_slots (
    slot_id integer NOT NULL,
    test_id integer,
    slot_order integer NOT NULL,
    topic_id integer,
    difficulty text,
    points numeric(6,2) NOT NULL,
    weight_bb numeric(3,2) DEFAULT 0.80,
    weight_wb numeric(3,2) DEFAULT 0.20,
    question_type text,
    category text DEFAULT 'SCALAR'::text,
    CONSTRAINT test_slots_difficulty_check CHECK ((difficulty = ANY (ARRAY['easy'::text, 'medium'::text, 'hard'::text]))),
    CONSTRAINT test_slots_question_type_check CHECK ((question_type = ANY (ARRAY['mcq'::text, 'programming'::text, 'true_false'::text])))
);


ALTER TABLE exam.test_slots OWNER TO judge0;

--
-- Name: test_slots_slot_id_seq; Type: SEQUENCE; Schema: exam; Owner: judge0
--

CREATE SEQUENCE exam.test_slots_slot_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE exam.test_slots_slot_id_seq OWNER TO judge0;

--
-- Name: test_slots_slot_id_seq; Type: SEQUENCE OWNED BY; Schema: exam; Owner: judge0
--

ALTER SEQUENCE exam.test_slots_slot_id_seq OWNED BY exam.test_slots.slot_id;


--
-- Name: tests; Type: TABLE; Schema: exam; Owner: judge0
--

CREATE TABLE exam.tests (
    test_id integer NOT NULL,
    title text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    available_from timestamp with time zone,
    available_until timestamp with time zone,
    tf_count integer DEFAULT 0 NOT NULL,
    mcq_count integer DEFAULT 0 NOT NULL,
    prog_count integer DEFAULT 0 NOT NULL,
    tf_points numeric(6,2) DEFAULT 1.0,
    mcq_points numeric(6,2) DEFAULT 2.0,
    prog_points numeric(6,2) DEFAULT 10.0,
    enable_negative_grading boolean DEFAULT false,
    is_random boolean DEFAULT false,
    generation_config jsonb,
    created_by integer,
    strict_deadline boolean DEFAULT true,
    duration_minutes integer DEFAULT 60,
    is_published boolean DEFAULT false
);


ALTER TABLE exam.tests OWNER TO judge0;

--
-- Name: tests_test_id_seq; Type: SEQUENCE; Schema: exam; Owner: judge0
--

CREATE SEQUENCE exam.tests_test_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE exam.tests_test_id_seq OWNER TO judge0;

--
-- Name: tests_test_id_seq; Type: SEQUENCE OWNED BY; Schema: exam; Owner: judge0
--

ALTER SEQUENCE exam.tests_test_id_seq OWNED BY exam.tests.test_id;


--
-- Name: topics; Type: TABLE; Schema: exam; Owner: judge0
--

CREATE TABLE exam.topics (
    topic_id integer NOT NULL,
    name text NOT NULL,
    description text
);


ALTER TABLE exam.topics OWNER TO judge0;

--
-- Name: topics_topic_id_seq; Type: SEQUENCE; Schema: exam; Owner: judge0
--

CREATE SEQUENCE exam.topics_topic_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE exam.topics_topic_id_seq OWNER TO judge0;

--
-- Name: topics_topic_id_seq; Type: SEQUENCE OWNED BY; Schema: exam; Owner: judge0
--

ALTER SEQUENCE exam.topics_topic_id_seq OWNED BY exam.topics.topic_id;


--
-- Name: true_false_answers; Type: TABLE; Schema: exam; Owner: judge0
--

CREATE TABLE exam.true_false_answers (
    question_id integer NOT NULL,
    correct_answer boolean NOT NULL
);


ALTER TABLE exam.true_false_answers OWNER TO judge0;

--
-- Name: mcq_options option_id; Type: DEFAULT; Schema: exam; Owner: judge0
--

ALTER TABLE ONLY exam.mcq_options ALTER COLUMN option_id SET DEFAULT nextval('exam.mcq_options_option_id_seq'::regclass);


--
-- Name: questions question_id; Type: DEFAULT; Schema: exam; Owner: judge0
--

ALTER TABLE ONLY exam.questions ALTER COLUMN question_id SET DEFAULT nextval('exam.questions_question_id_seq'::regclass);


--
-- Name: student_answers answer_id; Type: DEFAULT; Schema: exam; Owner: judge0
--

ALTER TABLE ONLY exam.student_answers ALTER COLUMN answer_id SET DEFAULT nextval('exam.student_answers_answer_id_seq'::regclass);


--
-- Name: submission_questions submission_question_id; Type: DEFAULT; Schema: exam; Owner: judge0
--

ALTER TABLE ONLY exam.submission_questions ALTER COLUMN submission_question_id SET DEFAULT nextval('exam.submission_questions_submission_question_id_seq'::regclass);


--
-- Name: submissions submission_id; Type: DEFAULT; Schema: exam; Owner: judge0
--

ALTER TABLE ONLY exam.submissions ALTER COLUMN submission_id SET DEFAULT nextval('exam.submissions_submission_id_seq'::regclass);


--
-- Name: test_slots slot_id; Type: DEFAULT; Schema: exam; Owner: judge0
--

ALTER TABLE ONLY exam.test_slots ALTER COLUMN slot_id SET DEFAULT nextval('exam.test_slots_slot_id_seq'::regclass);


--
-- Name: tests test_id; Type: DEFAULT; Schema: exam; Owner: judge0
--

ALTER TABLE ONLY exam.tests ALTER COLUMN test_id SET DEFAULT nextval('exam.tests_test_id_seq'::regclass);


--
-- Name: topics topic_id; Type: DEFAULT; Schema: exam; Owner: judge0
--

ALTER TABLE ONLY exam.topics ALTER COLUMN topic_id SET DEFAULT nextval('exam.topics_topic_id_seq'::regclass);


--
-- Data for Name: mcq_options; Type: TABLE DATA; Schema: exam; Owner: judge0
--



--
-- Data for Name: programming_questions; Type: TABLE DATA; Schema: exam; Owner: judge0
--

INSERT INTO exam.programming_questions VALUES (1, '#include <iostream>

double convertTemperature(double temp, char scale) {
    return 0.0;
}', '[{"input": "32.0 F", "weight": 0.3, "category": "SANITY", "expected_output": "0.0"}, {"input": "100.0 C", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "212.0"}, {"input": "-40.0 C", "weight": 0.3, "category": "EDGE", "expected_output": "-40.0"}]', NULL, 2, 128000, 'SCALAR', NULL, 54);
INSERT INTO exam.programming_questions VALUES (2, '#include <vector>

std::vector<int> classifySigns(const std::vector<int>& numbers) {
    return {};
}', '[{"input": "[10, -5, 0]", "weight": 0.3, "category": "SANITY", "expected_output": "[1, -1, 0]"}, {"input": "[-1, -2, -3]", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "[-1, -1, -1]"}, {"input": "[]", "weight": 0.3, "category": "EDGE", "expected_output": "[]"}]', NULL, 2, 128000, 'LINEAR', NULL, 54);
INSERT INTO exam.programming_questions VALUES (3, '#include <vector>

std::vector<std::vector<int>> checkQuadrantSigns(const std::vector<std::vector<int>>& grid) {
    return grid;
}', '[{"input": "[[1, 2], [-1, -2]]", "weight": 0.3, "category": "SANITY", "expected_output": "[[1, 1], [3, 3]]"}, {"input": "[[0, 5], [3, -4]]", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "[[0, 1], [1, 4]]"}, {"input": "[[0, 0], [0, 0]]", "weight": 0.3, "category": "EDGE", "expected_output": "[[0, 0], [0, 0]]"}]', NULL, 2, 128000, 'GRID', NULL, 54);
INSERT INTO exam.programming_questions VALUES (4, 'struct Node {
    int data;
    Node* next;
};

int checkHeadSign(Node* head) {
    return 0;
}', '[{"input": "[5, -2, 3]", "weight": 0.3, "category": "SANITY", "expected_output": "1"}, {"input": "[-10, 20]", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "-1"}, {"input": "[]", "weight": 0.3, "category": "EDGE", "expected_output": "0"}]', NULL, 2, 128000, 'LINKED_LIST', NULL, 54);
INSERT INTO exam.programming_questions VALUES (5, '#include <iostream>

int main() {
    return 0;
}', '[{"input": "2024", "weight": 0.3, "category": "SANITY", "expected_output": "LEAP"}, {"input": "1900", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "COMMON"}, {"input": "2000", "weight": 0.3, "category": "EDGE", "expected_output": "LEAP"}]', NULL, 2, 128000, 'CUSTOM', NULL, 54);
INSERT INTO exam.programming_questions VALUES (6, '#include <iostream>

double calculateTax(double income) {
    return 0.0;
}', '[{"input": "25000.0", "weight": 0.3, "category": "SANITY", "expected_output": "1500.0"}, {"input": "50000.0", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "5000.0"}, {"input": "10000.0", "weight": 0.3, "category": "EDGE", "expected_output": "0.0"}]', NULL, 2, 128000, 'SCALAR', NULL, 54);
INSERT INTO exam.programming_questions VALUES (7, '#include <vector>

std::vector<int> processFlags(const std::vector<int>& values) {
    return {};
}', '[{"input": "[15, 9, 10, 7]", "weight": 0.3, "category": "SANITY", "expected_output": "[35, 3, 5, 7]"}, {"input": "[0, 1, 2]", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "[35, 1, 2]"}, {"input": "[]", "weight": 0.3, "category": "EDGE", "expected_output": "[]"}]', NULL, 2, 128000, 'LINEAR', NULL, 54);
INSERT INTO exam.programming_questions VALUES (8, '#include <vector>

std::vector<std::vector<int>> checkBoundaryStatus(const std::vector<std::vector<int>>& grid) {
    return grid;
}', '[{"input": "[[1, 2, 3], [4, 5, 6], [7, 8, 9]]", "weight": 0.3, "category": "SANITY", "expected_output": "[[1, 2, 3], [4, -1, 6], [7, 8, 9]]"}, {"input": "[[1, 1], [1, 1]]", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "[[1, 1], [1, 1]]"}, {"input": "[[5, 5, 5], [5, -3, 5], [5, 5, 5]]", "weight": 0.3, "category": "EDGE", "expected_output": "[[5, 5, 5], [5, -2, 5], [5, 5, 5]]"}]', NULL, 2, 128000, 'GRID', NULL, 54);
INSERT INTO exam.programming_questions VALUES (9, 'struct Node {
    int data;
    Node* next;
};

int evaluateFirstTwoNodes(Node* head) {
    return 0;
}', '[{"input": "[10, 5, 2]", "weight": 0.3, "category": "SANITY", "expected_output": "1"}, {"input": "[3, 8]", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "-1"}, {"input": "[5]", "weight": 0.3, "category": "EDGE", "expected_output": "-99"}]', NULL, 2, 128000, 'LINKED_LIST', NULL, 54);
INSERT INTO exam.programming_questions VALUES (10, '#include <iostream>

int main() {
    return 0;
}', '[{"input": "29 2 2024", "weight": 0.3, "category": "SANITY", "expected_output": "VALID"}, {"input": "29 2 2023", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "INVALID"}, {"input": "31 4 2020", "weight": 0.3, "category": "EDGE", "expected_output": "INVALID"}]', NULL, 2, 128000, 'CUSTOM', NULL, 54);
INSERT INTO exam.programming_questions VALUES (11, '#include <iostream>

int resolveState(int flags, int mask, int trigger) {
    return 0;
}', '[{"input": "7 3 1", "weight": 0.3, "category": "SANITY", "expected_output": "4"}, {"input": "5 1 2", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "1"}, {"input": "0 1 0", "weight": 0.3, "category": "EDGE", "expected_output": "-1"}]', NULL, 2, 128000, 'SCALAR', NULL, 54);
INSERT INTO exam.programming_questions VALUES (12, '#include <vector>

std::vector<int> pipelineTransform(const std::vector<int>& vec, int threshold) {
    return {};
}', '[{"input": "[10, 5, -3, 2], 4", "weight": 0.3, "category": "SANITY", "expected_output": "[5, 16, 3, 2]"}, {"input": "[-10, 0], 0", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "[10, 0]"}, {"input": "[], 5", "weight": 0.3, "category": "EDGE", "expected_output": "[]"}]', NULL, 2, 128000, 'LINEAR', NULL, 54);
INSERT INTO exam.programming_questions VALUES (13, '#include <vector>

std::vector<std::vector<int>> evaluateSaddlePositions(const std::vector<std::vector<int>>& grid) {
    return grid;
}', '[{"input": "[[5, 2, 5], [1, 3, 1], [5, 2, 5]]", "weight": 0.3, "category": "SANITY", "expected_output": "[[0, 0, 0], [0, 1, 0], [0, 0, 0]]"}, {"input": "[[1, 2], [3, 4]]", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "[[0, 0], [0, 0]]"}, {"input": "[[1]]", "weight": 0.3, "category": "EDGE", "expected_output": "[[0]]"}]', NULL, 2, 128000, 'GRID', NULL, 54);
INSERT INTO exam.programming_questions VALUES (14, 'struct Node {
    int data;
    Node* next;
};

bool verifyTriplePattern(Node* head) {
    return false;
}', '[{"input": "[1, 5, 2]", "weight": 0.3, "category": "SANITY", "expected_output": "true"}, {"input": "[1, 2, 3]", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "false"}, {"input": "[1, 2]", "weight": 0.3, "category": "EDGE", "expected_output": "false"}]', NULL, 2, 128000, 'LINKED_LIST', NULL, 54);
INSERT INTO exam.programming_questions VALUES (15, '#include <iostream>

int main() {
    return 0;
}', '[{"input": "1 5 3 8", "weight": 0.3, "category": "SANITY", "expected_output": "3 5"}, {"input": "1 3 4 8", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "NONE"}, {"input": "2 5 5 9", "weight": 0.3, "category": "EDGE", "expected_output": "5 5"}]', NULL, 2, 128000, 'CUSTOM', NULL, 54);
INSERT INTO exam.programming_questions VALUES (16, '#include <iostream>

long long computeFactorial(int n) {
    return 1;
}', '[{"input": "5", "weight": 0.3, "category": "SANITY", "expected_output": "120"}, {"input": "0", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "1"}, {"input": "10", "weight": 0.3, "category": "EDGE", "expected_output": "3628800"}]', NULL, 2, 128000, 'SCALAR', NULL, 54);
INSERT INTO exam.programming_questions VALUES (17, '#include <vector>

int countOccurrences(const std::vector<int>& vec, int target) {
    return 0;
}', '[{"input": "[1, 2, 3, 2, 2, 4], 2", "weight": 0.3, "category": "SANITY", "expected_output": "3"}, {"input": "[5, 5, 5], 1", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "0"}, {"input": "[], 10", "weight": 0.3, "category": "EDGE", "expected_output": "0"}]', NULL, 2, 128000, 'LINEAR', NULL, 54);
INSERT INTO exam.programming_questions VALUES (18, '#include <vector>

int sumGridElements(const std::vector<std::vector<int>>& grid) {
    return 0;
}', '[{"input": "[[1, 2], [3, 4]]", "weight": 0.3, "category": "SANITY", "expected_output": "10"}, {"input": "[[5, -5], [10, -10]]", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "0"}, {"input": "[]", "weight": 0.3, "category": "EDGE", "expected_output": "0"}]', NULL, 2, 128000, 'GRID', NULL, 54);
INSERT INTO exam.programming_questions VALUES (19, 'struct Node {
    int data;
    Node* next;
};

int getLinkedListLength(Node* head) {
    return 0;
}', '[{"input": "[1, 2, 3, 4]", "weight": 0.3, "category": "SANITY", "expected_output": "4"}, {"input": "[10]", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "1"}, {"input": "[]", "weight": 0.3, "category": "EDGE", "expected_output": "0"}]', NULL, 2, 128000, 'LINKED_LIST', NULL, 54);
INSERT INTO exam.programming_questions VALUES (20, '#include <iostream>

int main() {
    return 0;
}', '[{"input": "5 1 -2 3 0 4", "weight": 0.3, "category": "SANITY", "expected_output": "8"}, {"input": "3 -1 -2 -3", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "0"}, {"input": "0", "weight": 0.3, "category": "EDGE", "expected_output": "0"}]', NULL, 2, 128000, 'CUSTOM', NULL, 54);
INSERT INTO exam.programming_questions VALUES (21, '#include <iostream>

int countCollatzSteps(int n) {
    return 0;
}', '[{"input": "6", "weight": 0.3, "category": "SANITY", "expected_output": "8"}, {"input": "1", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "0"}, {"input": "27", "weight": 0.3, "category": "EDGE", "expected_output": "111"}]', NULL, 2, 128000, 'SCALAR', NULL, 54);
INSERT INTO exam.programming_questions VALUES (22, '#include <vector>

int longestNonDecreasingRun(const std::vector<int>& nums) {
    return 0;
}', '[{"input": "[1, 2, 2, 1, 3, 4, 5]", "weight": 0.3, "category": "SANITY", "expected_output": "4"}, {"input": "[5, 4, 3, 2, 1]", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "1"}, {"input": "[]", "weight": 0.3, "category": "EDGE", "expected_output": "0"}]', NULL, 2, 128000, 'LINEAR', NULL, 54);
INSERT INTO exam.programming_questions VALUES (23, '#include <vector>

std::vector<int> computeRowAlternatingSums(const std::vector<std::vector<int>>& grid) {
    return {};
}', '[{"input": "[[1, 2, 3], [4, 5, 6]]", "weight": 0.3, "category": "SANITY", "expected_output": "[2, 5]"}, {"input": "[[10]]", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "[10]"}, {"input": "[]", "weight": 0.3, "category": "EDGE", "expected_output": "[]"}]', NULL, 2, 128000, 'GRID', NULL, 54);
INSERT INTO exam.programming_questions VALUES (24, 'struct Node {
    int data;
    Node* next;
};

int getMiddleNodeData(Node* head) {
    return -1;
}', '[{"input": "[1, 2, 3, 4, 5]", "weight": 0.3, "category": "SANITY", "expected_output": "3"}, {"input": "[1, 2, 3, 4]", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "3"}, {"input": "[]", "weight": 0.3, "category": "EDGE", "expected_output": "-1"}]', NULL, 2, 128000, 'LINKED_LIST', NULL, 54);
INSERT INTO exam.programming_questions VALUES (25, '#include <iostream>

int main() {
    return 0;
}', '[{"input": "315", "weight": 0.3, "category": "SANITY", "expected_output": "3 3 5 7"}, {"input": "13", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "13"}, {"input": "2", "weight": 0.3, "category": "EDGE", "expected_output": "2"}]', NULL, 2, 128000, 'CUSTOM', NULL, 54);
INSERT INTO exam.programming_questions VALUES (26, '#include <iostream>

int calculateDigitalRoot(long long n) {
    return 0;
}', '[{"input": "9875", "weight": 0.3, "category": "SANITY", "expected_output": "2"}, {"input": "0", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "0"}, {"input": "999999999999", "weight": 0.3, "category": "EDGE", "expected_output": "9"}]', NULL, 2, 128000, 'SCALAR', NULL, 54);
INSERT INTO exam.programming_questions VALUES (27, '#include <vector>

int maxSubarraySum(const std::vector<int>& nums) {
    return 0;
}', '[{"input": "[-2, 1, -3, 4, -1, 2, 1, -5, 4]", "weight": 0.3, "category": "SANITY", "expected_output": "6"}, {"input": "[-1, -2, -3]", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "-1"}, {"input": "[]", "weight": 0.3, "category": "EDGE", "expected_output": "0"}]', NULL, 2, 128000, 'LINEAR', NULL, 54);
INSERT INTO exam.programming_questions VALUES (28, '#include <vector>

std::vector<int> spiralTraversal(const std::vector<std::vector<int>>& matrix) {
    return {};
}', '[{"input": "[[1, 2, 3], [4, 5, 6], [7, 8, 9]]", "weight": 0.3, "category": "SANITY", "expected_output": "[1, 2, 3, 6, 9, 8, 7, 4, 5]"}, {"input": "[[1]]", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "[1]"}, {"input": "[]", "weight": 0.3, "category": "EDGE", "expected_output": "[]"}]', NULL, 2, 128000, 'GRID', NULL, 54);
INSERT INTO exam.programming_questions VALUES (29, 'struct Node {
    int data;
    Node* next;
};

Node* reverseLinkedList(Node* head) {
    return nullptr;
}', '[{"input": "[1, 2, 3, 4]", "weight": 0.3, "category": "SANITY", "expected_output": "[4, 3, 2, 1]"}, {"input": "[10]", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "[10]"}, {"input": "[]", "weight": 0.3, "category": "EDGE", "expected_output": "[]"}]', NULL, 2, 128000, 'LINKED_LIST', NULL, 54);
INSERT INTO exam.programming_questions VALUES (30, '#include <iostream>

int main() {
    return 0;
}', '[{"input": "3", "weight": 0.3, "category": "SANITY", "expected_output": "***\\n * \\n***"}, {"input": "5", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "*****\\n *** \\n  *  \\n *** \\n*****"}, {"input": "1", "weight": 0.3, "category": "EDGE", "expected_output": "*"}]', NULL, 2, 128000, 'CUSTOM', NULL, 54);
INSERT INTO exam.programming_questions VALUES (31, '#include <iostream>

double computePower(double base, int exponent = 2) {
    return 0.0;
}', '[{"input": "3.0, 3", "weight": 0.3, "category": "SANITY", "expected_output": "27.0"}, {"input": "5.0, 0", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "1.0"}, {"input": "2.0, 1", "weight": 0.3, "category": "EDGE", "expected_output": "2.0"}]', NULL, 2, 128000, 'SCALAR', NULL, 54);
INSERT INTO exam.programming_questions VALUES (32, '#include <vector>

void incrementElements(std::vector<int>& nums, int step) {
}', '[{"input": "[1, 2, 3], 5", "weight": 0.3, "category": "SANITY", "expected_output": "[6, 7, 8]"}, {"input": "[0, -1], 1", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "[1, 0]"}, {"input": "[], 10", "weight": 0.3, "category": "EDGE", "expected_output": "[]"}]', NULL, 2, 128000, 'LINEAR', NULL, 54);
INSERT INTO exam.programming_questions VALUES (33, '#include <vector>

void scaleGrid(std::vector<std::vector<int>>& grid, int factor) {
}', '[{"input": "[[1, 2], [3, 4]], 2", "weight": 0.3, "category": "SANITY", "expected_output": "[[2, 4], [6, 8]]"}, {"input": "[[5]], 0", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "[[0]]"}, {"input": "[], 3", "weight": 0.3, "category": "EDGE", "expected_output": "[]"}]', NULL, 2, 128000, 'GRID', NULL, 54);
INSERT INTO exam.programming_questions VALUES (34, 'struct Node {
    int data;
    Node* next;
};

void updateHeadValue(Node*& head, int newValue) {
}', '[{"input": "[1, 2, 3], 99", "weight": 0.3, "category": "SANITY", "expected_output": "[99, 2, 3]"}, {"input": "[], 42", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "[42]"}, {"input": "[0], 0", "weight": 0.3, "category": "EDGE", "expected_output": "[0]"}]', NULL, 2, 128000, 'LINKED_LIST', NULL, 54);
INSERT INTO exam.programming_questions VALUES (35, '#include <iostream>

int main() {
    return 0;
}', '[{"input": "3\\na\\nb\\nc", "weight": 0.3, "category": "SANITY", "expected_output": "1\\n2\\n3"}, {"input": "1\\nx", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "1"}, {"input": "0", "weight": 0.3, "category": "EDGE", "expected_output": ""}]', NULL, 2, 128000, 'CUSTOM', NULL, 54);
INSERT INTO exam.programming_questions VALUES (36, '#include <iostream>

bool conditionalSwap(int& a, int& b) {
    return false;
}', '[{"input": "10, 5", "weight": 0.3, "category": "SANITY", "expected_output": "true"}, {"input": "3, 8", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "false"}, {"input": "5, 5", "weight": 0.3, "category": "EDGE", "expected_output": "false"}]', NULL, 2, 128000, 'SCALAR', NULL, 54);
INSERT INTO exam.programming_questions VALUES (37, '#include <vector>
#include <string>

int findTarget(const std::vector<int>& v, int key) {
    return -1;
}', '[{"input": "[10, 20, 30], 20", "weight": 0.3, "category": "SANITY", "expected_output": "1"}, {"input": "[\"apple\", \"banana\"], \"cherry\"", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "-1"}, {"input": "[], 5", "weight": 0.3, "category": "EDGE", "expected_output": "-1"}]', NULL, 2, 128000, 'LINEAR', NULL, 54);
INSERT INTO exam.programming_questions VALUES (38, '#include <vector>

void accumulateGridStats(const std::vector<std::vector<int>>& grid, int& totalSum, int& maxVal) {
}', '[{"input": "[[1, 5], [3, 2]]", "weight": 0.3, "category": "SANITY", "expected_output": "sum=11, max=5"}, {"input": "[[-1, -5]]", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "sum=-6, max=-1"}, {"input": "[]", "weight": 0.3, "category": "EDGE", "expected_output": "sum=0, max=0"}]', NULL, 2, 128000, 'GRID', NULL, 54);
INSERT INTO exam.programming_questions VALUES (39, 'struct Node {
    int data;
    Node* next;
};

void splitListBySign(Node* source, Node*& posHead, Node*& negHead) {
}', '[{"input": "[1, -2, 3, -4]", "weight": 0.3, "category": "SANITY", "expected_output": "pos:[1, 3], neg:[-2, -4]"}, {"input": "[1, 2, 3]", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "pos:[1, 2, 3], neg:[]"}, {"input": "[]", "weight": 0.3, "category": "EDGE", "expected_output": "pos:[], neg:[]"}]', NULL, 2, 128000, 'LINKED_LIST', NULL, 54);
INSERT INTO exam.programming_questions VALUES (40, '#include <iostream>

int main() {
    return 0;
}', '[{"input": "3\\n10\\n20\\n30", "weight": 0.3, "category": "SANITY", "expected_output": "min:10 max:10 avg:10.0\\nmin:10 max:20 avg:15.0\\nmin:10 max:30 avg:20.0"}, {"input": "1\\n5", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "min:5 max:5 avg:5.0"}, {"input": "0", "weight": 0.3, "category": "EDGE", "expected_output": ""}]', NULL, 2, 128000, 'CUSTOM', NULL, 54);
INSERT INTO exam.programming_questions VALUES (41, '#include <iostream>

int executeOp(int a, int b, int (*op)(int, int)) {
    return 0;
}', '[{"input": "5, 3, add", "weight": 0.3, "category": "SANITY", "expected_output": "8"}, {"input": "10, 2, nullptr", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "-1"}, {"input": "0, 0, add", "weight": 0.3, "category": "EDGE", "expected_output": "0"}]', NULL, 2, 128000, 'SCALAR', NULL, 54);
INSERT INTO exam.programming_questions VALUES (42, '#include <vector>

void processPipeline(std::vector<int>& data, int index = 0) {
}', '[{"input": "[1, 2, 3, 4]", "weight": 0.3, "category": "SANITY", "expected_output": "[2, -2, 6, -4]"}, {"input": "[5]", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "[10]"}, {"input": "[]", "weight": 0.3, "category": "EDGE", "expected_output": "[]"}]', NULL, 2, 128000, 'LINEAR', NULL, 54);
INSERT INTO exam.programming_questions VALUES (43, '#include <vector>

void applyMatrixTransform(std::vector<std::vector<int>>& grid, int (*transform)(int) = nullptr) {
}', '[{"input": "[[-1, 2], [3, -4]], nullptr", "weight": 0.3, "category": "SANITY", "expected_output": "[[-2, 0], [0, -8]]"}, {"input": "[[0, 0]], nullptr", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "[[0, 0]]"}, {"input": "[], nullptr", "weight": 0.3, "category": "EDGE", "expected_output": "[]"}]', NULL, 2, 128000, 'GRID', NULL, 54);
INSERT INTO exam.programming_questions VALUES (44, 'struct Node {
    int data;
    Node* next;
};

Node* createTrackedNode(int value, int& activeCount) {
    return nullptr;
}

void destroyNode(Node*& node, int& activeCount) {
}', '[{"input": "create 10", "weight": 0.3, "category": "SANITY", "expected_output": "val:10, count:1"}, {"input": "create 5, destroy", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "val:null, count:0"}, {"input": "destroy null", "weight": 0.3, "category": "EDGE", "expected_output": "count:0"}]', NULL, 2, 128000, 'LINKED_LIST', NULL, 54);
INSERT INTO exam.programming_questions VALUES (45, '#include <iostream>

int main() {
    return 0;
}', '[{"input": "SET x 10\\nPUSH\\nSET x 20\\nGET x\\nPOP\\nGET x", "weight": 0.3, "category": "SANITY", "expected_output": "20\\n10"}, {"input": "GET y", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "UNDEFINED"}, {"input": "PUSH\\nPOP\\nGET z", "weight": 0.3, "category": "EDGE", "expected_output": "UNDEFINED"}]', NULL, 2, 128000, 'CUSTOM', NULL, 54);
INSERT INTO exam.programming_questions VALUES (46, '#include <string>

int countCharFrequency(const std::string& str, char ch) {
    return 0;
}', '[{"input": "\"hello world\", ''l''", "weight": 0.3, "category": "SANITY", "expected_output": "3"}, {"input": "\"cpp\", ''z''", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "0"}, {"input": "\"\", ''a''", "weight": 0.3, "category": "EDGE", "expected_output": "0"}]', NULL, 2, 128000, 'SCALAR', NULL, 54);
INSERT INTO exam.programming_questions VALUES (47, '#include <string>

std::string removeVowels(const std::string& s) {
    return "";
}', '[{"input": "\"LeetCode\"", "weight": 0.3, "category": "SANITY", "expected_output": "\"LtCd\""}, {"input": "\"AEIOU\"", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "\"\""}, {"input": "\"xyz\"", "weight": 0.3, "category": "EDGE", "expected_output": "\"xyz\""}]', NULL, 2, 128000, 'LINEAR', NULL, 54);
INSERT INTO exam.programming_questions VALUES (48, '#include <vector>
#include <string>

std::vector<int> getRowLengths(const std::vector<std::string>& lines) {
    return {};
}', '[{"input": "[\"cat\", \"elephant\", \"a\"]", "weight": 0.3, "category": "SANITY", "expected_output": "[3, 8, 1]"}, {"input": "[\"\"]", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "[0]"}, {"input": "[]", "weight": 0.3, "category": "EDGE", "expected_output": "[]"}]', NULL, 2, 128000, 'GRID', NULL, 54);
INSERT INTO exam.programming_questions VALUES (49, '#include <string>

struct Node {
    int data;
    Node* next;
};

std::string buildStringFromList(Node* head) {
    return "";
}', '[{"input": "[1, 2, 3]", "weight": 0.3, "category": "SANITY", "expected_output": "\"1->2->3\""}, {"input": "[42]", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "\"42\""}, {"input": "[]", "weight": 0.3, "category": "EDGE", "expected_output": "\"\""}]', NULL, 2, 128000, 'LINKED_LIST', NULL, 54);
INSERT INTO exam.programming_questions VALUES (50, '#include <iostream>

int main() {
    return 0;
}', '[{"input": "racecar", "weight": 0.3, "category": "SANITY", "expected_output": "YES"}, {"input": "hello", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "NO"}, {"input": "a", "weight": 0.3, "category": "EDGE", "expected_output": "YES"}]', NULL, 2, 128000, 'CUSTOM', NULL, 54);
INSERT INTO exam.programming_questions VALUES (51, '#include <string>

int calculateCompressedLength(const std::string& s) {
    return 0;
}', '[{"input": "\"aaabbc\"", "weight": 0.3, "category": "SANITY", "expected_output": "6"}, {"input": "\"a\"", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "2"}, {"input": "\"\"", "weight": 0.3, "category": "EDGE", "expected_output": "0"}]', NULL, 2, 128000, 'SCALAR', NULL, 54);
INSERT INTO exam.programming_questions VALUES (52, '#include <string>

std::string reverseWords(const std::string& sentence) {
    return "";
}', '[{"input": "\"Hello World\"", "weight": 0.3, "category": "SANITY", "expected_output": "\"olleH dlroW\""}, {"input": "\"a b c\"", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "\"a b c\""}, {"input": "\"\"", "weight": 0.3, "category": "EDGE", "expected_output": "\"\""}]', NULL, 2, 128000, 'LINEAR', NULL, 54);
INSERT INTO exam.programming_questions VALUES (53, '#include <vector>
#include <string>

std::vector<std::string> transposeCharGrid(const std::vector<std::string>& grid) {
    return {};
}', '[{"input": "[\"abc\", \"def\"]", "weight": 0.3, "category": "SANITY", "expected_output": "[\"ad\", \"be\", \"cf\"]"}, {"input": "[\"x\"]", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "[\"x\"]"}, {"input": "[]", "weight": 0.3, "category": "EDGE", "expected_output": "[]"}]', NULL, 2, 128000, 'GRID', NULL, 54);
INSERT INTO exam.programming_questions VALUES (54, '#include <string>

struct Node {
    char data;
    Node* next;
};

bool isListAnagramOf(Node* head, std::string target) {
    return false;
}', '[{"input": "[''l'', ''i'', ''s'', ''t''], \"silent\"", "weight": 0.3, "category": "SANITY", "expected_output": "false"}, {"input": "[''c'', ''a'', ''t''], \"act\"", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "true"}, {"input": "[], \"\"", "weight": 0.3, "category": "EDGE", "expected_output": "true"}]', NULL, 2, 128000, 'LINKED_LIST', NULL, 54);
INSERT INTO exam.programming_questions VALUES (55, '#include <iostream>

int main() {
    return 0;
}', '[{"input": "abababa\\naba", "weight": 0.3, "category": "SANITY", "expected_output": "0 4"}, {"input": "hello\\nworld", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": ""}, {"input": "aaaa\\naa", "weight": 0.3, "category": "EDGE", "expected_output": "0 2"}]', NULL, 2, 128000, 'CUSTOM', NULL, 54);
INSERT INTO exam.programming_questions VALUES (56, '#include <string>

int lengthOfLongestSubstring(const std::string& s) {
    return 0;
}', '[{"input": "\"abcabcbb\"", "weight": 0.3, "category": "SANITY", "expected_output": "3"}, {"input": "\"bbbbb\"", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "1"}, {"input": "\"\"", "weight": 0.3, "category": "EDGE", "expected_output": "0"}]', NULL, 2, 128000, 'SCALAR', NULL, 54);
INSERT INTO exam.programming_questions VALUES (57, '#include <vector>
#include <string>

std::vector<std::string> sortWordsByAnagramGroup(const std::vector<std::string>& strs) {
    return {};
}', '[{"input": "[\"eat\", \"tea\", \"tan\", \"ate\", \"nat\", \"bat\"]", "weight": 0.3, "category": "SANITY", "expected_output": "[\"eat\", \"tea\", \"ate\", \"tan\", \"nat\", \"bat\"]"}, {"input": "[\"a\"]", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "[\"a\"]"}, {"input": "[]", "weight": 0.3, "category": "EDGE", "expected_output": "[]"}]', NULL, 2, 128000, 'LINEAR', NULL, 54);
INSERT INTO exam.programming_questions VALUES (58, '#include <vector>
#include <string>

bool existWord(const std::vector<std::vector<char>>& board, std::string word) {
    return false;
}', '[{"input": "[[''A'',''B'',''C'',''E''],[''S'',''F'',''C'',''S''],[''A'',''D'',''E'',''E'']], \"ABCCED\"", "weight": 0.3, "category": "SANITY", "expected_output": "true"}, {"input": "[[''A'',''B'']], \"AC\"", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "false"}, {"input": "[], \"A\"", "weight": 0.3, "category": "EDGE", "expected_output": "false"}]', NULL, 2, 128000, 'GRID', NULL, 54);
INSERT INTO exam.programming_questions VALUES (59, 'struct Node {
    char data;
    Node* next;
};

bool isPalindromeList(Node* head) {
    return false;
}', '[{"input": "[''r'', ''a'', ''c'', ''e'', ''c'', ''a'', ''r'']", "weight": 0.3, "category": "SANITY", "expected_output": "true"}, {"input": "[''a'', ''b'']", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "false"}, {"input": "[]", "weight": 0.3, "category": "EDGE", "expected_output": "true"}]', NULL, 2, 128000, 'LINKED_LIST', NULL, 54);
INSERT INTO exam.programming_questions VALUES (60, '#include <iostream>

int main() {
    return 0;
}', '[{"input": "3+2*2", "weight": 0.3, "category": "SANITY", "expected_output": "7"}, {"input": " 3/2 ", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "1"}, {"input": " 3+5 / 2 ", "weight": 0.3, "category": "EDGE", "expected_output": "5"}]', NULL, 2, 128000, 'CUSTOM', NULL, 54);
INSERT INTO exam.programming_questions VALUES (61, '#include <iostream>

int sumByPointer(const int* ptrA, const int* ptrB) {
    return 0;
}', '[{"input": "10, 20", "weight": 0.3, "category": "SANITY", "expected_output": "30"}, {"input": "5, nullptr", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "-1"}, {"input": "nullptr, nullptr", "weight": 0.3, "category": "EDGE", "expected_output": "-1"}]', NULL, 2, 128000, 'SCALAR', NULL, 54);
INSERT INTO exam.programming_questions VALUES (62, '#include <iostream>

int* createArray(int size, int initialValue) {
    return nullptr;
}', '[{"input": "5, 7", "weight": 0.3, "category": "SANITY", "expected_output": "[7, 7, 7, 7, 7]"}, {"input": "1, 0", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "[0]"}, {"input": "0, 10", "weight": 0.3, "category": "EDGE", "expected_output": "nullptr"}]', NULL, 2, 128000, 'LINEAR', NULL, 54);
INSERT INTO exam.programming_questions VALUES (63, '#include <iostream>

int sumRawMatrix(int** matrix, int rows, int cols) {
    return 0;
}', '[{"input": "[[1, 2], [3, 4]], 2, 2", "weight": 0.3, "category": "SANITY", "expected_output": "10"}, {"input": "[[5]], 1, 1", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "5"}, {"input": "nullptr, 0, 0", "weight": 0.3, "category": "EDGE", "expected_output": "0"}]', NULL, 2, 128000, 'GRID', NULL, 54);
INSERT INTO exam.programming_questions VALUES (64, 'struct Node {
    int data;
    Node* next;
};

void deleteHead(Node*& head) {
}', '[{"input": "[10, 20, 30]", "weight": 0.3, "category": "SANITY", "expected_output": "[20, 30]"}, {"input": "[5]", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "[]"}, {"input": "[]", "weight": 0.3, "category": "EDGE", "expected_output": "[]"}]', NULL, 2, 128000, 'LINKED_LIST', NULL, 54);
INSERT INTO exam.programming_questions VALUES (65, '#include <iostream>

int main() {
    return 0;
}', '[{"input": "4\\n10 20 30 40", "weight": 0.3, "category": "SANITY", "expected_output": "25.0"}, {"input": "1\\n5", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "5.0"}, {"input": "2\\n0 0", "weight": 0.3, "category": "EDGE", "expected_output": "0.0"}]', NULL, 2, 128000, 'CUSTOM', NULL, 54);
INSERT INTO exam.programming_questions VALUES (66, '#include <iostream>

void swapPointers(int** ptrA, int** ptrB) {
}', '[{"input": "valA=10, valB=20", "weight": 0.3, "category": "SANITY", "expected_output": "ptrA->20, ptrB->10"}, {"input": "valA=0, valB=-5", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "ptrA->-5, ptrB->0"}, {"input": "nullptr check", "weight": 0.3, "category": "EDGE", "expected_output": "no-op"}]', NULL, 2, 128000, 'SCALAR', NULL, 54);
INSERT INTO exam.programming_questions VALUES (67, '#include <iostream>

int* filterEvenNumbers(const int* arr, int size, int& newSize) {
    return nullptr;
}', '[{"input": "[1, 2, 3, 4, 5], 5", "weight": 0.3, "category": "SANITY", "expected_output": "[2, 4], size=2"}, {"input": "[1, 3, 5], 3", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "nullptr, size=0"}, {"input": "nullptr, 0", "weight": 0.3, "category": "EDGE", "expected_output": "nullptr, size=0"}]', NULL, 2, 128000, 'LINEAR', NULL, 54);
INSERT INTO exam.programming_questions VALUES (68, '#include <iostream>

int** allocateMatrix(int rows, int cols, int initialVal) {
    return nullptr;
}

void freeMatrix(int** matrix, int rows) {
}', '[{"input": "2, 3, 9", "weight": 0.3, "category": "SANITY", "expected_output": "[[9, 9, 9], [9, 9, 9]]"}, {"input": "1, 1, 0", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "[[0]]"}, {"input": "0, 0, 0", "weight": 0.3, "category": "EDGE", "expected_output": "nullptr"}]', NULL, 2, 128000, 'GRID', NULL, 54);
INSERT INTO exam.programming_questions VALUES (69, 'struct Node {
    int data;
    Node* next;
};

void clearLinkedList(Node*& head) {
}', '[{"input": "[1, 2, 3, 4]", "weight": 0.3, "category": "SANITY", "expected_output": "[]"}, {"input": "[10]", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "[]"}, {"input": "[]", "weight": 0.3, "category": "EDGE", "expected_output": "[]"}]', NULL, 2, 128000, 'LINKED_LIST', NULL, 54);
INSERT INTO exam.programming_questions VALUES (70, '#include <iostream>

int main() {
    return 0;
}', '[{"input": "3\\n1 2 3", "weight": 0.3, "category": "SANITY", "expected_output": "1 2 3 cap:4"}, {"input": "1\\n10", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "10 cap:1"}, {"input": "0", "weight": 0.3, "category": "EDGE", "expected_output": "cap:0"}]', NULL, 2, 128000, 'CUSTOM', NULL, 54);
INSERT INTO exam.programming_questions VALUES (71, '#include <cstddef>

ptrdiff_t calculateElementOffset(const int* basePtr, const int* targetPtr) {
    return -1;
}', '[{"input": "arr[0], arr[4]", "weight": 0.3, "category": "SANITY", "expected_output": "4"}, {"input": "arr[2], arr[2]", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "0"}, {"input": "nullptr, arr[1]", "weight": 0.3, "category": "EDGE", "expected_output": "-1"}]', NULL, 2, 128000, 'SCALAR', NULL, 54);
INSERT INTO exam.programming_questions VALUES (72, '#include <iostream>

char* extractSubstrPointer(const char* start, const char* end) {
    return nullptr;
}', '[{"input": "\"hello world\", pos 0 to 5", "weight": 0.3, "category": "SANITY", "expected_output": "\"hello\""}, {"input": "\"cpp\", pos 1 to 1", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "\"\""}, {"input": "nullptr, nullptr", "weight": 0.3, "category": "EDGE", "expected_output": "nullptr"}]', NULL, 2, 128000, 'LINEAR', NULL, 54);
INSERT INTO exam.programming_questions VALUES (73, '#include <iostream>

int* flattenRawMatrix(int** matrix, int rows, int cols) {
    return nullptr;
}', '[{"input": "[[1, 2], [3, 4]], 2, 2", "weight": 0.3, "category": "SANITY", "expected_output": "[1, 2, 3, 4]"}, {"input": "[[5]], 1, 1", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "[5]"}, {"input": "nullptr, 0, 0", "weight": 0.3, "category": "EDGE", "expected_output": "nullptr"}]', NULL, 2, 128000, 'GRID', NULL, 54);
INSERT INTO exam.programming_questions VALUES (74, 'struct Node {
    int data;
    Node* next;
};

Node* deepCopyList(Node* head) {
    return nullptr;
}', '[{"input": "[10, 20, 30]", "weight": 0.3, "category": "SANITY", "expected_output": "[10, 20, 30]"}, {"input": "[5]", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "[5]"}, {"input": "[]", "weight": 0.3, "category": "EDGE", "expected_output": "[]"}]', NULL, 2, 128000, 'LINKED_LIST', NULL, 54);
INSERT INTO exam.programming_questions VALUES (75, '#include <iostream>

int main() {
    return 0;
}', '[{"input": "1000\\nALLOC 200\\nALLOC 300\\nFREE 0", "weight": 0.3, "category": "SANITY", "expected_output": "800\\n500\\n700"}, {"input": "500\\nALLOC 600", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "FAIL"}, {"input": "100\\nALLOC 100", "weight": 0.3, "category": "EDGE", "expected_output": "0"}]', NULL, 2, 128000, 'CUSTOM', NULL, 54);
INSERT INTO exam.programming_questions VALUES (76, '#include <iostream>

int powerRecursive(int base, int exp) {
    return 1;
}', '[{"input": "2, 5", "weight": 0.3, "category": "SANITY", "expected_output": "32"}, {"input": "10, 0", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "1"}, {"input": "3, 1", "weight": 0.3, "category": "EDGE", "expected_output": "3"}]', NULL, 2, 128000, 'SCALAR', NULL, 54);
INSERT INTO exam.programming_questions VALUES (77, '#include <vector>

int recursiveVectorSum(const std::vector<int>& vec, size_t index = 0) {
    return 0;
}', '[{"input": "[1, 2, 3, 4], 0", "weight": 0.3, "category": "SANITY", "expected_output": "10"}, {"input": "[5], 0", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "5"}, {"input": "[], 0", "weight": 0.3, "category": "EDGE", "expected_output": "0"}]', NULL, 2, 128000, 'LINEAR', NULL, 54);
INSERT INTO exam.programming_questions VALUES (78, '#include <vector>

int recursiveGridRowSum(const std::vector<std::vector<int>>& grid, size_t row = 0) {
    return 0;
}', '[{"input": "[[1, 2], [3, 4]], 0", "weight": 0.3, "category": "SANITY", "expected_output": "10"}, {"input": "[[10]], 0", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "10"}, {"input": "[], 0", "weight": 0.3, "category": "EDGE", "expected_output": "0"}]', NULL, 2, 128000, 'GRID', NULL, 54);
INSERT INTO exam.programming_questions VALUES (79, 'struct Node {
    int data;
    Node* next;
};

int recursiveListLength(Node* head) {
    return 0;
}', '[{"input": "[1, 2, 3]", "weight": 0.3, "category": "SANITY", "expected_output": "3"}, {"input": "[42]", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "1"}, {"input": "[]", "weight": 0.3, "category": "EDGE", "expected_output": "0"}]', NULL, 2, 128000, 'LINKED_LIST', NULL, 54);
INSERT INTO exam.programming_questions VALUES (80, '#include <iostream>

int main() {
    return 0;
}', '[{"input": "3", "weight": 0.3, "category": "SANITY", "expected_output": "3 2 1 LIFTOFF"}, {"input": "1", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "1 LIFTOFF"}, {"input": "0", "weight": 0.3, "category": "EDGE", "expected_output": "LIFTOFF"}]', NULL, 2, 128000, 'CUSTOM', NULL, 54);
INSERT INTO exam.programming_questions VALUES (81, '#include <iostream>

int recursiveGCD(int a, int b) {
    return 0;
}', '[{"input": "48, 18", "weight": 0.3, "category": "SANITY", "expected_output": "6"}, {"input": "101, 10", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "1"}, {"input": "0, 5", "weight": 0.3, "category": "EDGE", "expected_output": "5"}]', NULL, 2, 128000, 'SCALAR', NULL, 54);
INSERT INTO exam.programming_questions VALUES (82, '#include <string>

std::string reverseStringRecursive(const std::string& str) {
    return "";
}', '[{"input": "\"hello\"", "weight": 0.3, "category": "SANITY", "expected_output": "\"olleh\""}, {"input": "\"a\"", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "\"a\""}, {"input": "\"\"", "weight": 0.3, "category": "EDGE", "expected_output": "\"\""}]', NULL, 2, 128000, 'LINEAR', NULL, 54);
INSERT INTO exam.programming_questions VALUES (83, '#include <vector>

int countConnectedRegion(std::vector<std::vector<int>>& grid, int r, int c) {
    return 0;
}', '[{"input": "[[1, 1, 0], [1, 0, 0], [0, 0, 1]], 0, 0", "weight": 0.3, "category": "SANITY", "expected_output": "3"}, {"input": "[[0, 0], [0, 0]], 0, 0", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "0"}, {"input": "[[1]], 0, 0", "weight": 0.3, "category": "EDGE", "expected_output": "1"}]', NULL, 2, 128000, 'GRID', NULL, 54);
INSERT INTO exam.programming_questions VALUES (84, 'struct Node {
    int data;
    Node* next;
};

Node* reverseListRecursive(Node* head) {
    return nullptr;
}', '[{"input": "[1, 2, 3]", "weight": 0.3, "category": "SANITY", "expected_output": "[3, 2, 1]"}, {"input": "[10]", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "[10]"}, {"input": "[]", "weight": 0.3, "category": "EDGE", "expected_output": "[]"}]', NULL, 2, 128000, 'LINKED_LIST', NULL, 54);
INSERT INTO exam.programming_questions VALUES (85, '#include <iostream>

int main() {
    return 0;
}', '[{"input": "2", "weight": 0.3, "category": "SANITY", "expected_output": "Move disk 1 from A to B\\nMove disk 2 from A to C\\nMove disk 1 from B to C"}, {"input": "1", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "Move disk 1 from A to C"}, {"input": "0", "weight": 0.3, "category": "EDGE", "expected_output": ""}]', NULL, 2, 128000, 'CUSTOM', NULL, 54);
INSERT INTO exam.programming_questions VALUES (86, '#include <iostream>

int ackermann(int m, int n) {
    return 0;
}', '[{"input": "2, 2", "weight": 0.3, "category": "SANITY", "expected_output": "7"}, {"input": "3, 2", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "29"}, {"input": "0, 0", "weight": 0.3, "category": "EDGE", "expected_output": "1"}]', NULL, 2, 128000, 'SCALAR', NULL, 54);
INSERT INTO exam.programming_questions VALUES (87, '#include <vector>

void generateSubsets(const std::vector<int>& nums, int index, std::vector<int>& current, std::vector<std::vector<int>>& result) {
}', '[{"input": "[1, 2]", "weight": 0.3, "category": "SANITY", "expected_output": "[[], [1], [2], [1, 2]]"}, {"input": "[0]", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "[[], [0]]"}, {"input": "[]", "weight": 0.3, "category": "EDGE", "expected_output": "[[]]"}]', NULL, 2, 128000, 'LINEAR', NULL, 54);
INSERT INTO exam.programming_questions VALUES (88, '#include <vector>

bool hasPath(const std::vector<std::vector<int>>& grid, int r, int c) {
    return false;
}', '[{"input": "[[0, 0, 1], [1, 0, 1], [1, 0, 0]], 0, 0", "weight": 0.3, "category": "SANITY", "expected_output": "true"}, {"input": "[[0, 1], [1, 0]], 0, 0", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "false"}, {"input": "[[0]], 0, 0", "weight": 0.3, "category": "EDGE", "expected_output": "true"}]', NULL, 2, 128000, 'GRID', NULL, 54);
INSERT INTO exam.programming_questions VALUES (89, 'struct Node {
    int data;
    Node* next;
};

Node* mergeSortedListsRecursive(Node* l1, Node* l2) {
    return nullptr;
}', '[{"input": "[1, 3, 5], [2, 4, 6]", "weight": 0.3, "category": "SANITY", "expected_output": "[1, 2, 3, 4, 5, 6]"}, {"input": "[], [1, 2]", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "[1, 2]"}, {"input": "[], []", "weight": 0.3, "category": "EDGE", "expected_output": "[]"}]', NULL, 2, 128000, 'LINKED_LIST', NULL, 54);
INSERT INTO exam.programming_questions VALUES (90, '#include <iostream>

int main() {
    return 0;
}', '[{"input": "4", "weight": 0.3, "category": "SANITY", "expected_output": "2"}, {"input": "8", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "92"}, {"input": "1", "weight": 0.3, "category": "EDGE", "expected_output": "1"}]', NULL, 2, 128000, 'CUSTOM', NULL, 54);
INSERT INTO exam.programming_questions VALUES (91, 'struct Point2D {
    double x;
    double y;
};

double calculateDistance(Point2D p1, Point2D p2) {
    return 0.0;
}', '[{"input": "p1(0,0), p2(3,4)", "weight": 0.3, "category": "SANITY", "expected_output": "5.0"}, {"input": "p1(1,1), p2(1,1)", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "0.0"}, {"input": "p1(-1,-1), p2(2,3)", "weight": 0.3, "category": "EDGE", "expected_output": "5.0"}]', NULL, 2, 128000, 'SCALAR', NULL, 54);
INSERT INTO exam.programming_questions VALUES (92, '#include <string>
#include <vector>

struct Student {
    std::string name;
    std::vector<int> grades;
};

double getStudentGPA(const Student& s) {
    return 0.0;
}', '[{"input": "name=\"Alice\", grades=[90, 80, 100]", "weight": 0.3, "category": "SANITY", "expected_output": "90.0"}, {"input": "name=\"Bob\", grades=[]", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "0.0"}, {"input": "name=\"Eve\", grades=[100]", "weight": 0.3, "category": "EDGE", "expected_output": "100.0"}]', NULL, 2, 128000, 'LINEAR', NULL, 54);
INSERT INTO exam.programming_questions VALUES (93, '#include <vector>

struct Pixel {
    int r, g, b;
};

std::vector<std::vector<int>> computeGrayscaleGrid(const std::vector<std::vector<Pixel>>& image) {
    return {};
}', '[{"input": "[[Pixel(255,255,255), Pixel(0,0,0)]]", "weight": 0.3, "category": "SANITY", "expected_output": "[[255, 0]]"}, {"input": "[[Pixel(10,20,30)]]", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "[[20]]"}, {"input": "[]", "weight": 0.3, "category": "EDGE", "expected_output": "[]"}]', NULL, 2, 128000, 'GRID', NULL, 54);
INSERT INTO exam.programming_questions VALUES (94, 'struct Node {
    int data;
    Node* next;
};

class LinkedListWrapper {
private:
    Node* head;
public:
    LinkedListWrapper() : head(nullptr) {}
    void append(int val) {}
    int getHeadVal() const { return -1; }
};', '[{"input": "append(10), getHeadVal()", "weight": 0.3, "category": "SANITY", "expected_output": "10"}, {"input": "getHeadVal()", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "-1"}, {"input": "append(5), append(20), getHeadVal()", "weight": 0.3, "category": "EDGE", "expected_output": "5"}]', NULL, 2, 128000, 'LINKED_LIST', NULL, 54);
INSERT INTO exam.programming_questions VALUES (95, '#include <iostream>

int main() {
    return 0;
}', '[{"input": "INC\\nINC\\nDEC\\nGET", "weight": 0.3, "category": "SANITY", "expected_output": "1"}, {"input": "GET", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "0"}, {"input": "DEC\\nGET", "weight": 0.3, "category": "EDGE", "expected_output": "-1"}]', NULL, 2, 128000, 'CUSTOM', NULL, 54);
INSERT INTO exam.programming_questions VALUES (96, 'class BankAccount {
private:
    double balance;
public:
    BankAccount(double init = 0.0) : balance(init) {}
    void deposit(double amt) {}
    bool withdraw(double amt) { return false; }
    double getBalance() const { return balance; }
};', '[{"input": "init=100, deposit(50), withdraw(30)", "weight": 0.3, "category": "SANITY", "expected_output": "bal:120.0, withdraw:true"}, {"input": "init=50, withdraw(100)", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "bal:50.0, withdraw:false"}, {"input": "init=0, deposit(0)", "weight": 0.3, "category": "EDGE", "expected_output": "bal:0.0"}]', NULL, 2, 128000, 'SCALAR', NULL, 54);
INSERT INTO exam.programming_questions VALUES (97, '#include <string>

class MyString {
private:
    char* data;
    int len;
public:
    MyString(const char* str = "") {}
    ~MyString() {}
    std::string getString() const { return ""; }
};', '[{"input": "MyString s(\"hello\")", "weight": 0.3, "category": "SANITY", "expected_output": "\"hello\""}, {"input": "MyString s(\"\")", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "\"\""}, {"input": "copy construct s2(s1)", "weight": 0.3, "category": "EDGE", "expected_output": "s2 == s1"}]', NULL, 2, 128000, 'LINEAR', NULL, 54);
INSERT INTO exam.programming_questions VALUES (98, '#include <vector>

class Matrix {
private:
    std::vector<std::vector<int>> data;
public:
    Matrix(int r, int c, int val = 0) : data(r, std::vector<int>(c, val)) {}
    int get(int r, int c) const { return 0; }
    void set(int r, int c, int val) {}
};', '[{"input": "m(2,2,1), set(0,1,5), get(0,1)", "weight": 0.3, "category": "SANITY", "expected_output": "5"}, {"input": "transpose m([[1,2],[3,4]])", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "[[1,3],[2,4]]"}, {"input": "out of bounds get", "weight": 0.3, "category": "EDGE", "expected_output": "-1"}]', NULL, 2, 128000, 'GRID', NULL, 54);
INSERT INTO exam.programming_questions VALUES (99, 'struct Node {
    int data;
    Node* next;
};

class LinkedList {
private:
    Node* head;
public:
    LinkedList() : head(nullptr) {}
    ~LinkedList() {}
    void pushFront(int val) {}
    int popFront() { return -1; }
};', '[{"input": "pushFront(10), pushFront(20), popFront()", "weight": 0.3, "category": "SANITY", "expected_output": "20"}, {"input": "popFront() empty", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "-1"}, {"input": "push 5, pop, pop", "weight": 0.3, "category": "EDGE", "expected_output": "5 then -1"}]', NULL, 2, 128000, 'LINKED_LIST', NULL, 54);
INSERT INTO exam.programming_questions VALUES (100, '#include <iostream>

int main() {
    return 0;
}', '[{"input": "RECT 4 5\\nCIRC 3", "weight": 0.3, "category": "SANITY", "expected_output": "20.0\\n28.274"}, {"input": "RECT 0 10", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "0.0"}, {"input": "CIRC 0", "weight": 0.3, "category": "EDGE", "expected_output": "0.0"}]', NULL, 2, 128000, 'CUSTOM', NULL, 54);
INSERT INTO exam.programming_questions VALUES (101, '#include <iostream>

class Complex {
private:
    double real, imag;
public:
    Complex(double r = 0, double i = 0) : real(r), imag(i) {}
};', '[{"input": "(1+2i) + (3+4i)", "weight": 0.3, "category": "SANITY", "expected_output": "4+6i"}, {"input": "(5+0i) == (5+0i)", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "true"}, {"input": "(0+0i) - (1+1i)", "weight": 0.3, "category": "EDGE", "expected_output": "-1-1i"}]', NULL, 2, 128000, 'SCALAR', NULL, 54);
INSERT INTO exam.programming_questions VALUES (102, '#include <iostream>

class IntVector {
private:
    int* data;
    size_t sz;
    size_t cap;
public:
    IntVector() : data(nullptr), sz(0), cap(0) {}
    ~IntVector() { delete[] data; }
};', '[{"input": "push 1, 2, move assign", "weight": 0.3, "category": "SANITY", "expected_output": "[1, 2]"}, {"input": "copy construct", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "deep copy verified"}, {"input": "empty vector move", "weight": 0.3, "category": "EDGE", "expected_output": "size 0"}]', NULL, 2, 128000, 'LINEAR', NULL, 54);
INSERT INTO exam.programming_questions VALUES (103, '#include <vector>
#include <string>

class Cell {
public:
    virtual ~Cell() = default;
    virtual char render() const = 0;
};', '[{"input": "[[Wall, Empty], [Item, Wall]]", "weight": 0.3, "category": "SANITY", "expected_output": "[\"#.\", \"*#\"]"}, {"input": "[[Empty]]", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "[\".\"]"}, {"input": "[]", "weight": 0.3, "category": "EDGE", "expected_output": "[]"}]', NULL, 2, 128000, 'GRID', NULL, 54);
INSERT INTO exam.programming_questions VALUES (104, 'struct Node {
    int data;
    Node* prev;
    Node* next;
};

class DoublyLinkedList {
private:
    Node* head;
    Node* tail;
public:
    DoublyLinkedList() : head(nullptr), tail(nullptr) {}
    ~DoublyLinkedList() {}
};', '[{"input": "pushFront(1), pushBack(2), popFront()", "weight": 0.3, "category": "SANITY", "expected_output": "pop:1, list:[2]"}, {"input": "popBack empty", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "no-op/error flag"}, {"input": "single item push pop", "weight": 0.3, "category": "EDGE", "expected_output": "empty"}]', NULL, 2, 128000, 'LINKED_LIST', NULL, 54);
INSERT INTO exam.programming_questions VALUES (105, '#include <iostream>

int main() {
    return 0;
}', '[{"input": "CREATE Add 1\\nEXEC 1 10\\nEXEC 1 20", "weight": 0.3, "category": "SANITY", "expected_output": "10\\n30"}, {"input": "EXEC 99 5", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "NOT_FOUND"}, {"input": "CREATE Mult 2\\nEXEC 2 0", "weight": 0.3, "category": "EDGE", "expected_output": "0"}]', NULL, 2, 128000, 'CUSTOM', NULL, 54);
INSERT INTO exam.programming_questions VALUES (106, '#include <vector>
#include <unordered_set>

bool containsElement(const std::vector<int>& vec, int target) {
    return false;
}', '[{"input": "[1, 3, 5, 7], 5", "weight": 0.3, "category": "SANITY", "expected_output": "true"}, {"input": "[1, 2, 3], 10", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "false"}, {"input": "[], 1", "weight": 0.3, "category": "EDGE", "expected_output": "false"}]', NULL, 2, 128000, 'SCALAR', NULL, 54);
INSERT INTO exam.programming_questions VALUES (107, '#include <vector>
#include <set>

std::vector<int> removeDuplicatesSorted(const std::vector<int>& nums) {
    return {};
}', '[{"input": "[4, 2, 2, 1, 4]", "weight": 0.3, "category": "SANITY", "expected_output": "[1, 2, 4]"}, {"input": "[1, 1, 1]", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "[1]"}, {"input": "[]", "weight": 0.3, "category": "EDGE", "expected_output": "[]"}]', NULL, 2, 128000, 'LINEAR', NULL, 54);
INSERT INTO exam.programming_questions VALUES (108, '#include <vector>
#include <set>

std::vector<int> countUniquePerRow(const std::vector<std::vector<int>>& grid) {
    return {};
}', '[{"input": "[[1, 1, 2], [3, 4, 5]]", "weight": 0.3, "category": "SANITY", "expected_output": "[2, 3]"}, {"input": "[[0, 0, 0]]", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "[1]"}, {"input": "[]", "weight": 0.3, "category": "EDGE", "expected_output": "[]"}]', NULL, 2, 128000, 'GRID', NULL, 54);
INSERT INTO exam.programming_questions VALUES (109, '#include <vector>

struct Node {
    int data;
    Node* next;
};

std::vector<int> linkedListToVector(Node* head) {
    return {};
}', '[{"input": "[10, 20, 30]", "weight": 0.3, "category": "SANITY", "expected_output": "[10, 20, 30]"}, {"input": "[5]", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "[5]"}, {"input": "[]", "weight": 0.3, "category": "EDGE", "expected_output": "[]"}]', NULL, 2, 128000, 'LINKED_LIST', NULL, 54);
INSERT INTO exam.programming_questions VALUES (110, '#include <iostream>

int main() {
    return 0;
}', '[{"input": "PUSH 10\\nPUSH 20\\nFRONT\\nPOP\\nFRONT", "weight": 0.3, "category": "SANITY", "expected_output": "10\\n20"}, {"input": "PUSH 5\\nPOP", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": ""}, {"input": "FRONT empty", "weight": 0.3, "category": "EDGE", "expected_output": "EMPTY"}]', NULL, 2, 128000, 'CUSTOM', NULL, 54);
INSERT INTO exam.programming_questions VALUES (111, '#include <vector>
#include <unordered_map>

int findMostFrequent(const std::vector<int>& nums) {
    return 0;
}', '[{"input": "[1, 3, 2, 3, 4, 1, 3]", "weight": 0.3, "category": "SANITY", "expected_output": "3"}, {"input": "[2, 2, 1, 1]", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "1"}, {"input": "[5]", "weight": 0.3, "category": "EDGE", "expected_output": "5"}]', NULL, 2, 128000, 'SCALAR', NULL, 54);
INSERT INTO exam.programming_questions VALUES (112, '#include <string>
#include <stack>

bool isValidParentheses(const std::string& s) {
    return false;
}', '[{"input": "\"()[]{}\"", "weight": 0.3, "category": "SANITY", "expected_output": "true"}, {"input": "\"(]\"", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "false"}, {"input": "\"\"", "weight": 0.3, "category": "EDGE", "expected_output": "true"}]', NULL, 2, 128000, 'LINEAR', NULL, 54);
INSERT INTO exam.programming_questions VALUES (113, '#include <vector>
#include <queue>

int shortestPathGrid(const std::vector<std::vector<int>>& grid) {
    return -1;
}', '[{"input": "[[0,0,0],[1,1,0],[0,0,0]]", "weight": 0.3, "category": "SANITY", "expected_output": "5"}, {"input": "[[0,1],[1,0]]", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "-1"}, {"input": "[[0]]", "weight": 0.3, "category": "EDGE", "expected_output": "1"}]', NULL, 2, 128000, 'GRID', NULL, 54);
INSERT INTO exam.programming_questions VALUES (114, '#include <unordered_set>

struct Node {
    int data;
    Node* next;
};

bool hasCycleSet(Node* head) {
    return false;
}', '[{"input": "1->2->3->2 (cycle)", "weight": 0.3, "category": "SANITY", "expected_output": "true"}, {"input": "1->2->3", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "false"}, {"input": "[]", "weight": 0.3, "category": "EDGE", "expected_output": "false"}]', NULL, 2, 128000, 'LINKED_LIST', NULL, 54);
INSERT INTO exam.programming_questions VALUES (115, '#include <iostream>

int main() {
    return 0;
}', '[{"input": "ADD A 10\\nADD B 50\\nGET", "weight": 0.3, "category": "SANITY", "expected_output": "B"}, {"input": "ADD C 5\\nGET", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "C"}, {"input": "GET empty", "weight": 0.3, "category": "EDGE", "expected_output": "EMPTY"}]', NULL, 2, 128000, 'CUSTOM', NULL, 54);
INSERT INTO exam.programming_questions VALUES (116, '#include <unordered_map>
#include <list>

class LRUCache {
public:
    LRUCache(int capacity) {}
    int get(int key) { return -1; }
    void put(int key, int value) {}
};', '[{"input": "cap=2, put(1,1), put(2,2), get(1), put(3,3), get(2)", "weight": 0.3, "category": "SANITY", "expected_output": "get(1)=1, get(2)=-1"}, {"input": "get non-existent", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "-1"}, {"input": "put update existing key", "weight": 0.3, "category": "EDGE", "expected_output": "updated value returned"}]', NULL, 2, 128000, 'SCALAR', NULL, 54);
INSERT INTO exam.programming_questions VALUES (117, '#include <vector>
#include <deque>

std::vector<int> maxSlidingWindow(const std::vector<int>& nums, int k) {
    return {};
}', '[{"input": "[1,3,-1,-3,5,3,6,7], k=3", "weight": 0.3, "category": "SANITY", "expected_output": "[3,3,5,5,6,7]"}, {"input": "[1], k=1", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "[1]"}, {"input": "[], k=0", "weight": 0.3, "category": "EDGE", "expected_output": "[]"}]', NULL, 2, 128000, 'LINEAR', NULL, 54);
INSERT INTO exam.programming_questions VALUES (118, '#include <vector>
#include <queue>

int minCostGridPath(const std::vector<std::vector<int>>& grid) {
    return 0;
}', '[{"input": "[[1,3,1],[1,5,1],[4,2,1]]", "weight": 0.3, "category": "SANITY", "expected_output": "7"}, {"input": "[[1,2],[1,1]]", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "3"}, {"input": "[[5]]", "weight": 0.3, "category": "EDGE", "expected_output": "5"}]', NULL, 2, 128000, 'GRID', NULL, 54);
INSERT INTO exam.programming_questions VALUES (119, '#include <vector>
#include <queue>

struct Node {
    int data;
    Node* next;
};

Node* mergeKSortedLists(const std::vector<Node*>& lists) {
    return nullptr;
}', '[{"input": "[[1,4,5],[1,3,4],[2,6]]", "weight": 0.3, "category": "SANITY", "expected_output": "[1,1,2,3,4,4,5,6]"}, {"input": "[]", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "[]"}, {"input": "[[]]", "weight": 0.3, "category": "EDGE", "expected_output": "[]"}]', NULL, 2, 128000, 'LINKED_LIST', NULL, 54);
INSERT INTO exam.programming_questions VALUES (120, '#include <iostream>

int main() {
    return 0;
}', '[{"input": "3\\n1\\n2\\n3", "weight": 0.3, "category": "SANITY", "expected_output": "1.0\\n1.5\\n2.0"}, {"input": "1\\n5", "weight": 0.4, "category": "FUNCTIONAL", "expected_output": "5.0"}, {"input": "2\\n10 20", "weight": 0.3, "category": "EDGE", "expected_output": "10.0\\n15.0"}]', NULL, 2, 128000, 'CUSTOM', NULL, 54);


--
-- Data for Name: question_topics; Type: TABLE DATA; Schema: exam; Owner: judge0
--

INSERT INTO exam.question_topics VALUES (1, 1);
INSERT INTO exam.question_topics VALUES (2, 1);
INSERT INTO exam.question_topics VALUES (3, 1);
INSERT INTO exam.question_topics VALUES (4, 1);
INSERT INTO exam.question_topics VALUES (5, 1);
INSERT INTO exam.question_topics VALUES (6, 1);
INSERT INTO exam.question_topics VALUES (7, 1);
INSERT INTO exam.question_topics VALUES (8, 1);
INSERT INTO exam.question_topics VALUES (9, 1);
INSERT INTO exam.question_topics VALUES (10, 1);
INSERT INTO exam.question_topics VALUES (11, 1);
INSERT INTO exam.question_topics VALUES (12, 1);
INSERT INTO exam.question_topics VALUES (13, 1);
INSERT INTO exam.question_topics VALUES (14, 1);
INSERT INTO exam.question_topics VALUES (15, 1);
INSERT INTO exam.question_topics VALUES (16, 2);
INSERT INTO exam.question_topics VALUES (17, 2);
INSERT INTO exam.question_topics VALUES (18, 2);
INSERT INTO exam.question_topics VALUES (19, 2);
INSERT INTO exam.question_topics VALUES (20, 2);
INSERT INTO exam.question_topics VALUES (21, 2);
INSERT INTO exam.question_topics VALUES (22, 2);
INSERT INTO exam.question_topics VALUES (23, 2);
INSERT INTO exam.question_topics VALUES (24, 2);
INSERT INTO exam.question_topics VALUES (25, 2);
INSERT INTO exam.question_topics VALUES (26, 2);
INSERT INTO exam.question_topics VALUES (27, 2);
INSERT INTO exam.question_topics VALUES (28, 2);
INSERT INTO exam.question_topics VALUES (29, 2);
INSERT INTO exam.question_topics VALUES (30, 2);
INSERT INTO exam.question_topics VALUES (31, 3);
INSERT INTO exam.question_topics VALUES (32, 3);
INSERT INTO exam.question_topics VALUES (33, 3);
INSERT INTO exam.question_topics VALUES (34, 3);
INSERT INTO exam.question_topics VALUES (35, 3);
INSERT INTO exam.question_topics VALUES (36, 3);
INSERT INTO exam.question_topics VALUES (37, 3);
INSERT INTO exam.question_topics VALUES (38, 3);
INSERT INTO exam.question_topics VALUES (39, 3);
INSERT INTO exam.question_topics VALUES (40, 3);
INSERT INTO exam.question_topics VALUES (41, 3);
INSERT INTO exam.question_topics VALUES (42, 3);
INSERT INTO exam.question_topics VALUES (43, 3);
INSERT INTO exam.question_topics VALUES (44, 3);
INSERT INTO exam.question_topics VALUES (45, 3);
INSERT INTO exam.question_topics VALUES (46, 4);
INSERT INTO exam.question_topics VALUES (47, 4);
INSERT INTO exam.question_topics VALUES (48, 4);
INSERT INTO exam.question_topics VALUES (49, 4);
INSERT INTO exam.question_topics VALUES (50, 4);
INSERT INTO exam.question_topics VALUES (51, 4);
INSERT INTO exam.question_topics VALUES (52, 4);
INSERT INTO exam.question_topics VALUES (53, 4);
INSERT INTO exam.question_topics VALUES (54, 4);
INSERT INTO exam.question_topics VALUES (55, 4);
INSERT INTO exam.question_topics VALUES (56, 4);
INSERT INTO exam.question_topics VALUES (57, 4);
INSERT INTO exam.question_topics VALUES (58, 4);
INSERT INTO exam.question_topics VALUES (59, 4);
INSERT INTO exam.question_topics VALUES (60, 4);
INSERT INTO exam.question_topics VALUES (61, 5);
INSERT INTO exam.question_topics VALUES (62, 5);
INSERT INTO exam.question_topics VALUES (63, 5);
INSERT INTO exam.question_topics VALUES (64, 5);
INSERT INTO exam.question_topics VALUES (65, 5);
INSERT INTO exam.question_topics VALUES (66, 5);
INSERT INTO exam.question_topics VALUES (67, 5);
INSERT INTO exam.question_topics VALUES (68, 5);
INSERT INTO exam.question_topics VALUES (69, 5);
INSERT INTO exam.question_topics VALUES (70, 5);
INSERT INTO exam.question_topics VALUES (71, 5);
INSERT INTO exam.question_topics VALUES (72, 5);
INSERT INTO exam.question_topics VALUES (73, 5);
INSERT INTO exam.question_topics VALUES (74, 5);
INSERT INTO exam.question_topics VALUES (75, 5);
INSERT INTO exam.question_topics VALUES (76, 6);
INSERT INTO exam.question_topics VALUES (77, 6);
INSERT INTO exam.question_topics VALUES (78, 6);
INSERT INTO exam.question_topics VALUES (79, 6);
INSERT INTO exam.question_topics VALUES (80, 6);
INSERT INTO exam.question_topics VALUES (81, 6);
INSERT INTO exam.question_topics VALUES (82, 6);
INSERT INTO exam.question_topics VALUES (83, 6);
INSERT INTO exam.question_topics VALUES (84, 6);
INSERT INTO exam.question_topics VALUES (85, 6);
INSERT INTO exam.question_topics VALUES (86, 6);
INSERT INTO exam.question_topics VALUES (87, 6);
INSERT INTO exam.question_topics VALUES (88, 6);
INSERT INTO exam.question_topics VALUES (89, 6);
INSERT INTO exam.question_topics VALUES (90, 6);
INSERT INTO exam.question_topics VALUES (91, 7);
INSERT INTO exam.question_topics VALUES (92, 7);
INSERT INTO exam.question_topics VALUES (93, 7);
INSERT INTO exam.question_topics VALUES (94, 7);
INSERT INTO exam.question_topics VALUES (95, 7);
INSERT INTO exam.question_topics VALUES (96, 7);
INSERT INTO exam.question_topics VALUES (97, 7);
INSERT INTO exam.question_topics VALUES (98, 7);
INSERT INTO exam.question_topics VALUES (99, 7);
INSERT INTO exam.question_topics VALUES (100, 7);
INSERT INTO exam.question_topics VALUES (101, 7);
INSERT INTO exam.question_topics VALUES (102, 7);
INSERT INTO exam.question_topics VALUES (103, 7);
INSERT INTO exam.question_topics VALUES (104, 7);
INSERT INTO exam.question_topics VALUES (105, 7);
INSERT INTO exam.question_topics VALUES (106, 8);
INSERT INTO exam.question_topics VALUES (107, 8);
INSERT INTO exam.question_topics VALUES (108, 8);
INSERT INTO exam.question_topics VALUES (109, 8);
INSERT INTO exam.question_topics VALUES (110, 8);
INSERT INTO exam.question_topics VALUES (111, 8);
INSERT INTO exam.question_topics VALUES (112, 8);
INSERT INTO exam.question_topics VALUES (113, 8);
INSERT INTO exam.question_topics VALUES (114, 8);
INSERT INTO exam.question_topics VALUES (115, 8);
INSERT INTO exam.question_topics VALUES (116, 8);
INSERT INTO exam.question_topics VALUES (117, 8);
INSERT INTO exam.question_topics VALUES (118, 8);
INSERT INTO exam.question_topics VALUES (119, 8);
INSERT INTO exam.question_topics VALUES (120, 8);


--
-- Data for Name: questions; Type: TABLE DATA; Schema: exam; Owner: judge0
--

INSERT INTO exam.questions VALUES (1, 'programming', 'Temperature Scale Converter', 'Write a function `double convertTemperature(double temp, char scale)` that converts temperature between Celsius and Fahrenheit. If scale is ''C'', convert temp from Fahrenheit to Celsius. If scale is ''F'', convert temp from Celsius to Fahrenheit. Return the converted temperature.', '2026-07-20 10:36:40.075617+00', 'easy', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (2, 'programming', 'Basic Sign Classifier Vector', 'Write a function `std::vector<int> classifySigns(const std::vector<int>& numbers)` that returns a new vector where positive numbers are replaced by 1, negative numbers by -1, and zeros remain 0.', '2026-07-20 10:36:40.075617+00', 'easy', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (3, 'programming', 'Quadratic Quadrant Validation Grid', 'Write a function `std::vector<std::vector<int>> checkQuadrantSigns(const std::vector<std::vector<int>>& grid)` that takes a 2x2 grid representing points (x, y) and returns a 2x2 grid containing 1 if both x and y are positive, 2 if x is negative and y is positive, 3 if both are negative, 4 if x is positive and y is negative, and 0 if any axis is 0.', '2026-07-20 10:36:40.075617+00', 'easy', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (4, 'programming', 'First Node Sign Checker', 'Given the head of a linked list, return 1 if the head node data is positive, -1 if negative, and 0 if it is 0 or if the list is nullptr.', '2026-07-20 10:36:40.075617+00', 'easy', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (5, 'programming', 'Leap Year Evaluator', 'Write a complete C++ program that reads an integer year from standard input and prints "LEAP" if the year is a leap year, or "COMMON" otherwise. A year is leap if it is divisible by 4, except for end-of-century years which must be divisible by 400.', '2026-07-20 10:36:40.075617+00', 'easy', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (6, 'programming', 'Tax Bracket Calculator', 'Write a function `double calculateTax(double income)` that computes income tax using progressive brackets: 0% up to 10000, 10% for 10001-40000, 20% for 40001-80000, and 30% for amounts above 80000. Return total tax formatted rounded to 2 decimal places.', '2026-07-20 10:36:40.075617+00', 'medium', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (7, 'programming', 'Conditional Multi-State Flag Classifier', 'Write a function `std::vector<int> processFlags(const std::vector<int>& values)` that maps each integer: if divisible by 3 and 5 return 35, else if divisible by 3 return 3, else if divisible by 5 return 5, else return the value itself.', '2026-07-20 10:36:40.075617+00', 'medium', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (8, 'programming', 'Grid Boundary Validity Check', 'Write a function `std::vector<std::vector<int>> checkBoundaryStatus(const std::vector<std::vector<int>>& grid)` that marks elements in a grid: return a grid of same shape where boundary cells keep their original values and interior cells are replaced with -1 if positive, -2 if negative, or 0.', '2026-07-20 10:36:40.075617+00', 'medium', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (9, 'programming', 'Two-Node Order Check', 'Write a function `int evaluateFirstTwoNodes(Node* head)` that inspects the first two nodes of a list. Return 1 if first > second, -1 if first < second, 0 if equal, and -99 if fewer than two nodes exist.', '2026-07-20 10:36:40.075617+00', 'medium', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (10, 'programming', 'Valid Date Identifier', 'Write a full program that reads three integers (day, month, year) from stdin and prints "VALID" if they represent a valid calendar date (accounting for leap years in February) or "INVALID" otherwise.', '2026-07-20 10:36:40.075617+00', 'medium', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (11, 'programming', 'Complex Bitwise State Resolver', 'Write a function `int resolveState(int flags, int mask, int trigger)` that evaluates bitwise logic: if (flags & mask) equals mask and trigger bit (1 << trigger) is set, return (flags ^ mask); if only mask condition holds, return (flags | mask); otherwise return ~flags.', '2026-07-20 10:36:40.075617+00', 'hard', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (12, 'programming', 'Nested Logical Conditional Pipeline', 'Write a function `std::vector<int> pipelineTransform(const std::vector<int>& vec, int threshold)` that transforms each element x: if x > threshold and x is even, x = x / 2; if x > threshold and x is odd, x = x * 3 + 1; if x <= threshold and x is negative, x = -x; else x remains unchanged.', '2026-07-20 10:36:40.075617+00', 'hard', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (13, 'programming', 'Saddle Cell Classifier', 'Write a function `std::vector<std::vector<int>> evaluateSaddlePositions(const std::vector<std::vector<int>>& grid)` that returns a grid of same dimensions where cell (i,j) is 1 if grid[i][j] is strictly greater than all horizontal neighbors and strictly smaller than all vertical neighbors, else 0. (Corner/edge cells compare against existing neighbors only).', '2026-07-20 10:36:40.075617+00', 'hard', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (14, 'programming', 'Triple Node Conditional Pattern', 'Write a function `bool verifyTriplePattern(Node* head)` that returns true if the first three nodes follow the strict relationship A < B and B > C, or A > B and B < C. If fewer than three nodes exist, return false.', '2026-07-20 10:36:40.075617+00', 'hard', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (15, 'programming', 'Interval Intersection Calculator', 'Write a full program that reads four integers representing two closed 1D intervals [a, b] and [c, d] from stdin. Print the intersection interval as "x y" if they overlap, or "NONE" if they do not overlap. (Assume input intervals are valid with a <= b and c <= d).', '2026-07-20 10:36:40.075617+00', 'hard', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (16, 'programming', 'Factorial Computation', 'Write a function `long long computeFactorial(int n)` that computes and returns n! (n factorial) using an iterative loop. Return 1 for n = 0.', '2026-07-20 10:36:40.075617+00', 'easy', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (17, 'programming', 'Element Frequency Counter', 'Write a function `int countOccurrences(const std::vector<int>& vec, int target)` that uses a loop to return how many times target appears in the vector.', '2026-07-20 10:36:40.075617+00', 'easy', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (18, 'programming', 'Grid Summation', 'Write a function `int sumGridElements(const std::vector<std::vector<int>>& grid)` that iterates through all elements of a 2D vector using nested loops and returns their sum.', '2026-07-20 10:36:40.075617+00', 'easy', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (19, 'programming', 'Iterative List Length', 'Write a function `int getLinkedListLength(Node* head)` that uses a while loop to count and return the total number of nodes in a linked list.', '2026-07-20 10:36:40.075617+00', 'easy', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (20, 'programming', 'Sum of N Positive Integers', 'Write a full program that reads an integer N from standard input, followed by N integers. Compute and print the sum of all positive integers in the input sequence.', '2026-07-20 10:36:40.075617+00', 'easy', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (21, 'programming', 'Collatz Sequence Step Counter', 'Write a function `int countCollatzSteps(int n)` that calculates the number of steps required to reach 1 using the Collatz conjecture: if n is even, divide by 2; if odd, multiply by 3 and add 1. Return 0 if n is 1 or less.', '2026-07-20 10:38:09.337739+00', 'medium', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (22, 'programming', 'Longest Consecutive Monotonic Subsegment', 'Write a function `int longestNonDecreasingRun(const std::vector<int>& nums)` that uses iteration to find and return the length of the longest contiguous subsegment where elements are non-decreasing. Return 0 if the vector is empty.', '2026-07-20 10:38:09.337739+00', 'medium', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (23, 'programming', 'Spiral Row Sum Accumulator', 'Write a function `std::vector<int> computeRowAlternatingSums(const std::vector<std::vector<int>>& grid)` that computes for each row the sum formed by adding even-indexed elements and subtracting odd-indexed elements.', '2026-07-20 10:38:09.337739+00', 'medium', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (24, 'programming', 'Find Middle Node Data', 'Write a function `int getMiddleNodeData(Node* head)` that uses a two-pointer iteration approach (slow/fast) to return the data of the middle node. If the list has an even number of nodes, return the data of the second middle node. Return -1 if list is empty.', '2026-07-20 10:38:09.337739+00', 'medium', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (25, 'programming', 'Prime Factor Printer', 'Write a complete program that reads an integer N (> 1) from stdin and prints its prime factors in ascending order separated by single spaces.', '2026-07-20 10:38:09.337739+00', 'medium', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (26, 'programming', 'Digital Root Calculation', 'Write a function `int calculateDigitalRoot(long long n)` that repeatedly sums the digits of n iteratively until a single-digit number is produced. Return that single digit.', '2026-07-20 10:38:09.337739+00', 'hard', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (27, 'programming', 'Maximum Subarray Sum (Kadane)', 'Write a function `int maxSubarraySum(const std::vector<int>& nums)` that uses Kadane''s iterative algorithm to compute and return the maximum contiguous subarray sum. If vector is empty, return 0.', '2026-07-20 10:38:09.337739+00', 'hard', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (28, 'programming', 'Spiral Matrix Order Traverse', 'Write a function `std::vector<int> spiralTraversal(const std::vector<std::vector<int>>& matrix)` that uses loops to traverse an m x n matrix in spiral order and returns all elements in a single 1D vector.', '2026-07-20 10:38:09.337739+00', 'hard', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (29, 'programming', 'In-Place Iterative List Reversal', 'Write a function `Node* reverseLinkedList(Node* head)` that iteratively reverses a singly linked list in-place and returns the new head pointer.', '2026-07-20 10:38:09.337739+00', 'hard', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (30, 'programming', 'Pattern Printing Hourglass', 'Write a full program that reads an odd integer N (N >= 3) from standard input and prints an hourglass pattern using asterisk characters (`*`).', '2026-07-20 10:38:09.337739+00', 'hard', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (31, 'programming', 'Default Parameter Math Utility', 'Write a function `double computePower(double base, int exponent = 2)` that computes `base` raised to `exponent` using standard loop operations. (Exponent is guaranteed non-negative).', '2026-07-20 10:38:09.337739+00', 'easy', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (32, 'programming', 'Pass-by-Reference Incrementor', 'Write a function `void incrementElements(std::vector<int>& nums, int step)` that increments each element of the passed vector by `step` using pass-by-reference.', '2026-07-20 10:38:09.337739+00', 'easy', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (33, 'programming', 'Overloaded Grid Scaler', 'Write overloaded functions `void scaleGrid(std::vector<std::vector<int>>& grid, int factor)` and `void scaleGrid(std::vector<std::vector<int>>& grid, double factor)` that multiply each grid entry by the given factor.', '2026-07-20 10:38:09.337739+00', 'easy', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (34, 'programming', 'Scope Modifying Node Value', 'Write a function `void updateHeadValue(Node*& head, int newValue)` that updates the data field of the head node using reference-to-pointer, or creates a new node if head is nullptr.', '2026-07-20 10:38:09.337739+00', 'easy', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (35, 'programming', 'Static Counter Scope Program', 'Write a complete program that reads inputs line by line. Define a helper function with a static counter variable that tracks how many total inputs have been processed across function calls and prints the count.', '2026-07-20 10:38:09.337739+00', 'easy', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (36, 'programming', 'Reference Parameter Swap Logic', 'Write a function `bool conditionalSwap(int& a, int& b)` that swaps the values of `a` and `b` if and only if `a > b`. Return true if a swap occurred, false otherwise.', '2026-07-20 10:38:09.337739+00', 'medium', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (37, 'programming', 'Overloaded Vector Search', 'Write two overloaded functions: `int findTarget(const std::vector<int>& v, int key)` and `int findTarget(const std::vector<std::string>& v, const std::string& key)` that return the first 0-based index of key, or -1 if not found.', '2026-07-20 10:38:09.337739+00', 'medium', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (38, 'programming', 'Global Scope Counter Tracker', 'Write a function `void accumulateGridStats(const std::vector<std::vector<int>>& grid, int& totalSum, int& maxVal)` that uses output reference parameters to return both total sum and max value in a grid.', '2026-07-20 10:38:09.337739+00', 'medium', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (39, 'programming', 'Function Scope List Splitter', 'Write a function `void splitListBySign(Node* source, Node*& posHead, Node*& negHead)` that takes a source list and assigns positive nodes into `posHead` list and negative nodes into `negHead` list.', '2026-07-20 10:38:09.337739+00', 'medium', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (40, 'programming', 'Function Scope State Machine Program', 'Write a complete program demonstrating function scope and static variables by reading numbers and calling a function `trackStats(int val)` that maintains running minimum, maximum, and average, printing them after each input.', '2026-07-20 10:38:09.337739+00', 'medium', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (41, 'programming', 'Stateful Counter with Function Pointers', 'Write a function `int executeOp(int a, int b, int (*op)(int, int))` that applies the function pointer `op` to `a` and `b`, but keeps track of how many total operations were executed using a static internal variable. If `op` is nullptr, return -1 without incrementing the counter. Return the operation result.', '2026-07-20 10:39:13.715+00', 'hard', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (42, 'programming', 'Recursive Function Reference Pipeline', 'Write a function `void processPipeline(std::vector<int>& data, int index = 0)` that modifies `data` in-place using default arguments and recursion: if `index` is even, double `data[index]`; if odd, negate it.', '2026-07-20 10:39:13.715+00', 'hard', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (43, 'programming', 'Grid Transformation with Default Function Traversal', 'Write a function `void applyMatrixTransform(std::vector<std::vector<int>>& grid, int (*transform)(int) = nullptr)` that applies `transform` to every element in-place. If `transform` is nullptr, double all negative numbers and zero out positives.', '2026-07-20 10:39:13.715+00', 'hard', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (44, 'programming', 'Static Node Allocation Tracker', 'Write a function `Node* createTrackedNode(int value, int& activeCount)` that dynamically allocates a new `Node`, increments `activeCount`, and returns the node pointer. Also write `void destroyNode(Node*& node, int& activeCount)` which deletes the node, sets pointer to nullptr, and decrements `activeCount`.', '2026-07-20 10:39:13.715+00', 'hard', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (45, 'programming', 'Scoped Symbol Table Manager', 'Write a complete C++ program that reads commands `PUSH`, `POP`, `SET var val`, and `GET var`. Maintain a stack of scope variable maps. Printing `GET` checks the most local scope moving outward to global. Output `UNDEFINED` if the variable is missing.', '2026-07-20 10:39:13.715+00', 'hard', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (46, 'programming', 'String Character Frequency Count', 'Write a function `int countCharFrequency(const std::string& str, char ch)` that counts and returns how many times character `ch` appears in string `str`.', '2026-07-20 10:39:13.715+00', 'easy', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (47, 'programming', 'Vowel Stripper', 'Write a function `std::string removeVowels(const std::string& s)` that returns a new string with all vowels (a, e, i, o, u, case-insensitive) removed.', '2026-07-20 10:39:13.715+00', 'easy', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (48, 'programming', 'Row Length Analyzer Grid', 'Write a function `std::vector<int> getRowLengths(const std::vector<std::string>& lines)` that returns a vector containing the string length of each line in `lines`.', '2026-07-20 10:39:13.715+00', 'easy', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (49, 'programming', 'String Conversion from List', 'Given the head of a linked list storing integers, write a function `std::string buildStringFromList(Node* head)` that returns a string representation of the elements separated by `->` (e.g., "1->2->3"). Return empty string if head is nullptr.', '2026-07-20 10:39:13.715+00', 'easy', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (50, 'programming', 'Palindrome String Checker Program', 'Write a complete program that reads a single word from standard input and prints `YES` if it is an exact palindrome or `NO` otherwise.', '2026-07-20 10:39:13.715+00', 'easy', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (51, 'programming', 'Run Length Encoding Length Calculator', 'Write a function `int calculateCompressedLength(const std::string& s)` that returns what the length of string `s` would be after applying Run-Length Encoding (e.g. "aaabb" -> "a3b2" length 4).', '2026-07-20 10:39:13.715+00', 'medium', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (52, 'programming', 'Word Inversion in Sentence', 'Write a function `std::string reverseWords(const std::string& sentence)` that reverses the order of characters in each word of `sentence` while maintaining word space order.', '2026-07-20 10:39:13.715+00', 'medium', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (53, 'programming', '2D Character Matrix Transpose', 'Write a function `std::vector<std::string> transposeCharGrid(const std::vector<std::string>& grid)` that returns the transpose of a grid of equal length strings.', '2026-07-20 10:39:13.715+00', 'medium', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (54, 'programming', 'Linked List String Anagram Matcher', 'Given a linked list where nodes store `char` data, write a function `bool isListAnagramOf(Node* head, std::string target)` that checks whether the character sequence in the list forms an anagram of `target`.', '2026-07-20 10:39:13.715+00', 'medium', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (55, 'programming', 'SubString Frequency Finder Program', 'Write a complete program that reads a text string and a target substring, then prints the start indices of all non-overlapping occurrences of target in text.', '2026-07-20 10:39:13.715+00', 'medium', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (56, 'programming', 'Longest Substring Without Repeating Characters', 'Write a function `int lengthOfLongestSubstring(const std::string& s)` that returns the length of the longest substring without repeating characters using sliding window.', '2026-07-20 10:39:13.715+00', 'hard', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (57, 'programming', 'Group Anagrams Pipeline', 'Write a function `std::vector<std::string> sortWordsByAnagramGroup(const std::vector<std::string>& strs)` that sorts the string list such that all anagrams are placed adjacent to each other.', '2026-07-20 10:39:13.715+00', 'hard', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (58, 'programming', 'Word Search in Character Grid', 'Write a function `bool existWord(const std::vector<std::vector<char>>& board, std::string word)` that determines if `word` can be constructed from letters of sequentially adjacent cells (horizontally or vertically).', '2026-07-20 10:39:13.715+00', 'hard', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (59, 'programming', 'Palindrome Linked List Character Checker', 'Write a function `bool isPalindromeList(Node* head)` that checks if a singly linked list storing characters is a palindrome in O(N) time and O(1) extra space.', '2026-07-20 10:39:13.715+00', 'hard', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (60, 'programming', 'String Expression Evaluator', 'Write a complete program that evaluates a string mathematical expression containing non-negative integers, `+`, `-`, `*`, and `/` operators (without parentheses) respecting operator precedence.', '2026-07-20 10:39:13.715+00', 'hard', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (61, 'programming', 'Pointer Value Dereference Addition', 'Write a function `int sumByPointer(const int* ptrA, const int* ptrB)` that dereferences two integer pointers and returns their sum. If either pointer is nullptr, return -1.', '2026-07-20 10:40:17.455856+00', 'easy', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (62, 'programming', 'Dynamic Array Allocation and Fill', 'Write a function `int* createArray(int size, int initialValue)` that dynamically allocates an array of `size` integers on the heap using `new`, initializes all elements to `initialValue`, and returns the pointer.', '2026-07-20 10:40:17.455856+00', 'easy', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (63, 'programming', 'Raw Pointer 2D Array Sum', 'Write a function `int sumRawMatrix(int** matrix, int rows, int cols)` that computes the sum of all elements in a dynamically allocated 2D array (pointer to pointers). Return 0 if matrix is nullptr or rows/cols <= 0.', '2026-07-20 10:40:17.455856+00', 'easy', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (64, 'programming', 'Head Node Memory Deallocation', 'Write a function `void deleteHead(Node*& head)` that deletes the head node of a singly linked list using `delete` and updates `head` pointer to point to the next node. Do nothing if `head` is nullptr.', '2026-07-20 10:40:17.455856+00', 'easy', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (65, 'programming', 'Dynamic Allocation and Deallocation Program', 'Write a complete C++ program that reads an integer N, dynamically allocates an integer array of size N using `new`, reads N integers into it, prints their average, and frees the memory using `delete[]`.', '2026-07-20 10:40:17.455856+00', 'easy', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (66, 'programming', 'Pointer Swap Function', 'Write a function `void swapPointers(int** ptrA, int** ptrB)` that swaps the targets pointed to by two double pointers `ptrA` and `ptrB`.', '2026-07-20 10:40:17.455856+00', 'medium', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (67, 'programming', 'Raw Pointer Buffer Filter', 'Write a function `int* filterEvenNumbers(const int* arr, int size, int& newSize)` that dynamically allocates a new array containing only the even integers from `arr`, updating `newSize` accordingly. Return nullptr if no evens exist.', '2026-07-20 10:40:17.455856+00', 'medium', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (68, 'programming', 'Dynamic Matrix Allocation and Deallocation', 'Write a function `int** allocateMatrix(int rows, int cols, int initialVal)` that dynamically allocates a 2D array of integers on the heap, initializes every cell to `initialVal`, and returns the `int**` pointer. Write a paired `void freeMatrix(int** matrix, int rows)` function.', '2026-07-20 10:40:17.455856+00', 'medium', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (69, 'programming', 'Entire List Deallocation', 'Write a function `void clearLinkedList(Node*& head)` that sequentially deallocates all nodes in a singly linked list using pointers and `delete`, resetting `head` to `nullptr` without memory leaks.', '2026-07-20 10:40:17.455856+00', 'medium', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (70, 'programming', 'Custom Pointer Based Dynamic Array Resizer', 'Write a complete C++ program that reads integers continuously from stdin into a dynamically resized raw pointer array (doubling capacity when full). Print final elements and current capacity separated by space.', '2026-07-20 10:40:17.455856+00', 'medium', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (71, 'programming', 'Pointer Arithmetic Distance and Alignment', 'Write a function `ptrdiff_t calculateElementOffset(const int* basePtr, const int* targetPtr)` that uses pointer arithmetic to return the element distance between `targetPtr` and `basePtr`. Return -1 if either pointer is nullptr or if `targetPtr < basePtr`.', '2026-07-20 10:40:17.455856+00', 'hard', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (72, 'programming', 'In-Place Pointer Substring Extractor', 'Write a function `char* extractSubstrPointer(const char* start, const char* end)` that uses raw pointers to extract characters between `start` (inclusive) and `end` (exclusive) into a newly allocated C-string on the heap. Return nullptr if invalid pointers.', '2026-07-20 10:40:17.455856+00', 'hard', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (73, 'programming', 'Flatten 2D Dynamic Pointer Array', 'Write a function `int* flattenRawMatrix(int** matrix, int rows, int cols)` that allocates a single 1D array containing all elements of `matrix` in row-major order using pointer traversal. Return nullptr if invalid dimensions.', '2026-07-20 10:40:17.455856+00', 'hard', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (74, 'programming', 'Deep Copy Linked List with Raw Pointers', 'Write a function `Node* deepCopyList(Node* head)` that creates a completely new, independent duplicate of a linked list by allocating new nodes with `new`, returning the head of the new list.', '2026-07-20 10:40:17.455856+00', 'hard', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (75, 'programming', 'Custom Heap Memory Pool Simulator', 'Write a complete C++ program simulating a simple fixed-size dynamic memory allocator. Read commands `ALLOC size` and `FREE ptr_index` and print the remaining free heap bytes after each command.', '2026-07-20 10:40:17.455856+00', 'hard', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (76, 'programming', 'Recursive Power Function', 'Write a recursive function `int powerRecursive(int base, int exp)` that computes `base^exp`. Base case: `exp == 0` returns 1.', '2026-07-20 10:40:17.455856+00', 'easy', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (77, 'programming', 'Recursive Vector Sum', 'Write a recursive function `int recursiveVectorSum(const std::vector<int>& vec, size_t index = 0)` that returns the sum of elements from `index` to the end of the vector.', '2026-07-20 10:40:17.455856+00', 'easy', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (78, 'programming', 'Recursive Grid Row Sum', 'Write a recursive function `int recursiveGridRowSum(const std::vector<std::vector<int>>& grid, size_t row = 0)` that calculates the sum of all elements in the grid by processing one row recursively per call.', '2026-07-20 10:40:17.455856+00', 'easy', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (79, 'programming', 'Recursive Linked List Length', 'Write a recursive function `int recursiveListLength(Node* head)` that calculates and returns the number of nodes in a linked list.', '2026-07-20 10:40:17.455856+00', 'easy', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (80, 'programming', 'Recursive Countdown Printer Program', 'Write a complete C++ program that reads an integer N from stdin and recursively prints numbers from N down to 1 separated by spaces, followed by "LIFTOFF".', '2026-07-20 10:40:17.455856+00', 'easy', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (81, 'programming', 'Recursive Greatest Common Divisor', 'Write a recursive function `int recursiveGCD(int a, int b)` implementing Euclidean algorithm. Base case: `b == 0` returns `a`. Assume non-negative inputs.', '2026-07-20 10:41:10.219682+00', 'medium', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (82, 'programming', 'Recursive String Reversal', 'Write a recursive function `std::string reverseStringRecursive(const std::string& str)` that returns the reversed string without using loops.', '2026-07-20 10:41:10.219682+00', 'medium', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (83, 'programming', 'Recursive Flood Fill Area Counter', 'Write a recursive function `int countConnectedRegion(std::vector<std::vector<int>>& grid, int r, int c)` that counts the size of a connected region of 1s starting at (r,c) and mutates visited 1s to 0.', '2026-07-20 10:41:10.219682+00', 'medium', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (84, 'programming', 'Recursive Linked List Reversal', 'Write a recursive function `Node* reverseListRecursive(Node* head)` that reverses a singly linked list recursively and returns the new head node.', '2026-07-20 10:41:10.219682+00', 'medium', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (85, 'programming', 'Tower of Hanoi Move Counter', 'Write a complete C++ program that reads integer N disks from stdin and recursively prints each move required to solve the Tower of Hanoi problem from peg A to peg C using peg B.', '2026-07-20 10:41:10.219682+00', 'medium', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (86, 'programming', 'Ackermann Function Calculation', 'Write a recursive function `int ackermann(int m, int n)` that computes the Ackermann value: `A(0,n) = n+1`, `A(m,0) = A(m-1,1)`, `A(m,n) = A(m-1, A(m, n-1))`.', '2026-07-20 10:41:10.219682+00', 'hard', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (87, 'programming', 'Recursive Subset Generator', 'Write a recursive function `void generateSubsets(const std::vector<int>& nums, int index, std::vector<int>& current, std::vector<std::vector<int>>& result)` that populates `result` with all subset combinations.', '2026-07-20 10:41:10.219682+00', 'hard', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (88, 'programming', 'Grid Path Search with Backtracking', 'Write a recursive function `bool hasPath(const std::vector<std::vector<int>>& grid, int r, int c)` that uses backtracking to determine if a path of 0s exists from top-left (0,0) to bottom-right (m-1, n-1).', '2026-07-20 10:41:10.219682+00', 'hard', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (89, 'programming', 'Recursive Merge Two Sorted Lists', 'Write a recursive function `Node* mergeSortedListsRecursive(Node* l1, Node* l2)` that merges two sorted singly linked lists into one sorted list recursively.', '2026-07-20 10:41:10.219682+00', 'hard', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (90, 'programming', 'N-Queens Solutions Counter', 'Write a complete C++ program that reads integer board size N from stdin and prints the total number of valid placement solutions for the N-Queens problem using recursive backtracking.', '2026-07-20 10:41:10.219682+00', 'hard', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (91, 'programming', 'Point2D Distance Struct', 'Define a struct `Point2D` with members `double x, y;`. Write a function `double calculateDistance(Point2D p1, Point2D p2)` returning Euclidean distance between them.', '2026-07-20 10:41:10.219682+00', 'easy', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (92, 'programming', 'Student Grade Point Average Evaluator', 'Define struct `Student` with `std::string name; std::vector<int> grades;`. Write a function `double getStudentGPA(const Student& s)` that returns average grade or 0.0 if vector is empty.', '2026-07-20 10:41:10.219682+00', 'easy', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (93, 'programming', 'Pixel Image Grid Brightness Extractor', 'Define struct `Pixel` with `int r, g, b;`. Write a function `std::vector<std::vector<int>> computeGrayscaleGrid(const std::vector<std::vector<Pixel>>& image)` returning 2D grid of average RGB values.', '2026-07-20 10:41:10.219682+00', 'easy', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (94, 'programming', 'Linked List Node Data Encapsulator Class', 'Create a C++ class `LinkedListWrapper` containing `Node* head;`. Implement `void append(int val)` and `int getHeadVal() const`. Return -1 if head is nullptr.', '2026-07-20 10:41:10.219682+00', 'easy', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (95, 'programming', 'Counter Class Operations Program', 'Write a complete program implementing a `Counter` class with methods `increment()`, `decrement()`, and `getValue()`. Read standard input commands and print counter value when requested.', '2026-07-20 10:41:10.219682+00', 'easy', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (96, 'programming', 'BankAccount Encapsulation Class', 'Implement a `BankAccount` class with private `double balance`. Include constructor `BankAccount(double init)`, `void deposit(double amt)`, `bool withdraw(double amt)` (returns false if insufficient funds), and `double getBalance() const`.', '2026-07-20 10:41:10.219682+00', 'medium', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (97, 'programming', 'Custom String Class Wrapper', 'Create a class `MyString` with private `char* data` and `int len`. Implement parameterized constructor, copy constructor, destructor, and method `std::string getString() const`.', '2026-07-20 10:41:10.219682+00', 'medium', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (98, 'programming', 'Matrix Class with Element Access', 'Create a class `Matrix` encapsulating a 2D vector. Implement `int get(int r, int c) const`, `void set(int r, int c, int val)`, and `Matrix transpose() const`.', '2026-07-20 10:41:10.219682+00', 'medium', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (99, 'programming', 'Singly Linked List RAII Class', 'Create a class `LinkedList` implementing RAII (destructor frees memory). Provide methods `void pushFront(int val)` and `int popFront()` returning -1 if empty.', '2026-07-20 10:41:10.219682+00', 'medium', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (100, 'programming', 'Shape Inheritance Class Hierarchy Program', 'Write a complete C++ program featuring an abstract base class `Shape` with pure virtual method `double area() const`, and derived classes `Rectangle` and `Circle`. Read inputs, instantiate polymorphically, and print total area.', '2026-07-20 10:41:10.219682+00', 'medium', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (101, 'programming', 'Complex Number Operator Overloading', 'Write a class `Complex` representing complex numbers with double `real` and `imag`. Overload the addition (`+`), subtraction (`-`), and equality (`==`) operators as well as stream insertion (`<<`) operator.', '2026-07-20 10:42:08.476263+00', 'hard', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (102, 'programming', 'Rule of Five Custom Vector Class', 'Implement a dynamic array wrapper class `IntVector` providing Rule of Five members (destructor, copy constructor, copy assignment, move constructor, move assignment) along with `void push_back(int val)` and `int operator[](int i) const`.', '2026-07-20 10:42:08.476263+00', 'hard', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (103, 'programming', 'Polymorphic Grid Cell Simulator', 'Define abstract base class `Cell` with `virtual char render() = 0`. Implement derived classes `EmptyCell` (renders ''.''), `WallCell` (renders ''#''), and `ItemCell` (renders ''*''). Write a function that renders a 2D grid of `Cell*` pointers into a vector of strings.', '2026-07-20 10:42:08.476263+00', 'hard', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (104, 'programming', 'Doubly Linked List Object with Iterator Support', 'Implement a template or integer `DoublyLinkedList` class with nested iterator/pointers. Support `pushBack`, `pushFront`, `popBack`, `popFront`, and complete memory management in destructor.', '2026-07-20 10:42:08.476263+00', 'hard', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (105, 'programming', 'Polymorphic Plugin Command Manager', 'Write a complete C++ program that reads commands `CREATE type id`, `EXEC id arg`, and `DESTROY id`. Uses factory design pattern with polymorphism to execute actions dynamically.', '2026-07-20 10:42:08.476263+00', 'hard', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (106, 'programming', 'Unordered Set Existence Checker', 'Write a function `bool containsElement(const std::vector<int>& vec, int target)` that uses `std::unordered_set` to determine if `target` exists in O(1) average lookup time.', '2026-07-20 10:42:08.476263+00', 'easy', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (107, 'programming', 'Remove Duplicates using std::set', 'Write a function `std::vector<int> removeDuplicatesSorted(const std::vector<int>& nums)` that uses `std::set` to remove duplicates and return unique elements in ascending order.', '2026-07-20 10:42:08.476263+00', 'easy', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (108, 'programming', 'Grid Row Unique Count Tracker', 'Write a function `std::vector<int> countUniquePerRow(const std::vector<std::vector<int>>& grid)` that uses `std::set` on each row to calculate the count of distinct integers per row.', '2026-07-20 10:42:08.476263+00', 'easy', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (109, 'programming', 'Convert Linked List to std::vector', 'Write a function `std::vector<int> linkedListToVector(Node* head)` that traverses a linked list and copies all values into a `std::vector<int>`.', '2026-07-20 10:42:08.476263+00', 'easy', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (110, 'programming', 'Queue Operations Simulator Program', 'Write a complete C++ program that uses `std::queue<int>` to process commands `PUSH val`, `POP`, and `FRONT`. Output values as requested.', '2026-07-20 10:42:08.476263+00', 'easy', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (111, 'programming', 'Frequency Map Top Mode Finder', 'Write a function `int findMostFrequent(const std::vector<int>& nums)` using `std::unordered_map` to find the most frequent element. If ties exist, return the smallest value.', '2026-07-20 10:42:08.476263+00', 'medium', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (112, 'programming', 'Valid Parentheses Matching with Stack', 'Write a function `bool isValidParentheses(const std::string& s)` that uses `std::stack<char>` to verify if brackets `()`, `{}`, and `[]` are properly matched and balanced.', '2026-07-20 10:42:08.476263+00', 'medium', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (113, 'programming', 'Grid Path Breadth-First Search (BFS)', 'Write a function `int shortestPathGrid(const std::vector<std::vector<int>>& grid)` using `std::queue<std::pair<int,int>>` to compute the shortest path length from top-left to bottom-right through 0s in a grid. Return -1 if blocked.', '2026-07-20 10:42:08.476263+00', 'medium', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (114, 'programming', 'Cycle Detection via Unordered Set', 'Write a function `bool hasCycleSet(Node* head)` that tracks visited node memory addresses in `std::unordered_set<Node*>` to detect cycle presence.', '2026-07-20 10:42:08.476263+00', 'medium', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (115, 'programming', 'Priority Queue Task Scheduler Program', 'Write a complete C++ program that reads tasks formatted as `ADD task_name priority` or `GET`. Uses `std::priority_queue` to print highest priority tasks first.', '2026-07-20 10:42:08.476263+00', 'medium', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (116, 'programming', 'LRU Cache Capacity Evaluation', 'Implement an `LRUCache` class with `int get(int key)` and `void put(int key, int value)` operating in O(1) time complexity using `std::unordered_map` and `std::list`.', '2026-07-20 10:42:08.476263+00', 'hard', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (117, 'programming', 'Sliding Window Maximum using Deque', 'Write a function `std::vector<int> maxSlidingWindow(const std::vector<int>& nums, int k)` that uses `std::deque` to compute max elements across sliding windows of size `k` in O(N) time.', '2026-07-20 10:42:08.476263+00', 'hard', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (118, 'programming', 'Dijkstra Shortest Path in Weighted Grid', 'Write a function `int minCostGridPath(const std::vector<std::vector<int>>& grid)` using `std::priority_queue` (Dijkstra algorithm) to find min cost path from top-left to bottom-right cell.', '2026-07-20 10:42:08.476263+00', 'hard', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (119, 'programming', 'Merge K Sorted Lists via Priority Queue', 'Write a function `Node* mergeKSortedLists(const std::vector<Node*>& lists)` that uses `std::priority_queue` to merge K sorted linked lists into a single sorted list in O(N log K) time.', '2026-07-20 10:42:08.476263+00', 'hard', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);
INSERT INTO exam.questions VALUES (120, 'programming', 'Median Finder Data Stream Program', 'Write a complete C++ program that reads numbers continuously from stdin and prints running median after each insertion using two priority queues (max-heap for lower half, min-heap for upper half).', '2026-07-20 10:42:08.476263+00', 'hard', 7, false, 0.80, 0.20, '[]', 'STANDARD', 0.90, 0.15);


--
-- Data for Name: student_answers; Type: TABLE DATA; Schema: exam; Owner: judge0
--



--
-- Data for Name: students; Type: TABLE DATA; Schema: exam; Owner: judge0
--

INSERT INTO exam.students VALUES (7, 'Luis', 'Suarez', 1);
INSERT INTO exam.students VALUES (8, 'John', 'Doe', 6);
INSERT INTO exam.students VALUES (9, 'Mr', 'smith', 1);
INSERT INTO exam.students VALUES (10, 'Teacher', 'Teacher', 1);


--
-- Data for Name: submission_questions; Type: TABLE DATA; Schema: exam; Owner: judge0
--



--
-- Data for Name: submissions; Type: TABLE DATA; Schema: exam; Owner: judge0
--



--
-- Data for Name: test_questions; Type: TABLE DATA; Schema: exam; Owner: judge0
--



--
-- Data for Name: test_slots; Type: TABLE DATA; Schema: exam; Owner: judge0
--



--
-- Data for Name: tests; Type: TABLE DATA; Schema: exam; Owner: judge0
--



--
-- Data for Name: topics; Type: TABLE DATA; Schema: exam; Owner: judge0
--

INSERT INTO exam.topics VALUES (1, 'Variables & Control Flow', 'Basic syntax, if/else, primitive types');
INSERT INTO exam.topics VALUES (2, 'Loops & Iteration', 'For/while loops, nested loops');
INSERT INTO exam.topics VALUES (3, 'Functions & Scope', 'Signatures, pass-by-reference, scope');
INSERT INTO exam.topics VALUES (4, 'Arrays & Strings', 'Vector mechanics, C-strings, std::string');
INSERT INTO exam.topics VALUES (5, 'Pointers & Memory', 'Raw pointers, references, dynamic allocation');
INSERT INTO exam.topics VALUES (6, 'Recursion', 'Recursive function calls and stack mechanics');
INSERT INTO exam.topics VALUES (7, 'OOP & Structs', 'Classes, encapsulated state, constructors');
INSERT INTO exam.topics VALUES (8, 'Data Structures (STL)', 'Maps, sets, stacks, queues');


--
-- Data for Name: true_false_answers; Type: TABLE DATA; Schema: exam; Owner: judge0
--



--
-- Name: mcq_options_option_id_seq; Type: SEQUENCE SET; Schema: exam; Owner: judge0
--

SELECT pg_catalog.setval('exam.mcq_options_option_id_seq', 1, false);


--
-- Name: questions_question_id_seq; Type: SEQUENCE SET; Schema: exam; Owner: judge0
--

SELECT pg_catalog.setval('exam.questions_question_id_seq', 120, true);


--
-- Name: student_answers_answer_id_seq; Type: SEQUENCE SET; Schema: exam; Owner: judge0
--

SELECT pg_catalog.setval('exam.student_answers_answer_id_seq', 1, false);


--
-- Name: students_student_id_seq; Type: SEQUENCE SET; Schema: exam; Owner: judge0
--

SELECT pg_catalog.setval('exam.students_student_id_seq', 1, false);


--
-- Name: submission_questions_submission_question_id_seq; Type: SEQUENCE SET; Schema: exam; Owner: judge0
--

SELECT pg_catalog.setval('exam.submission_questions_submission_question_id_seq', 1, false);


--
-- Name: submissions_submission_id_seq; Type: SEQUENCE SET; Schema: exam; Owner: judge0
--

SELECT pg_catalog.setval('exam.submissions_submission_id_seq', 1, false);


--
-- Name: test_slots_slot_id_seq; Type: SEQUENCE SET; Schema: exam; Owner: judge0
--

SELECT pg_catalog.setval('exam.test_slots_slot_id_seq', 1, false);


--
-- Name: tests_test_id_seq; Type: SEQUENCE SET; Schema: exam; Owner: judge0
--

SELECT pg_catalog.setval('exam.tests_test_id_seq', 1, false);


--
-- Name: topics_topic_id_seq; Type: SEQUENCE SET; Schema: exam; Owner: judge0
--

SELECT pg_catalog.setval('exam.topics_topic_id_seq', 8, true);


--
-- Name: mcq_options mcq_options_pkey; Type: CONSTRAINT; Schema: exam; Owner: judge0
--

ALTER TABLE ONLY exam.mcq_options
    ADD CONSTRAINT mcq_options_pkey PRIMARY KEY (option_id);


--
-- Name: programming_questions programming_questions_pkey; Type: CONSTRAINT; Schema: exam; Owner: judge0
--

ALTER TABLE ONLY exam.programming_questions
    ADD CONSTRAINT programming_questions_pkey PRIMARY KEY (question_id);


--
-- Name: question_topics question_topics_pkey; Type: CONSTRAINT; Schema: exam; Owner: judge0
--

ALTER TABLE ONLY exam.question_topics
    ADD CONSTRAINT question_topics_pkey PRIMARY KEY (question_id, topic_id);


--
-- Name: questions questions_pkey; Type: CONSTRAINT; Schema: exam; Owner: judge0
--

ALTER TABLE ONLY exam.questions
    ADD CONSTRAINT questions_pkey PRIMARY KEY (question_id);


--
-- Name: student_answers student_answers_pkey; Type: CONSTRAINT; Schema: exam; Owner: judge0
--

ALTER TABLE ONLY exam.student_answers
    ADD CONSTRAINT student_answers_pkey PRIMARY KEY (answer_id);


--
-- Name: students students_pkey; Type: CONSTRAINT; Schema: exam; Owner: judge0
--

ALTER TABLE ONLY exam.students
    ADD CONSTRAINT students_pkey PRIMARY KEY (student_id);


--
-- Name: submission_questions submission_questions_pkey; Type: CONSTRAINT; Schema: exam; Owner: judge0
--

ALTER TABLE ONLY exam.submission_questions
    ADD CONSTRAINT submission_questions_pkey PRIMARY KEY (submission_question_id);


--
-- Name: submissions submissions_pkey; Type: CONSTRAINT; Schema: exam; Owner: judge0
--

ALTER TABLE ONLY exam.submissions
    ADD CONSTRAINT submissions_pkey PRIMARY KEY (submission_id);


--
-- Name: test_questions test_questions_pkey; Type: CONSTRAINT; Schema: exam; Owner: judge0
--

ALTER TABLE ONLY exam.test_questions
    ADD CONSTRAINT test_questions_pkey PRIMARY KEY (test_id, question_id);


--
-- Name: test_slots test_slots_pkey; Type: CONSTRAINT; Schema: exam; Owner: judge0
--

ALTER TABLE ONLY exam.test_slots
    ADD CONSTRAINT test_slots_pkey PRIMARY KEY (slot_id);


--
-- Name: tests tests_pkey; Type: CONSTRAINT; Schema: exam; Owner: judge0
--

ALTER TABLE ONLY exam.tests
    ADD CONSTRAINT tests_pkey PRIMARY KEY (test_id);


--
-- Name: topics topics_name_key; Type: CONSTRAINT; Schema: exam; Owner: judge0
--

ALTER TABLE ONLY exam.topics
    ADD CONSTRAINT topics_name_key UNIQUE (name);


--
-- Name: topics topics_pkey; Type: CONSTRAINT; Schema: exam; Owner: judge0
--

ALTER TABLE ONLY exam.topics
    ADD CONSTRAINT topics_pkey PRIMARY KEY (topic_id);


--
-- Name: true_false_answers true_false_answers_pkey; Type: CONSTRAINT; Schema: exam; Owner: judge0
--

ALTER TABLE ONLY exam.true_false_answers
    ADD CONSTRAINT true_false_answers_pkey PRIMARY KEY (question_id);


--
-- Name: student_answers unique_submission_question; Type: CONSTRAINT; Schema: exam; Owner: judge0
--

ALTER TABLE ONLY exam.student_answers
    ADD CONSTRAINT unique_submission_question UNIQUE (submission_question_id);


--
-- Name: uniq_active_submission_per_student_test; Type: INDEX; Schema: exam; Owner: judge0
--

CREATE UNIQUE INDEX uniq_active_submission_per_student_test ON exam.submissions USING btree (student_id, test_id) WHERE (status = 'in_progress'::text);


--
-- Name: mcq_options mcq_options_question_id_fkey; Type: FK CONSTRAINT; Schema: exam; Owner: judge0
--

ALTER TABLE ONLY exam.mcq_options
    ADD CONSTRAINT mcq_options_question_id_fkey FOREIGN KEY (question_id) REFERENCES exam.questions(question_id) ON DELETE CASCADE;


--
-- Name: programming_questions programming_questions_question_id_fkey; Type: FK CONSTRAINT; Schema: exam; Owner: judge0
--

ALTER TABLE ONLY exam.programming_questions
    ADD CONSTRAINT programming_questions_question_id_fkey FOREIGN KEY (question_id) REFERENCES exam.questions(question_id) ON DELETE CASCADE;


--
-- Name: question_topics question_topics_question_id_fkey; Type: FK CONSTRAINT; Schema: exam; Owner: judge0
--

ALTER TABLE ONLY exam.question_topics
    ADD CONSTRAINT question_topics_question_id_fkey FOREIGN KEY (question_id) REFERENCES exam.questions(question_id) ON DELETE CASCADE;


--
-- Name: question_topics question_topics_topic_id_fkey; Type: FK CONSTRAINT; Schema: exam; Owner: judge0
--

ALTER TABLE ONLY exam.question_topics
    ADD CONSTRAINT question_topics_topic_id_fkey FOREIGN KEY (topic_id) REFERENCES exam.topics(topic_id) ON DELETE CASCADE;


--
-- Name: questions questions_created_by_fkey; Type: FK CONSTRAINT; Schema: exam; Owner: judge0
--

ALTER TABLE ONLY exam.questions
    ADD CONSTRAINT questions_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(user_id);


--
-- Name: student_answers student_answers_submission_question_id_fkey; Type: FK CONSTRAINT; Schema: exam; Owner: judge0
--

ALTER TABLE ONLY exam.student_answers
    ADD CONSTRAINT student_answers_submission_question_id_fkey FOREIGN KEY (submission_question_id) REFERENCES exam.submission_questions(submission_question_id) ON DELETE CASCADE;


--
-- Name: students students_student_id_fkey; Type: FK CONSTRAINT; Schema: exam; Owner: judge0
--

ALTER TABLE ONLY exam.students
    ADD CONSTRAINT students_student_id_fkey FOREIGN KEY (student_id) REFERENCES auth.users(user_id) ON DELETE CASCADE;


--
-- Name: submission_questions submission_questions_question_id_fkey; Type: FK CONSTRAINT; Schema: exam; Owner: judge0
--

ALTER TABLE ONLY exam.submission_questions
    ADD CONSTRAINT submission_questions_question_id_fkey FOREIGN KEY (question_id) REFERENCES exam.questions(question_id) ON DELETE RESTRICT;


--
-- Name: submission_questions submission_questions_submission_id_fkey; Type: FK CONSTRAINT; Schema: exam; Owner: judge0
--

ALTER TABLE ONLY exam.submission_questions
    ADD CONSTRAINT submission_questions_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES exam.submissions(submission_id) ON DELETE CASCADE;


--
-- Name: test_questions test_questions_question_id_fkey; Type: FK CONSTRAINT; Schema: exam; Owner: judge0
--

ALTER TABLE ONLY exam.test_questions
    ADD CONSTRAINT test_questions_question_id_fkey FOREIGN KEY (question_id) REFERENCES exam.questions(question_id) ON DELETE CASCADE;


--
-- Name: test_questions test_questions_test_id_fkey; Type: FK CONSTRAINT; Schema: exam; Owner: judge0
--

ALTER TABLE ONLY exam.test_questions
    ADD CONSTRAINT test_questions_test_id_fkey FOREIGN KEY (test_id) REFERENCES exam.tests(test_id) ON DELETE CASCADE;


--
-- Name: test_slots test_slots_test_id_fkey; Type: FK CONSTRAINT; Schema: exam; Owner: judge0
--

ALTER TABLE ONLY exam.test_slots
    ADD CONSTRAINT test_slots_test_id_fkey FOREIGN KEY (test_id) REFERENCES exam.tests(test_id) ON DELETE CASCADE;


--
-- Name: test_slots test_slots_topic_id_fkey; Type: FK CONSTRAINT; Schema: exam; Owner: judge0
--

ALTER TABLE ONLY exam.test_slots
    ADD CONSTRAINT test_slots_topic_id_fkey FOREIGN KEY (topic_id) REFERENCES exam.topics(topic_id);


--
-- Name: tests tests_created_by_fkey; Type: FK CONSTRAINT; Schema: exam; Owner: judge0
--

ALTER TABLE ONLY exam.tests
    ADD CONSTRAINT tests_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(user_id);


--
-- Name: true_false_answers true_false_answers_question_id_fkey; Type: FK CONSTRAINT; Schema: exam; Owner: judge0
--

ALTER TABLE ONLY exam.true_false_answers
    ADD CONSTRAINT true_false_answers_question_id_fkey FOREIGN KEY (question_id) REFERENCES exam.questions(question_id) ON DELETE CASCADE;


--
-- Name: SCHEMA exam; Type: ACL; Schema: -; Owner: judge0
--

GRANT USAGE ON SCHEMA exam TO app_exam;
GRANT USAGE ON SCHEMA exam TO app_auth;


--
-- Name: TABLE mcq_options; Type: ACL; Schema: exam; Owner: judge0
--

GRANT ALL ON TABLE exam.mcq_options TO app_exam;
GRANT ALL ON TABLE exam.mcq_options TO app_auth;


--
-- Name: SEQUENCE mcq_options_option_id_seq; Type: ACL; Schema: exam; Owner: judge0
--

GRANT ALL ON SEQUENCE exam.mcq_options_option_id_seq TO app_exam;
GRANT ALL ON SEQUENCE exam.mcq_options_option_id_seq TO app_auth;


--
-- Name: TABLE programming_questions; Type: ACL; Schema: exam; Owner: judge0
--

GRANT ALL ON TABLE exam.programming_questions TO app_exam;
GRANT ALL ON TABLE exam.programming_questions TO app_auth;


--
-- Name: TABLE question_topics; Type: ACL; Schema: exam; Owner: judge0
--

GRANT ALL ON TABLE exam.question_topics TO app_exam;
GRANT ALL ON TABLE exam.question_topics TO app_auth;


--
-- Name: TABLE questions; Type: ACL; Schema: exam; Owner: judge0
--

GRANT ALL ON TABLE exam.questions TO app_exam;
GRANT ALL ON TABLE exam.questions TO app_auth;


--
-- Name: SEQUENCE questions_question_id_seq; Type: ACL; Schema: exam; Owner: judge0
--

GRANT ALL ON SEQUENCE exam.questions_question_id_seq TO app_exam;
GRANT ALL ON SEQUENCE exam.questions_question_id_seq TO app_auth;


--
-- Name: TABLE student_answers; Type: ACL; Schema: exam; Owner: judge0
--

GRANT ALL ON TABLE exam.student_answers TO app_exam;
GRANT ALL ON TABLE exam.student_answers TO app_auth;


--
-- Name: SEQUENCE student_answers_answer_id_seq; Type: ACL; Schema: exam; Owner: judge0
--

GRANT ALL ON SEQUENCE exam.student_answers_answer_id_seq TO app_exam;
GRANT ALL ON SEQUENCE exam.student_answers_answer_id_seq TO app_auth;


--
-- Name: TABLE students; Type: ACL; Schema: exam; Owner: judge0
--

GRANT ALL ON TABLE exam.students TO app_exam;
GRANT ALL ON TABLE exam.students TO app_auth;


--
-- Name: SEQUENCE students_student_id_seq; Type: ACL; Schema: exam; Owner: judge0
--

GRANT ALL ON SEQUENCE exam.students_student_id_seq TO app_exam;
GRANT ALL ON SEQUENCE exam.students_student_id_seq TO app_auth;


--
-- Name: TABLE submission_questions; Type: ACL; Schema: exam; Owner: judge0
--

GRANT ALL ON TABLE exam.submission_questions TO app_exam;
GRANT ALL ON TABLE exam.submission_questions TO app_auth;


--
-- Name: SEQUENCE submission_questions_submission_question_id_seq; Type: ACL; Schema: exam; Owner: judge0
--

GRANT ALL ON SEQUENCE exam.submission_questions_submission_question_id_seq TO app_exam;
GRANT ALL ON SEQUENCE exam.submission_questions_submission_question_id_seq TO app_auth;


--
-- Name: TABLE submissions; Type: ACL; Schema: exam; Owner: judge0
--

GRANT ALL ON TABLE exam.submissions TO app_exam;
GRANT ALL ON TABLE exam.submissions TO app_auth;


--
-- Name: SEQUENCE submissions_submission_id_seq; Type: ACL; Schema: exam; Owner: judge0
--

GRANT ALL ON SEQUENCE exam.submissions_submission_id_seq TO app_exam;
GRANT ALL ON SEQUENCE exam.submissions_submission_id_seq TO app_auth;


--
-- Name: TABLE test_questions; Type: ACL; Schema: exam; Owner: judge0
--

GRANT ALL ON TABLE exam.test_questions TO app_exam;
GRANT ALL ON TABLE exam.test_questions TO app_auth;


--
-- Name: TABLE test_slots; Type: ACL; Schema: exam; Owner: judge0
--

GRANT ALL ON TABLE exam.test_slots TO app_exam;
GRANT ALL ON TABLE exam.test_slots TO app_auth;


--
-- Name: SEQUENCE test_slots_slot_id_seq; Type: ACL; Schema: exam; Owner: judge0
--

GRANT ALL ON SEQUENCE exam.test_slots_slot_id_seq TO app_exam;
GRANT ALL ON SEQUENCE exam.test_slots_slot_id_seq TO app_auth;


--
-- Name: TABLE tests; Type: ACL; Schema: exam; Owner: judge0
--

GRANT ALL ON TABLE exam.tests TO app_exam;
GRANT ALL ON TABLE exam.tests TO app_auth;


--
-- Name: SEQUENCE tests_test_id_seq; Type: ACL; Schema: exam; Owner: judge0
--

GRANT ALL ON SEQUENCE exam.tests_test_id_seq TO app_exam;
GRANT ALL ON SEQUENCE exam.tests_test_id_seq TO app_auth;


--
-- Name: TABLE topics; Type: ACL; Schema: exam; Owner: judge0
--

GRANT ALL ON TABLE exam.topics TO app_exam;
GRANT ALL ON TABLE exam.topics TO app_auth;


--
-- Name: SEQUENCE topics_topic_id_seq; Type: ACL; Schema: exam; Owner: judge0
--

GRANT ALL ON SEQUENCE exam.topics_topic_id_seq TO app_exam;
GRANT ALL ON SEQUENCE exam.topics_topic_id_seq TO app_auth;


--
-- Name: TABLE true_false_answers; Type: ACL; Schema: exam; Owner: judge0
--

GRANT ALL ON TABLE exam.true_false_answers TO app_exam;
GRANT ALL ON TABLE exam.true_false_answers TO app_auth;


--
-- PostgreSQL database dump complete
--

-- Reset table primary key sequences after dump insert
SELECT setval('exam.questions_question_id_seq', COALESCE((SELECT MAX(question_id) FROM exam.questions), 1));
SELECT setval('exam.mcq_options_option_id_seq', COALESCE((SELECT MAX(option_id) FROM exam.mcq_options), 1));
SELECT setval('exam.submission_questions_submission_question_id_seq', COALESCE((SELECT MAX(submission_question_id) FROM exam.submission_questions), 1));
SELECT setval('exam.submissions_submission_id_seq', COALESCE((SELECT MAX(submission_id) FROM exam.submissions), 1));
SELECT setval('exam.test_slots_slot_id_seq', COALESCE((SELECT MAX(slot_id) FROM exam.test_slots), 1));
SELECT setval('exam.tests_test_id_seq', COALESCE((SELECT MAX(test_id) FROM exam.tests), 1));
SELECT setval('exam.topics_topic_id_seq', COALESCE((SELECT MAX(topic_id) FROM exam.topics), 1));
SELECT setval('exam.student_answers_answer_id_seq', COALESCE((SELECT MAX(answer_id) FROM exam.student_answers), 1));

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
ALTER TABLE IF EXISTS ONLY auth.refresh_tokens DROP CONSTRAINT IF EXISTS refresh_tokens_user_id_fkey;
DROP INDEX IF EXISTS exam.uniq_active_submission_per_student_test;
DROP INDEX IF EXISTS auth.users_email_ci_unique;
DROP INDEX IF EXISTS auth.rt_user_idx;
DROP INDEX IF EXISTS auth.rt_revoked_ix;
DROP INDEX IF EXISTS auth.rt_hash_idx;
DROP INDEX IF EXISTS auth.refresh_tokens_user_idx;
DROP INDEX IF EXISTS auth."IDX_session_expire";
DROP INDEX IF EXISTS auth."IDX_auth_session_expire";
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
ALTER TABLE IF EXISTS ONLY auth.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY auth.users DROP CONSTRAINT IF EXISTS users_email_key;
ALTER TABLE IF EXISTS ONLY auth.users DROP CONSTRAINT IF EXISTS user_email_uniq;
ALTER TABLE IF EXISTS ONLY auth.session DROP CONSTRAINT IF EXISTS session_pkey;
ALTER TABLE IF EXISTS ONLY auth.refresh_tokens DROP CONSTRAINT IF EXISTS refresh_tokens_pkey;
ALTER TABLE IF EXISTS exam.topics ALTER COLUMN topic_id DROP DEFAULT;
ALTER TABLE IF EXISTS exam.tests ALTER COLUMN test_id DROP DEFAULT;
ALTER TABLE IF EXISTS exam.test_slots ALTER COLUMN slot_id DROP DEFAULT;
ALTER TABLE IF EXISTS exam.submissions ALTER COLUMN submission_id DROP DEFAULT;
ALTER TABLE IF EXISTS exam.submission_questions ALTER COLUMN submission_question_id DROP DEFAULT;
ALTER TABLE IF EXISTS exam.student_answers ALTER COLUMN answer_id DROP DEFAULT;
ALTER TABLE IF EXISTS exam.questions ALTER COLUMN question_id DROP DEFAULT;
ALTER TABLE IF EXISTS exam.mcq_options ALTER COLUMN option_id DROP DEFAULT;
ALTER TABLE IF EXISTS auth.users ALTER COLUMN user_id DROP DEFAULT;
ALTER TABLE IF EXISTS auth.refresh_tokens ALTER COLUMN id DROP DEFAULT;
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
DROP SEQUENCE IF EXISTS auth.users_user_id_seq;
DROP TABLE IF EXISTS auth.users;
DROP TABLE IF EXISTS auth.session;
DROP SEQUENCE IF EXISTS auth.refresh_tokens_id_seq;
DROP TABLE IF EXISTS auth.refresh_tokens;
DROP SCHEMA IF EXISTS exam;
DROP SCHEMA IF EXISTS auth;
--
-- Name: auth; Type: SCHEMA; Schema: -; Owner: admin
--

CREATE SCHEMA auth;


ALTER SCHEMA auth OWNER TO admin;

--
-- Name: exam; Type: SCHEMA; Schema: -; Owner: admin
--

CREATE SCHEMA exam;


ALTER SCHEMA exam OWNER TO admin;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: refresh_tokens; Type: TABLE; Schema: auth; Owner: admin
--

CREATE TABLE auth.refresh_tokens (
    id integer NOT NULL,
    user_id integer NOT NULL,
    token_hash text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    last_used_at timestamp with time zone,
    revoked_at timestamp with time zone
);


ALTER TABLE auth.refresh_tokens OWNER TO admin;

--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: auth; Owner: admin
--

CREATE SEQUENCE auth.refresh_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE auth.refresh_tokens_id_seq OWNER TO admin;

--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: auth; Owner: admin
--

ALTER SEQUENCE auth.refresh_tokens_id_seq OWNED BY auth.refresh_tokens.id;


--
-- Name: session; Type: TABLE; Schema: auth; Owner: admin
--

CREATE TABLE auth.session (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL
);


ALTER TABLE auth.session OWNER TO admin;

--
-- Name: users; Type: TABLE; Schema: auth; Owner: admin
--

CREATE TABLE auth.users (
    user_id integer NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    full_name text,
    role text DEFAULT 'student'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    password_version integer DEFAULT 1 NOT NULL,
    CONSTRAINT users_role_check CHECK ((role = ANY (ARRAY['student'::text, 'teacher'::text, 'admin'::text])))
);


ALTER TABLE auth.users OWNER TO admin;

--
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: auth; Owner: admin
--

CREATE SEQUENCE auth.users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE auth.users_user_id_seq OWNER TO admin;

--
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: auth; Owner: admin
--

ALTER SEQUENCE auth.users_user_id_seq OWNED BY auth.users.user_id;


--
-- Name: mcq_options; Type: TABLE; Schema: exam; Owner: admin
--

CREATE TABLE exam.mcq_options (
    option_id integer NOT NULL,
    question_id integer NOT NULL,
    option_text text NOT NULL,
    is_correct boolean DEFAULT false NOT NULL,
    score_weight numeric(5,2) DEFAULT 0.00 NOT NULL
);


ALTER TABLE exam.mcq_options OWNER TO admin;

--
-- Name: mcq_options_option_id_seq; Type: SEQUENCE; Schema: exam; Owner: admin
--

CREATE SEQUENCE exam.mcq_options_option_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE exam.mcq_options_option_id_seq OWNER TO admin;

--
-- Name: mcq_options_option_id_seq; Type: SEQUENCE OWNED BY; Schema: exam; Owner: admin
--

ALTER SEQUENCE exam.mcq_options_option_id_seq OWNED BY exam.mcq_options.option_id;


--
-- Name: programming_questions; Type: TABLE; Schema: exam; Owner: admin
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


ALTER TABLE exam.programming_questions OWNER TO admin;

--
-- Name: question_topics; Type: TABLE; Schema: exam; Owner: postgres
--

CREATE TABLE exam.question_topics (
    question_id integer NOT NULL,
    topic_id integer NOT NULL
);


ALTER TABLE exam.question_topics OWNER TO postgres;

--
-- Name: questions; Type: TABLE; Schema: exam; Owner: admin
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
    weight_bb numeric(3,2) DEFAULT 0.80,
    weight_wb numeric(3,2) DEFAULT 0.20,
    structural_rules jsonb DEFAULT '[]'::jsonb,
    CONSTRAINT questions_difficulty_check CHECK ((difficulty = ANY (ARRAY['easy'::text, 'medium'::text, 'hard'::text]))),
    CONSTRAINT questions_question_type_check CHECK ((question_type = ANY (ARRAY['mcq'::text, 'true_false'::text, 'programming'::text])))
);


ALTER TABLE exam.questions OWNER TO admin;

--
-- Name: questions_question_id_seq; Type: SEQUENCE; Schema: exam; Owner: admin
--

CREATE SEQUENCE exam.questions_question_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE exam.questions_question_id_seq OWNER TO admin;

--
-- Name: questions_question_id_seq; Type: SEQUENCE OWNED BY; Schema: exam; Owner: admin
--

ALTER SEQUENCE exam.questions_question_id_seq OWNED BY exam.questions.question_id;


--
-- Name: student_answers; Type: TABLE; Schema: exam; Owner: admin
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


ALTER TABLE exam.student_answers OWNER TO admin;

--
-- Name: student_answers_answer_id_seq; Type: SEQUENCE; Schema: exam; Owner: admin
--

CREATE SEQUENCE exam.student_answers_answer_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE exam.student_answers_answer_id_seq OWNER TO admin;

--
-- Name: student_answers_answer_id_seq; Type: SEQUENCE OWNED BY; Schema: exam; Owner: admin
--

ALTER SEQUENCE exam.student_answers_answer_id_seq OWNED BY exam.student_answers.answer_id;


--
-- Name: students; Type: TABLE; Schema: exam; Owner: admin
--

CREATE TABLE exam.students (
    student_id integer NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    semester integer NOT NULL
);


ALTER TABLE exam.students OWNER TO admin;

--
-- Name: students_student_id_seq; Type: SEQUENCE; Schema: exam; Owner: admin
--

CREATE SEQUENCE exam.students_student_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE exam.students_student_id_seq OWNER TO admin;

--
-- Name: students_student_id_seq; Type: SEQUENCE OWNED BY; Schema: exam; Owner: admin
--

ALTER SEQUENCE exam.students_student_id_seq OWNED BY exam.students.student_id;


--
-- Name: submission_questions; Type: TABLE; Schema: exam; Owner: admin
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


ALTER TABLE exam.submission_questions OWNER TO admin;

--
-- Name: submission_questions_submission_question_id_seq; Type: SEQUENCE; Schema: exam; Owner: admin
--

CREATE SEQUENCE exam.submission_questions_submission_question_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE exam.submission_questions_submission_question_id_seq OWNER TO admin;

--
-- Name: submission_questions_submission_question_id_seq; Type: SEQUENCE OWNED BY; Schema: exam; Owner: admin
--

ALTER SEQUENCE exam.submission_questions_submission_question_id_seq OWNED BY exam.submission_questions.submission_question_id;


--
-- Name: submissions; Type: TABLE; Schema: exam; Owner: admin
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


ALTER TABLE exam.submissions OWNER TO admin;

--
-- Name: submissions_submission_id_seq; Type: SEQUENCE; Schema: exam; Owner: admin
--

CREATE SEQUENCE exam.submissions_submission_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE exam.submissions_submission_id_seq OWNER TO admin;

--
-- Name: submissions_submission_id_seq; Type: SEQUENCE OWNED BY; Schema: exam; Owner: admin
--

ALTER SEQUENCE exam.submissions_submission_id_seq OWNED BY exam.submissions.submission_id;


--
-- Name: test_questions; Type: TABLE; Schema: exam; Owner: admin
--

CREATE TABLE exam.test_questions (
    test_id integer NOT NULL,
    question_id integer NOT NULL,
    "position" integer,
    points numeric(6,2)
);


ALTER TABLE exam.test_questions OWNER TO admin;

--
-- Name: test_slots; Type: TABLE; Schema: exam; Owner: postgres
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


ALTER TABLE exam.test_slots OWNER TO postgres;

--
-- Name: test_slots_slot_id_seq; Type: SEQUENCE; Schema: exam; Owner: postgres
--

CREATE SEQUENCE exam.test_slots_slot_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE exam.test_slots_slot_id_seq OWNER TO postgres;

--
-- Name: test_slots_slot_id_seq; Type: SEQUENCE OWNED BY; Schema: exam; Owner: postgres
--

ALTER SEQUENCE exam.test_slots_slot_id_seq OWNED BY exam.test_slots.slot_id;


--
-- Name: tests; Type: TABLE; Schema: exam; Owner: admin
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


ALTER TABLE exam.tests OWNER TO admin;

--
-- Name: tests_test_id_seq; Type: SEQUENCE; Schema: exam; Owner: admin
--

CREATE SEQUENCE exam.tests_test_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE exam.tests_test_id_seq OWNER TO admin;

--
-- Name: tests_test_id_seq; Type: SEQUENCE OWNED BY; Schema: exam; Owner: admin
--

ALTER SEQUENCE exam.tests_test_id_seq OWNED BY exam.tests.test_id;


--
-- Name: topics; Type: TABLE; Schema: exam; Owner: postgres
--

CREATE TABLE exam.topics (
    topic_id integer NOT NULL,
    name text NOT NULL,
    description text
);


ALTER TABLE exam.topics OWNER TO postgres;

--
-- Name: topics_topic_id_seq; Type: SEQUENCE; Schema: exam; Owner: postgres
--

CREATE SEQUENCE exam.topics_topic_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE exam.topics_topic_id_seq OWNER TO postgres;

--
-- Name: topics_topic_id_seq; Type: SEQUENCE OWNED BY; Schema: exam; Owner: postgres
--

ALTER SEQUENCE exam.topics_topic_id_seq OWNED BY exam.topics.topic_id;


--
-- Name: true_false_answers; Type: TABLE; Schema: exam; Owner: admin
--

CREATE TABLE exam.true_false_answers (
    question_id integer NOT NULL,
    correct_answer boolean NOT NULL
);


ALTER TABLE exam.true_false_answers OWNER TO admin;

--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: auth; Owner: admin
--

ALTER TABLE ONLY auth.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('auth.refresh_tokens_id_seq'::regclass);


--
-- Name: users user_id; Type: DEFAULT; Schema: auth; Owner: admin
--

ALTER TABLE ONLY auth.users ALTER COLUMN user_id SET DEFAULT nextval('auth.users_user_id_seq'::regclass);


--
-- Name: mcq_options option_id; Type: DEFAULT; Schema: exam; Owner: admin
--

ALTER TABLE ONLY exam.mcq_options ALTER COLUMN option_id SET DEFAULT nextval('exam.mcq_options_option_id_seq'::regclass);


--
-- Name: questions question_id; Type: DEFAULT; Schema: exam; Owner: admin
--

ALTER TABLE ONLY exam.questions ALTER COLUMN question_id SET DEFAULT nextval('exam.questions_question_id_seq'::regclass);


--
-- Name: student_answers answer_id; Type: DEFAULT; Schema: exam; Owner: admin
--

ALTER TABLE ONLY exam.student_answers ALTER COLUMN answer_id SET DEFAULT nextval('exam.student_answers_answer_id_seq'::regclass);


--
-- Name: submission_questions submission_question_id; Type: DEFAULT; Schema: exam; Owner: admin
--

ALTER TABLE ONLY exam.submission_questions ALTER COLUMN submission_question_id SET DEFAULT nextval('exam.submission_questions_submission_question_id_seq'::regclass);


--
-- Name: submissions submission_id; Type: DEFAULT; Schema: exam; Owner: admin
--

ALTER TABLE ONLY exam.submissions ALTER COLUMN submission_id SET DEFAULT nextval('exam.submissions_submission_id_seq'::regclass);


--
-- Name: test_slots slot_id; Type: DEFAULT; Schema: exam; Owner: postgres
--

ALTER TABLE ONLY exam.test_slots ALTER COLUMN slot_id SET DEFAULT nextval('exam.test_slots_slot_id_seq'::regclass);


--
-- Name: tests test_id; Type: DEFAULT; Schema: exam; Owner: admin
--

ALTER TABLE ONLY exam.tests ALTER COLUMN test_id SET DEFAULT nextval('exam.tests_test_id_seq'::regclass);


--
-- Name: topics topic_id; Type: DEFAULT; Schema: exam; Owner: postgres
--

ALTER TABLE ONLY exam.topics ALTER COLUMN topic_id SET DEFAULT nextval('exam.topics_topic_id_seq'::regclass);


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: admin
--

INSERT INTO auth.refresh_tokens VALUES (1, 1, '7cd1510bada70a4a1c17d27faf335e3099269d1d1e3ab9e80e834ffcd7d7c856', '2025-11-08 18:07:41.535038+00', NULL, NULL);
INSERT INTO auth.refresh_tokens VALUES (2, 1, '7402c473ea44abb10fe17542481de60e4a57c252a6a35e3d422a2de74290374e', '2025-11-08 18:08:44.361985+00', '2025-11-08 18:08:59.341812+00', '2025-11-08 18:08:59.341812+00');
INSERT INTO auth.refresh_tokens VALUES (3, 1, 'd84de932e353a2327c7ed45833ef67d91407e3119e1f5b8ff84b3a4acc25c7eb', '2025-11-08 18:08:59.341812+00', '2025-11-08 18:08:59.353259+00', '2025-11-08 18:08:59.353259+00');
INSERT INTO auth.refresh_tokens VALUES (4, 1, '018b6c8a8bfcb386222bfbb57bedef9ed4bc14a3ac2b0d15a588e62dbfc74e2f', '2025-11-08 18:08:59.353259+00', NULL, NULL);
INSERT INTO auth.refresh_tokens VALUES (81, 6, '5605abe8dce11bd8adc18ddca070fe351f5726749b97348351d805625c1fa35b', '2025-12-09 09:58:52.648482+00', NULL, NULL);
INSERT INTO auth.refresh_tokens VALUES (5, 3, 'a250f4e25dd4d582742cece08c8a3fca63b2a8b1e833caa1e64d08001c37e8a8', '2025-11-10 15:49:39.356113+00', '2025-11-10 15:49:47.079161+00', '2025-11-10 15:49:47.079161+00');
INSERT INTO auth.refresh_tokens VALUES (6, 3, 'bfccfdf2b41a7ac973924e1a0cd32b780da9a7229c7e0205e8565bf61dcc4a85', '2025-11-10 15:49:47.081954+00', '2025-11-10 15:49:59.58192+00', '2025-11-10 15:49:59.58192+00');
INSERT INTO auth.refresh_tokens VALUES (7, 3, 'e81bfe061ff50619ef89f5967a2dd188fb79c708be5ffd5374c7fb76542a60ef', '2025-11-10 15:49:59.58192+00', NULL, NULL);
INSERT INTO auth.refresh_tokens VALUES (8, 4, '9b0fdeec5071b9793d5ad5e612c812cb1b8611243acadb07f42e2307e6bdb2ed', '2025-11-11 18:19:54.435491+00', NULL, NULL);
INSERT INTO auth.refresh_tokens VALUES (9, 4, '348c1bae7ca826752439124c7d8eef1a7a112133c37b7e2c8be7965f2ea51891', '2025-11-11 18:23:06.522214+00', NULL, NULL);
INSERT INTO auth.refresh_tokens VALUES (10, 4, '920cc93f6234431a5032734cd2b4b05ce5911cb4cac961ce1bfcddc93522d5b2', '2025-11-13 13:10:44.06649+00', NULL, NULL);
INSERT INTO auth.refresh_tokens VALUES (11, 4, 'bba42579139ea06211f14f42be052714e8a9c299c55c7fa783b16f31d84b4155', '2025-11-13 13:22:47.529443+00', NULL, '2025-11-13 13:30:20.740408+00');
INSERT INTO auth.refresh_tokens VALUES (12, 4, 'd341b1d5daff5876dc9bdc0bfbd64518e89d636a111b6e99e5194d584c8426d1', '2025-11-13 13:42:50.716585+00', NULL, '2025-11-13 13:51:15.927295+00');
INSERT INTO auth.refresh_tokens VALUES (13, 4, 'b0e0adb72cacdb45d2f2c714a647d0ac862d46e0571461c1719dc9977ed6f014', '2025-11-13 13:51:23.173554+00', NULL, NULL);
INSERT INTO auth.refresh_tokens VALUES (14, 4, '4bfba414c024d5f5826194e81d946bb5fd28e387670283461f0c9e5552fd1ba2', '2025-11-13 14:01:09.911518+00', NULL, '2025-11-13 14:20:26.660224+00');
INSERT INTO auth.refresh_tokens VALUES (15, 4, 'c16e1f394087e2ac20263edc6e02a05ee7588c6e8d6d02d211aaa96809ee86f5', '2025-11-13 14:20:32.890535+00', NULL, '2025-11-15 18:03:32.348042+00');
INSERT INTO auth.refresh_tokens VALUES (16, 4, '3ed3464925792a8857ab22e11e80c46da993e2a95d3c71badf9c44f2f686ec39', '2025-11-15 18:03:40.787159+00', NULL, '2025-11-15 18:17:50.400925+00');
INSERT INTO auth.refresh_tokens VALUES (17, 4, '914e86d7a15fd4723a7c2f3e5355a3bbe40208395b75948ae0645bd50d8e952e', '2025-11-15 18:18:12.984059+00', NULL, '2025-11-15 19:48:49.378097+00');
INSERT INTO auth.refresh_tokens VALUES (18, 4, '274367fb86cf4276c590e82c896f5deb574361ea838908160697df94d3c3bea9', '2025-11-15 19:48:55.157575+00', NULL, '2025-11-15 19:58:31.313825+00');
INSERT INTO auth.refresh_tokens VALUES (19, 4, '805ff21a3c8d5b74deeac19d8683c6c8200da4e6862c7e1e17a50cdeff3e43ad', '2025-11-15 19:58:36.825296+00', NULL, '2025-11-16 08:34:05.366695+00');
INSERT INTO auth.refresh_tokens VALUES (20, 4, '56cb29fc93c86d6f0be5edb778e7395cf12badd086a11b60c8cdf9ad20d65d77', '2025-11-16 08:34:14.760355+00', NULL, '2025-11-16 08:48:55.89754+00');
INSERT INTO auth.refresh_tokens VALUES (21, 4, '26fe2d1a95e55f41af2fcc7242006defe1334eb3611113402b09e4099d7ea20c', '2025-11-16 08:51:12.76932+00', NULL, '2025-11-16 08:52:33.404001+00');
INSERT INTO auth.refresh_tokens VALUES (22, 4, '445658260105dd8c3ddd525e3a416c14cd2526f2898f48b674e9a699c8591f6c', '2025-11-16 08:52:37.990587+00', NULL, '2025-11-16 08:54:13.259019+00');
INSERT INTO auth.refresh_tokens VALUES (23, 4, '179cdb0373b07a4954e93f43ddf713341c4038214c05b7f90ca416ae99aa8e3d', '2025-11-16 08:54:17.185728+00', NULL, '2025-11-16 08:55:31.062091+00');
INSERT INTO auth.refresh_tokens VALUES (24, 4, '78c5f050f415401279b384f6ec2e3f827c7df779b26a7d4b7f53fa188005f476', '2025-11-16 08:55:35.169842+00', NULL, '2025-11-16 09:04:02.338898+00');
INSERT INTO auth.refresh_tokens VALUES (25, 4, 'd59c92a08980b4f7872b99860a4574c31ba0aea5a3cc9a175fa80e2bae25b9fb', '2025-11-16 09:04:07.581914+00', NULL, '2025-11-16 09:09:12.827005+00');
INSERT INTO auth.refresh_tokens VALUES (26, 4, 'af3b6bc2d1f13adba8a458ae17d1c1d593407550ceff27314f2944cf5573c3ba', '2025-11-16 09:09:16.115724+00', NULL, '2025-11-16 09:18:59.332179+00');
INSERT INTO auth.refresh_tokens VALUES (27, 4, '9804f9cc4a4bcae27936c19c7f62feaee2ec508cdbd7dcde9f7fcc0dd5b2e84f', '2025-11-16 09:19:05.755395+00', NULL, NULL);
INSERT INTO auth.refresh_tokens VALUES (28, 4, '922f0853bb18239dca8d8728cfdb6bf7f59d22e37c2191afaaa47311af5a96a8', '2025-11-16 09:25:05.407622+00', NULL, '2025-11-16 09:30:31.303058+00');
INSERT INTO auth.refresh_tokens VALUES (29, 4, '98892f774159ae919ac7b7d7385e0af685498f9cd13ebb40d31c5d9742bb2dbb', '2025-11-16 09:30:34.931122+00', NULL, '2025-11-16 09:32:13.272658+00');
INSERT INTO auth.refresh_tokens VALUES (30, 4, '200e67e3ce404a29f9bdaac8858f4f18abfcf6a44cd3217486fcff3d58ff8800', '2025-11-16 09:32:20.115547+00', NULL, '2025-11-16 09:34:46.649398+00');
INSERT INTO auth.refresh_tokens VALUES (31, 4, '674d387be999a771572dcf44661836e4a755c9b4d2de137e440a797c1690aaea', '2025-11-16 09:34:49.591901+00', NULL, '2025-11-16 09:47:06.989033+00');
INSERT INTO auth.refresh_tokens VALUES (32, 4, '35bf0be40a93c3a418760e0ddc6c1fc24e6c878e8662ece4fa128f6f98c44d88', '2025-11-16 09:47:12.034597+00', NULL, '2025-11-16 15:29:31.536283+00');
INSERT INTO auth.refresh_tokens VALUES (33, 4, '8c7e11318ff662a4862c44c5f412163ff196f4d6090c16714edd4a7d93d53ae1', '2025-11-16 15:29:37.697892+00', NULL, '2025-11-16 15:54:24.240642+00');
INSERT INTO auth.refresh_tokens VALUES (34, 4, 'acc0c3b7f8243e74734d51f93e5fdd2dd4554cb13efa90170376b663517034ee', '2025-11-16 15:54:28.161741+00', NULL, NULL);
INSERT INTO auth.refresh_tokens VALUES (35, 4, 'dae1efa94731dda46faad1ec1b972df1bd51fbd6ce0fd25bc0a250eefb348f7b', '2025-11-19 09:15:21.85672+00', NULL, NULL);
INSERT INTO auth.refresh_tokens VALUES (36, 4, '65e79565b257bbcb5e5a89d3435f01d7fe7e4753310be518080bfe0170560066', '2025-11-19 09:22:55.045008+00', NULL, '2025-11-19 09:24:42.750243+00');
INSERT INTO auth.refresh_tokens VALUES (37, 4, '4b0d6c75366bbef408e7fa716b9959bdcc1f23b0435aa7d8ccc0f5c1a55af9c0', '2025-11-19 09:24:52.364262+00', NULL, NULL);
INSERT INTO auth.refresh_tokens VALUES (38, 5, '2530df6ed0dccc9ae9abbfdc8aa28a17a8cf6cdb8aeecce6e4aeaabcae8d61d1', '2025-11-19 10:23:27.945418+00', NULL, NULL);
INSERT INTO auth.refresh_tokens VALUES (39, 5, 'efe0950737245eaedf800a1b54127d37753443859c27c79a91a829bd1cec74ff', '2025-11-19 10:23:56.119985+00', NULL, NULL);
INSERT INTO auth.refresh_tokens VALUES (40, 4, 'dc9c7e0e460635754962d572160e36e8a8b44b8822e269f1160671445e99e49a', '2025-11-23 14:44:23.415919+00', NULL, NULL);
INSERT INTO auth.refresh_tokens VALUES (41, 5, '3119919bb9ad230b47fe470d7bee207ba8139e57707f43b3163249e8d22f49e6', '2025-12-02 17:05:45.659585+00', '2025-12-02 17:05:50.83247+00', '2025-12-02 17:05:50.83247+00');
INSERT INTO auth.refresh_tokens VALUES (42, 5, '5abafceaf6c0f79c4029275050f41801656cc259f02ca0eaca325f2b54c43211', '2025-12-02 17:05:50.84314+00', '2025-12-02 17:05:51.441607+00', '2025-12-02 17:05:51.441607+00');
INSERT INTO auth.refresh_tokens VALUES (43, 5, '68c80ee1185e6bd67f60e4e66d467166208e29ae7385af0f45dca936cfb0c580', '2025-12-02 17:05:51.451998+00', '2025-12-02 17:13:49.032418+00', '2025-12-02 17:13:49.032418+00');
INSERT INTO auth.refresh_tokens VALUES (45, 6, '8de3099f1ebb1eeb5718ece6fbc4040d7cbdd1387d22a587aac9e57726162789', '2025-12-02 17:15:16.760734+00', NULL, NULL);
INSERT INTO auth.refresh_tokens VALUES (44, 5, '25737559db0992eedbb1b41db97013d8f4a77c833f8e781c166fdfd2d71fa85c', '2025-12-02 17:13:49.043331+00', '2025-12-02 17:15:39.890923+00', '2025-12-02 17:15:39.890923+00');
INSERT INTO auth.refresh_tokens VALUES (46, 6, '8199e3b51a15b00ddf15eb7fc7188911df5f49be61e28f02d2eb64996707ad6f', '2025-12-02 17:15:39.901742+00', '2025-12-02 17:15:44.547343+00', '2025-12-02 17:15:44.547343+00');
INSERT INTO auth.refresh_tokens VALUES (47, 6, '9c7ecf330f02b161dd50c80b54c6eb99ae4898087090ce89350d8fc5c9126bbd', '2025-12-02 17:15:44.565065+00', '2025-12-02 17:15:44.815578+00', '2025-12-02 17:15:44.815578+00');
INSERT INTO auth.refresh_tokens VALUES (48, 6, '0be314ea55d0b916a9d4c16b7ec9b29cc277bbf8f5df792a20344aaa4ed27201', '2025-12-02 17:15:44.825957+00', '2025-12-02 17:15:45.007623+00', '2025-12-02 17:15:45.007623+00');
INSERT INTO auth.refresh_tokens VALUES (49, 6, '9c9e6a9e053e50b10070b019dfde36b68027c6d841b114045435aa01f6051477', '2025-12-02 17:15:45.017786+00', '2025-12-02 17:15:45.429383+00', '2025-12-02 17:15:45.429383+00');
INSERT INTO auth.refresh_tokens VALUES (50, 6, 'a2c4c2e6746c6701d3af40497a65116f1bcd3f48d15e13dc61ef95d1889dc715', '2025-12-02 17:15:45.43961+00', '2025-12-02 17:19:40.353656+00', '2025-12-02 17:19:40.353656+00');
INSERT INTO auth.refresh_tokens VALUES (51, 6, '41d1742507855507ff730c17fe416395ff9e27da7b090ccf29c31cbb45167124', '2025-12-02 17:19:40.366265+00', '2025-12-02 17:32:13.668169+00', '2025-12-02 17:32:13.668169+00');
INSERT INTO auth.refresh_tokens VALUES (52, 6, 'a2576c39ced92146aaa264b8cca8559b31869553af87a09ca3b1a0f91a1c193f', '2025-12-02 17:32:13.680665+00', '2025-12-02 17:32:17.65796+00', '2025-12-02 17:32:17.65796+00');
INSERT INTO auth.refresh_tokens VALUES (53, 6, 'b72756b762ae926b0218c8937aac7c68ffcc89caf411dae824bb968bf3d45245', '2025-12-02 17:32:17.669141+00', '2025-12-05 10:51:07.907265+00', '2025-12-05 10:51:07.907265+00');
INSERT INTO auth.refresh_tokens VALUES (54, 6, '0d41a194eae3952b2d056c5c28e5eac658e93fb309f4247e84673ac8c9070d4e', '2025-12-05 10:51:07.91568+00', '2025-12-05 10:51:12.43854+00', '2025-12-05 10:51:12.43854+00');
INSERT INTO auth.refresh_tokens VALUES (55, 6, '50d8ba70fa82dc723686051cfb6b4c4c997d76567a549c61ce45d999bd0b0326', '2025-12-05 10:51:12.449+00', '2025-12-05 10:51:31.340271+00', '2025-12-05 10:51:31.340271+00');
INSERT INTO auth.refresh_tokens VALUES (56, 6, 'dff47878eb129119729b107b9067c51de84b1399e2971ad452e2b0c50dda248a', '2025-12-05 10:51:31.352434+00', '2025-12-05 12:21:27.515205+00', '2025-12-05 12:21:27.515205+00');
INSERT INTO auth.refresh_tokens VALUES (57, 6, 'e1c50cb4a66a63094ea4966c8f3403b21a33bea601ad9edc40e1befa0c6a7e4c', '2025-12-05 12:21:27.527208+00', '2025-12-05 12:23:02.446034+00', '2025-12-05 12:23:02.446034+00');
INSERT INTO auth.refresh_tokens VALUES (58, 5, 'fe9855332b9fd1c10d13d9050084e910d8028dfcba01b0d793ca187c3942d77f', '2025-12-05 12:23:02.457053+00', '2025-12-05 12:33:32.429744+00', '2025-12-05 12:33:32.429744+00');
INSERT INTO auth.refresh_tokens VALUES (59, 6, '4a81ebe731dde65ead75c4e6783177d7dc14244aa33ee1eb76667093026e719e', '2025-12-05 12:33:32.441365+00', '2025-12-05 14:12:00.292894+00', '2025-12-05 14:12:00.292894+00');
INSERT INTO auth.refresh_tokens VALUES (60, 6, '8f8b93eff8b8139a410168a83c45fa0f5f3b91a539c183dbebf2a370cc73c138', '2025-12-05 14:12:00.304666+00', '2025-12-05 14:27:55.835383+00', '2025-12-05 14:27:55.835383+00');
INSERT INTO auth.refresh_tokens VALUES (61, 6, 'b4f6100679c74992f7d0d57a2b099ebe381f5235c9ce8da7df064e5bf0943541', '2025-12-05 14:27:55.83936+00', '2025-12-05 14:27:59.021526+00', '2025-12-05 14:27:59.021526+00');
INSERT INTO auth.refresh_tokens VALUES (62, 6, 'bcf797aff3b00a1631ab65c25062b08306bbb155a0eb992e06cdf32b1ef32e56', '2025-12-05 14:27:59.031918+00', '2025-12-05 14:28:02.963004+00', '2025-12-05 14:28:02.963004+00');
INSERT INTO auth.refresh_tokens VALUES (82, 6, '38f989c20a6040ade1c5dab8eab882377ee6f4730e01f855d9c2b6deac1b0616', '2025-12-09 10:03:36.47691+00', NULL, NULL);
INSERT INTO auth.refresh_tokens VALUES (63, 6, '44a911888253ed6a7fdfed9bb774acbf577b3020f72ba8cc9a68242747226329', '2025-12-05 14:28:02.974041+00', '2025-12-05 14:28:05.689196+00', '2025-12-05 14:28:05.689196+00');
INSERT INTO auth.refresh_tokens VALUES (83, 6, 'aff4bb20b97355b352f615bbe1a656721c1dafbdd9084a560b84319784643df8', '2025-12-09 10:04:44.654377+00', NULL, NULL);
INSERT INTO auth.refresh_tokens VALUES (64, 6, 'ebe030e5ac221444c5071a680b25c6c971d5b11a91883a8b82da40bc7d368654', '2025-12-05 14:28:05.699361+00', '2025-12-05 14:45:25.693848+00', '2025-12-05 14:45:25.693848+00');
INSERT INTO auth.refresh_tokens VALUES (80, 6, '24fdccbca07481be5f4bbb95cea8517fe329a850def644c8ef8590d0476b66b9', '2025-12-09 09:57:44.747525+00', '2025-12-09 10:10:49.988518+00', '2025-12-09 10:10:49.988518+00');
INSERT INTO auth.refresh_tokens VALUES (65, 6, '6f823c1ec6512ebe8274a5d11a27e5c7fdf3ac1be5accc4888a9d5f478012096', '2025-12-05 14:45:25.705219+00', '2025-12-05 14:45:33.92841+00', '2025-12-05 14:45:33.92841+00');
INSERT INTO auth.refresh_tokens VALUES (66, 6, '31431fc655e37f02cf93fc9227d0128c01e6f62087ad89c7853fe42a789e55b8', '2025-12-05 14:45:33.94472+00', '2025-12-05 14:45:39.084528+00', '2025-12-05 14:45:39.084528+00');
INSERT INTO auth.refresh_tokens VALUES (85, 6, '9e95532c18ac66204bccc491b84fd2b20683539e9a8f153e5234f61692ff83fd', '2025-12-09 10:12:12.745285+00', NULL, NULL);
INSERT INTO auth.refresh_tokens VALUES (67, 6, 'c7078db373c4d1e2d637ccb12f5758218c62a8309efc90f14243eb5e3e5af23f', '2025-12-05 14:45:39.100255+00', '2025-12-05 14:46:36.000145+00', '2025-12-05 14:46:36.000145+00');
INSERT INTO auth.refresh_tokens VALUES (86, 6, '852949e054c0a0b582808be5bfcd10cef893b4a2792e1353b413cf618fe7b56c', '2025-12-09 10:16:19.847543+00', NULL, NULL);
INSERT INTO auth.refresh_tokens VALUES (68, 6, 'bcc409c9cb2242bb163168532c4f9d8eeb88a276da3b64c32597969d146e34a6', '2025-12-05 14:46:36.011068+00', '2025-12-05 14:48:59.270145+00', '2025-12-05 14:48:59.270145+00');
INSERT INTO auth.refresh_tokens VALUES (84, 6, 'c15426edde3cf8b81e7258ec47e4bf864d422987de820f61749f6265bb06c3eb', '2025-12-09 10:10:49.99301+00', '2025-12-09 16:17:56.961534+00', '2025-12-09 16:17:56.961534+00');
INSERT INTO auth.refresh_tokens VALUES (69, 6, 'f57f90017b66767714fcca0bef0dbee241407519c96b77dc64933cca3c2afee7', '2025-12-05 14:48:59.282077+00', '2025-12-05 15:05:57.299485+00', '2025-12-05 15:05:57.299485+00');
INSERT INTO auth.refresh_tokens VALUES (70, 6, 'e1a6073f38c6372cc33b608657e4a384d035d72c5819d356a48996834efe97d6', '2025-12-05 15:05:57.304537+00', '2025-12-05 15:21:06.544528+00', '2025-12-05 15:21:06.544528+00');
INSERT INTO auth.refresh_tokens VALUES (87, 6, '3a70920a608499917a027864f03aedee6ab0f5fc1545834b87ded40b16778cf7', '2025-12-09 16:17:56.966494+00', '2025-12-16 14:39:23.895393+00', '2025-12-16 14:39:23.895393+00');
INSERT INTO auth.refresh_tokens VALUES (71, 6, '8eb49523400ea0f3a15692730d487b520d7f6ad153afa1c70224b57e01508a77', '2025-12-05 15:21:06.558391+00', '2025-12-05 15:31:31.252003+00', '2025-12-05 15:31:31.252003+00');
INSERT INTO auth.refresh_tokens VALUES (72, 6, '0a5263fc71a1e3ab00eaf7fb3e1def5199b3d7193b23c2f61e533eb4dac220ab', '2025-12-05 15:31:31.25639+00', '2025-12-05 15:58:29.258142+00', '2025-12-05 15:58:29.258142+00');
INSERT INTO auth.refresh_tokens VALUES (88, 6, 'cdca3c33008a9e457cb837fb1b6ae27b91ecace9309c4eb0177d0fed5e6f65d7', '2025-12-16 14:39:23.907236+00', '2025-12-16 15:11:56.591783+00', '2025-12-16 15:11:56.591783+00');
INSERT INTO auth.refresh_tokens VALUES (73, 6, '86781cce8de1fc778d0d5b62a379c226e4745c1461882ca5b0a865e733a0fb60', '2025-12-05 15:58:29.271834+00', '2025-12-05 16:09:40.957813+00', '2025-12-05 16:09:40.957813+00');
INSERT INTO auth.refresh_tokens VALUES (74, 6, '5f529305b5a7ca748252ce8b372fa62d65b3efd3e3be7aceee619377115fd97d', '2025-12-05 16:09:40.969594+00', '2025-12-05 16:33:13.365514+00', '2025-12-05 16:33:13.365514+00');
INSERT INTO auth.refresh_tokens VALUES (89, 6, '215f3d42a2be68a7d2b675b93e806b386d2f51421a8bb41e0c78f8168185819d', '2025-12-16 15:11:56.607569+00', '2025-12-16 15:31:15.841983+00', '2025-12-16 15:31:15.841983+00');
INSERT INTO auth.refresh_tokens VALUES (75, 6, 'df4c9a10ceb3479009f579f51602dc40c52070e2205a4b8f0b9a833d0e4f7001', '2025-12-05 16:33:13.376748+00', '2025-12-05 16:39:43.363781+00', '2025-12-05 16:39:43.363781+00');
INSERT INTO auth.refresh_tokens VALUES (76, 6, '489ae3fc21e19de7e3a5e02b4525da665abbc32de4b767e38b7cfc350312ac74', '2025-12-05 16:39:43.375525+00', '2025-12-06 15:05:59.076125+00', '2025-12-06 15:05:59.076125+00');
INSERT INTO auth.refresh_tokens VALUES (90, 6, '8b510b8a913d3e2578afb7002f1ff6914185bf980128651fd956ebd8ed7e2647', '2025-12-16 15:31:15.855079+00', '2025-12-16 16:07:01.222983+00', '2025-12-16 16:07:01.222983+00');
INSERT INTO auth.refresh_tokens VALUES (77, 6, '750d8be9fd2ec62b5ea8a47a55aed2a87cfecdf426aa3f104bdeddd764e90389', '2025-12-06 15:05:59.088328+00', '2025-12-07 11:42:00.912732+00', '2025-12-07 11:42:00.912732+00');
INSERT INTO auth.refresh_tokens VALUES (78, 6, 'f5ad0dfe75d8986141e6a0edfbd1d60dd0b33d980144e0b7b92cd483880ed70f', '2025-12-07 11:42:00.918101+00', '2025-12-07 21:03:43.651178+00', '2025-12-07 21:03:43.651178+00');
INSERT INTO auth.refresh_tokens VALUES (91, 6, '2b93637210f1415a3e2c8638fd06714943a751ecaf75e0367dea3636f54dc250', '2025-12-16 16:07:01.235002+00', '2025-12-16 16:26:37.336615+00', '2025-12-16 16:26:37.336615+00');
INSERT INTO auth.refresh_tokens VALUES (79, 6, '4712b2ed903ec984ce3142bb570ade18cd159c888b23e3f45b5ef282d1d56560', '2025-12-07 21:03:43.659805+00', '2025-12-09 09:57:44.73897+00', '2025-12-09 09:57:44.73897+00');
INSERT INTO auth.refresh_tokens VALUES (92, 6, '458f62df36e2fd6777fac4c6b705051403f95396fc4b287950db5238494d28d5', '2025-12-16 16:26:37.349045+00', '2025-12-16 16:53:03.399302+00', '2025-12-16 16:53:03.399302+00');
INSERT INTO auth.refresh_tokens VALUES (93, 6, '81db85bc3167d2fb4bfb7d67184f4cc52f4cc535d13438e6ded63b28b41338b7', '2025-12-16 16:53:03.412084+00', '2025-12-19 09:26:11.554167+00', '2025-12-19 09:26:11.554167+00');
INSERT INTO auth.refresh_tokens VALUES (94, 6, 'ffaca801fd96bf07b79a7262eb56c41924b8b12c77cd7c0fc572fafc3c47657d', '2025-12-19 09:26:11.563003+00', '2025-12-19 15:10:21.589532+00', '2025-12-19 15:10:21.589532+00');
INSERT INTO auth.refresh_tokens VALUES (95, 6, '62ba227d9bb4143e1c9706e00d54b5832993a1a4643255ee620a4f9752f3682b', '2025-12-19 15:10:21.60211+00', '2025-12-19 15:13:11.363074+00', '2025-12-19 15:13:11.363074+00');
INSERT INTO auth.refresh_tokens VALUES (96, 6, '04e690ea0ac3c501537d8099bdfafdd46f2044ee0099159c2c5cacaa917bf116', '2025-12-19 15:13:11.376282+00', '2025-12-19 15:17:34.057092+00', '2025-12-19 15:17:34.057092+00');
INSERT INTO auth.refresh_tokens VALUES (97, 6, 'c67a9a06a74c6d58663bc7645c13f59fb316257eaea814265693427b20e8d883', '2025-12-19 15:17:34.074934+00', '2025-12-19 15:17:57.886116+00', '2025-12-19 15:17:57.886116+00');
INSERT INTO auth.refresh_tokens VALUES (98, 6, '5fdde83d31796955e017d5a06895f3a3b8c8443a3da07d0e799606e7a9cfe54a', '2025-12-19 15:17:57.898663+00', '2025-12-21 10:51:34.900865+00', '2025-12-21 10:51:34.900865+00');
INSERT INTO auth.refresh_tokens VALUES (99, 6, '8cd5d9b9048eec55e1d0ae05df1f247bf63ab715f8b1150848643980b450405e', '2025-12-21 10:51:34.910066+00', '2025-12-21 11:28:57.841922+00', '2025-12-21 11:28:57.841922+00');
INSERT INTO auth.refresh_tokens VALUES (100, 6, 'f83d6c82c944728422d9279ed93061a201dc3774dfb59d9b1e5e79cf7255be2c', '2025-12-21 11:28:57.850351+00', '2025-12-21 11:49:39.428225+00', '2025-12-21 11:49:39.428225+00');
INSERT INTO auth.refresh_tokens VALUES (101, 6, '6b4a4a9bbbcf96cb5bde9c96051f76205d452bbe4abd178ea5bbcc75d35892d4', '2025-12-21 11:49:39.441536+00', '2025-12-21 12:06:42.458639+00', '2025-12-21 12:06:42.458639+00');
INSERT INTO auth.refresh_tokens VALUES (102, 6, 'dde69e8a85b77f508e2c2e7a592b727614ab5c47b5aa74da68f7d299d6b3a633', '2025-12-21 12:06:42.473955+00', '2025-12-21 13:17:44.102167+00', '2025-12-21 13:17:44.102167+00');
INSERT INTO auth.refresh_tokens VALUES (103, 6, '401d0c8068cae5bb4e860b18a4674de1ab35249d566fd89fa0a68ffac90dcd3e', '2025-12-21 13:17:44.113849+00', '2025-12-21 13:36:26.569512+00', '2025-12-21 13:36:26.569512+00');
INSERT INTO auth.refresh_tokens VALUES (104, 6, '7fcde79ab0027a9f82964f37546222f5ad3ea86427e3baf2d814e9a0a099c95c', '2025-12-21 13:36:26.57394+00', '2025-12-21 13:52:16.08953+00', '2025-12-21 13:52:16.08953+00');
INSERT INTO auth.refresh_tokens VALUES (105, 6, '9e5f542c086efe3a7ae206de3d20443611bfd9805baf3a2c723b097e350f5d91', '2025-12-21 13:52:16.100095+00', '2025-12-21 17:55:04.408893+00', '2025-12-21 17:55:04.408893+00');
INSERT INTO auth.refresh_tokens VALUES (106, 6, '8c13b6252589738a48c7b325595c86a2f9a7146bd0092c003ae6eb5f36d0b053', '2025-12-21 17:55:04.420633+00', '2025-12-24 09:33:37.492898+00', '2025-12-24 09:33:37.492898+00');
INSERT INTO auth.refresh_tokens VALUES (107, 6, '78d9823c7b273b1685c32b6e154906430335f3440d8ee3b7a76a077c27e7845c', '2025-12-24 09:33:37.501332+00', '2025-12-24 09:49:53.329429+00', '2025-12-24 09:49:53.329429+00');
INSERT INTO auth.refresh_tokens VALUES (108, 6, 'dd079f868a350ec5fc14e21ff0c363200af2a7a8a80317a70cf5aff049d4acec', '2025-12-24 09:49:53.354261+00', '2025-12-24 10:31:42.712956+00', '2025-12-24 10:31:42.712956+00');
INSERT INTO auth.refresh_tokens VALUES (109, 6, '83419d7966d63dd49129847586134d1d77dc93202cf1b20da4ce15a55dd76b48', '2025-12-24 10:31:42.724504+00', '2025-12-24 13:25:50.836469+00', '2025-12-24 13:25:50.836469+00');
INSERT INTO auth.refresh_tokens VALUES (110, 6, '1e855aadcd30622b020eda9d95f5799bf7932f9bd22129bafa6fac74abc74333', '2025-12-24 13:25:50.852438+00', '2025-12-24 13:25:59.79772+00', '2025-12-24 13:25:59.79772+00');
INSERT INTO auth.refresh_tokens VALUES (111, 6, '6090a7814787b89f56b3b3af49b4951b53c071bb5556ea6d1f2f625920c74245', '2025-12-24 13:25:59.807997+00', '2025-12-25 09:05:02.573779+00', '2025-12-25 09:05:02.573779+00');
INSERT INTO auth.refresh_tokens VALUES (112, 6, '761d6e0da1c1b42d155b1de00602307979bb6d8add55d2001bc3937b8266b989', '2025-12-25 09:05:02.582308+00', '2025-12-25 09:26:06.153261+00', '2025-12-25 09:26:06.153261+00');
INSERT INTO auth.refresh_tokens VALUES (113, 6, 'e15fb59da11f824ac1ade7db405227871d73ea1db842afe659b72b79e4c2e229', '2025-12-25 09:26:06.164565+00', '2025-12-25 09:26:16.18922+00', '2025-12-25 09:26:16.18922+00');
INSERT INTO auth.refresh_tokens VALUES (114, 6, 'ba37e188865e67b67af6db2edf89dc66f38ee97a8cae9218b7c8139e53feaa84', '2025-12-25 09:26:16.199253+00', '2025-12-25 09:26:19.649265+00', '2025-12-25 09:26:19.649265+00');
INSERT INTO auth.refresh_tokens VALUES (115, 6, '745932d5ae91eb16f7b8ab1fd176c088aa1c0591f21c73a1d727f03d135fdf40', '2025-12-25 09:26:19.659803+00', '2025-12-25 09:26:38.965199+00', '2025-12-25 09:26:38.965199+00');
INSERT INTO auth.refresh_tokens VALUES (116, 6, 'f52636e7b903ce26cf9f62640a60187792168ad71c18219f85ee2dcb495afd86', '2025-12-25 09:26:38.976015+00', NULL, NULL);
INSERT INTO auth.refresh_tokens VALUES (117, 6, '255aa478fda7e02023e9c3ee50c47ca8bc5d5e553ec69243aeaba950310c30ca', '2025-12-25 09:29:38.121078+00', NULL, NULL);
INSERT INTO auth.refresh_tokens VALUES (118, 6, 'd5bcb4c88f923312a4083edc59bc176d161100a6aece43e6f6400f2a3b7fc46d', '2025-12-25 09:47:57.899573+00', NULL, NULL);
INSERT INTO auth.refresh_tokens VALUES (119, 6, 'bb35d6669080cfccfcdeb00b16e5ae6a6e38ac02b7dfa362fb11d0d74fcca095', '2025-12-25 09:49:42.354908+00', '2025-12-25 09:50:27.091504+00', '2025-12-25 09:50:27.091504+00');
INSERT INTO auth.refresh_tokens VALUES (120, 6, '551aa8953e8072e556e7ff59abb68f273fd978e210a1907d3771f2e475cc4cfe', '2025-12-25 09:50:27.102784+00', '2025-12-25 10:00:09.331912+00', '2025-12-25 10:00:09.331912+00');
INSERT INTO auth.refresh_tokens VALUES (121, 6, '3a75de79f485ca0f96a5dd791f073e08859ed07084a19ab26022d609fa59505d', '2025-12-25 10:00:09.343822+00', '2025-12-25 14:09:30.476233+00', '2025-12-25 14:09:30.476233+00');
INSERT INTO auth.refresh_tokens VALUES (122, 6, 'ce760e7351eb10340c56323148b385773f992b83a840c12eb8f1ac077aa99b66', '2025-12-25 14:09:30.487614+00', '2025-12-25 18:11:50.31911+00', '2025-12-25 18:11:50.31911+00');
INSERT INTO auth.refresh_tokens VALUES (123, 6, '68c4c58251dd76b65489d53bb92584bea0db400cc5f53881ee57d35046355116', '2025-12-25 18:11:50.330205+00', '2025-12-25 18:27:25.408244+00', '2025-12-25 18:27:25.408244+00');
INSERT INTO auth.refresh_tokens VALUES (176, 6, 'f2b2b0f6aed4238bbc192d94026a88d638ffaeef04e41f825b5d8a86ba043341', '2025-12-30 16:45:53.642251+00', NULL, '2025-12-30 16:49:38.01861+00');
INSERT INTO auth.refresh_tokens VALUES (124, 6, 'e8d0f6563ad840ed4161e991d2ebeb3e8de2694096ad8b86286db832c7770747', '2025-12-25 18:27:25.419919+00', '2025-12-25 18:48:44.007713+00', '2025-12-25 18:48:44.007713+00');
INSERT INTO auth.refresh_tokens VALUES (177, 6, 'a0b8913c6f6fc82d2df429ba4d64ec4a7f397fc0cf5c1ea6a49140beff4f8bb2', '2025-12-30 16:49:38.030498+00', NULL, '2025-12-30 16:54:15.315212+00');
INSERT INTO auth.refresh_tokens VALUES (125, 6, '7d22ac7b0daf8a8e65cb0abe91e2532c264c74d56b73fda80ac72c556108d527', '2025-12-25 18:48:44.019768+00', '2025-12-25 18:52:37.53078+00', '2025-12-25 18:52:37.53078+00');
INSERT INTO auth.refresh_tokens VALUES (126, 6, '5a94ef4c66cd0ee42c0ab7aff9c7c1ee4b06fa0e9b8631c527dbcb36a2ab8cd8', '2025-12-25 18:52:37.542784+00', '2025-12-25 18:58:50.291552+00', '2025-12-25 18:58:50.291552+00');
INSERT INTO auth.refresh_tokens VALUES (178, 6, '648abc72deaec1feeb99678e81003ccb713cc906eecee6784c25f5a91961d783', '2025-12-30 16:54:15.327649+00', NULL, '2025-12-30 17:02:44.741425+00');
INSERT INTO auth.refresh_tokens VALUES (127, 6, '315cba5d879f5aea7194d38dc92df15c61064d6d664e35bf3179aa251c6f5451', '2025-12-25 18:58:50.302642+00', '2025-12-25 18:59:01.673885+00', '2025-12-25 18:59:01.673885+00');
INSERT INTO auth.refresh_tokens VALUES (179, 6, '018391e4a1c75cf31d06a82d878436b3c4983c7c5f3f6d1c2f6e928261e6b6a2', '2025-12-30 17:02:44.754705+00', NULL, '2025-12-30 18:33:26.276346+00');
INSERT INTO auth.refresh_tokens VALUES (128, 6, '512cc5591e432e9a9b582f7e209326bcfbcc9f1c0cc79f9bea81bfef0f9bf941', '2025-12-25 18:59:01.678292+00', '2025-12-26 10:58:08.629262+00', '2025-12-26 10:58:08.629262+00');
INSERT INTO auth.refresh_tokens VALUES (129, 6, 'f994e2eff4f28c2c7c273b4c0bacc25ee78c9d59876b238b0a68843e33f8e395', '2025-12-26 10:58:08.641197+00', '2025-12-26 11:02:52.279055+00', '2025-12-26 11:02:52.279055+00');
INSERT INTO auth.refresh_tokens VALUES (180, 6, 'ff5ee7245679b70cf3c71542df3dbf1c93108a87f69fbefc36154af069b55bfb', '2025-12-30 18:33:26.29893+00', NULL, '2025-12-30 20:16:11.92056+00');
INSERT INTO auth.refresh_tokens VALUES (130, 6, 'cd8f38945df42b2d4cf9a713ca9c575511bf520affe02386e55872e5040d8ccc', '2025-12-26 11:02:52.290192+00', '2025-12-26 11:09:22.586633+00', '2025-12-26 11:09:22.586633+00');
INSERT INTO auth.refresh_tokens VALUES (181, 7, '4463d0f790281b19bad8e9a6afb615c0bc7960805dda7d7ec5124904ef7c695a', '2025-12-30 20:16:11.924706+00', NULL, '2025-12-30 20:16:47.333966+00');
INSERT INTO auth.refresh_tokens VALUES (131, 6, '3fcb23ad36856c23536506a24c01a031ee1b713e8147ae5260421cf14d0876e7', '2025-12-26 11:09:22.59901+00', '2025-12-26 12:13:22.29004+00', '2025-12-26 12:13:22.29004+00');
INSERT INTO auth.refresh_tokens VALUES (133, 7, 'db1986cf2392f66ed5b7b91e9018e0188ed0a054753b122f4399febc1900f8e5', '2025-12-26 12:35:36.266913+00', NULL, NULL);
INSERT INTO auth.refresh_tokens VALUES (132, 6, '4350ad11749c3ee006a0c9767a44fddab80489be46617a699bbe3aeba2e97bb2', '2025-12-26 12:13:22.301246+00', NULL, '2025-12-26 12:35:55.023876+00');
INSERT INTO auth.refresh_tokens VALUES (182, 6, 'd64685993ca8e423a0d314b4fe6eaf670ddffc5faa0d13c4f0d37c84c1bef141', '2025-12-30 20:16:47.345041+00', NULL, '2025-12-30 20:17:07.181894+00');
INSERT INTO auth.refresh_tokens VALUES (134, 7, '4f9273cc7b4ee185e45025a91d32d4f56d85099b1899bc4df535852b35b7310a', '2025-12-26 12:35:55.035341+00', NULL, '2025-12-26 14:48:11.723964+00');
INSERT INTO auth.refresh_tokens VALUES (183, 6, '59fbb476d344625bead875d1b1707d08217057b92e7072f144188d218a7aacdb', '2025-12-30 20:17:07.192617+00', NULL, '2025-12-30 20:19:46.510686+00');
INSERT INTO auth.refresh_tokens VALUES (135, 6, '6f89ad309e0e5ab680e0635e2851789a09c88636713d987e906e67c52f606c03', '2025-12-26 14:48:11.735285+00', NULL, '2025-12-26 14:48:27.87835+00');
INSERT INTO auth.refresh_tokens VALUES (137, 8, '74ce7f3c95062f29393f9935f064d738ec8e47f5eed812009831642bf0aebdee', '2025-12-26 15:33:01.66004+00', NULL, NULL);
INSERT INTO auth.refresh_tokens VALUES (136, 7, '4ff47d192ef9acd505415f1005181c6eeb7f92bcf07076a72e01762b161ebb64', '2025-12-26 14:48:27.882175+00', NULL, '2025-12-26 15:33:14.456654+00');
INSERT INTO auth.refresh_tokens VALUES (184, 6, '72dab0e6b48e6bf51f45cde3ca3767ac5b47fd943770ad099ce3a4a91ffb1296', '2025-12-30 20:19:46.522378+00', NULL, '2025-12-30 20:21:09.882726+00');
INSERT INTO auth.refresh_tokens VALUES (138, 8, '576e11090119951b7f721df0d792ca108e227e7d4a69e07bcbbad609e28940fa', '2025-12-26 15:33:14.467612+00', NULL, '2025-12-26 15:33:28.537878+00');
INSERT INTO auth.refresh_tokens VALUES (185, 6, '44bce19fa997c3362a7e4074c0c071ab3550638fbf8a9231a430c6851e372cdd', '2025-12-30 20:21:09.893408+00', NULL, '2026-01-01 14:09:47.268345+00');
INSERT INTO auth.refresh_tokens VALUES (139, 6, '2938f0dcf835fcf103db15c1d801a49de6b3fb46adfdea99bd272b9eef8fa001', '2025-12-26 15:33:28.549258+00', NULL, '2025-12-26 15:35:14.387355+00');
INSERT INTO auth.refresh_tokens VALUES (141, 7, '3c7ab32de0848206f95567ccad1a4fd23596ba5f692a270b6991bc2ccac3b450', '2025-12-28 13:17:08.520667+00', NULL, NULL);
INSERT INTO auth.refresh_tokens VALUES (142, 6, '44267452cd15f6cacb02dcd00c0005687fc5a78e0baef8e909612e381b598fc9', '2025-12-28 13:31:52.671359+00', NULL, NULL);
INSERT INTO auth.refresh_tokens VALUES (140, 8, 'fe2b9897fddc5dc800da957ba616f64d11d8d28209e9852f85e8a1e734ad0c17', '2025-12-26 15:35:14.398631+00', NULL, '2025-12-28 16:45:53.473014+00');
INSERT INTO auth.refresh_tokens VALUES (186, 6, 'a3f2319bc13c3b3520201fb407aca1bd06e44e33a59569f6328e3a1ea4545ec9', '2026-01-01 14:09:47.277421+00', NULL, '2026-01-01 14:10:48.155391+00');
INSERT INTO auth.refresh_tokens VALUES (143, 6, 'bb86ffcd756d8095fc65cb566f9c6ec225e36eb7c7600bc4ccdc59b67e36f7e6', '2025-12-28 16:45:53.486102+00', NULL, '2025-12-28 16:46:13.15131+00');
INSERT INTO auth.refresh_tokens VALUES (144, 7, '5036cd748e0b8ea875497c3cb5fb5e3585025254a9a1d9996aadc8d5022fb2a5', '2025-12-28 16:46:13.162809+00', NULL, '2025-12-28 16:48:13.234087+00');
INSERT INTO auth.refresh_tokens VALUES (145, 7, 'bf385770db9e658f953e8da614cade00e3c40b5edcc2c055c81606977dbfec46', '2025-12-28 16:48:13.24533+00', NULL, '2025-12-28 16:52:05.116973+00');
INSERT INTO auth.refresh_tokens VALUES (146, 7, '5a14738f6aee0a3187c94bc36a046fc127cc9e09f363b32a3abbae8d4805ea13', '2025-12-28 16:52:05.128409+00', NULL, '2025-12-28 16:56:41.891246+00');
INSERT INTO auth.refresh_tokens VALUES (147, 7, '5303d6e0d2aacf384547c405e92f6aa6b2494bef41abed255f07ffc41f0c4ea4', '2025-12-28 16:56:41.903047+00', NULL, '2025-12-28 17:04:50.443489+00');
INSERT INTO auth.refresh_tokens VALUES (148, 7, 'b0111b7d9ed7720a2beef54333f58dafd6acc8d4fa2639e45516cad7b941ccde', '2025-12-28 17:04:50.455026+00', NULL, '2025-12-28 17:10:21.364666+00');
INSERT INTO auth.refresh_tokens VALUES (149, 7, '4b280a8cfdb1985d716493b3799924135349ec103581f18fa2f0593095d5ea07', '2025-12-28 17:10:21.377539+00', NULL, '2025-12-28 17:25:12.888534+00');
INSERT INTO auth.refresh_tokens VALUES (150, 7, '7ec44546be646cbaf58604e2e6ed58e64ac71e32751deb6cfdd32a1b1c262dbc', '2025-12-28 17:25:12.9005+00', NULL, '2025-12-28 17:25:15.647243+00');
INSERT INTO auth.refresh_tokens VALUES (151, 6, 'ce3651f032c5de1d6e12fba7b7cda9bcfcad2b7dca13fdccddf2fe84fb7bcfee', '2025-12-28 17:25:15.658102+00', NULL, '2025-12-28 17:25:26.590169+00');
INSERT INTO auth.refresh_tokens VALUES (152, 7, 'ba1c22a8a1d4ba3acaf7cebc58ec79624448d3e1996b34e75a679a6236581c3c', '2025-12-28 17:25:26.601927+00', NULL, '2025-12-28 17:26:25.069902+00');
INSERT INTO auth.refresh_tokens VALUES (153, 7, '3f49e24f268993da7db79139fa5cca7f1515ec7889d6beeb869a9cb6a3af830d', '2025-12-28 17:26:25.080708+00', NULL, '2025-12-28 17:26:28.41016+00');
INSERT INTO auth.refresh_tokens VALUES (154, 6, '3c2b6b4912dd845554c828e1980afb5728ae2d9a76ab42309e7d3024c295b341', '2025-12-28 17:26:28.420411+00', NULL, '2025-12-28 17:26:30.542187+00');
INSERT INTO auth.refresh_tokens VALUES (155, 6, 'b4c254eb3e07ba1810857da21c66dde285c821e666f2b776eb6303b141599509', '2025-12-28 17:26:30.552445+00', NULL, '2025-12-28 17:31:07.903323+00');
INSERT INTO auth.refresh_tokens VALUES (156, 7, '359611fc01a006463a6788654f092a04d24bcd3ff9d2d4830dd8e0e4b567a192', '2025-12-28 17:31:07.916487+00', NULL, '2025-12-28 17:43:22.902868+00');
INSERT INTO auth.refresh_tokens VALUES (157, 7, 'bca13eb0c191d2f5b689b207b71f3cb992833823fcbb018a66acd0e4e7ebd4d8', '2025-12-28 17:43:22.915466+00', NULL, '2025-12-28 18:28:28.260464+00');
INSERT INTO auth.refresh_tokens VALUES (158, 7, 'a2894d18ce8e7aef0f6c21d03a5e7b3d73cbeab47c82d4e34eda91cae54e3361', '2025-12-28 18:28:28.272157+00', NULL, '2025-12-28 18:40:57.122671+00');
INSERT INTO auth.refresh_tokens VALUES (159, 6, 'd96755d7b8875058f2efc93bade1701688c716f3ab02538fdb5fe8243bb3955c', '2025-12-28 18:40:57.134717+00', NULL, '2025-12-28 18:42:32.949893+00');
INSERT INTO auth.refresh_tokens VALUES (160, 7, 'f5221d1c51aeb88d3c586b69e2a42f28b5f15bbeff30961e2db745a31691280d', '2025-12-28 18:42:32.967325+00', NULL, '2025-12-28 18:47:13.514587+00');
INSERT INTO auth.refresh_tokens VALUES (161, 7, '8e1f0b1731684eca40aaa60ed852c03f88469fc810d990ad73a0e6ea20e871a4', '2025-12-28 18:47:13.5265+00', NULL, '2025-12-28 18:47:29.201443+00');
INSERT INTO auth.refresh_tokens VALUES (162, 7, '40b14dd8b32f645a026dd66c8f420ec8f8986d25e44f55f75a40de15ff24b953', '2025-12-28 18:47:29.213263+00', NULL, '2025-12-28 18:47:51.684873+00');
INSERT INTO auth.refresh_tokens VALUES (163, 6, '6f9d8038ba65bca8b52da2371b74b8aeb6961ec750c892c5e29104aae92a7c23', '2025-12-28 18:47:51.688701+00', NULL, '2025-12-28 18:47:56.203882+00');
INSERT INTO auth.refresh_tokens VALUES (164, 6, 'e415c6dbc063bf8edddda70bf678b536935ee38b195de0667e5ead8ce056d617', '2025-12-28 18:47:56.214153+00', NULL, '2025-12-28 18:48:02.119793+00');
INSERT INTO auth.refresh_tokens VALUES (165, 6, '26f2b5b85179c7346beeea178206c855819855dd02d300c821239a4ea6709531', '2025-12-28 18:48:02.130616+00', NULL, '2025-12-30 13:13:59.8289+00');
INSERT INTO auth.refresh_tokens VALUES (166, 7, 'f9fadae1b9505e638868c82bf2a6d24376c592a9bd7b5dc42431d5ebd09376c6', '2025-12-30 13:13:59.836053+00', NULL, '2025-12-30 13:38:30.212651+00');
INSERT INTO auth.refresh_tokens VALUES (167, 6, 'eb926f886d2729d75303adda3d373e18fdcd5a9e7711bd0efa7e462274856527', '2025-12-30 13:38:30.228557+00', NULL, '2025-12-30 14:29:30.139613+00');
INSERT INTO auth.refresh_tokens VALUES (168, 7, 'f53fa20fb7a6c1be4eca88d202741308c6898d382dc5a5aeb540d60b5ad88bb9', '2025-12-30 14:29:30.150491+00', NULL, '2025-12-30 14:31:40.263697+00');
INSERT INTO auth.refresh_tokens VALUES (169, 6, '46f71886aa854c19e1f7e64d9a07dc64837293fa9104f9b397cf01c601f477cd', '2025-12-30 14:31:40.275702+00', NULL, '2025-12-30 14:32:17.290772+00');
INSERT INTO auth.refresh_tokens VALUES (170, 6, 'f8688c5d879ca3a3bc4b629212f3ae746932cd9ed959ef20ef0b30f8e3ea4e9d', '2025-12-30 14:32:17.30145+00', NULL, '2025-12-30 14:32:26.839109+00');
INSERT INTO auth.refresh_tokens VALUES (171, 6, '5c8af34555a48089bd88a27fb54e17eb998eca2fea42d93e2dca0c6a57613cca', '2025-12-30 14:32:26.849522+00', NULL, '2025-12-30 14:55:09.682104+00');
INSERT INTO auth.refresh_tokens VALUES (172, 6, '2fbfe12e334ccce67c26fa468a477076f01e429cd095226f52877aa08e03247e', '2025-12-30 14:55:09.693614+00', NULL, '2025-12-30 15:02:37.841104+00');
INSERT INTO auth.refresh_tokens VALUES (173, 7, 'a526a9172583a68038f1186afbb38859e90e7092722246a0f6d178d7040e8391', '2025-12-30 15:02:37.853787+00', NULL, '2025-12-30 15:07:50.335736+00');
INSERT INTO auth.refresh_tokens VALUES (174, 7, '57952bd681cc42e8268c96de542cffa0aefdd2007488e3c3789917e50b06f86d', '2025-12-30 15:07:50.34781+00', NULL, '2025-12-30 16:43:16.089793+00');
INSERT INTO auth.refresh_tokens VALUES (175, 6, 'ab3a4a6447183beb0a458940c00765e271c8bd53601e507f27bf5c76beb200e1', '2025-12-30 16:43:16.100922+00', NULL, '2025-12-30 16:45:53.63779+00');
INSERT INTO auth.refresh_tokens VALUES (187, 7, 'c82f087c45709068c03c57e0a9bef290ac3418642f644281bf1b5697e55eea23', '2026-01-01 14:10:48.166194+00', NULL, '2026-01-01 14:11:56.605968+00');
INSERT INTO auth.refresh_tokens VALUES (188, 6, '812513497bcbd7d3f84dfa1ad10cfff5e2cfda096d2841f67bb44f962eca5b15', '2026-01-01 14:11:56.617453+00', NULL, '2026-01-01 14:12:38.256019+00');
INSERT INTO auth.refresh_tokens VALUES (189, 7, '0f154a809263a19f8ab8ea6713fe32c07cc02633fa4b0535de9ec836e50a6a50', '2026-01-01 14:12:38.265977+00', NULL, '2026-01-01 14:13:11.71883+00');
INSERT INTO auth.refresh_tokens VALUES (190, 6, '90e624439505530053c9fa57578b732b39595466965eb56c6a8c5d957c81288b', '2026-01-01 14:13:11.7297+00', NULL, '2026-01-01 14:13:49.925767+00');
INSERT INTO auth.refresh_tokens VALUES (191, 7, 'a532a390bec1315822417c74e7d669c91d9825359bbacd8925d484f8a106eadf', '2026-01-01 14:13:49.92901+00', NULL, '2026-01-01 14:14:12.021956+00');
INSERT INTO auth.refresh_tokens VALUES (192, 6, '2e01832c3e3b36697656a589c1b96847a69f9ce12194b5ebdace400dba941b48', '2026-01-01 14:14:12.033331+00', NULL, '2026-01-01 15:08:39.507415+00');
INSERT INTO auth.refresh_tokens VALUES (193, 6, '87a8c1cc9679f9986d919c2d661caf5fb0486e01a3d89fc59e788ee995c8e216', '2026-01-01 15:08:39.518703+00', NULL, '2026-01-01 17:42:05.771197+00');
INSERT INTO auth.refresh_tokens VALUES (194, 6, 'ef15410a78d06c4ed4916ced2f7e19ff273168c0f7fa4afb30476c39cc4dbc94', '2026-01-01 17:42:05.782866+00', NULL, '2026-01-02 15:17:43.300747+00');
INSERT INTO auth.refresh_tokens VALUES (195, 6, '1dcbe4493a6bdb2f0630cf28aff4c052d9e532e713ed7dc46698b3ee6aed0d57', '2026-01-02 15:17:43.312259+00', NULL, '2026-01-02 15:17:52.063924+00');
INSERT INTO auth.refresh_tokens VALUES (196, 6, 'abff85a9286a3bf69651643f37005e74018c434d9401acdb70a1a440fa032148', '2026-01-02 15:17:52.074611+00', NULL, NULL);
INSERT INTO auth.refresh_tokens VALUES (197, 6, 'c6e1805fb6e6f0ebf3c1525ae8a4213b4bb9dd9501b7f6eb0512324184c8c64b', '2026-01-11 10:36:03.924029+00', NULL, '2026-01-11 10:44:11.299118+00');
INSERT INTO auth.refresh_tokens VALUES (198, 6, 'b7b9e463c11d6b1b248cd3bec04c6ebfe50e79e0f9e487852262b5075943f3f5', '2026-01-11 10:44:11.312073+00', NULL, '2026-01-11 10:59:26.380407+00');
INSERT INTO auth.refresh_tokens VALUES (199, 6, '02db552e201a3ce521ba0c52bf7427fb7364948907522043781931e1ce613a5d', '2026-01-11 10:59:26.393761+00', NULL, '2026-01-11 11:02:20.654022+00');
INSERT INTO auth.refresh_tokens VALUES (200, 7, '52400eea9a80d83e0b91a3f0f2ee21fdf384c3f6f208024ea4309cab2b0c1434', '2026-01-11 11:02:20.665154+00', NULL, '2026-01-11 11:03:03.168063+00');
INSERT INTO auth.refresh_tokens VALUES (201, 6, '12217092090b118ab7b6bcd93926b6056afb5572771298fe2694f117cb4ed99a', '2026-01-11 11:03:03.179291+00', NULL, '2026-01-11 11:05:00.905657+00');
INSERT INTO auth.refresh_tokens VALUES (202, 6, '24d374f85bcbce0411c23ae94fe5dc795380aa321cd58f8d1874a48dfbf06dfb', '2026-01-11 11:05:00.922378+00', NULL, '2026-01-11 12:14:08.420791+00');
INSERT INTO auth.refresh_tokens VALUES (203, 6, 'dee57c9d097daf9a046c46496b4f54720cf69ec8f4e2bcdc304c7c666eb72e0b', '2026-01-11 12:14:08.432001+00', NULL, '2026-01-11 12:27:43.991249+00');
INSERT INTO auth.refresh_tokens VALUES (204, 6, '82f1625333a04033a1aa2dc87069b0acf72aa187e91acebca6aaf7395ba6b1bb', '2026-01-11 12:27:44.002475+00', NULL, '2026-01-11 13:12:37.002099+00');
INSERT INTO auth.refresh_tokens VALUES (205, 6, 'f5791aafe00b8c9b61db201ead6df2e25fd3799d304523571e55efab11c8d74a', '2026-01-11 13:12:37.013526+00', NULL, '2026-01-11 14:11:47.320451+00');
INSERT INTO auth.refresh_tokens VALUES (206, 7, '47e50b1b8669dd7d432f10951c909e20b01c9913bc01b296a071bdedbe4b9008', '2026-01-11 14:11:47.331797+00', NULL, '2026-01-11 14:12:18.131913+00');
INSERT INTO auth.refresh_tokens VALUES (207, 6, '3a6014984c37c2e5229bca8bbfce9b86fa17a827338550175078dcae15401686', '2026-01-11 14:12:18.143131+00', NULL, '2026-01-11 14:28:27.848193+00');
INSERT INTO auth.refresh_tokens VALUES (208, 6, '21086520ce77ea3f48413fcc825cb6d69ae4ef2e509a9c4c0fc9bad0cc151a26', '2026-01-11 14:28:27.859483+00', NULL, '2026-01-11 14:52:35.122879+00');
INSERT INTO auth.refresh_tokens VALUES (209, 7, '3114b9f2daf9607715b65cc10c34850a96676ba7c0d942d04bed5bef3f6277fa', '2026-01-11 14:52:35.135822+00', NULL, '2026-01-11 14:52:55.283122+00');
INSERT INTO auth.refresh_tokens VALUES (210, 6, '826d4106727f9bf4a0232298253d90c9b4ce3c845a7b63f189339560a07485b0', '2026-01-11 14:52:55.294441+00', NULL, '2026-01-11 15:35:41.877654+00');
INSERT INTO auth.refresh_tokens VALUES (211, 6, '6b8a55a77734e2b8d16f7be83dcca10e30024e9cffaac6a96a92d5999e4b86eb', '2026-01-11 15:35:41.889284+00', NULL, '2026-01-11 15:44:14.882541+00');
INSERT INTO auth.refresh_tokens VALUES (212, 6, 'e408c4c4ee40df7356cd20982cded2ea188351701c551b2e1007ac0222b890c3', '2026-01-11 15:44:14.893293+00', NULL, '2026-01-11 15:53:17.196789+00');
INSERT INTO auth.refresh_tokens VALUES (213, 6, '8776591661f202759e04c75fbb6480e4c3b8cd7f31e7836841ab300935e9a9f8', '2026-01-11 15:53:17.208401+00', NULL, '2026-01-11 16:43:56.634217+00');
INSERT INTO auth.refresh_tokens VALUES (214, 6, 'cde49dac4a2dc5b59957ad1c03efdc752a4eaaf555a30b10862b0464f11425c6', '2026-01-11 16:43:56.645277+00', NULL, '2026-01-11 16:59:49.329197+00');
INSERT INTO auth.refresh_tokens VALUES (215, 6, '9f51e58b9a7d31eced85546331b835fab3d5868b581131b85783264f8c4c66e4', '2026-01-11 16:59:49.341498+00', NULL, '2026-01-11 17:02:04.458093+00');
INSERT INTO auth.refresh_tokens VALUES (216, 6, '40fa749fe06080084161ab3895412dc286b669e1b45d434b4089f62648d9342d', '2026-01-11 17:02:04.461949+00', NULL, '2026-01-11 17:02:13.117052+00');
INSERT INTO auth.refresh_tokens VALUES (217, 6, '6c47c550421caff5f34182e8c8208b695253b939c8d811c7f6bc3ed33ce6c701', '2026-01-11 17:02:13.12725+00', NULL, '2026-01-11 17:06:30.552414+00');
INSERT INTO auth.refresh_tokens VALUES (218, 6, 'dc8a9b862cd7f13b9e3a47f8f37af554c3efff9daf7809e1a227902913cd7cd7', '2026-01-11 17:06:30.565037+00', NULL, '2026-01-11 17:09:11.953702+00');
INSERT INTO auth.refresh_tokens VALUES (219, 6, '01fe709ad8c14d5d07511e207511e3864da67f40d70b450e2427275acd3ca9d6', '2026-01-11 17:09:11.966152+00', NULL, '2026-01-11 18:52:23.882878+00');
INSERT INTO auth.refresh_tokens VALUES (220, 7, 'f4524e8d86bc25dc00749dd2b51ea80bf2a9c52f84c75c1af8f8af2ce1a94804', '2026-01-11 18:52:23.896192+00', NULL, '2026-01-11 18:52:41.401073+00');
INSERT INTO auth.refresh_tokens VALUES (221, 6, 'ee94313a81df7d8324e7b124e2a6271a466d4c53114a6a3f3e52450168a671d9', '2026-01-11 18:52:41.412633+00', NULL, '2026-01-13 08:57:58.886128+00');
INSERT INTO auth.refresh_tokens VALUES (222, 6, 'a5195331dc8924c5970b5d244fb97a6ac31469133ab7a7e8ea9c936055ae17c1', '2026-01-13 08:57:58.895796+00', NULL, '2026-01-13 09:18:14.688548+00');
INSERT INTO auth.refresh_tokens VALUES (223, 6, '1d8157d4ad99b8fbd913233bb5be2a6be7deba31420f692a04d3dbb1a0e085f9', '2026-01-13 09:18:14.701075+00', NULL, '2026-01-13 09:23:45.03983+00');
INSERT INTO auth.refresh_tokens VALUES (224, 7, '5eeb5589fefcf14715aa6354c849adf079ca3340e4f0afa0c73b5078642465fe', '2026-01-13 09:23:45.051067+00', NULL, '2026-01-13 09:24:07.749294+00');
INSERT INTO auth.refresh_tokens VALUES (225, 6, '5d2213fde0b2044def9906663df29dce471390ab6a85854608bcac476051567f', '2026-01-13 09:24:07.76097+00', NULL, '2026-01-13 09:46:31.040979+00');
INSERT INTO auth.refresh_tokens VALUES (226, 6, 'fbd307c3af54c4fa888a84f3111c445448f6ec81075eb50cc05ceb61e048bc94', '2026-01-13 09:46:31.052355+00', NULL, '2026-01-13 09:47:17.13274+00');
INSERT INTO auth.refresh_tokens VALUES (227, 7, 'd1837fff1952793130e1a36067f4cced709ebfa0ca90cf8960076b54e3be9d3e', '2026-01-13 09:47:17.14465+00', NULL, '2026-01-13 09:47:57.764522+00');
INSERT INTO auth.refresh_tokens VALUES (228, 6, '906bfc3ac792303574b767336a06a593f599599f473d44649957b01438f2435c', '2026-01-13 09:47:57.768326+00', NULL, '2026-01-13 10:24:40.285591+00');
INSERT INTO auth.refresh_tokens VALUES (229, 7, '5e88aaaa8a92ed42ae5056048fc665a290015b221bc09f6218ab8981bfae5e4d', '2026-01-13 10:24:40.298956+00', NULL, '2026-01-13 10:25:44.202532+00');
INSERT INTO auth.refresh_tokens VALUES (230, 7, '5971dd58388c3c2cf0c740d31da60bdca41e34197d7e7d1c5e69ab2b5385b7cb', '2026-01-13 10:25:44.213794+00', NULL, '2026-01-13 10:58:13.800939+00');
INSERT INTO auth.refresh_tokens VALUES (231, 7, '5259692bb5c773bc3e5d6c3eafd7ebbb14ab843f2b8c3680d4bd4d5fc662a9fb', '2026-01-13 10:58:13.814001+00', NULL, '2026-01-13 11:14:28.800333+00');
INSERT INTO auth.refresh_tokens VALUES (232, 7, 'ba9d22f2ff82ea5decc838f6569081b8ea98223fc074f2a98445ea060be03e8f', '2026-01-13 11:14:28.812645+00', NULL, '2026-01-13 13:40:22.838023+00');
INSERT INTO auth.refresh_tokens VALUES (233, 7, '0ba27dc5038f17a660d8e0dd1fc96bca2fe12899473bb2d719cf7a1a84135fb7', '2026-01-13 13:40:22.850295+00', NULL, '2026-01-13 13:43:40.467467+00');
INSERT INTO auth.refresh_tokens VALUES (234, 7, 'a10f3cb049526e2f2dafec63ec53a9e9dade80a6ee07732d5b9c6c55c4d2e6e7', '2026-01-13 13:43:40.480564+00', NULL, '2026-01-13 13:44:17.912033+00');
INSERT INTO auth.refresh_tokens VALUES (235, 6, '24f1ef8118817b198284131dfa8b1e46b1b606e71855360efcbe7d9e80f498e3', '2026-01-13 13:44:17.924524+00', NULL, '2026-01-13 13:44:36.653508+00');
INSERT INTO auth.refresh_tokens VALUES (236, 7, '991e37754e211a6d7ea3c1002509159e32130d485a7b9ee2756bae1c416c43be', '2026-01-13 13:44:36.664854+00', NULL, '2026-01-13 13:46:43.127843+00');
INSERT INTO auth.refresh_tokens VALUES (237, 7, 'e6e33558f39495fa344dda6d97a113988ed4edc5f3ff30d88d5a6c5232d4014d', '2026-01-13 13:46:43.139608+00', NULL, '2026-01-14 15:00:42.753288+00');
INSERT INTO auth.refresh_tokens VALUES (238, 6, 'f29dd79ff4acf0192280b0598213f57a4882fdac0325ff42e2f1f328186546ea', '2026-01-14 15:00:42.765246+00', NULL, '2026-01-14 15:01:16.427122+00');
INSERT INTO auth.refresh_tokens VALUES (239, 7, '4ac42b0232a74972f940b440585067d88e8abdff90d3387f3414cdd17de8f575', '2026-01-14 15:01:16.438243+00', NULL, '2026-01-14 15:12:31.548891+00');
INSERT INTO auth.refresh_tokens VALUES (240, 7, 'b72c32173034275523ffa38b7b87841b984b5abc264b9b39c222ea2464b1956e', '2026-01-14 15:12:31.560929+00', NULL, '2026-01-14 15:48:00.269527+00');
INSERT INTO auth.refresh_tokens VALUES (241, 6, '47fb9134574fd6c1eaaf1abb6ad0c0eea7a899ffe0d27b5fde3f76e36033f8bf', '2026-01-14 15:48:00.282538+00', NULL, '2026-01-14 16:23:00.637944+00');
INSERT INTO auth.refresh_tokens VALUES (242, 7, '8e094d80114a59096f4a19a7148dc3977eb8739ed37b398679575057dd13a5db', '2026-01-14 16:23:00.650092+00', NULL, '2026-01-14 16:31:54.339484+00');
INSERT INTO auth.refresh_tokens VALUES (243, 7, '9e7aebef0e4390a66c281ebf5b865b2087f4a3edf5e058e48e5d59dd67435233', '2026-01-14 16:31:54.350968+00', NULL, '2026-01-14 16:32:34.806699+00');
INSERT INTO auth.refresh_tokens VALUES (244, 6, '0a298c83c156fd090feb6364e86d72ff35bf0c61cdfd7cc7d6bf50470104ed56', '2026-01-14 16:32:34.818158+00', NULL, '2026-01-14 16:39:28.564576+00');
INSERT INTO auth.refresh_tokens VALUES (245, 6, '9973c6bb6079097dcfd6675993afc66b0be9a3360c76903e80c7f71e88e39df8', '2026-01-14 16:39:28.577539+00', NULL, '2026-01-14 16:40:06.423982+00');
INSERT INTO auth.refresh_tokens VALUES (246, 7, 'b34d0cc90a1308c5d4c88fa4bf0868dc2e0605dcacb4515c09ae55b5b92adff3', '2026-01-14 16:40:06.427729+00', NULL, '2026-01-14 16:40:42.046155+00');
INSERT INTO auth.refresh_tokens VALUES (247, 6, '1ad387299a087b5bf229fb5114aa46ad1cef1c25cd33627bd7ff04c1042f947b', '2026-01-14 16:40:42.057408+00', NULL, '2026-01-14 16:41:05.819012+00');
INSERT INTO auth.refresh_tokens VALUES (248, 6, 'b37dfa2368f762ad55535484de1787512de4b60de5df5132e83ac69508928ee5', '2026-01-14 16:41:05.829791+00', NULL, '2026-01-14 16:48:01.839079+00');
INSERT INTO auth.refresh_tokens VALUES (249, 6, '248189e2de438d59d7fea5d3f332a9442433a6d264e85bfe6fae1659c95c8fb5', '2026-01-14 16:48:01.851216+00', NULL, '2026-01-14 17:03:07.330727+00');
INSERT INTO auth.refresh_tokens VALUES (250, 6, '126ecdf317167ebe44064312b6273c4dd4f3ec92ac74c69339f5d6d043a05476', '2026-01-14 17:03:07.343016+00', NULL, '2026-01-14 17:03:33.257583+00');
INSERT INTO auth.refresh_tokens VALUES (251, 6, '5e3af80c90266edb01cd0c80c02128587cfcd3cdecd551b350b5a4fdd3032ec9', '2026-01-14 17:03:33.268732+00', NULL, '2026-01-14 17:03:40.968699+00');
INSERT INTO auth.refresh_tokens VALUES (252, 6, '8f966d57fe9876060b15fab0af50e2ec48f263dcd9bc4226ae207dafa26d47b3', '2026-01-14 17:03:40.979274+00', NULL, '2026-01-14 17:03:54.407111+00');
INSERT INTO auth.refresh_tokens VALUES (253, 6, '7cc5a949be1c03c04da41d16da7d7f0fd657b44e1d479b34cd1df04807473a44', '2026-01-14 17:03:54.417723+00', NULL, '2026-01-14 17:09:52.770038+00');
INSERT INTO auth.refresh_tokens VALUES (254, 6, '799fe0f0089245b2c4ffbd005ee757fc14169a08d44cd4d900508d64280bec45', '2026-01-14 17:09:52.782311+00', NULL, '2026-01-14 17:58:07.443287+00');
INSERT INTO auth.refresh_tokens VALUES (255, 6, 'cc4f3dbe53c60f22e162666ec5909515de1293102e262d247bb262508031a9f2', '2026-01-14 17:58:07.455209+00', NULL, '2026-01-14 17:58:31.752563+00');
INSERT INTO auth.refresh_tokens VALUES (256, 7, '094e186e01672f53c03946fbe4ea88abd14dd73fa272d7d0ac7a50a5dd5d5d56', '2026-01-14 17:58:31.7642+00', NULL, '2026-01-14 17:59:04.934631+00');
INSERT INTO auth.refresh_tokens VALUES (257, 6, '7050f7e8f18962c65144a7bd54f448588d9c282708f3dc14c6f4b352345d1c98', '2026-01-14 17:59:04.945549+00', NULL, '2026-01-14 18:08:52.398581+00');
INSERT INTO auth.refresh_tokens VALUES (258, 7, '1d9b268d3446269cf919e3c1260eb0004e6ce3e17611b126c3091f6226845acb', '2026-01-14 18:08:52.410385+00', NULL, '2026-01-14 18:09:35.778126+00');
INSERT INTO auth.refresh_tokens VALUES (259, 6, '2ba2d3197c864c0c42f1da855646caae651299c4af2a204f49a0b19e7dd815e6', '2026-01-14 18:09:35.781961+00', NULL, '2026-01-14 18:11:46.94383+00');
INSERT INTO auth.refresh_tokens VALUES (260, 6, 'ab84ccfc9757bf72b2bea753d722ca8ef6fa0cdc71b7e6f998cc6b59528656f8', '2026-01-14 18:11:46.954888+00', NULL, '2026-01-14 18:14:57.193701+00');
INSERT INTO auth.refresh_tokens VALUES (261, 6, '436c4ed04b2942268fd4be812df07cd80b8966835b5ee9257c182603b0728f56', '2026-01-14 18:14:57.204922+00', NULL, '2026-01-14 18:15:21.319515+00');
INSERT INTO auth.refresh_tokens VALUES (262, 6, '8eb8862901df782d48b66ce3c387de47613e9aace7e312fb840f4fdeb3f39243', '2026-01-14 18:15:21.331975+00', NULL, '2026-01-14 18:34:29.285835+00');
INSERT INTO auth.refresh_tokens VALUES (263, 6, '414b756ea96fc5f74269ac6fafa8799e04bffebd0b71eabb7c1940c287f68eda', '2026-01-14 18:34:29.297609+00', NULL, '2026-01-14 18:42:42.342596+00');
INSERT INTO auth.refresh_tokens VALUES (264, 6, '86f595cff23f5a04a40248085187eb32c6c1ea7d1b0aba2789fe794b5eb2367f', '2026-01-14 18:42:42.354695+00', NULL, '2026-01-14 18:48:48.519553+00');
INSERT INTO auth.refresh_tokens VALUES (265, 6, 'a8506e7ed66491e7e034f3c5737f0b8518b1ba7813404225b3326374f0c22c7b', '2026-01-14 18:48:48.531717+00', NULL, '2026-01-14 18:53:00.304249+00');
INSERT INTO auth.refresh_tokens VALUES (266, 6, '6cfd13394159fa3489c6cbc5746454c40f3e2946611a1ca83dca1279c7a86022', '2026-01-14 18:53:00.315962+00', NULL, NULL);
INSERT INTO auth.refresh_tokens VALUES (267, 6, '3370ea439328ab8bd7f949084ad30b6242758b0eddbc24348a94f776e1249c01', '2026-02-17 09:24:51.338937+00', NULL, '2026-02-17 09:33:54.890722+00');
INSERT INTO auth.refresh_tokens VALUES (268, 7, 'ce0f3fa44a4dd81662c906d883049bdd7f5c4eed04cf5e2d6d0c8fff3b4919e1', '2026-02-17 09:33:54.903669+00', NULL, '2026-02-17 09:36:11.010091+00');
INSERT INTO auth.refresh_tokens VALUES (269, 6, '23c6cc77e024282029bec2824b699558dc32623abe6113470a237faa2c4e0659', '2026-02-17 09:36:11.020811+00', NULL, '2026-02-17 09:36:39.326934+00');
INSERT INTO auth.refresh_tokens VALUES (270, 7, '77af662beaa6f82ccfc1d4a51556eea41fa082ec812ca30f37d43b686e5dc14c', '2026-02-17 09:36:39.339075+00', NULL, '2026-02-17 09:37:41.457704+00');
INSERT INTO auth.refresh_tokens VALUES (271, 6, '61c4c5e7fa12c96caf25b257604d09b957b83341b0819ddd355cb87267be2737', '2026-02-17 09:37:41.468493+00', NULL, '2026-02-17 09:49:22.625849+00');
INSERT INTO auth.refresh_tokens VALUES (272, 6, 'a3c08ffa014c79285e7b61d3705e591a01fc19e355c5e79bdafed7948dfbffaa', '2026-02-17 09:49:22.637147+00', NULL, '2026-02-17 09:50:11.241298+00');
INSERT INTO auth.refresh_tokens VALUES (273, 7, 'aeb78595f5465da8639528989dc165f0ec177371a2fc5ea4f5ee6663ce2723ef', '2026-02-17 09:50:11.25368+00', NULL, '2026-02-17 09:50:24.086748+00');
INSERT INTO auth.refresh_tokens VALUES (274, 6, '227264f07b643ebc6dbc6a25ee341889aca9ce62fdb352e8747922e05288324c', '2026-02-17 09:50:24.096796+00', NULL, '2026-02-17 10:22:49.082504+00');
INSERT INTO auth.refresh_tokens VALUES (275, 6, 'b72514190f25332f7c14d6ff702602eeb471dc1ed39e0e6cbe85d04bbd4df2e1', '2026-02-17 10:22:49.087012+00', NULL, '2026-02-17 10:23:10.384561+00');
INSERT INTO auth.refresh_tokens VALUES (276, 7, '6a24cc79a5419925386e8caa6d0b65c81a546c34aab25c6d94e8b41637746b3d', '2026-02-17 10:23:10.395294+00', NULL, '2026-02-17 10:23:57.459516+00');
INSERT INTO auth.refresh_tokens VALUES (277, 6, 'bfbe64dfb66e2d20c395585d7ddc8ccda61b44ec50467ae5d51ffe2a29e51086', '2026-02-17 10:23:57.470451+00', NULL, '2026-02-17 10:29:13.663723+00');
INSERT INTO auth.refresh_tokens VALUES (278, 7, '7370512919e3838c0615844733cbe5acc1831a8638d1c1711d706509fa2960cd', '2026-02-17 10:29:13.674888+00', NULL, '2026-02-17 10:29:56.496365+00');
INSERT INTO auth.refresh_tokens VALUES (279, 6, '29cb57c6619a01f8eac0144bae8745e9b708d55e1f0bdb8917f20d2a4ceee680', '2026-02-17 10:29:56.507009+00', NULL, '2026-02-17 10:35:45.589697+00');
INSERT INTO auth.refresh_tokens VALUES (280, 6, '51391f25cd6f8f7e19234157b9c3bf477405ca0f51c7ab4fb7bcda8ece0d126b', '2026-02-17 10:35:45.613256+00', NULL, '2026-02-17 10:36:09.591982+00');
INSERT INTO auth.refresh_tokens VALUES (281, 7, 'b351d5e1a9f98a871bf24748e6c59ff1e27d5b839fb1cba6ffb125e6e073b8f8', '2026-02-17 10:36:09.604314+00', NULL, '2026-02-17 10:36:58.285262+00');
INSERT INTO auth.refresh_tokens VALUES (282, 6, '1f4a69454ffd005a747bcbb0624e71625d6e2c5f98f17cce2c94340bcb34403f', '2026-02-17 10:36:58.296208+00', NULL, '2026-02-17 11:10:40.472488+00');
INSERT INTO auth.refresh_tokens VALUES (283, 6, 'dd30106375d696c567fdce4d49ecb45e30e372a1f0cc072837d2bb7474973dea', '2026-02-17 11:10:40.484272+00', NULL, NULL);
INSERT INTO auth.refresh_tokens VALUES (284, 6, '90ac30c538636bd1be41c8489f9d7d5151a3dfbad73b257e74938337d5728085', '2026-02-28 09:06:25.932374+00', NULL, '2026-02-28 11:12:46.332202+00');
INSERT INTO auth.refresh_tokens VALUES (286, 9, '64e8024fd5178d768427136579fda1637971c46e5ab7645f8e8ea99126a32389', '2026-03-03 15:13:19.666512+00', NULL, NULL);
INSERT INTO auth.refresh_tokens VALUES (285, 6, 'ec14966c9047ee363ad51c393bdc7acc28f3c9ce3aa37c59489de111bbb94114', '2026-02-28 11:12:46.357129+00', NULL, '2026-03-03 15:14:00.139969+00');
INSERT INTO auth.refresh_tokens VALUES (287, 6, '696c1956ed22388a86bef50aa06db34b68fb6465cefb2ea0e9e9f34a9f86c794', '2026-03-03 15:14:00.150509+00', NULL, '2026-03-03 15:14:26.33587+00');
INSERT INTO auth.refresh_tokens VALUES (288, 9, '771391b84a4b4c7d70762a849d596155a610759d789e19deab68c256d50a322e', '2026-03-03 15:14:26.346588+00', NULL, '2026-03-03 15:15:17.997531+00');
INSERT INTO auth.refresh_tokens VALUES (289, 6, '6535620c88109fa3f15f79f90a87591340bfc31868c48f178feedb045441ae3b', '2026-03-03 15:15:18.006977+00', NULL, '2026-03-03 15:27:26.966639+00');
INSERT INTO auth.refresh_tokens VALUES (290, 6, '6f3bdff9c760474d160769af99e83677f4edeea75cf2756b616ac1625afb7684', '2026-03-03 15:27:26.992991+00', NULL, '2026-03-03 15:29:47.346342+00');
INSERT INTO auth.refresh_tokens VALUES (291, 6, '73aac265ef28d6cca7b18992a766947e1d52970961573ecbc36bba8fde633e4e', '2026-03-03 15:29:47.357231+00', NULL, '2026-03-03 15:32:06.569764+00');
INSERT INTO auth.refresh_tokens VALUES (292, 6, '823b77f7d9b7fd323a89192b52ae8584f347c7099975632876b5ece29387389e', '2026-03-03 15:32:06.579538+00', NULL, '2026-03-03 15:33:22.774203+00');
INSERT INTO auth.refresh_tokens VALUES (293, 6, '9de6573f59088d481216e373f8b1a33cae9a305d9f54b0b4731eb58d5bdb41ce', '2026-03-03 15:33:22.785924+00', NULL, '2026-03-03 15:56:52.011776+00');
INSERT INTO auth.refresh_tokens VALUES (294, 6, 'ae702ce26931944127ec56af657814666c6fbabc3be8afda9ffb4917aaabcc44', '2026-03-03 15:56:52.025524+00', NULL, '2026-03-03 16:09:23.852297+00');
INSERT INTO auth.refresh_tokens VALUES (295, 6, '1af3641d3585333b84de62381d40f1fa2699fbdb5ad537de868af7225a7fc12f', '2026-03-03 16:09:23.862386+00', NULL, '2026-03-03 16:50:14.324663+00');
INSERT INTO auth.refresh_tokens VALUES (296, 6, 'ab3829fa63a7d5a7141dc5fb7089c22f35fb76c71fa11fa4407bd7bd4d09e484', '2026-03-03 16:50:14.336053+00', NULL, '2026-03-03 17:08:02.15727+00');
INSERT INTO auth.refresh_tokens VALUES (297, 6, '9a739bb2fe2d439e4fa03753700320b74ce4a19d2e1e9a872ce2efca69d6ab37', '2026-03-03 17:08:02.168413+00', NULL, '2026-03-03 17:08:32.115285+00');
INSERT INTO auth.refresh_tokens VALUES (298, 9, '42399b31bb5463127e95ed562fd81cdeaea04f270d182e99d7b48c41ed96ca02', '2026-03-03 17:08:32.126318+00', NULL, '2026-03-03 17:12:19.195524+00');
INSERT INTO auth.refresh_tokens VALUES (299, 6, '8c58bae0244a6c1bd4ebbfc9ab7faf0aa67484f080c1d3479420eb8f3b7a5d0c', '2026-03-03 17:12:19.201363+00', NULL, '2026-03-03 17:18:35.64689+00');
INSERT INTO auth.refresh_tokens VALUES (300, 6, '39db9f97f88e0d4ca25b5b2971918c2b45d8173ca8bd16cb7fda65653ebf51a7', '2026-03-03 17:18:35.658556+00', NULL, '2026-03-04 13:11:24.207747+00');
INSERT INTO auth.refresh_tokens VALUES (301, 6, '503e698051191a1cd9ebb4eac5c16b9766da979121a48c1456c250c435e9c591', '2026-03-04 13:11:24.218825+00', NULL, '2026-03-04 14:32:36.574302+00');
INSERT INTO auth.refresh_tokens VALUES (302, 6, '596426114d4798ecaf71b7a79f59f8a3ff818186676352c4a7bda80858154451', '2026-03-04 14:32:36.586016+00', NULL, '2026-03-04 14:41:43.85049+00');
INSERT INTO auth.refresh_tokens VALUES (303, 6, '2576c4ca08630bafc8710c8a0472f5127102427a6608cd7558c0d291c6797ee6', '2026-03-04 14:41:43.863096+00', NULL, '2026-03-04 14:50:19.443881+00');
INSERT INTO auth.refresh_tokens VALUES (304, 6, '8fed6e93a1d983494767f975ceb26ef3abccb24506e51bceb5347a444dc75779', '2026-03-04 14:50:19.455061+00', NULL, '2026-03-04 14:54:29.216013+00');
INSERT INTO auth.refresh_tokens VALUES (305, 6, 'fdeabebe14119237f4d4511ed8846b0bbdd34413bf2c772b081e93bf581e2cb9', '2026-03-04 14:54:29.227224+00', NULL, '2026-03-04 14:54:52.318037+00');
INSERT INTO auth.refresh_tokens VALUES (306, 9, 'd54426544163ebf19f8b1158df28b8110d31880084b775cacded7749aee158e1', '2026-03-04 14:54:52.328554+00', NULL, '2026-03-04 14:55:24.25849+00');
INSERT INTO auth.refresh_tokens VALUES (307, 6, '9b5c83c855f298eaa43eb7264bf0b0ccb12f2fd8b2390b06bb89cc487514eeab', '2026-03-04 14:55:24.262003+00', NULL, '2026-03-04 15:11:38.445327+00');
INSERT INTO auth.refresh_tokens VALUES (308, 9, '1816329b70bd188bdb8385b91e127726e62fa6a05313a2106ade1828dae397b8', '2026-03-04 15:11:38.456494+00', NULL, '2026-03-04 15:12:15.366039+00');
INSERT INTO auth.refresh_tokens VALUES (309, 6, '44347e7bb70942620c90c2e3edffd0183e44ab05bf5dbf508d4e474e35b98d66', '2026-03-04 15:12:15.37994+00', NULL, '2026-03-04 15:20:07.184067+00');
INSERT INTO auth.refresh_tokens VALUES (310, 9, '66a2d6b9ecd0aded1dd8f2005fb124e5a93733d7cd288e717c3618782951e49b', '2026-03-04 15:20:07.197027+00', NULL, '2026-03-04 15:20:40.537248+00');
INSERT INTO auth.refresh_tokens VALUES (311, 6, '1ebee47927d5472b14b2fe18499115565f43bb667cdaf4bcafb768553f919afe', '2026-03-04 15:20:40.549089+00', NULL, '2026-03-04 15:24:20.51076+00');
INSERT INTO auth.refresh_tokens VALUES (312, 9, '51038aee726a63f0d35ef1b1f1f2fe95a7fc904d9b573047aefc861ea6cedd99', '2026-03-04 15:24:20.52231+00', NULL, '2026-03-04 15:24:46.37652+00');
INSERT INTO auth.refresh_tokens VALUES (313, 6, '1b51169bdda3d652bca0eaaa33288192f1d6f4d0d236a93c62ee7e63996fa43e', '2026-03-04 15:24:46.387822+00', NULL, '2026-03-04 15:30:56.522212+00');
INSERT INTO auth.refresh_tokens VALUES (314, 9, '7164ec87fa5210a0ea58cad85087a90a237ffebb29709b81d4ce29e0a8ca8b48', '2026-03-04 15:30:56.534691+00', NULL, '2026-03-04 15:31:27.516802+00');
INSERT INTO auth.refresh_tokens VALUES (315, 6, '75e9f86b181d6682d0db883f8d51cb53ab09a0aad8e5f6b061894595988556ca', '2026-03-04 15:31:27.5282+00', NULL, '2026-03-04 15:43:08.327421+00');
INSERT INTO auth.refresh_tokens VALUES (316, 9, 'c4d37ff89816285fcea1d284fc23fae4e0fd02b7e8895da77b6025518b684b50', '2026-03-04 15:43:08.338807+00', NULL, '2026-03-04 15:43:43.0546+00');
INSERT INTO auth.refresh_tokens VALUES (317, 6, 'fa601b0c11c735733f5fcff7a3b524ddf454cd4224522b1c064941de4f4e7282', '2026-03-04 15:43:43.065681+00', NULL, '2026-03-04 16:26:19.42663+00');
INSERT INTO auth.refresh_tokens VALUES (318, 6, '572c3f6daf6fe976d718d8d54f892f739759a257e028169530ce144689b9dfc7', '2026-03-04 16:26:19.448718+00', NULL, '2026-03-04 16:26:49.789186+00');
INSERT INTO auth.refresh_tokens VALUES (319, 9, '8a75c434d1bc9edcdde958f73c56a6180a60330e153d7a601fbb630ea12a8b73', '2026-03-04 16:26:49.79997+00', NULL, '2026-03-04 16:27:16.027812+00');
INSERT INTO auth.refresh_tokens VALUES (320, 6, '7a02caeef7cd5f6544b0cf0e1ac89b5b74d7cc06f0afe5352b80fb90528da3d3', '2026-03-04 16:27:16.038533+00', NULL, '2026-03-04 16:32:46.502868+00');
INSERT INTO auth.refresh_tokens VALUES (321, 9, '12c052beea59d9187504387c238ff079979dcc291adee92bba6483fce8e10eff', '2026-03-04 16:32:46.51422+00', NULL, '2026-03-04 16:33:11.701713+00');
INSERT INTO auth.refresh_tokens VALUES (322, 6, 'bf55d03954b06ca7cb29e1a7c25a714522e9f7d3ffe0ac2b50646db6a7d7ca3f', '2026-03-04 16:33:11.713302+00', NULL, NULL);
INSERT INTO auth.refresh_tokens VALUES (323, 6, '87f32cbfa8d8d44280f8f1fb6bf98aa291e20f753bb762e42a9387aab8f1c2ae', '2026-03-18 18:51:53.82517+00', NULL, '2026-03-19 13:39:21.841569+00');
INSERT INTO auth.refresh_tokens VALUES (325, 10, '682ccf5aac4015e74d0efb7fe545b568c685dc6aa49db58978f28e692d6f0590', '2026-03-19 13:48:35.328501+00', NULL, NULL);
INSERT INTO auth.refresh_tokens VALUES (324, 6, 'e9bbc774a4c57aa70117e0c5200bd7aa7b70460ce75ee4134ca731bf6eb59760', '2026-03-19 13:39:21.85649+00', NULL, '2026-03-19 14:05:51.570796+00');
INSERT INTO auth.refresh_tokens VALUES (326, 10, 'bda639225c13573b5177c4bbc3094c4d7dddcc1efa044eca6282cb539238261a', '2026-03-19 14:05:51.580636+00', NULL, '2026-03-19 14:06:28.594442+00');
INSERT INTO auth.refresh_tokens VALUES (327, 6, 'b6c0e4251fc38706214221f2b6e23e65817e4038855afc2ffdbac1ad88a573b3', '2026-03-19 14:06:28.604402+00', NULL, '2026-03-19 14:07:35.552399+00');
INSERT INTO auth.refresh_tokens VALUES (328, 6, 'e77741f0d4acbb073909fc861c3385ee32cfe0e10cb9b8539509799b1b03dfb4', '2026-03-19 14:07:35.561884+00', NULL, '2026-03-19 14:22:47.745022+00');
INSERT INTO auth.refresh_tokens VALUES (329, 6, 'd152124cb744c5fa72849afb61c0d662bd4b8799b4e035334ce973dbaf9ea6a3', '2026-03-19 14:22:47.755544+00', NULL, '2026-03-19 14:24:57.07293+00');
INSERT INTO auth.refresh_tokens VALUES (330, 10, '7a1b7d894321244254a64e42dfb70adb2b0a7366ddc9df7adc5ddc5d6cebe8b0', '2026-03-19 14:24:57.082725+00', NULL, '2026-03-19 14:25:34.036431+00');
INSERT INTO auth.refresh_tokens VALUES (331, 6, '3791140bc7a0e2916e492a80d82c0a8edeb8b1750fb8083987a399295552bf36', '2026-03-19 14:25:34.046013+00', NULL, '2026-03-19 15:36:16.635722+00');
INSERT INTO auth.refresh_tokens VALUES (332, 10, 'b2da0a7991562d33c3eef3707f3ea4a7ea00e395a9888784efdef15a899a1183', '2026-03-19 15:36:16.64587+00', NULL, '2026-03-19 15:36:59.190844+00');
INSERT INTO auth.refresh_tokens VALUES (333, 6, 'dd07ed11f1ee053f2c2884e5feb7d778d1babbb9efa2f312bfa84e520eaeea4a', '2026-03-19 15:36:59.200272+00', NULL, '2026-03-20 10:28:00.39676+00');
INSERT INTO auth.refresh_tokens VALUES (334, 10, '381752659a6d6adc77e42c111cf3620ad3f4be8286a62f52e8cd71d62caa24df', '2026-03-20 10:28:00.402411+00', NULL, '2026-03-20 10:29:05.565948+00');
INSERT INTO auth.refresh_tokens VALUES (335, 6, 'a08910b611390fa2a592d33a9804d00062d9da4f20f58d53e0cfe039f665a9c5', '2026-03-20 10:29:05.57529+00', NULL, '2026-03-20 10:47:35.621109+00');
INSERT INTO auth.refresh_tokens VALUES (336, 6, 'c4b54092fd203548bcbff94ef42b1a771aa379b5ed48700412a46da32a757c21', '2026-03-20 10:47:35.639019+00', NULL, '2026-03-20 13:30:43.809303+00');
INSERT INTO auth.refresh_tokens VALUES (337, 10, 'd9b987f2737bb7470404d1dab54d4258b9a5b49745a74fdde3fb894476da7d00', '2026-03-20 13:30:43.814836+00', NULL, '2026-03-20 13:31:39.344194+00');
INSERT INTO auth.refresh_tokens VALUES (338, 6, '8adc4aabea6f48fdb7497370e6159707b54385754f984405103b637757758d95', '2026-03-20 13:31:39.353525+00', NULL, '2026-03-20 13:32:11.95964+00');
INSERT INTO auth.refresh_tokens VALUES (339, 10, '118caf5500a5a22bcca47bb47806478254eefc579b3f595a9c0f9331778ab6fa', '2026-03-20 13:32:11.968899+00', NULL, '2026-03-20 13:33:17.530147+00');
INSERT INTO auth.refresh_tokens VALUES (340, 6, '6316f6352d8a286058f7cf37e5853a2fab709d5ff3e308bb7d71775cd802471e', '2026-03-20 13:33:17.539345+00', NULL, '2026-03-20 13:33:33.105344+00');
INSERT INTO auth.refresh_tokens VALUES (341, 10, '1c79f2e69737e05298279e637dc1767192810b1b51ee6194304b34017c385f8c', '2026-03-20 13:33:33.114776+00', NULL, '2026-03-20 13:34:09.13181+00');
INSERT INTO auth.refresh_tokens VALUES (342, 6, '7d398524f356c07411bee81248615cf74325097d58cfac4e4ccc3baa7e0fdca6', '2026-03-20 13:34:09.141127+00', NULL, '2026-03-20 13:34:21.77936+00');
INSERT INTO auth.refresh_tokens VALUES (343, 10, 'fdd3b4a365f2fa542cf97851a54984ab08b6da9371d0b24e10efbdb2ff5fccca', '2026-03-20 13:34:21.788797+00', NULL, '2026-03-20 13:49:32.354142+00');
INSERT INTO auth.refresh_tokens VALUES (344, 6, '02475358c8d5fdd73010b7dd1793a69456679496fbebdd77bf85c88bf7bc6e97', '2026-03-20 13:49:32.363674+00', NULL, '2026-03-20 13:49:45.9816+00');
INSERT INTO auth.refresh_tokens VALUES (345, 10, 'f7bf57a55975b5d46d6642aa94bc09e2b71d5ca7c7333a1a96df9676b4c6e34e', '2026-03-20 13:49:45.991104+00', NULL, '2026-03-20 13:50:18.46316+00');
INSERT INTO auth.refresh_tokens VALUES (346, 6, '179d3546aac2aa5f315b61a55c1d1fdb4a90617102d1d2e310ea3d08881cd74d', '2026-03-20 13:50:18.472907+00', NULL, '2026-03-20 14:19:01.996179+00');
INSERT INTO auth.refresh_tokens VALUES (347, 6, '79273808257c4ab16c30bc15df83d66b51693339761891f78862797b40925616', '2026-03-20 14:19:02.014504+00', NULL, '2026-03-20 17:23:12.300769+00');
INSERT INTO auth.refresh_tokens VALUES (348, 6, '9a4172aa5d052a80228579be2653ad91bf44953963c95a64258c4aa5010eac68', '2026-03-20 17:23:12.307748+00', NULL, '2026-03-20 17:30:41.903657+00');
INSERT INTO auth.refresh_tokens VALUES (349, 6, '220591e0307cb84f2d6e1a6168bc126c3d2f819ed9cd88491dc2e9fe34b782a2', '2026-03-20 17:30:41.927091+00', NULL, '2026-03-20 17:33:23.435453+00');
INSERT INTO auth.refresh_tokens VALUES (350, 6, '2786de507b92ab7ab13bea7b1edea4231eb19ac63bda2a00f5a904fa6cc5a5f7', '2026-03-20 17:33:23.445233+00', NULL, '2026-03-20 17:44:29.686035+00');
INSERT INTO auth.refresh_tokens VALUES (351, 10, '3644796a65bc45822bcdd6fc9e6352e8703d157e14af76b74618dfa143c1f154', '2026-03-20 17:44:29.709109+00', NULL, '2026-03-20 17:45:07.096122+00');
INSERT INTO auth.refresh_tokens VALUES (352, 6, '372b8c63bf1dfe7cd647589f28ea0b6c79121de2974f2e90dd6a6befac4e2077', '2026-03-20 17:45:07.105699+00', NULL, '2026-03-20 17:45:22.015233+00');
INSERT INTO auth.refresh_tokens VALUES (353, 6, 'c54019cba077d628c283017555a5b4a62465905f2fb1d235f3e5d54b1296e83c', '2026-03-20 17:45:22.024267+00', NULL, '2026-03-20 17:45:37.977669+00');
INSERT INTO auth.refresh_tokens VALUES (354, 10, '822fb4c88b4be69e596064611c3bbb844dc7745038541f4c812f2898778fb17b', '2026-03-20 17:45:37.988046+00', NULL, '2026-03-20 17:57:56.680938+00');
INSERT INTO auth.refresh_tokens VALUES (355, 6, '8180f1ddb3462ce56eebefcd3dc53311736e96e3ebfeb5b80cdeae4980fe18c0', '2026-03-20 17:57:56.691211+00', NULL, '2026-03-21 13:21:29.252649+00');
INSERT INTO auth.refresh_tokens VALUES (356, 6, '734b32f2b5c516cdb288d6a9ff622218bba4077d55e630f4321bd0484315be03', '2026-03-21 13:21:29.259473+00', NULL, '2026-03-21 13:22:07.971947+00');
INSERT INTO auth.refresh_tokens VALUES (357, 6, 'd1e70528784fda252f8f14af36bda4930644e33105438fc4db9ab9e7312608e8', '2026-03-21 13:22:07.981637+00', NULL, '2026-03-21 13:22:19.901159+00');
INSERT INTO auth.refresh_tokens VALUES (358, 6, '03289e7f223fccd065dcfbac37cb42d617a21db1e600d0a729b2017f57c50ff6', '2026-03-21 13:22:19.910593+00', NULL, '2026-03-21 13:29:37.088315+00');
INSERT INTO auth.refresh_tokens VALUES (359, 6, '75297af6ca168ad10a0a67348a443ea7736c75fdb779b80a5317bc987de26cd1', '2026-03-21 13:29:37.090843+00', NULL, '2026-03-21 13:43:16.384057+00');
INSERT INTO auth.refresh_tokens VALUES (360, 6, '8482844aa09697b3097223b2021513d229e6aeac5b64d68aee175f3dd94ef078', '2026-03-21 13:43:16.39442+00', NULL, '2026-03-21 13:55:36.64034+00');
INSERT INTO auth.refresh_tokens VALUES (361, 6, 'ef4780ca9a4e37687c5ce7b00615574da59f6504ed6a40138c460b275ad207e8', '2026-03-21 13:55:36.650204+00', NULL, '2026-03-21 14:01:47.866391+00');
INSERT INTO auth.refresh_tokens VALUES (362, 6, '8097fad5aec4005ce8e8bfe1a49a17903fe5ae8f253bbfb2b4f411a4baf34fe5', '2026-03-21 14:01:47.876033+00', NULL, '2026-03-21 14:05:35.929886+00');
INSERT INTO auth.refresh_tokens VALUES (363, 6, 'c4c4466cf47c7749f1076d4638f7a740e2a3a78d801fbd41249e59efabe425db', '2026-03-21 14:05:35.939658+00', NULL, '2026-03-21 14:08:39.233935+00');
INSERT INTO auth.refresh_tokens VALUES (364, 6, 'e41ca4101ded295c7150fc5bf681abb487e6c96ecb8ca350bacb830a58cd97f0', '2026-03-21 14:08:39.243866+00', NULL, '2026-03-21 15:24:03.582898+00');
INSERT INTO auth.refresh_tokens VALUES (365, 6, '7ea9b54895e1da7991a47ec9ae3c1687c830e7b7735cd69702c304bfa8cfea69', '2026-03-21 15:24:03.592754+00', NULL, '2026-03-21 15:35:31.122921+00');
INSERT INTO auth.refresh_tokens VALUES (366, 6, '0f3514e0b6234c304d63bff62701d422daf6de284dcdb8837447bfb9ad14e1fa', '2026-03-21 15:35:31.133302+00', NULL, '2026-03-22 14:02:31.506316+00');
INSERT INTO auth.refresh_tokens VALUES (367, 6, '3b6c9a280843a19efa64b34d2f8d3efde7c523d9edfa9dc31830b84a3f144f56', '2026-03-22 14:02:31.522234+00', NULL, '2026-03-22 14:02:49.928476+00');
INSERT INTO auth.refresh_tokens VALUES (368, 10, '7ca8ef236852545cb44fc6ce6b7d86c4b1c48f4b5aa5e3de258f8c2a072c4111', '2026-03-22 14:02:49.930151+00', NULL, '2026-03-22 14:03:37.027842+00');
INSERT INTO auth.refresh_tokens VALUES (369, 6, '520d82e3ea98f36728346367e63879057afa8e13f6885bcee3f5cfac9846d32c', '2026-03-22 14:03:37.037486+00', NULL, '2026-03-22 15:02:27.927265+00');
INSERT INTO auth.refresh_tokens VALUES (370, 6, 'ad9572d4fa4d69dc109e3f16aca308d0ad349aa6f7fdd3848b654a5ffb0928d2', '2026-03-22 15:02:27.937257+00', NULL, '2026-03-22 15:04:31.738752+00');
INSERT INTO auth.refresh_tokens VALUES (371, 6, '41d1cf80e6ffe83f2b86ebcfd418bd6935835985a14c3b49355325db52ca89a7', '2026-03-22 15:04:31.748808+00', NULL, '2026-03-22 15:12:51.684734+00');
INSERT INTO auth.refresh_tokens VALUES (372, 6, '4dc046ffe398b8a1d43570a8341d71f333049876c10ebdf053764e6be5d411fc', '2026-03-22 15:12:51.694805+00', NULL, '2026-03-22 15:29:50.599302+00');
INSERT INTO auth.refresh_tokens VALUES (373, 6, '55b6f69335f38558d21bde4224e21d9d46d458eae616c0b2cfc27aa1cef2cb73', '2026-03-22 15:29:50.612892+00', NULL, '2026-03-22 16:36:46.442558+00');
INSERT INTO auth.refresh_tokens VALUES (374, 6, 'aa268c0255efdb24552912e03f88961ddd5d66eb43688e776498ed4b6b7f22df', '2026-03-22 16:36:46.445682+00', NULL, '2026-03-22 16:38:10.240304+00');
INSERT INTO auth.refresh_tokens VALUES (375, 6, 'c2dcccc4516f6f5f9e6f7a056734d3fc44ec17904d7b3e1b4e800f28e655ddd0', '2026-03-22 16:38:10.25071+00', NULL, '2026-03-22 16:41:28.559411+00');
INSERT INTO auth.refresh_tokens VALUES (376, 6, '9e2d1df75d8aaad14a238c391655691d1e97f02674df8aa69906ebacb9ae1120', '2026-03-22 16:41:28.56955+00', NULL, '2026-03-22 16:44:06.227863+00');
INSERT INTO auth.refresh_tokens VALUES (377, 6, '6a693976ec53282e0120787794e7e08517b26e2996c2b10ba026a22c866b86a9', '2026-03-22 16:44:06.239638+00', NULL, '2026-03-22 16:45:58.703144+00');
INSERT INTO auth.refresh_tokens VALUES (378, 6, 'b0aabbdb3ddee939274bde8b688f43a648e4094469d87d9fc2181da1c2bf7f8d', '2026-03-22 16:45:58.713475+00', NULL, '2026-03-22 16:47:45.442421+00');
INSERT INTO auth.refresh_tokens VALUES (379, 6, '6190d3e45b4e943565aa65db54942d6c36a1864bb7d34f205d96a916924e7d30', '2026-03-22 16:47:45.45334+00', NULL, '2026-03-22 16:48:15.199015+00');
INSERT INTO auth.refresh_tokens VALUES (380, 6, 'beb21581f0396541d695a38876c169cd430b568c75006f2b70d30ac5c2c8f198', '2026-03-22 16:48:15.209026+00', NULL, '2026-03-22 16:50:57.527379+00');
INSERT INTO auth.refresh_tokens VALUES (381, 6, 'b5ce5698db06321fa9bc244efffeb9dd4ec176e2786e1e68f96001baadb4b6a1', '2026-03-22 16:50:57.537185+00', NULL, '2026-03-22 16:54:01.271902+00');
INSERT INTO auth.refresh_tokens VALUES (382, 6, 'b2bb1a07030c259c06be3d9ae7b280218d3cf4066e2123df5b7325f6e5bc693e', '2026-03-22 16:54:01.285751+00', NULL, '2026-03-22 16:55:19.455129+00');
INSERT INTO auth.refresh_tokens VALUES (383, 6, 'c44ca4b152533471cd60a1ac54f7717e82f4f18ded9910e9c22d22f593af3e7b', '2026-03-22 16:55:19.465306+00', NULL, '2026-03-22 16:59:39.020302+00');
INSERT INTO auth.refresh_tokens VALUES (384, 6, '6ed79cfeb24be0441bc92a7ad2086ce2f9d18d7d3aae141fb76588fd3c82a1ef', '2026-03-22 16:59:39.032703+00', NULL, '2026-03-22 17:02:55.479555+00');
INSERT INTO auth.refresh_tokens VALUES (385, 6, '64f1126bf76bc03a25bdcc1aa1d9c5ec86a101e69c4ac5151eb86db2ac0387ad', '2026-03-22 17:02:55.489737+00', NULL, '2026-03-22 17:04:30.319154+00');
INSERT INTO auth.refresh_tokens VALUES (386, 10, '42b39770e65081485261f9f8dabb056fcc4020f7020de13b5e0361d7ddeb0cc8', '2026-03-22 17:04:30.329895+00', NULL, '2026-03-22 17:05:04.967195+00');
INSERT INTO auth.refresh_tokens VALUES (387, 6, '68a99848f8da1325111c2c165484e0e763058281194ec2f78a27ec8f27e4e0a5', '2026-03-22 17:05:04.98466+00', NULL, '2026-03-22 17:09:55.46858+00');
INSERT INTO auth.refresh_tokens VALUES (388, 6, '25d15dea439646fd9f2e2b2d21f025cce37503f999e76dfd02cd1894083e7b42', '2026-03-22 17:09:55.479405+00', NULL, '2026-03-22 17:52:47.237632+00');
INSERT INTO auth.refresh_tokens VALUES (389, 6, 'b77b2bc82b1000fa7f5eede4e852486317fd968d05feda40042f3ee9a8aee303', '2026-03-22 17:52:47.240465+00', NULL, '2026-03-22 19:42:28.630232+00');
INSERT INTO auth.refresh_tokens VALUES (390, 6, 'e7bc0fa68769bf82222f306a69c0cb81581001c0529463c1a1e1c28c9c7bad81', '2026-03-22 19:42:28.640184+00', NULL, '2026-03-25 09:26:39.594735+00');
INSERT INTO auth.refresh_tokens VALUES (391, 6, '099e25ccbf9dd03bbdf9abee3bb0fb22088e44d511915a2005c6e3e3e46a141f', '2026-03-25 09:26:39.599488+00', NULL, '2026-03-25 09:27:49.301051+00');
INSERT INTO auth.refresh_tokens VALUES (392, 6, '3fffbee9b3af718e213ca2cecfe7dc6194e63e82b2a3786dca464288990879f7', '2026-03-25 09:27:49.310981+00', NULL, '2026-03-25 11:44:11.15718+00');
INSERT INTO auth.refresh_tokens VALUES (393, 6, '3733045081a78fcf5816e42fb40c0a75dc99bf56b62d2d30ebc39e743f690230', '2026-03-25 11:44:11.167033+00', NULL, '2026-03-25 12:40:07.045148+00');
INSERT INTO auth.refresh_tokens VALUES (394, 6, 'e1c0d2b36d8db3edfd27a23e020d58811b36876b02141c547b1e07d748056680', '2026-03-25 12:40:07.055119+00', NULL, '2026-03-25 12:47:42.79036+00');
INSERT INTO auth.refresh_tokens VALUES (395, 6, '33133a1d513ec38736a360d8984649d08072c68c95cc872cb3a4f4879c951385', '2026-03-25 12:47:42.800722+00', NULL, '2026-03-25 12:50:59.351491+00');
INSERT INTO auth.refresh_tokens VALUES (396, 6, '569d351a3135845a49550c0ad0da191a05d315b562e65759a484285158b0b015', '2026-03-25 12:50:59.36111+00', NULL, '2026-03-25 13:06:08.063521+00');
INSERT INTO auth.refresh_tokens VALUES (397, 6, '70139b7e64d8730ad319180130231beff44cbeced80cbfad4af1ce3b13b08e2b', '2026-03-25 13:06:08.066236+00', NULL, '2026-03-25 14:29:48.406662+00');
INSERT INTO auth.refresh_tokens VALUES (398, 6, '9ad1f04dab0bd1de66ff84463a568f89f6f689437434379a1755cbe0b55c2bf1', '2026-03-25 14:29:48.416472+00', NULL, '2026-03-25 14:34:16.889368+00');
INSERT INTO auth.refresh_tokens VALUES (399, 6, '90733d2973b73ffdfd9a323d993b37f5931b45c1e0a9991671bd341c1ee43e4e', '2026-03-25 14:34:16.899153+00', NULL, '2026-03-25 14:45:31.829742+00');
INSERT INTO auth.refresh_tokens VALUES (400, 6, '35ad282c4996aff8813be4cc10fe9ef9ab8adcd23255facd010ec9046c78cdf3', '2026-03-25 14:45:31.839591+00', NULL, '2026-03-25 14:46:03.716963+00');
INSERT INTO auth.refresh_tokens VALUES (401, 6, '2d42b44775bce897a52b45a0576b346138271ae8458c24f0007274fa069353a9', '2026-03-25 14:46:03.722099+00', NULL, '2026-03-27 13:40:19.778842+00');
INSERT INTO auth.refresh_tokens VALUES (402, 6, '0e182172c27db6f2ecaf375fe7c2be7054e1556e3c2ac9bf0dac77438f01acc5', '2026-03-27 13:40:19.78501+00', NULL, '2026-04-01 12:39:53.557149+00');
INSERT INTO auth.refresh_tokens VALUES (403, 6, '28951c7f516ca1dd104a2446fd86a24481af39f6bfe6343a43aa8c7f7f4bdc7f', '2026-04-01 12:39:53.562625+00', NULL, NULL);
INSERT INTO auth.refresh_tokens VALUES (404, 6, '40fc116bf4748a61b5566e828df9a7f719dad06974e62bac91824b9dbb691f20', '2026-07-08 07:34:16.358774+00', NULL, '2026-07-08 07:34:45.560231+00');
INSERT INTO auth.refresh_tokens VALUES (405, 10, 'a5cbeedee24037a5d2afec8d8a135add8b3b87a1b5bd4d78abd6a5a5f7d13417', '2026-07-08 07:34:45.565328+00', NULL, NULL);


--
-- Data for Name: session; Type: TABLE DATA; Schema: auth; Owner: admin
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: admin
--

INSERT INTO auth.users VALUES (1, 'alice@example.com', '$argon2id$v=19$m=65536,t=3,p=4$dY8tBCqiD/iGh2qCwCLk0w$pe1ZatLRWkifg+rgPlBYIDT4DWmPl7SqmbwSz6eYjxc', 'Alice', 'student', '2025-11-08 18:07:41.53102+00', 1);
INSERT INTO auth.users VALUES (3, 'bob@example.com', '$argon2id$v=19$m=65536,t=3,p=4$kxtz6/2/UzTexBVyyoxaLw$tL0TmNzDcNKbclVAfIst2t5JzEvbIzerMrbw5G2zKdc', 'Bob Bobbington', 'student', '2025-11-10 15:49:39.352319+00', 1);
INSERT INTO auth.users VALUES (4, 'babis@example.com', '$argon2id$v=19$m=65536,t=3,p=4$fofQe7xrO0TPd/TRuUZDvQ$387RqrBjvS8YAHNpW+XRpoDayXDHTg+dQBxOBX3ZYq4', 'Babis', 'student', '2025-11-11 18:19:54.43037+00', 1);
INSERT INTO auth.users VALUES (5, 'whatcanido@example.com', '$argon2id$v=19$m=65536,t=3,p=4$5TN7yteaCdQTaiFuhdnw3w$QNQBx+7XUUW4lxEWErln+dCtZIY7c+G5fDni60ruMRc', NULL, 'student', '2025-11-19 10:23:27.931828+00', 1);
INSERT INTO auth.users VALUES (6, 'user123@email.com', '$argon2id$v=19$m=65536,t=3,p=4$OIaUnuU4Zk6uyPeoiLJbrw$WbBF3EIHpISstxlup6rX6/1C565XlBWpEaDy3F9/URU', NULL, 'student', '2025-12-02 17:15:16.753873+00', 1);
INSERT INTO auth.users VALUES (8, 'johndoe@email.com', '$argon2id$v=19$m=65536,t=3,p=4$RwURN1eLbcluep6Sqe8hqg$Zl04fZWYGGqNoSrvmiUMxgMGIbiOc67ld4Y6EHNwbxQ', 'John Doe', 'student', '2025-12-26 15:33:01.66004+00', 1);
INSERT INTO auth.users VALUES (7, 'luis.suarez@gmail.com', '$argon2id$v=19$m=65536,t=3,p=4$PaZf4AscxgV+mpfKosjhCA$V1vNdkRWmun2V09q0BGgw2zw5srsa3YYuSDVmtDWGn0', 'Luis Suarez', 'teacher', '2025-12-26 12:35:36.266913+00', 1);
INSERT INTO auth.users VALUES (9, 'smith@email.com', '$argon2id$v=19$m=65536,t=3,p=4$+QRITnf64V3Wf0xgM5PcGA$d2hR5ibvI8WAy5/TYbZoRs70xARk8HSwoc6uOAX0rOE', 'Mr smith', 'teacher', '2026-03-03 15:13:19.666512+00', 1);
INSERT INTO auth.users VALUES (10, 'teacher@email.com', '$argon2id$v=19$m=65536,t=3,p=4$bXF1Dooq7alVKARxt4AdXw$uBgx+BbNLZyn4fP57HodYRJv+F6KAqu+LYk6cp0XGLo', 'Teacher Teacher', 'teacher', '2026-03-19 13:48:35.328501+00', 1);


--
-- Data for Name: mcq_options; Type: TABLE DATA; Schema: exam; Owner: admin
--

INSERT INTO exam.mcq_options VALUES (239, 85, '4 bytes', false, 0.00);
INSERT INTO exam.mcq_options VALUES (240, 85, '8 bytes', true, 1.00);
INSERT INTO exam.mcq_options VALUES (241, 85, '2 bytes', false, 0.00);
INSERT INTO exam.mcq_options VALUES (242, 85, 'Depends on compiler', false, 0.00);
INSERT INTO exam.mcq_options VALUES (243, 88, 'int', true, 0.50);
INSERT INTO exam.mcq_options VALUES (244, 88, 'long long', true, 0.50);
INSERT INTO exam.mcq_options VALUES (245, 88, 'float', false, -0.50);
INSERT INTO exam.mcq_options VALUES (246, 88, 'real', false, -0.50);
INSERT INTO exam.mcq_options VALUES (247, 89, 'public', true, 0.34);
INSERT INTO exam.mcq_options VALUES (248, 89, 'private', true, 0.33);
INSERT INTO exam.mcq_options VALUES (249, 89, 'protected', true, 0.33);
INSERT INTO exam.mcq_options VALUES (250, 89, 'friendly', false, -0.50);
INSERT INTO exam.mcq_options VALUES (251, 89, 'package', false, -0.50);
INSERT INTO exam.mcq_options VALUES (252, 91, '2', true, 0.00);
INSERT INTO exam.mcq_options VALUES (253, 91, '11', false, 0.00);
INSERT INTO exam.mcq_options VALUES (256, 99, 'for', true, 0.00);
INSERT INTO exam.mcq_options VALUES (257, 99, 'if', false, 0.00);
INSERT INTO exam.mcq_options VALUES (260, 101, 'To allow base class pointers to call derived class methods', true, 1.00);
INSERT INTO exam.mcq_options VALUES (261, 101, 'To make the class faster to compile', false, 0.00);
INSERT INTO exam.mcq_options VALUES (262, 101, 'To prevent the class from being inherited', false, 0.00);
INSERT INTO exam.mcq_options VALUES (263, 102, 'reserve()', true, 1.00);
INSERT INTO exam.mcq_options VALUES (264, 102, 'resize()', false, 0.00);
INSERT INTO exam.mcq_options VALUES (265, 102, 'capacity()', false, 0.00);
INSERT INTO exam.mcq_options VALUES (266, 103, 'Using the scope resolution operator (::)', true, 1.00);
INSERT INTO exam.mcq_options VALUES (267, 103, 'Using the dot operator (.) on an instance', false, 0.00);
INSERT INTO exam.mcq_options VALUES (268, 103, 'Static members are private by default', false, 0.00);
INSERT INTO exam.mcq_options VALUES (269, 106, 'The derived parts of the object are removed', true, 1.00);
INSERT INTO exam.mcq_options VALUES (270, 106, 'A compile-time error occurs', false, 0.00);
INSERT INTO exam.mcq_options VALUES (271, 106, 'The object is safely cast to the derived type', false, 0.00);
INSERT INTO exam.mcq_options VALUES (272, 106, 'The program crashes at runtime', false, 0.00);
INSERT INTO exam.mcq_options VALUES (273, 107, 'As a hidden member within the object instance', true, 1.00);
INSERT INTO exam.mcq_options VALUES (274, 107, 'In the global static memory area', false, 0.00);
INSERT INTO exam.mcq_options VALUES (275, 107, 'In the CPU registers', false, 0.00);
INSERT INTO exam.mcq_options VALUES (276, 107, 'In the page file', false, 0.00);
INSERT INTO exam.mcq_options VALUES (277, 108, 'delete[] arr;', true, 1.00);
INSERT INTO exam.mcq_options VALUES (278, 108, 'delete arr;', false, 0.00);
INSERT INTO exam.mcq_options VALUES (279, 108, 'free(arr);', false, 0.00);
INSERT INTO exam.mcq_options VALUES (280, 108, 'remove arr;', false, 0.00);
INSERT INTO exam.mcq_options VALUES (281, 109, 'O(log n)', true, 1.00);
INSERT INTO exam.mcq_options VALUES (282, 109, 'O(1)', false, 0.00);
INSERT INTO exam.mcq_options VALUES (283, 109, 'O(n)', false, 0.00);
INSERT INTO exam.mcq_options VALUES (284, 109, 'O(n log n)', false, 0.00);
INSERT INTO exam.mcq_options VALUES (285, 110, '::', true, 1.00);
INSERT INTO exam.mcq_options VALUES (286, 110, '.', false, 0.00);
INSERT INTO exam.mcq_options VALUES (287, 110, '->', false, 0.00);
INSERT INTO exam.mcq_options VALUES (288, 110, ':', false, 0.00);
INSERT INTO exam.mcq_options VALUES (289, 111, '1 byte', true, 1.00);
INSERT INTO exam.mcq_options VALUES (290, 111, '1 bit', false, 0.00);
INSERT INTO exam.mcq_options VALUES (291, 111, '4 bytes', false, 0.00);
INSERT INTO exam.mcq_options VALUES (292, 111, '8 bytes', false, 0.00);


--
-- Data for Name: programming_questions; Type: TABLE DATA; Schema: exam; Owner: admin
--

INSERT INTO exam.programming_questions VALUES (82, '#include <iostream>
using namespace std;

int main() {
    // Write your code here
    return 0;
}', '[{"input": "", "output": "Hello World"}]', '#include <iostream>
using namespace std;

// {{STUDENT_CODE}}

int main() {
    int n;
    while(cin >> n) {
        // Change "solution" to the function name for Q82
        cout << solution(n) << " ";
    }
    return 0;
}', 2, 128000, 'CUSTOM', 'void solution()', 54);
INSERT INTO exam.programming_questions VALUES (122, NULL, '[{"input": "0", "expected_output": "32"}, {"input": "100", "expected_output": "212"}]', NULL, 2, 128000, 'SCALAR', 'int toFahrenheit(int celsius)', 54);
INSERT INTO exam.programming_questions VALUES (84, 'int fib(int n) {
    // Return the Nth Fibonacci number
    return n;
}', '[{"input": "0", "is_public": true, "expected_output": "0"}, {"input": "1", "is_public": true, "expected_output": "1"}, {"input": "10", "is_public": false, "expected_output": "55"}, {"input": "20", "is_public": false, "expected_output": "6765"}]', '#include <iostream>
using namespace std;

// {{STUDENT_CODE}}

int main() {
    int tests[] = {0, 1, 10, 20};
    for(int i = 0; i < 4; i++) {
        cout << fib(tests[i]) << (i < 3 ? " " : "");
    }
    return 0;
}', 2, 128000, 'SCALAR', 'int fib(int n)', 54);
INSERT INTO exam.programming_questions VALUES (83, 'long long factorial(int n) {
    // Implement your logic here
    return 0;
}', '[{"input": "", "expected_output": "120 6 1 3628800 479001600"}]', '#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
#include <cmath>

using namespace std;

#include <iostream>\nusing namespace std;\n\n// {{STUDENT_CODE}}\n\nint main() {\n    int inputs[] = {5, 3, 0, 10, 12};\n    for(int n : inputs) {\n        cout << factorial(n) << " ";\n    }\n    return 0;\n}', 2, 128000, 'SCALAR', 'long long factorial(int n)', 54);
INSERT INTO exam.programming_questions VALUES (112, 'long long factorial(int n) {\n  // Your code here\n}', '[{"input": "", "expected_output": "120 6 1 3628800 479001600"}]', '#include <iostream>\nusing namespace std;\n// {{STUDENT_CODE}}\nint main() { cout << factorial(5) << " " << factorial(3) << " " << factorial(0); }', 2, 128000, 'SCALAR', 'long long factorial(int n)', 54);
INSERT INTO exam.programming_questions VALUES (119, 'int isPrime(int n) {\n    // Your logic here\n}', '[{"input": "7", "expected_output": "1"}, {"input": "10", "expected_output": "0"}, {"input": "13", "expected_output": "1"}]', NULL, 2, 128000, 'SCALAR', 'int isPrime(int n)', 54);
INSERT INTO exam.programming_questions VALUES (113, 'int sumVector(vector<int> v) {\n    // Your code here\n}', '[{"input": "3 10 20 30", "expected_output": "60"}, {"input": "2 5 5", "expected_output": "10"}]', NULL, 2, 128000, 'LINEAR', 'int sumVector(vector<int> v)', 54);
INSERT INTO exam.programming_questions VALUES (120, 'int getAverage(vector<int> v) {\n    // Your code here\n}', '[{"input": "3 10 20 30", "expected_output": "20"}, {"input": "4 1 2 3 4", "expected_output": "2"}]', NULL, 2, 128000, 'LINEAR', 'int getAverage(vector<int> v)', 54);
INSERT INTO exam.programming_questions VALUES (121, 'int countEvens(vector<int> v) {\n    // Your code here\n}', '[{"input": "5 1 2 3 4 6", "expected_output": "3"}, {"input": "3 1 3 5", "expected_output": "0"}]', NULL, 2, 128000, 'LINEAR', 'int countEvens(vector<int> v)', 54);
INSERT INTO exam.programming_questions VALUES (123, 'void reverseInPlace(vector<int> &v) {\n    // Your code here\n}', '[{"input": "3 1 2 3", "expected_output": "3 2 1"}, {"input": "4 10 20 30 40", "expected_output": "40 30 20 10"}]', NULL, 2, 128000, 'LINEAR', 'void reverseInPlace(vector<int> &v)', 54);
INSERT INTO exam.programming_questions VALUES (114, 'int countVowels(string s) {\n    // Your code here\n}', '[{"input": "16", "expected_output": "1"}, {"input": "18", "expected_output": "0"}]', NULL, 2, 128000, 'SCALAR', 'int countVowels(string s)', 54);
INSERT INTO exam.programming_questions VALUES (115, 'int findMax(vector<int> v) {\n    // Your code here\n}', '[{"input": "5 1 9 3 7 5", "expected_output": "9"}]', NULL, 2, 128000, 'LINEAR', 'int findMax(vector<int> v)', 54);
INSERT INTO exam.programming_questions VALUES (201, 'int isEven(int n) {\n    // Implement your logic here\n}', '[{"input": "4", "expected_output": "1"}, {"input": "7", "expected_output": "0"}]', NULL, 2, 128000, 'SCALAR', 'int isEven(int n)', 54);
INSERT INTO exam.programming_questions VALUES (202, '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your code here\n    cout << "*****" << endl;\n    return 0;\n}', '[{"input": "", "expected_output": "*****"}]', NULL, 2, 128000, 'CUSTOM', 'void solution()', 54);
INSERT INTO exam.programming_questions VALUES (203, 'int power(int base, int exp) {\n    // Implement your logic here\n}', '[{"input": "2 3", "expected_output": "8"}, {"input": "5 2", "expected_output": "25"}]', NULL, 2, 128000, 'SCALAR', 'int power(int base, int exp)', 54);
INSERT INTO exam.programming_questions VALUES (205, '#include <iostream>\nusing namespace std;\n\nint main() {\n    int l, w;\n    if (cin >> l >> w) {\n        cout << l * w << endl;\n    }\n    return 0;\n}', '[{"input": "5 10", "expected_output": "50"}]', NULL, 2, 128000, 'CUSTOM', 'void solution()', 54);
INSERT INTO exam.programming_questions VALUES (206, 'int digitalRoot(int n) {\n    // Implement your logic here\n}', '[{"input": "9875", "expected_output": "2"}, {"input": "123", "expected_output": "6"}]', NULL, 2, 128000, 'SCALAR', 'int digitalRoot(int n)', 54);
INSERT INTO exam.programming_questions VALUES (95, 'Node* reverseList(Node* head) {
    // Your code here
    return head;
}', '[{"input": "", "output": "3 2 1"}]', '#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
#include <cmath>

using namespace std;

#include <iostream>
using namespace std;

struct Node {
    int data;
    Node* next;
    Node(int val) : data(val), next(nullptr) {}
};

// {{STUDENT_CODE}}

void printList(Node* head) {
    while(head) {
        cout << head->data << " ";
        head = head->next;
    }
}

int main() {
    Node* head = new Node(1);
    head->next = new Node(2);
    head->next->next = new Node(3);
    
    head = reverseList(head);
    printList(head);
    return 0;
}', 2, 128000, 'LINKED_LIST', 'Node* reverseList(Node* head)', 54);
INSERT INTO exam.programming_questions VALUES (124, '#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n    string s;\n    if (cin >> s) {\n        // Write your string compression code here\n    }\n    return 0;\n}', '[{"input": "aaabb", "expected_output": "a3b2"}, {"input": "abc", "expected_output": "a1b1c1"}]', '#include <iostream>
#include <string>
using namespace std;
// {{STUDENT_CODE}}
int main() { 
    string s; 
    while(cin >> s) cout << compress(s) << " "; 
    return 0; 
}', 2, 128000, 'CUSTOM', 'void solution()', 54);
INSERT INTO exam.programming_questions VALUES (204, 'int containsElement(vector<int> v, int target) {\n    // Your code here\n}', '[{"input": "4 1 3 5 7 5", "expected_output": "1"}, {"input": "3 10 20 30 99", "expected_output": "0"}]', NULL, 2, 128000, 'LINEAR', 'int containsElement(vector<int> v, int target)', 54);


--
-- Data for Name: question_topics; Type: TABLE DATA; Schema: exam; Owner: postgres
--

INSERT INTO exam.question_topics VALUES (82, 1);
INSERT INTO exam.question_topics VALUES (83, 1);
INSERT INTO exam.question_topics VALUES (84, 1);
INSERT INTO exam.question_topics VALUES (85, 1);
INSERT INTO exam.question_topics VALUES (86, 3);
INSERT INTO exam.question_topics VALUES (87, 4);
INSERT INTO exam.question_topics VALUES (88, 1);
INSERT INTO exam.question_topics VALUES (89, 4);
INSERT INTO exam.question_topics VALUES (91, 1);
INSERT INTO exam.question_topics VALUES (93, 1);
INSERT INTO exam.question_topics VALUES (95, 1);
INSERT INTO exam.question_topics VALUES (96, 1);
INSERT INTO exam.question_topics VALUES (99, 1);
INSERT INTO exam.question_topics VALUES (101, 1);
INSERT INTO exam.question_topics VALUES (102, 1);
INSERT INTO exam.question_topics VALUES (103, 1);
INSERT INTO exam.question_topics VALUES (104, 1);
INSERT INTO exam.question_topics VALUES (105, 1);
INSERT INTO exam.question_topics VALUES (106, 1);
INSERT INTO exam.question_topics VALUES (107, 1);
INSERT INTO exam.question_topics VALUES (108, 1);
INSERT INTO exam.question_topics VALUES (109, 1);
INSERT INTO exam.question_topics VALUES (110, 1);
INSERT INTO exam.question_topics VALUES (111, 1);
INSERT INTO exam.question_topics VALUES (112, 5);
INSERT INTO exam.question_topics VALUES (84, 5);
INSERT INTO exam.question_topics VALUES (113, 1);
INSERT INTO exam.question_topics VALUES (114, 1);
INSERT INTO exam.question_topics VALUES (115, 1);
INSERT INTO exam.question_topics VALUES (119, 1);
INSERT INTO exam.question_topics VALUES (120, 1);
INSERT INTO exam.question_topics VALUES (121, 1);
INSERT INTO exam.question_topics VALUES (122, 1);
INSERT INTO exam.question_topics VALUES (123, 1);
INSERT INTO exam.question_topics VALUES (124, 1);
INSERT INTO exam.question_topics VALUES (201, 1);
INSERT INTO exam.question_topics VALUES (202, 1);
INSERT INTO exam.question_topics VALUES (203, 1);
INSERT INTO exam.question_topics VALUES (204, 1);
INSERT INTO exam.question_topics VALUES (205, 1);
INSERT INTO exam.question_topics VALUES (206, 1);


--
-- Data for Name: questions; Type: TABLE DATA; Schema: exam; Owner: admin
--

INSERT INTO exam.questions VALUES (112, 'programming', 'Recursive Factorial', 'Write a function that calculates the factorial of N using recursion.', '2026-03-25 09:07:49.832247+00', 'easy', 1, false, 0.70, 0.30, '[{"type": "REQUIRE", "target": "recursion", "weight": 1.0, "description": "Must use recursion for the factorial calculation"}]');
INSERT INTO exam.questions VALUES (83, 'programming', 'Factorial', 'Write a function that calculates the factorial of n.', '2026-01-14 18:03:26.86117+00', 'medium', 1, false, 0.80, 0.20, '[{"name": "tgamma", "type": "FORBID", "target": "function_call", "weight": 1.0, "description": "Do not use built-in Gamma functions for Factorial."}]');
INSERT INTO exam.questions VALUES (95, 'programming', 'Extra Hard Algo', 'Write a function to reverse a linked list.', '2026-02-17 10:22:01.992351+00', 'hard', 1, false, 0.80, 0.20, '[{"max": 2, "type": "LIMIT", "target": "for_statement", "weight": 0.5, "description": "Keep it efficient: Maximum 2 nested loops."}, {"name": "sort", "type": "FORBID", "target": "function_call", "weight": 0.5, "description": "Do not use std::sort; implement the logic yourself."}]');
INSERT INTO exam.questions VALUES (82, 'programming', 'Hello World', 'Write a program that prints "Hello World" to the console.', '2026-01-14 18:03:26.86117+00', 'easy', 1, false, 0.80, 0.20, '[{"name": "bits/stdc++.h", "type": "FORBID", "target": "header", "weight": 1.0, "description": "Use specific headers (e.g., <iostream>) instead of bits/stdc++.h"}]');
INSERT INTO exam.questions VALUES (85, 'mcq', 'Pointer Size', 'What is the size of a pointer in a 64-bit system?', '2026-01-14 18:03:26.86117+00', 'easy', 1, false, 1.00, 0.00, '[]');
INSERT INTO exam.questions VALUES (87, 'true_false', 'Constructor Return', 'Constructors in C++ do not have a return type.', '2026-01-14 18:07:20.952829+00', 'easy', 1, false, 1.00, 0.00, '[]');
INSERT INTO exam.questions VALUES (88, 'mcq', 'Integer Types', 'Which of the following are valid integer types in C++? (Select all that apply)', '2026-01-14 18:07:20.952829+00', 'medium', 1, true, 1.00, 0.00, '[]');
INSERT INTO exam.questions VALUES (89, 'mcq', 'Access Modifiers', 'Select all valid access modifiers in C++ classes.', '2026-01-14 18:07:20.952829+00', 'medium', 1, true, 1.00, 0.00, '[]');
INSERT INTO exam.questions VALUES (91, 'mcq', 'Extra Easy Q 1', 'What is 1+1 in C++?', '2026-02-17 10:22:01.992351+00', 'easy', 1, false, 1.00, 0.00, '[]');
INSERT INTO exam.questions VALUES (93, 'true_false', 'Extra Medium Q 1', 'Pointers store memory addresses.', '2026-02-17 10:22:01.992351+00', 'medium', 1, false, 1.00, 0.00, '[]');
INSERT INTO exam.questions VALUES (96, 'true_false', 'Missing TF 1', 'C++ is an object-oriented language.', '2026-02-17 10:28:48.490711+00', 'easy', 1, false, 1.00, 0.00, '[]');
INSERT INTO exam.questions VALUES (99, 'mcq', 'Safety MCQ 1', 'Which is a loop structure?', '2026-02-17 10:28:48.490711+00', 'easy', 1, false, 1.00, 0.00, '[]');
INSERT INTO exam.questions VALUES (101, 'mcq', 'Virtual Functions', 'What is the purpose of a virtual function in C++?', '2026-03-04 16:52:10.160995+00', 'hard', 1, false, 1.00, 0.00, '[]');
INSERT INTO exam.questions VALUES (102, 'mcq', 'Vector Capacity', 'Which method increases the allocated storage of a std::vector?', '2026-03-04 16:52:10.160995+00', 'medium', 1, false, 1.00, 0.00, '[]');
INSERT INTO exam.questions VALUES (103, 'mcq', 'Static Members', 'How do you access a static member of a class?', '2026-03-04 16:52:10.160995+00', 'easy', 1, false, 1.00, 0.00, '[]');
INSERT INTO exam.questions VALUES (104, 'true_false', 'Private Inheritance', 'By default, members of a base class are inherited privately in a class.', '2026-03-04 16:52:17.610137+00', 'medium', 1, false, 1.00, 0.00, '[]');
INSERT INTO exam.questions VALUES (105, 'true_false', 'Inline Functions', 'The "inline" keyword guarantees that a function will be inlined by the compiler.', '2026-03-04 16:52:17.610137+00', 'hard', 1, false, 1.00, 0.00, '[]');
INSERT INTO exam.questions VALUES (106, 'mcq', 'Object Slicing', 'What happens when a derived class object is assigned to a base class object by value?', '2026-03-19 15:32:45.01265+00', 'hard', 1, false, 1.00, 0.00, '[]');
INSERT INTO exam.questions VALUES (107, 'mcq', 'Virtual Table', 'Where is the pointer to the virtual table (vptr) typically stored?', '2026-03-19 15:32:45.01265+00', 'hard', 1, false, 1.00, 0.00, '[]');
INSERT INTO exam.questions VALUES (109, 'mcq', 'Map Complexity', 'What is the time complexity of searching for an element in a std::map?', '2026-03-19 15:32:45.01265+00', 'medium', 1, false, 1.00, 0.00, '[]');
INSERT INTO exam.questions VALUES (110, 'mcq', 'Scope Resolution', 'Which operator is used to access a global variable when a local variable with the same name exists?', '2026-03-19 15:32:45.01265+00', 'easy', 1, false, 1.00, 0.00, '[]');
INSERT INTO exam.questions VALUES (111, 'mcq', 'Boolean Size', 'What is the size of a "bool" data type in most modern C++ compilers?', '2026-03-19 15:32:45.01265+00', 'easy', 1, false, 1.00, 0.00, '[]');
INSERT INTO exam.questions VALUES (84, 'programming', 'Fibonacci Nth', 'Write a program that outputs the Nth Fibonacci number.', '2026-01-14 18:03:26.86117+00', 'hard', 1, false, 0.80, 0.20, '[{"type": "REQUIRE", "target": "recursion", "weight": 1.0, "description": "Must implement the solution using a recursive approach."}]');
INSERT INTO exam.questions VALUES (113, 'programming', 'Sum of Vector', 'Write a function that returns the sum of all elements in a vector.', '2026-03-28 18:43:00.557116+00', 'easy', 1, false, 0.80, 0.20, '[]');
INSERT INTO exam.questions VALUES (86, 'true_false', 'Zero Indexing', 'In C++, the first element of a vector is at index 1.', '2026-01-14 18:07:20.952829+00', 'easy', 1, false, 1.00, 0.00, '[]');
INSERT INTO exam.questions VALUES (115, 'programming', 'Find Maximum in Vector', 'Find and return the maximum element in a vector.', '2026-03-28 18:43:00.587168+00', 'hard', 1, false, 0.80, 0.20, '[]');
INSERT INTO exam.questions VALUES (119, 'programming', 'Prime Number Check', 'Write a function isPrime(int n) that returns 1 if prime, 0 otherwise.', '2026-03-28 18:57:29.023583+00', 'medium', 1, false, 0.70, 0.30, '[{"type": "REQUIRE", "target": "recursion", "weight": 1.0, "description": "Must use the Euclidean algorithm recursively."}]');
INSERT INTO exam.questions VALUES (120, 'programming', 'Vector Average', 'Return the integer average (mean) of the elements in a vector.', '2026-03-28 18:57:29.032626+00', 'easy', 1, false, 0.80, 0.20, '[]');
INSERT INTO exam.questions VALUES (121, 'programming', 'Count Even Numbers', 'Count how many even numbers are in the vector.', '2026-03-28 18:57:29.03972+00', 'medium', 1, false, 0.80, 0.20, '[]');
INSERT INTO exam.questions VALUES (122, 'programming', 'Celsius to Fahrenheit', 'Convert Celsius to Fahrenheit. (Return as int for simplicity).', '2026-03-28 18:57:29.044499+00', 'easy', 1, false, 0.80, 0.20, '[]');
INSERT INTO exam.questions VALUES (123, 'programming', 'Reverse Vector In-Place', 'Reverse the given vector in-place. The function should return void.', '2026-03-28 18:57:29.050349+00', 'hard', 1, false, 0.80, 0.20, '[]');
INSERT INTO exam.questions VALUES (124, 'programming', 'String Compression', 'Compress a string "aaabb" to "a3b2". Use the provided custom harness.', '2026-03-28 18:57:29.051791+00', 'hard', 1, false, 0.80, 0.20, '[]');
INSERT INTO exam.questions VALUES (114, 'programming', 'Count Vowels', 'Check if a number is a power of two using recursion. Return 1 for true, 0 for false.', '2026-03-28 18:43:00.583274+00', 'hard', 1, false, 0.80, 0.20, '[{"type": "REQUIRE", "target": "recursion", "weight": 0.7, "description": "Must use recursion."}, {"name": "pow", "type": "FORBID", "target": "function_call", "weight": 0.3, "description": "Do not use the built-in pow() function."}]');
INSERT INTO exam.questions VALUES (108, 'mcq', 'Memory Deallocation', 'Which of the following correctly deallocates a vector allocated with "new int[10]"?', '2026-03-19 15:32:45.01265+00', 'medium', 1, false, 1.00, 0.00, '[]');
INSERT INTO exam.questions VALUES (201, 'programming', 'Is Number Even', 'Write a function that returns 1 if a number is even, and 0 if it is odd.', '2026-07-07 08:13:49.489542+00', 'easy', 1, false, 0.80, 0.20, '[]');
INSERT INTO exam.questions VALUES (202, 'programming', 'Print Star Line', 'Write a program that prints a line of 5 asterisks (*****).', '2026-07-07 08:13:49.489542+00', 'easy', 1, false, 0.80, 0.20, '[]');
INSERT INTO exam.questions VALUES (203, 'programming', 'Calculate Power', 'Write a function that calculates base raised to the power of exp.', '2026-07-07 08:13:49.489542+00', 'medium', 1, false, 0.80, 0.20, '[]');
INSERT INTO exam.questions VALUES (204, 'programming', 'Find Element in Vector', 'Return 1 if target exists within the vector, 0 otherwise.', '2026-07-07 08:13:49.489542+00', 'medium', 1, false, 0.80, 0.20, '[]');
INSERT INTO exam.questions VALUES (205, 'programming', 'Rectangle Area Wrapper', 'Read length and width from cin, output area.', '2026-07-07 08:13:49.489542+00', 'medium', 1, false, 0.80, 0.20, '[]');
INSERT INTO exam.questions VALUES (206, 'programming', 'Digital Root Sum', 'Find the single digit sum of all digits of n recursively.', '2026-07-07 08:13:49.489542+00', 'hard', 1, false, 0.80, 0.20, '[]');


--
-- Data for Name: student_answers; Type: TABLE DATA; Schema: exam; Owner: admin
--



--
-- Data for Name: students; Type: TABLE DATA; Schema: exam; Owner: admin
--

INSERT INTO exam.students VALUES (7, 'Luis', 'Suarez', 1);
INSERT INTO exam.students VALUES (8, 'John', 'Doe', 6);
INSERT INTO exam.students VALUES (9, 'Mr', 'smith', 1);
INSERT INTO exam.students VALUES (10, 'Teacher', 'Teacher', 1);


--
-- Data for Name: submission_questions; Type: TABLE DATA; Schema: exam; Owner: admin
--



--
-- Data for Name: submissions; Type: TABLE DATA; Schema: exam; Owner: admin
--



--
-- Data for Name: test_questions; Type: TABLE DATA; Schema: exam; Owner: admin
--



--
-- Data for Name: test_slots; Type: TABLE DATA; Schema: exam; Owner: postgres
--

INSERT INTO exam.test_slots VALUES (1, 47, 1, 5, 'easy', 10.00, 0.70, 0.30, 'programming', 'SCALAR');
INSERT INTO exam.test_slots VALUES (2, 48, 1, 5, 'hard', 10.00, 0.80, 0.20, 'programming', 'SCALAR');


--
-- Data for Name: tests; Type: TABLE DATA; Schema: exam; Owner: admin
--

INSERT INTO exam.tests VALUES (18, 'TIMERS ARE ADDED!', 'test for timers', '2026-01-14 16:32:27.201581+00', '2026-01-14 16:32:00+00', '2026-01-14 17:32:00+00', 0, 0, 1, 1.00, 5.00, 10.00, false, true, '{"topics": [1], "difficulty_distribution": {"easy": 0, "hard": 1, "medium": 0}}', 7, true, 60, true);
INSERT INTO exam.tests VALUES (19, 'TEST AGAIN NIGGA', 'e', '2026-01-14 16:40:38.555781+00', '2026-01-14 16:50:00+00', '2026-01-14 17:50:00+00', 0, 0, 1, 1.00, 5.00, 10.00, false, true, '{"topics": [2], "difficulty_distribution": {"easy": 0, "hard": 0, "medium": 1}}', 7, true, 60, true);
INSERT INTO exam.tests VALUES (20, 'Here is an exam', 'test', '2026-01-14 17:58:59.053416+00', '2026-01-14 17:59:00+00', '2026-01-14 18:58:00+00', 0, 0, 1, 1.00, 5.00, 10.00, false, true, '{"topics": [1], "difficulty_distribution": {"easy": 0, "hard": 0, "medium": 1}}', 7, true, 59, true);
INSERT INTO exam.tests VALUES (21, 'Bruh', 'bruh', '2026-01-14 18:09:31.361247+00', '2026-01-14 18:10:00+00', '2026-01-14 19:12:00+00', 1, 1, 1, 1.00, 5.00, 10.00, false, true, '{"topics": [3, 1, 2, 4], "difficulty_distribution": {"easy": 1, "hard": 1, "medium": 1}}', 7, true, 62, true);
INSERT INTO exam.tests VALUES (22, 'Test 17/2', 'This is a test', '2026-02-17 09:36:01.94666+00', '2026-02-17 11:00:00+00', '2026-02-17 15:30:00+00', 5, 4, 1, 1.00, 5.00, 10.00, false, true, '{"topics": [1], "difficulty_distribution": {"easy": 4, "hard": 2, "medium": 4}}', 7, true, 270, true);
INSERT INTO exam.tests VALUES (23, 'C++ Basics test', 'This is a C++ basics test', '2026-02-17 09:37:36.014937+00', '2026-02-17 09:36:00+00', '2026-02-17 12:39:00+00', 5, 4, 1, 1.00, 5.00, 10.00, false, true, '{"topics": [1], "difficulty_distribution": {"easy": 4, "hard": 1, "medium": 5}}', 7, true, 183, true);
INSERT INTO exam.tests VALUES (24, 'C++ Basics 2', '', '2026-02-17 10:23:51.993894+00', '2026-02-17 10:23:00+00', '2026-02-17 13:26:00+00', 5, 4, 1, 1.00, 5.00, 10.00, false, true, '{"topics": [1], "difficulty_distribution": {"easy": 4, "hard": 2, "medium": 4}}', 7, true, 183, true);
INSERT INTO exam.tests VALUES (25, 'C++ Basics 3', 'May this one finally work', '2026-02-17 10:29:51.434765+00', '2026-02-17 10:29:00+00', '2026-02-17 13:32:00+00', 5, 4, 1, 1.00, 5.00, 10.00, false, true, '{"topics": [1], "difficulty_distribution": {"easy": 4, "hard": 1, "medium": 5}}', 7, true, 183, true);
INSERT INTO exam.tests VALUES (26, 'C++ Test (???) extra', 'Last one worked kinda', '2026-02-17 10:36:51.050815+00', '2026-02-17 10:36:00+00', '2026-02-17 13:39:00+00', 5, 4, 1, 1.00, 5.00, 10.00, false, true, '{"topics": [1], "difficulty_distribution": {"easy": 3, "hard": 2, "medium": 5}}', 7, true, 183, true);
INSERT INTO exam.tests VALUES (27, 'Test test', 'this is a test today!!!!', '2026-03-03 15:15:10.877246+00', '2026-03-03 15:14:00+00', '2026-03-04 15:14:00+00', 4, 5, 1, 1.00, 5.00, 10.00, false, true, '{"topics": [1], "difficulty_distribution": {"easy": 4, "hard": 2, "medium": 4}}', 9, true, 1440, true);
INSERT INTO exam.tests VALUES (28, 'LALALALLALA', 'I AM TEST!!!!', '2026-03-04 14:55:21.339349+00', '2026-03-04 14:55:00+00', '2026-03-05 14:55:00+00', 4, 5, 1, 1.00, 5.00, 10.00, false, true, '{"topics": [1], "difficulty_distribution": {"easy": 4, "hard": 2, "medium": 4}}', 9, true, 1440, true);
INSERT INTO exam.tests VALUES (29, 'OMGMGO', 'omgahmgowh', '2026-03-04 15:12:12.922313+00', '2026-03-04 15:11:00+00', '2026-03-05 15:11:00+00', 4, 5, 1, 1.00, 5.00, 10.00, false, true, '{"topics": [1], "difficulty_distribution": {"easy": 4, "hard": 2, "medium": 4}}', 9, true, 1440, true);
INSERT INTO exam.tests VALUES (30, 'HALLELUJAH', 'NIGGA', '2026-03-04 15:20:37.665042+00', '2026-03-04 15:20:00+00', '2026-03-05 15:20:00+00', 4, 5, 1, 1.00, 5.00, 10.00, false, true, '{"topics": [1], "difficulty_distribution": {"easy": 4, "hard": 2, "medium": 4}}', 9, true, 1440, true);
INSERT INTO exam.tests VALUES (31, 'JJ', 'GG', '2026-03-04 15:24:43.398585+00', '2026-03-04 15:24:00+00', '2026-03-05 15:24:00+00', 4, 5, 1, 1.00, 5.00, 10.00, false, true, '{"topics": [1], "difficulty_distribution": {"easy": 4, "hard": 2, "medium": 4}}', 9, true, 1440, true);
INSERT INTO exam.tests VALUES (32, 'www', 'www..com', '2026-03-04 15:31:24.043814+00', '2026-03-04 15:31:00+00', '2026-03-05 15:31:00+00', 4, 5, 1, 1.00, 5.00, 10.00, false, true, '{"topics": [1], "difficulty_distribution": {"easy": 4, "hard": 2, "medium": 4}}', 9, true, 1440, true);
INSERT INTO exam.tests VALUES (33, 'lmnop', 'qrstuv', '2026-03-04 15:43:38.993855+00', '2026-03-04 15:43:00+00', '2026-03-05 15:43:00+00', 4, 5, 1, 1.00, 5.00, 10.00, false, true, '{"topics": [1], "difficulty_distribution": {"easy": 4, "hard": 2, "medium": 4}}', 9, true, 1440, true);
INSERT INTO exam.tests VALUES (34, 'terry', 'Jermaine', '2026-03-04 16:27:13.455165+00', '2026-03-04 16:26:00+00', '2026-03-05 16:27:00+00', 4, 5, 1, 1.00, 5.00, 10.00, false, true, '{"topics": [1], "difficulty_distribution": {"easy": 4, "hard": 2, "medium": 4}}', 9, true, 1441, true);
INSERT INTO exam.tests VALUES (35, 'REEEEEE', 'RE BROOOOOOOOOO', '2026-03-04 16:33:09.222346+00', '2026-03-04 16:32:00+00', '2026-03-05 16:32:00+00', 4, 5, 1, 1.00, 5.00, 10.00, false, true, '{"topics": [1], "difficulty_distribution": {"easy": 4, "hard": 2, "medium": 4}}', 9, true, 1440, true);
INSERT INTO exam.tests VALUES (36, 'INSANE COMEBACK', 'LOL', '2026-03-19 14:06:25.566225+00', '2026-03-19 14:06:00+00', '2026-03-20 14:06:00+00', 4, 5, 1, 1.00, 5.00, 10.00, false, true, '{"topics": [1], "difficulty_distribution": {"easy": 4, "hard": 2, "medium": 4}}', 10, true, 1440, true);
INSERT INTO exam.tests VALUES (37, 'INSANE COMEBACK2 ', 'ALCHEMY', '2026-03-19 14:25:30.563496+00', '2026-03-19 14:25:00+00', '2026-03-20 14:25:00+00', 4, 5, 1, 1.00, 5.00, 10.00, false, true, '{"topics": [1], "difficulty_distribution": {"easy": 4, "hard": 2, "medium": 4}}', 10, true, 1440, true);
INSERT INTO exam.tests VALUES (38, 'PLS WORK', 'kkkk', '2026-03-19 15:36:53.149741+00', '2026-03-19 15:36:00+00', '2026-03-20 15:36:00+00', 4, 5, 1, 1.00, 5.00, 10.00, false, true, '{"topics": [1], "difficulty_distribution": {"easy": 4, "hard": 2, "medium": 4}}', 10, true, 1440, true);
INSERT INTO exam.tests VALUES (39, 'today is a new day', 'lets go', '2026-03-20 10:29:01.882606+00', '2026-03-20 10:28:00+00', '2026-03-21 10:28:00+00', 4, 5, 1, 1.00, 5.00, 10.00, false, true, '{"topics": [1], "difficulty_distribution": {"easy": 4, "hard": 2, "medium": 4}}', 10, true, 1440, true);
INSERT INTO exam.tests VALUES (40, 'Today was a good day', 'ICECUBE', '2026-03-20 13:31:35.077904+00', '2026-03-20 13:30:00+00', '2026-03-21 13:31:00+00', 4, 5, 1, 1.00, 5.00, 10.00, false, true, '{"topics": [1], "difficulty_distribution": {"easy": 4, "hard": 2, "medium": 4}}', 10, true, 1441, true);
INSERT INTO exam.tests VALUES (41, 'Make this work please', 'OH LOOOOOOORD', '2026-03-20 13:33:10.629282+00', '2026-03-20 13:32:00+00', '2026-04-03 12:32:00+00', 4, 5, 1, 1.00, 5.00, 10.00, false, true, '{"topics": [1], "difficulty_distribution": {"easy": 4, "hard": 2, "medium": 4}}', 10, true, 20100, true);
INSERT INTO exam.tests VALUES (42, 'ggg', 'ggg', '2026-03-20 13:34:05.704951+00', '2026-03-20 13:33:00+00', '2026-03-21 13:33:00+00', 4, 5, 1, 1.00, 5.00, 10.00, false, true, '{"topics": [1], "difficulty_distribution": {"easy": 4, "hard": 2, "medium": 4}}', 10, true, 1440, true);
INSERT INTO exam.tests VALUES (43, 'fffffffffffffff', 'ffffffff', '2026-03-20 13:50:12.602709+00', '2026-03-20 13:49:00+00', '2026-03-21 13:49:00+00', 4, 5, 1, 1.00, 5.00, 10.00, false, true, '{"topics": [1], "difficulty_distribution": {"easy": 4, "hard": 2, "medium": 4}}', 10, true, 1440, true);
INSERT INTO exam.tests VALUES (44, 'published', 'p l s w o r k', '2026-03-20 17:45:02.835238+00', '2026-03-20 17:44:00+00', '2026-03-21 17:44:00+00', 4, 5, 1, 1.00, 5.00, 10.00, false, true, '{"topics": [1], "difficulty_distribution": {"easy": 4, "hard": 2, "medium": 4}}', 10, true, 1440, true);
INSERT INTO exam.tests VALUES (45, 'The audAciTY', 'I LOVE tyler the creator', '2026-03-22 14:03:34.529429+00', '2026-03-22 14:03:00+00', '2026-03-23 14:03:00+00', 4, 5, 1, 1.00, 5.00, 10.00, false, true, '{"topics": [1], "difficulty_distribution": {"easy": 4, "hard": 2, "medium": 4}}', 10, true, 1440, true);
INSERT INTO exam.tests VALUES (46, 'qweqwqweqw', 'qweqwew', '2026-03-22 17:05:00.331884+00', '2026-03-22 17:04:00+00', '2026-03-23 17:03:00+00', 4, 5, 1, 1.00, 5.00, 10.00, false, true, '{"topics": [1], "difficulty_distribution": {"easy": 4, "hard": 2, "medium": 4}}', 10, true, 1439, true);
INSERT INTO exam.tests VALUES (47, 'CS101 Midterm', 'Intro to Programming Assessment', '2026-03-25 09:08:09.5517+00', NULL, NULL, 0, 0, 0, 1.00, 2.00, 10.00, false, true, NULL, 1, true, 60, true);
INSERT INTO exam.tests VALUES (48, '24-Hour Debug Test', 'A long-duration test for verifying AST and Judge0 integration.', '2026-03-25 12:39:02.972843+00', '2026-03-25 12:39:02.972843+00', '2026-04-24 12:39:02.972843+00', 0, 0, 0, 1.00, 2.00, 10.00, false, true, NULL, 1, true, 60, true);


--
-- Data for Name: topics; Type: TABLE DATA; Schema: exam; Owner: postgres
--

INSERT INTO exam.topics VALUES (1, 'C++ Basics', 'Introductory C++ concepts');
INSERT INTO exam.topics VALUES (2, 'Java Basics', 'Core Java concepts including OOP, primitives, and syntax');
INSERT INTO exam.topics VALUES (3, 'Arrays & Strings', NULL);
INSERT INTO exam.topics VALUES (4, 'Object Oriented Programming', NULL);
INSERT INTO exam.topics VALUES (5, 'Recursion', 'Basics of functions calling themselves');


--
-- Data for Name: true_false_answers; Type: TABLE DATA; Schema: exam; Owner: admin
--

INSERT INTO exam.true_false_answers VALUES (86, false);
INSERT INTO exam.true_false_answers VALUES (87, true);
INSERT INTO exam.true_false_answers VALUES (93, true);
INSERT INTO exam.true_false_answers VALUES (96, true);
INSERT INTO exam.true_false_answers VALUES (104, true);
INSERT INTO exam.true_false_answers VALUES (105, false);


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: admin
--

SELECT pg_catalog.setval('auth.refresh_tokens_id_seq', 405, true);


--
-- Name: users_user_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: admin
--

SELECT pg_catalog.setval('auth.users_user_id_seq', 10, true);


--
-- Name: mcq_options_option_id_seq; Type: SEQUENCE SET; Schema: exam; Owner: admin
--

SELECT pg_catalog.setval('exam.mcq_options_option_id_seq', 292, true);


--
-- Name: questions_question_id_seq; Type: SEQUENCE SET; Schema: exam; Owner: admin
--

SELECT pg_catalog.setval('exam.questions_question_id_seq', 124, true);


--
-- Name: student_answers_answer_id_seq; Type: SEQUENCE SET; Schema: exam; Owner: admin
--

SELECT pg_catalog.setval('exam.student_answers_answer_id_seq', 1, false);


--
-- Name: students_student_id_seq; Type: SEQUENCE SET; Schema: exam; Owner: admin
--

SELECT pg_catalog.setval('exam.students_student_id_seq', 1, false);


--
-- Name: submission_questions_submission_question_id_seq; Type: SEQUENCE SET; Schema: exam; Owner: admin
--

SELECT pg_catalog.setval('exam.submission_questions_submission_question_id_seq', 1, false);


--
-- Name: submissions_submission_id_seq; Type: SEQUENCE SET; Schema: exam; Owner: admin
--

SELECT pg_catalog.setval('exam.submissions_submission_id_seq', 1, false);


--
-- Name: test_slots_slot_id_seq; Type: SEQUENCE SET; Schema: exam; Owner: postgres
--

SELECT pg_catalog.setval('exam.test_slots_slot_id_seq', 2, true);


--
-- Name: tests_test_id_seq; Type: SEQUENCE SET; Schema: exam; Owner: admin
--

SELECT pg_catalog.setval('exam.tests_test_id_seq', 48, true);


--
-- Name: topics_topic_id_seq; Type: SEQUENCE SET; Schema: exam; Owner: postgres
--

SELECT pg_catalog.setval('exam.topics_topic_id_seq', 6, true);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: session session_pkey; Type: CONSTRAINT; Schema: auth; Owner: admin
--

ALTER TABLE ONLY auth.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid);


--
-- Name: users user_email_uniq; Type: CONSTRAINT; Schema: auth; Owner: admin
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT user_email_uniq UNIQUE (email);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: auth; Owner: admin
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: auth; Owner: admin
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- Name: mcq_options mcq_options_pkey; Type: CONSTRAINT; Schema: exam; Owner: admin
--

ALTER TABLE ONLY exam.mcq_options
    ADD CONSTRAINT mcq_options_pkey PRIMARY KEY (option_id);


--
-- Name: programming_questions programming_questions_pkey; Type: CONSTRAINT; Schema: exam; Owner: admin
--

ALTER TABLE ONLY exam.programming_questions
    ADD CONSTRAINT programming_questions_pkey PRIMARY KEY (question_id);


--
-- Name: question_topics question_topics_pkey; Type: CONSTRAINT; Schema: exam; Owner: postgres
--

ALTER TABLE ONLY exam.question_topics
    ADD CONSTRAINT question_topics_pkey PRIMARY KEY (question_id, topic_id);


--
-- Name: questions questions_pkey; Type: CONSTRAINT; Schema: exam; Owner: admin
--

ALTER TABLE ONLY exam.questions
    ADD CONSTRAINT questions_pkey PRIMARY KEY (question_id);


--
-- Name: student_answers student_answers_pkey; Type: CONSTRAINT; Schema: exam; Owner: admin
--

ALTER TABLE ONLY exam.student_answers
    ADD CONSTRAINT student_answers_pkey PRIMARY KEY (answer_id);


--
-- Name: students students_pkey; Type: CONSTRAINT; Schema: exam; Owner: admin
--

ALTER TABLE ONLY exam.students
    ADD CONSTRAINT students_pkey PRIMARY KEY (student_id);


--
-- Name: submission_questions submission_questions_pkey; Type: CONSTRAINT; Schema: exam; Owner: admin
--

ALTER TABLE ONLY exam.submission_questions
    ADD CONSTRAINT submission_questions_pkey PRIMARY KEY (submission_question_id);


--
-- Name: submissions submissions_pkey; Type: CONSTRAINT; Schema: exam; Owner: admin
--

ALTER TABLE ONLY exam.submissions
    ADD CONSTRAINT submissions_pkey PRIMARY KEY (submission_id);


--
-- Name: test_questions test_questions_pkey; Type: CONSTRAINT; Schema: exam; Owner: admin
--

ALTER TABLE ONLY exam.test_questions
    ADD CONSTRAINT test_questions_pkey PRIMARY KEY (test_id, question_id);


--
-- Name: test_slots test_slots_pkey; Type: CONSTRAINT; Schema: exam; Owner: postgres
--

ALTER TABLE ONLY exam.test_slots
    ADD CONSTRAINT test_slots_pkey PRIMARY KEY (slot_id);


--
-- Name: tests tests_pkey; Type: CONSTRAINT; Schema: exam; Owner: admin
--

ALTER TABLE ONLY exam.tests
    ADD CONSTRAINT tests_pkey PRIMARY KEY (test_id);


--
-- Name: topics topics_name_key; Type: CONSTRAINT; Schema: exam; Owner: postgres
--

ALTER TABLE ONLY exam.topics
    ADD CONSTRAINT topics_name_key UNIQUE (name);


--
-- Name: topics topics_pkey; Type: CONSTRAINT; Schema: exam; Owner: postgres
--

ALTER TABLE ONLY exam.topics
    ADD CONSTRAINT topics_pkey PRIMARY KEY (topic_id);


--
-- Name: true_false_answers true_false_answers_pkey; Type: CONSTRAINT; Schema: exam; Owner: admin
--

ALTER TABLE ONLY exam.true_false_answers
    ADD CONSTRAINT true_false_answers_pkey PRIMARY KEY (question_id);


--
-- Name: student_answers unique_submission_question; Type: CONSTRAINT; Schema: exam; Owner: admin
--

ALTER TABLE ONLY exam.student_answers
    ADD CONSTRAINT unique_submission_question UNIQUE (submission_question_id);


--
-- Name: IDX_auth_session_expire; Type: INDEX; Schema: auth; Owner: admin
--

CREATE INDEX "IDX_auth_session_expire" ON auth.session USING btree (expire);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: auth; Owner: admin
--

CREATE INDEX "IDX_session_expire" ON auth.session USING btree (expire);


--
-- Name: refresh_tokens_user_idx; Type: INDEX; Schema: auth; Owner: admin
--

CREATE INDEX refresh_tokens_user_idx ON auth.refresh_tokens USING btree (user_id);


--
-- Name: rt_hash_idx; Type: INDEX; Schema: auth; Owner: admin
--

CREATE INDEX rt_hash_idx ON auth.refresh_tokens USING btree (token_hash);


--
-- Name: rt_revoked_ix; Type: INDEX; Schema: auth; Owner: admin
--

CREATE INDEX rt_revoked_ix ON auth.refresh_tokens USING btree (revoked_at);


--
-- Name: rt_user_idx; Type: INDEX; Schema: auth; Owner: admin
--

CREATE INDEX rt_user_idx ON auth.refresh_tokens USING btree (user_id);


--
-- Name: users_email_ci_unique; Type: INDEX; Schema: auth; Owner: admin
--

CREATE UNIQUE INDEX users_email_ci_unique ON auth.users USING btree (lower(email));


--
-- Name: uniq_active_submission_per_student_test; Type: INDEX; Schema: exam; Owner: admin
--

CREATE UNIQUE INDEX uniq_active_submission_per_student_test ON exam.submissions USING btree (student_id, test_id) WHERE (status = 'in_progress'::text);


--
-- Name: refresh_tokens refresh_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(user_id) ON DELETE CASCADE;


--
-- Name: mcq_options mcq_options_question_id_fkey; Type: FK CONSTRAINT; Schema: exam; Owner: admin
--

ALTER TABLE ONLY exam.mcq_options
    ADD CONSTRAINT mcq_options_question_id_fkey FOREIGN KEY (question_id) REFERENCES exam.questions(question_id) ON DELETE CASCADE;


--
-- Name: programming_questions programming_questions_question_id_fkey; Type: FK CONSTRAINT; Schema: exam; Owner: admin
--

ALTER TABLE ONLY exam.programming_questions
    ADD CONSTRAINT programming_questions_question_id_fkey FOREIGN KEY (question_id) REFERENCES exam.questions(question_id) ON DELETE CASCADE;


--
-- Name: question_topics question_topics_question_id_fkey; Type: FK CONSTRAINT; Schema: exam; Owner: postgres
--

ALTER TABLE ONLY exam.question_topics
    ADD CONSTRAINT question_topics_question_id_fkey FOREIGN KEY (question_id) REFERENCES exam.questions(question_id) ON DELETE CASCADE;


--
-- Name: question_topics question_topics_topic_id_fkey; Type: FK CONSTRAINT; Schema: exam; Owner: postgres
--

ALTER TABLE ONLY exam.question_topics
    ADD CONSTRAINT question_topics_topic_id_fkey FOREIGN KEY (topic_id) REFERENCES exam.topics(topic_id) ON DELETE CASCADE;


--
-- Name: questions questions_created_by_fkey; Type: FK CONSTRAINT; Schema: exam; Owner: admin
--

ALTER TABLE ONLY exam.questions
    ADD CONSTRAINT questions_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(user_id);


--
-- Name: student_answers student_answers_submission_question_id_fkey; Type: FK CONSTRAINT; Schema: exam; Owner: admin
--

ALTER TABLE ONLY exam.student_answers
    ADD CONSTRAINT student_answers_submission_question_id_fkey FOREIGN KEY (submission_question_id) REFERENCES exam.submission_questions(submission_question_id) ON DELETE CASCADE;


--
-- Name: students students_student_id_fkey; Type: FK CONSTRAINT; Schema: exam; Owner: admin
--

ALTER TABLE ONLY exam.students
    ADD CONSTRAINT students_student_id_fkey FOREIGN KEY (student_id) REFERENCES auth.users(user_id) ON DELETE CASCADE;


--
-- Name: submission_questions submission_questions_question_id_fkey; Type: FK CONSTRAINT; Schema: exam; Owner: admin
--

ALTER TABLE ONLY exam.submission_questions
    ADD CONSTRAINT submission_questions_question_id_fkey FOREIGN KEY (question_id) REFERENCES exam.questions(question_id) ON DELETE RESTRICT;


--
-- Name: submission_questions submission_questions_submission_id_fkey; Type: FK CONSTRAINT; Schema: exam; Owner: admin
--

ALTER TABLE ONLY exam.submission_questions
    ADD CONSTRAINT submission_questions_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES exam.submissions(submission_id) ON DELETE CASCADE;


--
-- Name: test_questions test_questions_question_id_fkey; Type: FK CONSTRAINT; Schema: exam; Owner: admin
--

ALTER TABLE ONLY exam.test_questions
    ADD CONSTRAINT test_questions_question_id_fkey FOREIGN KEY (question_id) REFERENCES exam.questions(question_id) ON DELETE CASCADE;


--
-- Name: test_questions test_questions_test_id_fkey; Type: FK CONSTRAINT; Schema: exam; Owner: admin
--

ALTER TABLE ONLY exam.test_questions
    ADD CONSTRAINT test_questions_test_id_fkey FOREIGN KEY (test_id) REFERENCES exam.tests(test_id) ON DELETE CASCADE;


--
-- Name: test_slots test_slots_test_id_fkey; Type: FK CONSTRAINT; Schema: exam; Owner: postgres
--

ALTER TABLE ONLY exam.test_slots
    ADD CONSTRAINT test_slots_test_id_fkey FOREIGN KEY (test_id) REFERENCES exam.tests(test_id) ON DELETE CASCADE;


--
-- Name: test_slots test_slots_topic_id_fkey; Type: FK CONSTRAINT; Schema: exam; Owner: postgres
--

ALTER TABLE ONLY exam.test_slots
    ADD CONSTRAINT test_slots_topic_id_fkey FOREIGN KEY (topic_id) REFERENCES exam.topics(topic_id);


--
-- Name: tests tests_created_by_fkey; Type: FK CONSTRAINT; Schema: exam; Owner: admin
--

ALTER TABLE ONLY exam.tests
    ADD CONSTRAINT tests_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(user_id);


--
-- Name: true_false_answers true_false_answers_question_id_fkey; Type: FK CONSTRAINT; Schema: exam; Owner: admin
--

ALTER TABLE ONLY exam.true_false_answers
    ADD CONSTRAINT true_false_answers_question_id_fkey FOREIGN KEY (question_id) REFERENCES exam.questions(question_id) ON DELETE CASCADE;


--
-- Name: SCHEMA auth; Type: ACL; Schema: -; Owner: admin
--

GRANT USAGE ON SCHEMA auth TO app_auth;
GRANT USAGE ON SCHEMA auth TO app_exam;


--
-- Name: SCHEMA exam; Type: ACL; Schema: -; Owner: admin
--

GRANT USAGE ON SCHEMA exam TO app_exam;
GRANT USAGE ON SCHEMA exam TO app_auth;


--
-- Name: TABLE refresh_tokens; Type: ACL; Schema: auth; Owner: admin
--

GRANT ALL ON TABLE auth.refresh_tokens TO app_auth;
GRANT ALL ON TABLE auth.refresh_tokens TO app_exam;


--
-- Name: SEQUENCE refresh_tokens_id_seq; Type: ACL; Schema: auth; Owner: admin
--

GRANT ALL ON SEQUENCE auth.refresh_tokens_id_seq TO app_auth;
GRANT ALL ON SEQUENCE auth.refresh_tokens_id_seq TO app_exam;


--
-- Name: TABLE session; Type: ACL; Schema: auth; Owner: admin
--

GRANT ALL ON TABLE auth.session TO app_auth;
GRANT ALL ON TABLE auth.session TO app_exam;


--
-- Name: TABLE users; Type: ACL; Schema: auth; Owner: admin
--

GRANT ALL ON TABLE auth.users TO app_auth;
GRANT ALL ON TABLE auth.users TO app_exam;


--
-- Name: SEQUENCE users_user_id_seq; Type: ACL; Schema: auth; Owner: admin
--

GRANT ALL ON SEQUENCE auth.users_user_id_seq TO app_auth;
GRANT ALL ON SEQUENCE auth.users_user_id_seq TO app_exam;


--
-- Name: TABLE mcq_options; Type: ACL; Schema: exam; Owner: admin
--

GRANT ALL ON TABLE exam.mcq_options TO app_exam;
GRANT ALL ON TABLE exam.mcq_options TO app_auth;


--
-- Name: SEQUENCE mcq_options_option_id_seq; Type: ACL; Schema: exam; Owner: admin
--

GRANT ALL ON SEQUENCE exam.mcq_options_option_id_seq TO app_exam;
GRANT ALL ON SEQUENCE exam.mcq_options_option_id_seq TO app_auth;


--
-- Name: TABLE programming_questions; Type: ACL; Schema: exam; Owner: admin
--

GRANT ALL ON TABLE exam.programming_questions TO app_exam;
GRANT ALL ON TABLE exam.programming_questions TO app_auth;


--
-- Name: TABLE question_topics; Type: ACL; Schema: exam; Owner: postgres
--

GRANT SELECT ON TABLE exam.question_topics TO admin;
GRANT ALL ON TABLE exam.question_topics TO app_exam;
GRANT ALL ON TABLE exam.question_topics TO app_auth;


--
-- Name: TABLE questions; Type: ACL; Schema: exam; Owner: admin
--

GRANT ALL ON TABLE exam.questions TO app_exam;
GRANT ALL ON TABLE exam.questions TO app_auth;


--
-- Name: SEQUENCE questions_question_id_seq; Type: ACL; Schema: exam; Owner: admin
--

GRANT ALL ON SEQUENCE exam.questions_question_id_seq TO app_exam;
GRANT ALL ON SEQUENCE exam.questions_question_id_seq TO app_auth;


--
-- Name: TABLE student_answers; Type: ACL; Schema: exam; Owner: admin
--

GRANT ALL ON TABLE exam.student_answers TO app_exam;
GRANT ALL ON TABLE exam.student_answers TO app_auth;


--
-- Name: SEQUENCE student_answers_answer_id_seq; Type: ACL; Schema: exam; Owner: admin
--

GRANT ALL ON SEQUENCE exam.student_answers_answer_id_seq TO app_exam;
GRANT ALL ON SEQUENCE exam.student_answers_answer_id_seq TO app_auth;


--
-- Name: TABLE students; Type: ACL; Schema: exam; Owner: admin
--

GRANT ALL ON TABLE exam.students TO app_exam;
GRANT ALL ON TABLE exam.students TO app_auth;


--
-- Name: SEQUENCE students_student_id_seq; Type: ACL; Schema: exam; Owner: admin
--

GRANT ALL ON SEQUENCE exam.students_student_id_seq TO app_exam;
GRANT ALL ON SEQUENCE exam.students_student_id_seq TO app_auth;


--
-- Name: TABLE submission_questions; Type: ACL; Schema: exam; Owner: admin
--

GRANT ALL ON TABLE exam.submission_questions TO app_exam;
GRANT ALL ON TABLE exam.submission_questions TO app_auth;


--
-- Name: SEQUENCE submission_questions_submission_question_id_seq; Type: ACL; Schema: exam; Owner: admin
--

GRANT ALL ON SEQUENCE exam.submission_questions_submission_question_id_seq TO app_exam;
GRANT ALL ON SEQUENCE exam.submission_questions_submission_question_id_seq TO app_auth;


--
-- Name: TABLE submissions; Type: ACL; Schema: exam; Owner: admin
--

GRANT ALL ON TABLE exam.submissions TO app_exam;
GRANT ALL ON TABLE exam.submissions TO app_auth;


--
-- Name: SEQUENCE submissions_submission_id_seq; Type: ACL; Schema: exam; Owner: admin
--

GRANT ALL ON SEQUENCE exam.submissions_submission_id_seq TO app_exam;
GRANT ALL ON SEQUENCE exam.submissions_submission_id_seq TO app_auth;


--
-- Name: TABLE test_questions; Type: ACL; Schema: exam; Owner: admin
--

GRANT ALL ON TABLE exam.test_questions TO app_exam;
GRANT ALL ON TABLE exam.test_questions TO app_auth;


--
-- Name: TABLE test_slots; Type: ACL; Schema: exam; Owner: postgres
--

GRANT SELECT ON TABLE exam.test_slots TO admin;
GRANT ALL ON TABLE exam.test_slots TO app_exam;
GRANT ALL ON TABLE exam.test_slots TO app_auth;


--
-- Name: SEQUENCE test_slots_slot_id_seq; Type: ACL; Schema: exam; Owner: postgres
--

GRANT ALL ON SEQUENCE exam.test_slots_slot_id_seq TO app_exam;
GRANT ALL ON SEQUENCE exam.test_slots_slot_id_seq TO app_auth;


--
-- Name: TABLE tests; Type: ACL; Schema: exam; Owner: admin
--

GRANT ALL ON TABLE exam.tests TO app_exam;
GRANT ALL ON TABLE exam.tests TO app_auth;


--
-- Name: SEQUENCE tests_test_id_seq; Type: ACL; Schema: exam; Owner: admin
--

GRANT ALL ON SEQUENCE exam.tests_test_id_seq TO app_exam;
GRANT ALL ON SEQUENCE exam.tests_test_id_seq TO app_auth;


--
-- Name: TABLE topics; Type: ACL; Schema: exam; Owner: postgres
--

GRANT SELECT ON TABLE exam.topics TO admin;
GRANT ALL ON TABLE exam.topics TO app_exam;
GRANT ALL ON TABLE exam.topics TO app_auth;


--
-- Name: SEQUENCE topics_topic_id_seq; Type: ACL; Schema: exam; Owner: postgres
--

GRANT ALL ON SEQUENCE exam.topics_topic_id_seq TO app_exam;
GRANT ALL ON SEQUENCE exam.topics_topic_id_seq TO app_auth;


--
-- Name: TABLE true_false_answers; Type: ACL; Schema: exam; Owner: admin
--

GRANT ALL ON TABLE exam.true_false_answers TO app_exam;
GRANT ALL ON TABLE exam.true_false_answers TO app_auth;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: auth; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA auth GRANT SELECT ON TABLES TO admin;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: exam; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA exam GRANT SELECT ON TABLES TO admin;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA exam GRANT ALL ON TABLES TO app_auth;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA exam GRANT ALL ON TABLES TO app_exam;


--
-- PostgreSQL database dump complete
--


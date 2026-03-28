// src/routes.ts
import { Router } from "express";

// Controllers
import {
  getQuestion,
  getRandomProgramming,
  getRandomMultipleChoice,
  getRandomTrueFalse,
} from "../controllers/questionsReadController";
import { createQuestion, getTopics } from "../controllers/questionController";
import {
  createProgrammingQuestion,
  createMCQ,
  createTF,
} from "../controllers/questionController";
// 👇 IMPORT testController functions here
import {
  getAllTests,
  createTest,
  startTest,
  getAvailableTests,
} from "../controllers/testController";
import { runSubmissionCode } from "../controllers/testController";

// Middleware
import { requireAuth, requireTeacher } from "../middleware/requireAuth";

const router = Router();

router.get("/", (_req, res) => res.send("API is working!"));

// --- STUDENT ROUTES ---
router.get("/questions/mcq/random", getRandomMultipleChoice);
router.get("/questions/tf/random", getRandomTrueFalse);
router.get("/questions/prog/random", getRandomProgramming);
router.get("/questions/:id", getQuestion);

// Get available tests (Specific to student logic)
router.get("/tests/available", requireAuth, getAvailableTests);
// Start a test
router.post("/tests/start", requireAuth, startTest);

// --- TEACHER ROUTES ---
router.get("/topics", requireAuth, requireTeacher, getTopics);
router.post("/questions", requireAuth, requireTeacher, createQuestion);

// Create Specific Questions
router.post(
  "/questions/programming",
  requireAuth,
  requireTeacher,
  createProgrammingQuestion,
);
router.post("/questions/mcq", requireAuth, requireTeacher, createMCQ);
router.post("/questions/tf", requireAuth, requireTeacher, createTF);
router.post("/submissions/:id/run", requireAuth, runSubmissionCode);

router.get("/tests", requireAuth, getAllTests);

// Create Exam (Test Blueprint)
router.post("/tests", requireAuth, requireTeacher, createTest);

export default router;

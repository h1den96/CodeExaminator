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
  getProgrammingCategories,
} from "../controllers/questionController";

import {
  getAllTests,
  createTest,
  startTest,
  getAvailableTests,
  getStudentHistory,
  runSubmissionCode,
  getTestById, 
  togglePublishStatus
} from "../controllers/testController";

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

router.get("/tests/history", requireAuth, getStudentHistory);

// Start a test
router.post("/tests/start", requireAuth, startTest);

// --- TEACHER ROUTES ---
router.get("/topics", requireAuth, requireTeacher, getTopics);
router.get("/programming-categories", requireAuth, requireTeacher, getProgrammingCategories);
router.post("/questions", requireAuth, requireTeacher, createQuestion);
router.get("/tests/:id", requireAuth, getTestById);
router.put("/tests/:id/publish", requireAuth, requireTeacher, togglePublishStatus);

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

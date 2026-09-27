
import { Router } from "express";

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
  validateProgrammingBoilerplate,
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

import { requireAuth, requireTeacher } from "../middleware/requireAuth";

const router = Router();

router.get("/", (_req, res) => res.send("API is working!"));

router.get("/questions/mcq/random", getRandomMultipleChoice);
router.get("/questions/tf/random", getRandomTrueFalse);
router.get("/questions/prog/random", getRandomProgramming);
router.get("/questions/:id", getQuestion);

router.get("/tests/available", requireAuth, getAvailableTests);

router.get("/tests/history", requireAuth, getStudentHistory);

router.post("/tests/start", requireAuth, startTest);

router.get("/topics", requireAuth, requireTeacher, getTopics);
router.get("/programming-categories", requireAuth, requireTeacher, getProgrammingCategories);
router.post("/questions", requireAuth, requireTeacher, createQuestion);
router.get("/tests/:id", requireAuth, getTestById);
router.put("/tests/:id/publish", requireAuth, requireTeacher, togglePublishStatus);

router.post(
  "/questions/programming",
  requireAuth,
  requireTeacher,
  createProgrammingQuestion,
);

router.post(
  "/questions/programming/validate-boilerplate",
  requireAuth,
  requireTeacher,
  validateProgrammingBoilerplate,
);

router.post("/questions/mcq", requireAuth, requireTeacher, createMCQ);
router.post("/questions/tf", requireAuth, requireTeacher, createTF);
router.post("/submissions/:id/run", requireAuth, runSubmissionCode);

router.get("/tests", requireAuth, getAllTests);

router.post("/tests", requireAuth, requireTeacher, createTest);

export default router;

import { Router } from "express";
import { getQuestion, getRandomProgramming, getRandomMultipleChoice, getRandomTrueFalse } from "../controllers/questionsReadController";
import { createQuestion, getTopics } from "../controllers/questionController";
import { requireAuth, requireTeacher } from "../middleware/requireAuth";

const router = Router();

router.get("/", (_req, res) => res.send("API is working!"));

// Student Routes (Keep existing)
router.get("/questions/mcq/random", getRandomMultipleChoice);
router.get("/questions/tf/random", getRandomTrueFalse);
router.get("/questions/prog/random", getRandomProgramming);
router.get("/questions/:id", getQuestion);

// Teacher Routes (NEW)
router.get("/topics", requireAuth, requireTeacher, getTopics); // For the dropdown
router.post("/questions", requireAuth, requireTeacher, createQuestion); // To save questions

export default router;
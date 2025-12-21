import { Router } from "express";
import { getQuestion, getRandomProgramming, getRandomMultipleChoice, getRandomTrueFalse } from "../controllers/questionsReadController";

const router = Router();

router.get("/", (_req, res) => res.send("API is working!"));

// Questions endpoints
router.get("/questions/:id", getQuestion);

router.get("/questions/programming/random", getRandomProgramming);

router.get("/questions/mcq/random", getRandomMultipleChoice);

router.get("/questions/truefalse/random", getRandomTrueFalse);

export default router;
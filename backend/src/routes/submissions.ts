import { Router } from "express";
import { requireAuth } from "../../src/middleware/requireAuth";
import * as submissionController from "../controllers/submissionController";

const router = Router();

// Apply middleware
router.use(requireAuth);

// 1. MUST BE POST (to match examApi.ts)
// 2. MUST BE singular "save-answer" (to match examApi.ts)
router.post("/:id/save-answer", submissionController.saveAnswers);

// Other routes
router.post("/:id/submit", submissionController.submitSubmission);
router.post("/submit-code", submissionController.submitCode);
router.get("/:id", submissionController.getSubmission);
router.get("/:id/result", submissionController.getSubmissionResult);

export default router;

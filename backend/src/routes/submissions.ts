/*import { Router } from "express";
import { requireAuth } from "../../src/middleware/requireAuth";
// Import everything from the controller
import * as submissionController from "../controllers/submissionController";

const router = Router();

// Apply middleware to all routes in this router
router.use(requireAuth);

// 1. Get Submission
router.get("/:id", submissionController.getSubmission);

// 2. Save Draft Answer
router.patch("/:id/save-answer", submissionController.saveAnswers);

// 3. Final Submit Exam
router.post("/:id/submit", submissionController.submitSubmission);

// 4. Run Code (The one that was crashing)
// Now points to the controller instead of an inline function
router.post('/submit-code', submissionController.submitCode);

export default router;*/

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

export default router;
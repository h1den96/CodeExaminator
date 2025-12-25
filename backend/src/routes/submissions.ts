/*import { Router } from "express";
import { requireAuth } from "../../src/middleware/requireAuth";
import { getSubmission, saveAnswers, submitSubmission } from "../controllers/submissionController";
import { gradeSubmission } from '../services/gradingService';

const router = Router();
router.use(requireAuth);

router.get("/:id", getSubmission);
router.patch("/:id/answers", saveAnswers);
router.post("/:id/submit", submitSubmission);

router.post('/submit-code', requireAuth, async (req, res) => {
    try {
        const { submissionQuestionId, code } = req.body;

        if (!submissionQuestionId || !code) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Call the grading service
        const result = await gradeSubmission(submissionQuestionId, code);
        
        res.json({
            success: true,
            grade: result.question_grade
        });

    } catch (error) {
        console.error("Grading route error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


export default router;
*/

import { Router } from "express";
import { requireAuth } from "../../src/middleware/requireAuth";
// Import everything from the controller
import * as submissionController from "../controllers/submissionController";

const router = Router();

// Apply middleware to all routes in this router
router.use(requireAuth);

// 1. Get Submission
router.get("/:id", submissionController.getSubmission);

// 2. Save Draft Answer
router.patch("/:id/answers", submissionController.saveAnswers);

// 3. Final Submit Exam
router.post("/:id/submit", submissionController.submitSubmission);

// 4. Run Code (The one that was crashing)
// Now points to the controller instead of an inline function
router.post('/submit-code', submissionController.submitCode);

export default router;
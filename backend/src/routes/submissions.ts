import { Router } from "express";
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

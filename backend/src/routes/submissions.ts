import { Router } from "express";
import { requireAuth, requireTeacher } from "../middleware/requireAuth";
import * as submissionController from "../controllers/submissionController";

const router = Router();

router.use(requireAuth);

router.post("/:id/save-answer", submissionController.saveAnswers);
router.post("/:id/bulk-manual-grade", requireTeacher, submissionController.submitBulkManualGrades);

router.post("/:id/submit", submissionController.submitSubmission);
router.post("/submit-code", submissionController.submitCode);
router.get("/:id", submissionController.getSubmission);
router.get("/:id/result", submissionController.getSubmissionResult);

router.patch("/:id/questions/:answerId/override", requireTeacher, submissionController.overrideQuestionGrade);

router.patch("/:id/override", requireTeacher, submissionController.overrideTotalGrade);

router.patch("/:id/questions/:answerId/override", requireTeacher, submissionController.overrideQuestionGrade);

export default router;
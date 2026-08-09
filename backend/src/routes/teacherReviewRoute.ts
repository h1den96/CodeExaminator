// src/routes/teacherReviewRoutes.ts
import { Router } from "express";
import { 
  getTeacherTests, 
  getTestSubmissions, 
  getSubmissionDetails, 
  saveTeacherReview 
} from "../controllers/teacherReviewController";

const router = Router();

router.get("/tests", getTeacherTests);
router.get("/tests/:testId/submissions", getTestSubmissions);
router.get("/submissions/:submissionId/details", getSubmissionDetails);
router.post("/reviews", saveTeacherReview);

export default router;
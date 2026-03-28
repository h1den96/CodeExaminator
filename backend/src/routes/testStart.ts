import { Router } from "express";
import {
  getAvailableTests,
  startTest,
  createTest,
} from "../controllers/testController";
import { requireAuth, requireTeacher } from "../middleware/requireAuth";

const router = Router();

// Student Routes
router.get("/available", requireAuth, getAvailableTests);
router.post("/start", requireAuth, startTest);

// Teacher Routes (NEW)
// POST /api/test/create
router.post("/create", requireAuth, requireTeacher, createTest);

export default router;

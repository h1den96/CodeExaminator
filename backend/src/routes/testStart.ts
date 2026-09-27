import { Router } from "express";
import {
  getAvailableTests,
  startTest,
  createTest,
} from "../controllers/testController";
import { requireAuth, requireTeacher } from "../middleware/requireAuth";

const router = Router();

router.get("/available", requireAuth, getAvailableTests);
router.post("/start", requireAuth, startTest);

router.post("/create", requireAuth, requireTeacher, createTest);

export default router;

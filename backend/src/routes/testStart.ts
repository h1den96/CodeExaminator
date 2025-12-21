// src/routes/testStart.ts
import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { 
  startTest, 
  getAvailableTests, 
  submitTest 
} from "../controllers/testController";

const router = Router();

router.get("/available", requireAuth, getAvailableTests);
router.get("/start", requireAuth, startTest);
router.post("/submit", requireAuth, submitTest);

export default router;

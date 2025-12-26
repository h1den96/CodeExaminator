
// src/routes/testStart.ts
import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import * as testController from "../controllers/testController";

const router = Router();

// 1. Get available tests
router.get("/available", requireAuth, testController.getAvailableTests);

// 2. Start a test
router.get("/start", requireAuth, testController.startTest); 

export default router;
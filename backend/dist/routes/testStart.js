"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const testController_1 = require("../controllers/testController");
const requireAuth_1 = require("../middleware/requireAuth");
const router = (0, express_1.Router)();
// Student Routes
router.get("/available", requireAuth_1.requireAuth, testController_1.getAvailableTests);
router.post("/start", requireAuth_1.requireAuth, testController_1.startTest);
// Teacher Routes (NEW)
// POST /api/test/create
router.post("/create", requireAuth_1.requireAuth, requireAuth_1.requireTeacher, testController_1.createTest);
exports.default = router;

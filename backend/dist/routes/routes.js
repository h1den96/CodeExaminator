"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes.ts
const express_1 = require("express");
// Controllers
const questionsReadController_1 = require("../controllers/questionsReadController");
const questionController_1 = require("../controllers/questionController");
const questionController_2 = require("../controllers/questionController");
const testController_1 = require("../controllers/testController");
// Middleware
const requireAuth_1 = require("../middleware/requireAuth");
const router = (0, express_1.Router)();
router.get("/", (_req, res) => res.send("API is working!"));
// --- STUDENT ROUTES ---
router.get("/questions/mcq/random", questionsReadController_1.getRandomMultipleChoice);
router.get("/questions/tf/random", questionsReadController_1.getRandomTrueFalse);
router.get("/questions/prog/random", questionsReadController_1.getRandomProgramming);
router.get("/questions/:id", questionsReadController_1.getQuestion);
// Get available tests (Specific to student logic)
router.get("/tests/available", requireAuth_1.requireAuth, testController_1.getAvailableTests);
router.get("/tests/history", requireAuth_1.requireAuth, testController_1.getStudentHistory);
// Start a test
router.post("/tests/start", requireAuth_1.requireAuth, testController_1.startTest);
// --- TEACHER ROUTES ---
router.get("/topics", requireAuth_1.requireAuth, requireAuth_1.requireTeacher, questionController_1.getTopics);
router.get("/programming-categories", requireAuth_1.requireAuth, requireAuth_1.requireTeacher, questionController_2.getProgrammingCategories);
router.post("/questions", requireAuth_1.requireAuth, requireAuth_1.requireTeacher, questionController_1.createQuestion);
router.get("/tests/:id", requireAuth_1.requireAuth, testController_1.getTestById);
router.put("/tests/:id/publish", requireAuth_1.requireAuth, requireAuth_1.requireTeacher, testController_1.togglePublishStatus);
// Create Specific Questions
router.post("/questions/programming", requireAuth_1.requireAuth, requireAuth_1.requireTeacher, questionController_2.createProgrammingQuestion);
router.post("/questions/mcq", requireAuth_1.requireAuth, requireAuth_1.requireTeacher, questionController_2.createMCQ);
router.post("/questions/tf", requireAuth_1.requireAuth, requireAuth_1.requireTeacher, questionController_2.createTF);
router.post("/submissions/:id/run", requireAuth_1.requireAuth, testController_1.runSubmissionCode);
router.get("/tests", requireAuth_1.requireAuth, testController_1.getAllTests);
// Create Exam (Test Blueprint)
router.post("/tests", requireAuth_1.requireAuth, requireAuth_1.requireTeacher, testController_1.createTest);
exports.default = router;

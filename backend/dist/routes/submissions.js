"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const requireAuth_1 = require("../middleware/requireAuth");
const submissionController = __importStar(require("../controllers/submissionController"));
const router = (0, express_1.Router)();
// Apply middleware
router.use(requireAuth_1.requireAuth);
// 1. MUST BE POST (to match examApi.ts)
// 2. MUST BE singular "save-answer" (to match examApi.ts)
router.post("/:id/save-answer", submissionController.saveAnswers);
router.post("/:id/bulk-manual-grade", requireAuth_1.requireTeacher, submissionController.submitBulkManualGrades);
// Other routes
router.post("/:id/submit", submissionController.submitSubmission);
router.post("/submit-code", submissionController.submitCode);
router.get("/:id", submissionController.getSubmission);
router.get("/:id/result", submissionController.getSubmissionResult);
// --- NEW: Question-Level Override ---
// Επιτρέπουμε μόνο σε καθηγητές να αλλάζουν βαθμολογίες
router.patch("/:id/questions/:answerId/override", requireAuth_1.requireTeacher, submissionController.overrideQuestionGrade);
// 1. Route for total grade override (Requires Teacher)
router.patch("/:id/override", requireAuth_1.requireTeacher, submissionController.overrideTotalGrade);
// 2. Route for specific question grade override (Requires Teacher)
router.patch("/:id/questions/:answerId/override", requireAuth_1.requireTeacher, submissionController.overrideQuestionGrade);
exports.default = router;

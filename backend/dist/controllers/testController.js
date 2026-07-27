"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStudentHistory = void 0;
exports.getAvailableTests = getAvailableTests;
exports.getAllTests = getAllTests;
exports.startTest = startTest;
exports.createTest = createTest;
exports.getTestById = getTestById;
exports.updateQuestionTestCases = updateQuestionTestCases;
exports.runSubmissionCode = runSubmissionCode;
exports.submitTest = submitTest;
exports.togglePublishStatus = togglePublishStatus;
const db_1 = require("../db/db");
const submissionService_1 = require("../services/submissionService");
const adminService_1 = require("../services/adminService");
const codeExecutionService_1 = require("../services/codeExecutionService");
// 1. GET AVAILABLE TESTS (For Students)
async function getAvailableTests(req, res) {
    try {
        const user = req.user;
        if (!user)
            return res.status(401).json({ error: "Unauthorized" });
        const tests = await submissionService_1.SubmissionService.getAvailableTestsForStudent(user.user_id, db_1.examDb);
        return res.status(200).json(tests);
    }
    catch (err) {
        console.error("[getAvailableTests] error:", err);
        return res.status(500).json({ error: "Failed to load tests" });
    }
}
// GET ALL TESTS (For Admin/Teacher - Filtered by Teacher ID)
async function getAllTests(req, res) {
    try {
        const user = req.user;
        if (!user)
            return res.status(401).json({ error: "Unauthorized" });
        const result = await db_1.examDb.query(`
      SELECT t.*, 
             (SELECT COUNT(*) FROM exam.test_slots ts WHERE ts.test_id = t.test_id) as slot_count
      FROM exam.tests t 
      WHERE t.created_by = $1
      ORDER BY created_at DESC
    `, [user.user_id]);
        return res.status(200).json(result.rows);
    }
    catch (err) {
        console.error("[getAllTests] Error:", err);
        return res.status(500).json({ error: "Failed to load tests" });
    }
}
// 2. START TEST
async function startTest(req, res) {
    const user = req.user;
    const testId = req.body.test_id;
    try {
        if (!user)
            return res.status(401).json({ error: "Unauthorized" });
        if (!testId)
            return res.status(400).json({ error: "test_id is required" });
        const { submissionId, dto } = await submissionService_1.SubmissionService.startTestForStudent(Number(testId), String(user.user_id), db_1.examDb);
        return res.status(200).json({
            submission_id: submissionId,
            test: dto,
        });
    }
    catch (err) {
        if (err.message?.toLowerCase().includes("submitted")) {
            const existing = await db_1.examDb.query(`SELECT submission_id 
         FROM exam.submissions 
         WHERE test_id = $1 AND student_id = $2 
         ORDER BY submission_id DESC LIMIT 1`, [Number(testId), String(user.user_id)]);
            const sid = existing.rows[0]?.submission_id;
            return res.status(409).json({
                error: "ALREADY_SUBMITTED",
                submission_id: sid,
            });
        }
        console.error("[startTest] error:", err.message);
        return res.status(500).json({ error: "Internal server error" });
    }
}
// 3. CREATE TEST
async function createTest(req, res) {
    try {
        const user = req.user;
        if (!user || user.role !== "teacher") {
            return res.status(403).json({ error: "Only teachers can create tests" });
        }
        const dto = req.body;
        dto.created_by = user.user_id;
        const result = await adminService_1.AdminService.createTest(dto);
        return res.status(201).json({
            message: "Test blueprint created successfully",
            test: result,
        });
    }
    catch (err) {
        console.error("[createTest] error:", err);
        return res.status(500).json({ error: "Internal server error: " + err.message });
    }
}
// 5. GET SINGLE TEST BY ID
async function getTestById(req, res) {
    try {
        const testId = req.params.id;
        const testRes = await db_1.examDb.query(`SELECT * FROM exam.tests WHERE test_id = $1`, [testId]);
        if (testRes.rows.length === 0) {
            return res.status(404).json({ error: "Test not found" });
        }
        const slotRes = await db_1.examDb.query(`SELECT ts.*, t.name as topic_name
       FROM exam.test_slots ts
       LEFT JOIN exam.topics t ON ts.topic_id = t.topic_id
       WHERE ts.test_id = $1
       ORDER BY ts.slot_order ASC`, [testId]);
        const subRes = await db_1.examDb.query(`SELECT 
          submission_id, 
          student_id, 
          status, 
          started_at, 
          submitted_at, 
          total_grade
       FROM exam.submissions
       WHERE test_id = $1
       ORDER BY submitted_at DESC NULLS LAST`, [testId]);
        const testData = {
            ...testRes.rows[0],
            slots: slotRes.rows,
            submissions: subRes.rows,
        };
        return res.json(testData);
    }
    catch (err) {
        console.error("[getTestById] Error:", err);
        return res.status(500).json({ error: "Failed to load test blueprint" });
    }
}
// 6. UPDATE TEST CASES
async function updateQuestionTestCases(req, res) {
    try {
        const { questionId } = req.params;
        const { test_cases } = req.body;
        if (!test_cases || !Array.isArray(test_cases)) {
            return res.status(400).json({ error: "Invalid test_cases format. Must be an array." });
        }
        await adminService_1.AdminService.updateProgrammingTestCases(Number(questionId), test_cases);
        return res.json({ message: "Updated" });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: err.message });
    }
}
// 7. RUN CODE (Delegates cleanly to our updated CodeExecutionService) 🚀
async function runSubmissionCode(req, res) {
    try {
        const submissionId = Number(req.params.id);
        const { question_id, code } = req.body;
        const user = req.user;
        console.log(`[testController] Run Code request for Q${question_id}, Sub${submissionId}`);
        const sqRes = await db_1.examDb.query(`SELECT submission_question_id 
       FROM exam.submission_questions 
       WHERE submission_id = $1 AND question_id = $2`, [submissionId, question_id]);
        if (sqRes.rows.length === 0) {
            return res.status(404).json({ error: "Submission question matching profile not found." });
        }
        const targetSubmissionQuestionId = sqRes.rows[0].submission_question_id;
        const gradingPackage = await codeExecutionService_1.CodeExecutionService.executeAndGrade(targetSubmissionQuestionId, code, db_1.examDb);
        const hasCompileError = Array.isArray(gradingPackage.details) && gradingPackage.details.some((detail) => detail.status === "Compilation Error");
        const securityViolation = Array.isArray(gradingPackage.details) && gradingPackage.details.some((detail) => detail.status === "Security Violation");
        return res.json({
            status: securityViolation ? "Security Violation" : (hasCompileError ? "Compilation Error" : "Success"),
            structural_analysis: {
                score: securityViolation ? 0 : 1,
                details: gradingPackage.details?.[0]?.status === "Security Violation" ? [] : gradingPackage.structural_analysis || []
            },
            test_results: gradingPackage.details || [],
            question_grade: gradingPackage.question_grade,
        });
    }
    catch (err) {
        console.error("[Run Code Error]", err);
        return res.status(500).json({ error: "Failed to execute: " + err.message });
    }
}
// 8. SUBMIT EXAM (Final Submission)
async function submitTest(req, res) {
    try {
        const submissionId = Number(req.params.id);
        const user = req.user;
        if (!user)
            return res.status(401).json({ error: "Unauthorized" });
        const result = await submissionService_1.SubmissionService.submitAndGrade(submissionId, String(user.user_id), db_1.examDb);
        return res.json({
            message: "Exam submitted successfully",
            grade: result.final_score,
            status: result.status,
        });
    }
    catch (err) {
        console.error("[Submit Test Error]", err);
        return res.status(500).json({ error: "Failed to submit exam" });
    }
}
// 9. GET STUDENT HISTORY (List of completed tests)
const getStudentHistory = async (req, res) => {
    try {
        const user = req.user;
        if (!user || !user.user_id) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const studentId = String(user.user_id);
        console.log(`[getStudentHistory] Fetching history for student: ${studentId}`);
        const result = await db_1.examDb.query(`SELECT 
        s.submission_id, 
        COALESCE(t.title, 'Deleted Test') as test_title, 
        s.submitted_at, 
        s.total_grade,
        s.status,
        t.test_id
       FROM exam.submissions s
       LEFT JOIN exam.tests t ON s.test_id = t.test_id
       WHERE s.student_id::text = $1::text AND s.status IN ('submitted', 'completed')
       ORDER BY s.submitted_at DESC`, [studentId]);
        return res.status(200).json(result.rows);
    }
    catch (error) {
        console.error("Fetch History Error:", error.message);
        return res.status(500).json({
            error: "Failed to load exam history",
            details: error.message
        });
    }
};
exports.getStudentHistory = getStudentHistory;
// 10. TOGGLE PUBLISH STATUS
async function togglePublishStatus(req, res) {
    try {
        const testId = req.params.id;
        const { is_published } = req.body;
        const result = await db_1.examDb.query(`UPDATE exam.tests 
       SET is_published = $1 
       WHERE test_id = $2 
       RETURNING *`, [is_published, testId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Test not found" });
        }
        return res.json({ message: "Status updated", test: result.rows[0] });
    }
    catch (err) {
        console.error("[togglePublishStatus] Error:", err);
        return res.status(500).json({ error: "Failed to update publish status" });
    }
}

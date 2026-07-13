"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSubmission = exports.submitBulkManualGrades = exports.overrideQuestionGrade = exports.overrideTotalGrade = exports.getSubmissionResult = exports.submitCode = exports.submitSubmission = exports.saveAnswers = void 0;
const submissionService_1 = require("../services/submissionService");
const codeExecutionService_1 = require("../services/codeExecutionService");
// Helper για λήψη του DB pool με σωστό typing
const getDb = (req) => req.db || req.db;
// 1. SAVE ANSWERS (Autosave για MCQ/TF/Text)
const saveAnswers = async (req, res) => {
    const ereq = req;
    try {
        const submissionId = Number(ereq.params.id);
        const dto = ereq.body;
        const user = ereq.user;
        if (!user || !user.user_id) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const studentId = String(user.user_id);
        if (!submissionId || !dto.question_id) {
            return res
                .status(400)
                .json({ error: "Missing submission ID or question ID" });
        }
        const db = getDb(ereq);
        await submissionService_1.SubmissionService.saveSingleAnswer(submissionId, studentId, dto, db);
        return res.status(200).json({ message: "Answer saved successfully" });
    }
    catch (error) {
        console.error("Save Answer Error:", error.message);
        if (error.message === "Submission not found or not active") {
            return res.status(404).json({ error: "Submission mismatch (Check Student ID)" });
        }
        return res.status(500).json({ error: "Internal server error" });
    }
};
exports.saveAnswers = saveAnswers;
// 2. SUBMIT EXAM (Οριστική Υποβολή & Αυτόματη Βαθμολόγηση)
const submitSubmission = async (req, res) => {
    const ereq = req;
    try {
        const submissionId = Number(ereq.params.id);
        const user = ereq.user;
        if (!user || !user.user_id) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const studentId = String(user.user_id);
        const db = getDb(ereq);
        const result = await submissionService_1.SubmissionService.submitAndGrade(submissionId, studentId, db);
        return res.status(200).json({
            message: "Exam submitted successfully",
            result,
        });
    }
    catch (error) {
        console.error("Submit Error:", error.message);
        return res.status(500).json({ error: error.message || "Internal server error" });
    }
};
exports.submitSubmission = submitSubmission;
// 3. SUBMIT CODE (Εκτέλεση μέσω Judge0)
const submitCode = async (req, res) => {
    const ereq = req;
    try {
        let { submissionQuestionId, submission_id, question_id, code } = ereq.body;
        if (!code)
            return res.status(400).json({ error: "Missing code" });
        const db = getDb(ereq);
        // Safeguard για ID mismatch
        if (String(submissionQuestionId) === String(question_id)) {
            console.warn("⚠️ Detected ID mismatch bug. Forcing lookup.");
            submissionQuestionId = null;
        }
        // Lookup αν λείπει το SQ_ID
        if (!submissionQuestionId && submission_id && question_id) {
            const lookup = await db.query(`SELECT submission_question_id FROM exam.submission_questions 
         WHERE submission_id = $1 AND question_id = $2`, [submission_id, question_id]);
            if (lookup.rows.length === 0) {
                return res.status(404).json({ error: "Question link not found" });
            }
            submissionQuestionId = lookup.rows[0].submission_question_id;
        }
        const result = await codeExecutionService_1.CodeExecutionService.executeAndGrade(Number(submissionQuestionId), code, db);
        res.json({
            success: true,
            question_grade: result.question_grade,
            test_results: result.details || [],
        });
    }
    catch (error) {
        console.error("Code Execution Error:", error);
        res.status(500).json({ error: error.message || "Internal Server Error" });
    }
};
exports.submitCode = submitCode;
// 4. GET SUBMISSION RESULT (Αποτελέσματα για Μαθητή/Καθηγητή)
const getSubmissionResult = async (req, res) => {
    const ereq = req;
    try {
        const { id } = ereq.params;
        const user = ereq.user;
        const db = getDb(ereq);
        if (!user || !user.user_id) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const studentIdToVerify = user.role === "teacher" ? "TEACHER_BYPASS" : String(user.user_id);
        const result = await submissionService_1.SubmissionService.getSubmissionResult(Number(id), studentIdToVerify, db);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: "DATABASE_QUERY_FAILED", message: error.message });
    }
};
exports.getSubmissionResult = getSubmissionResult;
// 5. OVERRIDE TOTAL GRADE (Manual αλλαγή συνολικού βαθμού)
const overrideTotalGrade = async (req, res) => {
    const ereq = req;
    const { id } = ereq.params;
    const { newGrade } = ereq.body;
    const db = getDb(ereq);
    const client = await db.connect();
    try {
        await client.query("UPDATE exam.submissions SET total_grade = $1, status = 'completed' WHERE submission_id = $2", [newGrade, id]);
        res.json({ message: "Total grade updated successfully", newTotal: newGrade });
    }
    catch (err) {
        res.status(500).json({ error: "Failed to override total grade" });
    }
    finally {
        client.release();
    }
};
exports.overrideTotalGrade = overrideTotalGrade;
// 6. OVERRIDE QUESTION GRADE (Manual αλλαγή βαθμού ερώτησης & recalculate total)
const overrideQuestionGrade = async (req, res) => {
    const ereq = req;
    const { id: submissionId, answerId } = ereq.params;
    const { newQuestionGrade } = ereq.body;
    const db = getDb(ereq);
    const client = await db.connect();
    try {
        await client.query("BEGIN");
        await client.query("UPDATE exam.student_answers SET question_grade = $1, is_manually_graded = true WHERE answer_id = $2", [newQuestionGrade, answerId]);
        const { rows } = await client.query(`SELECT SUM(question_grade) as total FROM exam.student_answers sa
       JOIN exam.submission_questions sq ON sa.submission_question_id = sq.submission_question_id
       WHERE sq.submission_id = $1`, [submissionId]);
        const newTotal = rows[0].total || 0;
        await client.query("UPDATE exam.submissions SET total_grade = $1 WHERE submission_id = $2", [newTotal, submissionId]);
        await client.query("COMMIT");
        res.json({ message: "Question grade updated successfully", newTotal });
    }
    catch (err) {
        await client.query("ROLLBACK");
        res.status(500).json({ error: "Failed to override question grade" });
    }
    finally {
        client.release();
    }
};
exports.overrideQuestionGrade = overrideQuestionGrade;
// 7. BULK MANUAL GRADES (Μαζική βαθμολόγηση από καθηγητή)
const submitBulkManualGrades = async (req, res) => {
    const ereq = req;
    const { id: submissionId } = ereq.params;
    const { grades } = ereq.body;
    try {
        const db = getDb(ereq); // Την παίρνουμε σωστά εδώ
        const result = await submissionService_1.SubmissionService.manuallyGradeEntireSubmission(Number(submissionId), grades, db // Την περνάμε καθαρά εδώ
        );
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.submitBulkManualGrades = submitBulkManualGrades;
// Placeholder
const getSubmission = async (req, res) => {
    res.status(501).json({ error: "Not implemented yet" });
};
exports.getSubmission = getSubmission;

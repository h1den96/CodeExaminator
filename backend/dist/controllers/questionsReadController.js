"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRandomTrueFalse = exports.getRandomMultipleChoice = exports.getRandomProgramming = exports.getQuestion = void 0;
const questionReadService_1 = require("../services/questionReadService");
const service = new questionReadService_1.QuestionReadService();
const getQuestion = async (req, res) => {
    try {
        const data = await service.getById(String(req.params.id));
        if (!data)
            return res.status(404).json({ error: "Question not found" });
        return res.json(data);
    }
    catch (err) {
        return res.status(500).json({ error: "Internal server error" });
    }
};
exports.getQuestion = getQuestion;
const getRandomProgramming = async (_req, res) => {
    try {
        const data = await service.getRandomProgramming();
        if (!data)
            return res.status(404).json({ error: "No programming questions found" });
        return res.json(data);
    }
    catch (err) {
        return res.status(500).json({ error: "Internal server error" });
    }
};
exports.getRandomProgramming = getRandomProgramming;
// GET /api/questions/mcq/random
const getRandomMultipleChoice = async (req, res) => {
    try {
        const question = await service.getRandomMultipleChoice();
        if (!question) {
            return res.status(404).json({ message: "No MCQ questions found." });
        }
        return res.status(200).json(question);
    }
    catch (err) {
        console.error("Error fetching random MCQ:", err);
        return res.status(500).json({ message: "Internal server error." });
    }
};
exports.getRandomMultipleChoice = getRandomMultipleChoice;
const getRandomTrueFalse = async (req, res) => {
    try {
        const question = await service.getRandomTrueFalsePublic();
        if (!question) {
            return res
                .status(404)
                .json({ message: "No True/False questions found." });
        }
        return res.status(200).json(question);
    }
    catch (err) {
        console.error("Error fetching random True/False question:", err);
        return res.status(500).json({ message: "Internal server error." });
    }
};
exports.getRandomTrueFalse = getRandomTrueFalse;

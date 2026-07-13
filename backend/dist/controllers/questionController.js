"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTF = exports.createMCQ = exports.createProgrammingQuestion = exports.createQuestion = exports.getProgrammingCategories = exports.getTopics = void 0;
const adminService_1 = require("../services/adminService");
// GET /api/topics (For the dropdown in your UI)
const getTopics = async (req, res) => {
    try {
        const topics = await adminService_1.AdminService.getAllTopics();
        res.json(topics);
    }
    catch (err) {
        console.error("Error fetching topics:", err);
        res.status(500).json({ error: "Failed to fetch topics" });
    }
};
exports.getTopics = getTopics;
const getProgrammingCategories = (req, res) => {
    const categories = [
        { id: "SCALAR", name: "SCALAR (Variables, Math, Logic)" },
        { id: "LINEAR", name: "LINEAR (Arrays, Strings, Stacks)" },
        { id: "GRID", name: "GRID (2D Arrays, Matrices, Mazes)" },
        { id: "LINKED_LIST", name: "LINKED_LIST (Nodes, Pointers)" },
        { id: "CUSTOM", name: "CUSTOM (Trees, Graphs, Custom Structs)" }
    ];
    res.json(categories);
};
exports.getProgrammingCategories = getProgrammingCategories;
// POST /api/questions (Create Question)
const createQuestion = async (req, res) => {
    try {
        const user = req.user;
        // Safety check (even though middleware handles it)
        if (!user || user.role !== "teacher") {
            return res.status(403).json({ error: "Access denied" });
        }
        const payload = {
            ...req.body,
            teacher_id: user.user_id,
        };
        // Basic Validation
        if (!payload.difficulty || !payload.topic_ids) {
            return res.status(400).json({ error: "Missing difficulty or topics" });
        }
        const result = await adminService_1.AdminService.createQuestion(payload);
        res.status(201).json(result);
    }
    catch (err) {
        console.error("Create Question Error:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
exports.createQuestion = createQuestion;
const createProgrammingQuestion = async (req, res) => {
    try {
        const user = req.user;
        // 1. Security Check
        if (!user || user.role !== "teacher") {
            return res.status(403).json({ error: "Access denied" });
        }
        const { title, body, difficulty, topic_ids, starter_code, test_cases } = req.body;
        // 2. Validation
        if (!title || !body || !difficulty || !topic_ids) {
            return res.status(400).json({ error: "Missing required basic fields" });
        }
        if (!starter_code) {
            return res.status(400).json({ error: "Starter code is required" });
        }
        if (!test_cases || !Array.isArray(test_cases) || test_cases.length === 0) {
            return res
                .status(400)
                .json({ error: "At least one test case is required" });
        }
        // 3. Prepare Payload for Service
        const payload = {
            teacher_id: user.user_id,
            title,
            body,
            difficulty,
            topic_ids,
            starter_code,
            test_cases, // Array of { input: "...", expected: "..." }
        };
        // 4. Call Service
        // We will create this function in AdminService next
        const result = await adminService_1.AdminService.createProgrammingQuestion(payload);
        res.status(201).json(result);
    }
    catch (err) {
        console.error("Create Programming Question Error:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
exports.createProgrammingQuestion = createProgrammingQuestion;
const createMCQ = async (req, res) => {
    try {
        const { title, body, difficulty, topic_ids, options } = req.body;
        const teacher_id = req.user.user_id;
        if (!options || options.length < 2)
            return res.status(400).json({ error: "At least 2 options required" });
        await adminService_1.AdminService.createMCQ({
            title,
            body,
            difficulty,
            topic_ids,
            options,
            teacher_id,
        });
        res.status(201).json({ message: "MCQ created" });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to create MCQ" });
    }
};
exports.createMCQ = createMCQ;
// POST /api/questions/tf
const createTF = async (req, res) => {
    try {
        const { title, body, difficulty, topic_ids, is_true } = req.body;
        const teacher_id = req.user.user_id;
        if (typeof is_true !== "boolean")
            return res.status(400).json({ error: "is_true must be boolean" });
        await adminService_1.AdminService.createTF({
            title,
            body,
            difficulty,
            topic_ids,
            is_true,
            teacher_id,
        });
        res.status(201).json({ message: "True/False created" });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to create TF" });
    }
};
exports.createTF = createTF;

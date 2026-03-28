import { Request, Response } from "express";
import { AdminService } from "../services/adminService";

// GET /api/topics (For the dropdown in your UI)
export const getTopics = async (req: Request, res: Response) => {
  try {
    const topics = await AdminService.getAllTopics();
    res.json(topics);
  } catch (err) {
    console.error("Error fetching topics:", err);
    res.status(500).json({ error: "Failed to fetch topics" });
  }
};

// POST /api/questions (Create Question)
export const createQuestion = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

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

    const result = await AdminService.createQuestion(payload);
    res.status(201).json(result);
  } catch (err: any) {
    console.error("Create Question Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const createProgrammingQuestion = async (
  req: Request,
  res: Response,
) => {
  try {
    const user = (req as any).user;

    // 1. Security Check
    if (!user || user.role !== "teacher") {
      return res.status(403).json({ error: "Access denied" });
    }

    const { title, body, difficulty, topic_ids, starter_code, test_cases } =
      req.body;

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
    const result = await AdminService.createProgrammingQuestion(payload);

    res.status(201).json(result);
  } catch (err: any) {
    console.error("Create Programming Question Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const createMCQ = async (req: Request, res: Response) => {
  try {
    const { title, body, difficulty, topic_ids, options } = req.body;
    const teacher_id = (req as any).user.user_id;

    if (!options || options.length < 2)
      return res.status(400).json({ error: "At least 2 options required" });

    await AdminService.createMCQ({
      title,
      body,
      difficulty,
      topic_ids,
      options,
      teacher_id,
    });
    res.status(201).json({ message: "MCQ created" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create MCQ" });
  }
};

// POST /api/questions/tf
export const createTF = async (req: Request, res: Response) => {
  try {
    const { title, body, difficulty, topic_ids, is_true } = req.body;
    const teacher_id = (req as any).user.user_id;

    if (typeof is_true !== "boolean")
      return res.status(400).json({ error: "is_true must be boolean" });

    await AdminService.createTF({
      title,
      body,
      difficulty,
      topic_ids,
      is_true,
      teacher_id,
    });
    res.status(201).json({ message: "True/False created" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create TF" });
  }
};

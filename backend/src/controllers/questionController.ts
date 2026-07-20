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

export const getProgrammingCategories = (req: Request, res: Response) => {
  const categories = [
    { id: "SCALAR", name: "SCALAR (Variables, Math, Logic)" },
    { id: "LINEAR", name: "LINEAR (Arrays, Strings, Stacks)" },
    { id: "GRID", name: "GRID (2D Arrays, Matrices, Mazes)" },
    { id: "LINKED_LIST", name: "LINKED_LIST (Nodes, Pointers)" },
    { id: "CUSTOM", name: "CUSTOM (Trees, Graphs, Custom Structs)" }
  ];
  res.json(categories);
};

// POST /api/questions (Create Generic Question)
export const createQuestion = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user || user.role !== "teacher") {
      return res.status(403).json({ error: "Access denied" });
    }

    const payload = {
      ...req.body,
      teacher_id: user.user_id,
    };

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

// POST /api/questions/programming (Create Programming Question with Hybrid Blueprint)
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

    const {
      title,
      body,
      difficulty,
      topic_ids,
      starter_code,
      test_cases,
      weight_wb,
      weight_bb,
      grace_mode,
      grace_threshold,
      grace_cap,
      structural_rules,
    } = req.body;

    // 2. Validation
    if (!title || !body || !difficulty || !topic_ids) {
      return res.status(400).json({ error: "Missing required basic fields" });
    }
    if (!test_cases || !Array.isArray(test_cases) || test_cases.length === 0) {
      return res
        .status(400)
        .json({ error: "At least one test case is required" });
    }

    // 3. Prepare Payload with fallback defaults for missing parameters
    const payload = {
      teacher_id: user.user_id,
      title,
      body,
      difficulty,
      topic_ids,
      starter_code: starter_code || "",
      test_cases,
      weight_wb: weight_wb ?? 0.20,
      weight_bb: weight_bb ?? 0.80,
      grace_mode: grace_mode || "STANDARD",
      grace_threshold: grace_threshold ?? 0.90,
      grace_cap: grace_cap ?? 0.15,
      structural_rules: structural_rules || [],
    };

    // 4. Call Service to persist in PostgreSQL
    const result = await AdminService.createProgrammingQuestion(payload);

    res.status(201).json(result);
  } catch (err: any) {
    console.error("Create Programming Question Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// POST /api/questions/mcq
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
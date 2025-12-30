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
    if (!user || user.role !== 'teacher') {
        return res.status(403).json({ error: "Access denied" });
    }

    const payload = {
        ...req.body,
        teacher_id: user.user_id 
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
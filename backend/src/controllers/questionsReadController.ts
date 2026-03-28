// src/controllers/questionsReadController.ts
import { Request, Response } from "express";
import { QuestionReadService } from "../services/questionReadService";

const service = new QuestionReadService();

export const getQuestion = async (req: Request, res: Response) => {
  try {
    const data = await service.getById(req.params.id);
    if (!data) return res.status(404).json({ error: "Question not found" });
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getRandomProgramming = async (_req: Request, res: Response) => {
  try {
    const data = await service.getRandomProgramming();
    if (!data)
      return res.status(404).json({ error: "No programming questions found" });
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

// GET /api/questions/mcq/random
export const getRandomMultipleChoice = async (req: Request, res: Response) => {
  try {
    const question = await service.getRandomMultipleChoice();
    if (!question) {
      return res.status(404).json({ message: "No MCQ questions found." });
    }
    return res.status(200).json(question);
  } catch (err: any) {
    console.error("Error fetching random MCQ:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
};

export const getRandomTrueFalse = async (req: Request, res: Response) => {
  try {
    const question = await service.getRandomTrueFalsePublic();
    if (!question) {
      return res
        .status(404)
        .json({ message: "No True/False questions found." });
    }
    return res.status(200).json(question);
  } catch (err: any) {
    console.error("Error fetching random True/False question:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
};

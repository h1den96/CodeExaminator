import { Request, Response } from "express";
import { AdminService } from "../services/adminService";
import { ProgrammingGradingEngine } from "../services/programmingGradingEngine";

// A test case with both blank input and blank expected output will pass
// trivially (empty stdout matches empty expected) without exercising the
// student's code at all. Reject these before they reach validation/grading.
function findVacuousTestCase(testCases: any[]): boolean {
  return testCases.some(
    (tc: any) =>
      !String(tc.input ?? "").trim() &&
      !String(tc.expected_output ?? tc.expected ?? "").trim()
  );
}

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
      category,
      function_signature,
      reference_solution,
      boilerplate_code,
      helper_code,
      cpu_time_limit,
      memory_limit,
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
    if (findVacuousTestCase(test_cases)) {
      return res.status(400).json({
        error: "One or more test cases have both empty input and empty expected output — this would pass trivially without exercising your code. Fill in real values.",
      });
    }
    if (!function_signature || !reference_solution) {
      return res
        .status(400)
        .json({ error: "function_signature and reference_solution are required" });
    }
    if (category === "CUSTOM" && !boilerplate_code) {
      return res
        .status(400)
        .json({ error: "CUSTOM category questions require boilerplate_code" });
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
      category: category || "SCALAR",
      function_signature,
      reference_solution,
      boilerplate_code: boilerplate_code || null,
      helper_code: helper_code || null,
      cpu_time_limit: cpu_time_limit ?? 2.0,
      memory_limit: memory_limit ?? 128000,
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
    const { title, body, difficulty, topic_ids, is_true, penalty_ratio } = req.body;
    const teacher_id = (req as any).user.user_id;

    if (typeof is_true !== "boolean")
      return res.status(400).json({ error: "is_true must be boolean" });

    if (
      penalty_ratio !== undefined &&
      (typeof penalty_ratio !== "number" || penalty_ratio < 0)
    )
      return res.status(400).json({ error: "penalty_ratio must be a non-negative number" });

    await AdminService.createTF({
      title,
      body,
      difficulty,
      topic_ids,
      is_true,
      penalty_ratio,
      teacher_id,
    });
    res.status(201).json({ message: "True/False created" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create TF" });
  }
};

// POST /api/questions/programming/validate-boilerplate
// Stateless: runs reference_solution through the harness (auto-generated or
// teacher-supplied boilerplate_code) against test_cases via Judge0, with no
// submission/student context. Used at authoring time to gate publish.
export const validateProgrammingBoilerplate = async (
  req: Request,
  res: Response,
) => {
  try {
    const user = (req as any).user;
    if (!user || user.role !== "teacher") {
      return res.status(403).json({ error: "Access denied" });
    }

    const {
      function_signature,
      reference_solution,
      category,
      helper_code,
      boilerplate_code,
      test_cases,
      cpu_time_limit,
      memory_limit,
    } = req.body;

    if (!function_signature || !reference_solution) {
      return res
        .status(400)
        .json({ error: "function_signature and reference_solution are required" });
    }
    if (!test_cases || !Array.isArray(test_cases) || test_cases.length === 0) {
      return res
        .status(400)
        .json({ error: "At least one test case is required" });
    }
    if (findVacuousTestCase(test_cases)) {
      return res.status(400).json({
        error: "One or more test cases have both empty input and empty expected output — this would pass trivially without exercising your code. Fill in real values.",
      });
    }
    if (category === "CUSTOM" && !boilerplate_code) {
      return res
        .status(400)
        .json({ error: "CUSTOM category questions require boilerplate_code" });
    }

    const evaluation = await ProgrammingGradingEngine.evaluate({
      studentCode: reference_solution,
      testCases: test_cases,
      points: 10,
      category: category || "SCALAR",
      signature: function_signature,
      boilerplateCode: boilerplate_code || null,
      helperCode: helper_code || null,
      structuralRules: [], // irrelevant when validating the reference solution itself
      weightWb: 0,
      weightBb: 1,
      cpuLimit: cpu_time_limit ?? 2.0,
      memoryLimit: memory_limit ?? 128000,
      languageId: 54,
    });

    const allPassed = evaluation.details.every((d: any) => d.passed === true);

    return res.json({
      success: true,
      all_passed: allPassed,
      question_grade: evaluation.earnedPoints,
      test_results: evaluation.details,
      generated_harness: evaluation.generatedHarness || null,
    });
  } catch (err: any) {
    console.error("[validateProgrammingBoilerplate] error:", err);
    return res.status(400).json({ error: err.message || "Validation failed" });
  }
};
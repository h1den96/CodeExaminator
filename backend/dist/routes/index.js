import { Router } from "express";
const router = Router();
// Simple test route
router.get("/", (req, res) => {
  res.send("API is working!");
});
export default router;

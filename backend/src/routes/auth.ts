// src/routes/auth.ts
import { Router } from "express";
import * as authController from "../controllers/authController";

const router = Router();

// NOW IT MATCHES: Frontend calls /register -> Controller.register
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);

export default router;
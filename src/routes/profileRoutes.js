import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import {
  getProfileController,
  updateProfileController,
  getProfileCompletionStatusController,
  updateHealthMetricsController
} from "../controllers/profileController.js";

const router = express.Router();

router.get("/", authMiddleware, getProfileController);
router.put("/", authMiddleware, updateProfileController);
router.get("/completion-status", authMiddleware, getProfileCompletionStatusController);
router.put("/health-metrics", authMiddleware, updateHealthMetricsController);

export default router;
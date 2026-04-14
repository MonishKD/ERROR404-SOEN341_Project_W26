//profileRoutes.js

// This file defines the routes for profile-related operations such as fetching and updating user profiles, checking profile completion status, and updating health metrics. It imports the necessary controller functions from profileController.js and sets up the Express router to handle incoming requests to these routes.

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
//authRoutes.js

// This file defines the routes for authentication-related operations such as login, registration, and password reset. It imports the necessary controller functions from authController.js and sets up the Express router to handle incoming requests to these routes. Each route corresponds to a specific authentication action and will call the appropriate controller function to process the request and send a response back to the client.

import express from "express";
import {
  loginController,
  registerController,
  forgotPasswordController,
  validateResetTokenController,
  resetPasswordController
} from "../controllers/authController.js";

const router = express.Router();

router.post("/login", loginController);
router.post("/register", registerController);
router.post("/forgot-password", forgotPasswordController);
router.get("/validate-reset-token", validateResetTokenController);
router.post("/reset-password", resetPasswordController);

export default router;
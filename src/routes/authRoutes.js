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
import { login, register } from "../services/authService.js";
import {
  requestPasswordReset,
  validateResetToken,
  resetPassword
} from "../services/passwordResetService.js";

function mapDatabaseError(error) {
  if (!error) return null;

  if (error.code === "P2021") {
    return "Database tables are missing. Run `npm run prisma:push` in backend.";
  }

  if (error.code === "P1001") {
    return "Cannot connect to PostgreSQL. Ensure Postgres is running and DATABASE_URL is correct.";
  }

  if (
    error.code === "P2016" ||
    error.message?.includes("does not exist") ||
    error.message?.includes("relation") ||
    error.message?.includes("column") ||
    error.message?.includes("prisma")
  ) {
    return "Database schema is out of sync. Run `npm run prisma:generate` then `npm run prisma:push`.";
  }

  return null;
}

export async function loginController(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Missing email or password." });
  }

  try {
    const result = await login(email, password);
    res.status(200).json(result);
  } catch (error) {
    console.error("Login error:", error);
    const dbMessage = mapDatabaseError(error);
    if (dbMessage) {
      return res.status(500).json({ message: dbMessage });
    }
    res.status(401).json({ message: error.message || "Login failed." });
  }
}

export async function registerController(req, res) {
  const { firstName, lastName, password, email } = req.body;

  if (!firstName || !lastName || !password || !email) {
    return res.status(400).json({ message: "Missing firstName, lastName, password, or email." });
  }

  try {
    const result = await register(firstName, lastName, password, email);
    res.status(201).json(result);
  } catch (error) {
    console.error("Registration error:", error);
    const dbMessage = mapDatabaseError(error);
    if (dbMessage) {
      return res.status(500).json({ message: dbMessage });
    }
    res.status(400).json({ message: error.message || "Registration failed." });
  }
}

export async function forgotPasswordController(req, res) {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    const result = await requestPasswordReset(email);
    res.json(result);
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "An error occurred" });
  }
}

export async function validateResetTokenController(req, res) {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ valid: false, message: "Token is required" });
  }

  try {
    const result = await validateResetToken(token);
    res.json(result);
  } catch (error) {
    console.error("Token validation error:", error);
    res.status(500).json({ valid: false, message: "An error occurred" });
  }
}

export async function resetPasswordController(req, res) {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ message: "Token and password are required" });
  }

  if (password.length < 8) {
    return res.status(400).json({ message: "Password must be at least 8 characters" });
  }

  try {
    const result = await resetPassword(token, password);
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "An error occurred" });
  }
}
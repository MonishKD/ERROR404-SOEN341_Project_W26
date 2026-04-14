//app.js
// Main Express app setup and route definitions for the Meal Planner application.

import express from "express";
import path from "node:path";

import authRoutes from "./routes/authRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import recipeRoutes from "./routes/recipeRoutes.js";
import mealPlanRoutes from "./routes/mealPlanRoutes.js";

const app = express();
const publicPath = path.join(process.cwd(), "public");

/**
 * Parse incoming JSON request bodies
 */
app.use(express.json());

/**
 * Basic CORS middleware
 * Allows frontend pages to communicate with backend APIs during development
 */
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

/**
 * Serve static frontend files from the public folder
 */
app.use(express.static(publicPath));

/**
 * Frontend page routes
 */
app.get("/", (req, res) => {
  res.sendFile(path.join(publicPath, "pages", "login-page.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(publicPath, "pages", "login-page.html"));
});

app.get("/signup", (req, res) => {
  res.sendFile(path.join(publicPath, "pages", "sign-up-page.html"));
});

app.get("/reset-password", (req, res) => {
  res.sendFile(path.join(publicPath, "pages", "reset-password.html"));
});

/**
 * API routes
 */
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api", recipeRoutes);
app.use("/api", mealPlanRoutes);

/**
 * 404 handler for unknown routes
 */
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

/**
 * Global error handler
 */
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

export default app;
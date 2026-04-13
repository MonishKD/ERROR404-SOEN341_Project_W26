import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

import authRoutes from "./routes/authRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import recipeRoutes from "./routes/recipeRoutes.js";
import mealPlanRoutes from "./routes/mealPlanRoutes.js";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());

// CORS middleware
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

const publicPath = path.join(process.cwd(), "public");
app.use(express.static(publicPath));

/*** Page Routes ***/
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

/*** API Routes ***/
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api", recipeRoutes);
app.use("/api", mealPlanRoutes);

/*** Error handling ***/
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

export default app;

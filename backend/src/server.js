// server.js
// Main server file to set up Express app, routes, and middleware
import express from "express";
import path from "path";
import { fileURLToPath } from 'url';

// Import Prisma client for database interactions
import { prisma } from "./database/prisma.js";

// Importing middleware and services
import { authMiddleware } from "./middleware/auth.js";
import { login, register } from "./services/authService.js";
import { getProfile, updateProfile } from "./services/profileService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function mapDatabaseError(error) {
  if (!error) return null;
  if (error.code === "P2021") {
    return "Database tables are missing. Run `npm run prisma:push` in backend.";
  }
  if (error.code === "P1001") {
    return "Cannot connect to PostgreSQL. Ensure Postgres is running and DATABASE_URL is correct.";
  }
  if (typeof error.message === "string" && error.message.includes("Invalid `prisma.")) {
    return "Database schema is out of sync. Run `npm run prisma:generate` then `npm run prisma:push`.";
  }
  return null;
}

const app = express();
app.use(express.json());

// CORS middleware - allows frontend to call backend API
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});

const publicPath = path.join(__dirname, "../../public");
console.log("Serving static files from:", publicPath);
app.use(express.static(publicPath));

// --- Page Routes ---

// Root route (defaults to login)
app.get("/", (req, res) => {
  res.sendFile(path.join(publicPath, "login-page.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(publicPath, "login-page.html"));
});

app.get("/signup", (req, res) => {
  res.sendFile(path.join(publicPath, "sign-up-page.html"));
});

// Login route
app.post("/api/auth/login", async (req, res) => {
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
});

// Sign up route
app.post("/api/auth/register", async (req, res) => {
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
});

// View profile
app.get("/api/profile", authMiddleware, async (req, res) => {
  const profile = await getProfile(req.token);
  res.json(profile);
});

// Update profile
app.put("/api/profile", authMiddleware, async (req, res) => {
  const result = await updateProfile(req.token, req.body);
  if (!result.ok) {
    return res.status(result.status).json({ message: result.message });
  }
  res.json({ message: "Profile updated successfully" });
});


// --- Recipe routes ---//
// Get all recipes
app.get("/api/recipes", async (req, res) => {
  try {
    const recipes = await prisma.recipes.findMany();
    res.json(recipes);
  } catch (error) {
    console.error("Error fetching recipes:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get recipe by ID
app.get("/api/recipes/:id", async (req, res) => {
  try {
    const recipe = await prisma.recipes.findUnique({
      where: { id: parseInt(req.params.id) }
    });
    if (!recipe) {
      return res.status(404).json({ error: "Recipe not found" });
    }
    res.json(recipe);
  } catch (error) {
    console.error("Error fetching recipe:", error);
    res.status(500).json({ error: error.message });
  }
});

// CREATE recipe
app.post("/api/recipes", async (req, res) => {
  try {
    const { name, ingredients, prep_time, prep_steps, cost } = req.body;
    const newRecipe = await prisma.recipes.create({
      data: { name, ingredients, prep_time, prep_steps, cost }
    });
    res.status(201).json(newRecipe);
  } catch (error) {
    console.error("Error creating recipe:", error);
    res.status(500).json({ error: error.message });
  }
});

// UPDATE recipe
app.put("/api/recipes/:id", async (req, res) => {
  try {
    const updatedRecipe = await prisma.recipes.update({
      where: { id: parseInt(req.params.id) },
      data: req.body
    });
    res.json(updatedRecipe);
  } catch (error) {
    console.error("Error updating recipe:", error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE recipe
app.delete("/api/recipes/:id", async (req, res) => {
  try {
    await prisma.recipes.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.json({ message: "Recipe deleted successfully" });
  } catch (error) {
    console.error("Error deleting recipe:", error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
  console.log("Static files served from:", publicPath);
  console.log("Prisma connected: Recipe routes ready at /api/recipes");
});

// server.js
// Main server file to set up Express app, routes, and middleware
import dotenv from 'dotenv';
import express from "express";
import path from "path";
import { fileURLToPath } from 'url';

// Import Prisma client for database interactions
import { prisma } from "./database/prisma.js";

// Importing middleware and services
import { authMiddleware } from "./middleware/auth.js";
import { checkRecipeOwner } from "./middleware/auth.js";
import { login, register } from "./services/authService.js";
import { getProfile, updateProfile } from "./services/profileService.js";
import {
  createRecipe,
  getAllRecipes,
  getRecipeById,
  updateRecipe,
  deleteRecipe
} from "./services/recipesService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root
dotenv.config({ path: path.join(__dirname, '../../.env') });

function mapDatabaseError(error) {
  if (!error) return null;

  // Full error
  console.log('Full error object:', JSON.stringify(error, null, 2));

  // Table doesn't exist error
  if (error.code === "P2021") {
    return "Database tables are missing. Run `npm run prisma:push` in backend.";
  }

  // Connection error
  if (error.code === "P1001") {
    return "Cannot connect to PostgreSQL. Ensure Postgres is running and DATABASE_URL is correct.";
  }

  // Schema mismatch
  if (
    error.code === "P2016" || // Query interpretation error
    error.message?.includes("does not exist") ||
    error.message?.includes("relation") ||
    error.message?.includes("column") ||
    error.message?.includes("prisma")
  ) {
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
app.use(express.static(publicPath));

/*** Page Routes ***/

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
  const profile = await getProfile(req.user.userId);
  res.json(profile);
});

// Update profile
app.put("/api/profile", authMiddleware, async (req, res) => {
  const result = await updateProfile(req.user.userId, req.body);
  if (!result.ok) {
    return res.status(result.status).json({ message: result.message });
  }
  res.json({ message: "Profile updated successfully" });
});

// Check if profile is complete (age, weight, height)
app.get('/api/profile/completion-status', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.users.findUnique({
      where: { id: parseInt(req.user.userId) },
      select: { age: true, weight: true, height: true }
    });

    const missingFields = [];
    if (!user.age) missingFields.push('age');
    if (!user.weight) missingFields.push('weight');
    if (!user.height) missingFields.push('height');

    res.json({
      isComplete: missingFields.length === 0,
      missingFields
    });
  } catch (error) {
    console.error('Error checking profile completion:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update health metrics
app.put('/api/profile/health-metrics', authMiddleware, async (req, res) => {
  try {
    const { age, weight, height } = req.body;

    // Validate inputs
    if (age && (age < 1 || age > 120)) {
      return res.status(400).json({ message: 'Invalid age value' });
    }

    if (weight && (weight < 1 || weight > 300)) {
      return res.status(400).json({ message: 'Invalid weight value' });
    }

    if (height && (height < 50 || height > 250)) {
      return res.status(400).json({ message: 'Invalid height value' });
    }

    const updatedUser = await prisma.users.update({
      where: { id: parseInt(req.user.userId) },
      data: {
        age: age ? parseInt(age) : null,
        weight: weight ? parseFloat(weight) : null,
        height: height ? parseFloat(height) : null
      }
    });

    res.json({
      message: 'Health metrics updated successfully',
      user: {
        age: updatedUser.age,
        weight: updatedUser.weight,
        height: updatedUser.height
      }
    });
  } catch (error) {
    console.error('Error updating health metrics:', error);
    res.status(500).json({ error: error.message });
  }
});


/*** Recipe routes ***/

// Get all recipes with optional search + filters
app.get("/api/recipes", authMiddleware, async (req, res) => {
  try {
    console.log("✅ /api/recipes route HIT", req.query);

    const q = (req.query.q || "").trim();

    // allow single value OR comma-separated list (ex: time=under-15,15-30)
    const normalize = (v) =>
      (v || "")
        .toString()
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

    const timeVals = normalize(req.query.time);       // under-15, 15-30, 30-60, 60plus
    const costVals = normalize(req.query.cost);       // low, medium, high
    const dietaryVals = normalize(req.query.dietary); // gluten-free, vegan, etc.
    const difficultyVals = normalize(req.query.difficulty); // Easy, Medium, Hard
    const allergyVals = normalize(req.query.allergies); // nut-free, dairy-free, etc.

    const AND = [];

    // Search across fields
    if (q) {
      AND.push({
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { ingredients: { contains: q, mode: "insensitive" } },
          { prep_steps: { contains: q, mode: "insensitive" } },
        ],
      });
    }

    // Time filter (if multiple selected, treat as OR inside AND)
    if (timeVals.length) {
      const timeOR = [];

      for (const time of timeVals) {
        if (time === "under-15") timeOR.push({ prep_time: { lt: 15 } });
        else if (time === "15-30") timeOR.push({ prep_time: { gte: 15, lte: 30 } });
        else if (time === "30-60") timeOR.push({ prep_time: { gte: 30, lte: 60 } });
        else if (time === "60plus") timeOR.push({ prep_time: { gt: 60 } });
      }

      if (timeOR.length) AND.push({ OR: timeOR });
    }

    // Cost filter
    if (costVals.length) {
      const costOR = [];
      for (const cost of costVals) {
        if (cost === "low") costOR.push({ cost: "Low" });
        else if (cost === "medium") costOR.push({ cost: "Medium" });
        else if (cost === "high") costOR.push({ cost: "High" });
      }
      if (costOR.length) AND.push({ OR: costOR });
    }

    // Dietary filter
    if (dietaryVals.length) {
      const dietaryOR = [];

      for (const dietary of dietaryVals) {
        // Map frontend values to database enum values
        let dbValue = dietary;
        if (dietary === "gluten-free") dbValue = "Gluten-Free";
        else if (dietary === "dairy-free") dbValue = "Dairy-Free";
        else if (dietary === "nut-free") dbValue = "Nut-Free";
        // Keep as-is for exact matches like "Vegan", "Vegetarian", "Halal"

        dietaryOR.push({ dietary_tags: { has: dbValue } });
      }
      if (dietaryOR.length) AND.push({ OR: dietaryOR });
    }

    // Difficulty filter
    if (difficultyVals.length) {
      const difficultyOR = [];
      for (const difficulty of difficultyVals) {
        const capitalized = difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase();
        if (["Easy", "Medium", "Hard"].includes(capitalized)) {
          difficultyOR.push({ difficulty: capitalized });
        }
      }
      if (difficultyOR.length) AND.push({ OR: difficultyOR });
    }

    // Allergies filter
    if (allergyVals.length) {
      const allergyOR = [];
      for (const allergy of allergyVals) {
        let dbValue = allergy;
        if (allergy === "nut-free") dbValue = "Nut-Free";
        else if (allergy === "dairy-free") dbValue = "Dairy-Free";
        else if (allergy === "gluten-free") dbValue = "Gluten-Free";

        allergyOR.push({ allergens: { has: dbValue } });
      }
      if (allergyOR.length) AND.push({ OR: allergyOR });  // Recipe has any of these allergens
    }

    const where = AND.length ? { AND } : undefined;
    console.log("🧠 Prisma where:", JSON.stringify(where, null, 2));

    const recipes = await getAllRecipes(where);

    return res.json(recipes);
  } catch (error) {
    console.error("Error fetching recipes:", error);
    return res.status(500).json({ error: error.message });
  }
});

// Get recipe by ID with owner info
app.get("/api/recipes/:id", async (req, res) => {
  try {
    const recipe = await getRecipeById(parseInt(req.params.id));
    if (!recipe) {
      return res.status(404).json({ error: "Recipe not found" });
    }
    res.json(recipe);
  } catch (error) {
    console.error("Error fetching recipe:", error);
    res.status(500).json({ error: error.message });
  }
});

// CREATE recipe with ownerId
app.post("/api/recipes", authMiddleware, async (req, res) => {
  try {

    const { name, ingredients, prep_time, prep_steps, cost, difficulty, dietary_tags, allergens } = req.body;
    const ownerId = parseInt(req.user.userId);
    const recipeData = {
      name,
      ingredients,
      prep_time: parseInt(prep_time),
      prep_steps,
      cost,
      difficulty,
      dietary_tags: dietary_tags || [],
      allergens: allergens || [],
      ownerId
    };

    const newRecipe = await createRecipe(recipeData);
    res.status(201).json(newRecipe);

  } catch (error) {
    console.error("Error creating recipe:", error);
    res.status(500).json({ error: error.message });
  }
});

// UPDATE recipe
app.put("/api/recipes/:id", checkRecipeOwner, async (req, res) => {
  try {
    const updatedRecipe = await updateRecipe(parseInt(req.params.id), req.body);
    res.json(updatedRecipe);
  } catch (error) {
    console.error("Error updating recipe:", error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE recipe
app.delete("/api/recipes/:id", checkRecipeOwner, async (req, res) => {
  try {
    const deletedRecipe = await deleteRecipe(parseInt(req.params.id));
    res.json({ message: "Recipe deleted successfully" });
  } catch (error) {
    console.error("Error deleting recipe:", error);
    res.status(500).json({ error: error.message });
  }
});


/*** Password reset routes ***/

import { requestPasswordReset, validateResetToken, resetPassword } from './services/passwordResetService.js';

app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    const result = await requestPasswordReset(email);
    res.json(result);
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'An error occurred' });
  }
});

// Validate reset token
app.get('/api/auth/validate-reset-token', async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ valid: false, message: 'Token is required' });
  }

  try {
    const result = await validateResetToken(token);
    res.json(result);
  } catch (error) {
    console.error('Token validation error:', error);
    res.status(500).json({ valid: false, message: 'An error occurred' });
  }
});

// Reset password
app.post('/api/auth/reset-password', async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ message: 'Token and password are required' });
  }

  // Validate password strength
  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters' });
  }

  try {
    const result = await resetPassword(token, password);
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'An error occurred' });
  }
});


/*** Error handling ***/

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});
// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});


// Start server
export default app;
const PORT = 4001;

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`App running at http://localhost:${PORT}`);
    console.log("Static files served from:", publicPath);
    console.log("Prisma connected: Recipe routes ready at /api/recipes");
  });
}
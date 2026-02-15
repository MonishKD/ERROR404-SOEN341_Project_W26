// server.js
// Main server file to set up Express app, routes, and middleware
const express = require("express");
const path = require("path");

// Import Prisma client for database interactions
const { prisma } = require("./database/prisma");

// Importing middleware and services
const { authMiddleware } = require("./middleware/auth");
const { login, register } = require("./services/authService");
const { getProfile, updateProfile } = require("./services/profileService");

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

// Initialize database schema on server start
// require("./database/init_database");

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

// app.use(express.static(path.join(__dirname, "../../public")));
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

// app.get("/", (req, res) => {
//   res.sendFile(path.join(__dirname, "..", "..", "public", "login-page.html"));
// });

//login route
app.post("/api/auth/login", async (req, res) => {
  const {email, password} = req.body;

  if(!email || !password) {
    return res.status(400).json({message: "Missing email or password."});
  }

  try{
    const result = await login(email, password);
    res.status(200).json(result);
  } catch (error) {
    console.error("Login error:", error);
    const dbMessage = mapDatabaseError(error);
    if (dbMessage) {
      return res.status(500).json({ message: dbMessage });
    }
    res.status(401).json({message: error.message || "Login failed."});
  }
});

// register route
app.post("/api/auth/register", async (req, res) => {
  const {userID, password, email} = req.body;
  
  if(!userID || !password || !email) {
    return res.status(400).json({message: "Missing userID, password, or email."});
  }
  
  try{
    const result = await register(userID, password, email);
    res.status(201).json(result);
  } catch (error) {
    console.error("Registration error:", error);
    const dbMessage = mapDatabaseError(error);
    if (dbMessage) {
      return res.status(500).json({ message: dbMessage });
    }
    res.status(400).json({message: error.message || "Registration failed."});
  }
});

// view profile
app.get("/api/profile", authMiddleware, async (req, res) => {
  const profile = await getProfile(req.token);
  res.json(profile);
});

// update profile
app.put("/api/profile", authMiddleware, async (req, res) => {
  const result = await updateProfile(req.token, req.body);
  if(!result.ok) {
    return res.status(result.status).json({message: result.message});
  }
  res.json({message: "Profile updated successfully"});
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

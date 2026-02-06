// server.js
// Main server file to set up Express app, routes, and middleware
const express = require("express");
const path = require("path");

// Importing middleware and services
const { authMiddleware } = require("./middleware/auth");
const { login, register } = require("./services/authService");
const { getProfile, updateProfile } = require("./services/profileService");
// Initialize database schema on server start
require("./database/init_database");

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

// start server
const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
  console.log("Static files served from:", publicPath);
});

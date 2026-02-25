// authMiddleware.js
// Purpose: allow access only to logged-in users by verifying a token (Sprint 1 simple version)
import jwt from "jsonwebtoken";
import { prisma } from "../database/prisma.js";

export function authMiddleware(req, res, next) {
  // Read the Authorization header from the request
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing or invalid token" });
  }

  // Extract the token (remove "Bearer " from the header)
  const token = header.slice("Bearer ".length).trim();

  try {
    // Decode token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user info from token
    req.user = { userId: decoded.userId };
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

export async function checkRecipeOwner(req, res, next){
  try {
  const recipeId = req.params.id;
  const userId = req.user.userId; // from authMiddleware

  const recipe = await prisma.recipes.findUnique({
    where: { id: parseInt(recipeId) },
    select: { userId: true }
  });

  if (!recipe) {
    return res.status(404).json({ message: "Recipe not found" });
  }

  if (recipe.ownerId !== userId) {
    return res.status(403).json({ message: "You don't have permission to modify this recipe" });
  }

  req.recipe = recipe; // attach recipe info if needed in the route handler
  next();
} catch (err) {
    console.error("Error checking recipe owner:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

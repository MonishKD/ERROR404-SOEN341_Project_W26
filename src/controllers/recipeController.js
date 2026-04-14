// recipeController.js

// Handles HTTP requests for recipe-related routes.
// Delegates business logic to service functions and returns responses to the client.
// Also manages input validation and error handling.

import multer from "multer";
import { prisma } from "../database/prisma.js";
import { buildRecipeWhereClause } from "../utils/recipeFilterHelpers.js";

// services
import {
  getAllRecipes,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  getRecipeById,
  getExploreRecipes,
  recipeRatings,
  createOrUpdateRecipeRating,
  videoRecipe
} from "../services/recipesService.js";

// helpers
import {
  buildRecipeCreateData,
  buildRecipeUpdateData
} from "../utils/recipeHelpers.js";

// Re-export middleware used in routes
export { checkRecipeOwner } from "../middleware/auth.js";

// Multer configuration for in-memory file uploads
const upload = multer({ storage: multer.memoryStorage() });
export { upload };

//Get all recipes belonging to the authenticated user, optionally filtered by query parameters.
export async function getAllRecipesController(req, res) {
  try {
    console.log({
      message: "/api/recipes route HIT",
      query: req.query,
      time: new Date().toISOString()
    });

    const ownerId = Number.parseInt(req.user.userId, 10);
    const where = buildRecipeWhereClause(req.query, ownerId);

    const recipes = await getAllRecipes(where);
    return res.json(recipes);
  } catch (error) {
    console.error("Error fetching recipes:", error);
    return res.status(500).json({ error: error.message });
  }
}

// Create a new recipe for the authenticated user.
export async function createRecipeController(req, res) {
  try {
    const ownerId = Number.parseInt(req.user.userId, 10);
    const recipeData = buildRecipeCreateData(req.body, ownerId);

    const newRecipe = await createRecipe(recipeData);
    res.status(201).json(newRecipe);
  } catch (error) {
    console.error("Error creating recipe:", error);
    res.status(500).json({ error: error.message });
  }
}

// Create a new recipe for the authenticated user.
export async function getExploreRecipesController(req, res) {
  try {
    const currentUserId = Number.parseInt(req.user.userId, 10);
    const recipes = await getExploreRecipes(currentUserId);
    return res.json(recipes);
  } catch (error) {
    console.error("Error fetching explore recipes:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

//Get a single recipe by id.
export async function getRecipeByIdController(req, res) {
  try {
    const recipe = await getRecipeById(Number.parseInt(req.params.id, 10));
    if (!recipe) {
      return res.status(404).json({ error: "Recipe not found" });
    }
    res.json(recipe);
  } catch (error) {
    console.error("Error fetching recipe:", error);
    res.status(500).json({ error: error.message });
  }
}

//Update an existing recipe.
export async function updateRecipeController(req, res) {
  try {
    const updateData = buildRecipeUpdateData(req.body);

    const updatedRecipe = await updateRecipe(
      Number.parseInt(req.params.id, 10),
      updateData
    );

    res.json(updatedRecipe);
  } catch (error) {
    console.error("Error updating recipe:", error);
    res.status(500).json({ error: error.message });
  }
}

//Delete a recipe by id.
export async function deleteRecipeController(req, res) {
  try {
    await deleteRecipe(Number.parseInt(req.params.id, 10));
    res.json({ message: "Recipe deleted successfully" });
  } catch (error) {
    console.error("Error deleting recipe:", error);
    res.status(500).json({ error: error.message });
  }
}

//Update recipe privacy status.
export async function updateRecipePrivacyController(req, res) {
  try {
    const { is_private } = req.body;

    const updatedRecipe = await updateRecipe(Number.parseInt(req.params.id, 10), {
      is_private
    });

    res.json(updatedRecipe);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Get all ratings and comments for a specific recipe.
export async function getRecipeRatingsController(req, res) {
  try {
    const ratings = await recipeRatings(Number.parseInt(req.params.recipeId, 10));
    res.json(ratings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

//Compute and return the average rating for a specific recipe.
export async function getAverageRatingController(req, res) {
  try {
    const ratings = await recipeRatings(Number.parseInt(req.params.recipeId, 10));
    const average =
      ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
        : 0;

    res.json(average);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

//Create or update a user's rating/comment for a recipe.
export async function createOrUpdateRecipeRatingController(req, res) {
  try {
    const userId = Number.parseInt(req.user.userId, 10);
    const { recipeId, rating, comment } = req.body;

    if (!recipeId || Number.isNaN(Number.parseInt(recipeId, 10))) {
      return res.status(400).json({ message: "Valid recipeId is required" });
    }

    const parsedRecipeId = Number.parseInt(recipeId, 10);

    if (rating === null || rating === undefined) {
      return res.status(400).json({ message: "Rating is required" });
    }

    const parsedRating = Number.parseInt(rating, 10);
    if (Number.isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const recipe = await prisma.recipes.findUnique({
      where: { id: parsedRecipeId }
    });

    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }

    const savedRating = await createOrUpdateRecipeRating(
      parsedRecipeId,
      userId,
      parsedRating,
      comment?.trim() || null
    );

    res.status(200).json(savedRating);
  } catch (error) {
    console.error("Error saving recipe rating/comment:", error);
    res.status(500).json({ message: error.message || "Failed to save rating/comment" });
  }
}

//Upload a video file for a recipe.
export async function uploadRecipeVideoController(req, res) {
  try {
    const recipeId = Number.parseInt(req.params.id, 10);

    if (!req.file) {
      return res.status(400).json({ error: "No video uploaded" });
    }

    const data = {
      videoData: req.file.buffer,
      videoType: "UPLOADED",
      fileSize: req.file.size,
      fileType: req.file.mimetype,
      title: req.file.originalname
    };

    const newVideo = await videoRecipe(recipeId, data);
    res.json(newVideo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}

//Save an external video URL for a recipe.
export async function saveRecipeVideoUrlController(req, res) {
  try {
    const recipeId = Number.parseInt(req.params.id, 10);
    const { videoUrl } = req.body;

    if (!videoUrl) {
      return res.status(400).json({ error: "Video URL required" });
    }

    const data = {
      videoUrl,
      videoType: "EXTERNAL"
    };

    const newVideo = await videoRecipe(recipeId, data);
    res.json(newVideo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}

//Get stored video data or external video URL for a recipe.
export async function getRecipeVideoController(req, res) {
  try {
    const recipeId = Number.parseInt(req.params.id, 10);

    const video = await prisma.video.findFirst({
      where: { recipeId }
    });

    if (!video) {
      return res.status(404).json({ error: "No video found" });
    }

    if (video.videoData) {
      res.set("Content-Type", video.fileType || "video/mp4");
      return res.send(video.videoData);
    }

    if (video.videoUrl) {
      return res.json({
        type: "url",
        videoUrl: video.videoUrl
      });
    }

    return res.status(404).json({ error: "No valid video data" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
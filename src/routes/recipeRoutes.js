import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import {
  upload,
  checkRecipeOwner,
  getAllRecipesController,
  createRecipeController,
  getExploreRecipesController,
  getRecipeByIdController,
  updateRecipeController,
  deleteRecipeController,
  updateRecipePrivacyController,
  getRecipeRatingsController,
  getAverageRatingController,
  createOrUpdateRecipeRatingController,
  uploadRecipeVideoController,
  saveRecipeVideoUrlController,
  getRecipeVideoController
} from "../controllers/recipeController.js";

const router = express.Router();

router.get("/recipes", authMiddleware, getAllRecipesController);
router.post("/recipes", authMiddleware, createRecipeController);
router.get("/recipes/explore", authMiddleware, getExploreRecipesController);
router.get("/recipes/:id", getRecipeByIdController);
router.put("/recipes/:id", authMiddleware, checkRecipeOwner, updateRecipeController);
router.delete("/recipes/:id", authMiddleware, checkRecipeOwner, deleteRecipeController);
router.put("/recipes/privacy/:id", authMiddleware, checkRecipeOwner, updateRecipePrivacyController);

router.get("/recipeRatings/:recipeId", getRecipeRatingsController);
router.get("/averageRating/:recipeId", getAverageRatingController);
router.post("/recipeRatings", authMiddleware, createOrUpdateRecipeRatingController);

router.post("/recipes/:id/video/upload", authMiddleware, checkRecipeOwner, upload.single("video"), uploadRecipeVideoController);
router.post("/recipes/:id/video/url", authMiddleware, checkRecipeOwner, saveRecipeVideoUrlController);
router.get("/recipes/:id/video", getRecipeVideoController);

export default router;
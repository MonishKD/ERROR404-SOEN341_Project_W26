//mealPlanRoutes.js

// This file defines the routes for meal plan-related operations such as creating, updating, deleting meal plan items, and fetching meal plans. It imports the necessary controller functions from mealPlanController.js and sets up the Express router to handle incoming requests to these routes.

import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import {
  createMealPlanItemController,
  updateMealPlanItemController,
  deleteMealPlanItemController,
  getOwnerMealPlansController,
  getMealPlanByWeekController,
  getMealPlanItemsController,
  createMealPlanController
} from "../controllers/mealPlanController.js";

const router = express.Router();

router.post("/mealPlan/item", authMiddleware, createMealPlanItemController);
router.put("/mealPlan/items/:itemId", authMiddleware, updateMealPlanItemController);
router.delete("/mealPlan/items/:itemId", authMiddleware, deleteMealPlanItemController);
router.get("/mealPlan/owner", authMiddleware, getOwnerMealPlansController);
router.get("/mealPlan/week/:startDate", authMiddleware, getMealPlanByWeekController);
router.get("/mealPlan/:id/items", authMiddleware, getMealPlanItemsController);
router.post("/mealPlan", authMiddleware, createMealPlanController);

export default router;
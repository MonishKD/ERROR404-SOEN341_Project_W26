// mealPlanController.js

// Handles HTTP requests for meal plan routes.
// Delegates business logic to service functions and returns responses to the client.
// Also manages input validation and error handling.

import { prisma } from "../database/prisma.js";
import {
  validateAllowDuplicate,
  validateCreateMealPlanItemInput,
  validateUpdateMealPlanItemInput
} from "../utils/mealPlanHelpers.js";

//Get all meal plans belonging to the authenticated user.
export async function createMealPlanItemController(req, res) {
  console.log("HIT /api/mealPlan/item route");

  try {
    const ownerId = Number.parseInt(req.user.userId, 10);
    let { mealPlanId, recipeId, day_of_week, meal_type, notes, allowDuplicate } = req.body;

    allowDuplicate = validateAllowDuplicate(allowDuplicate);

    if (allowDuplicate === "INVALID") {
      return res.status(400).json({ message: "Invalid value for allowDuplicate" });
    }

    const validationError = validateCreateMealPlanItemInput({
      mealPlanId,
      recipeId,
      day_of_week,
      meal_type,
      notes
    });

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const parsedMealPlanId = Number.parseInt(mealPlanId, 10);
    const parsedRecipeId = Number.parseInt(recipeId, 10);

    const mealPlan = await prisma.mealPlan.findFirst({
      where: {
        id: parsedMealPlanId,
        ownerId
      }
    });

    if (!mealPlan) {
      return res.status(404).json({ message: "Meal plan not found" });
    }

    const recipe = await prisma.recipes.findFirst({
      where: {
        id: parsedRecipeId,
        ownerId
      }
    });

    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }

    const duplicateAssignments = await prisma.mealPlanItem.findMany({
      where: {
        mealPlanId: parsedMealPlanId,
        recipeId: parsedRecipeId
      },
      select: {
        day_of_week: true,
        meal_type: true
      }
    });

    if (duplicateAssignments.length > 0 && allowDuplicate !== true) {
      return res.status(409).json({
        code: "DUPLICATE_RECIPE_IN_WEEK",
        message: "This recipe is already assigned in this week.",
        duplicates: duplicateAssignments
      });
    }

    const mealPlanItem = await prisma.mealPlanItem.create({
      data: {
        mealPlanId: parsedMealPlanId,
        recipeId: parsedRecipeId,
        day_of_week,
        meal_type,
        notes: notes?.trim() || null
      },
      include: {
        recipe: true
      }
    });

    return res.status(201).json({
      message: "Meal plan item created successfully",
      mealPlanItem
    });
  } catch (error) {
    console.error("Error creating mealPlan item:", error);

    if (error.code === "P2002") {
      return res.status(409).json({
        message: "A meal is already assigned to this day and meal type"
      });
    }

    return res.status(500).json({ message: "Internal server error" });
  }
}

//Resolve and validate a new recipe id during meal item updates.
//Also checks duplicate weekly assignments unless duplicates are allowed.
async function resolveUpdatedRecipeId({
  recipeId,
  ownerId,
  item,
  itemId,
  allowDuplicate
}) {
  if (recipeId === undefined) return { parsedRecipeId: undefined };

  const parsedRecipeId = Number.parseInt(recipeId, 10);

  if (Number.isNaN(parsedRecipeId)) {
    return { error: { status: 400, message: "Invalid recipeId" } };
  }

  const recipe = await prisma.recipes.findFirst({
    where: {
      id: parsedRecipeId,
      ownerId
    }
  });

  if (!recipe) {
    return { error: { status: 404, message: "Recipe not found" } };
  }

  const duplicateAssignments = await prisma.mealPlanItem.findMany({
    where: {
      mealPlanId: item.mealPlanId,
      recipeId: parsedRecipeId,
      NOT: { id: itemId }
    },
    select: {
      day_of_week: true,
      meal_type: true
    }
  });

  if (duplicateAssignments.length > 0 && allowDuplicate !== true) {
    return {
      error: {
        status: 409,
        body: {
          code: "DUPLICATE_RECIPE_IN_WEEK",
          message: "This recipe is already assigned in this week.",
          duplicates: duplicateAssignments
        }
      }
    };
  }

  return { parsedRecipeId };
}

//Update an existing meal plan item.
export async function updateMealPlanItemController(req, res) {
  try {
    const itemId = Number.parseInt(req.params.itemId, 10);
    const ownerId = Number.parseInt(req.user.userId, 10);
    let { recipeId, day_of_week, meal_type, notes, allowDuplicate } = req.body;

    allowDuplicate = validateAllowDuplicate(allowDuplicate);

    if (allowDuplicate === "INVALID") {
      return res.status(400).json({ message: "Invalid value for allowDuplicate" });
    }

    const validationError = validateUpdateMealPlanItemInput({
      itemId,
      day_of_week,
      meal_type,
      notes
    });

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const item = await prisma.mealPlanItem.findUnique({
      where: { id: itemId },
      include: {
        mealPlan: {
          select: { ownerId: true }
        }
      }
    });

    if (!item) {
      return res.status(404).json({ message: "Meal assignment not found" });
    }

    if (item.mealPlan.ownerId !== ownerId) {
      return res.status(403).json({
        message: "You do not have permission to update this meal assignment"
      });
    }

    const updateData = {};

    const recipeResolution = await resolveUpdatedRecipeId({
        recipeId,
        ownerId,
        item,
        itemId,
        allowDuplicate
    });

    if (recipeResolution.error) {
        const { status, message, body } = recipeResolution.error;
        return res.status(status).json(body || { message });
    }

    if (recipeResolution.parsedRecipeId !== undefined) {
        updateData.recipeId = recipeResolution.parsedRecipeId;
    }

    if (day_of_week !== undefined) updateData.day_of_week = day_of_week;
    if (meal_type !== undefined) updateData.meal_type = meal_type;
    if (notes !== undefined) updateData.notes = notes.trim() || null;

    const updatedItem = await prisma.mealPlanItem.update({
      where: { id: itemId },
      data: updateData
    });

    return res.json(updatedItem);
  } catch (error) {
    console.error("Error updating mealPlan item:", error);

    if (error.code === "P2002") {
      return res.status(409).json({
        message: "A meal is already assigned to that day and meal type"
      });
    }

    return res.status(500).json({ error: "Internal server error" });
  }
}

//Delete a meal plan item if it belongs to the authenticated user.
export async function deleteMealPlanItemController(req, res) {
  try {
    const itemId = Number.parseInt(req.params.itemId, 10);
    const ownerId = Number.parseInt(req.user.userId, 10);

    if (Number.isNaN(itemId)) {
      return res.status(400).json({ message: "Invalid meal assignment id" });
    }

    const item = await prisma.mealPlanItem.findUnique({
      where: { id: itemId },
      include: {
        mealPlan: {
          select: { ownerId: true }
        }
      }
    });

    if (!item) {
      return res.status(404).json({ message: "Meal assignment not found" });
    }

    if (item.mealPlan.ownerId !== ownerId) {
      return res.status(403).json({ message: "You do not have permission to delete this meal assignment" });
    }

    await prisma.mealPlanItem.delete({
      where: { id: itemId }
    });

    return res.json({ message: "Meal plan item deleted successfully" });
  } catch (error) {
    console.error("Error deleting mealPlan item:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

//Get all meal plans belonging to the authenticated user.
export async function getOwnerMealPlansController(req, res) {
  try {
    const ownerId = Number.parseInt(req.user.userId, 10);
    const mealPlans = await prisma.mealPlan.findMany({
      where: { ownerId }
    });
    return res.json(mealPlans);
  } catch (error) {
    console.error("Error fetching owner mealPlan", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

//Get a meal plan for a specific week start date.
export async function getMealPlanByWeekController(req, res) {
  try {
    const { startDate } = req.params;
    const ownerId = Number.parseInt(req.user.userId, 10);

    const [year, month, day] = startDate.split("-").map(Number);

    const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
    const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);

    console.log({
      message: "Meal plan date query",
      requestedStartDate: startDate,
      queryStartOfDay: startOfDay,
      queryEndOfDay: endOfDay,
      time: new Date().toISOString(),
    });

    const mealPlan = await prisma.mealPlan.findFirst({
      where: {
        ownerId,
        week_start_date: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });

    if (!mealPlan) return res.json(null);
    return res.json(mealPlan);
  } catch (error) {
    console.error("Error fetching mealPlan by date:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

//Get all meal items for a specific meal plan.
export async function getMealPlanItemsController(req, res) {
  try {
    const id = Number.parseInt(req.params.id, 10);
    const ownerId = Number.parseInt(req.user.userId, 10);

    if (!id || Number.isNaN(id)) {
      return res.status(400).json({ message: "Valid mealPlan id is required" });
    }

    const mealPlan = await prisma.mealPlan.findFirst({
      where: { id, ownerId }
    });

    if (!mealPlan) {
      return res.status(404).json({ message: "Meal plan not found" });
    }

    const mealPlanItems = await prisma.mealPlanItem.findMany({
      where: { mealPlanId: id },
      include: { recipe: true }
    });

    return res.json(mealPlanItems);
  } catch (error) {
    console.error("Error fetching mealPlanItems:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

//Create a new meal plan for the given week if one does not already exist.
export async function createMealPlanController(req, res) {
  try {
    const ownerId = Number.parseInt(req.user.userId, 10);
    const { week_start_date, week_end_date, name } = req.body;

    if (!week_start_date || !week_end_date) {
      return res.status(400).json({ message: "week_start_date and week_end_date are required" });
    }

    const startDate = new Date(week_start_date);
    const endDate = new Date(week_end_date);

    const existingMealPlan = await prisma.mealPlan.findFirst({
      where: {
        ownerId,
        week_start_date: startDate
      }
    });

    if (existingMealPlan) {
      return res.status(200).json(existingMealPlan);
    }

    const newMealPlan = await prisma.mealPlan.create({
      data: {
        name: name || "Weekly Meal Plan",
        week_start_date: startDate,
        week_end_date: endDate,
        ownerId
      }
    });

    return res.status(201).json(newMealPlan);
  } catch (error) {
    console.error("Error creating meal plan:", error);

    if (error.code === "P2002") {
      return res.status(409).json({ message: "Meal plan already exists for this week" });
    }

    return res.status(500).json({ message: "Internal server error" });
  }
}
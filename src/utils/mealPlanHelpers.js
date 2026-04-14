// mealPlanHelpers.js

// This file contains helper functions for validating input data related to meal plans, such as meal plan items. It defines valid values for days of the week and meal types, and provides functions to validate the input for creating and updating meal plan items.

export const VALID_DAYS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY"
];

export const VALID_MEAL_TYPES = [
  "BREAKFAST",
  "LUNCH",
  "DINNER",
  "SNACK"
];

export function validateAllowDuplicate(value) {
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (normalized === "true") return true;
    if (normalized === "false") return false;
    if (normalized !== "") return "INVALID";
  }

  if (value !== undefined && typeof value !== "boolean") {
    return "INVALID";
  }

  return value;
}

export function validateCreateMealPlanItemInput({
  mealPlanId,
  recipeId,
  day_of_week,
  meal_type,
  notes
}) {
  if (!mealPlanId || Number.isNaN(Number.parseInt(mealPlanId, 10))) {
    return "Valid mealPlanId is required";
  }

  if (!recipeId || Number.isNaN(Number.parseInt(recipeId, 10))) {
    return "Valid recipeId is required";
  }

  if (!day_of_week || !VALID_DAYS.includes(day_of_week)) {
    return "Invalid day_of_week value";
  }

  if (!meal_type || !VALID_MEAL_TYPES.includes(meal_type)) {
    return "Invalid meal_type value";
  }

  if (notes !== undefined && typeof notes !== "string") {
    return "Notes must be a string";
  }

  return null;
}

export function validateUpdateMealPlanItemInput({
  itemId,
  day_of_week,
  meal_type,
  notes
}) {
  if (Number.isNaN(itemId)) {
    return "Invalid meal assignment id";
  }

  if (day_of_week !== undefined && !VALID_DAYS.includes(day_of_week)) {
    return "Invalid day_of_week value";
  }

  if (meal_type !== undefined && !VALID_MEAL_TYPES.includes(meal_type)) {
    return "Invalid meal_type value";
  }

  if (notes !== undefined && typeof notes !== "string") {
    return "Notes must be a string";
  }

  return null;
}
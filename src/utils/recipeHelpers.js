// recipeHelpers.js

// This file contains helper functions for recipes, such as parsing string or array inputs for ingredients, preparation steps, dietary tags, and allergens. It also includes functions to build the data structures needed for creating and updating recipes based on the incoming request body.  

function emptyResult(keepUndefined) {
  return keepUndefined ? undefined : [];
}

function wrapSingleValue(value, keepUndefined) {
  if (!value) return emptyResult(keepUndefined);
  return [value];
}

function tryParseJsonArray(value, keepUndefined) {
  try {
    const parsed = JSON.parse(value);

    if (Array.isArray(parsed)) return parsed;
    if (parsed) return [parsed];
    return emptyResult(keepUndefined);
  } catch {
    return null;
  }
}

function splitStringValue(value, splitMode, keepUndefined) {
  if (splitMode === "newline" && value.includes("\n")) {
    return value.split("\n").map((v) => v.trim()).filter(Boolean);
  }

  if (splitMode === "period" && value.includes(".")) {
    return value.split(".").map((v) => v.trim()).filter(Boolean);
  }

  if (value.includes(",")) {
    return value.split(",").map((v) => v.trim()).filter(Boolean);
  }

  if (!value.trim()) return emptyResult(keepUndefined);
  return [value.trim()];
}

export function parseStringOrArray(
  value,
  splitMode = "comma",
  keepUndefined = false
) {
  if (value === undefined || value === null) {
    return emptyResult(keepUndefined);
  }

  if (Array.isArray(value)) return value;

  if (typeof value !== "string") {
    return wrapSingleValue(value, keepUndefined);
  }

  const parsedJson = tryParseJsonArray(value, keepUndefined);
  if (parsedJson !== null) return parsedJson;

  return splitStringValue(value, splitMode, keepUndefined);
}

export function mapDietaryTags(tags) {
  const normalizedTags = parseStringOrArray(tags, "comma");

  return normalizedTags.map((tag) => {
    if (tag === "gluten-free" || tag === "Gluten-Free") return "Gluten-Free";
    if (tag === "dairy-free" || tag === "Dairy-Free") return "Dairy-Free";
    if (tag === "nut-free" || tag === "Nut-Free") return "Nut-Free";
    if (tag === "vegan" || tag === "Vegan") return "Vegan";
    if (tag === "vegetarian" || tag === "Vegetarian") return "Vegetarian";
    if (tag === "halal" || tag === "Halal") return "Halal";
    return tag;
  });
}

// Additional helper functions for recipes can be added here, such as mapping allergens, building recipe data for creation/updating, etc.
export function mapAllergens(allergens) {
  const normalizedAllergens = parseStringOrArray(allergens, "comma");

  return normalizedAllergens.map((allergen) => {
    if (allergen === "peanuts" || allergen === "Peanuts") return "Peanuts";
    if (allergen === "tree-nuts" || allergen === "Tree Nuts" || allergen === "tree nuts") return "Tree Nuts";
    if (allergen === "dairy" || allergen === "Dairy") return "Dairy";
    if (allergen === "eggs" || allergen === "Eggs") return "Eggs";
    if (allergen === "soy" || allergen === "Soy") return "Soy";
    if (allergen === "wheat" || allergen === "Wheat") return "Wheat";
    if (allergen === "fish" || allergen === "Fish") return "Fish";
    if (allergen === "shellfish" || allergen === "Shellfish") return "Shellfish";
    return allergen;
  });
}

export function buildRecipeCreateData(body, ownerId) {
  const {
    name,
    ingredients,
    prep_time,
    prep_steps,
    cost,
    difficulty,
    dietary_tags,
    allergens
  } = body;

  return {
    name,
    ingredients: parseStringOrArray(ingredients, "newline"),
    prep_time: Number.parseInt(prep_time, 10),
    prep_steps: parseStringOrArray(prep_steps, "newline"),
    cost,
    difficulty,
    dietary_tags: mapDietaryTags(dietary_tags),
    allergens: mapAllergens(allergens),
    ownerId
  };
}

export function buildRecipeUpdateData(body) {
  const {
    name,
    ingredients,
    prep_time,
    prep_steps,
    cost,
    difficulty,
    dietary_tags,
    allergens
  } = body;

  return removeUndefinedFields({
    name,
    ingredients:
      ingredients === undefined
        ? undefined
        : parseStringOrArray(ingredients, "newline", true),
    prep_time: prep_time ? Number.parseInt(prep_time, 10) : undefined,
    prep_steps:
      prep_steps === undefined
        ? undefined
        : parseStringOrArray(prep_steps, "newline", true),
    cost,
    difficulty,
    dietary_tags:
      dietary_tags === undefined ? undefined : mapDietaryTags(dietary_tags),
    allergens:
      allergens === undefined
        ? undefined
        : mapAllergens(allergens)
  });
}

function removeUndefinedFields(obj) {
  const cleaned = { ...obj };

  Object.keys(cleaned).forEach((key) => {
    if (cleaned[key] === undefined) {
      delete cleaned[key];
    }
  });

  return cleaned;
}
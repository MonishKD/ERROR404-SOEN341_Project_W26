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
    allergens: parseStringOrArray(allergens, "comma"),
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
        : parseStringOrArray(allergens, "comma", true)
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
export function parseStringOrArray(value, splitMode = "comma", keepUndefined = false) {
  if (value === undefined || value === null) {
    return keepUndefined ? undefined : [];
  }

  if (Array.isArray(value)) return value;

  if (typeof value !== "string") {
    return value ? [value] : keepUndefined ? undefined : [];
  }

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed;
    return parsed ? [parsed] : keepUndefined ? undefined : [];
  } catch {
    if (splitMode === "newline" && value.includes("\n")) {
      return value.split("\n").map(v => v.trim()).filter(Boolean);
    }

    if (splitMode === "period" && value.includes(".")) {
      return value.split(".").map(v => v.trim()).filter(Boolean);
    }

    if (value.includes(",")) {
      return value.split(",").map(v => v.trim()).filter(Boolean);
    }

    return value.trim() ? [value.trim()] : keepUndefined ? undefined : [];
  }
}

export function mapDietaryTags(tags) {
  const normalizedTags = parseStringOrArray(tags, "comma");

  return normalizedTags.map(tag => {
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

  const updateData = {
    name,
    ingredients: ingredients !== undefined ? parseStringOrArray(ingredients, "newline", true) : undefined,
    prep_time: prep_time ? Number.parseInt(prep_time, 10) : undefined,
    prep_steps: prep_steps !== undefined ? parseStringOrArray(prep_steps, "newline", true) : undefined,
    cost,
    difficulty,
    dietary_tags: dietary_tags !== undefined ? mapDietaryTags(dietary_tags) : undefined,
    allergens: allergens !== undefined ? parseStringOrArray(allergens, "comma", true) : undefined
  };

  Object.keys(updateData).forEach((key) => {
    if (updateData[key] === undefined) delete updateData[key];
  });

  return updateData;
}
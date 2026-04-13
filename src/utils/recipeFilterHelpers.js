function normalizeQueryValue(value) {
  return (value || "")
    .toString()
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function buildSearchFilter(q) {
  if (!q) return null;

  return {
    OR: [
      { name: { contains: q, mode: "insensitive" } },
      { ingredients: { has: q } },
      { prep_steps: { has: q } }
    ]
  };
}

function buildTimeFilter(timeVals) {
  if (!timeVals.length) return null;

  const timeOR = [];

  for (const time of timeVals) {
    if (time === "under-15") timeOR.push({ prep_time: { lt: 15 } });
    else if (time === "15-30") timeOR.push({ prep_time: { gte: 15, lte: 30 } });
    else if (time === "30-60") timeOR.push({ prep_time: { gte: 30, lte: 60 } });
    else if (time === "60plus") timeOR.push({ prep_time: { gt: 60 } });
  }

  return timeOR.length ? { OR: timeOR } : null;
}

function buildCostFilter(costVals) {
  if (!costVals.length) return null;

  const costOR = [];

  for (const cost of costVals) {
    if (cost === "low") costOR.push({ cost: "Low" });
    else if (cost === "medium") costOR.push({ cost: "Medium" });
    else if (cost === "high") costOR.push({ cost: "High" });
  }

  return costOR.length ? { OR: costOR } : null;
}

function normalizeDietaryValue(value) {
  if (value === "gluten-free") return "Gluten-Free";
  if (value === "dairy-free") return "Dairy-Free";
  if (value === "nut-free") return "Nut-Free";
  return value;
}

function buildDietaryFilter(dietaryVals) {
  if (!dietaryVals.length) return null;

  const dietaryOR = dietaryVals.map((dietary) => ({
    dietary_tags: { has: normalizeDietaryValue(dietary) }
  }));

  return dietaryOR.length ? { OR: dietaryOR } : null;
}

function buildDifficultyFilter(difficultyVals) {
  if (!difficultyVals.length) return null;

  const difficultyOR = [];

  for (const difficulty of difficultyVals) {
    const capitalized =
      difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase();

    if (["Easy", "Medium", "Hard"].includes(capitalized)) {
      difficultyOR.push({ difficulty: capitalized });
    }
  }

  return difficultyOR.length ? { OR: difficultyOR } : null;
}

function normalizeAllergyValue(value) {
  if (value === "nut-free") return "Nut-Free";
  if (value === "dairy-free") return "Dairy-Free";
  if (value === "gluten-free") return "Gluten-Free";
  return value;
}

function buildAllergyFilter(allergyVals) {
  if (!allergyVals.length) return null;

  const allergyOR = allergyVals.map((allergy) => ({
    allergens: { has: normalizeAllergyValue(allergy) }
  }));

  return allergyOR.length ? { OR: allergyOR } : null;
}

export function buildRecipeWhereClause(query, ownerId) {
  const q = (query.q || "").trim();

  const timeVals = normalizeQueryValue(query.time);
  const costVals = normalizeQueryValue(query.cost);
  const dietaryVals = normalizeQueryValue(query.dietary);
  const difficultyVals = normalizeQueryValue(query.difficulty);
  const allergyVals = normalizeQueryValue(query.allergies);

  const filters = [
    { ownerId },
    buildSearchFilter(q),
    buildTimeFilter(timeVals),
    buildCostFilter(costVals),
    buildDietaryFilter(dietaryVals),
    buildDifficultyFilter(difficultyVals),
    buildAllergyFilter(allergyVals)
  ].filter(Boolean);

  return filters.length ? { AND: filters } : undefined;
}
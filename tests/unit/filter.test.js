/**
 * Unit Test: Recipe Filter Logic
 * 
 * User story:
 * As a logged-in user, I should be able to filter my recipes and public recipes.
 * 
 * Verifies the pure filter logic used by the Recipes page, which is currently implemented in script-recipe.js.
 * 
 * If the filter logic in script-recipe.js changes, update applyFilters() below.
 */

// ── pure filter function (mirrors the logic in filterRecipes)
function applyFilters(recipes, { timeChecked = [], difficultyChecked = [], costChecked = [], dietaryChecked = [], allergenChecked = [] }) {
  if (!timeChecked.length && !difficultyChecked.length && !costChecked.length && !dietaryChecked.length && !allergenChecked.length) {
    return recipes;
  }

  return recipes.filter(recipe => {
    if (timeChecked.length > 0) {
      const timeMatch = timeChecked.some(time => {
        if (time === 'under-15') return recipe.prep_time < 15;
        if (time === '15-30')    return recipe.prep_time >= 15 && recipe.prep_time <= 30;
        if (time === '30-60')    return recipe.prep_time >= 30 && recipe.prep_time <= 60;
        if (time === '60plus')   return recipe.prep_time > 60;
        return false;
      });
      if (!timeMatch) return false;
    }

    if (difficultyChecked.length > 0) {
      const match = difficultyChecked.some(d =>
        recipe.difficulty && recipe.difficulty.toLowerCase() === d.toLowerCase()
      );
      if (!match) return false;
    }

    if (costChecked.length > 0) {
      const match = costChecked.some(c =>
        recipe.cost && recipe.cost.toLowerCase() === c.toLowerCase()
      );
      if (!match) return false;
    }

    if (dietaryChecked.length > 0 && recipe.dietary_tags) {
      const match = dietaryChecked.some(diet =>
        recipe.dietary_tags.some(tag => tag.toLowerCase() === diet.toLowerCase())
      );
      if (!match) return false;
    }

    if (allergenChecked.length > 0 && recipe.allergens) {
      const hasAllergen = allergenChecked.some(allergen =>
        recipe.allergens.some(a => a.toLowerCase() === allergen.toLowerCase())
      );
      if (hasAllergen) return false;
    }

    return true;
  });
}

const recipes = [
  {
    id: 1, name: "Quick Salad",   prep_time: 10, difficulty: "Easy",
    cost: "Low",    dietary_tags: ["Vegetarian"],        allergens: [],
  },
  {
    id: 2, name: "Chicken Pasta", prep_time: 25, difficulty: "Medium",
    cost: "Medium", dietary_tags: [],                    allergens: ["Gluten"],
  },
  {
    id: 3, name: "Beef Stew",     prep_time: 45, difficulty: "Hard",
    cost: "High",   dietary_tags: ["Vegan", "Gluten-Free"], allergens: [],
  },
  {
    id: 4, name: "Lamb Roast",    prep_time: 90, difficulty: "Hard",
    cost: "High",   dietary_tags: [],                    allergens: ["Dairy", "Nuts"],
  },
];

const names = (result) => result.map(r => r.name);
const none = {};

describe("no filters", () => {
  test("returns all recipes when no filters are selected", () => {
    expect(applyFilters(recipes, none)).toHaveLength(4);
  });

  test("returns all recipes when all filter arrays are empty", () => {
    expect(applyFilters(recipes, {
      timeChecked: [], difficultyChecked: [], costChecked: [],
      dietaryChecked: [], allergenChecked: []
    })).toHaveLength(4);
  });
});

describe("time filter", () => {
  test("under-15", () => {
    expect(names(applyFilters(recipes, { timeChecked: ["under-15"] }))).toEqual(["Quick Salad"]);
  });

  test("15-30", () => {
    expect(names(applyFilters(recipes, { timeChecked: ["15-30"] }))).toEqual(["Chicken Pasta"]);
  });

  test("30-60", () => {
    expect(names(applyFilters(recipes, { timeChecked: ["30-60"] }))).toEqual(["Beef Stew"]);
  });

  test("60plus", () => {
    expect(names(applyFilters(recipes, { timeChecked: ["60plus"] }))).toEqual(["Lamb Roast"]);
  });

  test("multiple time values act as OR", () => {
    expect(names(applyFilters(recipes, { timeChecked: ["under-15", "60plus"] }))).toEqual(["Quick Salad", "Lamb Roast"]);
  });
});

describe("difficulty filter", () => {
  test("easy", () => {
    expect(names(applyFilters(recipes, { difficultyChecked: ["easy"] }))).toEqual(["Quick Salad"]);
  });

  test("medium", () => {
    expect(names(applyFilters(recipes, { difficultyChecked: ["medium"] }))).toEqual(["Chicken Pasta"]);
  });

  test("multiple difficulties act as OR", () => {
    expect(names(applyFilters(recipes, { difficultyChecked: ["easy", "medium"] }))).toEqual(["Quick Salad", "Chicken Pasta"]);
  });
});

describe("cost filter", () => {
  test("low", () => {
    expect(names(applyFilters(recipes, { costChecked: ["low"] }))).toEqual(["Quick Salad"]);
  });

  test("high", () => {
    expect(names(applyFilters(recipes, { costChecked: ["high"] }))).toEqual(["Beef Stew", "Lamb Roast"]);
  });
});

describe("dietary filter", () => {
  test("vegetarian", () => {
    expect(names(applyFilters(recipes, { dietaryChecked: ["vegetarian"] }))).toEqual(["Quick Salad"]);
  });

  test("vegan", () => {
    expect(names(applyFilters(recipes, { dietaryChecked: ["vegan"] }))).toEqual(["Beef Stew"]);
  });

  test("multiple dietary tags act as OR", () => {
    expect(names(applyFilters(recipes, { dietaryChecked: ["vegetarian", "vegan"] }))).toEqual(["Quick Salad", "Beef Stew"]);
  });

  test("excludes recipes with no dietary_tags when filter is active", () => {
    const result = applyFilters(recipes, { dietaryChecked: ["vegetarian"] });
    expect(result.find(r => r.name === "Chicken Pasta")).toBeUndefined();
  });
});

describe("allergen filter", () => {
  test("gluten: excludes recipes containing Gluten", () => {
    const result = names(applyFilters(recipes, { allergenChecked: ["gluten"] }));
    expect(result).not.toContain("Chicken Pasta");
    expect(result).toContain("Quick Salad");
    expect(result).toContain("Beef Stew");
  });

  test("nuts: excludes recipes containing Nuts", () => {
    const result = names(applyFilters(recipes, { allergenChecked: ["nuts"] }));
    expect(result).not.toContain("Lamb Roast");
  });

  test("multiple allergens: excludes recipes containing any selected allergen", () => {
    const result = names(applyFilters(recipes, { allergenChecked: ["gluten", "nuts"] }));
    expect(result).not.toContain("Chicken Pasta");
    expect(result).not.toContain("Lamb Roast");
    expect(result).toContain("Quick Salad");
    expect(result).toContain("Beef Stew");
  });
});

describe("combined filters", () => {
  test("time + difficulty", () => {
    const result = names(applyFilters(recipes, {
      timeChecked: ["15-30"],
      difficultyChecked: ["medium"],
    }));
    expect(result).toEqual(["Chicken Pasta"]);
  });

  test("dietary + allergen: vegan recipes excluding dairy", () => {
    const result = names(applyFilters(recipes, {
      dietaryChecked: ["vegan"],
      allergenChecked: ["dairy"],
    }));
    expect(result).toEqual(["Beef Stew"]);
  });

  test("impossible combination returns empty array", () => {
    const result = applyFilters(recipes, {
      difficultyChecked: ["easy"],
      costChecked: ["high"],
    });
    expect(result).toHaveLength(0);
  });

  test("time + difficulty + cost all matching returns single recipe", () => {
    const result = names(applyFilters(recipes, {
      timeChecked: ["15-30"],
      difficultyChecked: ["medium"],
      costChecked: ["medium"],
    }));
    expect(result).toEqual(["Chicken Pasta"]);
  });
});
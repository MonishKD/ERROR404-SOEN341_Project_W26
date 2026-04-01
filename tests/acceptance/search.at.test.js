/**
 * @jest-environment jsdom
 */
import { beforeAll, beforeEach, afterEach, afterAll, describe, expect, jest, test } from "@jest/globals";
import { fireEvent, waitFor } from "@testing-library/dom";
import "@testing-library/jest-dom";

describe("Acceptance Test: Recipe Search for Logged-in Users", () => {
  const mockAllRecipes = [
    {
      id: 1,
      name: "Banana Oat Pancakes",
      ingredients: ["2 ripe bananas", "1 cup oats", "2 eggs", "1/2 cup milk"],
      prep_time: 15,
      prep_steps: ["Mash bananas", "Mix all ingredients", "Cook on skillet until golden"],
      cost: "Low",
      difficulty: "Easy",
      dietary_tags: ["Vegetarian", "Gluten-Free"],
      allergens: [],
      created_at: "2026-03-27T12:00:00.000Z",
      updated_at: "2026-03-27T12:00:00.000Z",
      ownerId: 1,
      is_private: false,
      owner: {
        id: 1,
        email: "user1@test.com",
        firstName: "User",
        lastName: "One",
        username: "user1",
      },
      videos: [],
      ratings: [],
    },
    {
      id: 2,
      name: "Halal Chicken Shawarma Bowl",
      ingredients: ["500g chicken thighs", "shawarma spices", "rice", "garlic sauce", "pickles"],
      prep_time: 30,
      prep_steps: ["Marinate chicken with spices", "Cook chicken until done", "Serve over rice with sauce"],
      cost: "Medium",
      difficulty: "Medium",
      dietary_tags: ["Halal", "High Protein"],
      allergens: ["Dairy"],
      created_at: "2026-03-27T12:00:00.000Z",
      updated_at: "2026-03-27T12:00:00.000Z",
      ownerId: 2,
      is_private: false,
      owner: {
        id: 2,
        email: "user2@test.com",
        firstName: "User",
        lastName: "Two",
        username: "user2",
      },
      videos: [],
      ratings: [],
    },
    {
      id: 3,
      name: "Greek Yogurt Parfait",
      ingredients: ["Greek yogurt", "mixed berries", "granola", "honey"],
      prep_time: 5,
      prep_steps: ["Layer yogurt", "Add berries", "Top with granola and honey"],
      cost: "Low",
      difficulty: "Easy",
      dietary_tags: ["Vegetarian", "High Protein"],
      allergens: ["Dairy"],
      created_at: "2026-03-27T12:00:00.000Z",
      updated_at: "2026-03-27T12:00:00.000Z",
      ownerId: 3,
      is_private: false,
      owner: {
        id: 3,
        email: "user3@test.com",
        firstName: "User",
        lastName: "Three",
        username: "user3",
      },
      videos: [],
      ratings: [],
    },
    {
      id: 4,
      name: "Spicy Chicken Tacos",
      ingredients: ["chicken breast", "taco seasoning", "corn tortillas", "salsa", "cilantro"],
      prep_time: 25,
      prep_steps: ["Season chicken", "Cook and shred chicken", "Warm tortillas", "Assemble tacos"],
      cost: "Medium",
      difficulty: "Easy",
      dietary_tags: ["Dairy-Free"],
      allergens: [],
      created_at: "2026-03-27T12:00:00.000Z",
      updated_at: "2026-03-27T12:00:00.000Z",
      ownerId: 4,
      is_private: true,
      owner: {
        id: 4,
        email: "user4@test.com",
        firstName: "User",
        lastName: "Four",
        username: "user4",
      },
      videos: [],
      ratings: [],
    },
  ];

  let originalFetch;

  const jsonResponse = (body, ok = true) =>
    Promise.resolve({
      ok,
      json: async () => body,
    });

  const renderRecipesPage = () => {
    document.body.innerHTML = `
      <div class="recipes-page">
        <div id="avatarNav"></div>
        <a class="nav-link logout" href="#">Logout</a>
        <section>
          <div id="myRecipesEmpty"></div>
          <div id="myRecipesGrid"></div>
        </section>
        <section class="section">
          <div class="search-container">
            <input type="text" id="searchInput" placeholder="Search recipes..." />
            <button class="search-btn" type="button">Search</button>
          </div>
          <div id="generalRecipesGrid" class="recipe-cards-grid"></div>
        </section>
      </div>
    `;
  };

  const mockFetchRoutes = () => {
    global.fetch = jest.fn((url) => {
      if (url === "/api/profile") {
        return jsonResponse({
          id: 1,
          email: "test@example.com",
          firstName: "Test",
          lastName: "User",
        });
      }

      if (typeof url === "string" && url.includes("/recipes/explore")) {
        return jsonResponse(mockAllRecipes.filter((recipe) => !recipe.is_private));
      }

      if (typeof url === "string" && url.includes("/recipes?ownerId=1")) {
        return jsonResponse([
          {
            ...mockAllRecipes[0],
            ownerId: 1,
          },
        ]);
      }

      if (typeof url === "string" && url.includes("/averageRating/")) {
        return jsonResponse({ averageRating: 4.5 });
      }

      if (typeof url === "string" && url.includes("/recipeRatings/")) {
        return jsonResponse([]);
      }

      return jsonResponse({});
    });
  };

  const dispatchRecipesPageLoad = async () => {
    window.history.pushState({}, "", "/recipes.html");
    document.dispatchEvent(new Event("DOMContentLoaded"));

    await waitFor(() => {
      expect(document.querySelectorAll("#generalRecipesGrid .public-recipe-card")).toHaveLength(3);
    });
  };

  const getRenderedTitles = () =>
    Array.from(document.querySelectorAll("#generalRecipesGrid .recipe-card-title")).map((node) =>
      node.textContent.trim()
    );

  beforeAll(async () => {
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});

    await import("../../public/script.js");
  });

  afterAll(() => {
    console.log.mockRestore();
    console.error.mockRestore();
  });

  beforeEach(() => {
    originalFetch = global.fetch;
    renderRecipesPage();
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem("mealmajor_token", "mock-jwt-token");
    mockFetchRoutes();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    localStorage.clear();
    sessionStorage.clear();
    jest.clearAllMocks();
  });

  test("AT-01: Logged-in user sees only public recipes matching search keyword", async () => {
    await dispatchRecipesPageLoad();

    const searchInput = document.getElementById("searchInput");
    const searchButton = document.querySelector(".search-btn");

    searchInput.value = "chicken";
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(getRenderedTitles()).toEqual(["Halal Chicken Shawarma Bowl"]);
    });
  });

  test("AT-02: Empty search shows all public recipes", async () => {
    await dispatchRecipesPageLoad();

    const searchInput = document.getElementById("searchInput");
    const searchButton = document.querySelector(".search-btn");

    searchInput.value = "chicken";
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(getRenderedTitles()).toEqual(["Halal Chicken Shawarma Bowl"]);
    });

    searchInput.value = "";
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(getRenderedTitles()).toEqual([
        "Banana Oat Pancakes",
        "Halal Chicken Shawarma Bowl",
        "Greek Yogurt Parfait",
      ]);
    });
  });

  test("AT-03: Search with Enter key works", async () => {
    await dispatchRecipesPageLoad();

    const searchInput = document.getElementById("searchInput");

    searchInput.value = "pancakes";
    fireEvent.keyUp(searchInput, { key: "Enter", code: "Enter" });

    await waitFor(() => {
      expect(getRenderedTitles()).toEqual(["Banana Oat Pancakes"]);
    });
  });

  test("AT-04: No results message when no recipes match", async () => {
    await dispatchRecipesPageLoad();

    const searchInput = document.getElementById("searchInput");
    const searchButton = document.querySelector(".search-btn");
    const recipeGrid = document.getElementById("generalRecipesGrid");

    searchInput.value = "nonexistent recipe";
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(recipeGrid).toHaveTextContent("No recipes match your search");
    });

    expect(recipeGrid.querySelectorAll(".public-recipe-card")).toHaveLength(0);
  });

  test("AT-05: Case-insensitive search works", async () => {
    await dispatchRecipesPageLoad();

    const searchInput = document.getElementById("searchInput");
    const searchButton = document.querySelector(".search-btn");

    searchInput.value = "CHICKEN";
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(getRenderedTitles()).toEqual(["Halal Chicken Shawarma Bowl"]);
    });
  });

  test("AT-06: Partial match search works", async () => {
    await dispatchRecipesPageLoad();

    const searchInput = document.getElementById("searchInput");
    const searchButton = document.querySelector(".search-btn");

    searchInput.value = "pancak";
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(getRenderedTitles()).toEqual(["Banana Oat Pancakes"]);
    });
  });
});

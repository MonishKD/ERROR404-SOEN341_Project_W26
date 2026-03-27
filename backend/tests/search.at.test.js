import { jest } from "@jest/globals";
import { fireEvent } from "@testing-library/dom";
import "@testing-library/jest-dom";

// Mock the entire module dependencies
jest.mock("../../public/api.js", () => ({
  fetchAverageRating: jest.fn(() => Promise.resolve(4.5)),
  fetchRecipeRatings: jest.fn(() => Promise.resolve([])),
  submitRecipeRatingAndComment: jest.fn(() => Promise.resolve({ success: true })),
  saveRecipeToMyCollection: jest.fn(() => Promise.resolve({ success: true }))
}));

describe("Acceptance Test: Recipe Search for Logged-in Users", () => {
  let originalFetch;
  let mockAllRecipes;

  beforeEach(() => {
    // Setup mock data
    mockAllRecipes = [
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
        created_at: new Date(),
        updated_at: new Date(),
        ownerId: 1,
        is_private: false,
        owner: { 
          id: 1,
          email: "user1@test.com", 
          firstName: "User", 
          lastName: "One",
          username: "user1"
        },
        videos: [],
        ratings: []
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
        created_at: new Date(),
        updated_at: new Date(),
        ownerId: 2,
        is_private: false,
        owner: { 
          id: 2,
          email: "user2@test.com", 
          firstName: "User", 
          lastName: "Two",
          username: "user2"
        },
        videos: [],
        ratings: []
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
        created_at: new Date(),
        updated_at: new Date(),
        ownerId: 3,
        is_private: false,
        owner: { 
          id: 3,
          email: "user3@test.com", 
          firstName: "User", 
          lastName: "Three",
          username: "user3"
        },
        videos: [],
        ratings: []
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
        created_at: new Date(),
        updated_at: new Date(),
        ownerId: 4,
        is_private: true,
        owner: { 
          id: 4,
          email: "user4@test.com", 
          firstName: "User", 
          lastName: "Four",
          username: "user4"
        },
        videos: [],
        ratings: []
      }
    ];

    // Set up DOM with proper structure
    document.body.innerHTML = `
      <div class="recipes-page">
        <div class="search-container">
          <input type="text" id="searchInput" placeholder="Search recipes..." />
          <button class="search-btn">Search</button>
        </div>
        <div class="section">
          <div class="recipe-cards-grid"></div>
        </div>
      </div>
    `;

    // Mock authenticated user session
    localStorage.setItem("authToken", "mock-jwt-token");
    sessionStorage.setItem("user", JSON.stringify({ 
      id: 1, 
      email: "test@example.com",
      firstName: "Test",
      lastName: "User" 
    }));

    // Mock fetch for API calls
    originalFetch = global.fetch;
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true })
      })
    );

    // Set up global variables
    global.allRecipes = mockAllRecipes;
    global.displayFilteredRecipes = jest.fn();
    global.createPublicRecipeCard = jest.fn(async (recipe) => {
      const card = document.createElement("div");
      card.className = "recipe-card";
      card.setAttribute('data-recipe-id', recipe.id);
      card.innerHTML = `
        <h3>${recipe.name}</h3>
        <div class="recipe-meta">
          <span>⏱️ ${recipe.prep_time} min</span>
          <span>💰 ${recipe.cost}</span>
          <span>📊 ${recipe.difficulty}</span>
        </div>
        <div class="recipe-tags">
          ${recipe.dietary_tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
        </div>
        <div class="recipe-author">by ${recipe.owner.username}</div>
      `;
      return card;
    });
    global.renderStars = jest.fn(() => "⭐⭐⭐⭐");
    global.getUserInitialsFromEmail = jest.fn((email) => {
      return email ? email.substring(0, 2).toUpperCase() : "??";
    });

    // Import the actual module after mocks are set up
    const script = require("../../public/script.js");
    global.filterRecipesBySearch = script.filterRecipesBySearch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    localStorage.clear();
    sessionStorage.clear();
    jest.clearAllMocks();
  });

  test("AT-01: Logged-in user sees only public recipes matching search keyword", async () => {
    const searchInput = document.getElementById("searchInput");
    const searchButton = document.querySelector(".search-btn");
    const recipeGrid = document.querySelector(".recipe-cards-grid");

    // Simulate user typing "chicken" in search bar
    searchInput.value = "chicken";
    
    // Simulate user clicking search button
    fireEvent.click(searchButton);
    
    // Wait for async operations to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Verify that displayFilteredRecipes was called with filtered recipes
    expect(global.displayFilteredRecipes).toHaveBeenCalled();
    
    const calledWithRecipes = global.displayFilteredRecipes.mock.calls[0][0];
    
    // Should only contain the chicken recipe
    expect(calledWithRecipes).toHaveLength(1);
    expect(calledWithRecipes[0].name).toBe("Halal Chicken Shawarma Bowl");
    expect(calledWithRecipes[0].is_private).toBe(false);
  });

  test("AT-02: Empty search shows all public recipes", async () => {
    const searchInput = document.getElementById("searchInput");
    const searchButton = document.querySelector(".search-btn");

    const publicRecipes = mockAllRecipes.filter(recipe => !recipe.is_private);

    // Simulate empty search
    searchInput.value = "";
    fireEvent.click(searchButton);
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(global.displayFilteredRecipes).toHaveBeenCalledWith(publicRecipes);
  });

  test("AT-03: Search with Enter key works", async () => {
    const searchInput = document.getElementById("searchInput");
    
    // Simulate typing and pressing Enter
    searchInput.value = "pancakes";
    fireEvent.keyUp(searchInput, { key: "Enter", code: "Enter" });
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const calledWithRecipes = global.displayFilteredRecipes.mock.calls[0][0];
    expect(calledWithRecipes).toHaveLength(1);
    expect(calledWithRecipes[0].name).toBe("Banana Oat Pancakes");
    expect(calledWithRecipes[0].is_private).toBe(false);
  });

  test("AT-04: No results message when no recipes match", async () => {
    const searchInput = document.getElementById("searchInput");
    const searchButton = document.querySelector(".search-btn");
    const recipeGrid = document.querySelector(".recipe-cards-grid");
    
    // Override displayFilteredRecipes to actually render
    const originalDisplayFiltered = global.displayFilteredRecipes;
    global.displayFilteredRecipes = async (recipes) => {
      if (recipes.length === 0) {
        recipeGrid.innerHTML = '<p class="no-results">No recipes match your search</p>';
      } else {
        recipeGrid.innerHTML = recipes.map(r => `<div class="recipe-card">${r.name}</div>`).join("");
      }
    };
    
    searchInput.value = "nonexistent recipe";
    fireEvent.click(searchButton);
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(recipeGrid.innerHTML).toContain("No recipes match your search");
    expect(recipeGrid.querySelectorAll('.recipe-card')).toHaveLength(0);

    global.displayFilteredRecipes = originalDisplayFiltered;
  });

  test("AT-05: Case-insensitive search works", async () => {
    const searchInput = document.getElementById("searchInput");
    const searchButton = document.querySelector(".search-btn");
    
    // Test uppercase search
    searchInput.value = "CHICKEN";
    fireEvent.click(searchButton);
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const calledWithRecipes = global.displayFilteredRecipes.mock.calls[0][0];
    expect(calledWithRecipes[0].name).toBe("Halal Chicken Shawarma Bowl");
  });

  test("AT-06: Partial match search works", async () => {
    const searchInput = document.getElementById("searchInput");
    const searchButton = document.querySelector(".search-btn");
    
    searchInput.value = "pancak"; // Partial word
    fireEvent.click(searchButton);
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const calledWithRecipes = global.displayFilteredRecipes.mock.calls[0][0];
    expect(calledWithRecipes[0].name).toBe("Banana Oat Pancakes");
  });
});
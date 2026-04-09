import { jest } from "@jest/globals";
import request from "supertest";

/**
 * Browse Recipes Acceptance Test (AT)
 * User story:
 * As a logged-in user, I should see a list of my recipes whenever I navigate to the Recipes page.
 *
 * This test verifies the backend endpoint used by the Recipes page: /api/recipes
 */

// Mock multer because server.js imports it for video upload routes
jest.unstable_mockModule("multer", () => {
  const multerMock = () => ({
    single: () => (req, res, next) => next(),
  });

  multerMock.memoryStorage = () => ({});

  return {
    default: multerMock,
  };
}, { virtual: true });

// Mock Prisma before importing the server
jest.unstable_mockModule("../../src/database/prisma.js", () => ({
  prisma: {
    recipes: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    users: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

// Mock auth service (server imports it)
const mockLogin = jest.fn();
const mockRegister = jest.fn();

jest.unstable_mockModule("../../src/services/authService.js", () => ({
  login: mockLogin,
  register: mockRegister,
}));

// Mock profile service (server imports it)
const mockGetProfile = jest.fn();
const mockUpdateProfile = jest.fn();

jest.unstable_mockModule("../../src/services/profileService.js", () => ({
  getProfile: mockGetProfile,
  updateProfile: mockUpdateProfile,
}));

// Mock recipes service
const mockCreateRecipe = jest.fn();
const mockGetAllRecipes = jest.fn();
const mockGetRecipeById = jest.fn();
const mockUpdateRecipe = jest.fn();
const mockDeleteRecipe = jest.fn();
const mockRecipeRatings = jest.fn();
const mockCreateOrUpdateRecipeRating = jest.fn();
const mockVideoRecipe = jest.fn();
const mockGetExploreRecipes = jest.fn();

jest.unstable_mockModule("../../src/services/recipesService.js", () => ({
  createRecipe: mockCreateRecipe,
  getAllRecipes: mockGetAllRecipes,
  getRecipeById: mockGetRecipeById,
  updateRecipe: mockUpdateRecipe,
  deleteRecipe: mockDeleteRecipe,
  recipeRatings: mockRecipeRatings,
  createOrUpdateRecipeRating: mockCreateOrUpdateRecipeRating,
  videoRecipe: mockVideoRecipe,
  getExploreRecipes: mockGetExploreRecipes,
}));

// Mock auth middleware
jest.unstable_mockModule("../../src/middleware/auth.js", () => ({
  authMiddleware: (req, res, next) => {
    const authHeader = req.headers.authorization;

    // Simulate authentication based on the Authorization header
    if (authHeader === "Bearer valid-token") {
      req.user = { userId: 1, email: "user1@test.com" };
      return next();
    }

    return res.status(401).json({ message: "Unauthorized" });
  },
  checkRecipeOwner: (req, res, next) => next(),
}));

// Import app after mocks
const { default: app } = await import("../../src/server.js");

describe("Browse Recipes AT - /api/recipes", () => {
  beforeAll(() => {
    jest.spyOn(console, "error").mockImplementation(() => { });
    jest.spyOn(console, "log").mockImplementation(() => { });
  });

  afterAll(() => {
    console.error.mockRestore();
    console.log.mockRestore();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test case: Logged-in user sees a list of their recipes
  test("Logged-in user sees a list of their recipes", async () => {
    const myRecipes = [
      // Mock recipes owned by user with ID 1
      {
        id: 101,
        name: "Spaghetti",
        ownerId: 1,
        ingredients: ["pasta", "tomato sauce"],
        prep_steps: ["Boil pasta", "Add sauce"],
        prep_time: 20,
        cost: "Low",
        difficulty: "Easy",
      },
      // Another test recipe owned by user with ID 1
      {
        id: 102,
        name: "Chicken Bowl",
        ownerId: 1,
        ingredients: ["chicken", "rice"],
        prep_steps: ["Cook chicken", "Serve with rice"],
        prep_time: 30,
        cost: "Medium",
        difficulty: "Easy",
      },
    ];

    mockGetAllRecipes.mockResolvedValue(myRecipes);
    // Simulate authenticated request with valid token
    const res = await request(app)
      .get("/api/recipes")
      .set("Authorization", "Bearer valid-token");

    expect(res.status).toBe(200);
    expect(mockGetAllRecipes).toHaveBeenCalledWith({
      AND: [{ ownerId: 1 }],
    });
    expect(res.body).toEqual(myRecipes);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].name).toBe("Spaghetti");
    expect(res.body[1].name).toBe("Chicken Bowl");
  });
});
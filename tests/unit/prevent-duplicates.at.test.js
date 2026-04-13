import { jest } from "@jest/globals";
import request from "supertest";

/**
 * Prevent Duplicates Acceptance Test (AT)
 * User story:
 * As a logged-in user, I should be able to know when a duplicate recipe was added in the same weekly meal plan.
 *
 * This test verifies the backend endpoint used by the Meal Planner page:
 * POST /api/mealPlan/item
 */

// Mock multer because recipe routes import it for video upload endpoints
jest.unstable_mockModule("multer", () => {
  const multerMock = () => ({
    single: () => (req, res, next) => next(),
  });

  multerMock.memoryStorage = () => ({});

  return {
    default: multerMock,
  };
}, { virtual: true });

const mockPrisma = {
  mealPlan: {
    findFirst: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
  },
  mealPlanItem: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  recipes: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  users: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

// Mock Prisma before importing the server
jest.unstable_mockModule("../../src/database/prisma.js", () => ({
  prisma: mockPrisma,
}));

// Mock auth service (server imports auth routes)
const mockLogin = jest.fn();
const mockRegister = jest.fn();

jest.unstable_mockModule("../../src/services/authService.js", () => ({
  login: mockLogin,
  register: mockRegister,
  forgotPassword: jest.fn(),
  validateResetToken: jest.fn(),
  resetPassword: jest.fn(),
}));

// Mock profile service (server imports profile routes)
const mockGetProfile = jest.fn();
const mockUpdateProfile = jest.fn();

jest.unstable_mockModule("../../src/services/profileService.js", () => ({
  getProfile: mockGetProfile,
  updateProfile: mockUpdateProfile,
}));

// Mock recipes service (server imports recipe routes)
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

describe("Prevent Duplicates AT - /api/mealPlan/item", () => {
  beforeAll(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterAll(() => {
    console.error.mockRestore();
    console.log.mockRestore();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test cases scenarios:

  test("Logged-in user can add a recipe to an empty meal slot successfully", async () => {
    const createdMealPlanItem = {
      id: 501,
      mealPlanId: 700,
      recipeId: 101,
      day_of_week: "MONDAY",
      meal_type: "LUNCH",
      notes: null,
      recipe: {
        id: 101,
        name: "Spaghetti",
      },
    };

    mockPrisma.mealPlan.findFirst.mockResolvedValue({
      id: 700,
      ownerId: 1,
      name: "Weekly Meal Plan",
    });
    mockPrisma.recipes.findFirst.mockResolvedValue({
      id: 101,
      ownerId: 1,
      name: "Spaghetti",
    });
    mockPrisma.mealPlanItem.findMany.mockResolvedValue([]);
    mockPrisma.mealPlanItem.create.mockResolvedValue(createdMealPlanItem);

    const res = await request(app)
      .post("/api/mealPlan/item")
      .set("Authorization", "Bearer valid-token")
      .send({
        mealPlanId: 700,
        recipeId: 101,
        day_of_week: "MONDAY",
        meal_type: "LUNCH",
      });

    expect(res.status).toBe(201);
    expect(mockPrisma.mealPlan.findFirst).toHaveBeenCalledWith({
      where: {
        id: 700,
        ownerId: 1,
      },
    });
    expect(mockPrisma.recipes.findFirst).toHaveBeenCalledWith({
      where: {
        id: 101,
        ownerId: 1,
      },
    });
    expect(mockPrisma.mealPlanItem.create).toHaveBeenCalledWith({
      data: {
        mealPlanId: 700,
        recipeId: 101,
        day_of_week: "MONDAY",
        meal_type: "LUNCH",
        notes: null,
      },
      include: {
        recipe: true,
      },
    });
    expect(res.body.message).toBe("Meal plan item created successfully");
    expect(res.body.mealPlanItem.recipeId).toBe(101);
  });

  test("Logged-in user gets a duplicate warning when adding the same recipe again in the same week", async () => {
    const duplicateAssignments = [
      {
        day_of_week: "MONDAY",
        meal_type: "LUNCH",
      },
    ];

    mockPrisma.mealPlan.findFirst.mockResolvedValue({
      id: 700,
      ownerId: 1,
      name: "Weekly Meal Plan",
    });
    mockPrisma.recipes.findFirst.mockResolvedValue({
      id: 101,
      ownerId: 1,
      name: "Spaghetti",
    });
    mockPrisma.mealPlanItem.findMany.mockResolvedValue(duplicateAssignments);

    const res = await request(app)
      .post("/api/mealPlan/item")
      .set("Authorization", "Bearer valid-token")
      .send({
        mealPlanId: 700,
        recipeId: 101,
        day_of_week: "WEDNESDAY",
        meal_type: "DINNER",
      });

    expect(res.status).toBe(409);
    expect(mockPrisma.mealPlanItem.findMany).toHaveBeenCalledWith({
      where: {
        mealPlanId: 700,
        recipeId: 101,
      },
      select: {
        day_of_week: true,
        meal_type: true,
      },
    });
    expect(mockPrisma.mealPlanItem.create).not.toHaveBeenCalled();
    expect(res.body).toEqual({
      code: "DUPLICATE_RECIPE_IN_WEEK",
      message: "This recipe is already assigned in this week.",
      duplicates: duplicateAssignments,
    });
  });

  test("Logged-in user can explicitly allow the duplicate recipe after confirmation", async () => {
    const createdDuplicateMealPlanItem = {
      id: 502,
      mealPlanId: 700,
      recipeId: 101,
      day_of_week: "WEDNESDAY",
      meal_type: "DINNER",
      notes: null,
      recipe: {
        id: 101,
        name: "Spaghetti",
      },
    };

    mockPrisma.mealPlan.findFirst.mockResolvedValue({
      id: 700,
      ownerId: 1,
      name: "Weekly Meal Plan",
    });
    mockPrisma.recipes.findFirst.mockResolvedValue({
      id: 101,
      ownerId: 1,
      name: "Spaghetti",
    });
    mockPrisma.mealPlanItem.findMany.mockResolvedValue([
      {
        day_of_week: "MONDAY",
        meal_type: "LUNCH",
      },
    ]);
    mockPrisma.mealPlanItem.create.mockResolvedValue(createdDuplicateMealPlanItem);

    const res = await request(app)
      .post("/api/mealPlan/item")
      .set("Authorization", "Bearer valid-token")
      .send({
        mealPlanId: 700,
        recipeId: 101,
        day_of_week: "WEDNESDAY",
        meal_type: "DINNER",
        allowDuplicate: true,
      });

    expect(res.status).toBe(201);
    expect(mockPrisma.mealPlanItem.create).toHaveBeenCalledWith({
      data: {
        mealPlanId: 700,
        recipeId: 101,
        day_of_week: "WEDNESDAY",
        meal_type: "DINNER",
        notes: null,
      },
      include: {
        recipe: true,
      },
    });
    expect(res.body.message).toBe("Meal plan item created successfully");
    expect(res.body.mealPlanItem.day_of_week).toBe("WEDNESDAY");
  });
});

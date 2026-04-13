import { jest } from "@jest/globals";
import request from "supertest";

/**
 * Edit/Remove Meals Acceptance Test (AT)
 * User story:
 * As a logged-in user, I should be able to edit and delete a recipe from the weekly meal plan.
 *
 * This test verifies the backend endpoints used by the Meal Planner page:
 * GET /api/mealPlan/:id/items
 * PUT /api/mealPlan/items/:itemId
 * DELETE /api/mealPlan/items/:itemId
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

describe("Edit/Remove Meals AT - /api/mealPlan", () => {
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
  // Test cases:
  test("Logged-in user sees an existing meal assignment in the weekly meal plan", async () => {
    const existingMeals = [
      {
        id: 900,
        mealPlanId: 700,
        recipeId: 101,
        day_of_week: "MONDAY",
        meal_type: "DINNER",
        notes: "Prep after class",
        recipe: {
          id: 101,
          name: "Spaghetti",
          prep_time: 20,
          difficulty: "Easy",
        },
      },
    ];

    mockPrisma.mealPlan.findFirst.mockResolvedValue({
      id: 700,
      ownerId: 1,
      name: "Weekly Meal Plan",
    });
    mockPrisma.mealPlanItem.findMany.mockResolvedValue(existingMeals);

    const res = await request(app)
      .get("/api/mealPlan/700/items")
      .set("Authorization", "Bearer valid-token");

    expect(res.status).toBe(200);
    expect(mockPrisma.mealPlan.findFirst).toHaveBeenCalledWith({
      where: { id: 700, ownerId: 1 },
    });
    expect(mockPrisma.mealPlanItem.findMany).toHaveBeenCalledWith({
      where: { mealPlanId: 700 },
      include: { recipe: true },
    });
    expect(res.body).toEqual(existingMeals);
    expect(res.body[0].recipe.name).toBe("Spaghetti");
  });

  test("Logged-in user can edit an existing meal assignment", async () => {
    const updatedMeal = {
      id: 900,
      mealPlanId: 700,
      recipeId: 202,
      day_of_week: "MONDAY",
      meal_type: "DINNER",
      notes: "Updated meal",
    };

    mockPrisma.mealPlanItem.findUnique.mockResolvedValue({
      id: 900,
      mealPlanId: 700,
      recipeId: 101,
      day_of_week: "MONDAY",
      meal_type: "DINNER",
      notes: "Prep after class",
      mealPlan: {
        ownerId: 1,
      },
    });
    mockPrisma.recipes.findFirst.mockResolvedValue({
      id: 202,
      ownerId: 1,
      name: "Chicken Bowl",
    });
    mockPrisma.mealPlanItem.findMany.mockResolvedValue([]);
    mockPrisma.mealPlanItem.update.mockResolvedValue(updatedMeal);

    const res = await request(app)
      .put("/api/mealPlan/items/900")
      .set("Authorization", "Bearer valid-token")
      .send({
        recipeId: 202,
        day_of_week: "MONDAY",
        meal_type: "DINNER",
        notes: "Updated meal",
      });

    expect(res.status).toBe(200);
    expect(mockPrisma.mealPlanItem.findUnique).toHaveBeenCalledWith({
      where: { id: 900 },
      include: {
        mealPlan: {
          select: { ownerId: true },
        },
      },
    });
    expect(mockPrisma.recipes.findFirst).toHaveBeenCalledWith({
      where: {
        id: 202,
        ownerId: 1,
      },
    });
    expect(mockPrisma.mealPlanItem.update).toHaveBeenCalledWith({
      where: { id: 900 },
      data: {
        recipeId: 202,
        day_of_week: "MONDAY",
        meal_type: "DINNER",
        notes: "Updated meal",
      },
    });
    expect(res.body).toEqual(updatedMeal);
    expect(res.body.recipeId).toBe(202);
  });

  test("Logged-in user can delete a meal assignment from the weekly meal plan", async () => {
    mockPrisma.mealPlanItem.findUnique.mockResolvedValue({
      id: 900,
      mealPlanId: 700,
      recipeId: 101,
      mealPlan: {
        ownerId: 1,
      },
    });
    mockPrisma.mealPlanItem.delete.mockResolvedValue({
      id: 900,
    });

    const res = await request(app)
      .delete("/api/mealPlan/items/900")
      .set("Authorization", "Bearer valid-token");

    expect(res.status).toBe(200);
    expect(mockPrisma.mealPlanItem.findUnique).toHaveBeenCalledWith({
      where: { id: 900 },
      include: {
        mealPlan: {
          select: { ownerId: true },
        },
      },
    });
    expect(mockPrisma.mealPlanItem.delete).toHaveBeenCalledWith({
      where: { id: 900 },
    });
    expect(res.body).toEqual({ message: "Meal plan item deleted successfully" });
  });

  test("Unauthenticated user cannot edit or delete a meal assignment", async () => {
    const updateRes = await request(app)
      .put("/api/mealPlan/items/900")
      .send({
        recipeId: 202,
        day_of_week: "MONDAY",
        meal_type: "DINNER",
      });

    const deleteRes = await request(app)
      .delete("/api/mealPlan/items/900");

    expect(updateRes.status).toBe(401);
    expect(deleteRes.status).toBe(401);
    expect(updateRes.body.message).toBe("Unauthorized");
    expect(deleteRes.body.message).toBe("Unauthorized");
    expect(mockPrisma.mealPlanItem.update).not.toHaveBeenCalled();
    expect(mockPrisma.mealPlanItem.delete).not.toHaveBeenCalled();
  });
});

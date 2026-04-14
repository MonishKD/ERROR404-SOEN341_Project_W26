import { jest } from "@jest/globals";
import request from "supertest";

/**
 * Personal Features Acceptance Test (AT)
 * Covers:
 * - Commenting & rating
 * - Recipe visibility
 * - Video upload
 */

// Mock multer
jest.unstable_mockModule("multer", () => {
  const multerMock = () => ({
    single: () => (req, res, next) => {
      req.file = {
        buffer: Buffer.from("fake-video"),
        size: 10,
        mimetype: "video/mp4",
        originalname: "video.mp4",
      };
      next();
    },
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

// Prisma mock
jest.unstable_mockModule("../../src/database/prisma.js", () => ({
  prisma: mockPrisma,
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
    if (req.headers.authorization === "Bearer valid-token") {
      req.user = { userId: 1, email: "user1@test.com" };
      return next();
    }
    return res.status(401).json({ message: "Unauthorized" });
  },
  checkRecipeOwner: (req, res, next) => next(),
}));

const { default: app } = await import("../../src/server.js");

describe("Personal Features AT", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("Logged-in user can post a comment and rating", async () => {
    mockPrisma.recipes.findUnique.mockResolvedValue({
      id: 10,
      name: "Test Recipe",
    });

    mockCreateOrUpdateRecipeRating.mockResolvedValue({
      id: 1,
      recipeId: 10,
      userId: 1,
      rating: 5,
      comment: "Great!",
    });

    const res = await request(app)
      .post("/api/recipeRatings")
      .set("Authorization", "Bearer valid-token")
      .send({
        recipeId: 10,
        rating: 5,
        comment: "Great!",
      });

    expect(res.status).toBe(200);
    expect(res.body.rating).toBe(5);
    expect(res.body.comment).toBe("Great!");
  });

  test("User can change recipe visibility (private → public)", async () => {
    mockUpdateRecipe.mockResolvedValue({
      id: 10,
      is_private: false,
    });

    const res = await request(app)
      .put("/api/recipes/privacy/10")
      .set("Authorization", "Bearer valid-token")
      .send({ is_private: false });

    expect(res.status).toBe(200);
    expect(res.body.is_private).toBe(false);
  });

  test("User can create a public recipe", async () => {
    mockCreateRecipe.mockResolvedValue({
      id: 20,
      name: "Test Recipe",
      is_private: false,
    });

    const res = await request(app)
      .post("/api/recipes")
      .set("Authorization", "Bearer valid-token")
      .send({
        name: "Test Recipe",
        prep_time: 10,
        ingredients: ["a"],
        prep_steps: ["b"],
        cost: "Low",
        difficulty: "Easy",
        is_private: false,
      });

    expect(res.status).toBe(201);
  });

  test("User can upload a video to a recipe", async () => {
    mockVideoRecipe.mockResolvedValue({
      id: 1,
      recipeId: 10,
      videoType: "UPLOADED",
      title: "video.mp4",
    });

    const res = await request(app)
      .post("/api/recipes/10/video/upload")
      .set("Authorization", "Bearer valid-token")
      .attach("video", Buffer.from("fake-video"), "video.mp4");

    expect(res.status).toBe(200);
    expect(res.body.recipeId).toBe(10);
  });

  test("Unauthorized user cannot post comment", async () => {
    const res = await request(app)
      .post("/api/recipeRatings")
      .send({
        recipeId: 10,
        rating: 5,
      });

    expect(res.status).toBe(401);
  });
});